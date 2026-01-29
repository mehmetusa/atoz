import mongoose from 'mongoose';

// ==== Predefined delivery slots ====
export const DELIVERY_SLOTS = [
  '08:00–10:00',
  '10:00–12:00',
  '12:00–14:00',
  '14:00–16:00',
  '16:00–18:00',
  '18:00–20:00',
];

// ==== Utility: generate unique numeric displayId ====
const generateDisplayId = async (Model, length = 6) => {
  let id;
  let exists = true;

  while (exists) {
    id = Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
    exists = await Model.exists({ displayId: id });
  }

  return id;
};

// ==== Order item schema ====
const ItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true },
    totalPrice: { type: Number },
    notes: { type: String, trim: true },
    whom: { type: String, trim: true },
    size: { type: String },
    image: { type: String },
    extras: [
      {
        text: { type: String, trim: true },
        price: { type: Number, default: 0 },
      },
    ],
  },
  { _id: false },
);

// ==== Customer snapshot schema ====
const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip: { type: String, trim: true },
      country: { type: String, default: 'USA' },
    },
  },
  { _id: false },
);

// ==== Main Order schema ====
const OrderSchema = new mongoose.Schema(
  {
    displayId: { type: String, required: true, unique: true },
    stripeId: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    items: { type: [ItemSchema], required: true },
    customer: { type: CustomerSchema, required: true },

    subtotal: { type: Number },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 }, // <-- added shippingFee
    total: { type: Number },

    method: { type: Number, required: true }, // 0: Cash, 1: Card
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded', 'Failed'],
      default: 'Pending',
    },

    status: { type: Number, default: 0 },
    deliveryDate: { type: Date, required: true },
    deliverySlot: { type: String, enum: DELIVERY_SLOTS, required: true },
    deliveryStatus: {
      type: String,
      enum: ['Scheduled', 'Out for delivery', 'Delivered', 'Failed'],
      default: 'Scheduled',
    },

    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    usedCouponCode: { type: String, trim: true },

    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

// ==== Pre-save hook: displayId & totals ====
OrderSchema.pre('save', async function (next) {
  // generate displayId if missing
  if (!this.displayId) {
    const OrderModel = mongoose.model('Order', OrderSchema);
    this.displayId = await generateDisplayId(OrderModel, 6);
  }

  // calculate item totals
  this.items.forEach((item) => {
    const extrasTotal = (item.extras || []).reduce((sum, ex) => sum + (ex.price || 0), 0);
    item.totalPrice = (item.price + extrasTotal) * item.quantity;
  });

  // calculate order subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  // calculate final total including shipping
  this.total = this.subtotal - this.discount + this.tax + (this.shippingFee || 0);

  next();
});

// ==== Indexes ====
OrderSchema.index({ userId: 1 });
OrderSchema.index({ 'customer.email': 1 });
OrderSchema.index({ displayId: 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
