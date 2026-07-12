const nodemailer = require('nodemailer');

const sendRegistrationEmail = async (applicant, pdfBuffer) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Horizon United FC" <${process.env.EMAIL_USER}>`,
      to: applicant.email,
      subject: 'Registration Successful - Horizon United FC',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-w-md; margin: 0 auto;">
          <h2 style="color: #B8860B;">Welcome to Horizon United FC!</h2>
          <p>Dear ${applicant.firstname},</p>
          <p>Your registration fee has been successfully received, and your application is now processing.</p>
          <p><strong>Your Registration Number is: <span style="font-size: 1.2em; color: #B8860B;">${applicant.regno}</span></strong></p>
          <p>Please find attached your official registration receipt. Keep this document safe as you will need it for the screening phase.</p>
          <br/>
          <p>Best regards,<br/>The Horizon United Management Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `Horizon_Receipt_${applicant.regno}.pdf`,
          content: pdfBuffer
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: ', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false; // Don't throw, just log so it doesn't break the response
  }
};

const sendApprovalEmail = async (applicant) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Horizon United FC" <${process.env.EMAIL_USER}>`,
      to: applicant.email,
      subject: 'Application Approved - Horizon United FC',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2e7d32;">Congratulations! Your Application is Approved!</h2>
          <p>Dear ${applicant.firstname},</p>
          <p>We are thrilled to inform you that your application (Reg No: <strong>${applicant.regno}</strong>) has been formally <strong>APPROVED</strong> by the management team at Horizon United FC.</p>
          <p>Please prepare for the upcoming screening and induction phase. We will send you further details shortly regarding dates and times.</p>
          <p>We look forward to seeing you on the pitch!</p>
          <br/>
          <p>Best regards,<br/>The Horizon United Management Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Approval Email sent successfully: ', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending approval email:', error);
    return false;
  }
};

const sendRejectionEmail = async (applicant) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Horizon United FC" <${process.env.EMAIL_USER}>`,
      to: applicant.email,
      subject: 'Application Status Update - Horizon United FC',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #c62828;">Application Update</h2>
          <p>Dear ${applicant.firstname},</p>
          <p>Thank you for your interest in joining Horizon United FC. We have carefully reviewed your application (Reg No: <strong>${applicant.regno}</strong>).</p>
          <p>Unfortunately, we are unable to offer you a spot in the academy at this time. This was a difficult decision, as we received many highly competitive applications.</p>
          <p>We encourage you to keep training and applying in future intake windows. We wish you the absolute best in your football career.</p>
          <br/>
          <p>Best regards,<br/>The Horizon United Management Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Rejection Email sent successfully: ', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return false;
  }
};

const sendForgotPasswordEmail = async (applicant, newPassword) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Horizon United FC" <${process.env.EMAIL_USER}>`,
      to: applicant.email,
      subject: 'Password Reset - Horizon United FC',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #B8860B;">Password Reset Request</h2>
          <p>Dear ${applicant.firstname},</p>
          <p>We received a request to reset your password for your Horizon United FC account.</p>
          <p>Your new temporary password is: <strong style="font-size: 1.2em; color: #B8860B;">${newPassword}</strong></p>
          <p>Please log in using this password. You can change your password from your dashboard settings.</p>
          <br/>
          <p>Best regards,<br/>The Horizon United Management Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Forgot Password Email sent successfully: ', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending forgot password email:', error);
    return false;
  }
};

const sendAdminEmailNotification = async (applicant) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Horizon United FC System" <${process.env.EMAIL_USER}>`,
      to: 'admin@horizonunited.com',
      subject: 'New Registration Alert - Horizon United FC',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #B8860B;">New Player Registration</h2>
          <p>A new player has just completed their registration on the platform.</p>
          <ul>
            <li><strong>Name:</strong> ${applicant.firstname} ${applicant.lastname}</li>
            <li><strong>Type:</strong> ${applicant.playerType}</li>
            <li><strong>Reg No:</strong> ${applicant.regno}</li>
            <li><strong>Payment Status:</strong> ${applicant.paymentStatus}</li>
          </ul>
          <p>Please log in to the admin dashboard to review their full profile and receipt.</p>
          <br/>
          <p>System Generated Message</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent successfully: ', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return false;
  }
};

module.exports = { sendRegistrationEmail, sendApprovalEmail, sendRejectionEmail, sendForgotPasswordEmail, sendAdminEmailNotification };
