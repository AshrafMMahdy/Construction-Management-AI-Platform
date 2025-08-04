import { ReportData } from '../types';

const generateReportHtml = (data: ReportData): string => {
  const styles = `
    <style>
      body { font-family: 'Calibri', sans-serif; font-size: 11pt; color: #333; margin: 40px; }
      h1 { font-size: 20pt; color: #2E74B5; font-weight: bold; }
      h2 { font-size: 14pt; color: #365F91; border-bottom: 1px solid #BFBFBF; padding-bottom: 4px; margin-top: 24px; }
      h3 { font-size: 12pt; color: #44546A; margin-top: 18px; }
      p { line-height: 1.5; }
      table { border-collapse: collapse; width: 100%; margin-top: 12px; font-size: 9pt; }
      th, td { border: 1px solid #BFBFBF; padding: 6px; text-align: left; vertical-align: top; }
      th { background-color: #F2F2F2; font-weight: bold; }
      .delay { color: #C00000; font-weight: bold; }
      .no-delay { color: #00B050; }
      .meta { font-size: 9pt; color: #7F7F7F; }
      .summary { font-style: italic; }
      .evidence { font-family: 'Courier New', monospace; white-space: pre-wrap; font-style: italic; }
    </style>
  `;

  const delayAnalysisTable = `
    <h2>${data.delayAnalysis.title}</h2>
    <table>
      <thead>
        <tr>
          <th>Activity</th>
          <th>Planned Period</th>
          <th>Actual Period</th>
          <th>Delay (Days)</th>
          <th>Impact</th>
        </tr>
      </thead>
      <tbody>
        ${data.delayAnalysis.findings.map(f => `
          <tr>
            <td>${f.activity}</td>
            <td>${f.plannedStart} to ${f.plannedEnd}</td>
            <td>${f.actualStart} to ${f.actualEnd}</td>
            <td class="${f.delayDays > 0 ? 'delay' : 'no-delay'}">${f.delayDays}</td>
            <td>${f.impact}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const supportingDocs = `
    <h2>5.0 Supporting Documents</h2>
    ${data.supportingDocuments.map(doc => `
      <h3>${doc.documentName}</h3>
      ${doc.references && doc.references.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th style="width: 20%;">Page / Location</th>
              <th>Evidence / Paragraph</th>
            </tr>
          </thead>
          <tbody>
            ${doc.references.map(ref => `
              <tr>
                <td>${ref.pageNumber}</td>
                <td><p class="evidence">"${ref.paragraph}"</p></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p>No specific references cited.</p>'}
    `).join('')}
  `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Delay Analysis Report</title>
        ${styles}
      </head>
      <body>
        <h1>Executive Report: Delay Analysis & Claim</h1>
        <p class="meta">Generated: ${new Date().toLocaleDateString()}</p>
        
        <h2>1.0 Executive Summary</h2>
        <p class="summary">${data.executiveSummary}</p>

        <h2>${data.methodology.title}</h2>
        <p>${data.methodology.description}</p>

        ${delayAnalysisTable}

        <h2>${data.claimSummary.title}</h2>
        <p>${data.claimSummary.summary}</p>

        ${supportingDocs}
      </body>
    </html>
  `;
};

export const exportReport = (data: ReportData) => {
    const htmlString = generateReportHtml(data);
    const blob = new Blob([htmlString], { type: 'text/html' });

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const fileName = `Delay_Analysis_Report_${formattedDate}.html`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};