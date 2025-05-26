import { Schema, model } from 'mongoose';
      import { TPayment, PaymentModel } from './Payment.interface';
      
      const PaymentSchema = new Schema<TPayment, PaymentModel>({
        name: { type: String, required: true },
        description: { type: String },
        atcCodes: { type: String, required: true },
        isDeleted: { type: Boolean, default: false },
      });
      
      PaymentSchema.statics.isPaymentExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Payment = model<TPayment, PaymentModel>('Payment', PaymentSchema);
      