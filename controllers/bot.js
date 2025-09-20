const {
  retrieveRelevantDocs,
  generateChatResponse,
} = require("../services/chatService.js");
const {
  ingestDocument,
  generateEmbeddings,
} = require("../services/embeddingService");
const { openai, pool } = require("../utils/clients.js");

const axios = require('axios')

const { DynamicTool } = require("@langchain/core/tools");

const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { querySheetById } = require("../services/querySheetById.js");
dotenv.config();

async function handleLogin(req, res) {
  const { username, password } = req.body;
}

const spreadsheetId = "1fzvw9OxBNtrqcaV4mG2z9riEf4pxREki261cMQ727oQ";
const sheetName = "Sheet1";
const columnToSearch = "A";

const fetchRowFromGoogleSheets = new DynamicTool({
  name: "getDataFromSheet",
  description: "Retrives user metrics from Google Sheets based on user ID.",
  func: async (userId) => {
    try {
      const row = await querySheetById(
        spreadsheetId,
        sheetName,
        columnToSearch,
        userId
      );
      if (row) {
        return JSON.stringify(row); // Return row as JSON string
      } else {
        return JSON.stringify({
          error: `User ID "${userId}" not found in Google Sheet.`,
        });
      }
    } catch (error) {
      console.error("Error in fetchRowFromGoogleSheets:", error.message);
      return JSON.stringify({
        error: "Failed to fetch data from Google Sheet.",
      });
    }
  },
});

/**
 * Express controller function to handle document ingestion requests.
 * Expects { text: string, sourceUrl?: string } in the request body.
 */

async function handleIngestData(req, res) {
  const { text, sourceUrl } = req.body;

  if (!text) {
    return res
      .status(400)
      .json({ error: "Text content is required for ingestion." });
  }

  try {
    await ingestDocument(text, sourceUrl);
    res.status(200).json({ message: "Document ingested successfully." });
  } catch (error) {
    console.error("Error during document ingestion API call:", error);
    res
      .status(500)
      .json({ error: "Failed to ingest document. Please check server logs." });
  }
}

/**
 * Express controller function to handle user chat queries.
 * Expects { query: string } in the request body.
 */
async function handleChatQuery(req, res) {
  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Transfer-Encoding", "chunked");

  const { query } = req.body;

  if (!query) {
    res.write(
      JSON.stringify({ type: "error", data: "Query is required" }) + "\n"
    );
    res.end();
    return;
  }

  try {
    // 1. Generate embedding for the user's query
    const queryEmbedding = await generateEmbeddings(query);

    // 2. Retrieve relevant context from pgvector
    const relevantDocs = await retrieveRelevantDocs(queryEmbedding, 5); // Retrieve top 5 docs

    // 3. Generate response using the LLM, augmented with context and stream it back to client
    await generateChatResponse(query, relevantDocs, res);
  } catch (error) {
    console.error("Error during chat query API call:", error);
    res.write(
      JSON.stringify({ type: "error", data: "Failed to process query" }) + "\n"
    );
    res.end();
  }
}

// async function handlePredictionQuery(req, res) {
//   res.setHeader("Content-Type", "application/x-ndjson");
//   res.setHeader("Transfer-Encoding", "chunked");

//   const { query } = req.body;

//   if (!query) {
//     res.write(
//       JSON.stringify({ type: "error", data: "Query is required" }) + "\n"
//     );
//     res.end();
//   }

//   try {
//     const row = await querySheetById(
//       spreadsheetId,
//       sheetName,
//       columnToSearch,
//       query
//     );

//     if (row) {
//       const data = JSON.stringify(row);
//       return res.status(200).json({ data });
//     } else {
//       return JSON.stringify({
//         error: `User ID "${userId}" not found in Google Sheet.`,
//       });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// }

// User Authentication for chatbot queries

// Text to SQL schema mapping for dynamic queries


