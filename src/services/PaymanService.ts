import { PaymanClient } from '@paymanai/payman-ts';

export interface PaymentData {
  payeeName: string;
  amount: string;
  sourceWallet: string;
}

export interface PaymentResult extends PaymentData {
  status: 'success' | 'error' | 'awaiting_approval';
  sdkResponse: string;  // Capture the exact SDK response
  error?: string;
}

class PaymanService {
  private static instance: PaymanService;
  private paymanClient: PaymanClient | null = null;
  private processedRowIndices: Set<number> = new Set(); // Track processed row indices

  private constructor() {
    // Initialize client if token exists
    const token = localStorage.getItem('payman_token');
    if (token) {
      this.initializeClient();
    }
  }

  static getInstance(): PaymanService {
    if (!PaymanService.instance) {
      PaymanService.instance = new PaymanService();
    }
    return PaymanService.instance;
  }

  isInitialized(): boolean {
    return this.paymanClient !== null;
  }

  private initializeClient() {
    const token = localStorage.getItem('payman_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    this.paymanClient = PaymanClient.withToken(
      import.meta.env.VITE_PAYMAN_CLIENT_ID,
      {
        accessToken: token,
        expiresIn: 3600,
      }
    );
  }

  async processPayment(payment: PaymentData, rowIndex: number): Promise<PaymentResult> {
    if (!this.paymanClient) {
      this.initializeClient();
    }

    if (!this.paymanClient) {
      return {
        ...payment,
        status: 'error',
        sdkResponse: 'Client not initialized',
        error: 'Not authenticated'
      };
    }

    // Check if this row has already been processed
    if (this.processedRowIndices.has(rowIndex)) {
      console.warn(`Row ${rowIndex} has already been processed, skipping`);
      return {
        ...payment,
        status: 'error',
        sdkResponse: 'Row already processed',
        error: 'This row has already been processed'
      };
    }

    try {
      // Mark this row as processed BEFORE making the SDK call
      this.processedRowIndices.add(rowIndex);
      console.log(`Processing row ${rowIndex}: ${payment.payeeName} - ${payment.amount}`);

      // Make exactly one SDK call and capture the response
      const response = await this.paymanClient.ask(
        `Send ${payment.amount} from ${payment.sourceWallet} to ${payment.payeeName}`
      );

      // Always capture the exact response string
      const sdkResponse = response?.toString() || 'No response from SDK';
      const responseLower = sdkResponse.toLowerCase();

      console.log(`SDK Response for row ${rowIndex}:`, sdkResponse);

      if (responseLower.includes('awaiting approval') || responseLower.includes('pending approval')) {
        return {
          ...payment,
          status: 'awaiting_approval',
          sdkResponse
        };
      }

      return {
        ...payment,
        status: 'success',
        sdkResponse
      };

    } catch (error) {
      // Capture error message as the SDK response
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing row ${rowIndex}:`, errorMessage);
      return {
        ...payment,
        status: 'error',
        sdkResponse: errorMessage,
        error: errorMessage
      };
    }
  }

  async processCSVPayments(data: PaymentData[]): Promise<PaymentResult[]> {
    console.log(`Starting to process ${data.length} payments`);
    
    // Clear the processed rows set at the start of each CSV processing
    this.processedRowIndices.clear();
    
    const results: PaymentResult[] = [];

    // Process each row exactly once, in sequence
    for (let i = 0; i < data.length; i++) {
      console.log(`Processing row ${i + 1} of ${data.length}`);
      const result = await this.processPayment(data[i], i);
      results.push(result);
      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('Finished processing all rows');
    return results;
  }

  disconnect(): void {
    localStorage.removeItem('payman_token');
    this.paymanClient = null;
    this.processedRowIndices.clear();
  }
}

export default PaymanService; 