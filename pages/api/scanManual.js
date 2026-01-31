import { addToQueue } from "../../lib/keepaQueue.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { upc } = req.body;
  if (!upc) return res.status(400).json({ error: "UPC required" });

  await addToQueue(upc, "manual"); // manual mode
  res.status(200).json({ upc, message: "Added to queue" });
}