async function handlePredictionQuery(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Transfer-Encoding", "chunked");

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ type: "error", data: "Query is required" });
  }

  try {
    const row = await querySheetById(
      spreadsheetId,
      sheetName,
      columnToSearch,
      query
    );

    if (row) {
      // Destructure the array to match the desired fields
      const [
        , // Skip the first element (e.g., "5", possibly an ID)
        satisfaction_level,
        last_evaluation,
        number_project,
        average_montly_hours,
        time_spend_company,
        work_accident,
        promotion_last_5years,
        , // Skip the 'left' field (e.g., "1")
        department,
        salary,
      ] = row;

      // Construct the formatted data for the /predict API
      const formattedData = {
        satisfaction_level: parseFloat(satisfaction_level),
        last_evaluation: parseFloat(last_evaluation),
        number_project: parseInt(number_project),
        average_montly_hours: parseInt(average_montly_hours),
        time_spend_company: parseInt(time_spend_company),
        work_accident: parseInt(work_accident),
        promotion_last_5years: parseInt(promotion_last_5years),
        department,
        salary,
      };

      // Make POST request to the /predict endpoint
      try {
        const response = await axios.post('http://127.0.0.1:8000/predict', formattedData);
        const predictionData = response.data; // Expected: { "prediction": "Yes", "probability_of_leaving": 0.8026 }

        // Return the prediction response to the client
        return res.status(200).json({ data: predictionData });
      } catch (apiError) {
        console.error('Error calling /predict API:', apiError.message);
        return res.status(500).json({ error: 'Failed to get prediction from /predict endpoint' });
      }
    } else {
      return res.status(404).json({
        error: `User ID "${query}" not found in Google Sheet.`,
      });
    }
  } catch (error) {
    console.error('Error querying Google Sheet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

const SCHEMA = {
  leave_manage: [
    "currentdate",
    "currenttime",
    "date_from",
    "date_to",
    "leave_type",
    "n_days",
    "reason",
    "type",
    "carried_forward_leave",
    "employee_id",
  ],
  leave_balance: ["employee_id", "current_year_count"],
  crm_customers: ["customer_id", "name", "email", "status", "created_at"],
  job_applications: [
    "applicant_id",
    "job_title",
    "status",
    "applied_date",
    "feedback",
  ],
};

// Helper to strip markdown code blocks from JSON string
function stripMarkdown(jsonString) {
  // Remove ```json\n and \n``` or similar code block markers
  return jsonString.replace(/```json\n?|\n?```/g, "").trim();
}

function isValidTable(table) {
  return Object.hasOwn(SCHEMA, table);
}

function isValidColumn(table, col) {
  return isValidTable(table) && SCHEMA[table].includes(col);
}

// Enhanced isSafeFilter to block more dangerous patterns
function isSafeFilter(filter) {
  return (
    /^[a-zA-Z0-9_=\s'<>ANDOR\-\(\)\/\*\.]+$/i.test(filter) &&
    !/;|--|drop|insert|delete|update|order\s+by|limit/i.test(filter)
  );
}

// Helper to parse filters into parameterized conditions
function parseFilters(filters, table, valuesStartIndex) {
  if (!filters || !filters.trim()) return { sql: "", values: [] };
  if (!isSafeFilter(filters)) throw new Error("Unsafe filter detected");

  const conditions = filters.split(/\s+AND\s+/i);
  const values = [];
  let sql = "";
  let paramIndex = valuesStartIndex;

  for (const condition of conditions) {
    const match = condition.match(
      /^([a-zA-Z0-9_]+)\s*(=|>|<|>=|<=)\s*('[^']*'|[0-9]+)$/
    );
    if (!match) throw new Error("Invalid filter format");
    const [, column, operator, value] = match;

    if (!isValidColumn(table, column))
      throw new Error(`Invalid column: ${column}`);
    if (!["=", ">", "<", ">=", "<="].includes(operator))
      throw new Error(`Invalid operator: ${operator}`);

    sql += `${column} ${operator} $${paramIndex} AND `;
    values.push(value.startsWith("'") ? value.slice(1, -1) : parseInt(value));
    paramIndex++;
  }

  if (sql) {
    sql = sql.replace(/ AND $/, ""); // Remove trailing AND
  }

  return { sql, values };
}

function isAggregationQuery(query) {
  const lowerQuery = query.toLowerCase();
  return lowerQuery.includes("how many") || lowerQuery.includes("total");
}

async function handleDynamicQuery(req, res) {
  const { query } = req.body;
  const userId = 47; // Will be replaced by auth-based user ID
  const companyId = 47; // Will be replaced by auth-based Company ID

  if (!query) {
    return res.status(400).json({ error: "Query is required." });
  }

  try {
    const schemaStr = Object.entries(SCHEMA)
      .map(([table, cols]) => `${table}: ${cols.join(", ")}`)
      .join("\n");

    // Debug schemaStr
    console.log("schemaStr:", schemaStr);

    const systemPrompt = `
You are an AI that maps user queries to structured database access.
Only use tables and columns from this schema:

${schemaStr}

Given a user question, respond with a plain JSON object (no markdown, no code blocks, no \`\`\`json wrappers) in the following format:
{
  "table": "<table_name>",
  "fields": ["col1", "col2" | "COUNT(*)" | "SUM(col1)"],
  "filters": "<where_conditions>",
  "order_by": "<column_name>",
  "limit": <number>
}

- "fields" MUST be an array of strings, even for a single field (e.g., ["SUM(n_days)"], NOT "SUM(n_days)").
- For queries like "how many leaves" or "total leaves," use ["SUM(n_days)"] for total leave days in leave_manage, or ["COUNT(*)"] for number of leave requests if specified.
- For queries about remaining leaves or balance (e.g., "how many leaves do I have left", "leave balance"), use leave_balance with ["current_year_count"], "limit": 1, and no aggregation.
- For queries like "when did I apply for my last leave," use leave_manage with ["currentdate"], "order_by": "currentdate", "limit": 1.
- "filters" should contain WHERE conditions excluding employee_id (e.g., "leave_type = 'sick'"). Do NOT include employee_id filters.
- "order_by" must be a single column name (e.g., "currentdate"), NOT including "ASC" or "DESC". Set to null for aggregate queries unless sorting is requested.
- "limit" should be 1 for aggregate queries (e.g., SUM or COUNT) or null for non-aggregate queries, unless specified.
- Never include "ORDER BY" or "LIMIT" in the "filters" field.
- Never make up tables or columns. Only use allowed ones.
- If no filters or order_by are needed, set to null.
- Do NOT use placeholders like '<your_employee_id>'.
- Output only the JSON object, without any markdown, code blocks, or additional text.
`;

    const extraction = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
    });

    console.log("Extraction response:", extraction.choices[0].message);

    // Strip markdown and parse JSON
    const rawContent = extraction.choices[0].message.content;
    const cleanedContent = stripMarkdown(rawContent);
    let parsed;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error(
        "JSON parse error:",
        parseError,
        "Raw content:",
        rawContent
      );
      return res
        .status(500)
        .json({ error: "Invalid response format from AI model." });
    }
    console.log("Parsed:", parsed);

    let { table, fields, filters, order_by, limit } = parsed;

    // Safeguard: Ensure fields is an array
    if (typeof fields === "string") {
      console.warn("Fields is a string, converting to array:", fields);
      fields = [fields];
    } else if (!Array.isArray(fields)) {
      console.error("Fields is not an array:", fields);
      return res
        .status(400)
        .json({ error: "Invalid fields format in response." });
    }

    // Default to empty array if fields is undefined
    fields = fields || [];

    // Debug fields
    console.log("Fields after normalization:", fields);

    // Validation
    if (!isValidTable(table)) {
      return res
        .status(400)
        .json({ error: "Invalid or unauthorized table requested." });
    }

    // Force aggregation for "how many" queries if not provided
    const needsAggregation =
      isAggregationQuery(query) && table === "leave_manage";
    if (
      needsAggregation &&
      !fields.some((f) => f.match(/^(COUNT\(\*\)|SUM\("[a-zA-Z0-9_]+"\))$/))
    ) {
      fields = ['SUM("n_days")'];
      limit = 1;
      order_by = null;
    }

    // Validate fields, allowing aggregates like COUNT(*) or SUM(col)
    const validFields = fields.filter((field) => {
      if (field.match(/^(COUNT\(\*\)|SUM\("[a-zA-Z0-9_]+"\))$/)) return true;
      return isValidColumn(table, field);
    });
    if (!validFields.length) {
      return res
        .status(400)
        .json({ error: "No valid columns or aggregates selected." });
    }

    // Construct SQL with potential aliases for aggregates
    const selectFields = validFields.map((field) => {
      if (field.match(/^(COUNT\(\*\)|SUM\("[a-zA-Z0-9_]+"\))$/)) {
        return `${field} AS result`;
      }
      return `"${field}"`;
    });
    let sql = `SELECT ${selectFields.join(", ")} FROM "${table}"`;
    const values = [];

    const hasEmployeeColumn = SCHEMA[table].includes("employee_id");
    if (hasEmployeeColumn) {
      sql += ` WHERE "employee_id" = $1`;
      values.push(userId);
    }

    // Parse and append additional filters
    const { sql: filterSql, values: filterValues } = parseFilters(
      filters,
      table,
      values.length + 1
    );
    if (filterSql) {
      sql += hasEmployeeColumn ? ` AND ${filterSql}` : ` WHERE ${filterSql}`;
      values.push(...filterValues);
    }

    if (order_by && isValidColumn(table, order_by)) {
      sql += ` ORDER BY "${order_by}" DESC`;
    }

    if (limit && Number.isInteger(Number(limit)) && limit > 0) {
      sql += ` LIMIT ${limit}`;
    }

    console.log("Generated SQL:", sql, "Values:", values);

    const result = await pool.query(sql, values);
    if (
      !result.rows.length ||
      (needsAggregation && result.rows[0].result === null)
    ) {
      return res.json({ answer: "No leave records found for your query." });
    }

    console.log("Query result:", result);

    // Handle aggregated or non-aggregated results
    const isAggregate = validFields.some((field) =>
      field.match(/^(COUNT\(\*\)|SUM\("[a-zA-Z0-9_]+"\))$/)
    );
    let resultValue;
    if (isAggregate) {
      resultValue = { result: result.rows[0].result };
    } else if (needsAggregation && table === "leave_manage") {
      const totalDays = result.rows.reduce(
        (sum, row) => sum + (row.n_days || 0),
        0
      );
      resultValue = { result: totalDays };
    } else {
      resultValue = result.rows[0];
    }

    // Explain result in friendly terms
    const explainPrompt = `
You are a helpful company chatbot.

User asked: "${query}"
This is the result from the database: ${JSON.stringify(resultValue)}

Explain this to the user in simple, friendly language. For aggregated results (e.g., { result: 5 }), interpret the value as total leave days or number of leaves. For non-aggregated results (e.g., { currentdate: "2025-06-01" }), describe the single record clearly, formatting dates in a readable format (e.g., "June 1, 2025").
`;

    const explanation = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [{ role: "system", content: explainPrompt }],
    });

    const response = explanation.choices[0].message.content.trim();
    res.json({ answer: response });
  } catch (error) {
    console.error("Error:", error);
    if (error.code === "22P02") {
      return res.status(400).json({ error: "Invalid filter value provided." });
    }
    if (error.code === "42P01") {
      return res
        .status(400)
        .json({ error: `Table "${table}" does not exist in the database.` });
    }
    res.status(500).json({
      error: error.message || "Something went wrong processing your query.",
    });
  }
}

module.exports = {
  handleIngestData,
  handleChatQuery,
  handleDynamicQuery,
  handleLogin,
  handlePredictionQuery,
};
