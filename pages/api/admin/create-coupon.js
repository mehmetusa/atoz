// pages/api/admin/create-coupon.js
import dbConnect from '../../../utils/dbConnect';
import Coupon from '../../../models/Coupon';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { code, discountType, value, maxUses = 1, expiresAt = null } = req.body;

    const newCoupon = await Coupon.create({
      code,
      discountType,
      value,
      maxUses,
      expiresAt,
    });

    res.status(201).json({ message: 'Coupon created', coupon: newCoupon });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
