// pages/api/admin/coupons/index.js
import dbConnect from '../../../../utils/mongo';
import Coupon from '../../../../models/Coupon';

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.status(200).json(coupons);
}
