# ESC/POS Printing Service — Complete Guide

## Overview

The ESC/POS printing service provides comprehensive receipt printing capabilities for the Odoo POS mobile app. It supports multiple printer types, receipt formats, and printing methods.

## Features

✓ **Multiple Printer Types**
- USB (WebUSB API)
- Network/Ethernet (HTTP)
- Bluetooth (Web Bluetooth API)
- Web (Browser print dialog)
- Serial (with adapter)

✓ **Receipt Formats**
- Standard receipt (full details)
- Compact receipt (minimal format)
- Invoice receipt (detailed billing)

✓ **Advanced Features**
- Barcode printing (Code128, EAN13, UPC-A, Code39, ITF, CODABAR)
- QR code printing
- Text formatting (bold, underline, inverse, sizing)
- Alignment (left, center, right)
- Line drawing and spacing
- Paper cutting
- Cash drawer control
- Bell/buzzer

✓ **Integration**
- React hooks for easy integration
- Automatic printer detection
- Connection management
- Error handling and retry logic
- Print preview and HTML download

## File Structure

```
client/src/lib/
├── escpos.ts          # ESC/POS command builder and printer service
├── receipt.ts         # Receipt template builder

client/src/hooks/
└── usePrinting.ts     # React hooks for printing
```

## Quick Start

### 1. Initialize Printer

```typescript
import { usePrinting } from '@/hooks/usePrinting';
import { PrinterType } from '@/lib/escpos';

const { initializePrinter, printReceipt } = usePrinting();

// Connect to network printer
await initializePrinter({
  type: PrinterType.NETWORK,
  name: 'Main Printer',
  address: '192.168.1.100',
  port: 9100,
});
```

### 2. Print Receipt

```typescript
import { ReceiptData } from '@/lib/receipt';

const receiptData: ReceiptData = {
  storeName: 'Al Salik Retail',
  storeAddress: '123 Main St, Dubai',
  storePhone: '+971-4-123-4567',
  receiptNumber: 'REC-001234',
  date: new Date(),
  cashier: 'Ahmed',
  customer: 'John Doe',
  items: [
    {
      name: 'Coffee',
      quantity: 2,
      unitPrice: 15.00,
      total: 30.00,
      taxRate: 5,
    },
    {
      name: 'Sandwich',
      quantity: 1,
      unitPrice: 25.00,
      total: 25.00,
      taxRate: 5,
    },
  ],
  subtotal: 55.00,
  taxAmount: 2.75,
  total: 57.75,
  paymentMethod: 'Card',
  reference: 'TXN-98765432',
};

// Print standard receipt
const result = await printReceipt(receiptData, 'standard');

if (result.success) {
  console.log('Receipt printed successfully');
} else {
  console.error('Print failed:', result.error);
}
```

### 3. Preview Receipt

```typescript
const { previewReceipt } = usePrinting();

// Open receipt in new window for preview
previewReceipt(receiptData);
```

## Printer Types

### USB Printer (WebUSB)

```typescript
const { initializePrinter } = usePrinting();

await initializePrinter({
  type: PrinterType.USB,
  name: 'Epson TM-T20',
});
```

**Requirements:**
- Browser with WebUSB support (Chrome, Edge)
- USB printer connected to device
- User permission to access USB device

**Supported Printers:**
- Epson TM series
- Star Micronics
- Other ESC/POS compatible USB printers

### Network Printer (Ethernet)

```typescript
await initializePrinter({
  type: PrinterType.NETWORK,
  name: 'Network Printer',
  address: '192.168.1.100',
  port: 9100,
  timeout: 5000,
});
```

**Requirements:**
- Printer connected to network
- Printer IP address and port
- Network connectivity
- No CORS restrictions (or CORS proxy)

**Common Ports:**
- 9100: Standard ESC/POS port
- 515: LPD protocol
- 631: CUPS protocol

### Bluetooth Printer

```typescript
await initializePrinter({
  type: PrinterType.BLUETOOTH,
  name: 'Bluetooth Printer',
});
```

**Requirements:**
- Browser with Web Bluetooth support (Chrome, Edge)
- Bluetooth printer paired with device
- User permission to access Bluetooth

### Web Printer (Browser)

```typescript
await initializePrinter({
  type: PrinterType.WEB,
  name: 'Browser Print',
});
```

**Features:**
- No hardware required
- Uses browser print dialog
- Works on all devices
- User can choose printer

## Receipt Formats

### Standard Receipt

