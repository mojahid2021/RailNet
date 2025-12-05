import axios, { AxiosResponse } from 'axios';

export interface SSLCommerzConfig {
  storeId: string;
  storePassword: string;
  isSandbox: boolean;
  apiUrl: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}

export interface PaymentRequest {
  total_amount: number;
  currency: string;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url: string;
  cus_name: string;
  cus_email: string;
  cus_phone: string;
  cus_add1: string;
  cus_city: string;
  cus_country: string;
  shipping_method: string;
  num_of_item: number;
  product_name: string;
  product_category: string;
  product_profile: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
}

export interface PaymentResponse {
  status: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  failedreason?: string;
  error?: string;
}

export interface ValidationResponse {
  status: string;
  tran_date?: string;
  tran_id?: string;
  val_id?: string;
  amount?: string;
  store_amount?: string;
  currency?: string;
  bank_tran_id?: string;
  card_type?: string;
  card_no?: string;
  card_issuer?: string;
  card_brand?: string;
  card_issuer_country?: string;
  card_issuer_country_code?: string;
  currency_type?: string;
  currency_amount?: string;
  currency_rate?: string;
  base_fair?: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
  risk_level?: string;
  risk_title?: string;
  error?: string;
}

export class SSLCommerzClient {
  private config: SSLCommerzConfig;

  constructor(config: SSLCommerzConfig) {
    this.config = config;
  }

  async initiatePayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response: AxiosResponse<PaymentResponse> = await axios.post(
        `${this.config.apiUrl}/gwprocess/v4/api.php`,
        {
          store_id: this.config.storeId,
          store_passwd: this.config.storePassword,
          ...paymentData,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('SSLCommerz payment initiation error:', error);
      throw new Error('Failed to initiate payment');
    }
  }

  async validatePayment(valId: string): Promise<ValidationResponse> {
    try {
      const response: AxiosResponse<ValidationResponse> = await axios.get(
        `${this.config.apiUrl}/validator/api/validationserverAPI.php`,
        {
          params: {
            val_id: valId,
            store_id: this.config.storeId,
            store_passwd: this.config.storePassword,
            v: 1,
            format: 'json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('SSLCommerz payment validation error:', error);
      throw new Error('Failed to validate payment');
    }
  }

  async refundPayment(refundData: {
    bank_tran_id: string;
    refund_amount: number;
    refund_remarks: string;
  }): Promise<any> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.config.apiUrl}/validator/api/merchantTransIDvalidationAPI.php`,
        {
          store_id: this.config.storeId,
          store_passwd: this.config.storePassword,
          ...refundData,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('SSLCommerz refund error:', error);
      throw new Error('Failed to process refund');
    }
  }
}

export function createSSLCommerzClient(): SSLCommerzClient {
  const config: SSLCommerzConfig = {
    storeId: process.env.SSLCOMMERZ_STORE_ID!,
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD!,
    isSandbox: process.env.SSLCOMMERZ_IS_SANDBOX === 'true',
    apiUrl: process.env.SSLCOMMERZ_API_URL!,
    successUrl: process.env.SSLCOMMERZ_SUCCESS_URL!,
    failUrl: process.env.SSLCOMMERZ_FAIL_URL!,
    cancelUrl: process.env.SSLCOMMERZ_CANCEL_URL!,
    ipnUrl: process.env.SSLCOMMERZ_IPN_URL!,
  };

  return new SSLCommerzClient(config);
}