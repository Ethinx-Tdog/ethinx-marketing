export type PromoGroup = "control" | "banner_default" | "banner_flash";

const STORAGE_KEY = "promo_ab_group";

// Valid groups for validation
const GROUPS: PromoGroup[] = ["control", "banner_default", "banner_flash"];

// Weighted distribution: 70% flash, 30% control (effective until 2025-01-11)
// After 72h, revert to equal distribution
const FLASH_BIAS_END = new Date("2025-01-11T00:00:00Z");

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

  let assigned: PromoGroup;
  
  // Check if we're still in the flash bias period
  if (new Date() < FLASH_BIAS_END) {
    // 70% flash, 30% control
    assigned = Math.random() < 0.7 ? "banner_flash" : "control";
  } else {
    // After bias period: equal 33% distribution
    const randomIndex = Math.floor(Math.random() * GROUPS.length);
    assigned = GROUPS[randomIndex];
  }
  
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
