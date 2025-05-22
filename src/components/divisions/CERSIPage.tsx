// src/components/divisions/CERSIPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Ajustez si le chemin est différent
import { toast } from 'react-toastify';
import { 
  Edit2, Save, UploadCloud, PlusCircle, XCircle, ImagePlus, Trash2, ChevronLeft, ChevronRight, MapPin, FileText,
  Loader2 as Loader 
} from 'lucide-react';

// Interface CarouselImage (inchangée)
interface CarouselImage { id: string; imageUrl: string; nomFichier?: string; description?: string; dateAjout: string; utilisateurIdAjout?: string; utilisateurNomAjout?: string; }

const SIGLE_CERSI = "CERSI";
const INTITULE_COMPLET_CERSI = "Cellule Cartographie et Évaluation des Ressources naturelles et Systèmes d’Information";
const MISSION_INITIALE_CERSI = "Appuie la DEFCCS dans la cartographie, l’évaluation des ressources naturelles et le développement de systèmes d'information pour une meilleure gestion forestière.";
const MISSION_STORAGE_KEY_CERSI = `mission_text_${SIGLE_CERSI.toLowerCase()}`;
const CAROUSEL_IMAGES_STORAGE_KEY = `carousel_images_${SIGLE_CERSI.toLowerCase()}`;

