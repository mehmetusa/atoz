import { getDB } from "../../lib/mongo.js";

export default async function handler(req, res) {
  const db = await getDB();

  if(req.method === "POST") {
    const { name, category, schedule, status } = req.body;
    const result = await db.collection("schedules").insertOne({
      name, category, schedule, status, createdAt: new Date(), lastRun: null
    });
    return res.status(201).json(result);
  }

  if(req.method === "GET") {
    const schedules = await db.collection("schedules").find({}).toArray();
    return res.status(200).json(schedules);
  }

  res.status(405).json({ error: "Method not allowed" });
}
