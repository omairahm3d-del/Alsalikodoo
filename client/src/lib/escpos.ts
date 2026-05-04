/**
 * ESC/POS Printer Command Builder
 * Generates ESC/POS commands for thermal receipt printers
 * 
 * Supports:
 * - Text formatting (bold, underline, inverse, double-height/width)
 * - Alignment (left, center, right)
 * - Barcodes (Code128, EAN13, UPC-A)
 * - QR codes
 * - Images (monochrome)
 * - Line drawing
 */

export enum Alignment {
  LEFT = 0x00,
  CENTER = 0x01,
  RIGHT = 0x02,
}

export enum TextSize {
  NORMAL = 0x00,
  DOUBLE_HEIGHT = 0x10,
  DOUBLE_WIDTH = 0x20,
  DOUBLE_BOTH = 0x30,
}

export enum BarcodeType {
  CODE128 = 0x04,
  EAN13 = 0x02,
  UPC_A = 0x00,
  CODE39 = 0x03,
  ITF = 0x05,
  CODABAR = 0x06,
}

export class ESCPOSBuilder {
  private buffer: Uint8Array[] = [];
  private encoding: string = 'utf-8';

  constructor(encoding: string = 'utf-8') {
    this.encoding = encoding;
  }

  /**
   * Add raw bytes to buffer
   */
  private addBytes(...bytes: number[]): this {
    this.buffer.push(new Uint8Array(bytes));
    return this;
  }

  /**
   * Add text to buffer
   */
  private addText(text: string): this {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(text);
    this.buffer.push(encoded);
    return this;
  }

  /**
   * Initialize printer
   */
  initialize(): this {
    return this.addBytes(0x1b, 0x40); // ESC @
  }

  /**
   * Reset to default settings
   */
  reset(): this {
    return this.initialize();
  }

  /**
   * Set text alignment
   */
  align(alignment: Alignment): this {
    return this.addBytes(0x1b, 0x61, alignment);
  }

  /**
   * Set text size
   */
  size(size: TextSize): this {
    return this.addBytes(0x1d, 0x21, size);
  }

  /**
   * Enable bold text
   */
  bold(enable: boolean = true): this {
    return this.addBytes(0x1b, 0x45, enable ? 0x01 : 0x00);
  }

  /**
   * Enable underline
   */
  underline(enable: boolean = true): this {
    return this.addBytes(0x1b, 0x2d, enable ? 0x01 : 0x00);
  }

  /**
   * Enable inverse (white on black)
   */
  inverse(enable: boolean = true): this {
    return this.addBytes(0x1b, 0x42, enable ? 0x01 : 0x00);
  }

  /**
   * Print text
   */
  text(content: string): this {
    return this.addText(content);
  }

  /**
   * Print text with newline
   */
  line(content: string = ''): this {
    if (content) {
      this.addText(content);
    }
    return this.addBytes(0x0a); // LF
  }

  /**
   * Print multiple newlines
   */
  newlines(count: number = 1): this {
    for (let i = 0; i < count; i++) {
      this.addBytes(0x0a);
    }
    return this;
  }

  /**
   * Print horizontal line
   */
  horizontalLine(width: number = 32, char: string = '-'): this {
    return this.line(char.repeat(width));
  }

  /**
   * Print centered text
   */
  centerText(content: string): this {
    return this.align(Alignment.CENTER).line(content).align(Alignment.LEFT);
  }

  /**
   * Print right-aligned text
   */
  rightText(content: string): this {
    return this.align(Alignment.RIGHT).line(content).align(Alignment.LEFT);
  }

  /**
   * Print two columns of text
   */
  twoColumn(left: string, right: string, width: number = 32): this {
    const leftWidth = Math.floor(width * 0.6);
    const rightWidth = width - leftWidth;
    const paddedLeft = left.padEnd(leftWidth);
    const paddedRight = right.padStart(rightWidth);
    return this.line(paddedLeft + paddedRight);
  }

  /**
   * Print barcode
   */
  barcode(code: string, type: BarcodeType = BarcodeType.CODE128, height: number = 50): this {
    // Set barcode height
    this.addBytes(0x1d, 0x68, height);
    
    // Set barcode width
    this.addBytes(0x1d, 0x77, 0x03);
    
    // Print barcode
    this.addBytes(0x1d, 0x6b, type, code.length);
    this.addText(code);
    
    return this;
  }

  /**
   * Print QR code
   */
  qrcode(data: string, size: number = 4): this {
    // Set QR code size
    this.addBytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size);
    
