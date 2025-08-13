
import { ProjectFeatures } from '../types';

const FEATURE_COLUMNS = [
  'Project Location',
  'Project Type',
  'Season',
  'Contract Value',
  'Soil Type',
  'Floor Built Up Area (BUA)',
  'Number of Floors',
];

const normalizeKey = (key: string): string => 
    key.trim().toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');

const parseCsv = (csvText: string): Record<string, any>[] => {
  const rows: Record<string, any>[] = [];
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // This regex handles commas inside quotes and escaped quotes ("").
  const csvRegex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
  
  const parseLine = (line: string): string[] => {
      const values: string[] = [];
      let match;
      // We need to reset the regex state for each line
      csvRegex.lastIndex = 0;
      while (match = csvRegex.exec(line)) {
          // If the first capture group is matched, it's a quoted value.
          // We need to un-escape the double quotes.
          if (match[1] !== undefined) {
              values.push(match[1].replace(/""/g, '"'));
          } else {
              // Otherwise, it's an unquoted value.
              values.push(match[2] !== undefined ? match[2] : '');
          }
      }
      return values;
  }
  
  const header = parseLine(lines[0]).map(h => h.trim());
  let currentLineBuffer = '';
  
  for (let i = 1; i < lines.length; i++) {
      currentLineBuffer += (currentLineBuffer ? '\n' : '') + lines[i];
      const quoteCount = (currentLineBuffer.match(/"/g) || []).length;

      // If quote count is odd, it's a multiline field. Continue to append next line.
      if (quoteCount % 2 === 1 && i < lines.length - 1) {
          continue;
      }
      
      const values = parseLine(currentLineBuffer);
      currentLineBuffer = ''; // Reset buffer after processing

      if (values.length === header.length) {
          const rowObj: Record<string, any> = {};
          header.forEach((key, index) => {
              rowObj[key] = values[index] ? values[index].trim() : null;
          });
          rows.push(rowObj);
      } else if (values.length > 0 && values.some(v => v.trim() !== '')) {
           // Only warn if the row is not effectively empty
           console.warn(`CSV parsing warning: Row ${i + 1} has ${values.length} columns, but header has ${header.length}. Skipping row.`);
      }
  }

  return rows;
};

const extractFeaturesFromData = (data: Record<string, any>[]): ProjectFeatures => {
    if (!data || data.length === 0) {
      return {};
    }

    const features: ProjectFeatures = {};
    const dataKeys = Object.keys(data[0]);
    
    const normalizedDataKeyMap = new Map<string, string>();
    dataKeys.forEach(key => normalizedDataKeyMap.set(normalizeKey(key), key));
    
    FEATURE_COLUMNS.forEach(prettyColName => {
      const normColName = normalizeKey(prettyColName);
      if (normalizedDataKeyMap.has(normColName)) {
          const originalHeader = normalizedDataKeyMap.get(normColName)!;
          const uniqueValues = new Set<string>();
          data.forEach(row => {
            const value = row[originalHeader];
            if (value !== null && value !== undefined && String(value).trim() !== '') {
              uniqueValues.add(String(value).trim());
            }
          });

          if (uniqueValues.size > 0) {
            features[prettyColName] = Array.from(uniqueValues).sort();
          }
      }
    });

    return features;
};

export const parseDataAndExtractFeatures = (
  fileContent: string,
  fileName: string
): { data: Record<string, any>[]; features: ProjectFeatures } => {
  let data: Record<string, any>[] = [];

  if (fileName.endsWith('.csv')) {
    data = parseCsv(fileContent);
  } else if (fileName.endsWith('.json')) {
    data = JSON.parse(fileContent);
    if (!Array.isArray(data)) {
      throw new Error("JSON file is not an array of objects.");
    }
  } else {
    throw new Error("Unsupported file type.");
  }
  
  const features = extractFeaturesFromData(data);
  return { data, features };
};
