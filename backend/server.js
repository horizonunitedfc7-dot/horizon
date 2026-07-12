require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateReceiptPDF } = require('./services/pdfGenerator');
const { sendRegistrationEmail, sendApprovalEmail, sendRejectionEmail, sendForgotPasswordEmail, sendAdminEmailNotification } = require('./services/emailService');
const { sendWhatsAppDocument, sendAdminNotification, sendWhatsAppText } = require('./services/whatsappService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const passportDir = path.join(__dirname, 'uploads', 'passports');
const receiptDir = path.join(__dirname, 'uploads', 'receipts');

if (!fs.existsSync(passportDir)) {
  fs.mkdirSync(passportDir, { recursive: true });
}
if (!fs.existsSync(receiptDir)) {
  fs.mkdirSync(receiptDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/passports/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const receiptStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/receipts/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadReceipt = multer({ storage: receiptStorage });

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// --- AUTHENTICATION ---
// Unified Login Route (Admin & Players)
app.post('/api/auth/unified/login', async (req, res) => {
  const { identifier, password } = req.body;
  try {
    // Check if it's an Admin (email format)
    if (identifier.includes('@')) {
      const admin = await prisma.admin.findUnique({ where: { email: identifier } });
      
      if (admin) {
        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({ type: 'ADMIN', token, admin: { name: admin.name, email: admin.email, role: admin.role } });
      }
    } 
    
    // If not an admin, check if it's a Player by Registration ID or Email
    const applicant = await prisma.applicant.findFirst({
      where: {
        OR: [
          { regno: identifier },
          { email: identifier }
        ]
      }
    });

    if (!applicant) return res.status(401).json({ error: "Invalid credentials" });
    
    if (!applicant.password) return res.status(401).json({ error: "Account not setup for login" });

    const valid = await bcrypt.compare(password, applicant.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: applicant.id, role: applicant.playerType }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ type: 'PLAYER', token, player: { name: applicant.firstname, regno: applicant.regno, type: applicant.playerType } });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server error occurred. Please try again later." });
  }
});

// Get Flutterwave Public Key Config
app.get('/api/config/flutterwave', (req, res) => {
  // We only return the PUBLIC key which is safe for frontend browsers
  res.json({ publicKey: process.env.FLW_PUBLIC_KEY });
});

// Check Email Uniqueness during Registration
app.get('/api/check-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email is required" });
  try {
    const applicant = await prisma.applicant.findFirst({
      where: { email: email.toLowerCase() }
    });
    const admin = await prisma.admin.findFirst({
      where: { email: email.toLowerCase() }
    });
    return res.json({ exists: !!applicant || !!admin });
  } catch (err) {
    res.status(500).json({ error: "Server error occurred" });
  }
});

