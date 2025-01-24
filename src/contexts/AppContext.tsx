import React, { createContext, useContext, useState, useCallback } from 'react';

type AppState = 'initial' | 'ready' | 'error';

interface AppErrors {
  audio: Error | null;
  effect: Error | null;
  project: Error | null;
  export: Error | null;
}

interface AppContextType {
  appState: AppState;
  errors: AppErrors;
  handleError: (type: keyof AppErrors, error: Error) => void;
  clearError: (type: keyof AppErrors) => void;
  transition: (newState: AppState) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>('initial');
  const [errors, setErrors] = useState<AppErrors>({
    audio: null,
    effect: null,
    project: null,
    export: null
  });

  const handleError = useCallback((type: keyof AppErrors, error: Error) => {
    console.error(`${type}エラー:`, error);
    setErrors(prev => ({
      ...prev,
      [type]: error
    }));
    setAppState('error');
  }, []);

  const clearError = useCallback((type: keyof AppErrors) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[type];
      return newErrors;
    });
    if (Object.keys(errors).length === 1) {
      setAppState('ready');
    }
  }, [errors]);

  const transition = useCallback((newState: AppState) => {
    console.log(`状態遷移: ${appState} -> ${newState}`);
    setAppState(newState);
  }, [appState]);

  return (
    <AppContext.Provider value={{
      appState,
      errors,
      handleError,
      clearError,
      transition
    }}>
      {children}
    </AppContext.Provider>
  );
}; 