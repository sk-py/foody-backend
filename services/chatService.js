// const { openai, pool, pgvector } = require("../utils/clients.js");
// const { generateEmbeddings } = require("./embeddingService.js"); // Reuse embedding generation
// const express = require("express");
// const { BufferMemory } = require("langchain/memory");
// const { HumanMessage, SystemMessage, AIMessage } = require("@langchain/core/messages");

// /**
//  * Retrieves relevant documents from the database based on a query embedding.
//  * @param {number[]} queryEmbedding - The embedding of the user's query.
//  * @param {number} limit - The number of top relevant documents to retrieve.
//  * @returns {Promise<Array<{content: string}>>} - A promise resolving to an array of relevant document objects.
//  */

// async function retrieveRelevantDocs(queryEmbedding, limit = 5) {
//   const client = await pool.connect();
//   try {
//     // Perform a cosine similarity search using the '<=>' operator
//     // pgvector.toSql() is crucial for formatting the embedding correctly in the query
//     const res = await client.query(
//       `SELECT content FROM documents ORDER BY embedding <=> $1 LIMIT $2`,
//       [pgvector.toSql(queryEmbedding), limit]
//     );
//     return res.rows;
//   } catch (error) {
//     console.error("Error retrieving relevant documents:", error);
//     throw error;
//   } finally {
//     client.release();
//   }
// }

// /**
//  * Generates a response using OpenAI's Chat Completion API, augmented with retrieved context.
//  * @param {string} userQuery - The original user's question.
//  * @param {Array<{content: string}>} retrievedContexts - An array of relevant document chunks.
//  * @returns {Promise<string>} - A promise resolving to the LLM's generated response in Markdown format.
//  */

// // async function generateChatResponse(userQuery, retrievedContexts) {
// //   // Construct the augmented prompt with context and source URLs
// //   let contextString = retrievedContexts
// //     .map((doc, index) => {
// //       // const source = doc.source_url ? `Source: [${doc.source_url}](${doc.source_url})` : 'No source URL available';
// //       // return `Document ${index + 1}:\n${doc.content}\n${source}\n`;
// //       return `Document ${index + 1}:\n${doc.content}\n`;
// //     })
// //     .join('\n');

// //   if (contextString) {
// //     contextString = `Relevant Information:\n${contextString}\n`;
// //   } else {
// //     contextString = "No specific relevant information found.\n\n";
// //   }

// //   const messages = [
// //     {
// //       role: "system",
// //       content: `You are a helpful and knowledgeable assistant. You are answering on the basis of Actify company, If users questions answer them based *only* on the provided 'Relevant Information' if available. If they try to make a conversation dont say you dont have any context etc just keep asking how can you help them.  If the answer is not explicitly present in the context, state that the information is not available. Do not make up answers.

// //       **Formatting Instructions**:
// //       - Use Markdown for formatting.
// //       - For lists, use bullet points ('-') or numbered lists ('1.', '2.') as appropriate.
// //       - If there is any source then, include it as a clickable Markdown link: [Source](URL). If there is not any relevant source dont give any reference.
// //       - Use headings (##, ###) for sections to improve readability.
// //       - Structure the response clearly with headings (##, ###) if needed.
// //       - Be concise but thorough, ensuring the response is user-friendly and easy to read.`,
// //     },
// //     {
// //       role: "user",
// //       content: `${contextString}User Question: ${userQuery}`
// //     },
// //   ];

// //   try {
// //     const response = await openai.chat.completions.create({
// //       model: "gpt-4o-mini",
// //       messages: messages,
// //       temperature: 0.7,
// //       max_tokens: 500,
// //       stream:true
// //     });

// //     for await (const chunk of response) {
// //       if (chunk.choices && chunk.choices.length > 0) {
// //         const responseText = chunk.choices[0]?.message;
// //         if (responseText && responseText.content) {
// //           // Process the streamed content as it arrives
// //           process.stdout.write(responseText.content); // Output to console or handle as needed
// //           console.log(responseText.content);
// //         }
// //       }
// //     }

// //     // console.log();

// //     // Access the generated content
// //     let generatedResponse = response.choices[0].message.content;

// //     // Optional: Post-process to ensure consistent formatting (e.g., trim extra spaces, normalize Markdown)
// //     generatedResponse = generatedResponse.trim();

