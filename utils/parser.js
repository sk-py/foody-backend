const RE2 = require('node:re2');

/**
 * Parses markdown text into chunks based on header levels, with specific metadata extraction for known patterns.
 * @param {string} markdownText - The full markdown content.
 * @param {string} sourceDocumentName - The name of the source file.
 * @returns {Array<Object>} Array of chunk objects with content and metadata.
 */
function parseFlexibleMarkdown(markdownText, sourceDocumentName) {
    if (!markdownText || typeof markdownText !== 'string') {
        throw new Error('Invalid markdownText input');
    }

    const chunks = [];
    let currentContent = '';
    let currentMetadata = { source_document: sourceDocumentName };

    // Helper to save the current chunk
    const saveCurrentChunk = () => {
        if (currentContent.trim()) {
            chunks.push({
                content: currentContent.trim(),
                metadata: { ...currentMetadata }
            });
        }
        currentContent = '';
        currentMetadata = { source_document: sourceDocumentName };
    };

    // Normalize title (e.g., remove trailing "...")
    const normalizeTitle = (title) => title.replace(/\.\.\.$/, '').trim();

    // Regex patterns for header levels
    const level1Regex = new RE2('^#\\s*(.*)');
    const level2Regex = new RE2('^##\\s*(.*)');
    const level3Regex = new RE2('^###\\s*(.*)');
    const level4Regex = new RE2('^####\\s*(.*)');

    // Specific patterns for metadata extraction
    const prefaceRegex = new RE2('^(PREFACE|CONTENTS|APPENDICES|CONCORDANCES|SUBJECT|NAVAL ARMAMENT SUPPLY ORGANISATION)\\s*$');
    const chapterPattern = new RE2('CHAPTER\\s*(\\d+)\\s*(.*)');
    const sectionPattern = new RE2('SECTION\\s*(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)\\s*-\\s*(.*)');
    const regulationPattern = new RE2('(\\d{4})\\.\\s*(.*)');
    const numberTitlePattern = new RE2('^(\\d+)\\.(.*)');
    const letterTitlePattern = new RE2('^([A-Z])\\.(.*)');
    const subheaderPattern = new RE2('^\\(([a-z0-9]+)\\)\\s*(.*)'); // e.g., "(a) Abroad"

    // Table row pattern
    const tableRowRegex = new RE2('^\\|\\s*([^|]+)\\s*\\|\\s*([^|]+)\\s*\\|\\s*([^|]+)\\s*\\|$');

    const lines = markdownText.split('\n');

    for (const line of lines) {
        let match;

        // Skip malformed headers
        if (line.match(/^#+$/)) {
            console.warn(`Malformed header detected: ${line}`);
            continue;
        }

        if ((match = line.match(level1Regex))) {
            saveCurrentChunk();
            currentMetadata.level = 1;
            currentMetadata.level_1_title = normalizeTitle(match[1]);
            currentContent = line;
        } else if ((match = line.match(level2Regex))) {
            saveCurrentChunk();
            const headerText = normalizeTitle(match[1]);
            currentMetadata.level = 2;
            currentMetadata.level_2_title = headerText;
            currentMetadata.level_3_title = null;
            currentMetadata.level_4_title = null;

            // Specific metadata extraction
            if ((match = headerText.match(prefaceRegex))) {
                currentMetadata.type = match[1].toLowerCase();
            } else if ((match = headerText.match(chapterPattern))) {
                currentMetadata.chapter_number = parseInt(match[1], 10);
                currentMetadata.chapter_title = normalizeTitle(match[2]);
            } else if ((match = headerText.match(numberTitlePattern))) {
                currentMetadata.numbered_title = match[1];
                currentMetadata.title = normalizeTitle(match[2]);
            }
            currentContent = line;
        } else if ((match = line.match(level3Regex))) {
            saveCurrentChunk();
            const headerText = normalizeTitle(match[1]);
            currentMetadata.level = 3;
            currentMetadata.level_3_title = headerText;
            currentMetadata.level_4_title = null;

            // Specific metadata extraction
            if ((match = headerText.match(sectionPattern))) {
                currentMetadata.section_number = match[1];
                currentMetadata.section_title = normalizeTitle(match[2]);
            } else if ((match = headerText.match(subheaderPattern))) {
                currentMetadata.subheader_id = match[1];
                currentMetadata.subheader_title = normalizeTitle(match[2]);
            } else if ((match = headerText.match(letterTitlePattern))) {
                currentMetadata.letter_title = match[1];
                currentMetadata.title = normalizeTitle(match[2]);
            }
            currentContent = line;
        } else if ((match = line.match(level4Regex))) {
            saveCurrentChunk();
            const headerText = normalizeTitle(match[1]);
            currentMetadata.level = 4;
            currentMetadata.level_4_title = headerText;

            // Specific metadata extraction
            if ((match = headerText.match(regulationPattern))) {
                currentMetadata.regulation_number = match[1];
                currentMetadata.regulation_title = normalizeTitle(match[2]);
            }
            currentContent = line;
        } else if ((match = line.match(tableRowRegex)) && currentMetadata.type === 'contents') {
            // Parse table rows under CONTENTS or Subject
            const [_, col1, col2, col3] = match;
            chunks.push({
                content: line,
                metadata: {
                    source_document: sourceDocumentName,
                    type: 'table_entry',
                    column1: col1.trim(),
                    column2: col2.trim(),
                    column3: col3.trim()
                }
            });
        } else {
            if (currentContent) {
                currentContent += '\n' + line;
            }
        }
    }

    saveCurrentChunk();
    return chunks;
}

module.exports = { parseFlexibleMarkdown };