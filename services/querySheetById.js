// const { GoogleAuth } = require("google-auth-library");
// const { google } = require("googleapis");
// const fs = require("fs");

// // Path to your service account key file (use absolute path for testing)
// const serviceAccountKeyFile = "./stone-index-472518-c7-0381eec7d508.json";

// // Verify file exists
// if (!fs.existsSync(serviceAccountKeyFile)) {
//   throw new Error(`Service account key file not found at ${serviceAccountKeyFile}`);
// }

// /**
//  * Creates a Google Sheets API client
//  * @returns {Promise<sheets_v4.Sheets>} - Authenticated Google Sheets client
//  */
// async function getGoogleSheetClient() {
//   const auth = new GoogleAuth({
//     keyFile: serviceAccountKeyFile,
//     scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
//   });
//   const authClient = await auth.getClient();
//   return google.sheets({ version: "v4", auth: authClient });
// }

// /**
//  * Queries a Google Sheet to find a row where a specified column matches the target ID
//  * @param {string} spreadsheetId - The ID of the Google Spreadsheet
//  * @param {string} sheetName - The name of the sheet (e.g., 'Sheet1')
//  * @param {string} columnToSearch - The column letter to search in (e.g., 'A')
//  * @param {string} targetId - The ID to search for
//  * @param {number} [batchSize=10000] - Number of rows to fetch per batch
//  * @returns {Promise<Array<string>|null>} - The matching row or null if not found
//  */
// async function querySheetById(
//   spreadsheetId,
//   sheetName,
//   columnToSearch,
//   targetId,
//   batchSize = 10000
// ) {
//   try {
//     const googleSheetClient = await getGoogleSheetClient();

//     // Get sheet metadata to determine total rows and columns
//     const sheetMetadata = await googleSheetClient.spreadsheets.get({
//       spreadsheetId,
//       ranges: [sheetName],
//       fields: "sheets.properties.gridProperties",
//     });

//     const totalRows =
//       sheetMetadata.data.sheets[0].properties.gridProperties.rowCount || 150000;
//     const totalColumns =
//       sheetMetadata.data.sheets[0].properties.gridProperties.columnCount || 26;
//     const columnIndex = columnToSearch.toUpperCase().charCodeAt(0) - 65;

//     if (columnIndex < 0 || columnIndex >= totalColumns) {
//       throw new Error(`Invalid column "${columnToSearch}" specified.`);
//     }

//     let startRow = 2; // Adjust if headers exist
//     while (startRow <= totalRows) {
//       const endRow = Math.min(startRow + batchSize - 1, totalRows);
//       const range = `${sheetName}!${columnToSearch}${startRow}:${columnToSearch}${endRow}`;

//       const response = await googleSheetClient.spreadsheets.values.get({
//         spreadsheetId,
//         range,
//       });

//       const values = response.data.values || [];
//       if (values.length === 0) {
//         console.log(`No data found in range ${range}.`);
//         break;
//       }

//       // Search for the targetId in the batch
//       for (let i = 0; i < values.length; i++) {
//         if (values[i][0] && values[i][0].toString() === targetId.toString()) {
//           // Fetch the full row
//           const fullRowRange = `${sheetName}!A${
//             startRow + i
//           }:${String.fromCharCode(65 + totalColumns - 1)}${startRow + i}`;
//           const fullRowResponse =
//             await googleSheetClient.spreadsheets.values.get({
//               spreadsheetId,
//               range: fullRowRange,
//             });
//           return fullRowResponse.data.values[0] || null;
//         }
//       }

//       startRow += batchSize;
//     }

//     console.log(`ID "${targetId}" not found in column "${columnToSearch}".`);
//     return null;
//   } catch (error) {
//     console.error("Error querying Google Sheet:", error.message);
//     throw new Error(`Failed to query sheet: ${error.message}`);
//   }
// }


// module.exports = { querySheetById };



const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const fs = require("fs");

// Path to your service account key file (use absolute path for testing)
// const serviceAccountKeyFile = "D:\\React Exp\\foody-backend\\stone-index-472518-c7-0381eec7d508.json";

