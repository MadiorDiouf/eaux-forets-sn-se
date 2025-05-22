// src/components/ReportPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'react-toastify';
import {
  Info,
  UploadCloud,
  Download,
  FileText,
  Edit2,
  Trash2,
  XCircle,
  Save,
  Loader2 as Loader,
  PlusCircle,
  FileSpreadsheet,
  FileAudio,
  FileVideo,
  FileImage,
  Archive as FileArchive
} from 'lucide-react';

interface UploadedReport {
  id: string;
  titre: string;
  fileName: string;
  fileType: string;
  reportTypeSpecific: string;
  uploadedAt: string;
  agentName: string;
  agentPoste: string;
  source: string;
  commentaire?: string;
  fileDataUrl?: string;
}

const MOCK_REPORTS_DATA: { [key: string]: UploadedReport[] } = {
  ptba: [
    { id: '1', titre: 'PTBA Final 2023', fileName: 'PTBA_2023_final.pdf', fileType: 'pdf', reportTypeSpecific: 'ptba', uploadedAt: '2024-07-15', agentName: 'Amina Diop', agentPoste: 'Chef de projet', source: 'Direction Générale', commentaire: 'Version finale approuvée par la direction.' },
  ],
  performances: [
    { id: '3', titre: 'Rapport Perf. Juin', fileName: 'Perf_Rapport_Juin.xlsx', fileType: 'xlsx', reportTypeSpecific: 'performances', uploadedAt: '2024-07-01', agentName: 'Fatou Sarr', agentPoste: 'Coordinatrice', source: 'Département Opérations', commentaire: 'Chiffres consolidés pour le mois de juin.' },
  ],
  annuels: [],
  trimestriels: [],
};

const REPORT_PAGE_TITLES: { [key: string]: string } = {
  ptba: 'Plan de Travail et Budget Annuel',
  performances: 'Rapports de Performances',
  annuels: 'Rapports Annuels',
  trimestriels: 'Rapports Trimestriels',
};

export const getFileIcon = (fileTypeOrName: string, size: number = 20, colorClass?: string): JSX.Element => {
  const extension = fileTypeOrName?.includes('.') ? fileTypeOrName.split('.').pop()?.toLowerCase() : fileTypeOrName?.toLowerCase();
  const baseClasses = colorClass || "text-gray-500";
  if (extension === 'pdf') return <FileText size={size} className={colorClass || "text-red-500"} />;
  if (['doc', 'docx'].includes(extension || '')) return <FileText size={size} className={colorClass || "text-blue-500"} />;
  if (['xls', 'xlsx'].includes(extension || '')) return <FileSpreadsheet size={size} className={colorClass || "text-green-500"} />;
  if (['ppt', 'pptx'].includes(extension || '')) return <FileText size={size} className={colorClass || "text-orange-500"} />;
  if (['zip', 'rar', 'tar', 'gz'].includes(extension || '')) return <FileArchive size={size} className={colorClass || "text-yellow-500"} />;
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension || '')) return <FileImage size={size} className={baseClasses} />;
  if (['mp3', 'wav', 'ogg'].includes(extension || '')) return <FileAudio size={size} className={baseClasses} />;
  if (['mp4', 'mov', 'avi', 'webm'].includes(extension || '')) return <FileVideo size={size} className={baseClasses} />;
  return <FileText size={size} className={baseClasses} />;
};

const ReportRowSkeleton: React.FC = () => (
    <tr className="animate-pulse">
      <td className="px-4 py-4 whitespace-nowrap"><div className="h-6 w-6 bg-gray-300 rounded"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-300 rounded w-3/4"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-300 rounded w-full"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-300 rounded w-2/3"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-300 rounded w-1/2"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-300 rounded w-1/3"></div></td>
      <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
        <div className="inline-block h-8 w-8 bg-gray-300 rounded-full"></div>
        <div className="inline-block h-8 w-8 bg-gray-300 rounded-full"></div>
        <div className="inline-block h-8 w-8 bg-gray-300 rounded-full"></div>
      </td>
    </tr>
);

