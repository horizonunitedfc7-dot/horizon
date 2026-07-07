const PDFDocument = require('pdfkit');

/**
 * Generates a PDF receipt for the applicant.
 * Returns a Promise that resolves with a Buffer containing the PDF data.
 */
function generateReceiptPDF(applicant) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc
        .fillColor('#B8860B') // Gold-ish color
        .fontSize(24)
        .text('HORIZON UNITED FC', { align: 'center' })
        .moveDown(0.5);

      doc
        .fillColor('#000000')
        .fontSize(16)
        .text('Official Registration Receipt', { align: 'center' })
        .moveDown(2);

      // Registration Details
      doc.fontSize(12).font('Helvetica-Bold').text('Application Details');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);

      doc.font('Helvetica').fontSize(10);
      const details = [
        `Registration Number: ${applicant.regno}`,
        `Payment Status: ${applicant.paymentStatus}`,
        `Name: ${applicant.firstname} ${applicant.lastname}`
      ];

      details.forEach(detail => {
        doc.text(detail, { lineGap: 5 });
      });

      doc.moveDown(2);

      // Disclaimer
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#666666')
        .text('Keep this receipt for your records. You will be required to present your Registration Number during the screening process.', {
          align: 'center'
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateReceiptPDF };
