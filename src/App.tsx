// src/App.tsx (Version CORRIGÉE SANS le <Router> interne et son import spécifique)
import React from 'react';
// Supprimer l'import 'BrowserRouter as Router' s'il était spécifique ici. Les autres imports de react-router-dom sont OK.
import { Routes, Route, Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { MessageProvider } from './contexts/MessageContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Tous vos autres imports restent ici ---
import Header from './components/Header';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import ReportPage from './components/ReportPage';
import MissionsDSEFS from './components/MissionsDSEFS';
import AgentsDSEFS from './components/AgentsDSEFS';
import DocumentsUtilesPage from './components/DocumentsUtilesPage';
import ComptesRendusPage from './components/ComptesRendusPage';
import RapportsEnPreparationPage from './components/RapportsEnPreparationPage';
import MissionsAteliersPage from './components/MissionsAteliersPage';
import LoginPage from './components/LoginPage';
import SecurityPage from './components/SecurityPage';
import PendingApprovalPage from './components/PendingApprovalPage';
import ProjetsDefccsPage from './components/ProjetsDefccsPage';
import { Edit2, Save } from 'lucide-react';
import ChatPage from './components/ChatPage';
import DRCSPage from './components/divisions/DRCSPage';
import JNAPage from './components/divisions/drcs/JNAPage';
import DistributionSemencesPage from './components/divisions/drcs/DistributionSemencesPage';
import ProductionPlantsPage from './components/divisions/drcs/ProductionPlantsPage';
import RealisationsPhysiquesMassivesPage from './components/divisions/drcs/RealisationsPhysiquesMassivesPage';
import RealisationsPhysiquesLineairesPage from './components/divisions/drcs/RealisationsPhysiquesLineairesPage';
import RealisationsPhysiquesRestaurationPage from './components/divisions/drcs/RealisationsPhysiquesRestaurationPage';
import RealisationsPhysiquesDRSPage from './components/divisions/drcs/RealisationsPhysiquesDRSPage';
import CERSIPage from './components/divisions/CERSIPage';
import AdminRouteGuard from './components/auth/AdminRouteGuard';
import ProtectedRouteGuard from './components/auth/ProtectedRouteGuard';
import PendingRegistrationsPage from './components/admin/PendingRegistrationsPage';
// -------------------------------------------


// Votre fonction createStatPageComponent (inchangée)
const createStatPageComponent = (sigle: string, intituleComplet: string, missionInitiale: string) => {
  // ... (code de createStatPageComponent) ...
  // eslint-disable-next-line react/display-name
  return () => {
    const { currentUser } = useAuth(); // useAuth vient de votre AuthContext
    const canEditMissions = currentUser?.role === 'admin' || currentUser?.role === 'editeur';
    const missionStorageKey = `mission_text_${sigle.toLowerCase()}`;
    const [missionText, setMissionText] = React.useState(missionInitiale); 
    const [isEditingMission, setIsEditingMission] = React.useState(false); 
    const [editText, setEditText] = React.useState(missionInitiale);       

    React.useEffect(() => { 
      const storedMission = localStorage.getItem(missionStorageKey);
      if (storedMission) {
        setMissionText(storedMission);
        setEditText(storedMission);
      } else {
        setMissionText(missionInitiale);
        setEditText(missionInitiale);
        localStorage.setItem(missionStorageKey, missionInitiale);
      }
    }, [missionStorageKey, missionInitiale]);

    const handleEditMission = () => { setEditText(missionText); setIsEditingMission(true); };
    const handleSaveMission = () => { 
      localStorage.setItem(missionStorageKey, editText); 
      setMissionText(editText); 
      setIsEditingMission(false); 
    };
    const handleCancelEditMission = () => { setIsEditingMission(false); setEditText(missionText); };

    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">{sigle} : <span className="font-medium">{intituleComplet}</span></h1>
        <div className="bg-blue-50 p-4 rounded-md shadow mb-6 relative group">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-blue-600 mb-2">Missions Principales :</h2>
              {!isEditingMission ? (<p className="text-gray-700 whitespace-pre-line">{missionText}</p>) : (
                <div className="space-y-2">
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={8} className="w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                  <div className="flex justify-end space-x-2">
                    <button onClick={handleCancelEditMission} className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md">Annuler</button>
                    <button onClick={handleSaveMission} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"><Save size={16} className="mr-1.5"/> Enregistrer</button>
                  </div>
                </div>)}
            </div>
            {canEditMissions && !isEditingMission && (
              <button onClick={handleEditMission} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none hover:bg-blue-100 rounded-full" title="Modifier les missions">
                <Edit2 size={18} />
              </button>
            )}
          </div>
        </div>
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-md min-h-[200px]">
          <p className="text-gray-500 text-center py-10">La "petite barre de menu" et les statistiques spécifiques pour {sigle} sont en cours de développement.</p>
        </div>
      </div>
    );
  };
};
// ... (définitions de PageStatDAPF, etc. restent inchangées)
const PageStatDAPF = createStatPageComponent("DAPF", "Division Aménagement et Productions Forestières", "Coordonne l’élaboration et le suivi des plans d’aménagement forestier.\n\nAssure la planification et le suivi des campagnes d’exploitation forestière.\n\nSuit la politique énergétique liée aux combustibles domestiques.");
const PageStatDPF  = createStatPageComponent("DPF", "Division Protection des Forêts", "Coordonne la stratégie nationale de prévention et protection des forêts.\n\nLutte contre les feux de brousse et les agressions naturelles.\n\nSuit les protocoles avec les industries extractives et traite les demandes liées aux forêts classées.");
const PageStatDGF  = createStatPageComponent("DGF", "Division Gestion de la Faune", "Gère les ressources fauniques et leurs habitats.\n\nOrganise le tourisme cynégétique et suit la CITES (Convention de Washington).\n\nSupervise l’aménagement des plans d’eau et le commerce des animaux vivants.");
const PageStatBCC  = createStatPageComponent("BCC", "Bureau Changements Climatiques", "Rattaché à la DEFCCS, ce bureau traite des questions liées aux changements climatiques, en lien avec la gestion durable des ressources naturelles et la résilience écologique.");
const PageStatBCBN = createStatPageComponent("BCBN","Bureau Contentieux et Brigade nationale", "Gère les infractions au code forestier et faunique.\n\nCoordonne la collecte et le traitement des procès-verbaux.\n\nSuit les recettes contentieuses (amendes, transactions, etc.).");