// //     // Optional: Append sources as a reference list if not included in the response
// //     if (retrievedContexts.length > 0 && !generatedResponse.includes('Source')) {
// //       const sources = retrievedContexts
// //         .filter(doc => doc.source_url)
// //         .map((doc, index) => `${index + 1}. [Source ${index + 1}](${doc.source_url})`);
// //       if (sources.length > 0) {
// //         generatedResponse += `\n\n### References\n${sources.join('\n')}`;
// //       }
// //     }

// //     return generatedResponse;
// //   } catch (error) {
// //     console.error('Error generating chat response from OpenAI:', error);
// //     throw error;
// //   }
// // }

// async function generateChatResponse(userQuery, retrievedContexts, res) {
//   let contextString = retrievedContexts
//     .map((doc, index) => {
//       // const source = doc.source_url
//       //   ? `Source: [${doc.source_url}](${doc.source_url})`
//       //   : 'No source URL available';
//       return `Document ${index + 1}:\n${doc.content}\n`;
//     })
//     .join("\n");

//   if (contextString) {
//     contextString = `Relevant Information:\n${contextString}\n`;
//   } else {
//     contextString = "No specific relevant information found.\n\n";
//   }

//   const messages = [
//     // {
//     //   role: "system",
//     //   content: `You are an HR assistant for the Indian Navy, and your task is to assist users with queries about HR policies.

//     //   If the user asks anything outside the provided context, gently say 'I'm unable to provide an answer to this specific query' and if the user tries to deviate you from HR related queries, redirect them back to HR-related queries without being overly rigid.

//     //   Maintain a welcoming and polite tone, providing clear and accurate answers related to HR policies. Your goal is to be helpful and friendly while staying within the defined scope of HR-related matters.

//     //   **Formatting Instructions**:
//     //   - Use Markdown for formatting.
//     //   - For lists, use bullet points ('-') or numbered lists ('1.', '2.') as appropriate.
//     //   - Use headings (##, ###) for sections to improve readability.
//     //   - Be concise but thorough, ensuring the response is user-friendly and easy to read.`,
//     // },
//     {
//   role: "system",
//   content: `You are an HR assistant for the Indian Navy, specializing in HR policies, including legal and regulatory provisions related to personnel appointments, qualifications, and eligibility criteria. Your task is to assist users with queries about these policies, providing accurate, detailed, and contextually appropriate answers based on the provided context.

//   **Response Guidelines**:
//   - **Scope**: Respond only to queries related to Indian Navy HR policies, including legal provisions for roles such as Judge Advocate General, Deputy Judge Advocate General, and judge advocates. While being helpful make sure for queries outside the provided context, politely state: "I'm unable to provide an answer to this specific query as it falls outside HR policy context."
//   - **Detail and Accuracy**: Provide comprehensive answers, especially for queries involving legal qualifications or computational rules. Cite specific clauses (e.g., paragraph and subclause numbers) from the provided text and include all relevant sections, such as explanations or provisos.
//   - **Ambiguity Handling**: If a query is ambiguous or lacks critical details (e.g., timing, sequence of roles, or specific conditions), ask the user a targeted clarifying question before providing a final answer. For example, ask: "Could you clarify [specific detail, e.g., whether the judicial office was held before or after becoming an advocate]?" If multiple interpretations are possible, explain each scenario and its impact on the answer, clearly stating any assumptions.
//   - **Redirecting Off-Topic Queries**: If the user deviates from HR-related queries, gently redirect them with a context-appropriate suggestion, such as: "I’d be happy to assist with questions about Indian Navy HR policies or personnel qualifications. Could you clarify or provide an HR-related query?"
//   - **Tone**: Maintain a welcoming, polite, and professional tone, ensuring responses are user-friendly, clear, and precise, even when asking clarifying questions.

//   **Formatting Instructions**:
//   - Use Markdown for clear formatting.
//   - Structure responses with headings (##, ###) for sections like 'Eligibility Criteria,' 'Analysis,' 'Clarification Needed,' or 'Conclusion.'
//   - Use bullet points ('-') or numbered lists ('1.', '2.') for lists, as appropriate.
//   - For computational or interpretive questions, include a step-by-step explanation under a heading like 'Computation of Eligibility.'
//   - If asking a clarifying question, place it under a 'Clarification Needed' heading before proceeding with the answer, if possible.
//   - Be concise but thorough, ensuring all relevant details are covered, especially for complex legal queries.

//   **Objective**: Your goal is to provide accurate, detailed, and well-structured answers that fully address HR policy queries, particularly those involving legal or regulatory provisions. When necessary, proactively seek clarification to ensure responses are precise and relevant, enhancing user satisfaction within the defined scope.`
// },
//     {
//       role: "user",
//       content: `${contextString}User Question: ${userQuery}`,
//     },
//   ];

