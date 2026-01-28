import dbConnect from '../../../../utils/mongo';
import Coupon from '../../../../models/Coupon';

export default async function handler(req, res) {
  await dbConnect();
  const { code, userId, cartTotal } = req.body;

  if (!code) return res.status(400).json({ valid: false, message: 'Coupon code is required' });

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
  if (!coupon) return res.status(400).json({ valid: false, message: 'Invalid or expired coupon' });

  if (coupon.maxUses === 1 && coupon.usedBy.includes(userId)) {
    return res.status(400).json({ valid: false, message: 'Coupon already used' });
  }

  let discount =
    coupon.discountType === 'percentage' ? (cartTotal * coupon.value) / 100 : coupon.value;

  discount = Math.min(discount, cartTotal);

  res.status(200).json({ valid: true, discount, message: 'Coupon valid!' });
}
