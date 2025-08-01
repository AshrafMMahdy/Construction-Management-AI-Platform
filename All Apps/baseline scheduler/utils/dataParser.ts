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
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const rowObj: Record<string, any> = {};
    header.forEach((key, index) => {
      let value = values[index]?.trim() || null;
      if (value && value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1).replace(/""/g, '""');
      }
      rowObj[key] = value;
    });
    return rowObj;
  });
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
