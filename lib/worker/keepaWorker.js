import { keepaQueue } from "./keepaQueue.js";
import { getDB } from "./mongo.js";
import { fetchKeepaProduct, predictPriceCrash } from "../keepaUtils";
import { isBrandAllowed } from "./brandCheck.js";
import { isAmazonOnBuyBox } from "./buyBoxCheck.js";

keepaQueue.process(2, async (job) => {
  const { asin, marketplace, category } = job.data;
  const db = await getDB();

  // 1️⃣ Duplicate check
  const exists = await db.collection("products").findOne({ asin, marketplace });
  if (exists) return;

  // 2️⃣ Fetch product from Keepa
  const product = await fetchKeepaProduct(asin, marketplace);
  if (!product) return;

  // 3️⃣ HARD FILTERS
  if (product.hazmat) return;
  if (!product.buyBoxPrice) return;
  if (product.salesRank > 150000) return;

  // 4️⃣ Brand filter
  if (!isBrandAllowed(product.brand)) return;

  // 5️⃣ Amazon BuyBox filter
  if (isAmazonOnBuyBox(product.buyBoxSellerId, marketplace)) return;

  // 6️⃣ Price crash prediction
  const crash = predictPriceCrash(product);
  const crashRisk = crash?.score ?? 0;

  // 7️⃣ Scoring
  const profit = product.netProfit ?? 0;
  const salesVelocity = product.salesVelocity ?? 1;
  const competitionMultiplier = product.competitionScore ?? 1;

  const rankScore =
    profit *
    salesVelocity *
    (1 - crashRisk) *
    competitionMultiplier;

  // 8️⃣ Alerts
  const alerts = [];
  if (profit > 50) alerts.push("High profit opportunity");
  if (crashRisk > 0.7) alerts.push("High price crash risk");
  if (product.amazonBuyBoxPercent > 80)
    alerts.push("Buy Box dominated by Amazon");

  // 9️⃣ Product document
  const productData = {
    asin,
    marketplace,
    category,
    title: product.title,
    brand: product.brand,
    buyBoxPrice: product.buyBoxPrice,
    buyBoxSellerId: product.buyBoxSellerId,
    fbaFee: product.fbaFee,
    referralFee: product.referralFee,
    weight: product.weight,
    size: product.size,
    salesRank: product.salesRank,
    profit,
    salesVelocity,
    crashRisk,
    rankScore,
    alerts,
    createdAt: new Date(),
  };

  // 🔟 Mongo upsert
  await db.collection("products").updateOne(
    { asin, marketplace },
    { $set: productData },
    { upsert: true }
  );

  // 1️⃣1️⃣ Alerts collection
  if (alerts.length > 0) {
    await db.collection("alerts").insertOne({
      asin,
      marketplace,
      alerts,
      rankScore,
      createdAt: new Date(),
    });
  }

  return { asin, marketplace, rankScore };
});
