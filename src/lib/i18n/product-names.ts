/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Product/Category name internationalization helper
 */

/**
 * Returns the appropriate product name based on the current language.
 * Falls back to the Vietnamese name if no English name is available.
 */
export function getProductName(
  product: { name: string; nameEn?: string | null },
  language: string
): string {
  if (language === "en" && product.nameEn) {
    return product.nameEn;
  }
  return product.name;
}

/**
 * Returns the appropriate category name based on the current language.
 * Falls back to the Vietnamese name if no English name is available.
 */
export function getCategoryName(
  category: { name: string; nameEn?: string | null },
  language: string
): string {
  if (language === "en" && category.nameEn) {
    return category.nameEn;
  }
  return category.name;
}

/**
 * Returns the appropriate product description based on the current language.
 */
export function getProductDescription(
  product: { description: string; descriptionEn?: string | null },
  language: string
): string {
  if (language === "en" && product.descriptionEn) {
    return product.descriptionEn;
  }
  return product.description;
}