Full-featured receipt with all details.

```typescript
const result = await printReceipt(receiptData, 'standard');
```

**Includes:**
- Store header with contact info
- Receipt number and date/time
- Cashier and customer info
- Itemized list with quantities and prices
- Tax breakdown
- Total amount
- Payment method and reference
- Barcode/QR code (if provided)
- Thank you message

### Compact Receipt

Minimal receipt for quick transactions.

```typescript
const result = await printReceipt(receiptData, 'compact');
```

**Includes:**
- Store name and address
- Receipt number and date
- Customer name (if provided)
- Itemized list (name and total only)
- Subtotal, tax, and total
- Thank you message

### Invoice Receipt

Detailed invoice-style receipt for formal billing.

```typescript
const result = await printReceipt(receiptData, 'invoice');
```

**Includes:**
- "INVOICE" header
- Store details
- Invoice number and date
- Bill to customer
- Itemized table with descriptions
- Tax details per item
- Summary totals
- Payment method and transaction reference
- QR code (if provided)

## Advanced Usage

### Custom Receipt Builder

```typescript
import { ESCPOSBuilder, Alignment, TextSize } from '@/lib/escpos';

const builder = new ESCPOSBuilder();

builder
  .initialize()
  .align(Alignment.CENTER)
  .size(TextSize.DOUBLE_HEIGHT)
  .bold()
  .line('My Store')
  .bold(false)
  .size(TextSize.NORMAL)
  .newlines()
  .align(Alignment.LEFT)
  .line('Item 1: $10.00')
  .line('Item 2: $20.00')
  .horizontalLine(32)
  .twoColumn('Total:', '$30.00')
  .newlines()
  .cut();

// Print with custom builder
const printer = new ESCPOSPrinter(config);
await printer.connect();
const result = await printer.print(builder);
```

### Barcode Printing

```typescript
import { BarcodeType } from '@/lib/escpos';

const builder = new ESCPOSBuilder();

builder
  .initialize()
  .line('Product Code:')
  .barcode('123456789012', BarcodeType.EAN13, 50)
  .cut();
```

**Supported Barcode Types:**
- `CODE128` - Most flexible, supports all ASCII characters
- `EAN13` - 13-digit barcode
- `UPC_A` - 12-digit barcode
- `CODE39` - Alphanumeric barcode
- `ITF` - Interleaved 2 of 5
- `CODABAR` - Numeric barcode

### QR Code Printing

```typescript
const builder = new ESCPOSBuilder();

builder
  .initialize()
  .align(Alignment.CENTER)
  .qrcode('https://example.com/receipt/123', 4)
  .cut();
```

### Multiple Printers

```typescript
import { usePrinterManager } from '@/hooks/usePrinting';

const { addPrinter, print, setActivePrinterId } = usePrinterManager();

// Add multiple printers
await addPrinter('main', {
  type: PrinterType.NETWORK,
  address: '192.168.1.100',
});

await addPrinter('backup', {
  type: PrinterType.USB,
});

// Switch between printers
setActivePrinterId('backup');

// Print with active printer
const result = await print(receiptData);
```

## Configuration

### Printer Config Options

```typescript
interface PrinterConfig {
  type: PrinterType;           // Printer type (USB, NETWORK, BLUETOOTH, WEB)
  name: string;                // Display name
  address?: string;            // IP address or device path
  port?: number;               // Port number (default: 9100 for network)
  timeout?: number;            // Connection timeout in ms (default: 5000)
  paperWidth?: number;         // Paper width in characters (default: 32)
}
```

### Receipt Data Options

```typescript
interface ReceiptData {
  storeName: string;           // Store/business name
  storeAddress?: string;       // Store address
  storePhone?: string;         // Store phone number
  storeEmail?: string;         // Store email
  receiptNumber: string;       // Receipt/transaction ID
  date: Date;                  // Transaction date/time
  cashier?: string;            // Cashier name
  customer?: string;           // Customer name
  items: ReceiptItem[];        // Line items
  subtotal: number;            // Subtotal amount
  taxAmount: number;           // Total tax
  total: number;               // Final total
  paymentMethod?: string;      // Payment method (Cash, Card, etc.)
  reference?: string;          // Transaction reference
  notes?: string;              // Additional notes
  barcode?: string;            // Barcode to print
  qrcode?: string;             // QR code data
}
```

## React Hooks

### usePrinting

Single printer management hook.

```typescript
const {
  isConnected,        // boolean - Connection status
  isPrinting,         // boolean - Printing in progress
  error,              // string | null - Last error
  lastPrintTime,      // number | null - Last successful print time
  initializePrinter,  // (config) => Promise<boolean>
  printReceipt,       // (data, format) => Promise<PrintResult>
  previewReceipt,     // (data) => void
  downloadReceipt,    // (data, filename) => void
  disconnect,         // () => void
} = usePrinting(config);
```

### usePrinterManager

Multiple printer management hook.

```typescript
const {
  printers,           // string[] - List of printer IDs
  activePrinterId,    // string | null - Active printer ID
  setActivePrinterId, // (id) => void
  addPrinter,         // (id, config) => Promise<boolean>
  removePrinter,      // (id) => void
  getActivePrinter,   // () => ESCPOSPrinter | null
  print,              // (data, format) => Promise<PrintResult>
} = usePrinterManager();
```

## Error Handling

```typescript
const { printReceipt, error } = usePrinting();

const result = await printReceipt(receiptData);

if (!result.success) {
  console.error('Print failed:', result.error);
  
  // Handle specific errors
  if (result.error?.includes('timeout')) {
    console.error('Printer connection timeout');
  } else if (result.error?.includes('not found')) {
    console.error('Printer not found');
  }
}
```

## Troubleshooting

### Printer Not Found

**Network Printer:**
- Verify IP address and port
- Check network connectivity
- Ensure printer is powered on
- Check firewall settings

**USB Printer:**
- Verify USB connection
- Check browser WebUSB support
- Grant USB permission when prompted

**Bluetooth Printer:**
- Verify Bluetooth is enabled
- Pair device in system settings
- Check browser Web Bluetooth support

### Print Quality Issues

- Adjust paper width setting
- Check printer alignment
- Verify font settings
- Test with different receipt format

### Timeout Errors

- Increase timeout value
- Check network connectivity
- Verify printer is responding
- Reduce print data size

## Best Practices

1. **Always check connection status** before printing
2. **Use error handling** for all print operations
3. **Test with preview first** before printing to hardware
4. **Implement retry logic** for network printers
5. **Use compact format** for high-volume printing
6. **Store receipt data** for reprinting if needed
7. **Validate receipt data** before printing
8. **Monitor print queue** for failed prints
9. **Implement print history** for audit trail
10. **Use QR codes** for digital receipt tracking

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebUSB | ✓ | ✗ | ✗ | ✓ |
| Web Bluetooth | ✓ | ✗ | ✓ | ✓ |
| Network (HTTP) | ✓ | ✓ | ✓ | ✓ |
| Web Print | ✓ | ✓ | ✓ | ✓ |

## Examples

### Complete POS Receipt

```typescript
import { usePrinting } from '@/hooks/usePrinting';
import { PrinterType } from '@/lib/escpos';

export function POSCheckout() {
  const { initializePrinter, printReceipt, previewReceipt } = usePrinting();

  const handlePrint = async () => {
    // Initialize printer on first use
    await initializePrinter({
      type: PrinterType.NETWORK,
      name: 'Main Printer',
      address: '192.168.1.100',
    });

    // Print receipt
    const result = await printReceipt(orderData, 'standard');

    if (result.success) {
      toast.success('Receipt printed');
    } else {
      toast.error(`Print failed: ${result.error}`);
    }
  };

  return (
    <div>
      <button onClick={handlePrint}>Print Receipt</button>
      <button onClick={() => previewReceipt(orderData)}>Preview</button>
    </div>
  );
}
```

### Multi-Printer Setup

```typescript
import { usePrinterManager } from '@/hooks/usePrinting';

export function PrinterSettings() {
  const { addPrinter, printers, activePrinterId, setActivePrinterId } = usePrinterManager();

  const handleAddPrinter = async (config) => {
    const success = await addPrinter(`printer-${Date.now()}`, config);
    if (success) {
      toast.success('Printer added');
    }
  };

  return (
    <div>
      <h3>Available Printers: {printers.length}</h3>
      <select value={activePrinterId || ''} onChange={(e) => setActivePrinterId(e.target.value)}>
        {printers.map((id) => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>
    </div>
  );
}
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify printer configuration
4. Test with web printer first
5. Check printer documentation

## References

- [ESC/POS Specification](https://www.epson-biz.com/pos-printers)
- [WebUSB API](https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API)
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [Thermal Printer Guide](https://www.epson.com/cgi-bin/Store/support/supportsearch.jsp)
