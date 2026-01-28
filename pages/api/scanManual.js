import { addToQueue } from '../../lib/keepaQueue.js';

export default async function handler(req, res) {
  const { upc } = req.body;
  if(!upc) return res.status(400).json({ error: "UPC required" });

  await addToQueue(upc);
  res.status(200).json({ message: "Scan queued!" });
}
