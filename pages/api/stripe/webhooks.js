import { buffer } from 'micro';
import Stripe from 'stripe';
import dbConnect from '../../../utils/mongo';
import Order from '../../../models/Order';
import sendInvoice from '../../../utils/send-invoice';

export const config = { api: { bodyParser: false } };
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  await dbConnect();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    try {
      // Check if order already exists
      let order = await Order.findOne({ stripeId: session.id });
      if (order) {
        console.log(`⚠️ Order with stripeId ${session.id} already exists`);
        return res.status(200).json({ received: true });
      }

      // If order was pre-created before checkout, update instead of creating new

      if (metadata.displayId) {
        order = await Order.findOneAndUpdate(
          { displayId: metadata.displayId },
          {
            stripeId: session.id,
            status: 1,
            paymentStatus: 'Paid',
          },
          { new: true },
        );
      }

      // If not found, create a new order
      if (!order) {
        order = await Order.create({
          stripeId: session.id,
          displayId: metadata.displayId,
          userId: metadata.userId || null,
          items: metadata.items ? JSON.parse(metadata.items) : [],
          customer: {
            name: metadata.customerName,
            email: metadata.customerEmail,
            phone: metadata.customerPhone,
            address: {
              street: metadata.street,
              city: metadata.city,
              state: metadata.state,
              zip: metadata.zip,
              country: metadata.country,
            },
          },
          subtotal: parseFloat(metadata.subtotal || 0),
          discount: parseFloat(metadata.discount || 0),
          tax: parseFloat(metadata.tax || 0),
          shippingFee: parseFloat(metadata.shippingFee || 0),
          total: parseFloat(metadata.total || 0),
          method: 1, // Stripe
          deliveryDate: metadata.deliveryDate ? new Date(metadata.deliveryDate) : null,
          deliverySlot: metadata.deliverySlot || '',
          notes: metadata.notes || '',
          usedCouponCode: metadata.couponCode || '',
          status: 1, // Processing
          paymentStatus: 'Paid',
        });
      }

      // Send invoice email
      try {
        await sendInvoice({ customerEmail: order.customer.email, order });
        await sendInvoice(order, 'iAmazon@gmail.com');
        console.log(`📧 Invoice sent to ${order.customer.email}`);
      } catch (err) {
        console.error('⚠️ Failed to send invoice:', err);
      }

      // Attach email to payment intent receipt
      try {
        await stripe.paymentIntents.update(session.payment_intent, {
          receipt_email: order.customer.email,
        });
      } catch (err) {
        console.error('⚠️ Failed to update payment intent:', err.message);
      }
    } catch (err) {
      console.error('❌ Error processing Stripe session:', err);
      return res.status(500).json({ error: 'Webhook handler failed' });
    }
  }

  return res.status(200).json({ received: true });
}
