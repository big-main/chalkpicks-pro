import { useState, useCallback } from "react";

interface UpsellState {
  isOpen: boolean;
  featureName: string;
  requiredTier: string;
}

export function useUpsellModal() {
  const [state, setState] = useState<UpsellState>({
    isOpen: false,
    featureName: "",
    requiredTier: "Pro",
  });

  const openUpsell = useCallback((featureName: string, requiredTier = "Pro") => {
    setState({ isOpen: true, featureName, requiredTier });
  }, []);

  const closeUpsell = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  return {
    isOpen: state.isOpen,
    featureName: state.featureName,
    requiredTier: state.requiredTier,
    openUpsell,
    closeUpsell,
  };
}
