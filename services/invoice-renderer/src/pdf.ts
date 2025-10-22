import puppeteer from "puppeteer";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  number: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
}

export interface Client {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface CompanyDetails {
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  bankDetails?: string;
  quantityLabel?: string;
  unitPriceLabel?: string;
  footerNote?: string;
}

/**
 * Generate invoice HTML template
 */
function generateInvoiceHTML(
  invoice: Invoice,
  client?: Client,
  company?: CompanyDetails
): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoice.currency || "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const itemsHTML = invoice.items
    .map((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
          item.description
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${
          item.quantity
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(
          item.unitPrice
        )}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(
          lineTotal
        )}</td>
      </tr>
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #111827;
          line-height: 1.6;
          padding: 40px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #2563eb;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-number {
          font-size: 20px;
          font-weight: bold;
          color: #111827;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        .client-info {
          font-size: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
        }
        th {
          background-color: #f3f4f6;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          color: #374151;
          border-bottom: 2px solid #d1d5db;
        }
        th:nth-child(2), td:nth-child(2) {
          text-align: center;
        }
        th:nth-child(3), td:nth-child(3), th:nth-child(4), td:nth-child(4) {
          text-align: right;
        }
        .totals {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }
        .totals-table {
          width: 300px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 15px;
        }
        .totals-row.subtotal {
          color: #6b7280;
        }
        .totals-row.total {
          border-top: 2px solid #d1d5db;
          padding-top: 12px;
          margin-top: 8px;
          font-size: 18px;
          font-weight: bold;
        }
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px 40px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
          background-color: white;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;
        }
        .status-draft { background-color: #f3f4f6; color: #374151; }
        .status-sent { background-color: #dbeafe; color: #1e40af; }
        .status-paid { background-color: #d1fae5; color: #065f46; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">Invoice</div>
        </div>
        <div class="invoice-details">
          <div class="invoice-number">Invoice ${invoice.number}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div class="section">
          <div class="section-title">Bill To</div>
          <div class="client-info">
            <div style="font-weight: 600; font-size: 16px;">${
              client?.name || "N/A"
            }</div>
            ${client?.email ? `<div>${client.email}</div>` : ""}
            ${client?.phone ? `<div>${client.phone}</div>` : ""}
            ${
              client?.address
                ? `<div style="margin-top: 4px;">${client.address.replace(
                    /\n/g,
                    "<br>"
                  )}</div>`
                : ""
            }
            ${
              client?.taxId
                ? `<div style="margin-top: 4px;">Tax ID: ${client.taxId}</div>`
                : ""
            }
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">From</div>
          <div class="client-info">
            ${
              company?.companyName
                ? `<div style="font-weight: 600; font-size: 16px;">${company.companyName}</div>`
                : ""
            }
            ${company?.companyEmail ? `<div>${company.companyEmail}</div>` : ""}
            ${company?.companyPhone ? `<div>${company.companyPhone}</div>` : ""}
            ${
              company?.companyAddress
                ? `<div style="margin-top: 4px;">${company.companyAddress.replace(
                    /\n/g,
                    "<br>"
                  )}</div>`
                : ""
            }
          </div>
        </div>
        
        <div class="section" style="text-align: right;">
          <div class="section-title">Invoice Date</div>
          <div>${formatDate(invoice.issueDate)}</div>
          <div class="section-title" style="margin-top: 16px;">Due Date</div>
          <div>${formatDate(invoice.dueDate)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>${company?.quantityLabel || "Quantity"}</th>
            <th>${company?.unitPriceLabel || "Unit Price"}</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; margin-top: 30px;">
        ${
          company?.bankDetails
            ? `
        <div style="flex: 1; max-width: 50%;">
          <div class="section-title">Bank Details</div>
          <div style="font-size: 13px; line-height: 1.8; color: #374151; white-space: pre-line;">
${company.bankDetails}
          </div>
        </div>
        `
            : ""
        }
        <div class="totals">
          <div class="totals-table">
            <div class="totals-row subtotal">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            <div class="totals-row subtotal">
              <span>Tax:</span>
              <span>${formatCurrency(invoice.tax)}</span>
            </div>
            <div class="totals-row total">
              <span>Total:</span>
              <span>${formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        ${company?.footerNote ? `<p>${company.footerNote}</p>` : ""}
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate PDF from invoice data
 */
export async function generatePDF(
  invoice: Invoice,
  client?: Client,
  company?: CompanyDetails
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();
    const html = generateInvoiceHTML(invoice, client, company);

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
