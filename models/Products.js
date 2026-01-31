// products collection
{
  _id: ObjectId,

  // Identifiers
  upc: String,                // Universal Product Code
  asin: String,               // Amazon ASIN
  market: String,             // "US", "DE", "FR", etc.
  variationHash: String,      // brand + model + size hash

  // Product info
  title: String,
  brand: String,

  // Pricing (all in cents)
  usPrice: Number,            // US BuyBox price (optional)
  euPrice: Number,            // EU BuyBox price (optional)
  buyBoxPrice: Number,        // current market BuyBox price

  // Amazon metrics
  salesRank: Number,
  hazmat: Boolean,

  // Scoring & status
  opportunityScore: Number,  // profit × (1 - risk)
  status: String,            // "shown" | "skipped" | "filtered"

  // Timestamps
  lastSeen: Date,             // for TTL cleanup
  scannedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

  
  // Indexler
  db.products.createIndex({ upc: 1, market: 1 }, { unique: true })
  db.products.createIndex({ lastSeen: 1 }, { expireAfterSeconds: 2592000 }) // 30 gün TTL
 