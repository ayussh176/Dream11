import React, { createContext, useContext, useState } from 'react';

interface TacticalContextType {
  activeMatchId: string;
  setActiveMatchId: (id: string) => void;
  activeDeliveryId: string;
  setActiveDeliveryId: (id: string) => void;
  selectedFielderId: string | null;
  setSelectedFielderId: (id: string | null) => void;
}

const TacticalContext = createContext<TacticalContextType | undefined>(undefined);

export const TacticalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMatchId, setActiveMatchId] = useState<string>('demo-t20-m01');
  const [activeDeliveryId, setActiveDeliveryId] = useState<string>('del-19-01');
  const [selectedFielderId, setSelectedFielderId] = useState<string | null>(null);

  return (
    <TacticalContext.Provider
      value={{
        activeMatchId,
        setActiveMatchId,
        activeDeliveryId,
        setActiveDeliveryId,
        selectedFielderId,
        setSelectedFielderId,
      }}
    >
      {children}
    </TacticalContext.Provider>
  );
};

export const useTactical = (): TacticalContextType => {
  const context = useContext(TacticalContext);
  if (!context) {
    throw new Error('useTactical must be used within a TacticalProvider');
  }
  return context;
};

