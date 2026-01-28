import dbConnect from '../../../utils/mongo';

export default async function handler(req, res) {
  const {
    method,
    query: { q },
  } = req;

  await dbConnect();

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  if (!q) return res.status(400).json({ message: 'Query is required' });

  try {
    const products = await Product.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { desc: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { ingredients: { $regex: q, $options: 'i' } },
      ],
    }).lean();

    const formatted = products.map((product) => {
      product._id = product._id.toString();
      if (product.extraOptions) {
        product.extraOptions = product.extraOptions.map((opt) => ({
          ...opt,
          _id: opt._id.toString(),
        }));
      }
      return product;
    });

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('GET /products/search error:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
}
