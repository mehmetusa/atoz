import dbConnect from '../../../utils/mongo';
import User from '../../../models/Users';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, password, phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  await dbConnect();

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      address: address || '',
      role: 'user',
    });

    const savedUser = await newUser.save();

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = savedUser.toObject();

    res.status(201).json({ message: 'User created successfully', user: userWithoutPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
