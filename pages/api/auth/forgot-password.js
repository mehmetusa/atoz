// pages/api/auth/forgot-password.js
import dbConnect from '../../../utils/mongo';
import User from '../../../models/Users';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  await dbConnect();

  const user = await User.findOne({ email });
  if (!user)
    return res.status(200).json({
      message: 'If an account exists, a reset link has been sent to your email.',
    });

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetToken = resetToken;
  user.resetTokenExpiry = Date.now() + 3600 * 1000; // 1 hour
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Password Reset Request',
    html: `<p>Hello ${user.name},</p>
           <p>You requested a password reset. Click the link below:</p>
           <a href="${resetUrl}">${resetUrl}</a>
           <p>This link expires in 1 hour.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({
      message: 'If an account exists, a reset link has been sent to your email.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send email' });
  }
}
