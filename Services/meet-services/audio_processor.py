import os
import time
import logging
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from google.generativeai import configure
from deepgram import DeepgramClient, PrerecordedOptions, FileSource

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('audio_processing.log')
    ]
)
logger = logging.getLogger(__name__)

def remove_non_ascii(text):
    return ''.join(i for i in text if ord(i) < 128)

def product_assistant(ascii_transcript, llm):
    logger.info("Starting product assistant processing...")
    logger.info(f"Input transcript length: {len(ascii_transcript)} characters")
    
    system_prompt = """You are an intelligent assistant specializing in meeting transcription and summarization. Your task is to process a raw transcript of a meeting and produce two outputs:

Cleaned Transcript

Remove filler words, false starts, repetitions, and irrelevant small talk.

Correct grammar and punctuation while preserving the original speaker's intent and tone.

Attribute speaker names clearly if provided.

Organize the transcript into readable paragraphs with appropriate line breaks.

Minimal Summary

Write a brief, high-level summary (3–5 bullet points) capturing the most important discussion topics, decisions made, and any next steps.

Avoid excessive detail — keep it concise and clear.

Focus on clarity, professionalism, and readability in both outputs. The cleaned transcript should be easy to scan, and the summary should serve as a quick reference for anyone who missed the meeting."""

    prompt_input = system_prompt + "\n" + ascii_transcript
    logger.info(f"Total prompt length: {len(prompt_input)} characters")
    logger.info("Invoking LLM for transcript processing...")
    
    response = llm.invoke(prompt_input)
    logger.info(f"LLM response received. Length: {len(response.content)} characters")
    
    return response.content

