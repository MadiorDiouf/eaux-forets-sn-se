// src/components/Dashboard.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'react-toastify';

import { 
    RapportEnPreparation, 
    NATURE_RAPPORT_OPTIONS as PREP_NATURE_OPTIONS_FULL, 
    STATUT_RAPPORT_OPTIONS as PREP_STATUT_OPTIONS_FULL 
} from './RapportsEnPreparationPage'; 
import { CompteRendu, getFileIcon as getCompteRenduFileIcon } from './ComptesRendusPage'; 
import { 
    MissionAtelier, 
    EVENT_TYPE_OPTIONS, 
    EVENT_STATUS_OPTIONS 
} from './MissionsAteliersPage';
import { UsefulDocument, getFileIcon as getDocumentFileIcon } from './DocumentsUtilesPage';
import { UploadedReport, getFileIcon as getReportFileIcon } from './ReportPage';

import { 
    Clock, CalendarDays, FileText as ReportIconLucide, MessageSquare, 
    MapPin as MissionMapPin, BookOpen, BarChartBig, Share2, ClipboardList, 
    CalendarCheck2, ListFilter, LayoutGrid, Download, ImagePlus, XCircle, 
    Trash2, Edit3, Save, UploadCloud, Eye, Loader2 as Loader, User as UserIcon,
    ChevronLeft, ChevronRight
} from 'lucide-react';

export interface DashboardGalleryImage { 
    id: string; 
    imageUrl: string; 
    titre: string; 
    description?: string; 
    uploadedAt: string; 
    uploadedByUserId?: string; 
    uploadedByUserName?: string; 
}
const DASHBOARD_GALLERY_IMAGES_KEY = 'dashboard_gallery_images';

const MOCK_PREPA_KEY = 'rapports_en_preparation_data';
const MOCK_CR_KEY = 'comptes_rendus_data';
const MOCK_MISSIONS_KEY = 'missions_ateliers_data_v2';
const MOCK_DOCS_KEY = 'useful_documents_data';
const REPORT_PAGE_TYPES = ['ptba', 'performances', 'annuels', 'trimestriels'];
const REPORT_PAGE_TITLES: { [key: string]: string } = {  ptba: 'Rapport PTBA', performances: 'Rapport de Performances', annuels: 'Rapport Annuel', trimestriels: 'Rapport Trimestriel' };

const cloneIconForDashboard = (iconElement?: JSX.Element, defaultIcon?: JSX.Element): JSX.Element => { 
    const elementToClone = iconElement || defaultIcon; 
    if (!elementToClone) return <div className="w-3.5 h-3.5 mr-1.5" />; 
    const currentClassName = iconElement?.props.className || ''; 
    return React.cloneElement(elementToClone, { size: 14, className: `${currentClassName.replace(/mr-\d+/g, '').trim()} mr-1.5`.trim() });
};
const PREP_NATURE_OPTIONS_DASH = PREP_NATURE_OPTIONS_FULL.map(opt => ({ value: opt.value, label: opt.label.replace('Plan de Travail et Budget Annuel', 'PTBA').replace('Rapport de Performances', 'Perf.').replace('Rapport Annuel', 'Annuel').replace('Rapport Trimestriel', 'Trim.').replace('Autre type de rapport', 'Autre')}));
const PREP_STATUT_OPTIONS_DASH = PREP_STATUT_OPTIONS_FULL.map(opt => ({ value: opt.value, label: opt.label, icon: cloneIconForDashboard(opt.icon), colorClass: opt.colorClass}));
const EVENT_TYPE_OPTIONS_DASH = EVENT_TYPE_OPTIONS.map(opt => ({ value: opt.value, label: opt.label, icon: cloneIconForDashboard(opt.icon)}));
const EVENT_STATUS_OPTIONS_DASH = EVENT_STATUS_OPTIONS.map(opt => ({ value: opt.value, label: opt.label, icon: cloneIconForDashboard(opt.icon), colorClass: opt.colorClass}));

