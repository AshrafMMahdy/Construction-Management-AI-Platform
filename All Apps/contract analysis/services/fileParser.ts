
import { Clause } from '../types';

// These are globals provided by the scripts in index.html
declare const pdfjsLib: any;
declare const mammoth: any;
declare const XLSX: any;

export const parseDatabaseFile = async (file: File): Promise<Clause[]> => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
            reject(new Error("File reading failed."));
            return;
        }

        if (file.name.endsWith('.json')) {
          resolve(JSON.parse(data as string));
        } else if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json: Clause[] = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } else {
          reject(new Error("Unsupported database file format. Please use .xlsx, .csv, or .json"));
        }
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (error) => reject(error);
    
    if (file.name.endsWith('.json')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
  });
};


export const parseContractFile = async (file: File): Promise<string[]> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                if (!arrayBuffer) {
                    reject(new Error("File reading failed."));
                    return;
                }

                let rawText = '';
                if (file.name.endsWith('.pdf')) {
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let textContent = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const text = await page.getTextContent();
                        textContent += text.items.map((s: any) => s.str).join(' ');
                    }
                    rawText = textContent;
                } else if (file.name.endsWith('.docx')) {
                    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                    rawText = result.value;
                } else {
                    reject(new Error("Unsupported contract file format. Please use .pdf or .docx"));
                }
                
                const paragraphs = rawText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);

                const clauses = paragraphs.filter(p => {
                    const wordCount = p.split(/\s+/).length;

                    // Rule 1: Exclude very short lines, which are likely titles or artifacts.
                    if (wordCount < 8) {
                        return false;
                    }

                    // Rule 2: Exclude lines that look like document headings (e.g., "Article 1", "Section A.")
                    // This looks for a keyword, then numbers/letters, and little else.
                    if (wordCount < 6 && /^\s*(article|section|exhibit|part|clause|appendix|schedule)\s+([A-Z0-9\.]+|[IVXLCDM]+)\s*$/i.test(p.replace(/[:\.]?$/, ''))) {
                        return false;
                    }

                    // Rule 3: Exclude lines that are all uppercase (likely headings)
                    if (p === p.toUpperCase() && wordCount < 10) {
                        return false;
                    }

                    // Rule 4: Exclude common preamble/signature phrases
                    const lowerP = p.toLowerCase();
                    const excludedStarters = [
                        'this agreement', 'this contract', 'entered into on', 'by and between', 
                        'in witness whereof', 'the parties hereto have executed'
                    ];
                    if (excludedStarters.some(starter => lowerP.startsWith(starter))) {
                        return false;
                    }
                    
                    // Rule 5: Exclude signature lines
                    if (/^\s*(by:|name:|title:|date:)/i.test(p)) {
                        return false;
                    }

                    return true; // Survived the filter, likely a real clause
                });

                resolve(clauses);

            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
