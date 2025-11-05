import React, { createContext, useContext, useMemo, useState } from 'react';

const HomeCacheContext = createContext(null);

export const useHomeCache = () => useContext(HomeCacheContext);

export function HomeCacheProvider({ children }) {
  const [cache, setCache] = useState({
    // Filters/UI state
    searchTerm: '',
    selectedCategory: '',
    currentPage: 1,

    // Data
    categories: [],
    documents: [],
    totalPages: 1,
    topCommenter: null,
    topDownloadedDoc: null,
    topInterestDocuments: [],

    // Meta
    hydratedAt: 0,
  });

  const value = useMemo(() => ({ cache, setCache }), [cache]);

  return (
    <HomeCacheContext.Provider value={value}>
      {children}
    </HomeCacheContext.Provider>
  );
}
