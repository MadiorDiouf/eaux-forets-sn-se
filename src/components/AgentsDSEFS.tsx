// src/components/AgentsDSEFS.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { PlusCircle, Edit3, Trash2, UserCircle, Mail, Phone, Save } from 'lucide-react'; // AJOUT: Save pour le bouton modifier
import { toast } from 'react-toastify';

// ... (interface AgentProfile, MOCK_AGENTS_KEY inchangés)
export interface AgentProfile {
  id: string;
  nom: string;
  prenom: string;
  grade: string;
  poste: string;
  profilPoste: string;
  email?: string;
  telephone?: string;
  photoUrl?: string;
}
const MOCK_AGENTS_KEY = 'dsefs_agents_data';


const AgentsDSEFS: React.FC = () => {
  // ... (états et hooks initiaux inchangés: auth, notifyDataChange, userRole, canEdit, agents, isLoading, showForm, editingAgent)
  const auth = useAuth();
  const { notifyDataChange } = useData();
  const userRole = auth.currentUser?.role;
  const canEdit = userRole === 'admin' || userRole === 'editeur';

  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingAgent, setEditingAgent] = useState<AgentProfile | null>(null);

  // États du formulaire (inchangés)
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [grade, setGrade] = useState('');
  const [poste, setPoste] = useState('');
  const [profilPoste, setProfilPoste] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => { /* ... (inchangé) ... */ 
    const storedAgentsData = localStorage.getItem(MOCK_AGENTS_KEY);
    if (storedAgentsData) {
      try { setAgents(JSON.parse(storedAgentsData)); } 
      catch (e) { console.error("Erreur parsing agents:", e); setAgents([]); }
    }
    setIsLoading(false);
  }, []);

  const resetForm = () => { /* ... (inchangé, il cache déjà le formulaire) ... */ 
    setNom(''); setPrenom(''); setGrade(''); setPoste(''); setProfilPoste('');
    setEmail(''); setTelephone('');
    setPhotoFile(null); setPhotoPreview(null); setEditingAgent(null);
    setShowForm(false); 
    const photoInput = document.getElementById('photo') as HTMLInputElement;
    if (photoInput) photoInput.value = '';
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... (inchangé) ... */ 
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]; setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setPhotoPreview(reader.result as string); };
      reader.readAsDataURL(file);
    } else { setPhotoFile(null); setPhotoPreview(null); }
  };

  const handleSubmitAgent = (event: React.FormEvent) => { /* ... (inchangé) ... */ 
    event.preventDefault();
    if (!canEdit) { toast.error("Action non autorisée."); return; }
    if (!nom.trim() || !prenom.trim() || !poste.trim()) { toast.warn("Nom, prénom et poste sont requis."); return; }

    const agentData: AgentProfile = {
      id: editingAgent ? editingAgent.id : String(Date.now()),
      nom: nom.trim(), prenom: prenom.trim(), grade: grade.trim(), poste: poste.trim(),
      profilPoste: profilPoste.trim(),
      email: email.trim() || undefined,
      telephone: telephone.trim() || undefined,
      photoUrl: photoPreview || (editingAgent ? editingAgent.photoUrl : undefined),
    };

    let updatedAgents;
    if (editingAgent) {
      updatedAgents = agents.map(agent => (agent.id === editingAgent.id ? agentData : agent));
      toast.success(`Agent ${agentData.prenom} ${agentData.nom} modifié !`);
    } else {
      updatedAgents = [...agents, agentData];
      toast.success(`Agent ${agentData.prenom} ${agentData.nom} ajouté !`);
    }
    setAgents(updatedAgents);
    localStorage.setItem(MOCK_AGENTS_KEY, JSON.stringify(updatedAgents));
    notifyDataChange();
    resetForm();
  };

  const handleEditAgent = (agentToEdit: AgentProfile) => { /* ... (inchangé) ... */ 
    if (!canEdit) { toast.info("Droits de modification requis."); return; }
    setEditingAgent(agentToEdit);
    setNom(agentToEdit.nom); setPrenom(agentToEdit.prenom); setGrade(agentToEdit.grade);
    setPoste(agentToEdit.poste); setProfilPoste(agentToEdit.profilPoste);
    setEmail(agentToEdit.email || '');
    setTelephone(agentToEdit.telephone || '');
    setPhotoPreview(agentToEdit.photoUrl || null);
    setPhotoFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDeleteAgent = (agentId: string) => { /* ... (inchangé) ... */ 
    if (!canEdit) { toast.error("Action non autorisée."); return; }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet agent ?")) {
      const updatedAgents = agents.filter(agent => agent.id !== agentId);
      setAgents(updatedAgents); localStorage.setItem(MOCK_AGENTS_KEY, JSON.stringify(updatedAgents));
      notifyDataChange(); toast.success('Agent supprimé !');
    }
  };
  
  // ... (inputStyle, fileInputStyle, isLoading check inchangés) ...
  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const fileInputStyle = "mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100";
  if (isLoading) { return <div className="container mx-auto p-6 text-center text-lg">Chargement...</div>; }


  return (
    <div className="container mx-auto p-6 mt-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Agents de la DSEFS</h1>
        {/* Bouton principal "Ajouter un Agent" qui ouvre le formulaire - déjà en vert */}
        {canEdit && !showForm && (
            <button onClick={() => { resetForm(); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-150 ease-in-out shadow-md hover:shadow-lg">
                <PlusCircle size={20} className="mr-2" /> Ajouter un Agent
            </button>
        )}
      </div>

      {canEdit && showForm && (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl mb-10 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-300">
            {editingAgent ? 'Modifier l\'Agent' : 'Ajouter un Nouvel Agent'}
          </h2>
          <form onSubmit={handleSubmitAgent} className="space-y-6">
            {/* ... (Champs du formulaire Prénom, Nom, Grade, Poste, Email, Téléphone, Profil, Photo inchangés) ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">Prénom <span className="text-red-500">*</span></label><input type="text" id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required className={inputStyle}/></div>
              <div><label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label><input type="text" id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required className={inputStyle}/></div>
              <div><label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">Grade</label><input type="text" id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} className={inputStyle}/></div>
              <div><label htmlFor="poste" className="block text-sm font-medium text-gray-700 mb-1">Poste occupé <span className="text-red-500">*</span></label><input type="text" id="poste" value={poste} onChange={(e) => setPoste(e.target.value)} required className={inputStyle}/></div>
              <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyle}/></div>
              <div><label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label><input type="tel" id="telephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} className={inputStyle}/></div>
            </div>
            <div><label htmlFor="profilPoste" className="block text-sm font-medium text-gray-700 mb-1">Profil du poste (description)</label><textarea id="profilPoste" value={profilPoste} onChange={(e) => setProfilPoste(e.target.value)} rows={3} className={inputStyle}/></div>
            <div><label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">Photo</label><input type="file" id="photo" accept="image/*" onChange={handlePhotoChange} className={fileInputStyle}/>
              {photoPreview && <div className="mt-3"><img src={photoPreview} alt="Aperçu" className="h-32 w-32 object-cover rounded-lg shadow-sm border"/></div>}
            </div>
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 mt-8">
              <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium">Annuler</button>
              {/* --- MODIFICATION DE LA COULEUR ET DE L'ICÔNE DU BOUTON DE SOUMISSION --- */}
              <button 
                type="submit" 
                className={`px-5 py-2.5 text-white rounded-lg transition-colors font-semibold flex items-center
                            ${editingAgent 
                                ? 'bg-blue-600 hover:bg-blue-700'  // Bleu pour sauvegarder les modifications
                                : 'bg-green-600 hover:bg-green-700' // Vert pour ajouter un nouvel agent
                            }`}
              >
                {editingAgent 
                    ? <Save size={18} className="mr-2"/>          // Icône Save pour la modification
                    : <PlusCircle size={18} className="mr-2"/>    // Icône PlusCircle pour l'ajout
                }
                {editingAgent ? 'Sauvegarder' : 'Ajouter l\'Agent'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ... (Affichage des cartes d'agents inchangé) ... */}
       {agents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-xl shadow-xl p-6 flex flex-col items-center group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 border-2 border-transparent hover:border-blue-400">
              {agent.photoUrl ? (<img src={agent.photoUrl} alt={`${agent.prenom} ${agent.nom}`} className="w-36 h-36 rounded-full mx-auto mb-5 object-cover border-4 border-gray-200 group-hover:border-blue-300 transition-all duration-300 shadow-md"/>) 
                              : (<UserCircle size={144} className="mx-auto mb-5 text-gray-300 group-hover:text-blue-200 transition-colors" />)}
              <h3 className="text-xl font-bold text-gray-800 truncate w-full text-center" title={`${agent.prenom} ${agent.nom}`}>{agent.prenom} {agent.nom}</h3>
              <p className="text-blue-700 text-md font-semibold mt-1 truncate w-full text-center" title={agent.poste}>{agent.poste}</p>
              {agent.grade && <p className="text-sm text-gray-600 mt-1">Grade: {agent.grade}</p>}
              {agent.email && (<a href={`mailto:${agent.email}`} className="text-sm text-sky-600 hover:text-sky-800 hover:underline mt-2 flex items-center transition-colors" title={agent.email}><Mail size={14} className="mr-1.5 flex-shrink-0" /> <span className="truncate">{agent.email}</span></a>)}
              {agent.telephone && (<a href={`tel:${agent.telephone}`} className="text-sm text-gray-600 hover:text-gray-800 hover:underline mt-1 flex items-center transition-colors" title={agent.telephone}><Phone size={14} className="mr-1.5 flex-shrink-0" /> <span className="truncate">{agent.telephone}</span></a>)}
              {agent.profilPoste && (<p className="text-xs text-gray-500 mt-3 italic text-center bg-gray-50 p-2 rounded-md w-full max-h-24 overflow-y-auto custom-scrollbar" title={agent.profilPoste}>{agent.profilPoste}</p>)}
              {canEdit && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col space-y-2">
                  <button onClick={() => handleEditAgent(agent)} title="Modifier" className="p-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-xl hover:shadow-yellow-400/70 transition-all"><Edit3 size={16}/></button>
                  <button onClick={() => handleDeleteAgent(agent.id)} title="Supprimer" className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xl hover:shadow-red-400/70 transition-all"><Trash2 size={16}/></button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showForm && <p className="text-center text-gray-600 mt-10 py-8 bg-white rounded-lg shadow text-lg">Aucun agent enregistré. {canEdit && 'Cliquez sur "Ajouter un Agent" pour commencer.'}</p>
      )}
    </div>
  );
};

export default AgentsDSEFS;