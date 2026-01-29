import { getDB } from "../../lib/mongo.js";
import Schedule from "../../models/Schedule.js";

export default async function handler(req, res) {
  try {
    await getDB(); // Mongoose connect
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    return res.status(500).json({ error: "Database connection failed" });
  }

  if (req.method === "POST") {
    try {
      const { name, category, schedule, status } = req.body;
      if (!name || !category || !schedule)
        return res.status(400).json({ error: "Missing required fields" });

      const newSchedule = await Schedule.create({ name, category, schedule, status });
      return res.status(201).json(newSchedule);
    } catch (err) {
      console.error("Failed to create schedule:", err);
      return res.status(500).json({ error: "Failed to create schedule" });
    }
  } else if (req.method === "GET") {
    try {
      const schedules = await Schedule.find();
      return res.status(200).json(schedules);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
      return res.status(500).json({ error: "Failed to fetch schedules" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

// import { getDB } from "../../lib/mongo.js";

// export default async function handler(req, res) {
//   let db;
//   try {
//     db = await getDB();
//   } catch (err) {
//     console.error("Failed to connect to MongoDB:", err);
//     return res.status(500).json({ error: "Database connection failed" });
//   }

//   if (req.method === "POST") {
//     try {
//       const { name, category, schedule, status } = req.body;
//       if (!name || !category || !schedule) {
//         return res.status(400).json({ error: "Missing required fields" });
//       }

//       const result = await db.collection("schedules").insertOne({
//         name,
//         category,
//         schedule,
//         status: status || "active",
//         createdAt: new Date(),
//         lastRun: null,
//       });

//       return res.status(201).json(result);
//     } catch (err) {
//       console.error("Failed to create schedule:", err);
//       return res.status(500).json({ error: "Failed to create schedule" });
//     }
//   } else if (req.method === "GET") {
//     try {
//       const schedules = await db.collection("schedules").find({}).toArray();
//       return res.status(200).json(schedules);
//     } catch (err) {
//       console.error("Failed to fetch schedules:", err);
//       return res.status(500).json({ error: "Failed to fetch schedules" });
//     }
//   } else {
//     res.setHeader("Allow", ["GET", "POST"]);
//     return res.status(405).json({ error: `Method ${req.method} not allowed` });
//   }
// }
