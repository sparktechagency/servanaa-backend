import { Schema, model } from 'mongoose';
      import { TCustomer, CustomerModel } from './Customer.interface';




      const CustomerSchema = new Schema<TCustomer, CustomerModel>({
        userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
        dob: { type: String, default: '' },
        gender: { type: String, default: '' },
        city: { type: String, default: '' },
        language: { type: String, default: '' },
        location: { type: String, default: '' },
        isDeleted: { type: Boolean, default: false },
      });
      
      CustomerSchema.statics.isCustomerExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Customer = model<TCustomer, CustomerModel>('Customer', CustomerSchema);
      