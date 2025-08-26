const htmlPdf = require('html-pdf-node');
const fs = require('fs-extra');
const path = require('path');

class PDFService {
    constructor() {
        this.outputDir = path.join(__dirname, '../uploads/pdfs');
        fs.ensureDirSync(this.outputDir);
    }

    async generateOrderSlipPDF(orderData) {
        try {
            const htmlContent = this.generateHTML(orderData);
            
            const options = {
                format: 'A4',
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            };

            const file = { content: htmlContent };
            const pdfBuffer = await htmlPdf.generatePdf(file, options);
            
            const fileName = `order-slip-${orderData.order_number}-${Date.now()}.pdf`;
            const filePath = path.join(this.outputDir, fileName);
            
            await fs.writeFile(filePath, pdfBuffer);
            
            return {
                fileName,
                filePath,
                buffer: pdfBuffer
            };
            
        } catch (error) {
            console.error('PDF generation error:', error);
            throw error;
        }
    }

    generateHTML(orderData) {
        // Same HTML template as above
        return `...`; // Use the same HTML template from above
    }
}

module.exports = new PDFService();