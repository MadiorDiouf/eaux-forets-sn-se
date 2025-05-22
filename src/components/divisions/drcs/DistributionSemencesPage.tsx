// src/components/divisions/drcs/DistributionSemencesPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { 
  UploadCloud, FileSpreadsheet, Edit2, Trash2, Download, Save, XCircle, 
  Loader2 as Loader, Info, UserCircle, PlusCircle 
} from 'lucide-react';

interface FicheStatistiqueExcel { /* ... (Même interface que dans JNAPage.tsx) ... */ id: string; nomFichier: string; typeFichier: string; tailleFichier?: number; dateTeleversement: string; nomAgentResponsableFiche?: string; commentaire?: string; fichierDataUrl?: string; utilisateurIdEnregistrement?: string; utilisateurNomEnregistrement?: string; }

const SECTION_ID_FOR_STORAGE = 'drcs_distribution_semences'; // MODIFIÉ
const FICHES_STORAGE_KEY = `stat_fiches_${SECTION_ID_FOR_STORAGE}`;

const DistributionSemencesPage: React.FC = () => { // MODIFIÉ
  const { currentUser } = useAuth();
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'editeur';

  const [fiches, setFiches] = useState<FicheStatistiqueExcel[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFiche, setEditingFiche] = useState<FicheStatistiqueExcel | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [commentaireInput, setCommentaireInput] = useState('');
  const [agentResponsableInput, setAgentResponsableInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { /* ... (Logique de chargement identique, utilise FICHES_STORAGE_KEY) ... */ const storedFiches = localStorage.getItem(FICHES_STORAGE_KEY); if (storedFiches) { try { const parsedFiches = JSON.parse(storedFiches) as FicheStatistiqueExcel[]; const fichesAvecDefaults = parsedFiches.map(f => ({ ...f, nomAgentResponsableFiche: f.nomAgentResponsableFiche || '', commentaire: f.commentaire || '', })); setFiches(fichesAvecDefaults.sort((a, b) => new Date(b.dateTeleversement).getTime() - new Date(a.dateTeleversement).getTime())); } catch (e) { console.error(`Erreur chargement fiches ${SECTION_ID_FOR_STORAGE}:`, e); } } }, []);
  const saveFichesToStorage = (updatedFiches: FicheStatistiqueExcel[]) => { /* ... (Logique identique) ... */ const fichesTriees = [...updatedFiches].sort((a, b) => new Date(b.dateTeleversement).getTime() - new Date(a.dateTeleversement).getTime()); localStorage.setItem(FICHES_STORAGE_KEY, JSON.stringify(fichesTriees)); setFiches(fichesTriees); };
  const resetModalForm = () => { /* ... (Logique identique) ... */ setSelectedFile(null); setCommentaireInput(''); setAgentResponsableInput(''); if (fileInputRef.current) fileInputRef.current.value = ""; };
  const handleOpenModalForCreate = () => { /* ... (Logique identique) ... */ if (!canEdit) { toast.warn("Permissions insuffisantes."); return; } setEditingFiche(null); resetModalForm(); setShowModal(true); };
  const handleOpenModalForEdit = (ficheAEditer: FicheStatistiqueExcel) => { /* ... (Logique identique) ... */ if (!canEdit) { toast.warn("Permissions insuffisantes."); return; } setEditingFiche(ficheAEditer); setCommentaireInput(ficheAEditer.commentaire || ''); setAgentResponsableInput(ficheAEditer.nomAgentResponsableFiche || ''); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; setShowModal(true); };
  const handleCloseModal = () => { /* ... (Logique identique) ... */ setShowModal(false); setEditingFiche(null); resetModalForm(); };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... (Logique identique) ... */ if (event.target.files && event.target.files[0]) { const file = event.target.files[0]; if (!file.type.includes('spreadsheetml') && !file.type.includes('excel') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) { toast.error("Veuillez sélectionner un fichier Excel (.xlsx, .xls)."); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; return; } setSelectedFile(file); } else { setSelectedFile(null); } };
  const readFileAsDataURL = (file: File): Promise<string> => new Promise((resolve, reject) => { /* ... (Logique identique) ... */ const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = error => reject(error); reader.readAsDataURL(file); });
  const handleSubmitFiche = async (e: React.FormEvent) => { /* ... (Logique identique, utilise SECTION_ID_FOR_STORAGE pour l'ID de nouvelle fiche) ... */ e.preventDefault(); if (!agentResponsableInput.trim()) { toast.warn("Veuillez renseigner le nom de l'agent responsable."); return; } if (!editingFiche && !selectedFile) { toast.warn("Veuillez sélectionner un fichier Excel pour la nouvelle fiche."); return; } if (!currentUser) return; setIsSubmitting(true); let fichierDataUrlFinal = editingFiche?.fichierDataUrl; let nomFichierFinal = editingFiche?.nomFichier; let typeFichierFinal = editingFiche?.typeFichier; let tailleFichierFinal = editingFiche?.tailleFichier; if (selectedFile) { try { fichierDataUrlFinal = await readFileAsDataURL(selectedFile); nomFichierFinal = selectedFile.name; typeFichierFinal = selectedFile.type; tailleFichierFinal = selectedFile.size; } catch (error) { toast.error("Erreur lors de la lecture du fichier."); setIsSubmitting(false); return; } } else if (!editingFiche) { toast.error("Erreur: Aucun fichier pour une nouvelle fiche."); setIsSubmitting(false); return; } if (!nomFichierFinal || !typeFichierFinal || !fichierDataUrlFinal) { toast.error("Données de fichier manquantes."); setIsSubmitting(false); return; } const ficheDataCommune = { nomFichier: nomFichierFinal, typeFichier: typeFichierFinal, tailleFichier: tailleFichierFinal, dateTeleversement: new Date().toISOString(), nomAgentResponsableFiche: agentResponsableInput.trim(), commentaire: commentaireInput, fichierDataUrl: fichierDataUrlFinal, utilisateurIdEnregistrement: currentUser.id, utilisateurNomEnregistrement: `${currentUser.prenom} ${currentUser.nom}`.trim(), }; let updatedFiches: FicheStatistiqueExcel[]; if (editingFiche) { updatedFiches = fiches.map(f => f.id === editingFiche.id ? { ...editingFiche, ...ficheDataCommune } : f ); toast.success("Fiche mise à jour !"); } else { const nouvelleFiche: FicheStatistiqueExcel = { id: `${SECTION_ID_FOR_STORAGE}_${Date.now()}`, ...ficheDataCommune }; updatedFiches = [nouvelleFiche, ...fiches]; toast.success("Nouvelle fiche ajoutée !"); } saveFichesToStorage(updatedFiches); setIsSubmitting(false); handleCloseModal(); };
  const handleDeleteFiche = (ficheId: string) => { /* ... (Logique identique) ... */ if (!canEdit) return; const ficheASupprimer = fiches.find(f => f.id === ficheId); if (!ficheASupprimer) return; toast( ({closeToast}) => ( <div> <p className="font-semibold">Supprimer cette fiche ?</p> <p className="text-sm my-2">Fichier: {ficheASupprimer.nomFichier}</p> <div className="flex justify-end space-x-2 mt-3"> <button className="px-3 py-1.5 text-sm bg-gray-200 rounded hover:bg-gray-300" onClick={closeToast}>Annuler</button> <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700" onClick={() => { const nouvellesFiches = fiches.filter(f => f.id !== ficheId); saveFichesToStorage(nouvellesFiches); toast.info("Fiche supprimée."); closeToast?.(); }} > Supprimer </button> </div> </div> ), {autoClose: false} ) };
  const handleDownloadFiche = (ficheADescendre: FicheStatistiqueExcel) => { /* ... (Logique identique) ... */ if (ficheADescendre?.fichierDataUrl && ficheADescendre?.nomFichier) { const link = document.createElement('a'); link.href = ficheADescendre.fichierDataUrl; link.download = ficheADescendre.nomFichier; document.body.appendChild(link); link.click(); document.body.removeChild(link); } else { toast.warn("Aucun fichier à télécharger ou données corrompues."); } };
  const formatBytes = (bytes?: number, decimals = 2) => { /* ... (Logique identique) ... */ if (!bytes || bytes === 0) return '0 Octets'; const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Octets', 'Ko', 'Mo', 'Go', 'To']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]; };
  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="p-4 bg-white rounded shadow-lg">
      <div className="flex justify-between items-center mb-6 pb-3 border-b">
        {/* MODIFIÉ: Titre et texte du bouton */}
        <h2 className="text-2xl font-semibold text-gray-800">Fiches Distribution des Semences</h2>
        {canEdit && (
          <button onClick={handleOpenModalForCreate} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg inline-flex items-center">
            <PlusCircle size={18} className="mr-2"/> Ajouter une Fiche Semences
          </button>
        )}
      </div>

      {fiches.length === 0 && !isSubmitting ? (
        // MODIFIÉ: Message d'absence de fiche
        <div className="text-center py-10 bg-gray-50 rounded-md"> 
          <FileSpreadsheet size={48} className="mx-auto text-gray-400 mb-3"/> 
          <p className="text-gray-500">Aucune fiche pour la Distribution des Semences.</p> 
          {canEdit && <p className="text-sm text-gray-400 mt-1">Utilisez le bouton "Ajouter une Fiche Semences" pour commencer.</p>} 
        </div>
      ) : (
        /* ... (Le JSX de la table reste identique à JNAPage.tsx, affichant les 'fiches') ... */
        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 border border-gray-200"><thead className="bg-gray-100"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fichier</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Agent Responsable</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Commentaire</th><th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{fiches.map(f => (<tr key={f.id} className="hover:bg-gray-50"><td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800 max-w-xs truncate" title={f.nomFichier}><div className="flex items-center"><FileSpreadsheet size={18} className="text-green-600 mr-2 flex-shrink-0"/>{f.nomFichier}</div></td><td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{f.nomAgentResponsableFiche}</td><td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(f.dateTeleversement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</td><td className="px-4 py-3 text-sm text-gray-600 max-w-sm truncate" title={f.commentaire}>{f.commentaire || '-'}</td><td className="px-4 py-3 whitespace-nowrap text-center text-sm space-x-1.5">{f.fichierDataUrl && (<button onClick={() => handleDownloadFiche(f)} className="p-1.5 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-100" title="Télécharger"><Download size={16}/></button>)}{canEdit && (<button onClick={() => handleOpenModalForEdit(f)} className="p-1.5 text-yellow-500 hover:text-yellow-600 rounded-full hover:bg-yellow-100" title="Modifier"><Edit2 size={16}/></button>)}{canEdit && (<button onClick={() => handleDeleteFiche(f.id)} className="p-1.5 text-red-600 hover:text-red-700 rounded-full hover:bg-red-100" title="Supprimer"><Trash2 size={16}/></button>)}</td></tr>))}</tbody></table></div>
      )}
        <p className="mt-6 text-xs text-gray-500 italic"> <Info size={13} className="inline mr-1 align-text-bottom"/> Le format attendu pour les fichiers Excel est spécifique. Assurez-vous de suivre les consignes. </p>

      {showModal && (
        /* ... (Le JSX de la modale reste identique à JNAPage.tsx, sauf pour le titre de la modale si besoin) ... */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-lg"><div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold text-gray-800">{editingFiche ? 'Modifier la Fiche Semences' : 'Ajouter une Nouvelle Fiche Semences'}</h3><button onClick={handleCloseModal} className="p-1 text-gray-400 hover:text-gray-600"><XCircle size={24} /></button></div><form onSubmit={handleSubmitFiche} className="p-5 space-y-4"><div><label htmlFor="excelFile" className={labelStyle}>Fichier Excel (.xlsx, .xls) {(!editingFiche || selectedFile) && <span className="text-red-500">*</span>}</label><input type="file" id="excelFile" ref={fileInputRef} onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />{selectedFile && <p className="text-xs text-green-600 mt-1">Nouveau fichier: {selectedFile.name}</p>}{!selectedFile && editingFiche?.nomFichier && <p className="text-xs text-gray-500 mt-1">Actuel: {editingFiche.nomFichier}</p>}</div><div><label htmlFor="agentResponsable" className={labelStyle}>Nom Agent Responsable <span className="text-red-500">*</span></label><input type="text" id="agentResponsable" value={agentResponsableInput} onChange={(e) => setAgentResponsableInput(e.target.value)} required className={inputStyle} placeholder="Prénom Nom"/></div><div><label htmlFor="commentaire" className={labelStyle}>Commentaire</label><textarea id="commentaire" value={commentaireInput} onChange={(e) => setCommentaireInput(e.target.value)} rows={3} className={inputStyle} placeholder="Notes..."></textarea></div><div className="pt-3 border-t flex justify-end space-x-3"><button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300">Annuler</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center">{isSubmitting ? <Loader className="animate-spin mr-2" size={18}/> : <Save size={18} className="mr-2"/>}{isSubmitting ? 'Enregistrement...' : (editingFiche ? 'Sauvegarder' : 'Ajouter')}</button></div></form></div></div>
      )}
    </div>
  );
};

export default DistributionSemencesPage; // MODIFIÉ