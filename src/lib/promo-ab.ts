export type PromoGroup = "control" | "banner_default" | "banner_flash";

const STORAGE_KEY = "promo_ab_group";

// Weighted distribution: 33% each
const GROUPS: PromoGroup[] = ["control", "banner_default", "banner_flash"];

/**
 * Get or assign a user to an A/B test group.
 * Assignment is persisted in localStorage.
 */
export const getPromoGroup = (): PromoGroup => {
  // Check existing assignment
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && GROUPS.includes(stored as PromoGroup)) {
    return stored as PromoGroup;
  }

  // Random assignment
  const randomIndex = Math.floor(Math.random() * GROUPS.length);
  const assigned = GROUPS[randomIndex];
  
  localStorage.setItem(STORAGE_KEY, assigned);
  return assigned;
};

/**
 * Get current group without assigning (for analytics)
 */
export const getCurrentPromoGroup = (): PromoGroup | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && GROUPS.includes(stored as PromoGroup)) {
    return stored as PromoGroup;
  }
  return null;
};

/**
 * Reset group assignment (for testing)
 * Use URL param: ?resetPromoAB=true
 */
export const resetPromoGroup = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
