'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ValidationResultData } from '../lib/models';

interface ValidationContextValue {
  results: ValidationResultData[] | null;
  setResults: (results: ValidationResultData[]) => void;
  clearResults: () => void;
}

const ValidationContext = createContext<ValidationContextValue | null>(null);

export function ValidationProvider({ children }: { children: ReactNode }) {
  const [results, setResultsState] = useState<ValidationResultData[] | null>(
    null
  );

  const setResults = (data: ValidationResultData[]) => {
    setResultsState(data);
  };

  const clearResults = () => {
    setResultsState(null);
  };

  return (
    <ValidationContext.Provider value={{ results, setResults, clearResults }}>
      {children}
    </ValidationContext.Provider>
  );
}

export function useValidation() {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within ValidationProvider');
  }
  return context;
}
