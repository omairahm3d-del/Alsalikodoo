/**
 * Receipt Template Builder
 * Generates formatted receipts for POS orders
 */

import { ESCPOSBuilder, Alignment, TextSize } from './escpos';

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
}

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  receiptNumber: string;
  date: Date;
  cashier?: string;
  customer?: string;
  items: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  barcode?: string;
  qrcode?: string;
}

/**
 * Generate receipt in ESC/POS format
 */
export function generateReceipt(data: ReceiptData, paperWidth: number = 32): ESCPOSBuilder {
  const builder = new ESCPOSBuilder();

  // Initialize printer
  builder.initialize();

  // Store header
  builder.align(Alignment.CENTER);
  builder.size(TextSize.DOUBLE_HEIGHT);
  builder.bold();
  builder.line(data.storeName);
  builder.bold(false);
  builder.size(TextSize.NORMAL);

  if (data.storeAddress) {
    builder.line(data.storeAddress);
  }

  if (data.storePhone) {
    builder.line(`Tel: ${data.storePhone}`);
  }

  if (data.storeEmail) {
    builder.line(`Email: ${data.storeEmail}`);
  }

  builder.newlines();

  // Receipt info
  builder.align(Alignment.LEFT);
  builder.line(`Receipt #: ${data.receiptNumber}`);
  builder.line(`Date: ${formatDate(data.date)}`);
  builder.line(`Time: ${formatTime(data.date)}`);

  if (data.cashier) {
    builder.line(`Cashier: ${data.cashier}`);
  }

  if (data.customer) {
    builder.line(`Customer: ${data.customer}`);
  }

  builder.newlines();

  // Items header
  builder.horizontalLine(paperWidth);
  builder.twoColumn('Item', 'Amount', paperWidth);
  builder.twoColumn('Qty', 'Price', paperWidth);
  builder.horizontalLine(paperWidth);

  // Items
  for (const item of data.items) {
    const itemName = truncateText(item.name, Math.floor(paperWidth * 0.6));
    builder.line(itemName);

    const qtyStr = `${item.quantity}x`;
    const priceStr = formatCurrency(item.unitPrice);
    const totalStr = formatCurrency(item.total);

    const leftPart = `${qtyStr} @ ${priceStr}`;
    const rightPart = totalStr;

    builder.twoColumn(leftPart, rightPart, paperWidth);

    if (item.taxRate && item.taxRate > 0) {
      const taxAmount = item.total * (item.taxRate / 100);
      builder.line(`  Tax (${item.taxRate}%): ${formatCurrency(taxAmount)}`);
    }
  }

  builder.horizontalLine(paperWidth);

  // Totals
  builder.newlines();
  builder.twoColumn('Subtotal:', formatCurrency(data.subtotal), paperWidth);
  builder.twoColumn('Tax:', formatCurrency(data.taxAmount), paperWidth);

  builder.bold();
  builder.size(TextSize.DOUBLE_HEIGHT);
  builder.twoColumn('TOTAL:', formatCurrency(data.total), paperWidth);
  builder.bold(false);
  builder.size(TextSize.NORMAL);

  builder.newlines();

  // Payment info
  if (data.paymentMethod) {
    builder.line(`Payment: ${data.paymentMethod}`);
  }

  if (data.reference) {
    builder.line(`Ref: ${data.reference}`);
  }

  // Barcode
  if (data.barcode) {
    builder.newlines();
    builder.align(Alignment.CENTER);
    builder.barcode(data.barcode);
    builder.align(Alignment.LEFT);
  }

  // QR Code
  if (data.qrcode) {
    builder.newlines();
    builder.align(Alignment.CENTER);
    builder.qrcode(data.qrcode);
    builder.align(Alignment.LEFT);
  }

  // Footer notes
  if (data.notes) {
    builder.newlines();
    builder.align(Alignment.CENTER);
    builder.line(data.notes);
    builder.align(Alignment.LEFT);
  }

  // Thank you message
  builder.newlines();
  builder.align(Alignment.CENTER);
  builder.bold();
  builder.line('Thank You!');
  builder.bold(false);
  builder.line('Please visit again');
  builder.align(Alignment.LEFT);

  // Footer
  builder.newlines();
  builder.align(Alignment.CENTER);
  builder.line('Powered by Odoo POS');
  builder.align(Alignment.LEFT);

  // Paper cut
  builder.newlines();
  builder.cut();

  return builder;
}

