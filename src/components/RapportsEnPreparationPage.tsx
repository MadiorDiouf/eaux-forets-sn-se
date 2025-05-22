// src/components/RapportsEnPreparationPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'react-toastify';
import { PlusCircle, Edit3, Trash2, Clock, Loader2 as Loader, Search, XCircle, Save, CalendarDays, CalendarCheck2 } from 'lucide-react';

export type ReportStatus = 'elaboration' | 'validation' | 'finalise';
export type ReportNature = 'ptba' | 'performances' | 'annuel' | 'trimestriel' | 'autre';
export interface RapportEnPreparation { 
  id: string; 
  titre: string; 
  nature: ReportNature; 
  statut: ReportStatus; 
  datePrevue: string; 
  responsable?: string; 
  notes?: string; 
}

export const NATURE_RAPPORT_OPTIONS: { value: ReportNature, label: string }[] = [ 
  { value: 'ptba', label: 'Plan de Travail et Budget Annuel' }, 
  { value: 'performances', label: 'Rapport de Performances' }, 
  { value: 'annuel', label: 'Rapport Annuel' }, 
  { value: 'trimestriel', label: 'Rapport Trimestriel' }, 
  { value: 'autre', label: 'Autre type de rapport' }, 
];

export const STATUT_RAPPORT_OPTIONS: { value: ReportStatus, label: string, icon?: JSX.Element, colorClass: string }[] = [ 
  { value: 'elaboration', label: 'En élaboration', icon: <Loader size={14} className="mr-1.5" />, colorClass: "text-blue-600 bg-blue-100" }, 
  { value: 'validation', label: 'En validation', icon: <Clock size={14} className="mr-1.5" />, colorClass: "text-yellow-600 bg-yellow-100" },
  { value: 'finalise', label: 'Finalisé', icon: <CalendarCheck2 size={14} className="mr-1.5" />, colorClass: "text-green-600 bg-green-100" },
];

const MOCK_PREPA_KEY = 'rapports_en_preparation_data_v2';

