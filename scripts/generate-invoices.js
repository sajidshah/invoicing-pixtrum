// One-time script to generate invoices
// Run with: cd services/invoice-renderer && node ../../scripts/generate-invoices.js

const admin = require("firebase-admin");
require("dotenv").config();

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

const invoices = [
  {
    number: "174",
    issueDate: "2025-10-31",
    dueDate: "2025-10-31",
    description: "2025 Week 43 & 44 Salary",
    weeks: "43 & 44",
  },
  {
    number: "175",
    issueDate: "2025-11-14",
    dueDate: "2025-11-14",
    description: "2025 Week 45 & 46 Salary",
    weeks: "45 & 46",
  },
  {
    number: "176",
    issueDate: "2025-11-28",
    dueDate: "2025-11-28",
    description: "2025 Week 47 & 48 Salary",
    weeks: "47 & 48",
  },
  {
    number: "177",
    issueDate: "2025-12-12",
    dueDate: "2025-12-12",
    description: "2025 Week 49 & 50 Salary",
    weeks: "49 & 50",
  },
  {
    number: "178",
    issueDate: "2025-12-26",
    dueDate: "2025-12-26",
    description: "2025 Week 51 & 52 Salary",
    weeks: "51 & 52",
  },
];

const ownedBy = "yAHCIsHDn8Tk6EsMtDVchaphDQ43";
const clientId = "SGehFmrSBwVNCUHHCnj6";
const quantity = 80;
const unitPrice = 75;
const subtotal = quantity * unitPrice;
const taxRate = 0;
const tax = 0;
const total = subtotal;
const currency = "USD";
const status = "draft";

async function generateInvoices() {
  console.log("Starting invoice generation...\n");

  for (const invoice of invoices) {
    const invoiceData = {
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      clientId: clientId,
      ownedBy: ownedBy,
      items: [
        {
          description: invoice.description,
          quantity: quantity,
          unitPrice: unitPrice,
        },
      ],
      subtotal: subtotal,
      tax: taxRate,
      total: total,
      currency: currency,
      status: status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      const docRef = await db.collection("invoices").add(invoiceData);
      console.log(
        `✓ Created invoice ${invoice.number} for Week ${invoice.weeks}`
      );
      console.log(`  Issue Date: ${invoice.issueDate}`);
      console.log(`  Amount: $${total.toFixed(2)}`);
      console.log(`  ID: ${docRef.id}\n`);
    } catch (error) {
      console.error(`✗ Failed to create invoice ${invoice.number}:`, error);
    }
  }

  console.log("✅ All invoices created successfully!");
  process.exit(0);
}

generateInvoices().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
