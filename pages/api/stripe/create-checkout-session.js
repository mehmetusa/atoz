import Stripe from 'stripe';
import dbConnect from '../../../utils/mongo';
import Coupon from '../../../models/Coupon';
import Order from '../../../models/Order';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

// Helpers
const normalizeCountry = (c) => {
  if (!c) return 'US';
  const up = String(c).trim().toUpperCase();
  if (['USA', 'UNITED STATES', 'UNITED STATES OF AMERICA'].includes(up)) return 'US';
  return up.length === 2 ? up : 'US';
};

const toCents = (val) => Math.round((Number(val) || 0) * 100);

const generateDisplayId = async () => {
  let id,
    exists = true;
  while (exists) {
    id = Math.floor(100000 + Math.random() * 900000).toString();
    exists = await Order.findOne({ displayId: id });
  }
  return id;
};

// Shipping
const FREE_SHIPPING_THRESHOLD = 250;
const DEFAULT_SHIPPING_FEE = 25;
const TAX_RATE = 0.06;

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const origin = (
      req.headers.origin ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');

    const {
      customer,
      items = [],
      metadata = {},
      userId,
      couponCode = '',
      notes,
      paymentMethod = 'stripe',
    } = req.body;

    if (!items.length) return res.status(400).json({ message: 'Cart items are required' });

    // Normalize items
    const normalizedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        return {
          productId: product._id,
          title: item.title || product.title,
          price: Number(item.price || product.prices?.[0] || 0),
          quantity: Number(item.quantity || 1),
          size: item.size || 'Standard',
          image: item.image || product.imgs?.[0] || '/img/placeholder.png',
          notes: item.notes || '',
          whom: item.whom || '',
          extras: item?.extras || [],
        };
      }),
    );

    // Subtotal
    const subtotal = normalizedItems.reduce(
      (sum, i) => sum + i.quantity * i.price + (i.extras?.reduce((ex, e) => ex + e.price, 0) || 0),
      0,
    );

    // Shipping
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;

    // Coupon
    let discount = 0,
      couponObj = null;
    if (couponCode) {
      couponObj = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (couponObj) {
        discount =
          couponObj.type === 'percentage' ? (subtotal * couponObj.value) / 100 : couponObj.value;
        discount = Math.min(discount, subtotal);
      }
    }

    // ✅ Tax AFTER discount
    const taxableAmount = Math.max(subtotal - discount, 0);
    const tax = taxableAmount * TAX_RATE;

    // Total
    const total = subtotal + shippingFee - discount + tax;

    // COD
    if (paymentMethod === 'cod') {
      return res.status(200).json({ cod: true, subtotal, discount, tax, shippingFee, total });
    }

    // Customer safe object
    const safeCustomer = {
      name: (customer?.name || 'Guest').trim(),
      email: (customer?.email || 'guest@example.com').trim(),
      phone: (customer?.phone || '').trim(),
      address: {
        street: (customer?.address?.street || '').trim(),
        city: (customer?.address?.city || '').trim(),
        state: (customer?.address?.state || '').trim(),
        zip: (customer?.address?.zip || '').trim(),
        country: normalizeCountry(customer?.address?.country),
      },
    };

    // Save order (status = pending until payment confirmed)
    const displayId = await generateDisplayId();
    const newOrder = await Order.create({
      displayId,
      stripeId: '',
      userId,
      items: normalizedItems,
      customer: safeCustomer,
      subtotal,
      discount,
      tax,
      shippingFee,
      total,
      method: 1,
      paymentStatus: 'Pending',
      deliveryDate: metadata?.deliveryDate || new Date(),
      deliverySlot: metadata?.deliverySlot || '08:00–10:00',
      notes: notes || '',
      usedCouponCode: couponCode || '',
      couponId: couponObj?._id || null,
      status: 0,
    });

    // Stripe customer
    const stripeCustomer = await stripe.customers.create({
      name: safeCustomer.name,
      email: safeCustomer.email,
      phone: safeCustomer.phone || undefined,
      address: {
        line1: safeCustomer.address.street,
        city: safeCustomer.address.city,
        state: safeCustomer.address.state,
        postal_code: safeCustomer.address.zip,
        country: safeCustomer.address.country,
      },
    });

    // Stripe line items
    const line_items = normalizedItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          images: [item.image],
          metadata: {
            mongoProductId: item.productId.toString(),
            size: item.size,
            notes: item.notes || '',
            whom: item.whom || '',
          },
        },
        unit_amount: toCents(item.price),
      },
      quantity: item.quantity,
      tax_rates: [process.env.NEXT_PUBLIC_STRIPE_TAX_RATE],
    }));

    // Shipping options
    const shipping_options =
      shippingFee > 0
        ? [
            {
              shipping_rate_data: {
                display_name: 'Standard Shipping',
                type: 'fixed_amount',
                fixed_amount: { amount: toCents(shippingFee), currency: 'usd' },
                tax_behavior: 'exclusive',
                tax_code: 'txcd_10000000',
              },
            },
          ]
        : [];

    // Stripe discounts
    const stripeDiscounts = [];
    if (discount > 0 && couponObj) {
      if (couponObj.type === 'percentage') {
        const stripeCoupon = await stripe.coupons.create({
          percent_off: couponObj.value,
          duration: 'once',
          name: `Coupon-${couponCode.toUpperCase()}`,
        });
        stripeDiscounts.push({ coupon: stripeCoupon.id });
      } else {
        const stripeCoupon = await stripe.coupons.create({
          amount_off: toCents(discount),
          currency: 'usd',
          duration: 'once',
          name: `Coupon-${couponCode.toUpperCase()}`,
        });
        stripeDiscounts.push({ coupon: stripeCoupon.id });
      }
    }

    // Metadata
    const sessionMetadata = {
      orderId: newOrder._id.toString(),
      displayId: newOrder.displayId,
      userId,
      subtotal,
      discount,
      tax,
      shippingFee,
      total,
      notes: newOrder.notes || '',
      customerName: safeCustomer.name,
      customerEmail: safeCustomer.email,
      customerPhone: safeCustomer.phone,
      ...safeCustomer.address,
      deliveryDate: metadata?.deliveryDate || '',
      deliverySlot: metadata?.deliverySlot || '',
      couponCode: couponCode || '',
      items: JSON.stringify(
        normalizedItems.map((i) => ({
          productId: i.productId.toString(),
          quantity: i.quantity,
          size: i.size,
        })),
      ).slice(0, 500),
    };

    // Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: stripeCustomer.id,
      line_items,
      shipping_options,
      discounts: stripeDiscounts,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      metadata: sessionMetadata,
    });

    newOrder.stripeId = session.id;
    await newOrder.save();

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session creation failed:', err);
    res.status(500).json({ message: err.message });
  }
}
