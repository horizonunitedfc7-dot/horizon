const axios = require('axios');

const sendWhatsAppDocument = async (to, pdfBuffer, caption, filename) => {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;

  if (!instanceId || !token) {
    console.warn("UltraMsg credentials not set. Skipping WhatsApp document message.");
    return false;
  }

  // UltraMsg requires the phone number without the '+' sign
  const formattedPhone = to.replace('+', '');
  
  // Convert PDF buffer to Base64
  const base64Pdf = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

  try {
    const response = await axios.post(`https://api.ultramsg.com/${instanceId}/messages/document`, {
      token: token,
      to: formattedPhone,
      filename: filename,
      document: base64Pdf,
      caption: caption
    });
    console.log("WhatsApp document sent successfully:", response.data);
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp document:", error?.response?.data || error.message);
    return false;
  }
};

const sendWhatsAppText = async (to, body) => {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;

  if (!instanceId || !token) {
    console.warn("UltraMsg credentials not set. Skipping WhatsApp text message.");
    return false;
  }

  const formattedPhone = to.replace('+', '');

  try {
    const response = await axios.post(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      token: token,
      to: formattedPhone,
      body: body
    });
    console.log("WhatsApp text sent successfully:", response.data);
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp text:", error?.response?.data || error.message);
    return false;
  }
};
const sendAdminNotification = async (applicant) => {
  const adminPhone = "+2348057939500";
  const body = `*New Registration Alert!*\n\nName: ${applicant.firstname} ${applicant.lastname}\nType: ${applicant.playerType}\nReg No: ${applicant.regno}\nPayment Status: ${applicant.paymentStatus}\n\nPlease check the admin dashboard for details.`;
  return sendWhatsAppText(adminPhone, body);
};

module.exports = { sendWhatsAppDocument, sendWhatsAppText, sendAdminNotification };