def process_audio(recording_id, audio_file_path="audio.mp3", api_key=None, deepgram_api_key="f97100f7e06b2a50352535151a0208acc0ec35d2", save_files=True):
    
    logger.info(f"=== STARTING AUDIO PROCESSING ===")
    logger.info(f"Recording ID: {recording_id}")
    logger.info(f"Audio file path: {audio_file_path}")
    logger.info(f"Save files: {save_files}")
    logger.info(f"Processing started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    storage_path = os.path.join("transcripts")
    os.makedirs(storage_path, exist_ok=True)
    logger.info(f"Storage path created: {storage_path}")
    
    # null checks for api
    if api_key is None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key is None:
            logger.error("Google API key not provided in arguments or environment variables")
            raise ValueError("Google API key not provided. Please provide it as an argument or set GOOGLE_API_KEY environment variable.")
    
    logger.info(f"Google API key configured: {api_key[:10]}...{api_key[-4:] if len(api_key) > 14 else '***'}")
    configure(api_key=api_key)

    logger.info("Initializing Google Gemini LLM...")
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=api_key,
        temperature=0.5,
    )
    logger.info("LLM initialized successfully")

    # Setting up template and chain
    logger.info("Setting up prompt template and processing chain...")
    template = """
    Generate meeting minutes and a list of tasks based on the provided context.

    Context:
    {context}

    Meeting Minutes:
    - Key points discussed
    - Decisions made

    Task List:
    - Actionable items with assignees and deadlines
    """

    prompt = ChatPromptTemplate.from_template(template)

    chain = (
        {"context": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    logger.info("Processing chain configured successfully")

    # Check if audio file exists
    if not os.path.exists(audio_file_path):
        logger.error(f"Audio file not found at {audio_file_path}")
        raise FileNotFoundError(f"Audio file not found at {audio_file_path}")
    
    file_size = os.path.getsize(audio_file_path) / (1024 * 1024)  # Size in MB
    logger.info(f"Audio file found: {audio_file_path}")
    logger.info(f"File size: {file_size:.2f} MB")
    
    logger.info("=== STARTING DEEPGRAM TRANSCRIPTION ===")
    logger.info("Initializing Deepgram client...")
    start_time = time.time()
    deepgram = DeepgramClient(deepgram_api_key)
    logger.info("Deepgram client initialized successfully")
    
    try:
        logger.info("Opening audio file for transcription...")
        with open(audio_file_path, 'rb') as file:
            buffer_data = file.read()

        payload: FileSource = {
            "buffer": buffer_data,
        }
        
        options = PrerecordedOptions(
            smart_format=True,
            model="nova-3",
            language="en-US"
        )
        logger.info(f"Deepgram options configured: model=nova-3, language=en-US, smart_format=True")
        
        logger.info("Sending request to Deepgram API...")
        response = deepgram.listen.rest.v('1').transcribe_file(payload, options)
        logger.info("Deepgram API request completed successfully")
        
        # Extract transcript from the response (following documentation pattern)
        # First, let's log the full response structure for debugging
        logger.info("Full response structure:")
        logger.info(response.to_json(indent=2))
        
        # Extract transcript from the response
        raw_transcript = response.results.channels[0].alternatives[0].transcript
        logger.info(f"Raw transcript extracted. Length: {len(raw_transcript)} characters")
    
    except Exception as e:
        logger.error(f"Error during Deepgram transcription: {str(e)}")
        logger.error("This could be due to network issues or API limitations.")
        logger.error("You may want to try again or check your API key.")
        raise
    
    elapsed_time = time.time() - start_time
    minutes, seconds = divmod(int(elapsed_time), 60)
    logger.info(f"=== DEEPGRAM TRANSCRIPTION COMPLETED ===")
    logger.info(f"Transcription completed in {minutes}m {seconds}s")
    
    ascii_transcript = remove_non_ascii(raw_transcript)
    logger.info(f"ASCII transcript processed. Length: {len(ascii_transcript)} characters")
    
    # Always save the raw transcript first, regardless of LLM processing
    if save_files:
        logger.info(f"=== SAVING RAW TRANSCRIPT ===")
        logger.info(f"Saving raw transcript to {storage_path}...")
        os.makedirs(storage_path, exist_ok=True)
        
        raw_transcript_path = os.path.join(storage_path, "raw_transcript.txt")
        with open(raw_transcript_path, "w") as file:
            file.write(raw_transcript)
        logger.info(f"Raw transcript saved successfully to: {raw_transcript_path}")
    
    # Try LLM processing, but don't fail if it doesn't work
    adjusted_transcript = None
    meeting_minutes_and_tasks = None
    
    logger.info("=== STARTING LLM PROCESSING ===")
    try:
        logger.info("Processing transcript with Google Gemini LLM...")
        llm_start_time = time.time()
        adjusted_transcript = product_assistant(ascii_transcript, llm)
        llm_elapsed = time.time() - llm_start_time
        logger.info(f"LLM transcript processing completed in {llm_elapsed:.2f} seconds")
        logger.info(f"Adjusted transcript length: {len(adjusted_transcript)} characters")
        
        logger.info("Generating meeting minutes and tasks...")
        chain_start_time = time.time()
        meeting_minutes_and_tasks = chain.invoke({"context": adjusted_transcript})
        chain_elapsed = time.time() - chain_start_time
        logger.info(f"Meeting minutes and tasks generated in {chain_elapsed:.2f} seconds")
        logger.info(f"Meeting minutes length: {len(meeting_minutes_and_tasks)} characters")
        
        # Save LLM processed files if successful
        if save_files:
            logger.info(f"=== SAVING LLM PROCESSED FILES ===")
            logger.info(f"Saving LLM processed files to {storage_path}...")
            
            minutes_path = os.path.join(storage_path, "meeting_minutes_and_tasks.txt")
            with open(minutes_path, "w") as file:
                file.write(meeting_minutes_and_tasks)
            logger.info(f"Meeting minutes saved to: {minutes_path}")

            adjusted_path = os.path.join(storage_path, "adjusted_transcript.txt")
            with open(adjusted_path, "w") as file:
                file.write(adjusted_transcript)
            logger.info(f"Adjusted transcript saved to: {adjusted_path}")
                
        logger.info("=== LLM PROCESSING COMPLETED SUCCESSFULLY ===")
        
    except Exception as e:
        logger.error(f"=== LLM PROCESSING FAILED ===")
        logger.error(f"LLM processing failed: {e}")
        logger.error("Continuing with raw transcript only...")
        
        # Still save the raw transcript even if LLM fails
        if save_files:
            logger.info(f"=== SAVING FALLBACK FILES ===")
            logger.info(f"Saving fallback files to {storage_path}...")
            
            # Create a simple summary from the raw transcript
            simple_summary = f"Meeting Transcript Summary:\n\n{raw_transcript}\n\nNote: LLM processing failed due to API issues. Raw transcript provided above."
            
            summary_path = os.path.join(storage_path, "meeting_summary.txt")
            with open(summary_path, "w") as file:
                file.write(simple_summary)
            logger.info(f"Fallback summary saved to: {summary_path}")

    total_elapsed = time.time() - start_time
    total_minutes, total_seconds = divmod(int(total_elapsed), 60)
    
    logger.info("=== AUDIO PROCESSING COMPLETED ===")
    logger.info(f"Total processing time: {total_minutes}m {total_seconds}s")
    logger.info(f"Files saved to: {storage_path}")
    logger.info(f"Processing completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {
        "meeting_minutes_and_tasks": meeting_minutes_and_tasks or "LLM processing failed - check raw transcript",
        "adjusted_transcript": adjusted_transcript or ascii_transcript,
        "raw_transcript": raw_transcript,
        "processing_time_seconds": total_elapsed,
        "storage_path": storage_path
    }
    
    logger.info("=== FINAL RESULTS ===")
    logger.info(f"Raw transcript length: {len(raw_transcript)} characters")
    logger.info(f"Adjusted transcript length: {len(adjusted_transcript) if adjusted_transcript else 0} characters")
    logger.info(f"Meeting minutes length: {len(meeting_minutes_and_tasks) if meeting_minutes_and_tasks else 0} characters")
    logger.info(f"LLM processing successful: {adjusted_transcript is not None}")
        
    return results
    
if __name__ == "__main__":
    recording_id = "example_123" 
    results = process_audio(recording_id, "audio.mp3")
    print(f"Results saved to {results['storage_path']}")