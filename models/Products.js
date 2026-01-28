// products collection
{
    _id: ObjectId,
    upc: String,                   // Universal Product Code
    asin: String,                  // Amazon ASIN
    market: String,                // US, DE, FR ...
    title: String,
    brand: String,
    variationHash: String,         // brand+model+size hash
    usPrice: Number,               // cents
    euPrice: Number,               // cents
    buyBoxPrice: Number,           // cents
    salesRank: Number,
    lastSeen: Date,
    status: String,                // "shown", "skipped", "filtered"
    opportunityScore: Number,      // Profit x Risk
    createdAt: Date,
    updatedAt: Date
  }
  
  // Indexler
  db.products.createIndex({ upc: 1, market: 1 }, { unique: true })
  db.products.createIndex({ lastSeen: 1 }, { expireAfterSeconds: 2592000 }) // 30 gün TTL
  