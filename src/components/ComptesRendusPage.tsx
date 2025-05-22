// src/components/ComptesRendusPage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'react-toastify';
import {
    UploadCloud, Download, Info, FileText, FileImage, FileArchive, FileQuestion,
    Users, Briefcase, MapPin, ListChecks, FileAudio, FileVideo, Edit3, Trash2,
    PlusCircle, Search, XCircle, Loader2 as Loader, Save
} from 'lucide-react';

export interface SharedDocument { id: string; fileName: string; fileType: string; fileDataUrl?: string; }
export interface CompteRendu { id: string; agentName: string; agentPoste: string; natureRencontre: 'reunion' | 'seminaire' | 'mission_terrain' | 'autres'; titre: string; structureOrganisatrice: string; dateRencontre: string; commentaire?: string; fileName: string; fileType: string; uploadedAt: string; fileDataUrl?: string; sharedFiles?: SharedDocument[]; }

export const NATURE_RENCONTRE_OPTIONS = [
  { value: 'reunion' as const, label: 'Réunion', icon: <Users size={16} className="mr-2" /> },
  { value: 'seminaire' as const, label: 'Séminaire/Atelier', icon: <Briefcase size={16} className="mr-2" /> },
  { value: 'mission_terrain' as const, label: 'Mission Terrain', icon: <MapPin size={16} className="mr-2" /> },
  { value: 'autres' as const, label: 'Autres', icon: <ListChecks size={16} className="mr-2" /> },
];
const MOCK_COMPTES_RENDUS_KEY = 'comptes_rendus_data';

export const getFileIcon = (fileType?: string): JSX.Element => {
    const type = fileType ? fileType.toLowerCase() : '';
    if (type.includes('pdf')) return <FileText size={18} className="text-red-500" />;
    if (type.includes('doc') || type.includes('odt')) return <FileText size={18} className="text-blue-500" />;
    if (type.includes('xls') || type.includes('ods')) return <FileText size={18} className="text-green-500" />;
    if (type.includes('ppt') || type.includes('odp')) return <FileText size={18} className="text-orange-500" />;
    if (type.includes('png') || type.includes('jpg') || type.includes('jpeg') || type.includes('gif')) return <FileImage size={18} className="text-purple-500" />;
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return <FileArchive size={18} className="text-yellow-500" />;
    if (type.includes('mp3') || type.includes('wav')) return <FileAudio size={18} className="text-pink-500" />;
    if (type.includes('mp4') || type.includes('avi') || type.includes('mov')) return <FileVideo size={18} className="text-teal-500" />;
    return <FileQuestion size={18} className="text-gray-500" />;
};

