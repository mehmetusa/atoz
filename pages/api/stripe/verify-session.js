// pages/api/stripe/verify-session.js
import Stripe from 'stripe';
import dbConnect from '../../../utils/mongo';
import Order from '../../../models/Order';
import mongoose from 'mongoose';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'Session ID is required' });

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer'],
    });

    await dbConnect();

    // Fetch order by stripeId or metadata.orderId
    const orderId = session.metadata?.orderId;
    const order = await Order.findOne({
      $or: [
        { stripeId: sessionId },
        orderId ? { _id: new mongoose.Types.ObjectId(orderId) } : null,
      ].filter(Boolean),
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Populate product details
    const itemsWithDetails = await Promise.all(
      (order.items || []).map(async (item) => {
        let product = null;
        if (item.productId) {
          product = await Product.findById(item.productId);
        }
        const price = item.price || product?.prices?.[0] || 0;
        const totalPrice =
          (price + (item.extras?.reduce((sum, e) => sum + Number(e.price || 0), 0) || 0)) *
          (item.quantity || 1);

        return {
          productId: item.productId,
          title: item.title || product?.title || 'Untitled',
          quantity: item.quantity || 1,
          price: price,
          size: item.size || 'Standard',
          image: item.image || product?.imgs?.[0] || '/img/placeholder.png',
          extras: item.extras || [],
          notes: item.notes || '',
          whom: item.whom || '',
          totalPrice: Math.round(totalPrice * 100) / 100,
        };
      }),
    );

    // Calculate subtotal, discount, tax, total
    const subtotal = itemsWithDetails.reduce((sum, i) => sum + i.totalPrice, 0);
    const discount = order.discount || 0;
    const taxableAmount = subtotal - discount;
    const tax = Math.round(taxableAmount * 0.06 * 100) / 100; // 6% tax
    const shippingFee = order.shippingFee || 0;
    const total = Math.round((taxableAmount + tax + shippingFee) * 100) / 100;

    res.status(200).json({
      orderId: order._id,
      userId: order.userId || null,
      customer: order.customer || {},
      items: itemsWithDetails,
      notes: order.notes || '',
      subtotal,
      discount,
      tax,
      shippingFee,
      total,
      metadata: {
        deliveryDate: order.deliveryDate,
        deliverySlot: order.deliverySlot,
        couponCode: order.usedCouponCode || '',
      },
      paymentStatus: order.paymentStatus || 'Pending',
    });
  } catch (err) {
    console.error('Stripe verify-session error:', err);
    res.status(500).json({ message: 'Failed to verify Stripe session' });
  }
}
