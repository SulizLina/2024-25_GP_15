import React, { createContext, useState, useEffect } from 'react';

export const FirstNameContext = createContext();

export const FirstNameProvider = ({ children }) => {
  const [firstName, setFirstNameState] = useState(
    sessionStorage.getItem('FirstName') || ''
  );

  const setFirstName = (newName) => {
    setFirstNameState(newName);
    sessionStorage.setItem('FirstName', newName);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedFirstName = sessionStorage.getItem('FirstName') || '';
      setFirstNameState(updatedFirstName);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <FirstNameContext.Provider value={{ firstName, setFirstName }}>
      {children}
    </FirstNameContext.Provider>
  );
};
