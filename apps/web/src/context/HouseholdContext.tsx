import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { Household } from '@stockhome/shared';

interface HouseholdContextValue {
  households: Household[];
  selectedHouseholdId: string | null;
  selectedHousehold: Household | null;
  hasHousehold: boolean;
  householdsLoaded: boolean;
  setSelectedHousehold: (id: string) => void;
  refreshHouseholds: () => Promise<void>;
  isLoading: boolean;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(
    () => localStorage.getItem('selectedHouseholdId'),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [householdsLoaded, setHouseholdsLoaded] = useState(false);

  const refreshHouseholds = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await api.get<Household[]>('/households');
      setHouseholds(list);

      // If no household selected, pick the first one
      if (!selectedHouseholdId && list.length > 0) {
        const firstId = list[0]!.id;
        setSelectedHouseholdId(firstId);
        localStorage.setItem('selectedHouseholdId', firstId);
      }

      // If selected household no longer accessible, reset
      if (selectedHouseholdId && !list.find((h) => h.id === selectedHouseholdId)) {
        if (list.length > 0) {
          const firstId = list[0]!.id;
          setSelectedHouseholdId(firstId);
          localStorage.setItem('selectedHouseholdId', firstId);
        } else {
          setSelectedHouseholdId(null);
          localStorage.removeItem('selectedHouseholdId');
        }
      }
    } catch {
      // 401 → api.ts redirects to login; other errors: just mark as loaded
    } finally {
      setIsLoading(false);
      setHouseholdsLoaded(true);
    }
  }, [selectedHouseholdId]);

  const setSelectedHousehold = useCallback((id: string) => {
    setSelectedHouseholdId(id);
    localStorage.setItem('selectedHouseholdId', id);
  }, []);

  // Load households when token is available
  useEffect(() => {
    void refreshHouseholds();
  }, []);

  const selectedHousehold = households.find((h) => h.id === selectedHouseholdId) ?? null;
  const hasHousehold = households.length > 0;

  return (
    <HouseholdContext.Provider
      value={{
        households,
        selectedHouseholdId,
        selectedHousehold,
        hasHousehold,
        householdsLoaded,
        setSelectedHousehold,
        refreshHouseholds,
        isLoading,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
  return ctx;
}
