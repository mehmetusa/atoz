import { getDB } from "../../lib/mongo.js";

export default async function handler(req, res) {
  const db = await getDB();
  const products = await db.collection("products")
    .find({ status: "shown" })
    .sort({ opportunityScore: -1 })
    .limit(50)
    .toArray();

  res.status(200).json(products);
}
