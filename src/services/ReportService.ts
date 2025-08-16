import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReportData {
  title: string;
  type: 'inventory' | 'transactions' | 'transfers' | 'facilities' | 'users';
  data: any[];
  metadata?: {
    reportId?: string;
    preparedBy?: string;
    department?: string;
    date?: string;
    [key: string]: any;
  };
  filters?: {
    search?: string;
    status?: string;
    facility?: string;
    dateRange?: { start: string; end: string };
    [key: string]: any;
  };
}

export class ReportService {
  /**
   * Generate high-quality PDF report from HTML element
   * This is the same logic that works well in Reports.tsx
   */
  static async generatePDFFromHTML(
    htmlElement: HTMLElement,
    reportTitle: string = 'Report'
  ): Promise<void> {
    try {
      console.log('ReportService: Starting PDF generation...');
      
      // Wait for DOM to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Capture the HTML content as a high-quality canvas
      const canvas = await html2canvas(htmlElement, {
        scale: 3, // High resolution to prevent text cutting
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        width: htmlElement.scrollWidth,
        height: htmlElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: false,
        foreignObjectRendering: false,
        imageTimeout: 0,
        letterRendering: true, // Better text quality
        onclone: (clonedDoc) => {
          console.log('ReportService: html2canvas onclone callback triggered');
          
          // Force all text elements to have proper font rendering
          const allTextElements = clonedDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, td, th, label');
          allTextElements.forEach((el: any) => {
            if (el.style) {
              el.style.fontSmoothing = 'antialiased';
              el.style.webkitFontSmoothing = 'antialiased';
              el.style.mozOsxFontSmoothing = 'grayscale';
              el.style.backgroundColor = '#ffffff';
              el.style.background = '#ffffff';
              el.style.backgroundImage = 'none';
              el.style.lineHeight = '1.2';
              el.style.overflow = 'visible';
              el.style.whiteSpace = 'normal';
            }
          });
          
          // Ensure all elements have white backgrounds
          const allClonedElements = clonedDoc.querySelectorAll('*');
          allClonedElements.forEach((el: any) => {
            if (el.style) {
              el.style.backgroundColor = '#ffffff';
              el.style.background = '#ffffff';
              el.style.backgroundImage = 'none';
            }
          });
          
          // Force body and html to be white
          const body = clonedDoc.body;
          const html = clonedDoc.documentElement;
          if (body) body.style.backgroundColor = '#ffffff';
          if (html) html.style.backgroundColor = '#ffffff';
        }
      });

      // Create PDF with proper dimensions
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);
      const contentHeight = pageHeight - (2 * margin);

      // Force white background on first page
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Calculate dimensions
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      const totalPages = Math.ceil(imgHeight / contentHeight);
      
      console.log('ReportService: Canvas dimensions:', canvas.width, 'x', canvas.height);
      console.log('ReportService: PDF dimensions:', imgWidth, 'x', imgHeight);
      console.log('ReportService: Total pages needed:', totalPages);
      
      if (totalPages <= 1) {
        // Single page - use height-based scaling to prevent text cutting
        const widthScale = contentWidth / canvas.width;
        const heightScale = contentHeight / canvas.height;
        
        // Use height-based scaling to prevent horizontal text cutting
        const scale = heightScale;
        const scaledWidth = canvas.width * scale;
        const scaledHeight = canvas.height * scale;
        
        // Center content both horizontally and vertically
        const xOffset = (pageWidth - scaledWidth) / 2;
        const yOffset = (pageHeight - scaledHeight) / 2;
        
        console.log('ReportService: Single page scaling - scale:', scale, 'xOffset:', xOffset, 'yOffset:', yOffset);
        
        // Add image to PDF
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);
      } else {
        // Multi-page - split content across pages
        let currentPage = 1;
        let remainingHeight = imgHeight;
        let currentY = 0;
        
        while (remainingHeight > 0) {
          if (currentPage > 1) {
            doc.addPage();
            // Force white background on subsequent pages
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
          }
          
          const pageHeight = Math.min(contentHeight, remainingHeight);
          const sourceY = currentY;
          const sourceHeight = (pageHeight * canvas.height) / imgHeight;
          
          console.log(`ReportService: Page ${currentPage} - sourceY: ${sourceY}, sourceHeight: ${sourceHeight}`);
          
          // Add image portion to current page
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(
            imgData, 'PNG',
            margin, margin,
            contentWidth, pageHeight,
            undefined, 'FAST',
            0,
            sourceY, canvas.width, sourceHeight
          );
          
          currentY += sourceHeight;
          remainingHeight -= pageHeight;
          currentPage++;
        }
      }

      // Save the PDF
      const fileName = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      console.log('ReportService: PDF generated successfully:', fileName);
    } catch (error) {
      console.error('ReportService: Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Generate a simple table report for any data
   */
  static generateTableReport(data: any[], columns: string[], title: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'p-6 bg-white';
    container.style.width = '210mm'; // A4 width
    container.style.minHeight = '297mm'; // A4 height
    
    container.innerHTML = `
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">${title}</h1>
        <p class="text-gray-600">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <table class="w-full border-collapse border border-gray-300">
        <thead>
          <tr class="bg-gray-100">
            ${columns.map(col => `<th class="border border-gray-300 px-4 py-2 text-left">${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => `<td class="border border-gray-300 px-4 py-2">${row[col] || ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    return container;
  }

  /**
   * Generate a summary card report
   */
  static generateSummaryReport(
    title: string,
    summaryData: { label: string; value: string | number; color?: string }[],
    details?: any[]
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'p-6 bg-white';
    container.style.width = '210mm';
    container.style.minHeight = '297mm';
    
    const summaryCards = summaryData.map(item => `
      <div class="bg-${item.color || 'blue'}-50 border border-${item.color || 'blue'}-200 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-${item.color || 'blue'}-800">${item.label}</h3>
        <p class="text-2xl font-bold text-${item.color || 'blue'}-600">${item.value}</p>
      </div>
    `).join('');
    
    container.innerHTML = `
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">${title}</h1>
        <p class="text-gray-600">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="grid grid-cols-2 gap-4 mb-6">
        ${summaryCards}
      </div>
      
      ${details ? `
        <div class="mt-6">
          <h2 class="text-xl font-semibold mb-4">Details</h2>
          <div class="bg-gray-50 p-4 rounded-lg">
            <pre class="text-sm">${JSON.stringify(details, null, 2)}</pre>
          </div>
        </div>
      ` : ''}
    `;
    
    return container;
  }
}

export default ReportService;