const ReportPage: React.FC = () => {
  const auth = useAuth();
  const { notifyDataChange } = useData();
  const navigate = useNavigate();

  const userRole = auth.currentUser?.role;
  const canUploadAndEdit = userRole === 'admin' || userRole === 'editeur';
  const canDelete = userRole === 'admin';

  const { reportType } = useParams<{ reportType: string }>();

  const [titre, setTitre] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [agentName, setAgentName] = useState(auth.currentUser ? `${auth.currentUser.prenom} ${auth.currentUser.nom}`.trim() : '');
  const [agentPoste, setAgentPoste] = useState('');
  const [source, setSource] = useState('');
  const [commentaire, setCommentaire] = useState('');

  const [uploadedReports, setUploadedReports] = useState<UploadedReport[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingReport, setEditingReport] = useState<UploadedReport | null>(null);

  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const pageTitle = reportType ? REPORT_PAGE_TITLES[reportType] || `Rapports (${reportType})` : 'Gestion des Rapports';
  const MOCK_REPORTS_KEY = reportType ? `reports_data_${reportType}` : 'reports_data_unknown_type';

  useEffect(() => {
    if (reportType && !REPORT_PAGE_TITLES[reportType]) {
      if (reportType === 'projets-defccs') {
        navigate('/rapports/projets-defccs', { replace: true });
        return;
      }
    }

    setIsLoadingInitial(true);
    if (reportType && MOCK_REPORTS_KEY !== 'reports_data_unknown_type' && MOCK_REPORTS_DATA[reportType]) {
      setTimeout(() => {
        const storedData = localStorage.getItem(MOCK_REPORTS_KEY);
        let dataToSet: UploadedReport[];
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData) as UploadedReport[];
            dataToSet = parsedData.map(rep => ({
              ...rep,
              titre: rep.titre || "Sans titre",
              fileName: rep.fileName || "fichier.inconnu",
              fileType: rep.fileType || rep.fileName?.split('.').pop()?.toLowerCase() || 'unknown',
              reportTypeSpecific: rep.reportTypeSpecific || reportType,
              agentName: rep.agentName || "N/A",
              agentPoste: rep.agentPoste || "N/A",
              source: rep.source || "N/A",
              uploadedAt: rep.uploadedAt || new Date().toISOString().split('T')[0]
            })).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          } catch (e) {
            console.error(`[ReportPage] Erreur parsing données pour ${reportType}:`, e);
            dataToSet = (MOCK_REPORTS_DATA[reportType] || []).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          }
        } else {
          dataToSet = (MOCK_REPORTS_DATA[reportType] || []).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          if (dataToSet.length > 0) {
            localStorage.setItem(MOCK_REPORTS_KEY, JSON.stringify(dataToSet));
          }
        }
        setUploadedReports(dataToSet);
        setIsLoadingInitial(false);
      }, 500);
    } else {
      setUploadedReports([]);
      setIsLoadingInitial(false);
      if (reportType && MOCK_REPORTS_KEY !== 'reports_data_unknown_type') {
        console.warn(`Aucune donnée MOCK ou clé de stockage définie pour le type de rapport: ${reportType}`);
      }
    }
  }, [reportType, MOCK_REPORTS_KEY, navigate]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const resetFormFields = () => {
    setTitre('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setAgentName(auth.currentUser ? `${auth.currentUser.prenom} ${auth.currentUser.nom}`.trim() : '');
    setAgentPoste('');
    setSource('');
    setCommentaire('');
    setEditingReport(null);
  };

  const handleOpenFormForCreate = () => {
    if (!canUploadAndEdit) {
      toast.warn("Permission refusée.");
      return;
    }
    resetFormFields();
    setShowForm(true);
  };

  const handleCloseForm = () => {
    resetFormFields();
    setShowForm(false);
  };

  const readFileAsDataURL = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => { console.error("FileReader Error:", e); reject(reader.error) };
    reader.readAsDataURL(f);
  });

  const handleSubmit = async (event: React.FormEvent) => {
    if (!canUploadAndEdit) {
      toast.error("Action non autorisée.");
      return;
    }
    event.preventDefault();
    if ((!file && !editingReport) || !titre || !agentName || !source) {
      toast.warn('Veuillez remplir tous les champs obligatoires (Titre, Nom Agent, Source, Fichier).');
      return;
    }
    if (!reportType) {
      toast.error("Type de rapport non défini.");
      return;
    }

    setIsSubmitting(true);
    try {
      let fileDataUrlToSave = editingReport?.fileDataUrl,
          fileNameToSave = editingReport?.fileName || '',
          fileTypeToSave = editingReport?.fileType || 'unknown';

      if (file) {
        fileDataUrlToSave = await readFileAsDataURL(file);
        fileNameToSave = file.name;
        fileTypeToSave = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      }

      const reportDataPayload = {
        titre,
        fileName: fileNameToSave,
        fileType: fileTypeToSave,
        agentName,
        agentPoste, // Inclus même si vide
        source,
        commentaire,
        fileDataUrl: fileDataUrlToSave,
      };

      let updatedReportsList: UploadedReport[], successMessage: string;

      if (editingReport) {
        const updatedReport: UploadedReport = { ...editingReport, ...reportDataPayload };
        updatedReportsList = uploadedReports.map(r => r.id === editingReport.id ? updatedReport : r);
        successMessage = "Rapport modifié avec succès !";
      } else {
        const newReport: UploadedReport = {
          id: String(Date.now()),
          ...reportDataPayload,
          reportTypeSpecific: reportType,
          uploadedAt: new Date().toISOString().split('T')[0],
        };
        updatedReportsList = [newReport, ...uploadedReports];
        successMessage = "Rapport téléversé avec succès !";
      }

      updatedReportsList.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setUploadedReports(updatedReportsList);
      localStorage.setItem(MOCK_REPORTS_KEY, JSON.stringify(updatedReportsList));
      notifyDataChange();
      toast.success(successMessage);
      handleCloseForm();
    } catch (error: any) {
      console.error("Erreur handleSubmit (ReportPage):", error);
      let errMsg = "Erreur lors du traitement du fichier.";
      if (error.name === 'QuotaExceededError' || error.message?.toLowerCase().includes('quota')) {
        errMsg = "ERREUR : L'espace de stockage local est plein. Impossible de sauvegarder le fichier.";
      } else if (error instanceof Error) {
        errMsg += ` Détail: ${error.message}`;
      }
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReport = (report: UploadedReport) => {
    if (!canUploadAndEdit) {
      toast.error("Action non autorisée.");
      return;
    }
    setEditingReport(report);
    setTitre(report.titre);
    setAgentName(report.agentName);
    setAgentPoste(report.agentPoste);
    setSource(report.source);
    setCommentaire(report.commentaire || '');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteReport = (reportId: string) => {
    if (!canDelete) {
      toast.error("Suppression non autorisée.");
      return;
    }
    toast(
      ({ closeToast }) => (
        <div className="p-2">
          <p className="mb-3 font-semibold text-gray-700">Voulez-vous vraiment supprimer ce rapport ?</p>
          <p className="mb-4 text-sm text-gray-600">Cette action est irréversible.</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                const updatedReports = uploadedReports.filter(r => r.id !== reportId)
                  .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
                setUploadedReports(updatedReports);
                localStorage.setItem(MOCK_REPORTS_KEY, JSON.stringify(updatedReports));
                notifyDataChange();
                toast.success("Rapport supprimé avec succès.");
                closeToast?.();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
            >
              Oui, supprimer
            </button>
            <button onClick={closeToast} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium">
              Annuler
            </button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false, draggable: false, closeButton: XCircle }
    );
  };

  const handleDownloadFile = (report: UploadedReport) => {
    if (report.fileDataUrl && report.fileName) {
      const l = document.createElement('a');
      l.href = report.fileDataUrl;
      l.download = report.fileName;
      document.body.appendChild(l);
      l.click();
      document.body.removeChild(l);
    } else {
      toast.warn("Données de fichier non disponibles pour le téléchargement.");
    }
  };

  const handleMouseEnterComment = (comment: string | undefined, event: React.MouseEvent<HTMLElement>) => {
    if (comment) {
      const r = event.currentTarget.getBoundingClientRect();
      setTooltipContent(comment);
      setTooltipPosition({ top: r.bottom + window.scrollY + 5, left: r.left + window.scrollX + (r.width / 2) });
      setTooltipVisible(true);
    }
  };
  const handleMouseLeaveComment = () => setTooltipVisible(false);

  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const fileInputStyle = "mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50";

  const renderReportTableSkeletons = (count = 5) => (
    <div className="bg-white p-6 rounded-lg shadow-md relative">
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-6 animate-pulse"></div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {["Icône", "Titre", "Nom Fichier", "Agent (Poste)", "Source", "Téléversé le", "Actions"].map((h, i) => (
                <th key={i} scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${h === "Actions" ? "text-center" : ""}`}>
                  <div className={`h-4 bg-gray-300 rounded ${h.length > 10 ? "w-full" : "w-3/4"}`}></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(count)].map((_, index) => <ReportRowSkeleton key={index} />)}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (reportType && !REPORT_PAGE_TITLES[reportType] && reportType !== 'projets-defccs' && !isLoadingInitial) {
    return (
      <div className="container mx-auto p-6 text-center mt-10">
        <h1 className="text-3xl font-bold text-orange-500">Type de Rapport Inconnu</h1>
        <p className="text-lg text-gray-600 mt-3">
          Le type de rapport demandé (<code>{reportType}</code>) n'est pas géré ou n'existe pas.
        </p>
        <button onClick={() => navigate('/')} className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  if (isLoadingInitial && !showForm) {
    return (
      <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div className="h-9 bg-gray-300 rounded w-1/2 animate-pulse"></div>
          {canUploadAndEdit && <div className="h-10 w-40 bg-gray-300 rounded-lg animate-pulse"></div>}
        </div>
        {renderReportTableSkeletons(5)}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">{pageTitle}</h1>
        {canUploadAndEdit && !showForm && (
          <button
            onClick={handleOpenFormForCreate}
            className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md inline-flex items-center transition-colors duration-150"
          >
            <PlusCircle size={20} className="mr-2" /> Ajouter un Rapport
          </button>
        )}
      </div>

      {/* Formulaire d'ajout/modification */}
      {canUploadAndEdit && showForm && (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl mb-10 border border-gray-200">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <UploadCloud size={24} className="mr-3 text-blue-600" /> {editingReport ? 'Modifier le Rapport' : 'Nouveau Rapport'}
            </h2>
            <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
              <XCircle size={28} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="titre-report" className={labelStyle}>Titre du rapport <span className="text-red-500">*</span></label>
              <input type="text" id="titre-report" value={titre} onChange={(e) => setTitre(e.target.value)} required className={inputStyle} placeholder="Ex: Rapport d'activité mensuel - Juillet 2024"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="agentName-report" className={labelStyle}>Nom de l'agent <span className="text-red-500">*</span></label>
                <input type="text" id="agentName-report" value={agentName} onChange={(e)=>setAgentName(e.target.value)} required className={inputStyle} placeholder="Prénom Nom"/>
              </div>
              <div>
                <label htmlFor="agentPoste-report" className={labelStyle}>Poste de l'agent</label>
                <input type="text" id="agentPoste-report" value={agentPoste} onChange={(e)=>setAgentPoste(e.target.value)} className={inputStyle} placeholder="Ex: Chef de projet"/>
              </div>
            </div>
            <div>
              <label htmlFor="source-report" className={labelStyle}>Source du rapport <span className="text-red-500">*</span></label>
              <input type="text" id="source-report" value={source} onChange={(e) => setSource(e.target.value)} required className={inputStyle} placeholder="Ex: Direction Générale, Réunion d'équipe"/>
            </div>
            <div>
              <label htmlFor="file-upload-report" className={labelStyle}>
                Fichier {!editingReport && <span className="text-red-500">*</span>} {editingReport && <span className="text-xs text-gray-500">(Optionnel si pas de changement de fichier)</span>}
              </label>
              <input type="file" id="file-upload-report" ref={fileInputRef} onChange={handleFileChange} className={fileInputStyle} required={!editingReport} disabled={isSubmitting}/>
              {editingReport && !file && (<div className="text-sm text-gray-500 mt-1">Fichier actuel : <span className="font-medium">{editingReport.fileName}</span></div>)}
              {file && <div className="text-sm text-green-700 mt-1">Nouveau fichier sélectionné : <span className="font-medium">{file.name}</span></div>}
            </div>
            <div>
              <label htmlFor="formCommentaire-report" className={labelStyle}>Commentaire (optionnel)</label>
              <textarea id="formCommentaire-report" rows={3} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} className={inputStyle} placeholder="Ajoutez des notes ou un résumé ici..."/>
            </div>
            <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200 mt-6">
              <button type="button" onClick={handleCloseForm} disabled={isSubmitting} className="px-6 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors font-medium">Annuler</button>
              <button type="submit" className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-medium transition-colors" disabled={isSubmitting}>
                {isSubmitting ? <><Loader size={20} className="animate-spin mr-2"/><span>Envoi...</span></> : <><Save size={20} className="mr-2"/><span>{editingReport ? 'Sauvegarder les modifications' : 'Téléverser le rapport'}</span></>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Affichage de la table des rapports */}
      {!showForm && !isLoadingInitial && (
        <div className="bg-white p-0 md:p-6 rounded-lg shadow-md relative">
          <h2 className="text-xl font-semibold text-gray-800 mb-2 px-6 md:px-0 pt-4 md:pt-0">Liste des rapports pour "{pageTitle}"</h2>
          {uploadedReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    {[" ", "Titre", "Fichier", "Agent (Poste)", "Source", "Téléversé le", "Actions"].map(h => (
                      <th key={h} scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider ${h === "Actions" ? "text-center pr-8" : ""} ${h === " " ? "w-12" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploadedReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-150 group">
                      <td className="px-6 py-4 text-center">
                        {getFileIcon(report.fileType || report.fileName, 22)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800 max-w-xs" title={report.titre}>
                        <div className="truncate w-full">{report.titre}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs" title={report.fileName}>
                         <div className="truncate w-full">{report.fileName}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-sm">
                        <div className="truncate w-full">{report.agentName} ({report.agentPoste})</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs" title={report.source}>
                        <div className="truncate w-full">{report.source}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{new Date(report.uploadedAt + "T00:00:00").toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="px-6 py-4 text-center space-x-1">
                        {report.commentaire && <button onClick={(e) => handleMouseEnterComment(report.commentaire, e.currentTarget)} onMouseLeave={handleMouseLeaveComment} className="p-1.5 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300" title="Voir commentaire"><Info size={19}/></button>}
                        {/* CORRECTION: Suppression de l'accolade en trop ici */}
                        <button onClick={() => handleDownloadFile(report)} className="p-1.5 text-green-600 hover:text-green-800 rounded-full hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300" title="Télécharger"><Download size={19}/></button>
                        {canUploadAndEdit && <button onClick={() => handleEditReport(report)} className="p-1.5 text-yellow-500 hover:text-yellow-700 rounded-full hover:bg-yellow-100 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300" title="Modifier"><Edit2 size={19}/></button>}
                        {canDelete && <button onClick={() => handleDeleteReport(report.id)} className="p-1.5 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300" title="Supprimer"><Trash2 size={19}/></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">Aucun rapport de type "{pageTitle}" n'a été trouvé.</p>
          )}
        </div>
      )}

      {/* Tooltip pour les commentaires */}
      {tooltipVisible && (
        <div style={{ top: tooltipPosition.top, left: tooltipPosition.left, transform: 'translateX(-50%)' }} className="fixed z-50 p-2.5 text-sm bg-gray-800 text-white rounded-md shadow-lg max-w-xs animate-fadeIn">
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

export default ReportPage;