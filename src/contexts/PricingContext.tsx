import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { IndustryId, PackageId, UpsellId } from "@/lib/pricing-config";
import { getPackageById, getUpsellById } from "@/lib/pricing-config";

interface PricingState {
  industry: IndustryId;
  selectedPackage: PackageId | null;
  selectedUpsells: UpsellId[];
  isUpsellModalOpen: boolean;
}

interface PricingContextValue extends PricingState {
  setIndustry: (id: IndustryId) => void;
  selectPackage: (id: PackageId) => void;
  toggleUpsell: (id: UpsellId) => void;
  clearUpsells: () => void;
  openUpsellModal: () => void;
  closeUpsellModal: () => void;
  totalPrice: number;
  reset: () => void;
}

const initialState: PricingState = {
  industry: "corporate",
  selectedPackage: null,
  selectedUpsells: [],
  isUpsellModalOpen: false,
};

const PricingContext = createContext<PricingContextValue | undefined>(undefined);

export function PricingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PricingState>(initialState);

  const setIndustry = useCallback((id: IndustryId) => {
    setState((prev) => ({ ...prev, industry: id, selectedUpsells: [] }));
  }, []);

  const selectPackage = useCallback((id: PackageId) => {
    setState((prev) => ({ ...prev, selectedPackage: id, isUpsellModalOpen: true }));
  }, []);

  const toggleUpsell = useCallback((id: UpsellId) => {
    setState((prev) => ({
      ...prev,
      selectedUpsells: prev.selectedUpsells.includes(id)
        ? prev.selectedUpsells.filter((u) => u !== id)
        : [...prev.selectedUpsells, id],
    }));
  }, []);

  const clearUpsells = useCallback(() => {
    setState((prev) => ({ ...prev, selectedUpsells: [] }));
  }, []);

  const openUpsellModal = useCallback(() => {
    setState((prev) => ({ ...prev, isUpsellModalOpen: true }));
  }, []);

  const closeUpsellModal = useCallback(() => {
    setState((prev) => ({ ...prev, isUpsellModalOpen: false }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const totalPrice = useMemo(() => {
    let total = 0;
    if (state.selectedPackage) {
      const pkg = getPackageById(state.selectedPackage);
      if (pkg) total += pkg.price;
    }
    for (const upsellId of state.selectedUpsells) {
      const upsell = getUpsellById(upsellId);
      if (upsell) total += upsell.price;
    }
    return total;
  }, [state.selectedPackage, state.selectedUpsells]);

  const value: PricingContextValue = {
    ...state,
    setIndustry,
    selectPackage,
    toggleUpsell,
    clearUpsells,
    openUpsellModal,
    closeUpsellModal,
    totalPrice,
    reset,
  };

  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

export function usePricing() {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error("usePricing must be used within a PricingProvider");
  }
  return context;
}
