// src/components/MissionsDSEFS.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'react-toastify';
import { Edit3, Save, XCircle, Loader2 as Loader } from 'lucide-react';

const MOCK_MISSIONS_KEY = 'dsefs_missions_data';
const getDefaultMissions = (): string => {
  return `
Missions Principales :
- Assurer le suivi et l'évaluation des politiques publiques.
- Coordonner les activités de planification stratégique.
- Produire des rapports d'analyse et de performance.
- Promouvoir la formation et la sensibilisation en matière de suivi-évaluation.

Objectifs Stratégiques :
1.  Améliorer la transparence et la redevabilité dans la gestion publique.
2.  Renforcer les capacités institutionnelles et individuelles en S&E, formation et sensibilisation.
3.  Promouvoir une culture de la gestion axée sur les résultats et l'apprentissage continu.
  `.trim();
};

const MissionsDSEFS: React.FC = () => {
  const auth = useAuth();
  const { notifyDataChange } = useData();
  const userRole = auth.currentUser?.role;
  const canEdit = userRole === 'admin' || userRole === 'editeur';

  const [missionsText, setMissionsText] = useState<string>('');
  const [originalMissionsText, setOriginalMissionsText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    const storedMissions = localStorage.getItem(MOCK_MISSIONS_KEY);
    const currentText = storedMissions || getDefaultMissions();
    setMissionsText(currentText);
    setOriginalMissionsText(currentText);
    setIsLoading(false);
  }, []);

  const handleEditClick = () => {
    if (!canEdit) {
      toast.warn("Action non autorisée.");
      return;
    }
    setOriginalMissionsText(missionsText);
    setIsEditing(true);
  };

  const handleSaveMissions = () => {
    if (!canEdit) {
      toast.error("Action non autorisée.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      localStorage.setItem(MOCK_MISSIONS_KEY, missionsText);
      setOriginalMissionsText(missionsText);
      setIsEditing(false);
      notifyDataChange(); 
      toast.success('Contenu des missions sauvegardé !');
      setIsSubmitting(false);
    }, 500);
  };

  const handleCancelEdit = () => {
    setMissionsText(originalMissionsText);
    setIsEditing(false);
    toast.info("Modifications annulées.");
  };

  if (isLoading) {
    return <div className="container mx-auto p-6 text-center text-gray-500"><Loader size={28} className="inline-block animate-spin mr-2"/>Chargement des missions...</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-xl mt-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-700 mb-3 sm:mb-0">
          Missions de la Division Suivi-Évaluation, Formation et Sensibilisation
        </h1>
        {canEdit && !isEditing && (
          <button
            onClick={handleEditClick}
            // --- MODIFICATION DES CLASSES POUR LA COULEUR VERTE ---
            className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors shadow-sm"
            // --- FIN MODIFICATION ---
          >
            <Edit3 size={16} className="mr-2" />
            Modifier le Contenu
          </button>
        )}
      </div>
      
      {isEditing && canEdit ? (
        <div className="space-y-4">
          <textarea
            value={missionsText}
            onChange={(e) => setMissionsText(e.target.value)}
            rows={18}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 leading-relaxed"
            placeholder="Décrivez ici les missions et objectifs..."
          />
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={handleCancelEdit}
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors shadow-sm"
            >
              <XCircle size={16} className="mr-2" />
              Annuler
            </button>
            {/* Le bouton Sauvegarder reste vert, ce qui est bien */}
            <button
              onClick={handleSaveMissions}
              disabled={isSubmitting} 
              className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? <Loader size={16} className="mr-2 animate-spin"/> : <Save size={16} className="mr-2" />}
              {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      ) : (
        <div className="prose prose-slate max-w-none lg:prose-lg text-gray-800 whitespace-pre-line leading-relaxed">
          {missionsText}
        </div>
      )}
    </div>
  );
};

export default MissionsDSEFS;