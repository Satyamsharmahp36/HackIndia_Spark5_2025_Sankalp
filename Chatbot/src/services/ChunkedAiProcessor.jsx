import { GoogleGenerativeAI } from "@google/generative-ai";

class ChunkedAiProcessor {
  constructor(userData, chunkSize = 500) {
    this.userData = userData;
    this.chunkSize = chunkSize;
    this.genAI = new GoogleGenerativeAI(userData.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.8,
      },
    });
  }

  /**
   * Determines if the knowledge base is large enough to require chunking
   * @param {string} knowledgeBase - The knowledge base content
   * @returns {boolean} - Whether chunking is needed
   */
  shouldUseChunking(knowledgeBase) {
    const lines = knowledgeBase.split('\n');
    return lines.length > this.chunkSize;
  }

  /**
   * Splits knowledge base into chunks
   * @param {string} knowledgeBase - The knowledge base content
   * @returns {Array<string>} - Array of chunked knowledge base sections
   */
  chunkKnowledgeBase(knowledgeBase) {
    const lines = knowledgeBase.split('\n');
    const chunks = [];
    
    for (let i = 0; i < lines.length; i += this.chunkSize) {
      const chunk = lines.slice(i, i + this.chunkSize).join('\n');
      chunks.push(chunk);
    }
    
    console.log(`Knowledge base split into ${chunks.length} chunks of ~${this.chunkSize} lines each`);
    return chunks;
  }

  /**
   * Processes a single chunk to extract relevant information
   * @param {string} chunk - The chunk to process
   * @param {string} question - The user's question
   * @param {string} context - Additional context
   * @returns {Promise<string>} - Extracted relevant information
   */
  async processChunk(chunk, question, context = "") {
    try {
      const extractionPrompt = `
You are an information extraction assistant. Your task is to analyze the provided knowledge chunk and extract ONLY the information that is relevant to the user's question.

IMPORTANT INSTRUCTIONS:
1. If you find relevant information, extract it precisely and concisely
2. If no relevant information is found in this chunk, respond with "NO_RELEVANT_INFO"
3. Do not add explanations or commentary, just the extracted facts
4. Preserve important details like IDs, numbers, dates, and specific values
5. Format your response as clear, structured information

${context ? `Additional context: ${context}\n` : ''}

User's question: "${question}"

Knowledge chunk to analyze:
${chunk}

Extracted relevant information:`;

      const result = await this.model.generateContent(extractionPrompt);
      const response = await result.response;
      const extractedInfo = response.text().trim();
      
      return extractedInfo === "NO_RELEVANT_INFO" ? null : extractedInfo;
    } catch (error) {
      console.error("Error processing chunk:", error);
      return null;
    }
  }

  /**
   * Aggregates all extracted information and generates final response
   * @param {Array<string>} extractedChunks - Array of extracted information from chunks
   * @param {string} question - The user's question
   * @param {string} userPrompt - User's response style preferences
   * @param {string} context - Additional context
   * @returns {Promise<string>} - Final aggregated response
   */
  async aggregateAndRespond(extractedChunks, question, userPrompt, context = "") {
    try {
      const relevantInfo = extractedChunks.filter(chunk => chunk !== null).join('\n\n');
      
      if (!relevantInfo) {
        return "I don't have that information. If you have answers to this, please contribute.";
      }

      const aggregationPrompt = `
You are ${this.userData.name}'s personal AI assistant. Based on the extracted relevant information from the knowledge base, provide a comprehensive answer to the user's question.

Answer in person like ${this.userData.name} is answering, not as an AI assistant.

${context ? `Context: ${context}\n` : ''}

User's question: "${question}"

Extracted relevant information from knowledge base:
${relevantInfo}

Response style preferences: ${userPrompt || 'Answer in a detailed and helpful manner'}

Provide a complete, well-structured answer based on the extracted information:`;

      const result = await this.model.generateContent(aggregationPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error aggregating response:", error);
      return "Sorry, I couldn't generate a response at this time.";
    }
  }

  /**
   * Main processing method that handles the entire chunking workflow
   * @param {string} question - The user's question
   * @param {string} knowledgeBase - The knowledge base content
   * @param {string} context - Additional context
   * @returns {Promise<string>} - Final response
   */
  async processLargeKnowledgeBase(question, knowledgeBase, context = "") {
    try {
      console.log("Starting chunked processing for large knowledge base...");
      
      // Step 1: Split knowledge base into chunks
      const chunks = this.chunkKnowledgeBase(knowledgeBase);
      
      // Step 2: Process each chunk to extract relevant information
      const extractedChunks = [];
      const processingPromises = chunks.map(async (chunk, index) => {
        console.log(`Processing chunk ${index + 1}/${chunks.length}...`);
        return await this.processChunk(chunk, question, context);
      });
      
      // Wait for all chunks to be processed
      const results = await Promise.all(processingPromises);
      extractedChunks.push(...results);
      
      console.log(`Extracted relevant information from ${extractedChunks.filter(chunk => chunk !== null).length} chunks`);
      
      // Step 3: Aggregate extracted information and generate final response
      const finalResponse = await this.aggregateAndRespond(
        extractedChunks, 
        question, 
        this.userData.userPrompt, 
        context
      );
      
      console.log("Chunked processing completed successfully");
      return finalResponse;
      
    } catch (error) {
      console.error("Error in chunked processing:", error);
      return "Sorry, I encountered an error while processing your request.";
    }
  }
}

export default ChunkedAiProcessor;