//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: messages,
//       temperature: 0.7,
//       max_tokens: 500,
//       stream: true,
//       stream_options: { include_usage: true },
//     });

//     let generatedResponse = "";

//     for await (const chunk of response) {
//       // console.log("chunk:", chunk); // Log the response object for debugging

//       // Check for usage information in the chunk
//       if (chunk.usage) {
//         console.log("Usage:", chunk.usage); // Log usage when available
//       }
//       if (chunk.choices && chunk.choices.length > 0) {
//         const delta = chunk.choices[0]?.delta?.content;
//         if (delta) {
//           generatedResponse += delta;
//           res.write(JSON.stringify({ type: "chunk", data: delta }) + "\n");
//         }

//         if (chunk.choices[0]?.finish_reason) {
//           console.log("Finish reason:", chunk.choices[0].finish_reason);
//           res.write(
//             JSON.stringify({
//               type: "complete",
//               data: chunk.choices[0].finish_reason,
//             }) + "\n"
//           );
//         }
//       }
//     }

//     generatedResponse = generatedResponse.trim();
//     res.end();
//     return generatedResponse;
//   } catch (error) {
//     console.error("Error generating chat response from OpenAI:", error);
//     res.write(
//       JSON.stringify({ type: "error", data: "Failed to generate response" }) +
//         "\n"
//     );
//     res.end();
//     throw error;
//   }
// }

// module.exports = { retrieveRelevantDocs, generateChatResponse };

const { openai, pool, pgvector } = require("../utils/clients.js");
const { generateEmbeddings } = require("./embeddingService.js");
const express = require("express");
const { BufferMemory } = require("langchain/memory");
const { ChatOpenAI } = require("@langchain/openai");
const {
  HumanMessage,
  SystemMessage,
  AIMessage,
} = require("@langchain/core/messages");

// Store memory instances per session
const sessionMemories = new Map();

// Configuration for memory
const MEMORY_CONFIG = {
  maxMessages: 5, // Maximum number of message pairs (k parameter)
  sessionTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
};

/**
 * Gets or creates a BufferMemory instance for a session
 * @param {string} sessionId - Unique identifier for the conversation session
 * @returns {BufferMemory} - LangChain BufferMemory instance
 */
function getSessionMemory(sessionId) {
  if (!sessionMemories.has(sessionId)) {
    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      k: MEMORY_CONFIG.maxMessages, // Keep last k messages
    });

    sessionMemories.set(sessionId, {
      memory,
      lastAccessed: Date.now(),
    });
  }

  const session = sessionMemories.get(sessionId);
  session.lastAccessed = Date.now();
  return session.memory;
}

/**
 * Clears conversation memory for a session
 * @param {string} sessionId - Unique identifier for the conversation session
 */
async function clearConversationHistory(sessionId) {
  const session = sessionMemories.get(sessionId);
  if (session) {
    await session.memory.clear();
    sessionMemories.delete(sessionId);
  }
}

/**
 * Cleanup function to remove old sessions
 */
function cleanupOldSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessionMemories.entries()) {
    if (now - session.lastAccessed > MEMORY_CONFIG.sessionTimeout) {
      sessionMemories.delete(sessionId);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldSessions, 5 * 60 * 1000);

/**
 * Retrieves relevant documents from the database based on a query embedding.
 * @param {number[]} queryEmbedding - The embedding of the user's query.
 * @param {number} limit - The number of top relevant documents to retrieve.
 * @returns {Promise<Array<{content: string}>>} - A promise resolving to an array of relevant document objects.
 */
async function retrieveRelevantDocs(queryEmbedding, limit = 5) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT content FROM documents ORDER BY embedding <=> $1 LIMIT $2`,
      [pgvector.toSql(queryEmbedding), limit]
    );
    return res.rows;
  } catch (error) {
    console.error("Error retrieving relevant documents:", error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Generates a response using OpenAI via LangChain with conversation memory
 * @param {string} userQuery - The original user's question.
 * @param {Array<{content: string}>} retrievedContexts - An array of relevant document chunks.
 * @param {Object} res - Express response object for streaming
 * @param {string} sessionId - Unique identifier for the conversation session
 * @returns {Promise<string>} - A promise resolving to the LLM's generated response in Markdown format.
 */
async function generateChatResponse(
  userQuery,
  retrievedContexts,
  res,
  sessionId
) {
  let contextString = retrievedContexts
    .map((doc, index) => {
      return `Document ${index + 1}:\n${doc.content}\n`;
    })
    .join("\n");

  if (contextString) {
    contextString = `Relevant Information:\n${contextString}\n`;
  } else {
    contextString = "No specific relevant information found.\n\n";
  }

  try {
    // Get LangChain memory for this session
    const memory = getSessionMemory(sessionId);

    // Load conversation history
    const chatHistory = await memory.loadMemoryVariables({});
    const previousMessages = chatHistory.chat_history || [];

    // console.log(previousMessages);

    // System prompt
    const systemPrompt = `Core Identity:
You are an expert assistant specializing in the official documents of the Indian Navy. Your purpose is to assist users by providing accurate, detailed, and contextually appropriate answers based exclusively on the provided source documents.

Response Guidelines:

Scope: Your knowledge is strictly limited to the provided documents. For informational queries that fall outside the provided context (e.g., "What is the weather like?"), politely state something like: "I am unable to provide an answer as that topic may not be covered in the provided documents. Please provide specific context regarding your query. Or ask a diferent question"

Handling Conversational Small Talk:

If the user provides a simple greeting, introduction, or other conversational text that is not a question (e.g., "Hello", "Thanks", "My name is Mubashir"), do not use the out-of-scope refusal message.

Respond politely and naturally to the conversational input.

After your polite response, gently guide the user back to your primary function.

Example 1: If the user says "My name is Mubashir," you should respond: "It's a pleasure to meet you, Mubashir. How can I assist you with the Indian Navy's official documents today?"

Example 2: If the user says "Thank you," you should respond: "You're welcome! Is there anything else I can help you with?"

Citing Sources (Critical Rule): You must attribute every piece of information to its source. Begin your answers by stating where the information comes from (e.g., "According to the 'Regulations for the Navy, Part I'..." or "In the 'Naval Engineering Manual,' the procedure is..."). If information comes from multiple sources, cite them all.

Handling Broad Queries and Multi-Source Context:

If a user's query is broad (e.g., "what are the authorities of an officer?") and the retrieved context comes from multiple different source documents, your first step is to seek clarification.

Example Response: "I have found information on officer authorities in several documents, including the 'Regulations for the Navy, Part I' and the 'Submarine Operations Handbook.' Could you clarify which area you are most interested in?"

If the context comes from different sections within the same document, use a similar clarification technique (e.g., "Are you asking about the Captain, the Executive Officer, or the Engineering Officer?").

Tone: Maintain a welcoming, polite, and professional tone.

Objective: Your goal is to function as a reliable expert on a library of official documents. You must provide accurate, source-cited answers, and proactively guide users with clarifying questions when needed, all while maintaining a polite, conversational manner.`;

    // Build messages array
    const messages = [
      new SystemMessage(systemPrompt),
      ...previousMessages, // Add conversation history
      new HumanMessage(`${contextString}User Question: ${userQuery}`),
    ];

    // Create ChatOpenAI model with streaming
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 500,
      streaming: true,
    });

    let generatedResponse = "";

    // Stream the response
    const stream = await model.stream(messages);

    for await (const chunk of stream) {
      const content = chunk.content;
      if (content) {
        generatedResponse += content;
        res.write(JSON.stringify({ type: "chunk", data: content }) + "\n");
      }
    }

    generatedResponse = generatedResponse.trim();

    // Save the conversation to memory
    await memory.saveContext(
      { input: userQuery },
      { output: generatedResponse }
    );

    res.write(
      JSON.stringify({
        type: "complete",
        data: "stop",
      }) + "\n"
    );

    res.end();
    return generatedResponse;
  } catch (error) {
    console.error("Error generating chat response:", error);
    res.write(
      JSON.stringify({ type: "error", data: "Failed to generate response" }) +
        "\n"
    );
    res.end();
    throw error;
  }
}

/**
 * Get conversation history for debugging/display
 * @param {string} sessionId - Unique identifier for the conversation session
 * @returns {Promise<Array>} - Array of messages
 */
async function getConversationHistory(sessionId) {
  const session = sessionMemories.get(sessionId);
  if (!session) return [];

  const chatHistory = await session.memory.loadMemoryVariables({});
  return chatHistory.chat_history || [];
}

module.exports = {
  retrieveRelevantDocs,
  generateChatResponse,
  clearConversationHistory,
  getConversationHistory,
};
