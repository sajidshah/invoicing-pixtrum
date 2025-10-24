import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import admin from "firebase-admin";
import { google } from "googleapis";
import {
  generatePDF,
  type Invoice as InvoiceData,
  type Client as ClientData,
} from "./pdf";

type ExtendedInvoice = InvoiceData & {
  ownedBy: string;
  clientId: string;
  pdfUrl?: string;
  invoiceNumber: string;
};

// Gmail OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  storageBucket: process.env.STORAGE_BUCKET,
});

const db = admin.firestore();
const storage = admin.storage();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req: Request, res: Response) => {
  res.json({ status: "ok", service: "invoice-renderer" });
});

// Deep health check (validates bucket exists)
app.get("/healthz", async (_req: Request, res: Response) => {
  try {
    const bucketName = process.env.STORAGE_BUCKET;
    if (!bucketName) {
      return res
        .status(500)
        .json({ ok: false, error: "STORAGE_BUCKET not set" });
    }
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    if (!exists) {
      return res
        .status(500)
        .json({ ok: false, error: `Bucket ${bucketName} does not exist` });
    }
    return res.json({ ok: true, bucket: bucketName });
  } catch (err) {
    return res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Generate PDF endpoint
app.post("/generate-pdf", async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ error: "invoiceId is required" });
    }

    // Verify Firebase ID token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;

    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Fetch invoice from Firestore
    const invoiceDoc = await db.collection("invoices").doc(invoiceId).get();

    if (!invoiceDoc.exists) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoice = invoiceDoc.data() as ExtendedInvoice;

    // Verify ownership
    if (invoice?.ownedBy !== decodedToken.uid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Fetch client data
    const clientDoc = await db
      .collection("clients")
      .doc(invoice.clientId)
      .get();
    const client = clientDoc.data() as ClientData | undefined;

    // Fetch company settings
    const settingsDoc = await db
      .collection("settings")
      .doc(decodedToken.uid)
      .get();
    const settings = settingsDoc.exists ? settingsDoc.data() : undefined;
    const company = settings
      ? {
          companyName: settings.companyName,
          companyAddress: settings.companyAddress,
          companyEmail: settings.companyEmail,
          companyPhone: settings.companyPhone,
          bankDetails: settings.bankDetails,
          quantityLabel: settings.quantityLabel,
          unitPriceLabel: settings.unitPriceLabel,
          footerNote: settings.footerNote,
        }
      : undefined;

    // Generate PDF
    const pdfBuffer = await generatePDF(invoice, client, company);

    // Upload to Firebase Storage
    const bucketName = process.env.STORAGE_BUCKET;
    if (!bucketName) {
      return res.status(500).json({ error: "STORAGE_BUCKET not configured" });
    }
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    if (!exists) {
      return res
        .status(500)
        .json({ error: `Storage bucket ${bucketName} does not exist` });
    }
    const fileName = `invoices/${invoiceId}.pdf`;
    const file = bucket.file(fileName);

    await file.save(pdfBuffer, {
      contentType: "application/pdf",
      metadata: {
        metadata: {
          invoiceId,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    // Generate a signed URL (no need to make bucket public)
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
    });
    const publicUrl = signedUrl;

    // Update invoice with PDF URL
    await db.collection("invoices").doc(invoiceId).update({
      pdfUrl: publicUrl,
      pdfGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      pdfUrl: publicUrl,
      message: "PDF generated successfully",
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get Gmail OAuth URL
app.get("/gmail/auth-url", async (req: Request, res: Response) => {
  try {
    // Verify user is authenticated
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;

    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Generate OAuth URL with state parameter containing userId
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      prompt: "consent", // Force consent screen to get refresh token
      state: decodedToken.uid, // Pass user ID in state
    });

    res.json({ authUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ error: "Failed to generate auth URL" });
  }
});

// Gmail OAuth callback
app.get("/gmail/callback", async (req: Request, res: Response) => {
  try {
    const { code, state: userId } = req.query;

    if (
      !code ||
      !userId ||
      typeof code !== "string" ||
      typeof userId !== "string"
    ) {
      return res.status(400).send("Missing code or user ID");
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return res
        .status(400)
        .send("No refresh token received. Please try again.");
    }

    // Get user email
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    // Encrypt refresh token (in production, use proper encryption)
    // For now, we'll store it directly (you should encrypt it in production)
    const refreshToken = tokens.refresh_token;

    // Save to Firestore
    await db.collection("settings").doc(userId).update({
      gmailConnected: true,
      gmailEmail: email,
      gmailRefreshToken: refreshToken,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Redirect back to settings page
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/settings?gmail=connected`);
  } catch (error) {
    console.error("Error in Gmail callback:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/settings?gmail=error`);
  }
});

// Send invoice via Gmail
app.post("/send-invoice-email", async (req: Request, res: Response) => {
  try {
    const { invoiceId, recipientEmail, subject, message } = req.body;

    if (!invoiceId || !recipientEmail || !subject) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify Firebase ID token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;

    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get user's Gmail settings
    const settingsDoc = await db
      .collection("settings")
      .doc(decodedToken.uid)
      .get();
    const settings = settingsDoc.data();

    if (!settings?.gmailConnected || !settings?.gmailRefreshToken) {
      return res.status(400).json({ error: "Gmail not connected" });
    }

    // Fetch invoice
    const invoiceDoc = await db.collection("invoices").doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoice = invoiceDoc.data() as ExtendedInvoice;
    if (invoice?.ownedBy !== decodedToken.uid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!invoice.pdfUrl) {
      return res.status(400).json({ error: "Invoice PDF not generated yet" });
    }

    // Set up OAuth2 client with refresh token
    oauth2Client.setCredentials({
      refresh_token: settings.gmailRefreshToken,
    });

    // Download PDF from Storage
    const bucketName = process.env.STORAGE_BUCKET;
    if (!bucketName) {
      return res.status(500).json({ error: "STORAGE_BUCKET not configured" });
    }
    const bucket = storage.bucket(bucketName);
    const fileName = `invoices/${invoiceId}.pdf`;
    const file = bucket.file(fileName);

    const [pdfBuffer] = await file.download();
    const pdfBase64 = pdfBuffer.toString("base64");

    // Create email with attachment and proper headers to avoid spam
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const boundary = "boundary_" + Date.now();
    const textBoundary = "text_boundary_" + Date.now();
    const invoiceNumber = invoice.number || invoiceId;
    const fromName = settings.companyName || "Invoice";
    const fromEmail = settings.gmailEmail;
    const replyToEmail = settings.companyEmail || settings.gmailEmail;

    const emailBody =
      message || `Please find attached invoice #${invoiceNumber}.`;
    const htmlBody = `<html><body><p>${emailBody.replace(
      /\n/g,
      "<br>"
    )}</p></body></html>`;

    const emailLines = [
      `To: ${recipientEmail}`,
      `From: "${fromName}" <${fromEmail}>`,
      `Reply-To: ${replyToEmail}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      `Message-ID: <${invoiceId}.${Date.now()}@gmail.com>`,
      `Date: ${new Date().toUTCString()}`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      `Content-Type: multipart/alternative; boundary="${textBoundary}"`,
      "",
      `--${textBoundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: quoted-printable",
      "",
      emailBody,
      "",
      `--${textBoundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: quoted-printable",
      "",
      htmlBody,
      "",
      `--${textBoundary}--`,
      "",
      `--${boundary}`,
      `Content-Type: application/pdf; name="invoice-${invoiceNumber}.pdf"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="invoice-${invoiceNumber}.pdf"`,
      "",
      pdfBase64,
      `--${boundary}--`,
    ];

    const email = emailLines.join("\r\n");
    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });

    // Update invoice with sent status
    await db.collection("invoices").doc(invoiceId).update({
      emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      emailSentTo: recipientEmail,
    });

    res.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      error: "Failed to send email",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Invoice renderer service running on port ${PORT}`);
});
