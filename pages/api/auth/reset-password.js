// pages/api/auth/reset-password.js
import dbConnect from '../../../utils/mongo';
import User from '../../../models/Users';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ message: 'Token and password are required' });

  await dbConnect();

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.status(200).json({ message: 'Password reset successfully. You can now login.' });
}
