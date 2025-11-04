import Razorpay from 'razorpay';
import crypto from 'crypto';
import { RazorpayOrder, RazorpayPayment } from '../types/billing';

export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    // Initialize with environment variables or test keys
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_key';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'demo_secret_key';
    
    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }

  // Create Razorpay order
  async createOrder(
    amount: number, 
    currency: string = 'INR', 
    receiptId: string,
    notes?: Record<string, any>
  ): Promise<RazorpayOrder> {
    try {
      const orderData = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency,
        receipt: receiptId,
        notes: {
          receipt_id: receiptId,
          ...notes
        }
      };

      console.log('Creating Razorpay order:', orderData);

      // In demo mode, return a mock order
      if (process.env.RAZORPAY_KEY_ID === 'rzp_test_demo_key' || !process.env.RAZORPAY_KEY_ID) {
        return this.createMockOrder(orderData);
      }

      const order = await this.razorpay.orders.create(orderData);
      return order as RazorpayOrder;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      
      // In case of error, return mock order for demo
      if (!process.env.RAZORPAY_KEY_ID) {
        return this.createMockOrder({
          amount: Math.round(amount * 100),
          currency,
          receipt: receiptId,
          notes: notes || {}
        });
      }
      
      throw error;
    }
  }

  // Create mock order for demo purposes
  private createMockOrder(orderData: any): RazorpayOrder {
    return {
      id: `order_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      entity: 'order',
      amount: orderData.amount,
      amount_paid: 0,
      amount_due: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.receipt,
      status: 'created',
      attempts: 0,
      notes: orderData.notes,
      created_at: Math.floor(Date.now() / 1000)
    };
  }

  // Verify payment signature
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      // In demo mode, always return true for testing
      if (process.env.RAZORPAY_KEY_SECRET === 'demo_secret_key' || !process.env.RAZORPAY_KEY_SECRET) {
        console.log('Demo mode: Payment signature verification bypassed');
        return true;
      }

      const text = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(text)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      // In demo mode, always return true
      if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
        console.log('Demo mode: Webhook signature verification bypassed');
        return true;
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  // Get payment details
  async getPayment(paymentId: string): Promise<RazorpayPayment> {
    try {
      // In demo mode, return mock payment
      if (!process.env.RAZORPAY_KEY_ID) {
        return this.createMockPayment(paymentId);
      }

      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment as RazorpayPayment;
    } catch (error) {
      console.error('Error fetching payment:', error);
      
      // Return mock payment for demo
      if (!process.env.RAZORPAY_KEY_ID) {
        return this.createMockPayment(paymentId);
      }
      
      throw error;
    }
  }

  // Create mock payment for demo
  private createMockPayment(paymentId: string): RazorpayPayment {
    return {
      id: paymentId,
      entity: 'payment',
      amount: 499900, // Rs. 4999
      currency: 'INR',
      status: 'captured',
      order_id: `order_${Date.now()}`,
      international: false,
      method: 'card',
      amount_refunded: 0,
      captured: true,
      description: 'Demo payment',
      email: 'demo@example.com',
      contact: '+919999999999',
      notes: {},
      created_at: Math.floor(Date.now() / 1000)
    };
  }

  // Capture payment
  async capturePayment(paymentId: string, amount: number): Promise<RazorpayPayment> {
    try {
      // In demo mode, return mock captured payment
      if (!process.env.RAZORPAY_KEY_ID) {
        const mockPayment = this.createMockPayment(paymentId);
        mockPayment.status = 'captured';
        mockPayment.amount = Math.round(amount * 100);
        return mockPayment;
      }

      const payment = await this.razorpay.payments.capture(
        paymentId,
        Math.round(amount * 100),
        'INR'
      );
      return payment as RazorpayPayment;
    } catch (error) {
      console.error('Error capturing payment:', error);
      throw error;
    }
  }

  // Refund payment
  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    try {
      // In demo mode, return mock refund
      if (!process.env.RAZORPAY_KEY_ID) {
        return {
          id: `rfnd_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
          entity: 'refund',
          amount: amount ? Math.round(amount * 100) : undefined,
          payment_id: paymentId,
          status: 'processed',
          created_at: Math.floor(Date.now() / 1000)
        };
      }

      const refundData: any = { payment_id: paymentId };
      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }
      
      return await this.razorpay.payments.refund(paymentId, refundData);
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }

  // Get Razorpay configuration for frontend
  getConfig() {
    return {
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_key',
      currency: 'INR',
      name: 'Hospital Management System',
      description: 'Subscription Payment',
      theme: {
        color: '#3399cc'
      }
    };
  }

  // Check if Razorpay is properly configured
  isConfigured(): boolean {
    return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  // Get demo mode status
  isDemoMode(): boolean {
    return !this.isConfigured();
  }
}

export const razorpayService = new RazorpayService();