const CERSIPage: React.FC = () => {
  const { currentUser } = useAuth();
  const canEditContent = currentUser?.role === 'admin' || currentUser?.role === 'editeur';

  const [missionText, setMissionText] = useState(MISSION_INITIALE_CERSI);
  const [isEditingMission, setIsEditingMission] = useState(false);
  const [editMissionText, setEditMissionText] = useState(MISSION_INITIALE_CERSI);
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageForModal, setCurrentImageForModal] = useState<Partial<CarouselImage>>({});
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmittingImage, setIsSubmittingImage] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // --- Gestion de la mission et des images (useEffect, handleEditMission, etc. inchangés) ---
  useEffect(() => { const storedMission = localStorage.getItem(MISSION_STORAGE_KEY_CERSI); if (storedMission) { setMissionText(storedMission); setEditMissionText(storedMission); } else { localStorage.setItem(MISSION_STORAGE_KEY_CERSI, MISSION_INITIALE_CERSI); } const storedImages = localStorage.getItem(CAROUSEL_IMAGES_STORAGE_KEY); if (storedImages) { try { setImages(JSON.parse(storedImages).sort((a:CarouselImage, b:CarouselImage) => new Date(b.dateAjout).getTime() - new Date(a.dateAjout).getTime())); } catch (e) { console.error("Erreur chargement images carrousel:", e); } } }, []);
  const handleEditMission = () => { setEditMissionText(missionText); setIsEditingMission(true); };
  const handleSaveMission = () => { localStorage.setItem(MISSION_STORAGE_KEY_CERSI, editMissionText); setMissionText(editMissionText); setIsEditingMission(false); toast.success("Missions de CERSI mises à jour !"); };
  const handleCancelEditMission = () => { setIsEditingMission(false); setEditMissionText(missionText);};
  const saveImagesToStorage = (updatedImages: CarouselImage[]) => { const sortedImages = [...updatedImages].sort((a,b) => new Date(b.dateAjout).getTime() - new Date(a.dateAjout).getTime()); localStorage.setItem(CAROUSEL_IMAGES_STORAGE_KEY, JSON.stringify(sortedImages)); setImages(sortedImages); };
  const resetImageModalForm = () => { setSelectedImageFile(null); setCurrentImageForModal({}); if (imageFileInputRef.current) imageFileInputRef.current.value = ""; };
  const handleOpenImageModalForCreate = () => { if (!canEditContent) { toast.warn("Permissions insuffisantes."); return; } setEditingImageId(null); resetImageModalForm(); setShowImageModal(true); };
  const handleOpenImageModalForEdit = (image: CarouselImage) => { if (!canEditContent) { toast.warn("Permissions insuffisantes."); return; } setEditingImageId(image.id); setCurrentImageForModal({ description: image.description }); setSelectedImageFile(null); if (imageFileInputRef.current) imageFileInputRef.current.value = ""; setShowImageModal(true); };
  const handleCloseImageModal = () => { setShowImageModal(false); setEditingImageId(null); resetImageModalForm(); };
  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { if (event.target.files && event.target.files[0]) { const file = event.target.files[0]; if (!file.type.startsWith('image/')) { toast.error("Veuillez sélectionner un fichier image (JPEG, PNG, GIF, etc.)."); setSelectedImageFile(null); if (imageFileInputRef.current) imageFileInputRef.current.value = ""; return; } setSelectedImageFile(file); } else { setSelectedImageFile(null); } };
  const readFileAsDataURL = (file: File): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = error => reject(error); reader.readAsDataURL(file); });
  const handleSubmitImage = async (e: React.FormEvent) => { e.preventDefault(); if (!editingImageId && !selectedImageFile) { toast.warn("Veuillez sélectionner une image."); return; } if (!currentUser) return; setIsSubmittingImage(true); let imageUrlFinal = editingImageId ? images.find(img => img.id === editingImageId)?.imageUrl : undefined; let nomFichierFinal = editingImageId ? images.find(img => img.id === editingImageId)?.nomFichier : undefined; if (selectedImageFile) { try { imageUrlFinal = await readFileAsDataURL(selectedImageFile); nomFichierFinal = selectedImageFile.name; } catch (error) { toast.error("Erreur lecture image."); setIsSubmittingImage(false); return; } } else if (!editingImageId) { toast.error("Aucune image sélectionnée pour la nouvelle entrée."); setIsSubmittingImage(false); return; } if (!imageUrlFinal) { toast.error("Données d'image manquantes."); setIsSubmittingImage(false); return; } const imageEntryCommonData = { imageUrl: imageUrlFinal, nomFichier: nomFichierFinal, description: currentImageForModal.description || '', dateAjout: new Date().toISOString(), utilisateurIdAjout: currentUser.id, utilisateurNomAjout: `${currentUser.prenom} ${currentUser.nom}`.trim(), }; let updatedImages: CarouselImage[]; if (editingImageId) { updatedImages = images.map(img => img.id === editingImageId ? { ...images.find(i => i.id === editingImageId)!, ...imageEntryCommonData } : img ); toast.success("Image du carrousel mise à jour !"); } else { const newImage: CarouselImage = { id: `cersi_img_${Date.now()}`, ...imageEntryCommonData }; updatedImages = [newImage, ...images]; toast.success("Nouvelle image ajoutée au carrousel !"); } saveImagesToStorage(updatedImages); setIsSubmittingImage(false); handleCloseImageModal(); };
  const handleDeleteImage = (imageId: string) => { if (!canEditContent) { toast.warn("Permissions insuffisantes."); return; } const imageASupprimer = images.find(img => img.id === imageId); if (!imageASupprimer) return; toast( ({closeToast}) => ( <div> <p className="font-semibold">Supprimer cette image du carrousel ?</p> {imageASupprimer.nomFichier && <p className="text-sm my-1">Fichier: {imageASupprimer.nomFichier}</p>} <div className="flex justify-end space-x-2 mt-3"> <button className="px-3 py-1.5 text-sm bg-gray-200 rounded hover:bg-gray-300" onClick={closeToast}>Annuler</button> <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700" onClick={() => { saveImagesToStorage(images.filter(img => img.id !== imageId)); toast.info("Image supprimée du carrousel."); closeToast?.(); }} > Supprimer </button> </div> </div> ), {autoClose:false}); };
  const nextSlide = () => { setCurrentIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1)); };
  const prevSlide = () => { setCurrentIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1)); };
  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">{SIGLE_CERSI} : <span className="font-medium">{INTITULE_COMPLET_CERSI}</span></h1>
      <div className="bg-blue-50 p-4 rounded-md shadow mb-6 relative group"> {/* ... (Mission Section) ... */} <div className="flex justify-between items-start"> <div> <h2 className="text-xl font-semibold text-blue-600 mb-2">Missions Principales :</h2> {!isEditingMission ? (<p className="text-gray-700 whitespace-pre-line">{missionText}</p>) : ( <div className="space-y-2"> <textarea value={editMissionText} onChange={(e) => setEditMissionText(e.target.value)} rows={6} className="w-full p-2 border border-blue-300 rounded-md"/> <div className="flex justify-end space-x-2"><button onClick={handleCancelEditMission} className="px-4 py-2 text-sm bg-gray-200 rounded">Annuler</button><button onClick={handleSaveMission} className="px-4 py-2 text-sm bg-green-600 text-white rounded flex items-center"><Save size={16} className="mr-1.5"/> Enregistrer</button></div> </div> )} </div> {canEditContent && !isEditingMission && (<button onClick={handleEditMission} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-blue-700 opacity-0 group-hover:opacity-100" title="Modifier Missions"><Edit2 size={18} /></button>)} </div> </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className="text-2xl font-semibold text-gray-800">Cartes et Évaluations Visuelles</h2>
          {canEditContent && ( <button onClick={handleOpenImageModalForCreate} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg inline-flex items-center"> <ImagePlus size={18} className="mr-2"/> Ajouter une Image </button> )}
        </div>

        {images.length === 0 ? ( <div className="text-center py-10 bg-gray-50 rounded-md border-2 border-dashed border-gray-300"> <MapPin size={48} className="mx-auto text-gray-400 mb-3"/> <p className="text-gray-500">Aucune image ou carte n'a été ajoutée pour CERSI.</p> {canEditContent && <p className="text-sm text-gray-400 mt-1">Utilisez le bouton "Ajouter une Image" pour commencer.</p>} </div>
        ) : (
          <div className="relative bg-white p-4 rounded-lg shadow-xl border border-gray-200">
            <div className="overflow-hidden relative h-[400px] md:h-[500px] rounded-md">
              {images.map((image, index) => ( <div key={image.id} className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0'}`}> <img src={image.imageUrl} alt={image.description || image.nomFichier || `Image ${index + 1}`} className="w-full h-full object-contain bg-gray-100" /> </div> ))}
            </div>
            {images.length > 1 && ( <button onClick={prevSlide} className="absolute top-1/2 left-2 md:left-4 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 z-20 focus:outline-none"> <ChevronLeft size={24} /> </button> )}
            {images.length > 1 && ( <button onClick={nextSlide} className="absolute top-1/2 right-2 md:right-4 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 z-20 focus:outline-none"> <ChevronRight size={24} /> </button> )}
            
            <div className="mt-4 p-3 bg-gray-50 rounded-b-md">
              {images[currentIndex]?.description && ( <p className="text-sm text-gray-700 mb-2 whitespace-pre-line"><span className="font-semibold text-gray-800">Description :</span> {images[currentIndex].description}</p> )}
              {images[currentIndex] && (
                <div className="text-xs text-gray-500">
                    {images[currentIndex].nomFichier && <span className="mr-2">Fichier : {images[currentIndex].nomFichier} |</span>}
                    <span className="mr-2">Ajouté le : {new Date(images[currentIndex].dateAjout).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    {/* MODIFICATION: Affichage du nom de l'agent */}
                    {images[currentIndex].utilisateurNomAjout && <span>| Par : <span className="font-medium">{images[currentIndex].utilisateurNomAjout}</span></span>}
                </div>
              )}
            </div>
            
            {canEditContent && images[currentIndex] && ( <div className="absolute top-2 right-2 z-20 bg-white bg-opacity-75 p-1.5 rounded-md shadow space-x-1"> <button onClick={() => handleOpenImageModalForEdit(images[currentIndex])} className="p-1 text-yellow-600 hover:text-yellow-800" title="Modifier"><Edit2 size={16}/></button> <button onClick={() => handleDeleteImage(images[currentIndex].id)} className="p-1 text-red-600 hover:text-red-800" title="Supprimer"><Trash2 size={16}/></button> </div> )}
          </div>
        )}
      </div>

      {showImageModal && ( /* ... (Modale inchangée) ... */ <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"> <div className="bg-white rounded-lg shadow-xl w-full max-w-lg"> <div className="flex items-center justify-between p-5 border-b"> <h3 className="text-lg font-semibold text-gray-800"> {editingImageId ? "Modifier l'Image et sa Description" : "Ajouter une Image au Carrousel"} </h3> <button onClick={handleCloseImageModal} className="p-1 text-gray-400 hover:text-gray-600"><XCircle size={24}/></button> </div> <form onSubmit={handleSubmitImage} className="p-5 space-y-4"> <div> <label htmlFor="imageFileCersi" className={labelStyle}>Fichier Image (JPEG, PNG, GIF...) {(!editingImageId || selectedImageFile) && <span className="text-red-500">*</span>}</label> <input type="file" id="imageFileCersi" ref={imageFileInputRef} onChange={handleImageFileChange} className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50" accept="image/*" /> {selectedImageFile && <p className="text-xs text-green-600 mt-1">Nouvelle image: {selectedImageFile.name}</p>} {!selectedImageFile && editingImageId && images.find(i=>i.id===editingImageId)?.nomFichier && ( <p className="text-xs text-gray-500 mt-1">Image actuelle: {images.find(i=>i.id===editingImageId)?.nomFichier}. (Choisissez un nouveau fichier pour remplacer)</p> )} </div> <div> <label htmlFor="imageDescription" className={labelStyle}>Description de l'image (optionnel)</label> <textarea id="imageDescription" value={currentImageForModal.description || ''} onChange={(e) => setCurrentImageForModal(prev => ({...prev, description: e.target.value}))} rows={4} className={inputStyle} placeholder="Description de la carte ou de l'évaluation..." /> </div> <div className="pt-3 border-t flex justify-end space-x-3"> <button type="button" onClick={handleCloseImageModal} disabled={isSubmittingImage} className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300">Annuler</button> <button type="submit" disabled={isSubmittingImage} className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center"> {isSubmittingImage ? <Loader className="animate-spin mr-2" size={18}/> : <Save size={18} className="mr-2"/>} {isSubmittingImage ? 'Enregistrement...' : (editingImageId ? 'Sauvegarder' : 'Ajouter Image')} </button> </div> </form> </div> </div> )}
    </div>
  );
};

export default CERSIPage;