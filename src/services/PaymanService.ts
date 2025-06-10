import { PaymanClient } from '@paymanai/payman-ts';
import axios from 'axios';

const PAYMAN_BASE_URL = 'https://agent.payman.ai/api';

interface PaymentData {
  payeeName: string;
  amount: string;
  sourceWallet: string;
}

interface PaymentResult extends PaymentData {
  status: 'success' | 'error' | 'awaiting_approval';
  error?: string;
  message?: string;
}

class PaymanService {
  private static instance: PaymanService;
  private initialized: boolean = false;
  private paymanClient: PaymanClient | null = null;

  private constructor() {}

  static getInstance(): PaymanService {
    if (!PaymanService.instance) {
      PaymanService.instance = new PaymanService();
    }
    return PaymanService.instance;
  }

  isInitialized(): boolean {
    return this.initialized || !!localStorage.getItem('payman_token');
  }

  private getAuthHeader(): string {
    const token = localStorage.getItem('payman_token');
    if (!token) {
      throw new Error('Not authenticated');
    }
    return `Bearer ${token}`;
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
        expiresIn: 3600, // Default to 1 hour if not known
      }
    );
  }

  async processPayment(payment: PaymentData): Promise<PaymentResult> {
    try {
      if (!this.paymanClient) {
        this.initializeClient();
      }

      if (!this.paymanClient) {
        throw new Error('Failed to initialize Payman client');
      }

      // Make the payment using the SDK's ask method
      const response = await this.paymanClient.ask(
        `Send ${payment.amount} from ${payment.sourceWallet} to ${payment.payeeName}`
      );

      // Check response for awaiting approval indication
      const responseStr = response?.toString().toLowerCase() || '';
      if (responseStr.includes('awaiting approval') || responseStr.includes('pending approval')) {
        return {
          ...payment,
          status: 'awaiting_approval',
          message: 'Payment initiated and awaiting approval'
        };
      }

      return {
        ...payment,
        status: 'success',
        message: 'Payment processed successfully'
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      
      // Check if the error message indicates awaiting approval
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (errorMessage.toLowerCase().includes('awaiting approval') || 
          errorMessage.toLowerCase().includes('pending approval')) {
        return {
          ...payment,
          status: 'awaiting_approval',
          message: 'Payment initiated and awaiting approval'
        };
      }

      return {
        ...payment,
        status: 'error',
        error: errorMessage
      };
    }
  }

  async processCSVPayments(data: PaymentData[]): Promise<PaymentResult[]> {
    const results: PaymentResult[] = [];

    // Process payments sequentially
    for (const payment of data) {
      const result = await this.processPayment(payment);
      results.push(result);
      
      // If there's a timeout error, wait a bit before continuing
      if (result.status === 'error' && result.error?.toLowerCase().includes('timeout')) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      }
    }

    return results;
  }

  disconnect(): void {
    localStorage.removeItem('payman_token');
    this.initialized = false;
    this.paymanClient = null;
  }
}

export default PaymanService; 