// Player Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { identifier } = req.body;
  try {
    const applicant = await prisma.applicant.findFirst({
      where: {
        regno: identifier
      }
    });

    if (!applicant) return res.status(404).json({ error: "No player found with that email or ID" });

    // Generate a temporary 6-character password
    const tempPassword = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.applicant.update({
      where: { id: applicant.id },
      data: { password: hashedPassword }
    });

    await sendForgotPasswordEmail(applicant, tempPassword);

    return res.json({ message: "A temporary password has been sent to your email." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Middleware to protect admin routes
const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const requirePlayer = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

app.get('/api/player/me', requirePlayer, async (req, res) => {
  try {
    const applicant = await prisma.applicant.findUnique({ where: { id: req.user.id } });
    if (!applicant) return res.status(404).json({ error: "Player not found" });
    // Strip password
    const { password, ...safeData } = applicant;
    res.json(safeData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/player/me', requirePlayer, upload.fields([
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'consentLetter', maxCount: 1 },
  { name: 'clubReleaseLetter', maxCount: 1 }
]), async (req, res) => {
  try {
    const data = req.body;
    
    const updateData = {
      firstname: data.firstname,
      lastname: data.lastname,
      mobile: data.mobile,
      address: data.address,
      position: data.position,
      height: data.height,
      weight: data.weight,
      foot: data.foot,
    };

    if (req.files?.['passportPhoto']?.[0]) {
      updateData.passportPhoto = `/uploads/passports/${req.files['passportPhoto'][0].filename}`;
    }
    if (req.files?.['consentLetter']?.[0]) {
      updateData.consentLetter = `/uploads/passports/${req.files['consentLetter'][0].filename}`;
    }
    if (req.files?.['clubReleaseLetter']?.[0]) {
      updateData.clubReleaseLetter = `/uploads/passports/${req.files['clubReleaseLetter'][0].filename}`;
    }

    // If application was rejected, editing should put it back to PENDING
    const currentApplicant = await prisma.applicant.findUnique({ where: { id: req.user.id } });
    if (currentApplicant && currentApplicant.applicationStatus === 'REJECTED') {
      updateData.applicationStatus = 'PENDING';
    }

    const applicant = await prisma.applicant.update({
      where: { id: req.user.id },
      data: updateData
    });
    
    const { password, ...safeData } = applicant;
    res.json({ success: true, applicant: safeData });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const axios = require('axios');

// Helper function to verify Flutterwave payment
const verifyFlutterwavePayment = async (transaction_id) => {
  const secretKey = process.env.FLW_SECRET_KEY;
  if (!secretKey) throw new Error("Flutterwave secret key not configured");
  
  const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}` }
  });
  return response.data;
};

app.post('/api/payments/verify', requirePlayer, async (req, res) => {
  try {
    const { transaction_id, paidItems } = req.body;
    
    // Verify with Flutterwave
    const flwRes = await verifyFlutterwavePayment(transaction_id);
    if (flwRes.data.status !== "successful") {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const applicant = await prisma.applicant.findUnique({ where: { id: req.user.id } });
    if (!applicant) return res.status(404).json({ error: "Player not found" });

    let currentLedger = applicant.feeLedger ? JSON.parse(applicant.feeLedger) : {};
    
    // Merge paid items into the ledger
    for (const [key, qty] of Object.entries(paidItems)) {
      if (qty > 0) {
        currentLedger[key] = true;
        currentLedger[`${key}_qty`] = qty;
      }
    }

    const updatedApplicant = await prisma.applicant.update({
      where: { id: req.user.id },
      data: { feeLedger: JSON.stringify(currentLedger) }
    });

    // Create Admin Notification
    await prisma.adminNotification.create({
      data: {
        title: "New Payment Received",
        message: `${applicant.firstname} ${applicant.lastname} (${applicant.regno}) just made a payment.`
      }
    });

    // Create Notification Message
    await prisma.message.create({
      data: {
        applicantId: applicant.id,
        subject: "Payment Successful",
        body: `We have successfully received your payment (Ref: ${flwRes.data.tx_ref}). Your dashboard has been updated.`,
        isRead: false
      }
    });

    res.json({ success: true, applicant: updatedApplicant });
  } catch (err) {
    console.error("Payment Verification Error:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments/webhook', async (req, res) => {
  try {
    const secretHash = process.env.FLW_SECRET_HASH;
    const signature = req.headers['verif-hash'];
    
    if (!signature || signature !== secretHash) {
      return res.status(401).end();
    }

    const payload = req.body;
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      console.log("Webhook verified for transaction:", payload.data.id);
    }
    
    res.status(200).end();
  } catch (err) {
    console.error("Webhook Error:", err.message);
    res.status(500).end();
  }
});

// --- APPLICANTS (REGISTRATION) ---
const generateRegNo = () => {
  return `HZN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

app.post('/api/applicants', upload.fields([
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'consentLetter', maxCount: 1 },
  { name: 'clubReleaseLetter', maxCount: 1 },
  { name: 'registrationReceipt', maxCount: 1 }
]), async (req, res) => {
  try {
    const data = req.body;
    
    // Check if user already exists
    const existing = await prisma.applicant.findFirst({
      where: { email: data.email }
    });

    if (existing) {
      return res.status(400).json({ error: "Applicant with this email already exists." });
    }

    const regno = generateRegNo();

    const applicant = await prisma.applicant.create({
      data: {
        firstname: data.firstname,
        lastname: data.lastname,
        regno: regno,
        age: parseInt(data.age),
        nationality: data.nationality,
        state: data.state,
        address: data.address,
        mobile: data.mobile,
        email: data.email,
        gender: data.gender,
        message: data.message,

        position: data.position,
        foot: data.foot,
        height: data.height,
        weight: data.weight,
        prevclub: data.prevclub,
        experience: parseInt(data.experience),
        achievement: data.achievement,

        bloodgroup: data.bloodgroup,
        genotype: data.genotype,
        medicalcondition: data.medicalcondition,
        allergy: data.allergy,
        emergencynumber: data.emergencynumber,

        institute: data.institute,
        classlevel: data.classlevel,

        guardianname: data.guardianname,
        relationship: data.relationship,
        guardianmobile: data.guardianmobile,
        guardianaddress: data.guardianaddress,
        
        rulesAgreed: data.rules === 'on' || data.rules === true,
        disciplineAgreed: data.discipline === 'on' || data.discipline === true,

        playerType: data.playerType || 'ACADEMIC',
        password: data.password ? await bcrypt.hash(data.password, 10) : null,
        passportPhoto: req.files?.['passportPhoto']?.[0] ? `/uploads/passports/${req.files['passportPhoto'][0].filename}` : null,
        consentLetter: req.files?.['consentLetter']?.[0] ? `/uploads/passports/${req.files['consentLetter'][0].filename}` : null,
        clubReleaseLetter: req.files?.['clubReleaseLetter']?.[0] ? `/uploads/passports/${req.files['clubReleaseLetter'][0].filename}` : null,
        registrationReceipt: req.files?.['registrationReceipt']?.[0] ? `/uploads/passports/${req.files['registrationReceipt'][0].filename}` : null,
        releasedFromClub: data.releasedFromClub === 'on' || data.releasedFromClub === true || data.releasedFromClub === 'true',
        hasHealthIssues: data.hasHealthIssues === 'on' || data.hasHealthIssues === true || data.hasHealthIssues === 'true',
        parentConsent: data.parentConsent === 'on' || data.parentConsent === true || data.parentConsent === 'true',
        feeLedger: data.playerType === 'ACADEMIC' ? JSON.stringify({ school: false, jersey: false, accommodation: false, feeding: false }) : null,
        
        paymentStatus: 'PENDING',
        paymentRef: data.paymentRef || null
      }
    });

    // Generate PDF and send Email & WhatsApp asynchronously
    generateReceiptPDF(applicant).then(pdfBuffer => {
      sendRegistrationEmail(applicant, pdfBuffer);
      if (applicant.mobile) {
        sendWhatsAppDocument(
          applicant.mobile, 
          pdfBuffer, 
          `Welcome to Horizon United FC! Your registration was successful. Here is your official receipt for Reg No: ${applicant.regno}`, 
          `Horizon_Receipt_${applicant.regno}.pdf`
        );
      }
    }).catch(err => console.error("PDF/Email/WhatsApp Error:", err));

    sendAdminNotification(applicant).catch(err => console.error("Admin WhatsApp Error:", err));
    sendAdminEmailNotification(applicant).catch(err => console.error("Admin Email Error:", err));

    // Create Admin Notification
    await prisma.adminNotification.create({
      data: {
        title: "New Player Registration",
        message: `${applicant.firstname} ${applicant.lastname} just registered as a ${applicant.playerType} player.`
      }
    });

    res.status(201).json({ success: true, applicant });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- ADMIN ROUTES ---

// Get Admin Notifications
app.get('/api/admin/notifications', requireAdmin, async (req, res) => {
  try {
    const notifications = await prisma.adminNotification.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Admin Notification as Read
app.put('/api/admin/notifications/:id/read', requireAdmin, async (req, res) => {
  try {
    await prisma.adminNotification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/admin/applicants', requireAdmin, async (req, res) => {
  try {
    const applicants = await prisma.applicant.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const total = applicants.length;
    const approved = applicants.filter(a => a.applicationStatus === 'APPROVED' || a.applicationStatus === 'OFFICIAL_SQUAD').length;
    const pending = applicants.filter(a => a.applicationStatus === 'PENDING').length;
    const rejected = applicants.filter(a => a.applicationStatus === 'REJECTED').length;
    
    // Dynamically calculate revenue based on current fees
    const fees = await prisma.fee.findMany();
    const regFee = fees.find(f => f.category === 'REGISTRATION')?.amount || 15000;
    const totalAcademyFee = fees.filter(f => f.category === 'ACADEMIC').reduce((sum, f) => sum + f.amount, 0) || 390000;
    const initialDeposit = totalAcademyFee * 0.8;
    const balanceFee = totalAcademyFee * 0.2;

    let revenue = 0;
    applicants.forEach(a => {
      if (a.paymentStatus === 'COMPLETED') revenue += regFee;
      if (a.academyFeeStatus === 'APPROVED') revenue += initialDeposit;
      if (a.balanceFeeStatus === 'APPROVED') revenue += balanceFee;
    });

    res.json({
      analytics: { total, approved, pending, rejected, revenue },
      data: applicants
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/applicants/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  
  if (!['APPROVED', 'REJECTED', 'PENDING', 'OFFICIAL_SQUAD', 'TRIAL_FAILED'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const applicant = await prisma.applicant.update({
      where: { id },
      data: { applicationStatus: status }
    });

    // Send workflow email asynchronously
    if (status === 'APPROVED') {
      sendApprovalEmail(applicant);
    } else if (status === 'REJECTED') {
      sendRejectionEmail(applicant);
      if (applicant.mobile && reason) {
        const message = `Hello ${applicant.firstname},\n\nUnfortunately, your application to Horizon United FC has been rejected.\n\nReason: ${reason}\n\nWe wish you the best in your future endeavors.`;
        sendWhatsAppText(applicant.mobile, message).catch(err => console.error(err));
      }
    }

    res.json({ success: true, applicant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/applicants/:id/squad-data', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { scoutRatings, privateSchedule, coachNotes } = req.body;
  
  try {
    const applicant = await prisma.applicant.update({
      where: { id },
      data: {
        scoutRatings: scoutRatings ? JSON.stringify(scoutRatings) : null,
        privateSchedule: privateSchedule ? JSON.stringify(privateSchedule) : null,
        coachNotes: coachNotes || null
      }
    });

    res.json({ success: true, applicant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/applicants/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.applicant.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FEES MANAGEMENT ---
app.get('/api/fees', async (req, res) => {
  try {
    let fees = await prisma.fee.findMany();
    // Auto-seed if empty
    if (fees.length === 0) {
      await prisma.fee.createMany({
        data: [
          { key: 'registration', title: 'Registration Fee', amount: 15000, category: 'REGISTRATION' },
          { key: 'school', title: 'School Fees', amount: 150000, category: 'ACADEMIC' },
          { key: 'jersey', title: 'Jersey Fee', amount: 25000, category: 'ACADEMIC' },
          { key: 'accommodation', title: 'Accommodation', amount: 80000, category: 'ACADEMIC' },
          { key: 'feeding', title: 'Feeding & Welfare', amount: 120000, category: 'ACADEMIC' },
        ]
      });
      fees = await prisma.fee.findMany();
    }
    res.json(fees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fees', requireAdmin, async (req, res) => {
  try {
    const { title, amount, category } = req.body;
    const key = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newFee = await prisma.fee.create({
      data: { key, title, amount: parseInt(amount), category }
    });
    res.json(newFee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/fees/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category } = req.body;
    const updatedFee = await prisma.fee.update({
      where: { id },
      data: { title, amount: parseInt(amount), category }
    });
    res.json(updatedFee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/fees/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fee.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- ADMIN SETTINGS ---
app.put('/api/admin/password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await prisma.admin.findUnique({ where: { id: req.user.id } });
    
    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) return res.status(400).json({ error: "Incorrect current password" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NOTIFICATIONS ---
app.post('/api/admin/messages', requireAdmin, async (req, res) => {
  try {
    const { target, targetId, subject, body, sendViaWhatsApp } = req.body;
    
    // Find target applicants
    let applicants = [];
    if (target === 'ALL') {
      applicants = await prisma.applicant.findMany();
    } else if (target === 'ACADEMIC') {
      applicants = await prisma.applicant.findMany({ where: { playerType: 'ACADEMIC' } });
    } else if (target === 'SCHOLARSHIP') {
      applicants = await prisma.applicant.findMany({ where: { playerType: 'SCHOLARSHIP' } });
    } else if (target === 'SPECIFIC') {
      applicants = await prisma.applicant.findMany({ where: { id: targetId } });
    }

    if (applicants.length === 0) {
      return res.status(400).json({ error: "No players found for the selected target." });
    }

    // Create a message record for each targeted applicant
    const messages = applicants.map(app => ({
      applicantId: app.id,
      subject,
      body,
      sentViaWhatsApp: !!sendViaWhatsApp
    }));

    await prisma.message.createMany({ data: messages });

    // Handle WhatsApp sending if selected
    if (sendViaWhatsApp) {
      for (const app of applicants) {
        if (app.mobile) {
          try {
            await sendWhatsAppText(app.mobile, `*${subject}*\n\n${body}\n\n_Reply to this message to chat with the Admin._`);
          } catch (e) {
            console.error(`WhatsApp push failed for ${app.mobile}:`, e);
          }
        }
      }
    }

    res.json({ success: true, count: applicants.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/player/messages', requirePlayer, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { applicantId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/player/messages/:id/read', requirePlayer, async (req, res) => {
  try {
    const { id } = req.params;
    const message = await prisma.message.updateMany({
      where: { id, applicantId: req.user.id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EVENTS (CALENDAR) ---
app.get('/api/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' }
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TEMPORARY ROUTE: Seed Production Database
app.get('/api/seed', async (req, res) => {
  try {
    // Clear existing data to prevent unique constraint errors
    await prisma.event.deleteMany();
    await prisma.applicant.deleteMany();
    await prisma.admin.deleteMany();

    // 1. Seed 5 Events
    const events = [
      {
        title: "Pre-Season Friendly",
        description: "Watch Horizon United vs Lagos City FC.",
        location: "Horizon Stadium",
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        teamA: "Horizon United",
        teamB: "Lagos City FC",
        isPoster: true
      },
      {
        title: "Open Trial Day",
        description: "Open trial assessments.",
        location: "Training Pitch",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        teamA: "",
        teamB: "",
        isPoster: false
      },
      {
        title: "Academy Cup Final",
        description: "U-19s cup final.",
        location: "National Stadium",
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        teamA: "Horizon Academy",
        teamB: "Enyimba Youth",
        isPoster: true
      },
      {
        title: "Community Outreach",
        description: "Giving back to the local community.",
        location: "Surulere Square",
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        teamA: "",
        teamB: "",
        isPoster: false
      },
      {
        title: "End of Season Gala",
        description: "Awards night and dinner.",
        location: "Eko Hotel",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        teamA: "",
        teamB: "",
        isPoster: false
      },
      {
        title: "Youth Development Camp",
        description: "A specialized training camp for young talents.",
        location: "Horizon Training Ground",
        date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        teamA: "",
        teamB: "",
        isPoster: false
      },
      {
        title: "Away Match vs Kano Pillars",
        description: "Crucial away fixture in the league.",
        location: "Sani Abacha Stadium",
        date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
        teamA: "Kano Pillars",
        teamB: "Horizon United",
        isPoster: true
      }
    ];

    for (const ev of events) {
      await prisma.event.create({ data: ev });
    }

    // 2. Seed 2 Academic Players
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const dummyData = {
      nationality: "Nigerian",
      state: "Lagos",
      address: "123 Seed Street",
      position: "Striker",
      foot: "Right",
      height: "180cm",
      weight: "75kg",
      experience: 2,
      bloodgroup: "O+",
      genotype: "AA",
      emergencynumber: "08099999999",
      institute: "Seed High School",
      classlevel: "SS3",
      guardianname: "Mr Seed",
      relationship: "Father",
      guardianmobile: "08088888888",
      guardianaddress: "123 Seed Street"
    };

    await prisma.applicant.create({
      data: {
        firstname: "Tunde",
        lastname: "Bakare",
        email: "academic1@example.com",
        mobile: "08011111111",
        gender: "M",
        playerType: "ACADEMIC",
        applicationStatus: "APPROVED",
        paymentStatus: "COMPLETED",
        paymentRef: "FLW_SEED_1001",
        passportPhoto: "https://ui-avatars.com/api/?name=Tunde+Bakare&background=0D8ABC&color=fff&size=200",
        password: hashedPassword,
        regno: "HZN-ACA1",
        age: 18,
        ...dummyData
      }
    });

    await prisma.applicant.create({
      data: {
        firstname: "Chuka",
        lastname: "Obi",
        email: "academic2@example.com",
        mobile: "08022222222",
        gender: "M",
        playerType: "ACADEMIC",
        applicationStatus: "APPROVED",
        paymentStatus: "COMPLETED",
        paymentRef: "FLW_SEED_1002",
        passportPhoto: "https://ui-avatars.com/api/?name=Chuka+Obi&background=1E3A8A&color=fff&size=200",
        password: hashedPassword,
        regno: "HZN-ACA2",
        age: 17,
        ...dummyData
      }
    });

    // 3. Seed 2 Scholarship Players
    await prisma.applicant.create({
      data: {
        firstname: "Ibrahim",
        lastname: "Musa",
        email: "scholar1@example.com",
        mobile: "08033333333",
        gender: "M",
        playerType: "SCHOLARSHIP",
        applicationStatus: "APPROVED",
        paymentStatus: "COMPLETED",
        paymentRef: "FLW_SEED_1003",
        passportPhoto: "https://ui-avatars.com/api/?name=Ibrahim+Musa&background=F59E0B&color=fff&size=200",
        password: hashedPassword,
        regno: "HZN-SCH1",
        age: 19,
        ...dummyData
      }
    });

    await prisma.applicant.create({
      data: {
        firstname: "Emeka",
        lastname: "Eze",
        email: "scholar2@example.com",
        mobile: "08044444444",
        gender: "M",
        playerType: "SCHOLARSHIP",
        applicationStatus: "APPROVED",
        paymentStatus: "COMPLETED",
        paymentRef: "FLW_SEED_1004",
        passportPhoto: "https://ui-avatars.com/api/?name=Emeka+Eze&background=10B981&color=fff&size=200",
        password: hashedPassword,
        regno: "HZN-SCH2",
        age: 18,
        ...dummyData
      }
    });

    // 4. Seed Admin Account
    const adminPassword = await bcrypt.hash("H0riz0n@dm1n2026!", 10);
    await prisma.admin.create({
      data: {
        email: "admin@horizonunitedfc.com",
        password: adminPassword,
        name: "Super Admin",
        role: "ADMIN"
      }
    });

    res.json({ message: "Successfully seeded 7 events, 2 academic players, 2 scholarship players, and the Admin account!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/events', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, date, description, location, teamA, teamB, isPoster, ticketLink } = req.body;
    const imagePath = req.file ? `/uploads/passports/${req.file.filename}` : null;
    
    const event = await prisma.event.create({
      data: {
        title,
        date: new Date(date),
        description,
        location,
        teamA,
        teamB,
        isPoster: isPoster === 'true' || isPoster === true,
        image: imagePath,
        ticketLink
      }
    });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/events/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, description, location, teamA, teamB, isPoster, ticketLink } = req.body;
    
    const updateData = {
      title,
      description,
      location,
      teamA,
      teamB,
      ticketLink
    };

    if (date) updateData.date = new Date(date);
    if (isPoster !== undefined) updateData.isPoster = isPoster === 'true' || isPoster === true;
    if (req.file) updateData.image = `/uploads/passports/${req.file.filename}`;

    const event = await prisma.event.update({
      where: { id },
      data: updateData
    });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/events/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.event.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN APPROVE REGISTRATION PAYMENT ---
app.post('/api/admin/applicants/:id/approve-registration', requireAdmin, async (req, res) => {
  try {
    const updated = await prisma.applicant.update({
      where: { id: req.params.id },
      data: { paymentStatus: 'COMPLETED' }
    });

    // Generate Official PDF Receipt
    try {
      const pdfBuffer = await generateReceiptPDF(updated);
      
      // Fire PDF receipt to WhatsApp
      if (updated.mobile) {
        await sendWhatsAppDocument(
          updated.mobile, 
          pdfBuffer, 
          "Your official Horizon United Registration Receipt is attached. Keep it safe!", 
          `Receipt_${updated.regno}.pdf`
        );
      }
      
      // Fire PDF receipt to Email
      if (updated.email) {
        await sendRegistrationEmail(updated, pdfBuffer);
      }
    } catch (notifyErr) {
      console.error("Failed to generate or send PDF receipt:", notifyErr);
      // We don't throw here because the approval was successful
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN APPROVE ACADEMY FEE PAYMENT ---
app.post('/api/admin/applicants/:id/approve-academy-fee', requireAdmin, async (req, res) => {
  try {
    const updated = await prisma.applicant.update({
      where: { id: req.params.id },
      data: { academyFeeStatus: 'APPROVED' }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN APPROVE ACADEMY BALANCE PAYMENT ---
app.post('/api/admin/applicants/:id/approve-academy-balance', requireAdmin, async (req, res) => {
  try {
    const updated = await prisma.applicant.update({
      where: { id: req.params.id },
      data: { academyBalanceStatus: 'COMPLETED' }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PLAYER UPLOAD ACADEMY FEE RECEIPT ---
app.post('/api/player/academy-fee', requirePlayer, uploadReceipt.single('academyFeeReceipt'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No receipt uploaded' });
    const receiptUrl = `/uploads/receipts/${req.file.filename}`;
    
    const updated = await prisma.applicant.update({
      where: { id: req.user.id },
      data: {
        academyFeeReceipt: receiptUrl,
        academyFeeStatus: 'VERIFYING'
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PLAYER UPLOAD ACADEMY BALANCE RECEIPT ---
app.post('/api/player/academy-balance', requirePlayer, uploadReceipt.single('academyBalanceReceipt'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No receipt uploaded' });
    const receiptUrl = `/uploads/receipts/${req.file.filename}`;
    
    const updated = await prisma.applicant.update({
      where: { id: req.user.id },
      data: {
        academyBalanceReceipt: receiptUrl,
        academyBalanceStatus: 'VERIFYING'
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
