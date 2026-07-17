const Papa = require('papaparse');

/**
 * Parse and validate a CSV string.
 * Returns { validRows, errors } with line-by-line validation feedback.
 *
 * @param {string} csvString - Raw CSV content
 * @param {string[]} requiredColumns - Column names that must be present
 * @param {Object} typeRules - Map of column name to expected type ('number', 'date', 'string')
 * @returns {{ validRows: Object[], errors: Object[] }}
 */
const parseCSV = (csvString, requiredColumns = [], typeRules = {}) => {
  const validRows = [];
  const errors = [];

  // Parse CSV with PapaParse
  const result = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  // Check for parse-level errors
  if (result.errors.length > 0) {
    result.errors.forEach((err) => {
      errors.push({
        row: err.row !== undefined ? err.row + 2 : 'unknown', // +2 for header + 0-index
        message: err.message,
        type: 'parse_error',
      });
    });
  }

  // Check required columns exist in header
  const headers = result.meta.fields || [];
  const missingColumns = requiredColumns.filter(
    (col) => !headers.includes(col)
  );

  if (missingColumns.length > 0) {
    errors.push({
      row: 1,
      message: `Missing required columns: ${missingColumns.join(', ')}`,
      type: 'schema_error',
    });
    return { validRows, errors };
  }

  // Validate each row
  result.data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 for header row + 0-index
    const rowErrors = [];

    // Check required fields are not empty
    requiredColumns.forEach((col) => {
      if (!row[col] || row[col] === '') {
        rowErrors.push(`Missing required field "${col}"`);
      }
    });

    // Type validation
    Object.entries(typeRules).forEach(([col, type]) => {
      if (row[col] !== undefined && row[col] !== '') {
        switch (type) {
          case 'number':
            if (isNaN(Number(row[col]))) {
              rowErrors.push(`"${col}" must be a number, got "${row[col]}"`);
            } else if (Number(row[col]) < 0) {
              rowErrors.push(`"${col}" cannot be negative`);
            }
            break;
          case 'date':
            if (isNaN(Date.parse(row[col]))) {
              rowErrors.push(
                `"${col}" must be a valid date, got "${row[col]}"`
              );
            }
            break;
        }
      }
    });

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNumber,
        message: rowErrors.join('; '),
        type: 'validation_error',
      });
    } else {
      validRows.push(row);
    }
  });

  return { validRows, errors };
};

module.exports = { parseCSV };
