import dbConnect from '../../../utils/mongo';
import User from '../../../models/Users';

export default async function handler(req, res) {
  await dbConnect();

  const { page = 1, limit = 10 } = req.query; // default values
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  try {
    const total = await User.countDocuments();
    const users = await User.find()
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json({
      users,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}
