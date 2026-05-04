import { useState, useCallback } from 'react';
import { ESCPOSPrinter, PrinterConfig, PrinterType, PrintResult } from '@/lib/escpos';
import { generateReceipt, generateCompactReceipt, generateInvoiceReceipt, ReceiptData, generateReceiptHTML } from '@/lib/receipt';

interface PrintingState {
  isConnected: boolean;
  isPrinting: boolean;
  error: string | null;
  lastPrintTime: number | null;
}

/**
 * Hook to manage printer connection and printing
 */
export function usePrinting(config?: PrinterConfig) {
  const [state, setState] = useState<PrintingState>({
    isConnected: false,
    isPrinting: false,
    error: null,
    lastPrintTime: null,
  });

  const [printer, setPrinter] = useState<ESCPOSPrinter | null>(null);

  // Initialize printer
  const initializePrinter = useCallback(
    async (printerConfig: PrinterConfig) => {
      try {
        const newPrinter = new ESCPOSPrinter(printerConfig);
        const connected = await newPrinter.connect();

        if (connected) {
          setPrinter(newPrinter);
          setState((prev) => ({
            ...prev,
            isConnected: true,
            error: null,
          }));
          return true;
        } else {
          setState((prev) => ({
            ...prev,
            isConnected: false,
            error: 'Failed to connect to printer',
          }));
          return false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          isConnected: false,
          error: errorMessage,
        }));
        return false;
      }
    },
    []
  );

  // Print receipt
  const printReceipt = useCallback(
    async (receiptData: ReceiptData, format: 'standard' | 'compact' | 'invoice' = 'standard'): Promise<PrintResult> => {
      if (!printer) {
        return {
          success: false,
          message: 'Printer not initialized',
          duration: 0,
          error: 'Printer not connected',
        };
      }

      setState((prev) => ({
        ...prev,
        isPrinting: true,
        error: null,
      }));

      try {
        let builder;

        switch (format) {
          case 'compact':
            builder = generateCompactReceipt(receiptData);
            break;
          case 'invoice':
            builder = generateInvoiceReceipt(receiptData);
            break;
          default:
            builder = generateReceipt(receiptData);
        }

        const result = await printer.print(builder);

        setState((prev) => ({
          ...prev,
          isPrinting: false,
          lastPrintTime: Date.now(),
          error: result.success ? null : result.error || null,
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        setState((prev) => ({
          ...prev,
          isPrinting: false,
          error: errorMessage,
        }));

        return {
          success: false,
          message: 'Print failed',
          duration: 0,
          error: errorMessage,
        };
      }
    },
    [printer]
  );

  // Print preview (web)
  const previewReceipt = useCallback(
    (receiptData: ReceiptData) => {
      const html = generateReceiptHTML(receiptData);

      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      }
    },
    []
  );

  // Download receipt as HTML
  const downloadReceipt = useCallback(
    (receiptData: ReceiptData, filename?: string) => {
      const html = generateReceiptHTML(receiptData);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `receipt-${receiptData.receiptNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    []
  );

  // Disconnect printer
  const disconnect = useCallback(() => {
    if (printer) {
      printer.disconnect();
      setPrinter(null);
      setState((prev) => ({
        ...prev,
        isConnected: false,
      }));
    }
  }, [printer]);

  // Initialize on mount if config provided
  if (config && !printer) {
    initializePrinter(config);
  }

  return {
    ...state,
    initializePrinter,
    printReceipt,
    previewReceipt,
    downloadReceipt,
    disconnect,
  };
}

/**
 * Hook to manage multiple printers
 */
export function usePrinterManager() {
  const [printers, setPrinters] = useState<Map<string, ESCPOSPrinter>>(new Map());
  const [activePrinterId, setActivePrinterId] = useState<string | null>(null);

  // Add printer
  const addPrinter = useCallback(
    async (id: string, config: PrinterConfig): Promise<boolean> => {
      try {
        const printer = new ESCPOSPrinter(config);
        const connected = await printer.connect();

        if (connected) {
          setPrinters((prev) => new Map(prev).set(id, printer));
          if (!activePrinterId) {
            setActivePrinterId(id);
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error(`Failed to add printer ${id}:`, error);
        return false;
      }
    },
    [activePrinterId]
  );

  // Remove printer
  const removePrinter = useCallback((id: string) => {
    const printer = printers.get(id);
    if (printer) {
      printer.disconnect();
      setPrinters((prev) => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });

      if (activePrinterId === id) {
        const remainingIds = Array.from(printers.keys()).filter((key) => key !== id);
        setActivePrinterId(remainingIds[0] || null);
      }
    }
  }, [printers, activePrinterId]);

  // Get active printer
  const getActivePrinter = useCallback((): ESCPOSPrinter | null => {
    if (!activePrinterId) return null;
    return printers.get(activePrinterId) || null;
  }, [printers, activePrinterId]);

  // Print with active printer
  const print = useCallback(
    async (receiptData: ReceiptData, format: 'standard' | 'compact' | 'invoice' = 'standard'): Promise<PrintResult> => {
      const printer = getActivePrinter();

      if (!printer) {
        return {
          success: false,
          message: 'No printer selected',
          duration: 0,
          error: 'No active printer',
        };
      }

      let builder;

      switch (format) {
        case 'compact':
          builder = generateCompactReceipt(receiptData);
          break;
        case 'invoice':
          builder = generateInvoiceReceipt(receiptData);
          break;
        default:
          builder = generateReceipt(receiptData);
      }

      return await printer.print(builder);
    },
    [getActivePrinter]
  );

  return {
    printers: Array.from(printers.keys()),
    activePrinterId,
    setActivePrinterId,
    addPrinter,
    removePrinter,
    getActivePrinter,
    print,
  };
}