/**
 * Generate compact receipt (smaller format)
 */
export function generateCompactReceipt(data: ReceiptData): ESCPOSBuilder {
  const builder = new ESCPOSBuilder();

  builder.initialize();
  builder.align(Alignment.CENTER);

  // Header
  builder.bold();
  builder.line(data.storeName);
  builder.bold(false);

  if (data.storeAddress) {
    builder.line(data.storeAddress);
  }

  builder.newlines();

  // Receipt info (compact)
  builder.align(Alignment.LEFT);
  builder.line(`#${data.receiptNumber} | ${formatDate(data.date)}`);

  if (data.customer) {
    builder.line(`Customer: ${data.customer}`);
  }

  builder.newlines();

  // Items (very compact)
  for (const item of data.items) {
    const name = truncateText(item.name, 20);
    builder.twoColumn(
      `${item.quantity}x ${name}`,
      formatCurrency(item.total),
      32
    );
  }

  builder.horizontalLine(32);

  // Totals (compact)
  builder.align(Alignment.RIGHT);
  builder.line(`Subtotal: ${formatCurrency(data.subtotal)}`);
  builder.line(`Tax: ${formatCurrency(data.taxAmount)}`);
  builder.bold();
  builder.line(`Total: ${formatCurrency(data.total)}`);
  builder.bold(false);

  builder.newlines();
  builder.align(Alignment.CENTER);
  builder.line('Thank You!');

  builder.cut();

  return builder;
}

/**
 * Generate invoice-style receipt
 */
export function generateInvoiceReceipt(data: ReceiptData): ESCPOSBuilder {
  const builder = new ESCPOSBuilder();

  builder.initialize();

  // Header
  builder.align(Alignment.CENTER);
  builder.size(TextSize.DOUBLE_HEIGHT);
  builder.bold();
  builder.line('INVOICE');
  builder.bold(false);
  builder.size(TextSize.NORMAL);

  builder.newlines();
  builder.line(`${data.storeName}`);

  if (data.storeAddress) {
    builder.line(data.storeAddress);
  }

  builder.newlines();

  // Invoice details
  builder.align(Alignment.LEFT);
  builder.line(`Invoice No.: ${data.receiptNumber}`);
  builder.line(`Date: ${formatDate(data.date)} ${formatTime(data.date)}`);

  if (data.customer) {
    builder.newlines();
    builder.bold();
    builder.line('BILL TO:');
    builder.bold(false);
    builder.line(data.customer);
  }

  builder.newlines();
  builder.horizontalLine(32);

  // Table header
  builder.align(Alignment.LEFT);
  builder.bold();
  builder.twoColumn('Description', 'Amount', 32);
  builder.bold(false);
  builder.horizontalLine(32);

  // Items with details
  for (const item of data.items) {
    builder.line(item.name);
    builder.twoColumn(
      `${item.quantity} x ${formatCurrency(item.unitPrice)}`,
      formatCurrency(item.total),
      32
    );

    if (item.taxRate && item.taxRate > 0) {
      const taxAmount = item.total * (item.taxRate / 100);
      builder.line(`  Tax (${item.taxRate}%): ${formatCurrency(taxAmount)}`);
    }

    builder.newlines();
  }

  builder.horizontalLine(32);

  // Summary
  builder.align(Alignment.RIGHT);
  builder.line(`Subtotal: ${formatCurrency(data.subtotal)}`);
  builder.line(`Tax: ${formatCurrency(data.taxAmount)}`);

  builder.bold();
  builder.size(TextSize.DOUBLE_HEIGHT);
  builder.line(`Total: ${formatCurrency(data.total)}`);
  builder.bold(false);
  builder.size(TextSize.NORMAL);

  builder.newlines();

  // Payment
  if (data.paymentMethod) {
    builder.align(Alignment.LEFT);
    builder.line(`Payment Method: ${data.paymentMethod}`);
  }

  if (data.reference) {
    builder.line(`Transaction Ref: ${data.reference}`);
  }

  // QR code
  if (data.qrcode) {
    builder.newlines();
    builder.align(Alignment.CENTER);
    builder.qrcode(data.qrcode);
  }

  // Footer
  builder.newlines();
  builder.align(Alignment.CENTER);
  builder.line('Thank you for your business!');

  if (data.notes) {
    builder.newlines();
    builder.line(data.notes);
  }

  builder.newlines();
  builder.cut();

  return builder;
}

/**
 * Format date as DD/MM/YYYY
 */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format time as HH:MM:SS
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format number as currency
 */
function formatCurrency(amount: number, currency: string = 'AED'): string {
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * Truncate text to specified length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate receipt as HTML for preview
 */
export function generateReceiptHTML(data: ReceiptData): string {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt #${data.receiptNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          background: #f5f5f5;
          padding: 20px;
        }
        
        .receipt {
          width: 80mm;
          background: white;
          margin: 0 auto;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          font-size: 12px;
          line-height: 1.4;
        }
        
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        
        .store-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .store-info {
          font-size: 10px;
          color: #666;
        }
        
        .receipt-info {
          margin: 10px 0;
          font-size: 11px;
        }
        
        .items {
          margin: 15px 0;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 10px 0;
        }
        
        .item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 11px;
        }
        
        .item-name {
          flex: 1;
        }
        
        .item-price {
          text-align: right;
          min-width: 50px;
        }
        
        .totals {
          margin: 10px 0;
          text-align: right;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 11px;
        }
        
        .total-amount {
          font-size: 14px;
          font-weight: bold;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #000;
        }
        
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 10px;
          color: #666;
        }
        
        .qrcode {
          text-align: center;
          margin: 15px 0;
        }
        
        .qrcode img {
          max-width: 150px;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .receipt {
            width: 100%;
            box-shadow: none;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="store-name">${escapeHtml(data.storeName)}</div>
          ${data.storeAddress ? `<div class="store-info">${escapeHtml(data.storeAddress)}</div>` : ''}
          ${data.storePhone ? `<div class="store-info">Tel: ${escapeHtml(data.storePhone)}</div>` : ''}
        </div>
        
        <div class="receipt-info">
          <div>Receipt #: ${escapeHtml(data.receiptNumber)}</div>
          <div>Date: ${formatDate(data.date)} ${formatTime(data.date)}</div>
          ${data.cashier ? `<div>Cashier: ${escapeHtml(data.cashier)}</div>` : ''}
          ${data.customer ? `<div>Customer: ${escapeHtml(data.customer)}</div>` : ''}
        </div>
        
        <div class="items">
          ${data.items.map(item => `
            <div class="item">
              <div class="item-name">${escapeHtml(item.name)}</div>
              <div class="item-price">${formatCurrency(item.total)}</div>
            </div>
            <div style="font-size: 10px; color: #666; margin-bottom: 5px;">
              ${item.quantity} x ${formatCurrency(item.unitPrice)}
            </div>
          `).join('')}
        </div>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(data.subtotal)}</span>
          </div>
          <div class="total-row">
            <span>Tax:</span>
            <span>${formatCurrency(data.taxAmount)}</span>
          </div>
          <div class="total-amount">
            <div style="display: flex; justify-content: space-between;">
              <span>TOTAL:</span>
              <span>${formatCurrency(data.total)}</span>
            </div>
          </div>
        </div>
        
        ${data.paymentMethod ? `<div class="receipt-info">Payment: ${escapeHtml(data.paymentMethod)}</div>` : ''}
        ${data.reference ? `<div class="receipt-info">Ref: ${escapeHtml(data.reference)}</div>` : ''}
        
        <div class="footer">
          <div style="margin-top: 10px;">Thank you for your business!</div>
          ${data.notes ? `<div>${escapeHtml(data.notes)}</div>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