const RapportsEnPreparationPage: React.FC = () => {
  const auth = useAuth();
  const { notifyDataChange } = useData();
  const userRole = auth.currentUser?.role;
  const canEdit = userRole === 'admin' || userRole === 'editeur';

  const [rapports, setRapports] = useState<RapportEnPreparation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingRapport, setEditingRapport] = useState<RapportEnPreparation | null>(null);
  
  const [titre, setTitre] = useState('');
  const [nature, setNature] = useState<ReportNature>('ptba');
  const [statut, setStatut] = useState<ReportStatus>('elaboration'); 
  const [datePrevue, setDatePrevue] = useState('');
  const [responsable, setResponsable] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const storedData = localStorage.getItem(MOCK_PREPA_KEY);
    if (storedData) { 
      try { 
        const parsedData = JSON.parse(storedData) as RapportEnPreparation[]; 
        const validData = parsedData.map(r => ({
            ...r,
            datePrevue: r.datePrevue || new Date().toISOString().split('T')[0] // Assurer une date valide
        }));
        setRapports(validData); 
      } catch (e) { 
        console.error("Erreur parsing rapports en préparation:", e); 
        setRapports([]); 
      } 
    }
    setIsLoading(false);
  }, []);

  const resetFormFields = () => { 
    setTitre(''); 
    setNature('ptba'); 
    setStatut('elaboration'); 
    setDatePrevue(''); 
    setResponsable(''); 
    setNotes(''); 
    setEditingRapport(null); 
  };

  const handleOpenFormForCreate = () => {
    if (!canEdit) { toast.warn("Action non autorisée."); return;}
    resetFormFields(); 
    setShowForm(true);
  };

  const handleCloseForm = () => {
    resetFormFields();
    setShowForm(false);
  }

  const handleSubmit = (event: React.FormEvent) => {
    if (!canEdit) { toast.error("Action non autorisée."); return; }
    event.preventDefault();
    if (!titre.trim() || !datePrevue) { 
      toast.warn('Veuillez renseigner le titre et la date prévue.'); 
      return; 
    }
    setIsSubmitting(true);
    const rapportData: RapportEnPreparation = { 
      id: editingRapport ? editingRapport.id : String(Date.now()), 
      titre: titre.trim(), 
      nature, 
      statut, 
      datePrevue, 
      responsable: responsable.trim() || undefined, 
      notes: notes.trim() || undefined, 
    };
    
    let updatedRapports = editingRapport 
      ? rapports.map(r => r.id === editingRapport.id ? rapportData : r) 
      : [...rapports, rapportData];
    
    updatedRapports.sort((a,b) => new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime());
    setRapports(updatedRapports); 
    localStorage.setItem(MOCK_PREPA_KEY, JSON.stringify(updatedRapports)); 
    
    notifyDataChange();
    toast.success(`Rapport ${editingRapport ? 'modifié' : 'enregistré'} avec succès !`);
    handleCloseForm();
    setIsSubmitting(false);
  };

  const handleEdit = (rapport: RapportEnPreparation) => {
    if (!canEdit) { toast.warn("Action non autorisée."); return; }
    setEditingRapport(rapport); 
    setTitre(rapport.titre); 
    setNature(rapport.nature); 
    setStatut(rapport.statut);
    setDatePrevue(rapport.datePrevue);
    setResponsable(rapport.responsable || ''); 
    setNotes(rapport.notes || ''); 
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (!canEdit) { toast.error("Action non autorisée."); return; }
    toast(
        ({ closeToast }) => (
            <div className="flex flex-col p-2">
                <p className="mb-3 text-sm text-gray-700">Êtes-vous sûr de vouloir supprimer ce rapport en préparation ?</p>
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={() => {
                            const updatedRapports = rapports.filter(r => r.id !== id); 
                            setRapports(updatedRapports); 
                            localStorage.setItem(MOCK_PREPA_KEY, JSON.stringify(updatedRapports)); 
                            notifyDataChange();
                            toast.success("Rapport supprimé.");
                            if(closeToast) closeToast();
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    > Supprimer </button>
                    <button onClick={closeToast} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"> Annuler </button>
                </div>
            </div>
        ), { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, }
    );
  };
  
  const filteredRapports = useMemo(() => { 
    let displayableRapports = rapports.filter(r => r.statut !== 'finalise');
    if (!searchTerm.trim()) return displayableRapports; 
    const lowerSearchTerm = searchTerm.toLowerCase();
    return displayableRapports.filter(rapport => 
      rapport.titre.toLowerCase().includes(lowerSearchTerm) || 
      (rapport.responsable && rapport.responsable.toLowerCase().includes(lowerSearchTerm)) || 
      NATURE_RAPPORT_OPTIONS.find(n => n.value === rapport.nature)?.label.toLowerCase().includes(lowerSearchTerm) 
    ); 
  }, [rapports, searchTerm]);
  
  const inputBaseClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (isLoading && !showForm) {
    return ( 
      <div className="flex justify-center items-center h-64"> 
        <Loader size={48} className="animate-spin text-blue-600" /> 
        <p className="ml-3 text-lg text-gray-600">Chargement des données...</p> 
      </div> 
    ); 
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50 min-h-[calc(100vh-150px)]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Rapports en Préparation
        </h1>
        {canEdit && !showForm && (
          <button 
            onClick={handleOpenFormForCreate} 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md inline-flex items-center transition-colors duration-150"
          >
            <PlusCircle size={20} className="mr-2"/> Ajouter un Rapport
          </button>
        )}
      </div>

      {canEdit && showForm && (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl mb-10 border border-gray-200 animate-fadeIn">
          <div className="flex justify-between items-center mb-6 pb-3 border-b">
            <h2 className="text-xl font-semibold text-gray-700">
              {editingRapport ? 'Modifier le Rapport en Préparation' : 'Nouveau Rapport en Préparation'}
            </h2>
            <button 
                onClick={handleCloseForm} 
                className="text-gray-400 hover:text-gray-600"
                title="Fermer le formulaire"
            >
                <XCircle size={24}/>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="titre-prep" className={labelClass}>Titre du Rapport <span className="text-red-500">*</span></label>
                <input type="text" id="titre-prep" value={titre} onChange={e => setTitre(e.target.value)} required className={inputBaseClass} placeholder="Ex: Rapport d'activité trimestriel Q1"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="nature-prep" className={labelClass}>Nature du Rapport</label>
                    <select id="nature-prep" value={nature} onChange={e => setNature(e.target.value as ReportNature)} className={inputBaseClass}>
                        {NATURE_RAPPORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="statut-prep" className={labelClass}>Statut</label>
                    <select id="statut-prep" value={statut} onChange={e => setStatut(e.target.value as ReportStatus)} className={inputBaseClass}>
                        {STATUT_RAPPORT_OPTIONS.filter(s => s.value !== 'finalise').map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            </div>
             <div>
                <label htmlFor="datePrevue-prep" className={labelClass}>Date Prévue de Finalisation <span className="text-red-500">*</span></label>
                <input type="date" id="datePrevue-prep" value={datePrevue} onChange={e => setDatePrevue(e.target.value)} required className={inputBaseClass} />
            </div>
            <div>
                <label htmlFor="responsable-prep" className={labelClass}>Responsable (Optionnel)</label>
                <input type="text" id="responsable-prep" value={responsable} onChange={e => setResponsable(e.target.value)} className={inputBaseClass} placeholder="Nom du responsable ou service"/>
            </div>
            <div>
                <label htmlFor="notes-prep" className={labelClass}>Notes (Optionnel)</label>
                <textarea id="notes-prep" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputBaseClass} placeholder="Ajoutez des notes ou des points clés concernant ce rapport..."></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button 
                    type="button" 
                    onClick={handleCloseForm}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                >
                    Annuler
                </button>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50"
                >
                    {isSubmitting ? <Loader size={18} className="mr-2 animate-spin"/> : <Save size={18} className="mr-2"/>}
                    {editingRapport ? 'Sauvegarder les Modifications' : 'Enregistrer le Rapport'}
                </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-xl border border-gray-200">
          <div className="mb-5"> 
            <label htmlFor="search-prep" className="sr-only">Rechercher</label> 
            <div className="relative"> 
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> 
                <Search size={20} className="text-gray-400" /> 
              </div> 
              <input type="text" id="search-prep" placeholder="Rechercher par titre, responsable, nature..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" /> 
            </div> 
          </div>
          {filteredRapports.length === 0 ? ( 
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun rapport en préparation trouvé</h3>
              <p className="mt-1 text-sm text-gray-500">{searchTerm ? "Essayez de modifier vos termes de recherche." : (canEdit ? "Commencez par ajouter un nouveau rapport." : "Aucun rapport n'est actuellement en préparation.")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nature</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Prévue</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRapports.map((rapport) => {
                    const statutInfo = STATUT_RAPPORT_OPTIONS.find(s => s.value === rapport.statut); 
                    const natureInfo = NATURE_RAPPORT_OPTIONS.find(n => n.value === rapport.nature);
                    return (
                      <tr key={rapport.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{rapport.titre}</div>
                          {rapport.notes && <div className="text-xs text-gray-500 truncate max-w-xs" title={rapport.notes}>{rapport.notes}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{natureInfo?.label || rapport.nature}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {statutInfo ? (
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statutInfo.colorClass.replace('text-', 'bg-').replace(/(\d)00/g, '$100')} ${statutInfo.colorClass}`}>
                              {statutInfo.icon && React.cloneElement(statutInfo.icon, { size: 14, className: "mr-1.5"})}
                              {statutInfo.label}
                            </span>
                          ) : rapport.statut}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(rapport.datePrevue+"T00:00:00").toLocaleDateString('fr-FR')} 
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rapport.responsable || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {canEdit && (
                            <>
                              <button onClick={() => handleEdit(rapport)} className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded-full hover:bg-indigo-100" title="Modifier">
                                <Edit3 size={18} />
                              </button>
                              <button onClick={() => handleDelete(rapport.id)} className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-100" title="Supprimer">
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RapportsEnPreparationPage;