// src/components/ProjetsDefccsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  PlusCircle,
  XCircle,
  Save,
  Edit2,
  Trash2,
  UploadCloud,
  // FileText, // Pas directement utilisé ici, mais par getFileIcon
  Download, // On va l'utiliser pour télécharger les fichiers du projet
  Loader2 as Loader,
  Paperclip, // Pour les pièces jointes
  FileIcon // Icône générique si besoin
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

// Import générique pour getFileIcon (s'il est défini ailleurs et exporté)
// Si getFileIcon est spécifique à ReportPage, il faudrait le dupliquer ou le rendre plus global.
// Pour l'instant, on peut utiliser FileIcon ou Paperclip pour la liste des fichiers.

interface ProjetDocument {
  nomFichier: string;
  dataUrl?: string; // Pour localStorage, sera une URL de stockage avec Supabase
  // typeFichier?: string; // Optionnel
}

interface ProjetDefccs {
  id: string;
  cigleProjet: string;
  intituleProjet: string;
  objectifsStrategiques: string; // Maintenant obligatoire
  nomCompletAgentSaisie: string;
  descriptionSommaire?: string;
  // Gestion de plusieurs documents
  documents: ProjetDocument[];
  dateCreation: string;
  dateModification: string;
  utilisateurSaisieId: string;
  utilisateurSaisieNomComplet: string;
}

const MOCK_PROJETS_DATA_KEY = 'defccs_projets_data';

const ProjetsDefccsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const canManageProjects = currentUser?.role === 'admin' || currentUser?.role === 'editeur';
  const canDeleteProjects = currentUser?.role === 'admin';

  const [projets, setProjets] = useState<ProjetDefccs[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [currentProjet, setCurrentProjet] = useState<Partial<ProjetDefccs>>({ documents: [] }); // Initialiser documents
  const [editingProjetId, setEditingProjetId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null); // Pour plusieurs fichiers

  useEffect(() => {
    setIsLoading(true);
    const storedProjets = localStorage.getItem(MOCK_PROJETS_DATA_KEY);
    if (storedProjets) {
      try {
        const parsedProjets = (JSON.parse(storedProjets) as any[]).map(p => {
            const { titreCompletProjet, documentProjetNomFichier, documentProjetDataUrl, ...rest } = p;
            // Migration des anciens documents uniques vers la liste documents
            let migratedDocuments: ProjetDocument[] = p.documents || [];
            if (documentProjetNomFichier && !migratedDocuments.some(doc => doc.nomFichier === documentProjetNomFichier)) {
                migratedDocuments.push({
                    nomFichier: documentProjetNomFichier,
                    dataUrl: documentProjetDataUrl,
                });
            }
            return { ...rest, documents: migratedDocuments, objectifsStrategiques: p.objectifsStrategiques || "" }; // Assurer que objectifsStrategiques existe
        });
        setProjets(parsedProjets as ProjetDefccs[]);
      } catch (error) {
        setProjets([]);
      }
    } else {
        setProjets([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
        localStorage.setItem(MOCK_PROJETS_DATA_KEY, JSON.stringify(projets));
    }
  }, [projets, isLoading]);

  const handleOpenModalForCreate = () => { /* ... (Comme avant, mais s'assurer que currentProjet.documents est initialisé à []) ... */ if (!canManageProjects) { toast.warn("Droits insuffisants pour ajouter un projet."); return; } setEditingProjetId(null); setCurrentProjet({ documents: [] }); setSelectedFiles(null); setShowModal(true); };
  const handleOpenModalForEdit = (projet: ProjetDefccs) => { /* ... (Comme avant) ... */ if (!canManageProjects) { toast.warn("Droits insuffisants pour modifier ce projet."); return; } setEditingProjetId(projet.id); setCurrentProjet({ ...projet, documents: projet.documents || [] }); setSelectedFiles(null); setShowModal(true); };
  const handleCloseModal = () => { /* ... (Comme avant, ajouter reset de selectedFiles) ... */ setShowModal(false); setCurrentProjet({ documents: [] }); setEditingProjetId(null); setSelectedFiles(null); const fileInput = document.getElementById('documentProjet') as HTMLInputElement; if (fileInput) { fileInput.value = ''; } };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { /* ... (Comme avant) ... */ const { name, value } = e.target; setCurrentProjet(prev => ({ ...prev, [name]: value })); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // MODIFICATION: Gérer plusieurs fichiers
    if (e.target.files) {
        setSelectedFiles(e.target.files);
    } else {
        setSelectedFiles(null);
    }
  };

  const readFileAsDataURLForProject = (file: File): Promise<string> => new Promise((resolve, reject) => { /* ... (Comme avant) ... */ const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = (error) => reject(error); reader.readAsDataURL(file); });

  const handleSubmitProjet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { toast.error("Utilisateur non authentifié."); return; }
    
    // MODIFICATION: Validation mise à jour pour "Objectifs Stratégiques du projet"
    if (!currentProjet.cigleProjet || !currentProjet.intituleProjet || !currentProjet.objectifsStrategiques || !currentProjet.nomCompletAgentSaisie) {
        toast.warn("Veuillez remplir tous les champs obligatoires (Cigle, Intitulé, Objectifs Stratégiques, Prénom et Nom de l'agent).");
        return;
    }

    setIsSubmitting(true);
    
    // Gestion des nouveaux fichiers sélectionnés
    const nouveauxDocuments: ProjetDocument[] = [];
    if (selectedFiles && selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            try {
                const dataUrl = await readFileAsDataURLForProject(file);
                nouveauxDocuments.push({ nomFichier: file.name, dataUrl });
            } catch (error) {
                toast.error(`Erreur lors de la lecture du fichier ${file.name}.`);
                // Optionnel: décider si on continue ou arrête la soumission
            }
        }
    }

    const now = new Date().toISOString();
    
    // Conserver les anciens documents si c'est une édition et qu'aucun nouveau fichier n'est choisi pour les remplacer
    // Ou fusionner/remplacer si besoin (logique plus complexe si on veut supprimer sélectivement des anciens)
    // Pour l'instant, les nouveaux fichiers s'ajoutent ou remplacent si selectedFiles n'est pas null.
    // Si selectedFiles est null et c'est une édition, on garde currentProjet.documents.
    // Si on veut une fusion plus fine, il faudrait une UI pour gérer les fichiers existants (supprimer, etc.)

    let documentsFinaux: ProjetDocument[] = currentProjet.documents || [];
    if (nouveauxDocuments.length > 0) {
        // Pour une version simple, les nouveaux remplacent les anciens
        // Ou s'ajoutent : documentsFinaux = [...(currentProjet.documents || []), ...nouveauxDocuments];
        // Pour l'instant, si on sélectionne de nouveaux fichiers, ils deviennent LA liste de fichiers.
        documentsFinaux = nouveauxDocuments;
    }


    const projetSoumis: Partial<ProjetDefccs> = {
        ...currentProjet,
        documents: documentsFinaux,
        dateModification: now,
        utilisateurSaisieId: currentUser.id,
        utilisateurSaisieNomComplet: `${currentUser.prenom} ${currentUser.nom}`.trim(),
    };

    if (editingProjetId) {
        setProjets(prevProjets => 
            prevProjets.map(p => p.id === editingProjetId ? { ...p, ...projetSoumis } as ProjetDefccs : p)
        );
        toast.success("Projet modifié avec succès !");
    } else {
        const newProjet: ProjetDefccs = {
            id: `proj_${Date.now()}`,
            dateCreation: now,
            ...projetSoumis,
            documents: documentsFinaux, // Assurer que les documents sont là pour un nouveau projet
        } as ProjetDefccs;
        setProjets(prevProjets => [newProjet, ...prevProjets].sort((a,b) => new Date(b.dateModification).getTime() - new Date(a.dateModification).getTime()));
        toast.success("Projet ajouté avec succès !");
    }

    setIsSubmitting(false);
    handleCloseModal();
  };

  const handleDeleteProjet = (projetId: string) => { /* ... (Inchangé) ... */ };
  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  // MODIFICATION: input pour fichiers devient `multiple`
  const fileInputStyle = "mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50";

  const handleDownloadDocument = (doc: ProjetDocument) => {
    if (doc.dataUrl && doc.nomFichier) {
      const link = document.createElement('a');
      link.href = doc.dataUrl;
      link.download = doc.nomFichier;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.warn("Le fichier ne peut pas être téléchargé (données manquantes).");
    }
  };


  if (isLoading && !showModal) { /* ... (Inchangé) ... */ }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8"> {/* ... (Titre et bouton Ajouter inchangés) ... */} <h1 className="text-3xl font-bold text-blue-800 flex items-center"> <Briefcase size={30} className="mr-3 text-blue-700" /> Gestion des Projets DEFCCS </h1> {canManageProjects && ( <button onClick={handleOpenModalForCreate} className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md inline-flex items-center transition-colors duration-150" > <PlusCircle size={20} className="mr-2" /> Ajouter un Projet </button> )} </div>

      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Liste des Projets</h2>
        {projets.length === 0 && !isLoading ? (  <div className="mt-6 border border-dashed border-gray-300 rounded-md p-10 text-center"> <p className="text-gray-500">Aucun projet enregistré pour le moment.</p> {canManageProjects && <p className="text-sm text-gray-400 mt-2">Cliquez sur "Ajouter un Projet" pour commencer.</p>} </div>  ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cigle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intitulé du Projet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent (Projet)</th>
                {/* MODIFICATION: Colonne pour documents */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dern. Modif.</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projets.map((projet) => (
                <tr key={projet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{projet.cigleProjet}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate" title={projet.intituleProjet}>{projet.intituleProjet}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{projet.nomCompletAgentSaisie}</td>
                  {/* MODIFICATION: Affichage de la liste des documents */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {projet.documents && projet.documents.length > 0 ? (
                      <ul className="space-y-1">
                        {projet.documents.map((doc, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <Paperclip size={14} className="text-gray-500"/>
                            <span className="truncate max-w-[150px]" title={doc.nomFichier}>{doc.nomFichier}</span>
                            {/* Bouton de téléchargement pour chaque fichier */}
                            {doc.dataUrl && (
                                <button onClick={() => handleDownloadDocument(doc)} className="text-blue-500 hover:text-blue-700" title="Télécharger ce fichier">
                                    <Download size={15}/>
                                </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : "Aucun"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(projet.dateModification).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2"> {/* ... (Boutons actions) ... */ } {canManageProjects && ( <button onClick={() => handleOpenModalForEdit(projet)} className="p-1.5 text-yellow-500 hover:text-yellow-700 rounded-full hover:bg-yellow-100" title="Modifier"> <Edit2 size={18} /> </button> )} {canDeleteProjects && ( <button onClick={() => handleDeleteProjet(projet.id)} className="p-1.5 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100" title="Supprimer"> <Trash2 size={18} /> </button> )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10"> {/* ... (Titre modale inchangé) ... */} <h3 className="text-lg font-semibold text-gray-800 flex items-center"> <UploadCloud size={22} className="mr-2 text-blue-600" /> {editingProjetId ? 'Modifier le Projet' : 'Ajouter un Nouveau Projet'} </h3> <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"> <XCircle size={24} /> </button> </div>
            <form onSubmit={handleSubmitProjet} className="space-y-4 p-5 overflow-y-auto">
              <div> <label htmlFor="cigleProjet" className={labelStyle}>Cigle du Projet <span className="text-red-500">*</span></label> <input type="text" name="cigleProjet" id="cigleProjet" value={currentProjet.cigleProjet || ''} onChange={handleInputChange} required className={inputStyle} placeholder="Ex: PASK"/> </div>
              <div> <label htmlFor="intituleProjet" className={labelStyle}>Intitulé du Projet <span className="text-red-500">*</span></label> <input type="text" name="intituleProjet" id="intituleProjet" value={currentProjet.intituleProjet || ''} onChange={handleInputChange} required className={inputStyle} placeholder="Ex: Projet d'Appui à la Sécurité des Kévignos"/> </div>
              
              {/* MODIFICATION: Déplacement et nouveau libellé pour Objectifs Stratégiques */}
              <div>
                <label htmlFor="objectifsStrategiques" className={labelStyle}>Objectifs Stratégiques du projet <span className="text-red-500">*</span></label>
                <textarea name="objectifsStrategiques" id="objectifsStrategiques" rows={3} value={currentProjet.objectifsStrategiques || ''} onChange={handleInputChange} required className={inputStyle}></textarea>
              </div>

              <div> <label htmlFor="nomCompletAgentSaisie" className={labelStyle}>Prénom et Nom de l'agent <span className="text-red-500">*</span></label> <input type="text" name="nomCompletAgentSaisie" id="nomCompletAgentSaisie" value={currentProjet.nomCompletAgentSaisie || ''} onChange={handleInputChange} required className={inputStyle} placeholder="Ex: Madior DIOUF" /> </div>
              <div> <label htmlFor="descriptionSommaire" className={labelStyle}>Description Sommaire</label> <textarea name="descriptionSommaire" id="descriptionSommaire" rows={3} value={currentProjet.descriptionSommaire || ''} onChange={handleInputChange} className={inputStyle}></textarea> </div>
              
              {/* MODIFICATION: Input de fichier `multiple` et affichage des fichiers sélectionnés/existants */}
              <div>
                <label htmlFor="documentProjet" className={labelStyle}>Documents du Projet (maintenez Ctrl/Cmd pour sélectionner plusieurs)</label>
                <input type="file" name="documentProjet" id="documentProjet" onChange={handleFileChange} className={fileInputStyle} multiple />
                
                {/* Afficher les fichiers existants lors de l'édition */}
                {editingProjetId && currentProjet.documents && currentProjet.documents.length > 0 && (
                    <div className="mt-2 text-sm">
                        <p className="font-medium text-gray-700">Fichiers actuels :</p>
                        <ul className="list-disc list-inside ml-1">
                            {currentProjet.documents.map((doc, index) => (
                                <li key={`current-${index}`} className="text-gray-600 flex items-center">
                                    <Paperclip size={14} className="mr-1 text-gray-500" /> {doc.nomFichier}
                                    {/* Option pour supprimer un fichier existant individuellement (plus complexe, pour plus tard) */}
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-gray-500 mt-1">Pour remplacer tous les fichiers, choisissez de nouveaux fichiers.</p>
                    </div>
                )}

                {/* Afficher les nouveaux fichiers sélectionnés */}
                {selectedFiles && selectedFiles.length > 0 && (
                    <div className="mt-2 text-sm">
                        <p className="font-medium text-green-700">Fichiers sélectionnés pour téléversement :</p>
                        <ul className="list-disc list-inside ml-1">
                            {Array.from(selectedFiles).map((file, index) => (
                                <li key={`new-${index}`} className="text-green-600">{file.name}</li>
                            ))}
                        </ul>
                    </div>
                )}
              </div>

              <div className="pt-5 border-t flex justify-end space-x-3 sticky bottom-0 bg-white pb-5 px-5 -mx-5"> <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-5 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium"> Annuler </button> <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center"> {isSubmitting ? ( <><Loader size={20} className="animate-spin mr-2"/><span>Enregistrement...</span></> ) : ( <><Save size={20} className="mr-2" /><span>{editingProjetId ? 'Sauvegarder Modifications' : 'Enregistrer le Projet'}</span></> )} </button> </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjetsDefccsPage;