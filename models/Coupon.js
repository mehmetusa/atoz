import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
    value: { type: Number, required: true },
    maxUses: { type: Number, default: 1 },
    usedBy: { type: [String], default: [] },
    usedCount: { type: Number, default: 0 },
    minOrderValue: { type: Number, default: 0 },
    expiryDate: { type: Date, default: null },
    active: { type: Boolean, default: true },
    status: { type: String, enum: ['ready', 'given', 'used'], default: 'ready' },
  },
  { timestamps: true },
);

CouponSchema.pre('save', function (next) {
  if (this.code) this.code = this.code.toUpperCase();
  next();
});

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