// Verify file exists
// if (!fs.existsSync(serviceAccountKeyFile)) {
//   throw new Error(`Service account key file not found at ${serviceAccountKeyFile}`);
// }
// console.log(`Service account key file found at ${serviceAccountKeyFile}`);

/**
 * Converts a column number to a Google Sheets column letter (e.g., 1 -> A, 27 -> AA)
 * @param {number} num - The column number (1-based)
 * @returns {string} - The column letter(s)
 */
function columnToLetter(num) {
  let column = "";
  while (num > 0) {
    const remainder = (num - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    num = Math.floor((num - 1) / 26);
  }
  return column;
}

/**
 * Creates a Google Sheets API client
 * @returns {Promise<sheets_v4.Sheets>} - Authenticated Google Sheets client
 */
async function getGoogleSheetClient() {
  const auth = new GoogleAuth({
    keyFile: serviceAccountKeyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: "v4", auth: authClient });
}

/**
 * Queries a Google Sheet to find a row where a specified column matches the target ID
 * @param {string} spreadsheetId - The ID of the Google Spreadsheet
 * @param {string} sheetName - The name of the sheet (e.g., 'Sheet1')
 * @param {string} columnToSearch - The column letter to search in (e.g., 'A')
 * @param {string} targetId - The ID to search for
 * @param {number} [batchSize=10000] - Number of rows to fetch per batch
 * @returns {Promise<Array<string>|null>} - The matching row or null if not found
 */
async function querySheetById(
  spreadsheetId,
  sheetName,
  columnToSearch,
  targetId,
  batchSize = 10000
) {
  try {
    const googleSheetClient = await getGoogleSheetClient();

    // Get sheet metadata to determine total rows and columns
    const sheetMetadata = await googleSheetClient.spreadsheets.get({
      spreadsheetId,
      ranges: [sheetName],
      fields: "sheets.properties.gridProperties",
    });

    const totalRows =
      sheetMetadata.data.sheets[0].properties.gridProperties.rowCount || 150000;
    const totalColumns =
      sheetMetadata.data.sheets[0].properties.gridProperties.columnCount || 26;
    const columnIndex = columnToSearch.toUpperCase().charCodeAt(0) - 65;

    if (columnIndex < 0 || columnIndex >= totalColumns) {
      throw new Error(`Invalid column "${columnToSearch}" specified.`);
    }

    let startRow = 2; // Adjust to skip header row
    console.log(`Starting search: totalRows=${totalRows}, totalColumns=${totalColumns}, columnIndex=${columnIndex}`);

    while (startRow <= totalRows) {
      const endRow = Math.min(startRow + batchSize - 1, totalRows);
      console.log(`Processing range: startRow=${startRow}, endRow=${endRow}, batchSize=${batchSize}`);

      const range = `${sheetName}!${columnToSearch}${parseInt(startRow)}:${columnToSearch}${parseInt(endRow)}`;
      console.log(`Constructed range: ${range}`);

      const response = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const values = response.data.values || [];
      if (values.length === 0) {
        console.log(`No data found in range ${range}.`);
        break;
      }

      // Search for the targetId in the batch
      for (let i = 0; i < values.length; i++) {
        if (values[i][0] && values[i][0].toString() === targetId.toString()) {
          // Fetch the full row
          const matchRow = startRow + i;
          const lastColumn = columnToLetter(totalColumns); // e.g., "AA" for 27 columns
          const fullRowRange = `${sheetName}!A${matchRow}:${lastColumn}${matchRow}`;
          console.log(`Fetching full row range: ${fullRowRange}`);
          const fullRowResponse = await googleSheetClient.spreadsheets.values.get({
            spreadsheetId,
            range: fullRowRange,
          });
          return fullRowResponse.data.values[0] || null;
        }
      }

      startRow += batchSize;
    }

    console.log(`ID "${targetId}" not found in column "${columnToSearch}".`);
    return null;
  } catch (error) {
    console.error("Error querying Google Sheet:", error.message);
    throw new Error(`Failed to query sheet: ${error.message}`);
  }
}

module.exports = { querySheetById };