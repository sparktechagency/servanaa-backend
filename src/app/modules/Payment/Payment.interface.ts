import { Model } from 'mongoose';

export type TPayment = {
  name: string;
  description?: string;
  atcCodes: string;
  isDeleted: boolean;
};

export interface PaymentModel extends Model<TPayment> {
  isPaymentExists(id: string): Promise<TPayment | null>;
}
