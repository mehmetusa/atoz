import User from '../../../models/Users';
import dbConnect from '../../../utils/mongo';

export default async function handler(req, res) {
  await dbConnect();

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required' });
  }

  const normalizedEmail = email.toLowerCase();

  switch (req.method) {
    case 'GET':
      try {
        const user = await User.findOne({ email: normalizedEmail }).lean();
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { password, ...userData } = user;
        return res.status(200).json(userData);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }

    case 'PUT':
      try {
        const updateData = req.body;

        // Prevent changing email
        if (updateData.email && updateData.email !== normalizedEmail) {
          delete updateData.email;
        }

        // Handle address update: if front-end sends address fields, store them in addresses array
        if (updateData.address) {
          updateData.addresses = [
            {
              street: updateData.address.street || '',
              city: updateData.address.city || '',
              state: updateData.address.state || '',
              zip: updateData.address.zip || '',
              country: updateData.address.country || 'USA',
            },
          ];
          delete updateData.address; // remove temporary field
        }

        const updatedUser = await User.findOneAndUpdate(
          { email: normalizedEmail },
          { $set: updateData },
          { new: true, runValidators: true },
        ).lean();

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        const { password, ...userData } = updatedUser;
        return res.status(200).json(userData);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Update failed' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