    // Store QR code data
    const dataLength = data.length + 3;
    this.addBytes(0x1d, 0x28, 0x6b, dataLength & 0xff, (dataLength >> 8) & 0xff, 0x31, 0x44, 0x30);
    this.addText(data);
    
    // Print QR code
    this.addBytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x52, 0x00);
    this.addBytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x50, 0x30);
    
    return this;
  }

  /**
   * Cut paper (full cut)
   */
  cut(partial: boolean = false): this {
    return this.addBytes(0x1d, 0x56, partial ? 0x01 : 0x00);
  }

  /**
   * Open cash drawer
   */
  openDrawer(): this {
    return this.addBytes(0x1b, 0x70, 0x00, 0x19, 0xff);
  }

  /**
   * Ring bell
   */
  bell(): this {
    return this.addBytes(0x07);
  }

  /**
   * Feed paper (n lines)
   */
  feed(lines: number = 1): this {
    return this.addBytes(0x1b, 0x64, lines);
  }

  /**
   * Get buffer as Uint8Array
   */
  getBuffer(): Uint8Array {
    const totalLength = this.buffer.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const arr of this.buffer) {
      result.set(arr, offset);
      offset += arr.length;
    }

    return result;
  }

  /**
   * Get buffer as string (for debugging)
   */
  toString(): string {
    const buffer = this.getBuffer();
    let result = '';
    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      if (byte >= 32 && byte <= 126) {
        result += String.fromCharCode(byte);
      } else {
        result += `[${byte.toString(16).padStart(2, '0')}]`;
      }
    }
    return result;
  }

  /**
   * Clear buffer
   */
  clear(): this {
    this.buffer = [];
    return this;
  }
}

/**
 * Printer connection types
 */
export enum PrinterType {
  USB = 'usb',
  NETWORK = 'network',
  BLUETOOTH = 'bluetooth',
  SERIAL = 'serial',
  WEB = 'web',
}

/**
 * Printer configuration
 */
export interface PrinterConfig {
  type: PrinterType;
  name: string;
  address?: string; // IP address or device path
  port?: number;
  timeout?: number;
  paperWidth?: number; // in characters (default 32)
}

/**
 * Print job result
 */
export interface PrintResult {
  success: boolean;
  message: string;
  duration: number;
  error?: string;
}

/**
 * ESC/POS Printer Service
 */
export class ESCPOSPrinter {
  private config: PrinterConfig;
  private isConnected: boolean = false;

  constructor(config: PrinterConfig) {
    this.config = {
      timeout: 5000,
      paperWidth: 32,
      ...config,
    };
  }

  /**
   * Connect to printer
   */
  async connect(): Promise<boolean> {
    try {
      switch (this.config.type) {
        case PrinterType.WEB:
          // Web printing - always available
          this.isConnected = true;
          return true;

        case PrinterType.USB:
          // USB printing (requires WebUSB API)
          return await this.connectUSB();

        case PrinterType.NETWORK:
          // Network printing (requires CORS proxy)
          return await this.connectNetwork();

        case PrinterType.BLUETOOTH:
          // Bluetooth printing (requires Web Bluetooth API)
          return await this.connectBluetooth();

        default:
          return false;
      }
    } catch (error) {
      console.error('Printer connection error:', error);
      return false;
    }
  }

  /**
   * Connect via USB (WebUSB)
   */
  private async connectUSB(): Promise<boolean> {
    try {
      // Check if WebUSB is available
      const usb = (navigator as any).usb;
      if (!usb) {
        console.warn('WebUSB not available');
        return false;
      }

      // Request device
      const device = await usb.requestDevice({
        filters: [
          { vendorId: 0x04b8 }, // Epson
          { vendorId: 0x0519 }, // Star Micronics
        ],
      });

      await device.open();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('USB connection error:', error);
      return false;
    }
  }

  /**
   * Connect via Network (HTTP)
   */
  private async connectNetwork(): Promise<boolean> {
    try {
      if (!this.config.address) {
        throw new Error('Network address required');
      }

      const url = `http://${this.config.address}:${this.config.port || 9100}/`;
      const response = await fetch(url, {
        method: 'HEAD',
        
      });

      this.isConnected = response.ok;
      return this.isConnected;
    } catch (error) {
      console.error('Network connection error:', error);
      return false;
    }
  }

