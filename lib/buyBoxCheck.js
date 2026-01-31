import { AMAZON_SELLER_IDS } from "../config/amazon.js";

export function isAmazonOnBuyBox(buyBoxSellerId, marketplace) {
  return buyBoxSellerId === AMAZON_SELLER_IDS[marketplace];
}
