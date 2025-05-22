// src/components/DocumentsUtilesPage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'react-toastify';
import {
    UploadCloud, Download, FileText, FileImage, FileArchive, FileAudio, FileVideo, FileQuestion,
    Edit3, Trash2, PlusCircle, Search, User, XCircle, Save, Loader2 as Loader
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export interface UsefulDocument {
  id: string;
  titre: string;
  description?: string;
  fileName: string;
  fileType: string;
  fileDataUrl?: string;
  uploadedAt: string;
  source: string;
  agentNomComplet: string;
}

const MOCK_DOCS_KEY = 'useful_documents_data';

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

const DocumentsUtilesPage: React.FC = () => {
  const auth = useAuth();
  const { notifyDataChange } = useData();
  const userRole = auth.currentUser?.role;

  const canUpload = userRole === 'admin' || userRole === 'editeur' || userRole === 'lecteur';
  const canManage = userRole === 'admin' || userRole === 'editeur';

  const [documents, setDocuments] = useState<UsefulDocument[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingDocument, setEditingDocument] = useState<UsefulDocument | null>(null);

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [agentNomComplet, setAgentNomComplet] = useState('');

  useEffect(() => {
    setIsLoadingInitial(true);
    const storedData = localStorage.getItem(MOCK_DOCS_KEY);
    if (storedData) {
        try {
            const parsedData = JSON.parse(storedData) as any[];
            const validatedData = parsedData.map(doc => {
                let nomComplet = doc.agentNomComplet;
                if (!nomComplet && (doc.agentPrenom || doc.agentNom)) {
                    nomComplet = `${doc.agentPrenom || ''} ${doc.agentNom || ''}`.trim();
                }
                return {
                    ...doc,
                    agentNomComplet: nomComplet || "N/A",
                    source: doc.source || "Non spécifiée",
                    uploadedAt: doc.uploadedAt || new Date().toISOString().split('T')[0],
                    fileName: doc.fileName || "fichier.inconnu",
                    fileType: doc.fileType || "unknown",
                    agentPrenom: undefined,
                    agentNom: undefined,
                } as UsefulDocument;
            });
            setDocuments(validatedData);
        } catch(e) {
            console.error("Erreur parsing Documents Utiles depuis localStorage:", e);
            setDocuments([]);
        }
    }
    setIsLoadingInitial(false);
  }, []);

  // Ce useEffect assure la mise à jour de agentNomComplet si l'utilisateur change
  // ou si on passe de l'édition à la création (formulaire vide).
  // La logique principale du pré-remplissage lors de l'ouverture du formulaire de création est dans resetFormFields.
  useEffect(() => {
    if (showForm && !editingDocument && auth.currentUser) {
      const currentUserName = `${auth.currentUser.prenom || ''} ${auth.currentUser.nom || ''}`.trim();
      if (agentNomComplet !== currentUserName) { // Seulement mettre à jour si différent
        setAgentNomComplet(currentUserName);
      }
    }
  }, [auth.currentUser, showForm, editingDocument, agentNomComplet]); // agentNomComplet ajouté pour que le if à l'intérieur ait du sens si on veut vérifier la valeur actuelle


  const resetFormFields = () => {
    setTitre(''); setDescription(''); setSource('');
    setFile(null); setCurrentFileName(null);
    // Pré-remplissage du nom de l'agent avec les infos de l'utilisateur connecté
    const userNameFromAuth = auth.currentUser ? `${auth.currentUser.prenom || ''} ${auth.currentUser.nom || ''}`.trim() : '';
    setAgentNomComplet(userNameFromAuth);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setEditingDocument(null);
  };

  const handleOpenFormForCreate = () => {
    if(!canUpload) { toast.warn("Permission refusée."); return; }
    resetFormFields(); // Crucial: resetFormFields est appelé ici pour pré-remplir
    setShowForm(true);
  };

  const handleCloseForm = () => { resetFormFields(); setShowForm(false); };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setCurrentFileName(event.target.files[0].name);
    } else {
      setFile(null);
      if(editingDocument) setCurrentFileName(editingDocument.fileName);
      else setCurrentFileName(null);
    }
  };

  const readFileAsDataURL = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const readerInstance = new FileReader();
      readerInstance.readAsDataURL(f);
      readerInstance.onload = () => resolve(readerInstance.result as string);
      readerInstance.onerror = (e) => {
        console.error("FileReader error (DocumentUtile):", e);
        reject(readerInstance.error);
      };
    });

  const handleSubmitDocument = async (event: React.FormEvent) => {
    if (!canUpload) { toast.error("Action non autorisée."); return; }
    event.preventDefault();
    if (!titre || !agentNomComplet || !source) { toast.warn('Veuillez renseigner le titre, le nom de l\'agent, et la source.'); return; }
    if (!editingDocument && !file) { toast.warn('Veuillez sélectionner un fichier pour un nouveau document.'); return; }

    setIsSubmitting(true);
    try {
      let fileDataUrlToSave = editingDocument?.fileDataUrl;
      let fileNameToSave = editingDocument?.fileName || '';
      let fileTypeToSave = editingDocument?.fileType || 'unknown';

      if (file) {
        fileDataUrlToSave = await readFileAsDataURL(file);
        fileNameToSave = file.name;
        fileTypeToSave = file.type || file.name.split('.').pop()?.toLowerCase() || 'unknown';
      }

      const documentData: UsefulDocument = {
        id: editingDocument ? editingDocument.id : uuidv4(),
        titre, description, source, fileName: fileNameToSave, fileType: fileTypeToSave,
        fileDataUrl: fileDataUrlToSave,
        uploadedAt: editingDocument && !file ? (editingDocument.uploadedAt || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        agentNomComplet,
      };

      let updatedData = editingDocument ? documents.map(doc => doc.id === editingDocument.id ? documentData : doc) : [...documents, documentData];
      updatedData.sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setDocuments(updatedData);
      localStorage.setItem(MOCK_DOCS_KEY, JSON.stringify(updatedData));
      notifyDataChange('documentsUtiles');
      toast.success(`Document ${editingDocument ? 'modifié' : 'téléversé'} avec succès !`);
      handleCloseForm();
    } catch (error: any) {
      console.error("Erreur handleSubmitDocument:", error);
      let errorMessage = "Erreur lors de la préparation du fichier.";
       if (error.name === 'QuotaExceededError' || (error.message && error.message.toLowerCase().includes('quota'))) {
        errorMessage = "ERREUR : Stockage local plein ou fichier trop volumineux.";
      } else if (error instanceof Error) { errorMessage += ` Détail: ${error.message}`; }
      toast.error(errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleEditDocument = (doc: UsefulDocument) => {
    if (!canManage) { toast.warn("Action non autorisée."); return; }
    setEditingDocument(doc);
    setTitre(doc.titre);
    setDescription(doc.description || '');
    setSource(doc.source);
    setAgentNomComplet(doc.agentNomComplet);
    setCurrentFileName(doc.fileName);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDocument = (id: string) => {
    if (!canManage) { toast.error("Action non autorisée."); return; }
    toast( ({ closeToast }) => ( <div className="flex flex-col p-2"> <p className="mb-3 text-sm text-gray-700">Supprimer ce document définitivement ?</p> <div className="flex justify-end space-x-2"> <button onClick={() => { const updatedData = documents.filter(doc => doc.id !== id); setDocuments(updatedData); localStorage.setItem(MOCK_DOCS_KEY, JSON.stringify(updatedData)); notifyDataChange('documentsUtiles'); toast.success("Document supprimé."); if(closeToast) closeToast(); }} className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"> Supprimer </button> <button onClick={closeToast} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"> Annuler </button> </div> </div> ), { position: "top-center", autoClose: false, closeOnClick: false, draggable: false } );
  };

  const handleDownload = (doc: { fileDataUrl?: string, fileName: string }) => {
    if (doc.fileDataUrl) { const link=document.createElement('a'); link.href=doc.fileDataUrl; link.download=doc.fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link); } else { toast.warn("Aucune donnée de fichier à télécharger."); }
  };

  const filteredDocuments = useMemo(() => {
    if (!searchTerm.trim()) return documents;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return documents.filter(doc =>
        doc.titre.toLowerCase().includes(lowerSearchTerm) ||
        (doc.description && doc.description.toLowerCase().includes(lowerSearchTerm)) ||
        doc.fileName.toLowerCase().includes(lowerSearchTerm) ||
        doc.source.toLowerCase().includes(lowerSearchTerm) ||
        doc.agentNomComplet.toLowerCase().includes(lowerSearchTerm)
    );
  }, [documents, searchTerm]);

  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm read-only:bg-gray-100 read-only:cursor-not-allowed";
  const fileInputStyle = "mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer";

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">Documents Utiles</h1>
        {canUpload && !showForm && (
          <button
            onClick={handleOpenFormForCreate}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 transition duration-150 ease-in-out"
          >
            <PlusCircle size={20} className="mr-2"/> Ajouter un Document
          </button>
        )}
      </div>

      {canUpload && showForm && (
        <div className="bg-white p-6 rounded-xl shadow-xl mb-10 border border-gray-200">
          <div className="flex justify-between items-center mb-6 pb-3 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <UploadCloud size={24} className="mr-3 text-green-600" />
                {editingDocument && !canManage ? 'Consulter le Document' : (editingDocument ? 'Modifier le Document' : 'Téléverser un nouveau Document')}
            </h2>
             <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600" title="Fermer">
                <XCircle size={24}/>
            </button>
          </div>
          <form onSubmit={handleSubmitDocument} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label htmlFor="doc-titre" className="block text-sm font-medium text-gray-700">Titre du Document <span className="text-red-500">*</span></label>
                  <input type="text" id="doc-titre" value={titre} onChange={(e) => setTitre(e.target.value)} readOnly={!!(editingDocument && !canManage)} required className={inputStyle}/>
                </div>
                <div>
                  <label htmlFor="doc-agentNomComplet" className="block text-sm font-medium text-gray-700">Nom de l'agent <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="doc-agentNomComplet"
                    value={agentNomComplet}
                    onChange={(e) => setAgentNomComplet(e.target.value)}
                    placeholder="Exp : Pape Madior Diouf"
                    readOnly={!!(editingDocument && !canManage)}
                    required
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label htmlFor="doc-source" className="block text-sm font-medium text-gray-700">Source (origine du document) <span className="text-red-500">*</span></label>
                  <input type="text" id="doc-source" value={source} onChange={(e) => setSource(e.target.value)} readOnly={!!(editingDocument && !canManage)} required className={inputStyle}/>
                </div>
            </div>
            <div>
              <label htmlFor="doc-description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="doc-description" value={description} onChange={(e) => setDescription(e.target.value)} readOnly={!!(editingDocument && !canManage)} rows={3} className={inputStyle}></textarea>
            </div>
            <div>
              <label htmlFor="doc-file-upload" className="block text-sm font-medium text-gray-700">Fichier {!editingDocument && <span className="text-red-500">*</span>}</label>
              <input type="file" id="doc-file-upload" ref={fileInputRef} onChange={handleFileChange} className={fileInputStyle} required={!editingDocument} disabled={!!(editingDocument && !canManage)} />
              {editingDocument && currentFileName && !file && (<div className="text-xs text-gray-500 mt-1">Fichier actuel: {currentFileName}</div>)}
              {file && <div className="text-xs text-green-600 mt-1">Nouveau fichier: {file.name} ({(file.size / (1024*1024)).toFixed(2)} MB)</div>}
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={handleCloseForm} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg border border-gray-200 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100">Annuler</button>
                <button type="submit"
                  disabled={(editingDocument && !canManage) || isSubmitting}
                  className={`inline-flex items-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-150 ease-in-out disabled:opacity-50 ${(editingDocument && !canManage) ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                    {isSubmitting ? <Loader size={18} className="mr-2 animate-spin"/> : <Save size={18} className="mr-2"/>}
                    {isSubmitting ? 'Traitement...' : (editingDocument && !canManage ? 'Non autorisé' : (editingDocument ? 'Sauvegarder les modifications' : 'Téléverser le Document'))}
                </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-xl border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Documents Existants</h2>
             <div className="relative w-full md:w-1/2 lg:w-1/3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Rechercher (titre, agent, source...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${inputStyle} pl-10`}
                />
            </div>
          </div>
          {isLoadingInitial ? (
            <div className="text-center py-10"><Loader size={28} className="animate-spin text-green-500 inline-block" /></div>
          ): filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center text-green-600 mb-2">
                      {getFileIcon(doc.fileType)}
                      <h3 className="ml-2 text-md font-semibold text-gray-800 truncate" title={doc.titre}>{doc.titre}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-1 italic truncate" title={doc.fileName}>Fichier: {doc.fileName}</p>
                    <p className="text-xs text-gray-600 mb-1 flex items-center">
                        <User size={12} className="mr-1 text-gray-400"/> Agent: {doc.agentNomComplet}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">Source: {doc.source}</p>
                    <p className="text-xs text-gray-400 mb-3">Ajouté le: {new Date(doc.uploadedAt+"T00:00:00Z").toLocaleDateString('fr-FR', {timeZone: 'UTC'})}</p>
                    {doc.description && <p className="text-sm text-gray-600 mb-3 text-ellipsis overflow-hidden max-h-20">{doc.description}</p>}
                  </div>
                  <div className="mt-auto pt-3 border-t border-gray-100 flex justify-end space-x-2">
                    <button onClick={() => handleDownload(doc)} className="p-2 text-sm text-green-600 hover:text-green-800 rounded-full hover:bg-green-50" title="Télécharger"> <Download size={18} /> </button>
                    {canManage && ( <> <button onClick={() => handleEditDocument(doc)} className="p-2 text-sm text-yellow-600 hover:text-yellow-800 rounded-full hover:bg-yellow-50" title="Modifier"> <Edit3 size={18} /> </button> <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-sm text-red-600 hover:text-red-800 rounded-full hover:bg-red-50" title="Supprimer"> <Trash2 size={18} /> </button> </> )}
                  </div>
                </div>
              ))}
            </div>
          ) : ( <p className="text-center text-gray-500 py-8 italic">{searchTerm ? "Aucun document ne correspond à votre recherche." : "Aucun document utile téléversé pour le moment."}</p> )}
        </div>
      )}
    </div>
  );
};

export default DocumentsUtilesPage;