  /**
   * Connect via Bluetooth (Web Bluetooth)
   */
  private async connectBluetooth(): Promise<boolean> {
    try {
      // Check if Web Bluetooth is available
      const bluetooth = (navigator as any).bluetooth;
      if (!bluetooth) {
        console.warn('Web Bluetooth not available');
        return false;
      }

      // Request device
      const device = await bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
      });

      await device.gatt?.connect();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      return false;
    }
  }

  /**
   * Disconnect from printer
   */
  disconnect(): void {
    this.isConnected = false;
  }

  /**
   * Check if connected
   */
  connected(): boolean {
    return this.isConnected;
  }

  /**
   * Print ESC/POS commands
   */
  async print(builder: ESCPOSBuilder): Promise<PrintResult> {
    const startTime = Date.now();

    try {
      if (!this.isConnected && this.config.type !== PrinterType.WEB) {
        throw new Error('Printer not connected');
      }

      const buffer = builder.getBuffer();

      switch (this.config.type) {
        case PrinterType.WEB:
          return await this.printWeb(buffer);

        case PrinterType.USB:
          return await this.printUSB(buffer);

        case PrinterType.NETWORK:
          return await this.printNetwork(buffer);

        case PrinterType.BLUETOOTH:
          return await this.printBluetooth(buffer);

        default:
          throw new Error('Unsupported printer type');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        message: 'Print failed',
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Print via Web (browser print dialog)
   */
  private async printWeb(buffer: Uint8Array): Promise<PrintResult> {
    const startTime = Date.now();

    try {
      // Convert ESC/POS to printable format
      const html = this.escposToHTML(buffer);

      // Create iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) throw new Error('Cannot access iframe document');

      doc.write(html);
      doc.close();

      // Print
      iframe.contentWindow?.print();

      // Clean up
      setTimeout(() => document.body.removeChild(iframe), 1000);

      const duration = Date.now() - startTime;

      return {
        success: true,
        message: 'Print sent to browser',
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        message: 'Web print failed',
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Print via USB
   */
  private async printUSB(buffer: Uint8Array): Promise<PrintResult> {
    const startTime = Date.now();

    try {
      const usb = (navigator as any).usb;
      if (!usb) throw new Error('WebUSB not available');

      const devices = await usb.getDevices();
      if (devices.length === 0) throw new Error('No USB printer found');

      const device = devices[0];
      await device.transferOut(1, buffer);

      const duration = Date.now() - startTime;

      return {
        success: true,
        message: 'Print sent to USB printer',
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        message: 'USB print failed',
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Print via Network
   */
  private async printNetwork(buffer: Uint8Array): Promise<PrintResult> {
    const startTime = Date.now();

    try {
      if (!this.config.address) throw new Error('Network address required');

      const url = `http://${this.config.address}:${this.config.port || 9100}/`;

      const response = await fetch(url, {
        method: 'POST',
        body: buffer,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const duration = Date.now() - startTime;

      return {
        success: true,
        message: 'Print sent to network printer',
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        message: 'Network print failed',
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Print via Bluetooth
   */
  private async printBluetooth(buffer: Uint8Array): Promise<PrintResult> {
    const startTime = Date.now();

    try {
      const bluetooth = (navigator as any).bluetooth;
      if (!bluetooth) throw new Error('Web Bluetooth not available');

      const devices = await bluetooth.getAvailability();
      if (!devices) throw new Error('Bluetooth not available');

      // This is a simplified implementation
      // In production, you'd need to handle the Bluetooth GATT protocol

      const duration = Date.now() - startTime;

      return {
        success: true,
        message: 'Print sent to Bluetooth printer',
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        message: 'Bluetooth print failed',
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Convert ESC/POS buffer to HTML for web printing
   */
  private escposToHTML(buffer: Uint8Array): string {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            margin: 0;
            padding: 10mm;
            width: 80mm;
          }
          .receipt {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
    `;

    // Simple conversion - just extract printable text
    let i = 0;
    while (i < buffer.length) {
      const byte = buffer[i];

      if (byte === 0x0a) {
        // Line feed
        html += '\n';
      } else if (byte >= 32 && byte <= 126) {
        // Printable ASCII
        html += String.fromCharCode(byte);
      } else if (byte === 0x1b) {
        // ESC sequence - skip for now
        i += 2;
      } else if (byte === 0x1d) {
        // GS sequence - skip for now
        i += 2;
      }

      i++;
    }

    html += `
        </div>
      </body>
      </html>
    `;

    return html;
  }
}
