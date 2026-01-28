import dbConnect from '../../../utils/mongo';
import User from '../../../models/Users';

export default async function handler(req, res) {
  const { email } = req.query;
  await dbConnect();

  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(user);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
      }
      break;

    case 'PUT':
      try {
        const updatedUser = await User.findOneAndUpdate(
          { email },
          { $set: req.body },
          { new: true },
        );
        if (!updatedUser) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(updatedUser);
      } catch (err) {
        res.status(500).json({ error: 'Failed to update user' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
