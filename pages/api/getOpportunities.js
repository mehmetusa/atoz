import { getDB } from "../../lib/mongo.js";

export default async function handler(req, res) {
  try {
    const client = await getDB();
    const dbName = process.env.MONGODB_DB;
    if (!dbName) return res.status(500).json({ error: "MONGODB_DB env var not set" });

    const db = client.db(dbName);
    const collectionName = "opportunities";

    // --- Parse query parameters ---
    const { category, minScore = "0", maxRank = "20000", hazmat } = req.query;

    const filter = {
      opportunityScore: { $gte: Number(minScore) },
      rank: { $lte: Number(maxRank) },
    };

    if (category) filter.category = isNaN(category) ? category : Number(category);
    if (hazmat !== undefined) filter.hazmat = hazmat === "true";

    // --- Check if collection exists ---
    const exists = await db.listCollections({ name: collectionName }).hasNext();
if (!exists) {
  // Create collection and insert sample data
  await db.collection(collectionName).insertMany([
    {
      category: "Books",
      opportunityScore: 95,
      rank: 5000,
      hazmat: false,
      title: "Sample Book"
    },
    {
      category: "Electronics",
      opportunityScore: 87,
      rank: 12000,
      hazmat: true,
      title: "Sample Gadget"
    }
  ]);
}

    let opportunities = [];
    if (exists) {
      opportunities = await db
        .collection(collectionName)
        .find(filter)
        .sort({ opportunityScore: -1 })
        .limit(100)
        .toArray();
    }

    // --- Return sample data if DB is empty ---
    if (!opportunities.length) {
      opportunities = [
        {
          title: "Sample Book",
          category: "Books",
          opportunityScore: 90,
          rank: 1000,
          hazmat: false,
        },
        {
          title: "Sample Gadget",
          category: "Electronics",
          opportunityScore: 85,
          rank: 5000,
          hazmat: true,
        },
      ];
    }

    res.status(200).json(opportunities);
  } catch (err) {
    console.error("Error fetching opportunities:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}


// import { getDB } from "../../lib/mongo.js";

// export default async function handler(req, res) {
//   try {
//     const client = await getDB();             // MongoClient
//     const dbName = process.env.MONGODB_DB;     // e.g., "myDatabase"
//     if (!dbName) {
//       return res.status(500).json({ error: "MONGODB_DB env var not set" });
//     }
//     const db = client.db(dbName);              // Database instance

//     // --- Query parameters ---
//     const {
//       category = "",
//       minScore = 0,
//       maxRank = 20000,
//       hazmat
//     } = req.query;

//     // --- Build MongoDB filter ---
//     const filter = {
//       opportunityScore: { $gte: Number(minScore) },
//       rank: { $lte: Number(maxRank) },
//     };

//     if (category) filter.category = category;
//     if (hazmat === "true") filter.hazmat = true;
//     if (hazmat === "false") filter.hazmat = false;

//     // --- Fetch opportunities ---
//     const collectionName = "opportunities";

//     // If you don’t have this collection yet,
//     // return an empty array instead of erroring:
//     const collections = await db.listCollections({ name: collectionName }).toArray();
//     if (!collections.length) {
//       return res.status(200).json([]);  // empty list if no opportunities collection
//     }

//     const opportunities = await db
//       .collection(collectionName)
//       .find(filter)
//       .sort({ opportunityScore: -1 })
//       .limit(100)
//       .toArray();

//     res.status(200).json(opportunities);
//   } catch (err) {
//     console.error("Error fetching opportunities:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }
