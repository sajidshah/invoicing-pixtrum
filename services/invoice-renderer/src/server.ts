import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import admin from "firebase-admin";
import {
  generatePDF,
  type Invoice as InvoiceData,
  type Client as ClientData,
} from "./pdf";

type ExtendedInvoice = InvoiceData & { ownedBy: string; clientId: string };

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

app.listen(PORT, () => {
  console.log(`🚀 Invoice renderer service running on port ${PORT}`);
});
