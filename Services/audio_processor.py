import os
import time
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from google.generativeai import configure
from deepgram import DeepgramClient, PrerecordedOptions

def remove_non_ascii(text):
    return ''.join(i for i in text if ord(i) < 128)

def product_assistant(ascii_transcript, llm):
    system_prompt = """You are an intelligent assistant specializing in meeting transcription and summarization. Your task is to process a raw transcript of a meeting and produce two outputs:

Cleaned Transcript

Remove filler words, false starts, repetitions, and irrelevant small talk.

Correct grammar and punctuation while preserving the original speaker’s intent and tone.

Attribute speaker names clearly if provided.

Organize the transcript into readable paragraphs with appropriate line breaks.

Minimal Summary

Write a brief, high-level summary (3–5 bullet points) capturing the most important discussion topics, decisions made, and any next steps.

Avoid excessive detail — keep it concise and clear.

Focus on clarity, professionalism, and readability in both outputs. The cleaned transcript should be easy to scan, and the summary should serve as a quick reference for anyone who missed the meeting."""

    prompt_input = system_prompt + "\n" + ascii_transcript
    response = llm.invoke(prompt_input)
    return response.content

def process_audio(recording_id, audio_file_path="audio.mp3", api_key=None, deepgram_api_key="3c76c3141e9ad6026a12099c225884655b411af3", save_files=True):
    
    storage_path = os.path.join("transcripts")
    os.makedirs(storage_path, exist_ok=True)
    
    # null checks for api
    if api_key is None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key is None:
            raise ValueError("Google API key not provided. Please provide it as an argument or set GOOGLE_API_KEY environment variable.")
    
    configure(api_key=api_key)

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=api_key,
        temperature=0.5,
    )

    # Setting up template and chain
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

    # Check if audio file exists
    if not os.path.exists(audio_file_path):
        raise FileNotFoundError(f"Audio file not found at {audio_file_path}")
    
    file_size = os.path.getsize(audio_file_path) / (1024 * 1024)  # Size in MB
    
    print(f"Starting Deepgram transcription. File size: {file_size:.2f} MB")
    print("Transcribing audio with Deepgram... This may take several minutes.")
    
    start_time = time.time()
    deepgram = DeepgramClient(deepgram_api_key)
    
    try:
        with open(audio_file_path, 'rb') as buffer_data:
            payload = {'buffer': buffer_data}
            
            options = PrerecordedOptions(
                smart_format=True,
                model="nova-2",
                language="en-US"
            )
            
            print("Sending request to Deepgram API...")
            response = deepgram.listen.rest.v('1').transcribe_file(payload, options)
            
            # too much long response - just need the transcript
            raw_transcript = response['results']['channels'][0]['alternatives'][0]['transcript']
    
    except Exception as e:
        print(f"Error during Deepgram transcription: {str(e)}")
        print("This could be due to network issues or API limitations.")
        print("You may want to try again or check your API key.")
        raise
    
    elapsed_time = time.time() - start_time
    minutes, seconds = divmod(int(elapsed_time), 60)
    print(f"Transcription complete in {minutes}m {seconds}s.")
    
    ascii_transcript = remove_non_ascii(raw_transcript)
    
    print("Processing transcript with LLM...")
    adjusted_transcript = product_assistant(ascii_transcript, llm)
    
    print("Generating meeting minutes and tasks...")
    meeting_minutes_and_tasks = chain.invoke({"context": adjusted_transcript})

    # Saving output to path dir
    if save_files:
        print(f"Saving output files to {storage_path}...")
        
        with open(os.path.join(storage_path, "meeting_minutes_and_tasks.txt"), "w") as file:
            file.write(meeting_minutes_and_tasks)

        with open(os.path.join(storage_path, "adjusted_transcript.txt"), "w") as file:
            file.write(adjusted_transcript)

        with open(os.path.join(storage_path, "raw_transcript.txt"), "w") as file:
            file.write(raw_transcript)

    print(f"Processing complete! Files saved to {storage_path}")
    
    results = {
        "meeting_minutes_and_tasks": meeting_minutes_and_tasks,
        "adjusted_transcript": adjusted_transcript,
        "raw_transcript": raw_transcript,
    }
        
    return results
    
if __name__ == "__main__":
    recording_id = "example_123" 
    results = process_audio(recording_id, "audio.mp3")
    print(f"Results saved to {results['storage_path']}")