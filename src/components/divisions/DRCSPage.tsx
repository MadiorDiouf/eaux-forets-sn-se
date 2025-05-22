// src/components/divisions/DRCSPage.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom'; // Ajout de useNavigate
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Edit2, Save } from 'lucide-react';
import DivisionSubNav, { SubNavItem } from './DivisionSubNav';

const sigle = "DRCS";
const intituleComplet = "Division Reboisement et Conservation des Sols";
const missionInitiale = "Coordonne les actions de reboisement, d’enrichissement et de restauration des forêts et des espaces ruraux ou urbains.\n\nPlanifie et suit les campagnes de reboisement et les actions de conservation des sols.";
const missionStorageKey = `mission_text_${sigle.toLowerCase()}`;

const DRCSPage: React.FC = () => {
  const { currentUser } = useAuth();
  const canEditMissions = currentUser?.role === 'admin' || currentUser?.role === 'editeur';

  const [missionText, setMissionText] = useState(missionInitiale);
  const [isEditingMission, setIsEditingMission] = useState(false);
  const [editText, setEditText] = useState(missionInitiale);
  
  // États pour les menus principaux de la navigation globale (s'ils étaient gérés ici)
  // Mais ici, nous avons besoin d'un moyen d'appeler la fonction de fermeture du Navigation.tsx parent.
  // Puisque DRCSPage est un enfant de la route principale, il ne peut pas directement contrôler l'état de Navigation.tsx
  // La solution la plus simple est de ne pas fermer les menus globaux depuis la sous-navigation.
  // Si nous voulions vraiment les fermer, il faudrait une gestion d'état globale (Contexte ou Zustand/Redux)
  // pour que DivisionSubNav puisse signaler à Navigation.tsx de se fermer.
  //
  // SOLUTION ALTERNATIVE (et plus simple ici):
  // La sous-navigation (DivisionSubNav) va juste naviguer.
  // C'est le `useEffect` dans Navigation.tsx, qui écoute location.pathname,
  // qui devrait se charger de mettre à jour expandedItem/expandedSubItem correctement.
  // LE PROBLEME INITIAL VIENT DU FAIT QUE LE CLIC SUR LE NAVLINK de la SOUS-NAVIGATION NE DÉCLENCHE PAS LE MECANISME DE FERMETURE
  // des menus principaux.

  // ***** Simplification pour ce contexte *****
  // On ne passera pas de fonction pour fermer les menus globaux.
  // Le comportement est que les menus globaux restent ouverts, et c'est le useEffect de Navigation.tsx
  // qui devrait maintenir le bon menu principal ouvert quand on navigue DANS DRCS.

  useEffect(() => {
    const storedMission = localStorage.getItem(missionStorageKey);
    if (storedMission) {
      setMissionText(storedMission);
      setEditText(storedMission);
    }
  }, []);

  const handleEditMission = () => { setEditText(missionText); setIsEditingMission(true); };
  const handleSaveMission = () => { localStorage.setItem(missionStorageKey, editText); setMissionText(editText); setIsEditingMission(false); toast.success(`Missions pour ${sigle} mises à jour !`); };
  const handleCancelEditMission = () => { setIsEditingMission(false); };

  const drcsSubNavItems: SubNavItem[] = [
    { label: 'JNA', path: 'jna' },
    { label: 'Distribution des semences', path: 'distribution-semences' },
    { label: 'Production de plants', path: 'production-plants' },
    { 
      label: 'Réalisations physiques', 
      subItems: [
        { label: 'Plantations Massives', path: 'realisations-physiques/plantations-massives' },
        { label: 'Plantations linéaires', path: 'realisations-physiques/plantations-lineaires' },
        { label: 'Plantations de restauration/réhabilitation', path: 'realisations-physiques/restauration-rehabilitation' },
        { label: 'Défense et restauration des sols', path: 'realisations-physiques/drs' },
      ]
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-4"> {sigle} : <span className="font-medium">{intituleComplet}</span> </h1>
      <div className="bg-blue-50 p-4 rounded-md shadow mb-6 relative group"> {/* ... (logique mission inchangée) ... */} <div className="flex justify-between items-start"> <div> <h2 className="text-xl font-semibold text-blue-600 mb-2">Missions Principales :</h2> {!isEditingMission ? ( <p className="text-gray-700 whitespace-pre-line">{missionText}</p> ) : ( <div className="space-y-2"> <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={8} className="w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" /> <div className="flex justify-end space-x-2"> <button onClick={handleCancelEditMission} className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"> Annuler </button> <button onClick={handleSaveMission} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"> <Save size={16} className="mr-1.5"/> Enregistrer </button> </div> </div> )} </div> {canEditMissions && !isEditingMission && ( <button onClick={handleEditMission} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none hover:bg-blue-100 rounded-full" title="Modifier les missions"> <Edit2 size={18} /> </button> )} </div> </div>

      {/* PAS DE PASSAGE DE closeAllGlobalMenus ici pour le moment */}
      <DivisionSubNav items={drcsSubNavItems} basePath="/statistiques/drcs" />

      <div className="mt-6 p-4 border-t border-gray-200"> <Outlet /> </div>
    </div>
  );
};

export default DRCSPage;