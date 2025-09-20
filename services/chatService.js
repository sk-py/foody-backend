const { openai, pool, pgvector } = require("../utils/clients.js");
const { generateEmbeddings } = require("./embeddingService.js"); // Reuse embedding generation
const express = require("express");

/**
 * Retrieves relevant documents from the database based on a query embedding.
 * @param {number[]} queryEmbedding - The embedding of the user's query.
 * @param {number} limit - The number of top relevant documents to retrieve.
 * @returns {Promise<Array<{content: string}>>} - A promise resolving to an array of relevant document objects.
 */

async function retrieveRelevantDocs(queryEmbedding, limit = 5) {
  const client = await pool.connect();
  try {
    // Perform a cosine similarity search using the '<=>' operator
    // pgvector.toSql() is crucial for formatting the embedding correctly in the query
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
 * Generates a response using OpenAI's Chat Completion API, augmented with retrieved context.
 * @param {string} userQuery - The original user's question.
 * @param {Array<{content: string}>} retrievedContexts - An array of relevant document chunks.
 * @returns {Promise<string>} - A promise resolving to the LLM's generated response in Markdown format.
 */

// async function generateChatResponse(userQuery, retrievedContexts) {
//   // Construct the augmented prompt with context and source URLs
//   let contextString = retrievedContexts
//     .map((doc, index) => {
//       // const source = doc.source_url ? `Source: [${doc.source_url}](${doc.source_url})` : 'No source URL available';
//       // return `Document ${index + 1}:\n${doc.content}\n${source}\n`;
//       return `Document ${index + 1}:\n${doc.content}\n`;
//     })
//     .join('\n');

//   if (contextString) {
//     contextString = `Relevant Information:\n${contextString}\n`;
//   } else {
//     contextString = "No specific relevant information found.\n\n";
//   }

//   const messages = [
//     {
//       role: "system",
//       content: `You are a helpful and knowledgeable assistant. You are answering on the basis of Actify company, If users questions answer them based *only* on the provided 'Relevant Information' if available. If they try to make a conversation dont say you dont have any context etc just keep asking how can you help them.  If the answer is not explicitly present in the context, state that the information is not available. Do not make up answers.

//       **Formatting Instructions**:
//       - Use Markdown for formatting.
//       - For lists, use bullet points ('-') or numbered lists ('1.', '2.') as appropriate.
//       - If there is any source then, include it as a clickable Markdown link: [Source](URL). If there is not any relevant source dont give any reference.
//       - Use headings (##, ###) for sections to improve readability.
//       - Structure the response clearly with headings (##, ###) if needed.
//       - Be concise but thorough, ensuring the response is user-friendly and easy to read.`,
//     },
//     {
//       role: "user",
//       content: `${contextString}User Question: ${userQuery}`
//     },
//   ];

//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: messages,
//       temperature: 0.7,
//       max_tokens: 500,
//       stream:true
//     });

//     for await (const chunk of response) {
//       if (chunk.choices && chunk.choices.length > 0) {
//         const responseText = chunk.choices[0]?.message;
//         if (responseText && responseText.content) {
//           // Process the streamed content as it arrives
//           process.stdout.write(responseText.content); // Output to console or handle as needed
//           console.log(responseText.content);
//         }
//       }
//     }

//     // console.log();

//     // Access the generated content
//     let generatedResponse = response.choices[0].message.content;

//     // Optional: Post-process to ensure consistent formatting (e.g., trim extra spaces, normalize Markdown)
//     generatedResponse = generatedResponse.trim();

//     // Optional: Append sources as a reference list if not included in the response
//     if (retrievedContexts.length > 0 && !generatedResponse.includes('Source')) {
//       const sources = retrievedContexts
//         .filter(doc => doc.source_url)
//         .map((doc, index) => `${index + 1}. [Source ${index + 1}](${doc.source_url})`);
//       if (sources.length > 0) {
//         generatedResponse += `\n\n### References\n${sources.join('\n')}`;
//       }
//     }

//     return generatedResponse;
//   } catch (error) {
//     console.error('Error generating chat response from OpenAI:', error);
//     throw error;
//   }
// }

async function generateChatResponse(userQuery, retrievedContexts, res) {
  let contextString = retrievedContexts
    .map((doc, index) => {
      // const source = doc.source_url
      //   ? `Source: [${doc.source_url}](${doc.source_url})`
      //   : 'No source URL available';
      return `Document ${index + 1}:\n${doc.content}\n`;
    })
    .join("\n");

  if (contextString) {
    contextString = `Relevant Information:\n${contextString}\n`;
  } else {
    contextString = "No specific relevant information found.\n\n";
  }

  const messages = [
    {
      role: "system",
      content: `You are an HR assistant for the Indian Navy, and your task is to assist users with queries about HR policies. 

      If the user asks anything outside the provided context, gently say 'I'm unable to provide an answer to this specific query' and if the user tries to deviate you from HR related queries, redirect them back to HR-related queries without being overly rigid.

      Maintain a welcoming and polite tone, providing clear and accurate answers related to HR policies. Your goal is to be helpful and friendly while staying within the defined scope of HR-related matters.


      **Formatting Instructions**:
      - Use Markdown for formatting.
      - For lists, use bullet points ('-') or numbered lists ('1.', '2.') as appropriate.
      - Use headings (##, ###) for sections to improve readability.
      - Be concise but thorough, ensuring the response is user-friendly and easy to read.`,
    },
    {
      role: "user",
      content: `${contextString}User Question: ${userQuery}`,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
      stream_options: { include_usage: true },
    });

    let generatedResponse = "";

    for await (const chunk of response) {
      // console.log("chunk:", chunk); // Log the response object for debugging

      // Check for usage information in the chunk
      if (chunk.usage) {
        console.log("Usage:", chunk.usage); // Log usage when available
      }
      if (chunk.choices && chunk.choices.length > 0) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          generatedResponse += delta;
          res.write(JSON.stringify({ type: "chunk", data: delta }) + "\n");
        }

        if (chunk.choices[0]?.finish_reason) {
          console.log("Finish reason:", chunk.choices[0].finish_reason);
          res.write(
            JSON.stringify({
              type: "complete",
              data: chunk.choices[0].finish_reason,
            }) + "\n"
          );
        }
      }
    }

    generatedResponse = generatedResponse.trim();
    res.end();
    return generatedResponse;
  } catch (error) {
    console.error("Error generating chat response from OpenAI:", error);
    res.write(
      JSON.stringify({ type: "error", data: "Failed to generate response" }) +
        "\n"
    );
    res.end();
    throw error;
  }
}

module.exports = { retrieveRelevantDocs, generateChatResponse };
