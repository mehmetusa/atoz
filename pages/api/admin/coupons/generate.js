// pages/api/admin/coupons/generate.js
import dbConnect from '../../../../utils/mongo';
import Coupon from '../../../../models/Coupon';

function randomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { count = 10, discountType = 'percentage', value = 10 } = req.body;
    const coupons = [];

    for (let i = 0; i < count; i++) {
      const code = randomCode();
      const coupon = await Coupon.create({
        code,
        discountType,
        value,
        maxUses: 1,
        status: 'ready',
      });
      coupons.push(coupon);
    }

    res.status(201).json({ message: `Generated ${coupons.length} coupons`, coupons });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
