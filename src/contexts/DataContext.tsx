// src/contexts/DataContext.tsx
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

interface DataContextType {
  dataVersion: number; // Un simple compteur pour forcer la mise à jour des composants dépendants
  notifyDataChange: () => void; // Fonction pour incrémenter dataVersion
}

// Création du contexte avec une valeur par défaut undefined (sera initialisé par le Provider)
const DataContext = createContext<DataContextType | undefined>(undefined);

/**
 * Provider pour le contexte de données.
 * Il maintient un état `dataVersion` et fournit une fonction `notifyDataChange`
 * pour mettre à jour cette version, ce qui déclenchera un re-rendu des composants
 * qui consomment ce contexte et dépendent de `dataVersion`.
 */
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dataVersion, setDataVersion] = useState(0);

  // Utilisation de useCallback pour mémoriser la fonction notifyDataChange.
  // Elle ne sera recréée que si dataVersion change (ce qui est son but ici).
  const notifyDataChange = useCallback(() => {
    setDataVersion(prevVersion => {
      const newVersion = prevVersion + 1;
      // console.log("DataContext: Data change notified. New version:", newVersion); // Pour le débogage
      return newVersion;
    });
  }, []); // dataVersion a été retiré des dépendances de useCallback car la mise à jour utilise prevVersion.

  return (
    <DataContext.Provider value={{ dataVersion, notifyDataChange }}>
      {children}
    </DataContext.Provider>
  );
};

/**
 * Hook personnalisé pour consommer facilement le DataContext.
 * Assure que le hook est utilisé à l'intérieur d'un DataProvider.
 * @returns L'objet du contexte de données (dataVersion et notifyDataChange).
 */
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider. Make sure your component tree is wrapped with <DataProvider>.');
  }
  return context;
};