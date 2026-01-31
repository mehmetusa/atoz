import { BRAND_WHITELIST, BRAND_BLACKLIST } from "../config/brands.js";

export function isBrandAllowed(brand) {
  if (!brand) return false;

  const b = brand.toLowerCase();

  if (BRAND_BLACKLIST.includes(b)) return false;

  if (BRAND_WHITELIST.length > 0 && !BRAND_WHITELIST.includes(b)) {
    return false;
  }

  return true;
}
