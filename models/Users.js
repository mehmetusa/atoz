import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    zip: { type: String },
    country: { type: String, default: 'USA' },
    isDefault: { type: Boolean, default: false }, // helpful for quick checkout
  },
  { timestamps: true },
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String },
    addresses: [AddressSchema], // user can have multiple past addresses
    role: { type: String, default: 'user' },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
