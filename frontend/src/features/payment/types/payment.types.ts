export interface CreatePaymentInput {
  payerAccountId: string;
  toPhone: string;
  amountMinor: number;
  tPin: string;
}

export interface RecipientPreview {
  name: string;
  phone: string;
}

export interface CreatePaymentResult {
  transactionId: string;
  payerAccountId: string;
  payeeAccountId: string;
  amountMinor: number;
  feeMinor: number;
  status: string;
}
