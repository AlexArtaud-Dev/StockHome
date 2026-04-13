import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { Household } from '@stockhome/shared';

interface HouseholdContextValue {
  households: Household[];
  selectedHouseholdId: string | null;
  selectedHousehold: Household | null;
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

  const refreshHouseholds = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

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
      // Auth errors handled by api.ts
    } finally {
      setIsLoading(false);
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

  return (
    <HouseholdContext.Provider
      value={{
        households,
        selectedHouseholdId,
        selectedHousehold,
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
