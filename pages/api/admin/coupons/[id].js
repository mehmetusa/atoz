import dbConnect from '../../../../utils/mongo';
import Coupon from '../../../../models/Coupon';
import Order from '../../../../models/Order';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, code, subtotal } = req.body;

    // find coupon
    const coupon = await Coupon.findOne({ code });
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // expired?
    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return res.status(400).json({ error: 'Coupon expired' });
    }

    // min order check
    if (subtotal < coupon.minOrderValue) {
      return res.status(400).json({ error: `Minimum order $${coupon.minOrderValue} required` });
    }

    // global max usage
    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'Coupon already fully used' });
    }

    // has this user already used it?
    const alreadyUsed = await Order.findOne({ user: userId, coupon: coupon._id });
    if (alreadyUsed) {
      return res.status(400).json({ error: 'You already used this coupon' });
    }

    // ✅ valid coupon
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }

    return res.status(200).json({
      success: true,
      discount,
      discountType: coupon.discountType,
      value: coupon.value,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
