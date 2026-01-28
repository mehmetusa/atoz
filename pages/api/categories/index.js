import dbConnect from '../../../utils/dbConnect.js';
import Category from '../../../models/Category.js';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const categories = await Category.find({});
      return res.status(200).json(categories);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
