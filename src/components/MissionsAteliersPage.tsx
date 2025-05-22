// src/components/MissionsAteliersPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext'; // <--- IMPORT CORRIGÉ/ASSURÉ
import { useData } from '../contexts/DataContext'; // <--- IMPORT CORRIGÉ/ASSURÉ
import { toast } from 'react-toastify';
import { 
    PlusCircle, Edit3, Trash2, Calendar, Users, MapPin, Briefcase, 
    CheckSquare as CheckSquareIcon, Loader2, Clock, XCircle, Save, Search 
} from 'lucide-react';

export type EventType = 'mission' | 'atelier' | 'seminaire' | 'formation' | 'reunion' | 'autre';
export type EventStatus = 'planifie' | 'en_cours' | 'termine' | 'annule' | 'reporte';

export interface MissionAtelier { 
  id: string; 
  titre: string; 
  type: EventType; 
  statut: EventStatus; 
  dateDebut: string;
  dateFin?: string;
  lieu?: string; 
  organisateur?: string; 
  responsables?: string; 
  description?: string;
}

export const EVENT_TYPE_OPTIONS: { value: EventType, label: string, icon: JSX.Element }[] = [
    { value: 'mission', label: 'Mission', icon: <Briefcase /> },
    { value: 'atelier', label: 'Atelier', icon: <Users /> },
    { value: 'seminaire', label: 'Séminaire', icon: <Briefcase /> }, // Vous pouvez choisir une icône plus spécifique si disponible
    { value: 'formation', label: 'Formation', icon: <Users /> },     // Idem
    { value: 'reunion', label: 'Réunion', icon: <Users /> },
    { value: 'autre', label: 'Autre', icon: <Calendar /> },
];
  
export const EVENT_STATUS_OPTIONS: { value: EventStatus, label: string, icon: JSX.Element, colorClass: string }[] = [
    { value: 'planifie', label: 'Planifié', icon: <Clock />, colorClass: 'bg-blue-100 text-blue-800' },
    { value: 'en_cours', label: 'En Cours', icon: <Loader2 className="animate-spin"/>, colorClass: 'bg-yellow-100 text-yellow-800' },
    { value: 'termine', label: 'Terminé', icon: <CheckSquareIcon />, colorClass: 'bg-green-100 text-green-800' },
    { value: 'annule', label: 'Annulé', icon: <XCircle />, colorClass: 'bg-red-100 text-red-800' },
    { value: 'reporte', label: 'Reporté', icon: <Calendar />, colorClass: 'bg-purple-100 text-purple-800' },
];

const MOCK_MISSIONS_KEY = 'missions_ateliers_data_v2';

