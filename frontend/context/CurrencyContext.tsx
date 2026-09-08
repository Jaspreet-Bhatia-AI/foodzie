'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface University {
  id: string;
  name: string;
  country?: string;
}

interface UserProfile {
  id: string;
  universityId?: string;
}

interface CurrencyContextType {
  getCurrencySymbol: (uniId?: string | null) => string;
  formatCurrency: (amount: number, uniId?: string | null) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [currentUserUniId, setCurrentUserUniId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    try {
      const [uniRes, authRes] = await Promise.all([
        api.get<{ universities: University[] }>('/api/menu/universities').catch(() => ({ universities: [] })),
        api.get<UserProfile>('/api/auth/me').catch(() => null)
      ]);
      
      if (uniRes && uniRes.universities) {
        setUniversities(uniRes.universities);
      }
      
      if (authRes && authRes.universityId) {
        setCurrentUserUniId(authRes.universityId);
      }
    } catch (err) {
      console.error('Failed to load currency context data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCurrencySymbol = useCallback((uniId?: string | null) => {
    const targetUniId = uniId || currentUserUniId;
    if (!targetUniId || targetUniId === '') return '₹';
    const uni = universities.find(u => u.id === targetUniId);
    return uni?.country === 'India' ? '₹' : '$';
  }, [universities, currentUserUniId]);

  const formatCurrency = useCallback((amount: number, uniId?: string | null) => {
    const sym = getCurrencySymbol(uniId);
    return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [getCurrencySymbol]);

  return (
    <CurrencyContext.Provider value={{ getCurrencySymbol, formatCurrency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    // Fallback if used outside provider
    return {
      getCurrencySymbol: () => '₹',
      formatCurrency: (amount: number) => `₹${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isLoading: false
    };
  }
  return context;
}