type ActivityFilterType = 'all' | 'rapport_prep' | 'compte_rendu' | 'document_utile' | 'mission_atelier' | 'report_page';
const activityFilters: { label: string; value: ActivityFilterType; icon: JSX.Element }[] = [ 
  { label: "Tout", value: 'all', icon: <LayoutGrid /> },
  { label: "Rapports Finaux", value: 'report_page', icon: <ReportIconLucide /> }, 
  { label: "Missions/Ateliers", value: 'mission_atelier', icon: <CalendarDays /> },
  { label: "Comptes Rendus", value: 'compte_rendu', icon: <MessageSquare /> }, 
  { label: "Documents Utiles", value: 'document_utile', icon: <BookOpen /> },
];

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { dataVersion, notifyDataChange } = useData();

  const [stats, setStats] = useState({ totaux: 0, enCours: 0, aVenirOuValidation: 0 });
  const [allRecentItems, setAllRecentItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeActivityFilter, setActiveActivityFilter] = useState<ActivityFilterType>('all');

  const [galleryImages, setGalleryImages] = useState<DashboardGalleryImage[]>([]);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [currentImageForModal, setCurrentImageForModal] = useState<Partial<Omit<DashboardGalleryImage, 'id' | 'uploadedAt' | 'uploadedByUserId'> & { agentName?: string }>>({});
  const [editingGalleryImageId, setEditingGalleryImageId] = useState<string | null>(null);
  const [selectedGalleryImageFile, setSelectedGalleryImageFile] = useState<File | null>(null);
  const galleryImageFileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmittingGalleryImage, setIsSubmittingGalleryImage] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<DashboardGalleryImage | null>(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  const StatCard: React.FC<{ title: string; value: number | string; icon: JSX.Element; colorClass: string }> = ({ title, value, icon, colorClass }) => (
    <div className={`bg-white p-5 rounded-xl shadow-lg flex items-center space-x-4 border-l-4 ${colorClass}`}>
      <div className={`p-3 rounded-full ${colorClass.replace('border-', 'bg-').replace(/(\d)00/g, '100')}`}>
        {React.cloneElement(icon, { className: `text-${colorClass.split('-')[1]}-${colorClass.split('-')[2] || '500'}` })}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
  const CardLink: React.FC<{to: string, item_id: string, borderColorClass: string, children: React.ReactNode}> = ({to, item_id, borderColorClass, children}) => (
    <Link to={`${to}?itemId=${item_id}`} key={item_id} className={`block p-3.5 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out border-l-4 ${borderColorClass} mb-3 transform hover:-translate-y-1.5`}>
      {children}
    </Link>
  );
  const handleDownloadItem = (itemData: any) => {
    const dataToDownload = itemData.originalData || itemData;
    if (dataToDownload.fileDataUrl && dataToDownload.fileName) {
        const link = document.createElement('a');
        link.href = dataToDownload.fileDataUrl;
        link.download = dataToDownload.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        console.warn("Tentative de téléchargement d'un item sans fileDataUrl ou fileName:", itemData);
        toast.warn("Aucune donnée de fichier disponible pour le téléchargement pour cet élément.");
    }
  };
  const renderPrepReportCardContentCopied = (rapport: RapportEnPreparation) => {
    const natureInfo = PREP_NATURE_OPTIONS_DASH.find(opt => opt.value === rapport.nature);
    const statusInfo = PREP_STATUT_OPTIONS_DASH.find(opt => opt.value === rapport.statut);
    return ( <> <h4 className="font-semibold text-gray-800 truncate text-[0.9rem]" title={rapport.titre}>{rapport.titre}</h4> <p className="text-xs text-gray-500 mt-0.5">{natureInfo?.label || rapport.nature}</p> <div className="flex items-center text-xs mt-1"> {statusInfo?.icon && cloneIconForDashboard(statusInfo.icon)} <span className={`${statusInfo?.colorClass || 'text-gray-700'} ml-1`}>{statusInfo?.label}</span> </div> <div className="flex items-center text-xs text-gray-500 mt-0.5"><CalendarDays size={12} className="mr-1 text-gray-400"/>Prévu: {new Date(rapport.datePrevue+"T00:00:00").toLocaleDateString('fr-FR')}</div> {rapport.responsable && <p className="text-xs text-gray-400 mt-0.5 truncate">Resp: {rapport.responsable}</p>} </> );
  };
  const renderCRCardContentCopied = (cr: CompteRendu) => {
    return ( <> <h4 className="font-semibold text-gray-800 truncate text-[0.9rem]" title={cr.titre}>{cr.titre}</h4> <p className="text-xs text-gray-500 mt-0.5 flex items-center"> {cloneIconForDashboard(getCompteRenduFileIcon(cr.fileType))} <span className="ml-1 truncate">{cr.fileName}</span> </p> <div className="flex items-center text-xs text-gray-600 mt-1"> <MessageSquare size={12} className="mr-1 text-gray-400" /> Rédigé par: {cr.agentName} </div> <div className="flex items-center text-xs text-gray-500 mt-0.5"> <CalendarDays size={12} className="mr-1 text-gray-400"/> Téléversé: {new Date(cr.uploadedAt+"T00:00:00").toLocaleDateString('fr-FR')} </div> {cr.fileDataUrl && cr.fileName && ( <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadItem(cr); }} className="mt-2 text-xs text-green-600 hover:text-green-800 flex items-center"> <Download size={12} className="mr-1" /> Télécharger </button> )} </> );
  };
  const renderEventCardContentCopied = (event: MissionAtelier) => {
    const typeInfo = EVENT_TYPE_OPTIONS_DASH.find(opt => opt.value === event.type);
    const statusInfo = EVENT_STATUS_OPTIONS_DASH.find(opt => opt.value === event.statut);
    return ( <> <h4 className="font-semibold text-gray-800 truncate text-[0.9rem]" title={event.titre}>{event.titre}</h4> <p className="text-xs text-gray-500 mt-0.5 flex items-center">{cloneIconForDashboard(typeInfo?.icon)}{typeInfo?.label}</p> <div className="flex items-center text-xs mt-1"> {statusInfo?.icon && cloneIconForDashboard(statusInfo.icon)} <span className={`${statusInfo?.colorClass || 'text-gray-700'} ml-1`}>{statusInfo?.label}</span> </div> <div className="flex items-center text-xs text-gray-500 mt-0.5"> <CalendarDays size={12} className="mr-1 text-gray-400"/> {new Date(event.dateDebut+"T00:00:00").toLocaleDateString('fr-FR')} {event.dateFin && <> - {new Date(event.dateFin+"T00:00:00").toLocaleDateString('fr-FR')}</>} </div> {event.responsables && <p className="text-xs text-gray-400 mt-0.5 truncate">Resp: {event.responsables}</p>} {event.lieu && <p className="text-xs text-gray-400 mt-0.5 flex items-center"><MissionMapPin size={12} className="mr-1"/> {event.lieu}</p>} </> );
  };
  const renderDocumentCardContentCopied = (doc: UsefulDocument) => {
    return ( <> <h4 className="font-semibold text-gray-800 truncate text-[0.9rem]" title={doc.titre}>{doc.titre}</h4> <p className="text-xs text-gray-500 mt-0.5 flex items-center"> {cloneIconForDashboard(getDocumentFileIcon(doc.fileType))} <span className="ml-1 truncate">{doc.fileName}</span> </p> <div className="flex items-center text-xs text-gray-600 mt-1"> <BookOpen size={12} className="mr-1 text-gray-400" /> Source: {doc.source || '-'} </div> <div className="flex items-center text-xs text-gray-500 mt-0.5"> <CalendarDays size={12} className="mr-1 text-gray-400"/> Téléversé: {new Date(doc.uploadedAt+"T00:00:00").toLocaleDateString('fr-FR')} </div> {doc.fileDataUrl && doc.fileName && ( <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadItem(doc); }} className="mt-2 text-xs text-green-600 hover:text-green-800 flex items-center"> <Download size={12} className="mr-1" /> Télécharger </button> )} </> );
  };
  const renderUploadedReportCardContent = (report: UploadedReport) => {
    return ( <> <h4 className="font-semibold text-gray-800 truncate text-[0.9rem]" title={report.titre}>{report.titre}</h4> <p className="text-xs text-gray-500 mt-0.5 flex items-center"> {cloneIconForDashboard(getReportFileIcon(report.fileType))} <span className="ml-1 truncate">{report.fileName}</span> </p> <div className="flex items-center text-xs text-gray-600 mt-1"> <ReportIconLucide size={12} className="mr-1 text-gray-400" /> {REPORT_PAGE_TITLES[report.reportTypeSpecific] || `Rapport (${report.reportTypeSpecific})`} </div> <div className="flex items-center text-xs text-gray-500 mt-0.5"> <CalendarDays size={12} className="mr-1 text-gray-400"/> Téléversé: {new Date(report.uploadedAt+"T00:00:00").toLocaleDateString('fr-FR')} </div> {report.agentName && <p className="text-xs text-gray-400 mt-0.5 truncate">Par: {report.agentName} ({report.agentPoste})</p>} {report.fileDataUrl && report.fileName && ( <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadItem(report); }} className="mt-2 text-xs text-green-600 hover:text-green-800 flex items-center"> <Download size={12} className="mr-1" /> Télécharger </button> )} </> );
  };
  const RecentItemCard: React.FC<{ item: any }> = ({ item }) => {
    let content;
    let borderColor = "border-gray-300"; 
    switch (item.itemType) {
      case 'rapport_prep': content = renderPrepReportCardContentCopied(item.originalData as RapportEnPreparation); borderColor = PREP_STATUT_OPTIONS_DASH.find(s => s.label === item.status)?.colorClass.replace('text-', 'border-').replace('bg-','border-') || borderColor; break;
      case 'compte_rendu': content = renderCRCardContentCopied(item.originalData as CompteRendu); borderColor = "border-orange-500"; break;
      case 'document_utile': content = renderDocumentCardContentCopied(item.originalData as UsefulDocument); borderColor = "border-sky-500"; break;
      case 'mission_atelier': content = renderEventCardContentCopied(item.originalData as MissionAtelier); borderColor = EVENT_STATUS_OPTIONS_DASH.find(s => s.label === item.status)?.colorClass.replace('text-', 'border-').replace('bg-','border-') || borderColor; break;
      case 'report_page': content = renderUploadedReportCardContent(item.originalData as UploadedReport); borderColor = "border-purple-500"; break;
      default: content = <div className="p-4 text-red-500">Type d'item inconnu: {item.itemType}</div>;
    }
    const itemIdToUse = item.originalData?.id || item.id;
    return <CardLink to={item.linkTo} item_id={itemIdToUse} borderColorClass={borderColor}>{content}</CardLink>;
  };

  useEffect(() => {
    setIsLoading(true);
    const parseData = <T,>(key: string): T[] => { 
        const data = localStorage.getItem(key); try { return data ? JSON.parse(data) : []; } catch (e) { console.error(`Erreur parsing key "${key}" Dashboard:`,e); return[]; }
    };
    const aujourdhui = new Date(); aujourdhui.setHours(0,0,0,0);
    const allPrepRapports = parseData<RapportEnPreparation>(MOCK_PREPA_KEY); 
    const allCR = parseData<CompteRendu>(MOCK_CR_KEY); 
    const allDocs = parseData<UsefulDocument>(MOCK_DOCS_KEY); 
    const allMissions = parseData<MissionAtelier>(MOCK_MISSIONS_KEY);
    const allUploadedReports: UploadedReport[] = []; 
    REPORT_PAGE_TYPES.forEach(type => { 
        const reportKey = `reports_data_${type}`; 
        const reportsForType = parseData<UploadedReport>(reportKey); 
        allUploadedReports.push(...reportsForType); 
    });
    const enCoursCount = allPrepRapports.filter(r => r.statut === 'elaboration').length; 
    const aVenirOuValidationCount = allPrepRapports.filter(r => r.statut === 'validation' || (r.statut === 'finalise' && new Date(r.datePrevue) >= aujourdhui)).length;
    const totauxCount = allPrepRapports.length + allCR.length + allDocs.length + allMissions.length + allUploadedReports.length; 
    setStats({ totaux: totauxCount, enCours: enCoursCount, aVenirOuValidation: aVenirOuValidationCount });
    let aggregatedRecentItems: any[] = [];
    allPrepRapports.forEach(r => aggregatedRecentItems.push({ itemType: 'rapport_prep', id: r.id, titre: r.titre, date: r.datePrevue, typeLabel: PREP_NATURE_OPTIONS_DASH.find(n => n.value === r.nature)?.label || r.nature, status: PREP_STATUT_OPTIONS_DASH.find(s => s.value === r.statut)?.label, statusColorClass: PREP_STATUT_OPTIONS_DASH.find(s => s.value === r.statut)?.colorClass || "bg-gray-100 text-gray-700", icon: <ReportIconLucide size={18} className="text-blue-600" />, linkTo: `/rapports/preparation`, originalData: r, }));
    allCR.forEach(cr => aggregatedRecentItems.push({ itemType: 'compte_rendu', id: cr.id, titre: cr.titre, date: cr.uploadedAt, typeLabel: "Compte Rendu", status: "Téléversé", statusColorClass: "bg-green-100 text-green-700", icon: getCompteRenduFileIcon(cr.fileType), linkTo: `/comptes-rendus`, originalData: cr, }));
    allDocs.forEach(doc => aggregatedRecentItems.push({ itemType: 'document_utile', id: doc.id, titre: doc.titre, date: doc.uploadedAt, typeLabel: "Document Utile", status: "Disponible", statusColorClass: "bg-gray-100 text-gray-700", icon: getDocumentFileIcon(doc.fileType), linkTo: `/documents`, originalData: doc, }));
    allMissions.forEach(event => aggregatedRecentItems.push({ itemType: 'mission_atelier', id: event.id, titre: event.titre, date: event.dateDebut, typeLabel: EVENT_TYPE_OPTIONS_DASH.find(opt => opt.value === event.type)?.label || event.type, status: EVENT_STATUS_OPTIONS_DASH.find(opt => opt.value === event.statut)?.label, statusColorClass: EVENT_STATUS_OPTIONS_DASH.find(opt => opt.value === event.statut)?.colorClass || "bg-gray-100 text-gray-700", icon: EVENT_TYPE_OPTIONS_DASH.find(opt => opt.value === event.type)?.icon || <CalendarDays size={18}/>, linkTo: `/agenda-dsefs`, originalData: event, }));
    allUploadedReports.forEach(rep => aggregatedRecentItems.push({ itemType: 'report_page', id: rep.id, titre: rep.titre, date: rep.uploadedAt, typeLabel: REPORT_PAGE_TITLES[rep.reportTypeSpecific] || `Rapport (${rep.reportTypeSpecific})`, status: "Finalisé", statusColorClass: "bg-blue-100 text-blue-700", icon: getReportFileIcon(rep.fileType), linkTo: `/rapports/${rep.reportTypeSpecific}`, originalData: rep, }));
    aggregatedRecentItems.sort((a, b) => { const dateA = new Date(a.date).getTime(); const dateB = new Date(b.date).getTime(); if (isNaN(dateA) && isNaN(dateB)) return 0; if (isNaN(dateA)) return 1; if (isNaN(dateB)) return -1; return dateB - dateA; });
    setAllRecentItems(aggregatedRecentItems);
    const storedGalleryImages = localStorage.getItem(DASHBOARD_GALLERY_IMAGES_KEY);
    if (storedGalleryImages) {
        try { const parsedImages = JSON.parse(storedGalleryImages) as DashboardGalleryImage[]; setGalleryImages(parsedImages.sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
        } catch (e) { console.error("Erreur chargement images galerie dashboard:", e); }
    }
    setIsLoading(false);
  }, [dataVersion, notifyDataChange]); // Ajout de notifyDataChange si elle est utilisée pour rafraîchir

  const displayedRecentItems = useMemo(() => { 
      if (activeActivityFilter === 'all') return allRecentItems.slice(0, 9);
      if (activeActivityFilter === 'rapport_prep') return allRecentItems.filter(item => item.itemType === 'rapport_prep').slice(0,12);
      return allRecentItems.filter(item => item.itemType === activeActivityFilter).slice(0,12);
  }, [allRecentItems, activeActivityFilter]);
  const canEditGallery = currentUser?.role === 'admin' || currentUser?.role === 'editeur';
  
  const saveGalleryImagesToStorage = (updatedImages: DashboardGalleryImage[]) => { 
    try {
      const sortedImages = [...updatedImages].sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      localStorage.setItem(DASHBOARD_GALLERY_IMAGES_KEY, JSON.stringify(sortedImages)); 
      setGalleryImages(sortedImages); 
      notifyDataChange();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des images dans localStorage:", error);
      throw new Error("STORAGE_ERROR");
    }
   };
  const resetGalleryModalForm = () => { 
    setSelectedGalleryImageFile(null); 
    setCurrentImageForModal({ agentName: '' }); 
    if (galleryImageFileInputRef.current) galleryImageFileInputRef.current.value = "";
  };
  const handleOpenGalleryModalForCreate = () => { 
    if (!canEditGallery) { toast.warn("Permissions insuffisantes."); return; } 
    setEditingGalleryImageId(null); 
    resetGalleryModalForm(); 
    setShowGalleryModal(true);
  };
  const handleOpenGalleryModalForEdit = (image: DashboardGalleryImage) => { 
    if (!canEditGallery) { toast.warn("Permissions insuffisantes."); return; } 
    setEditingGalleryImageId(image.id); 
    setCurrentImageForModal({ 
        titre: image.titre, 
        description: image.description, 
        imageUrl: image.imageUrl,
        agentName: image.uploadedByUserName || '' 
    }); 
    setSelectedGalleryImageFile(null); 
    if (galleryImageFileInputRef.current) galleryImageFileInputRef.current.value = ""; 
    setShowGalleryModal(true);
  };
  const handleCloseGalleryModal = () => { 
    setShowGalleryModal(false); setEditingGalleryImageId(null); resetGalleryModalForm();
  };
  const handleGalleryImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { 
    if (event.target.files && event.target.files[0]) { const file = event.target.files[0]; if (!file.type.startsWith('image/')) { toast.error("Veuillez sélectionner un fichier image (JPEG, PNG, GIF, WEBP)."); setSelectedGalleryImageFile(null); if (galleryImageFileInputRef.current) galleryImageFileInputRef.current.value = ""; return; } setSelectedGalleryImageFile(file); const reader = new FileReader(); reader.onloadend = () => { setCurrentImageForModal(prev => ({...prev, imageUrl: reader.result as string })); }; reader.readAsDataURL(file); } else { setSelectedGalleryImageFile(null); }
  };
  const readFileAsDataURL = (file: File): Promise<string> => new Promise((resolve, reject) => { 
    const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = error => reject(error); reader.readAsDataURL(file);
  });
  const handleSubmitGalleryImage = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!currentUser) {
        toast.error("Utilisateur non identifié.");
        return;
    }
    if (!currentImageForModal.titre || currentImageForModal.titre.trim() === "") {
        toast.warn("Le titre de l'image est obligatoire.");
        return;
    }
    setIsSubmittingGalleryImage(true); 
    try { 
      let finalImageUrl = editingGalleryImageId ? currentImageForModal.imageUrl : undefined; 
      if (selectedGalleryImageFile) { 
        finalImageUrl = await readFileAsDataURL(selectedGalleryImageFile); 
      } else if (!editingGalleryImageId) { 
        toast.warn("Veuillez sélectionner une image.");
        setIsSubmittingGalleryImage(false);
        return; 
      }
      if (!finalImageUrl) {
        toast.error("Les données de l'image sont manquantes.");
        setIsSubmittingGalleryImage(false);
        return;
      }
      const agentNameToSave = currentImageForModal.agentName?.trim() 
                              ? currentImageForModal.agentName.trim() 
                              : `${currentUser.prenom} ${currentUser.nom}`.trim();

      const imageDataToSave: Omit<DashboardGalleryImage, 'id'> = { 
        imageUrl: finalImageUrl, 
        titre: currentImageForModal.titre.trim(), 
        description: currentImageForModal.description?.trim() || '', 
        uploadedAt: editingGalleryImageId 
            ? (galleryImages.find(img => img.id === editingGalleryImageId)?.uploadedAt || new Date().toISOString()) 
            : new Date().toISOString(),
        uploadedByUserId: currentUser.id, 
        uploadedByUserName: agentNameToSave,
      }; 
      let updatedImages: DashboardGalleryImage[]; 
      if (editingGalleryImageId) { 
        updatedImages = galleryImages.map(img => 
          img.id === editingGalleryImageId 
            ? { ...img, ...imageDataToSave, id: editingGalleryImageId } 
            : img 
        ); 
      } else { 
        const newImage: DashboardGalleryImage = { 
          id: `dash_gallery_img_${Date.now()}`, 
          ...imageDataToSave 
        }; 
        updatedImages = [newImage, ...galleryImages]; 
      } 
      saveGalleryImagesToStorage(updatedImages);
      toast.success(editingGalleryImageId ? "Image de la vitrine mise à jour !" : "Nouvelle image ajoutée à la vitrine !");
      handleCloseGalleryModal(); 
    } catch (error) { 
      console.error("Erreur soumission image galerie:", error); 
      if (error instanceof Error && error.message === "STORAGE_ERROR") {
          toast.error("Erreur lors de la sauvegarde de l'image. Veuillez vérifier l'espace de stockage.");
      } else {
          toast.error("Erreur lors du traitement de l'image. Veuillez réessayer.");
      }
    } finally { 
      setIsSubmittingGalleryImage(false); 
    }
  };
  const handleDeleteGalleryImage = (imageId: string) => { 
    if (!canEditGallery) { toast.warn("Permissions insuffisantes."); return; } 
    const imageToDelete = galleryImages.find(img => img.id === imageId); 
    if (!imageToDelete) return; 
    toast( ({closeToast}) => ( 
        <div className="p-1"> 
            <p className="font-semibold mb-2">Supprimer cette image ?</p> 
            <p className="text-sm my-1">Titre: {imageToDelete.titre}</p> 
            <div className="flex justify-end space-x-2 mt-3"> 
                <button className="px-3 py-1.5 text-sm bg-gray-200 rounded hover:bg-gray-300" onClick={closeToast}>Annuler</button> 
                <button 
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700" 
                    onClick={() => { 
                        const newImages = galleryImages.filter(img => img.id !== imageId);
                        saveGalleryImagesToStorage(newImages); 
                        if (currentGalleryIndex >= newImages.length && newImages.length > 0) {
                            setCurrentGalleryIndex(newImages.length - 1);
                        } else if (newImages.length === 0) {
                            setCurrentGalleryIndex(0);
                        }
                        toast.info("Image supprimée."); 
                        closeToast?.(); 
                    }} 
                >Supprimer</button> 
            </div> 
        </div> 
    ), { autoClose: false, closeButton: true });
  };
  const handleOpenLightbox = (image: DashboardGalleryImage) => { setLightboxImage(image); };
  const nextGallerySlide = () => { 
    setCurrentGalleryIndex(prevIndex => (prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1)); 
  };
  const prevGallerySlide = () => { 
    setCurrentGalleryIndex(prevIndex => (prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1)); 
  };

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500 text-lg"><Loader className="animate-spin inline mr-2" />Chargement du Tableau de Bord...</div>;
  }

  const currentGalleryImage = galleryImages[currentGalleryIndex];

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-slate-100 to-sky-100 min-h-[calc(100vh-160px)]">
      <div className="mb-12 text-center">
        <div className="inline-block border-2 border-green-600 px-6 py-4 rounded-lg shadow-xl bg-white hover:shadow-green-300/50 transition-all duration-300 transform hover:scale-105">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold italic text-green-700 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span className="flex items-center"><ClipboardList size={32} className="text-green-600 mr-2" />Gestion,</span>
            <span className="flex items-center"><BarChartBig size={32} className="text-green-600 mr-2" />Suivi-Évaluation</span>
            <span className="flex items-center"><span className="text-3xl md:text-4xl">&</span> <Share2 size={32} className="text-green-600 ml-2 mr-2" />Diffusion</span>
          </h1>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <StatCard title="Éléments Totaux Gérés" value={stats.totaux} icon={<BarChartBig size={24}/>} colorClass="border-blue-500"/>
        <StatCard title="Rapports en Cours d'Élaboration" value={stats.enCours} icon={<Clock size={24}/>} colorClass="border-yellow-500"/>
        <StatCard title="Rapports à Venir / En Validation" value={stats.aVenirOuValidation} icon={<CalendarCheck2 size={24} />} colorClass="border-green-500"/>
      </div>

      <div className="mb-12 bg-white p-6 rounded-xl shadow-xl border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-3 border-b border-gray-300 flex-wrap">
          <h3 className="text-2xl font-semibold text-gray-900 mb-3 sm:mb-0 mr-0 sm:mr-4">Activités Récentes</h3>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5 sm:gap-2 bg-gray-100 p-1 rounded-lg shadow-sm">
            {activityFilters.map(filter => (
              <button key={filter.value} onClick={() => setActiveActivityFilter(filter.value)} title={filter.label} 
                      className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md flex items-center space-x-1.5 sm:space-x-2 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 
                                ${activeActivityFilter === filter.value 
                                  ? 'bg-green-600 text-white shadow-sm focus:ring-green-400' 
                                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 border border-gray-300 focus:ring-gray-400'
                                }`}>
                {React.cloneElement(filter.icon, { size: 14, className: "sm:size-4" })}
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>
        {displayedRecentItems.length > 0 ? ( 
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"> 
              {displayedRecentItems.map(item => <RecentItemCard key={`${item.itemType}-${item.originalData?.id || item.id}`} item={item} />)} 
            </div> 
          ) : ( 
            <div className="p-10 text-center text-gray-500"> 
              <ListFilter size={48} className="mx-auto mb-4 text-gray-300" /> 
              <p className="text-lg"> 
                {activeActivityFilter === 'all' ? "Aucune activité récente à afficher." : `Aucune activité de type "${activityFilters.find(f => f.value === activeActivityFilter)?.label}" récente.`}
              </p> 
            </div> 
        )}
      </div>

      <div className="mt-12 bg-white p-6 rounded-xl shadow-xl border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-3 border-b border-gray-300">
          <h3 className="text-2xl font-semibold text-slate-800 mb-4 sm:mb-0"> Vitrine <span className="text-green-600">DEFCCS</span> en Images </h3>
          {canEditGallery && ( <button onClick={handleOpenGalleryModalForCreate} className="flex items-center px-4 py-2.5 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 transition-colors duration-150 ease-in-out"> <ImagePlus size={20} className="mr-2" /> Ajouter une Image </button> )}
        </div>
        {galleryImages.length === 0 ? ( 
            <div className="text-center py-12 text-gray-500 bg-slate-50 rounded-lg border-2 border-dashed border-gray-300"> 
                <ImagePlus size={52} className="mx-auto mb-4 text-gray-300" /> 
                <p className="text-lg">La vitrine est actuellement vide.</p> 
                {canEditGallery && <p className="text-sm mt-1">Cliquez sur "Ajouter une Image" pour commencer.</p>} 
            </div>
        ) : (
          <div className="relative bg-white p-0 md:p-4 rounded-lg shadow-inner">
            <div className="overflow-hidden relative h-[350px] sm:h-[400px] md:h-[500px] rounded-md bg-gray-100 group">
              {galleryImages.map((image, index) => ( 
                <div 
                  key={image.id} 
                  className={`absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center justify-center ${index === currentGalleryIndex ? 'opacity-100 z-10' : 'opacity-0'}`}
                  onClick={() => handleOpenLightbox(image)}
                > 
                  <img 
                    src={image.imageUrl} 
                    alt={image.titre} 
                    className="max-w-full max-h-full object-contain cursor-pointer"
                  /> 
                </div> 
              ))}
              {canEditGallery && currentGalleryImage && ( 
                <div className="absolute top-3 right-3 z-20 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"> 
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenGalleryModalForEdit(currentGalleryImage); }} 
                    className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-md" 
                    title="Modifier l'image">
                    <Edit3 size={18}/>
                  </button> 
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteGalleryImage(currentGalleryImage.id); }} 
                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md" 
                    title="Supprimer l'image">
                    <Trash2 size={18}/>
                  </button> 
                </div> 
              )}
            </div>
            {galleryImages.length > 1 && ( 
              <>
                <button 
                  onClick={prevGallerySlide} 
                  className="absolute top-1/2 left-1 md:left-3 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2.5 rounded-full hover:bg-opacity-50 z-20 focus:outline-none transition-all hover:scale-110"
                  title="Précédent"> 
                  <ChevronLeft size={28} />
                </button> 
                <button 
                  onClick={nextGallerySlide} 
                  className="absolute top-1/2 right-1 md:right-3 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2.5 rounded-full hover:bg-opacity-50 z-20 focus:outline-none transition-all hover:scale-110"
                  title="Suivant"> 
                  <ChevronRight size={28} />
                </button>
              </>
            )}
            {currentGalleryImage && (
                <div className="mt-4 p-3 bg-gray-50 rounded-b-md border-t border-gray-200">
                    <h4 className="text-md font-semibold text-gray-800 truncate mb-1" title={currentGalleryImage.titre}>
                        {currentGalleryImage.titre}
                    </h4>
                    {currentGalleryImage.description && ( 
                        <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">
                            {currentGalleryImage.description}
                        </p> 
                    )}
                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-2 gap-y-1 items-center">
                        <span className="flex items-center"><ReportIconLucide size={12} className="mr-1"/> Fichier : <span className="font-medium ml-1 truncate max-w-[150px] sm:max-w-xs" title={currentGalleryImage.titre}>{currentGalleryImage.titre}</span></span>
                        <span className="flex items-center"><CalendarDays size={12} className="mr-1"/> Ajouté le : <span className="font-medium ml-1">{new Date(currentGalleryImage.uploadedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>
                        {currentGalleryImage.uploadedByUserName && <span className="flex items-center"><UserIcon size={12} className="mr-1"/> Par : <span className="font-medium ml-1">{currentGalleryImage.uploadedByUserName}</span></span>}
                    </div>
                </div>
            )}
          </div>
        )}
      </div>

      {showGalleryModal && canEditGallery && ( 
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"> 
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all opacity-100 scale-100"> 
                <div className="flex items-center justify-between p-5 border-b border-gray-200"> 
                    <h3 className="text-lg font-semibold text-gray-800"> {editingGalleryImageId ? "Modifier l'Image" : "Ajouter à la Vitrine"} </h3> 
                    <button onClick={handleCloseGalleryModal} className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"> <XCircle size={24}/> </button> 
                </div> 
                <form onSubmit={handleSubmitGalleryImage} className="p-5 space-y-4"> 
                    <div> 
                        <label htmlFor="galleryImageFile" className="block text-sm font-medium text-gray-700 mb-1"> Fichier Image {(!editingGalleryImageId || selectedGalleryImageFile) && <span className="text-red-500">*</span>} </label> 
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors"> 
                            <div className="space-y-1 text-center"> 
                                {(currentImageForModal.imageUrl && !selectedGalleryImageFile && editingGalleryImageId ) ? (<img src={galleryImages.find(img=>img.id === editingGalleryImageId)?.imageUrl} alt="Prévisualisation actuelle" className="mx-auto h-24 w-auto rounded mb-2"/>) : (selectedGalleryImageFile && currentImageForModal.imageUrl) ? (<img src={currentImageForModal.imageUrl} alt="Nouvelle prévisualisation" className="mx-auto h-24 w-auto rounded mb-2"/>) : (<UploadCloud className="mx-auto h-12 w-12 text-gray-400" />)} 
                                <div className="flex text-sm text-gray-600"> 
                                    <label htmlFor="galleryImageFile_input" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"> 
                                        <span>Téléversez un fichier</span> 
                                        <input id="galleryImageFile_input" name="galleryImageFile" type="file" className="sr-only" ref={galleryImageFileInputRef} onChange={handleGalleryImageFileChange} accept="image/*"/> 
                                    </label> 
                                    <p className="pl-1">ou glissez-déposez</p> 
                                </div> 
                                <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP</p> 
                                {selectedGalleryImageFile && <p className="text-xs text-green-600 mt-1">Fichier sélectionné: {selectedGalleryImageFile.name}</p>} 
                                {!selectedGalleryImageFile && editingGalleryImageId && galleryImages.find(i=>i.id===editingGalleryImageId)?.titre && (<p className="text-xs text-gray-500 mt-1">Image actuelle: {galleryImages.find(i=>i.id===editingGalleryImageId)?.titre || "Image sans titre"}</p>)} 
                            </div> 
                        </div> 
                    </div> 
                    <div> 
                        <label htmlFor="galleryImageTitle" className="block text-sm font-medium text-gray-700 mb-1">Titre <span className="text-red-500">*</span></label> 
                        <input type="text" id="galleryImageTitle" value={currentImageForModal.titre || ''} onChange={(e) => setCurrentImageForModal(prev => ({...prev, titre: e.target.value}))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Ex: Cérémonie de reboisement"/> 
                    </div> 
                    <div> 
                        <label htmlFor="galleryImageAgentName" className="block text-sm font-medium text-gray-700 mb-1">Nom de l'agent</label> 
                        <div className="relative mt-1"> 
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" /> </div> 
                            <input 
                                type="text" 
                                id="galleryImageAgentName" 
                                value={currentImageForModal.agentName || ''} 
                                onChange={(e) => setCurrentImageForModal(prev => ({...prev, agentName: e.target.value}))} 
                                className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                placeholder="Exp : Pape Madior Diouf"/> 
                        </div> 
                    </div>
                    <div> 
                        <label htmlFor="galleryImageDescription" className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label> 
                        <textarea id="galleryImageDescription" value={currentImageForModal.description || ''} onChange={(e) => setCurrentImageForModal(prev => ({...prev, description: e.target.value}))} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Brève description..."/> 
                    </div> 
                    <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3"> 
                        <button type="button" onClick={handleCloseGalleryModal} disabled={isSubmittingGalleryImage} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300 font-medium">Annuler</button> 
                        <button type="submit" disabled={isSubmittingGalleryImage} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center font-semibold"> 
                            {isSubmittingGalleryImage ? <Loader className="animate-spin mr-2" size={18}/> : <Save size={18} className="mr-2"/>} 
                            {isSubmittingGalleryImage ? 'Traitement...' : (editingGalleryImageId ? 'Sauvegarder' : 'Ajouter')} 
                        </button> 
                    </div> 
                </form> 
            </div> 
        </div> 
      )}
      
      {lightboxImage && ( 
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn" onClick={() => setLightboxImage(null)}> 
            <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}> 
                <img src={lightboxImage.imageUrl} alt={lightboxImage.titre} className="block max-w-full max-h-[85vh] object-contain"/> 
                <button onClick={() => setLightboxImage(null)} className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors" title="Fermer"> <XCircle size={28}/> </button> 
                {(lightboxImage.titre || lightboxImage.description) && ( 
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white"> 
                        {lightboxImage.titre && <h4 className="text-lg font-bold">{lightboxImage.titre}</h4>} 
                        {lightboxImage.description && <p className="text-sm mt-1">{lightboxImage.description}</p>} 
                    </div> 
                )} 
            </div> 
        </div> 
      )}
    </div>
  );
};

export default Dashboard;