
import { Clause, ContractContent, ImageContractPage } from '../types';

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

const extractClausesFromText = (rawText: string): string[] => {
    const paragraphs = rawText.split(/\n\s*\n/).map(p => p.trim().replace(/\s+/g, ' ')).filter(p => p.length > 0);

    return paragraphs.filter(p => {
        const wordCount = p.split(/\s+/).length;

        // Rule 1: Exclude very short lines, which are likely titles or artifacts.
        if (wordCount < 8) {
            return false;
        }

        // Rule 2: Exclude lines that look like document headings (e.g., "Article 1", "Section A.")
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
};


export const parseContractFile = async (file: File): Promise<ContractContent> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                if (!arrayBuffer) {
                    return reject(new Error("File reading failed."));
                }

                if (file.name.endsWith('.docx')) {
                    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                    const clauses = extractClausesFromText(result.value);
                    return resolve({ type: 'text', clauses });
                } 
                
                if (file.name.endsWith('.pdf')) {
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        if (textContent.items.length > 0) {
                            fullText += textContent.items.map((s: any) => s.str).join(' ');
                        }
                    }

                    // Heuristic: If total text is very short, assume it's a scanned PDF.
                    if (fullText.trim().length < 100 * pdf.numPages) {
                        const pages: ImageContractPage[] = [];
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            // Use a good scale for better OCR quality
                            const viewport = page.getViewport({ scale: 1.5 }); 
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;

                            if (!context) {
                                return reject(new Error('Could not get canvas context to render PDF page.'));
                            }

                            await page.render({ canvasContext: context, viewport: viewport }).promise;
                            const dataUrl = canvas.toDataURL('image/jpeg');
                            pages.push({
                                pageNumber: i,
                                dataUrl: dataUrl,
                                mimeType: 'image/jpeg',
                            });
                        }
                        return resolve({ type: 'image', pages });
                    } else {
                        const clauses = extractClausesFromText(fullText);
                        return resolve({ type: 'text', clauses });
                    }
                } 
                
                return reject(new Error("Unsupported contract file format. Please use .pdf or .docx"));

            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
