import React, { createContext, useState, useEffect } from 'react';

export const ShortCompanyNameContext = createContext();

export const ShortCompanyNameProvider = ({ children }) => {
  const [shortCompanyName, setShortCompanyNameState] = useState(
    sessionStorage.getItem('ShortCompanyName') || ''
  );

  const setShortCompanyName = (newName) => {
    setShortCompanyNameState(newName); // Update state
    sessionStorage.setItem('ShortCompanyName', newName); // Update sessionStorage
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedShortCompanyName = sessionStorage.getItem('ShortCompanyName') || '';
      setShortCompanyNameState(updatedShortCompanyName);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <ShortCompanyNameContext.Provider value={{ shortCompanyName, setShortCompanyName }}>
      {children}
    </ShortCompanyNameContext.Provider>
  );
};