const ComptesRendusPage: React.FC = () => {
  const auth = useAuth();
  const { notifyDataChange } = useData();
  const userRole = auth.currentUser?.role;

  const canEditExisting = userRole === 'admin' || userRole === 'editeur';
  const canDelete = userRole === 'admin';
  const canUpload = userRole === 'admin' || userRole === 'editeur' || userRole === 'lecteur';

  const [comptesRendus, setComptesRendus] = useState<CompteRendu[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingCompteRendu, setEditingCompteRendu] = useState<CompteRendu | null>(null);

  const [agentName, setAgentName] = useState('');
  const [agentPoste, setAgentPoste] = useState('');
  const [natureRencontre, setNatureRencontre] = useState<CompteRendu['natureRencontre']>('reunion');
  const [titre, setTitre] = useState('');
  const [structureOrganisatrice, setStructureOrganisatrice] = useState('');
  const [dateRencontre, setDateRencontre] = useState('');
  const [formCommentaire, setFormCommentaire] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sharedFilesInput, setSharedFilesInput] = useState<FileList | null>(null);

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const sharedFilesInputRef = useRef<HTMLInputElement>(null);

  const [currentMainFileName, setCurrentMainFileName] = useState<string | null>(null);
  const [currentSharedFileNames, setCurrentSharedFileNames] = useState<string[]>([]);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsLoadingInitial(true);
    const storedData = localStorage.getItem(MOCK_COMPTES_RENDUS_KEY);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData) as CompteRendu[];
        const validatedData = parsedData.map((cr: any) => ({ // Utilisation de 'any' ici car on valide chaque champ
            ...cr,
            titre: cr.titre || "Sans Titre",
            agentName: cr.agentName || "N/A",
            agentPoste: cr.agentPoste || "N/A",
            natureRencontre: NATURE_RENCONTRE_OPTIONS.some(opt => opt.value === cr.natureRencontre) ? cr.natureRencontre : 'autres',
            structureOrganisatrice: cr.structureOrganisatrice || "N/A",
            dateRencontre: cr.dateRencontre || new Date().toISOString().split('T')[0],
            uploadedAt: cr.uploadedAt || new Date().toISOString().split('T')[0],
            fileName: cr.fileName || "fichier.inconnu",
            fileType: cr.fileType || "unknown",
            sharedFiles: Array.isArray(cr.sharedFiles) ? cr.sharedFiles : [], // S'assurer que sharedFiles est un tableau
        }));
        setComptesRendus(validatedData);
      } catch(e) {
        console.error("Erreur parsing CR depuis localStorage:", e);
        setComptesRendus([]);
      }
    }
    setIsLoadingInitial(false);
  }, []);

  const resetFormFields = () => {
    setAgentName(''); setAgentPoste(''); setNatureRencontre('reunion'); setTitre('');
    setStructureOrganisatrice(''); setDateRencontre(''); setFormCommentaire('');
    setFile(null); setSharedFilesInput(null); setCurrentMainFileName(null);
    setCurrentSharedFileNames([]); setEditingCompteRendu(null);
    if (mainFileInputRef.current) mainFileInputRef.current.value = '';
    if (sharedFilesInputRef.current) sharedFilesInputRef.current.value = '';
  };

  const handleOpenFormForCreate = () => {
    if (!canUpload) { toast.warn("Vous n'avez pas la permission d'ajouter un compte rendu."); return; }
    resetFormFields();
    setShowForm(true);
  };

  const handleCloseForm = () => {
    resetFormFields();
    setShowForm(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setCurrentMainFileName(event.target.files[0].name);
    } else {
      setFile(null);
      if (editingCompteRendu) setCurrentMainFileName(editingCompteRendu.fileName);
      else setCurrentMainFileName(null);
    }
  };

  const handleSharedFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSharedFilesInput(event.target.files);
      setCurrentSharedFileNames(Array.from(event.target.files).map(f => f.name));
    } else {
      setSharedFilesInput(null);
      setCurrentSharedFileNames(editingCompteRendu?.sharedFiles?.map(f => f.fileName) || []);
    }
  };

  const readFileAsDataURL = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const fileReaderInstance = new FileReader();
      fileReaderInstance.onload = () => resolve(fileReaderInstance.result as string);
      fileReaderInstance.onerror = (e) => {
        console.error("FileReader Error (ComptesRendusPage):", e);
        reject(fileReaderInstance.error);
      };
      fileReaderInstance.readAsDataURL(f);
    });


  const handleSubmitCompteRendu = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingCompteRendu && !file) { toast.warn('Veuillez sélectionner un fichier principal pour un nouveau compte rendu.'); return; }
    if (!titre || !agentName || !agentPoste || !dateRencontre || !natureRencontre) { toast.warn('Veuillez remplir tous les champs obligatoires (*).'); return; }

    setIsSubmitting(true);
    try {
      let mainFileDataUrlToSave = editingCompteRendu?.fileDataUrl;
      let mainFileNameToSave = editingCompteRendu?.fileName || '';
      let mainFileTypeToSave = editingCompteRendu?.fileType || 'unknown';
      if (file) {
        mainFileDataUrlToSave = await readFileAsDataURL(file);
        mainFileNameToSave = file.name;
        mainFileTypeToSave = file.type || file.name.split('.').pop()?.toLowerCase() || 'unknown';
      }

      let sharedFilesDataToSave: SharedDocument[] = editingCompteRendu?.sharedFiles || [];
      if (sharedFilesInput && sharedFilesInput.length > 0) {
        const newSharedFiles: SharedDocument[] = [];
        for (let i = 0; i < sharedFilesInput.length; i++) {
          const sf = sharedFilesInput[i];
          const sfDataUrl = await readFileAsDataURL(sf);
          newSharedFiles.push({ id: uuidv4(), fileName: sf.name, fileType: sf.type || sf.name.split('.').pop()?.toLowerCase() || 'unknown', fileDataUrl: sfDataUrl });
        }
        sharedFilesDataToSave = newSharedFiles;
      }

      const compteRenduData: CompteRendu = {
        id: editingCompteRendu ? editingCompteRendu.id : uuidv4(),
        agentName, agentPoste, natureRencontre, titre, structureOrganisatrice, dateRencontre,
        commentaire: formCommentaire, fileName: mainFileNameToSave, fileType: mainFileTypeToSave, fileDataUrl: mainFileDataUrlToSave,
        sharedFiles: sharedFilesDataToSave,
        uploadedAt: editingCompteRendu && !file ? (editingCompteRendu.uploadedAt || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]
      };

      let updatedData = editingCompteRendu ? comptesRendus.map(cr => cr.id === editingCompteRendu.id ? compteRenduData : cr) : [...comptesRendus, compteRenduData];
      updatedData.sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setComptesRendus(updatedData);
      localStorage.setItem(MOCK_COMPTES_RENDUS_KEY, JSON.stringify(updatedData));
      notifyDataChange('comptesRendus');
      toast.success(`Compte rendu ${editingCompteRendu ? 'modifié' : 'téléversé'} avec succès !`);
      handleCloseForm();
    } catch (error: any) {
      console.error("Erreur handleSubmitCompteRendu:", error);
      let errorMessage = "Erreur lors de la préparation des fichiers.";
      if (error.name === 'QuotaExceededError' || (error.message && error.message.toLowerCase().includes('quota'))) {
        errorMessage = "ERREUR : Stockage local plein ou fichier trop volumineux.";
      } else if (error instanceof Error) {
        errorMessage += ` Détail: ${error.message}`;
      }
      toast.error(errorMessage);
    } finally { setIsSubmitting(false); }
  };

  const handleEditCR = (cr: CompteRendu) => {
    if (!canEditExisting) { toast.warn("Action non autorisée."); return; }
    setEditingCompteRendu(cr);
    setTitre(cr.titre);
    setNatureRencontre(cr.natureRencontre);
    setStructureOrganisatrice(cr.structureOrganisatrice);
    setDateRencontre(cr.dateRencontre.split('T')[0]);
    setAgentName(cr.agentName);
    setAgentPoste(cr.agentPoste);
    setFormCommentaire(cr.commentaire || '');
    setCurrentMainFileName(cr.fileName);
    setCurrentSharedFileNames(cr.sharedFiles?.map(f => f.fileName) || []);
    setFile(null);
    setSharedFilesInput(null);
    if (mainFileInputRef.current) mainFileInputRef.current.value = '';
    if (sharedFilesInputRef.current) sharedFilesInputRef.current.value = '';
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCR = (id: string) => {
    if (!canDelete) { toast.error("Action non autorisée. Seul un administrateur peut supprimer."); return; }
    toast( ({ closeToast }) => ( <div className="flex flex-col p-2"> <p className="mb-3 text-sm text-gray-700">Supprimer ce compte rendu définitivement ?</p> <div className="flex justify-end space-x-2"> <button onClick={() => { const upd = comptesRendus.filter(cr => cr.id !== id); setComptesRendus(upd); localStorage.setItem(MOCK_COMPTES_RENDUS_KEY, JSON.stringify(upd)); notifyDataChange('comptesRendus'); toast.success("Compte rendu supprimé."); if (closeToast) closeToast(); }} className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"> Supprimer </button> <button onClick={closeToast} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"> Annuler </button> </div> </div> ), { position: "top-center", autoClose: false, closeOnClick: false, draggable: false } );
  };

  const handleDownload = (d: { fileDataUrl?: string, fileName: string }) => { if(d.fileDataUrl){ const l=document.createElement('a');l.href=d.fileDataUrl;l.download=d.fileName;document.body.appendChild(l);l.click();document.body.removeChild(l);} else { toast.warn("Aucune donnée de fichier disponible pour le téléchargement."); }};
  const handleMouseEnterTooltip = (c: string | undefined, e: React.MouseEvent<HTMLElement>) => {if(c){setTooltipContent(c); const rect = e.currentTarget.getBoundingClientRect(); setTooltipPosition({top: rect.top - rect.height - 5 , left: rect.left + rect.width/2 }); setTooltipVisible(true);}};
  const handleMouseLeaveTooltip = () => { setTooltipVisible(false) };

  const filteredComptesRendus = useMemo(() => {
    if (!searchTerm.trim()) return comptesRendus;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return comptesRendus.filter(cr =>
        cr.titre.toLowerCase().includes(lowerSearchTerm) ||
        cr.agentName.toLowerCase().includes(lowerSearchTerm) ||
        cr.structureOrganisatrice.toLowerCase().includes(lowerSearchTerm) ||
        (NATURE_RENCONTRE_OPTIONS.find(o => o.value === cr.natureRencontre)?.label.toLowerCase() || '').includes(lowerSearchTerm) ||
        cr.fileName.toLowerCase().includes(lowerSearchTerm)
    );
  }, [comptesRendus, searchTerm]);

  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100";
  const fileInputStyle = "mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer";

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4 md:mb-0">Comptes Rendus</h1>
        {canUpload && !showForm && (
          <button
            onClick={handleOpenFormForCreate}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition duration-150 ease-in-out"
          >
            <PlusCircle size={20} className="mr-2"/> Ajouter un Compte Rendu
          </button>
        )}
      </div>

      {canUpload && showForm && (
        <div className="bg-white p-6 rounded-xl shadow-xl mb-10 border border-gray-200">
          <div className="flex justify-between items-center mb-6 pb-3 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <UploadCloud size={24} className="mr-3 text-blue-600" />
                {editingCompteRendu ? 'Modifier le Compte Rendu' : 'Téléverser un nouveau Compte Rendu'}
            </h2>
            <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600" title="Fermer">
                <XCircle size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmitCompteRendu} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div><label htmlFor="cr-titre" className="block text-sm font-medium text-gray-700">Titre <span className="text-red-500">*</span></label><input type="text" id="cr-titre" value={titre} onChange={(e) => setTitre(e.target.value)} required className={inputStyle}/></div>
              <div><label htmlFor="cr-nature" className="block text-sm font-medium text-gray-700">Nature Rencontre <span className="text-red-500">*</span></label><select id="cr-nature" value={natureRencontre} onChange={(e) => setNatureRencontre(e.target.value as CompteRendu['natureRencontre'])} required className={inputStyle}>{NATURE_RENCONTRE_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div>
              <div><label htmlFor="cr-structure" className="block text-sm font-medium text-gray-700">Structure Organisatrice</label><input type="text" id="cr-structure" value={structureOrganisatrice} onChange={(e) => setStructureOrganisatrice(e.target.value)} className={inputStyle}/></div>
              <div><label htmlFor="cr-date" className="block text-sm font-medium text-gray-700">Date Rencontre <span className="text-red-500">*</span></label><input type="date" id="cr-date" value={dateRencontre} onChange={(e) => setDateRencontre(e.target.value)} required className={inputStyle}/></div>
              <div><label htmlFor="cr-agentName" className="block text-sm font-medium text-gray-700">Agent Rédacteur <span className="text-red-500">*</span></label><input type="text" id="cr-agentName" value={agentName} onChange={(e) => setAgentName(e.target.value)} required className={inputStyle}/></div>
              <div><label htmlFor="cr-agentPoste" className="block text-sm font-medium text-gray-700">Poste Agent <span className="text-red-500">*</span></label><input type="text" id="cr-agentPoste" value={agentPoste} onChange={(e) => setAgentPoste(e.target.value)} required className={inputStyle}/></div>
              <div className="md:col-span-2">
                <label htmlFor="cr-file-upload" className="block text-sm font-medium text-gray-700">Fichier Principal {!editingCompteRendu && <span className="text-red-500">*</span>}</label>
                <input type="file" id="cr-file-upload" ref={mainFileInputRef} onChange={handleFileChange} className={fileInputStyle} required={!editingCompteRendu} />
                {editingCompteRendu && currentMainFileName && !file && (<div className="text-xs text-gray-500 mt-1">Fichier actuel: {currentMainFileName}</div>)}
                {file && <div className="text-xs text-green-600 mt-1">Nouveau fichier: {file.name} ({(file.size / (1024*1024)).toFixed(2)} MB)</div>}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="cr-shared-files-upload" className="block text-sm font-medium text-gray-700">Documents Partagés (Optionnel)</label>
                <input type="file" id="cr-shared-files-upload" ref={sharedFilesInputRef} onChange={handleSharedFilesChange} multiple className={fileInputStyle}/>
                {editingCompteRendu && currentSharedFileNames.length > 0 && (!sharedFilesInput || sharedFilesInput.length === 0) && (<div className="text-xs text-gray-500 mt-1"><p className="font-medium">Fichiers actuels partagés:</p><ul className="list-disc list-inside pl-4">{currentSharedFileNames.map(name=><li key={name}>{name}</li>)}</ul></div>)}
                {sharedFilesInput && sharedFilesInput.length > 0 && (<div className="mt-2 text-xs text-gray-500"><p className="font-medium">{sharedFilesInput.length} nouveau(x) fichier(s) sélectionné(s) pour partage:</p><ul className="list-disc list-inside pl-4">{Array.from(sharedFilesInput).map((f, index) => <li key={index} className="truncate" title={f.name}>{f.name} ({(f.size / (1024*1024)).toFixed(2)} MB)</li>)}</ul></div>)}
              </div>
            </div>
            <div><label htmlFor="cr-commentaire" className="block text-sm font-medium text-gray-700">Commentaire / Résumé</label><textarea id="cr-commentaire" value={formCommentaire} onChange={(e) => setFormCommentaire(e.target.value)} rows={3} className={inputStyle}/></div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={handleCloseForm} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg border border-gray-200 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100">Annuler</button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out disabled:opacity-50"
                >
                    {isSubmitting ? <Loader size={18} className="mr-2 animate-spin"/> : <Save size={18} className="mr-2"/>}
                    {isSubmitting ? 'Traitement...' : (editingCompteRendu ? 'Sauvegarder les modifications' : 'Téléverser le Compte Rendu')}
                </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-xl relative border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Comptes Rendus Existants</h2>
            <div className="relative w-full md:w-1/2 lg:w-1/3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Rechercher (titre, agent, fichier...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${inputStyle} pl-10`}
                />
            </div>
          </div>
          {isLoadingInitial ? (
             <div className="text-center py-10"><Loader size={28} className="animate-spin text-blue-500 inline-block" /></div>
          ) : filteredComptesRendus.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-100"><tr><th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-700">Type</th><th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">Titre / Fichier Principal</th><th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">Nature Rencontre</th><th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">Date Rencontre</th><th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">Rédigé par</th><th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">Docs. Partagés</th><th className="px-4 py-3.5 text-center text-sm font-semibold text-gray-700 w-auto">Actions</th></tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredComptesRendus.map((cr) => (
                    <tr key={cr.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-3 py-4 text-sm text-gray-500">{getFileIcon(cr.fileType)}</td>
                      <td className="px-4 py-4 text-sm"><div className="font-medium text-gray-900 truncate max-w-xs" title={cr.titre}>{cr.titre}</div><div className="text-xs text-gray-500 truncate max-w-xs" title={cr.fileName}>{cr.fileName}</div></td>
                      <td className="px-4 py-4 text-sm text-gray-600">{NATURE_RENCONTRE_OPTIONS.find(o => o.value === cr.natureRencontre)?.label || cr.natureRencontre}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{cr.dateRencontre ? new Date(cr.dateRencontre + 'T00:00:00Z').toLocaleDateString('fr-FR', {timeZone: 'UTC'}) : 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-gray-600"><div>{cr.agentName}</div><div className="text-xs text-gray-400">{cr.agentPoste}</div><div className="text-xs text-gray-400 mt-0.5">Le {cr.uploadedAt ? new Date(cr.uploadedAt + 'T00:00:00Z').toLocaleDateString('fr-FR', {timeZone: 'UTC'}) : 'N/A'}</div></td>
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                        {cr.sharedFiles && cr.sharedFiles.length > 0 ? (<ul className="list-none space-y-1">{cr.sharedFiles.slice(0,2).map(sharedDoc => (<li key={sharedDoc.id} className="flex items-center text-xs"><span className="mr-1">{getFileIcon(sharedDoc.fileType)}</span><button onClick={() => handleDownload(sharedDoc)} className="text-blue-600 hover:underline hover:text-blue-800 truncate" title={`Télécharger ${sharedDoc.fileName}`}>{sharedDoc.fileName}</button></li>))}{cr.sharedFiles.length > 2 && <li className="text-xs text-gray-400 italic mt-1">et {cr.sharedFiles.length - 2} autre(s)...</li>}</ul>)
                        : (<span className="text-xs italic text-gray-400">Aucun</span>)}
                      </td>
                      <td className="px-4 py-4 text-sm text-center space-x-1 whitespace-nowrap">
                        {cr.commentaire && (<button onMouseEnter={(e) => handleMouseEnterTooltip(cr.commentaire, e)} onMouseLeave={handleMouseLeaveTooltip} className="p-1.5 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100" title="Voir commentaire"><Info size={16} /></button>)}
                        <button onClick={() => handleDownload(cr)} className="p-1.5 text-green-600 hover:text-green-800 rounded-full hover:bg-green-100" title="Télécharger fichier principal"><Download size={16} /></button>
                        {canEditExisting && (<button onClick={() => handleEditCR(cr)} className="p-1.5 text-yellow-500 hover:text-yellow-700 rounded-full hover:bg-yellow-100" title="Modifier"><Edit3 size={16} /></button>)}
                        {canDelete && (<button onClick={() => handleDeleteCR(cr.id)} className="p-1.5 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100" title="Supprimer"><Trash2 size={16} /></button>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (  <p className="text-sm text-gray-500 py-6 text-center italic">{searchTerm ? "Aucun compte rendu ne correspond à votre recherche." : "Aucun compte rendu téléversé pour le moment."}</p> )}
          {tooltipVisible && ( <div className="absolute z-30 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm tooltip max-w-xs break-words" style={{ top: `${tooltipPosition.top}px`, left: `${tooltipPosition.left}px`, transform: 'translateX(-50%) translateY(-100%)' }} > {tooltipContent} <div className="tooltip-arrow" data-popper-arrow style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '100%', width: '0', height: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgb(17 24 39)' }}></div> </div> )}
        </div>
      )}
    </div>
  );
};
export default ComptesRendusPage;