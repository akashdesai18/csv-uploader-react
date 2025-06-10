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
    return this.initialized && this.paymanClient !== null;
  }

  private initializeClient() {
    const token = localStorage.getItem('payman_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      this.paymanClient = PaymanClient.withToken(
        import.meta.env.VITE_PAYMAN_CLIENT_ID,
        {
          accessToken: token,
          expiresIn: 3600, // Default to 1 hour if not known
        }
      );
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Payman client:', error);
      this.initialized = false;
      this.paymanClient = null;
      throw error;
    }
  }

  async processPayment(payment: PaymentData): Promise<PaymentResult> {
    try {
      // Ensure client is initialized
      if (!this.isInitialized()) {
        this.initializeClient();
      }

      if (!this.paymanClient) {
        throw new Error('Failed to initialize Payman client');
      }

      // Create the payment command
      const paymentCommand = `Send ${payment.amount} from ${payment.sourceWallet} to ${payment.payeeName}`;
      console.log('Processing payment with command:', paymentCommand);

      // Make a single SDK call and store the response
      let response;
      try {
        response = await this.paymanClient.ask(paymentCommand);
      } catch (sdkError) {
        // If the SDK throws an error, check if it's an "awaiting approval" message
        const errorMessage = sdkError instanceof Error ? sdkError.message : 'Unknown error occurred';
        if (errorMessage.toLowerCase().includes('awaiting approval') || 
            errorMessage.toLowerCase().includes('pending approval')) {
          return {
            ...payment,
            status: 'awaiting_approval',
            message: 'Payment initiated and awaiting approval'
          };
        }
        throw sdkError; // Re-throw if it's not an approval message
      }

      // Process the response
      const responseStr = response?.toString().toLowerCase() || '';
      console.log('Payment response:', responseStr);

      // Check for approval status in the response
      if (responseStr.includes('awaiting approval') || responseStr.includes('pending approval')) {
        return {
          ...payment,
          status: 'awaiting_approval',
          message: 'Payment initiated and awaiting approval'
        };
      }

      // If we get here, the payment was successful
      return {
        ...payment,
        status: 'success',
        message: 'Payment processed successfully'
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        ...payment,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async processCSVPayments(data: PaymentData[]): Promise<PaymentResult[]> {
    // Ensure client is initialized before starting batch processing
    if (!this.isInitialized()) {
      this.initializeClient();
    }

    const results: PaymentResult[] = [];

    // Process payments sequentially with delay between each
    for (const payment of data) {
      const result = await this.processPayment(payment);
      results.push(result);
      
      // Add a small delay between payments to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
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