const AppLayout: React.FC = () => {
  const { currentUser } = useAuth();
  return (
    <div className="flex flex-col min-h-screen">
      {currentUser && currentUser.status === 'approuve' && (
        <div className="sticky top-0 z-50 bg-white shadow-md">
          <Header />
          <Navigation />
        </div>
      )}
      <main className={`flex-grow container mx-auto px-4 py-2 ${(!currentUser || currentUser.status !== 'approuve') ? 'pt-8' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};


function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <MessageProvider> 
          <ToastContainer 
            position="top-right" 
            autoClose={4000} 
            hideProgressBar={false} 
            newestOnTop={false} 
            closeOnClick 
            rtl={false} 
            pauseOnFocusLoss 
            draggable 
            pauseOnHover 
            theme="colored"
          />
          {/* PAS DE <Router> ICI car il est dans main.tsx */}
          <Routes> {/* <Routes> directement */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/en-attente-validation" element={<PendingApprovalPage />} />

            <Route element={<AppLayout />}>
              <Route element={<ProtectedRouteGuard />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/discussion" element={<ChatPage />} />
                <Route path="dsefs/missions" element={<MissionsDSEFS />} />
                <Route path="dsefs/agents" element={<AgentsDSEFS />} />
                <Route path="rapports/preparation" element={<RapportsEnPreparationPage />} />
                <Route path="rapports/projets-defccs" element={<ProjetsDefccsPage />} />
                <Route path="rapports/:reportType" element={<ReportPage />} />
                <Route path="agenda-dsefs" element={<MissionsAteliersPage />} />
                <Route path="documents" element={<DocumentsUtilesPage />} />
                <Route path="comptes-rendus" element={<ComptesRendusPage />} />
                
                <Route path="statistiques/drcs" element={<DRCSPage />}>
                  <Route index element={<JNAPage />} /> 
                  <Route path="jna" element={<JNAPage />} />
                  <Route path="distribution-semences" element={<DistributionSemencesPage />} />
                  <Route path="production-plants" element={<ProductionPlantsPage />} />
                  <Route path="realisations-physiques/plantations-massives" element={<RealisationsPhysiquesMassivesPage />} />
                  <Route path="realisations-physiques/plantations-lineaires" element={<RealisationsPhysiquesLineairesPage />} />
                  <Route path="realisations-physiques/restauration-rehabilitation" element={<RealisationsPhysiquesRestaurationPage />} />
                  <Route path="realisations-physiques/drs" element={<RealisationsPhysiquesDRSPage />} />
                </Route>
                
                <Route path="statistiques/dapf" element={<PageStatDAPF />} />
                <Route path="statistiques/dpf" element={<PageStatDPF />} />
                <Route path="statistiques/dgf" element={<PageStatDGF />} />
                <Route path="statistiques/bcc" element={<PageStatBCC />} />
                <Route path="statistiques/cersi" element={<CERSIPage />} />
                <Route path="statistiques/bcbn" element={<PageStatBCBN />} />
              </Route>

              <Route element={<AdminRouteGuard />}>
                <Route path="securite" element={<SecurityPage />} /> 
                <Route path="admin/pending-registrations" element={<PendingRegistrationsPage />} />
              </Route>
            </Route>

            <Route path="*" element={
              <div className="container mx-auto p-6 text-center mt-10">
                <h1 className="text-4xl font-bold text-red-600">404</h1>
                <p className="text-xl text-gray-700 mt-4">Page non trouvée</p>
                <Link to="/" className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                  Retour à l'accueil
                </Link>
              </div>
            } />
          </Routes>
          {/* PAS DE </Router> ICI */}
        </MessageProvider>
      </AuthProvider>
    </DataProvider>
  );
}

export default App;