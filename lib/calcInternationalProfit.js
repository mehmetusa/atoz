/**
 * Calculate International Arbitrage Profit
 * @param {Object} keepa - normalized Keepa product data
 * @param {Object} config - marketplace & logistics config
 */
export function calcInternationalProfit(keepa, config) {
  const {
    buyBoxPrice,      // target marketplace (USD)
    fbaFee,
    referralFee,
    closingFee = 0,
    weightKg,
  } = keepa;

  const {
    buyPrice,               // source marketplace price
    intlShippingPerKg,      // $ / kg
    customsRate,            // 0.0 - 0.1
    fxLossRate,             // 0.005 - 0.03
    localShippingSource,    // source → prep
    localShippingTarget,    // prep → FBA
  } = config;

  // 1️⃣ Amazon fees
  const amazonFees =
    fbaFee +
    referralFee +
    closingFee;

  // 2️⃣ International shipping
  const intlShipping =
    weightKg * intlShippingPerKg;

  // 3️⃣ Customs
  const customsCost =
    buyPrice * customsRate;

  // 4️⃣ Local shipping
  const localShipping =
    localShippingSource +
    localShippingTarget;

  // 5️⃣ Currency loss
  const currencyCost =
    (buyPrice + intlShipping) * fxLossRate;

  // 6️⃣ Net profit
  const netProfit =
    buyBoxPrice -
    amazonFees -
    buyPrice -
    intlShipping -
    customsCost -
    localShipping -
    currencyCost;

  // 7️⃣ ROI
  const roi =
    (netProfit / buyPrice) * 100;

  return {
    netProfit: Number(netProfit.toFixed(2)),
    roi: Number(roi.toFixed(2)),
    breakdown: {
      buyBoxPrice,
      buyPrice,
      amazonFees,
      intlShipping,
      customsCost,
      localShipping,
      currencyCost,
    },
  };
}