const MissionsAteliersPage: React.FC = () => {
  const auth = useAuth(); // Doit fonctionner maintenant avec l'import ci-dessus
  const { notifyDataChange } = useData(); // Doit fonctionner maintenant avec l'import ci-dessus
  const userRole = auth.currentUser?.role;
  const canEdit = userRole === 'admin' || userRole === 'editeur';

  const [events, setEvents] = useState<MissionAtelier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<MissionAtelier | null>(null);
  
  const [titre, setTitre] = useState('');
  const [type, setType] = useState<EventType>('reunion');
  const [statut, setStatut] = useState<EventStatus>('planifie');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [lieu, setLieu] = useState('');
  const [organisateur, setOrganisateur] = useState('');
  const [responsables, setResponsables] = useState('');
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { 
    setIsLoading(true); 
    const storedData = localStorage.getItem(MOCK_MISSIONS_KEY); 
    if (storedData) { 
        try { 
            const parsedData = JSON.parse(storedData) as MissionAtelier[]; 
            if (Array.isArray(parsedData)) { 
                const validatedData = parsedData.map(e => ({...e, dateDebut: e.dateDebut || new Date().toISOString().split('T')[0]})); 
                setEvents(validatedData); 
            } else { 
                setEvents([]); 
            } 
        } catch (error) { 
            console.error("Erreur parsing missions/ateliers:", error); setEvents([]); 
        } 
    } 
    setIsLoading(false); 
  }, []);

  const resetFormFields = () => { 
    setTitre(''); setType('reunion'); setStatut('planifie'); setDateDebut(''); 
    setDateFin(''); setLieu(''); setOrganisateur(''); setResponsables(''); 
    setDescription(''); setEditingEvent(null); 
  };

  const handleOpenFormForCreate = () => { 
    if (!canEdit) {toast.warn("Action non autorisée."); return;} 
    resetFormFields(); 
    setShowForm(true); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseForm = () => { 
    resetFormFields(); 
    setShowForm(false); 
  };

  const handleSubmit = (event: React.FormEvent) => {
    if (!canEdit) { 
      toast.error("Action non autorisée.");
      return; 
    }
    event.preventDefault();
    if (!titre.trim() || !dateDebut) { 
      toast.warn('Veuillez renseigner le titre et la date de début.');
      return; 
    }
    setIsSubmitting(true);
    const newEventData: MissionAtelier = { 
      id: editingEvent ? editingEvent.id : String(Date.now()), 
      titre: titre.trim(), type, statut, dateDebut, 
      dateFin: dateFin || undefined, 
      lieu: lieu.trim() || undefined, 
      organisateur: organisateur.trim() || undefined, 
      responsables: responsables.trim() || undefined, 
      description: description.trim() || undefined, 
    };
    
    let updatedEventsList = editingEvent ? events.map(e => e.id === editingEvent.id ? newEventData : e) : [...events, newEventData];
    updatedEventsList.sort((a,b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
    
    setEvents(updatedEventsList); 
    localStorage.setItem(MOCK_MISSIONS_KEY, JSON.stringify(updatedEventsList));
    notifyDataChange();
    toast.success(`Événement ${editingEvent ? 'modifié' : 'ajouté'} avec succès !`);
    handleCloseForm();
    setIsSubmitting(false);
  };

  const handleEdit = (eventToEdit: MissionAtelier) => {
    if (!canEdit) { toast.warn("Action non autorisée."); return; }
    setEditingEvent(eventToEdit); 
    setTitre(eventToEdit.titre); 
    setType(eventToEdit.type); 
    setStatut(eventToEdit.statut); 
    setDateDebut(eventToEdit.dateDebut); 
    setDateFin(eventToEdit.dateFin || ''); 
    setLieu(eventToEdit.lieu || ''); 
    setOrganisateur(eventToEdit.organisateur || ''); 
    setResponsables(eventToEdit.responsables || ''); 
    setDescription(eventToEdit.description || ''); 
    setShowForm(true); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (!canEdit) { 
      toast.error("Action non autorisée.");
      return; 
    }
    toast(
        ({ closeToast }) => (
            <div className="flex flex-col p-2">
                <p className="mb-3 text-sm text-gray-700">Supprimer cet événement définitivement ?</p>
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={() => {
                            const updatedEventsList = events.filter(e => e.id !== id); 
                            setEvents(updatedEventsList); 
                            localStorage.setItem(MOCK_MISSIONS_KEY, JSON.stringify(updatedEventsList));
                            notifyDataChange();
                            toast.success("Événement supprimé.");
                            if (closeToast) closeToast();
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    > Supprimer </button>
                    <button onClick={closeToast} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"> Annuler </button>
                </div>
            </div>
        ), { position: "top-center", autoClose: false, closeOnClick: false, draggable: false }
    );
  };
  
  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) {
        return events;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return events.filter(event => 
        event.titre.toLowerCase().includes(lowerSearchTerm) ||
        (event.lieu && event.lieu.toLowerCase().includes(lowerSearchTerm)) ||
        (event.organisateur && event.organisateur.toLowerCase().includes(lowerSearchTerm)) ||
        (event.responsables && event.responsables.toLowerCase().includes(lowerSearchTerm)) ||
        (event.description && event.description.toLowerCase().includes(lowerSearchTerm)) ||
        (EVENT_TYPE_OPTIONS.find(opt => opt.value === event.type)?.label.toLowerCase().includes(lowerSearchTerm)) ||
        (EVENT_STATUS_OPTIONS.find(opt => opt.value === event.statut)?.label.toLowerCase().includes(lowerSearchTerm))
    );
  }, [events, searchTerm]);

  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (isLoading && !showForm) {
      return <div className="p-6 text-center text-gray-500"><Loader2 size={28} className="inline-block animate-spin mr-2"/>Chargement de l'agenda...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4 md:mb-0">Agenda : Missions, Ateliers, Réunions</h1>
        {canEdit && !showForm && (
          <button 
            onClick={handleOpenFormForCreate} 
            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition duration-150 ease-in-out"
          >
            <PlusCircle size={20} className="mr-2"/> Planifier un Événement
          </button>
        )}
      </div>

      {canEdit && showForm && (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl mb-10 border border-gray-200 animate-fadeIn">
          <div className="flex justify-between items-center mb-6 pb-3 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
                {editingEvent ? 'Modifier l\'Événement' : 'Planifier un Nouvel Événement'}
            </h2>
            <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600" title="Fermer">
                <XCircle size={24}/>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="titre-event" className={labelClass}>Titre de l'événement <span className="text-red-500">*</span></label>
                <input type="text" id="titre-event" value={titre} onChange={e => setTitre(e.target.value)} required className={inputStyle} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="type-event" className={labelClass}>Type d'événement</label>
                    <select id="type-event" value={type} onChange={e => setType(e.target.value as EventType)} className={inputStyle}>
                        {EVENT_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="statut-event" className={labelClass}>Statut</label>
                    <select id="statut-event" value={statut} onChange={e => setStatut(e.target.value as EventStatus)} className={inputStyle}>
                        {EVENT_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="dateDebut-event" className={labelClass}>Date de début <span className="text-red-500">*</span></label>
                    <input type="date" id="dateDebut-event" value={dateDebut} onChange={e => setDateDebut(e.target.value)} required className={inputStyle} />
                </div>
                <div>
                    <label htmlFor="dateFin-event" className={labelClass}>Date de fin (Optionnel)</label>
                    <input type="date" id="dateFin-event" value={dateFin} onChange={e => setDateFin(e.target.value)} className={inputStyle} min={dateDebut || undefined} />
                </div>
            </div>
            <div>
                <label htmlFor="lieu-event" className={labelClass}>Lieu (Optionnel)</label>
                <input type="text" id="lieu-event" value={lieu} onChange={e => setLieu(e.target.value)} className={inputStyle} />
            </div>
            <div>
                <label htmlFor="organisateur-event" className={labelClass}>Organisateur(s) (Optionnel)</label>
                <input type="text" id="organisateur-event" value={organisateur} onChange={e => setOrganisateur(e.target.value)} className={inputStyle} />
            </div>
            <div>
                <label htmlFor="responsables-event" className={labelClass}>Responsable(s) Principal(aux) (Optionnel)</label>
                <input type="text" id="responsables-event" value={responsables} onChange={e => setResponsables(e.target.value)} className={inputStyle} />
            </div>
            <div>
                <label htmlFor="description-event" className={labelClass}>Description / Objectifs (Optionnel)</label>
                <textarea id="description-event" value={description} onChange={e => setDescription(e.target.value)} rows={4} className={inputStyle}></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={handleCloseForm} className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"> Annuler </button>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50">
                    {isSubmitting ? <Loader2 size={18} className="mr-2 animate-spin"/> : <Save size={18} className="mr-2"/>}
                    {editingEvent ? 'Sauvegarder les Modifications' : 'Planifier l\'Événement'}
                </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-xl border border-gray-200">
            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <Search className="h-5 w-5 text-gray-400" /> </div>
                <input type="text" placeholder="Rechercher un événement..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputStyle} pl-10 w-full md:w-2/3 lg:w-1/2`} />
            </div>
          {isLoading ? (
             <div className="text-center py-10"><Loader2 size={28} className="animate-spin text-blue-500 inline-block" /></div>
          ) : filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.map(eventItem => { // Renommé `e` en `eventItem` pour éviter la confusion avec `event` de onChange
                    const typeOption = EVENT_TYPE_OPTIONS.find(opt => opt.value === eventItem.type); 
                    const statusOption = EVENT_STATUS_OPTIONS.find(opt => opt.value === eventItem.statut);
                    return (
                      <tr key={eventItem.id} className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-4 py-4"><div className="text-sm font-medium text-gray-800 max-w-xs truncate" title={eventItem.titre}>{eventItem.titre}</div>{eventItem.description && <div className="text-xs text-gray-500 max-w-xs truncate" title={eventItem.description}>{eventItem.description}</div>}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{typeOption && <span className="flex items-center">{React.cloneElement(typeOption.icon, {size:16, className: `mr-1.5 ${typeOption.icon.props.className || ''}`})} {typeOption.label}</span>}</td>
                        <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">{new Date(eventItem.dateDebut+"T00:00:00").toLocaleDateString('fr-FR')}{eventItem.dateFin && ` - ${new Date(eventItem.dateFin+"T00:00:00").toLocaleDateString('fr-FR')}`}</td>
                        <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate" title={eventItem.lieu}>{eventItem.lieu || '-'}</td>
                        <td className="px-4 py-4 text-sm">{statusOption && <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusOption.colorClass}`}>{statusOption.icon && React.cloneElement(statusOption.icon, {size: 14, className: `mr-1.5 ${statusOption.icon.props.className || ''}`})} {statusOption.label}</span>}</td>
                        <td className="px-4 py-4 text-sm space-x-2 whitespace-nowrap">
                            {canEdit && (
                                <> 
                                <button 
                                    onClick={() => handleEdit(eventItem)} 
                                    className="text-green-600 hover:text-green-700 p-1.5 rounded-full hover:bg-green-100 transition-colors" 
                                    title="Modifier"
                                >
                                    <Edit3 size={16}/>
                                </button> 
                                <button 
                                    onClick={() => handleDelete(eventItem.id)} 
                                    className="text-red-600 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100 transition-colors" 
                                    title="Supprimer"
                                >
                                    <Trash2 size={16}/>
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
          ) : ( <div className="text-center py-12"> <Calendar size={48} className="mx-auto text-gray-300 mb-4"/> <p className="text-lg text-gray-500">{searchTerm ? "Aucun événement ne correspond à votre recherche." : "Aucun événement planifié pour le moment."}</p> </div> )}
        </div>
      )}
    </div>
  );
};

export default MissionsAteliersPage;