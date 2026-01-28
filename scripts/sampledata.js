export const sampleProductData ={
    upc: "123456789012",
    asinUS: "B0US123",
    asinEU: "B0EU456",
    marketPair: "US-DE",
  
    pricing: {
      usPrice: 12.50,
      euPrice: 24.99,
      exchangeRate: 1.08,
      fbaFee: 6.20,
      referralFee: 3.10,
      shippingCost: 1.20,
      netProfit: 5.99,
      roi: 48
    },
  
    sales: {
      monthlySalesEst: 185,
      velocityScore: 8,
      rankTrend: "improving"
    },
  
    priceStability: {
      avg90: 23.80,
      deviation: 0.05,
      stableDays: 18,
      offerCount: 6,
      stabilityScore: 9
    },
  
    competition: {
      sellers: 5,
      amazonOnListing: false,
      buyBoxSellers30d: 3,
      priceWarRisk: false,
      competitionScore: 8
    },
  
    scores: {
      profitScore: 8,
      velocityScore: 8,
      stabilityScore: 9,
      competitionScore: 8,
      finalScore: 8.3
    },
  
    status: "new", // new, viewed, bought, ignored
    createdAt: ISODate()
  }
  