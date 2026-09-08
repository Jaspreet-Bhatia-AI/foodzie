'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface BrandContextType {
  brandName: string;
  isUniFoodz: boolean;
  toggleBrand: (newBrand: 'Foodzie' | 'UniFoodz') => Promise<void>;
  isLoading: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brandName, setBrandName] = useState<string>('Foodzie');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBrand = async () => {
    try {
      const res = await api.get<{ brand: string }>('/api/admin/brand');
      if (res && res.brand) {
        setBrandName(res.brand);
      }
    } catch (err) {
      console.error('Failed to load active brand identity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrand();
  }, []);

  const toggleBrand = async (newBrand: 'Foodzie' | 'UniFoodz') => {
    setIsLoading(true);
    try {
      await api.post('/api/admin/brand', { brand: newBrand });
      setBrandName(newBrand);
    } catch (err) {
      console.error('Failed to toggle brand identity:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const isUniFoodz = brandName === 'UniFoodz';

  return (
    <BrandContext.Provider value={{ brandName, isUniFoodz, toggleBrand, isLoading }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    return { brandName: 'Foodzie', isUniFoodz: false, toggleBrand: async () => {}, isLoading: false };
  }
  return context;
}
