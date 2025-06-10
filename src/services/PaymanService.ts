import { PaymanClient } from '@paymanai/payman-ts';

interface PaymentData {
  payeeName: string;
  amount: string;
  sourceWallet: string;
}

interface PaymentResult extends PaymentData {
  status: 'success' | 'error' | 'awaiting_approval';
  sdkResponse: string;  // Capture the exact SDK response
  error?: string;
}

class PaymanService {
  private static instance: PaymanService;
  private paymanClient: PaymanClient | null = null;

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

  async processPayment(payment: PaymentData): Promise<PaymentResult> {
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

    try {
      // Make exactly one SDK call and capture the response
      const response = await this.paymanClient.ask(
        `Send ${payment.amount} from ${payment.sourceWallet} to ${payment.payeeName}`
      );

      // Always capture the exact response string
      const sdkResponse = response?.toString() || 'No response from SDK';
      const responseLower = sdkResponse.toLowerCase();

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
      return {
        ...payment,
        status: 'error',
        sdkResponse: errorMessage,
        error: errorMessage
      };
    }
  }

  async processCSVPayments(data: PaymentData[]): Promise<PaymentResult[]> {
    const results: PaymentResult[] = [];

    // Process each payment once, in sequence
    for (const payment of data) {
      const result = await this.processPayment(payment);
      results.push(result);
      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  disconnect(): void {
    localStorage.removeItem('payman_token');
    this.paymanClient = null;
  }
}

export default PaymanService; 