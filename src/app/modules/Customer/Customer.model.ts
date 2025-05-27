import { Schema, model } from 'mongoose';
      import { TCustomer, CustomerModel } from './Customer.interface';
      
      const CustomerSchema = new Schema<TCustomer, CustomerModel>({
        name: { type: String, required: true },
        description: { type: String },
        atcCodes: { type: String, required: true },
        isDeleted: { type: Boolean, default: false },
      });
      
      CustomerSchema.statics.isCustomerExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Customer = model<TCustomer, CustomerModel>('Customer', CustomerSchema);
      