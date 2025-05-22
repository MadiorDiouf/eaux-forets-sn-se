// src/hooks/useGlobalSearch.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BookText, Clock, FileText as ReportIcon, AlertCircle, Search as SearchIcon, 
    FileSpreadsheet, Users as UsersIcon // Ajout des nouvelles icônes
} from 'lucide-react';
import type { RapportEnPreparation } from '../components/RapportsEnPreparationPage'; 
// Assurez-vous que l'export de NATURE_RAPPORT_OPTIONS existe et est correct
import { NATURE_RAPPORT_OPTIONS as NATURE_RAPPORT_OPTIONS_FROM_PAGE } from '../components/RapportsEnPreparationPage';

// --- CLÉS & CONFIGURATION ---
const RAPPORTS_PREPA_KEY = 'rapports_en_preparation_data_v2';
const DOCUMENTS_KEY = 'uploaded_documents_data'; // NOUVELLE CLÉ
const AGENTS_KEY = 'agents_data';                 // NOUVELLE CLÉ
const SEARCH_HISTORY_KEY = 'global_search_history';
const MAX_HISTORY_ITEMS = 7;
const MAX_RESULTS_PER_SOURCE = 3; // Réduit pour ne pas surcharger si beaucoup de sources

// --- INTERFACES ---
export interface SearchableItem {
  id: string;
  title: string;
  typeLabel: string; 
  category: string; 
  path: string;
  description?: string; 
  icon?: React.ReactNode;
  isHistory?: boolean;
}

export interface HistoryEntry { 
  id: string;
  term: string; 
  timestamp: number;
}

// Pour les Documents (ADAPTEZ À VOTRE STRUCTURE)
export interface UploadedDocument {
  id: string;
  nomFichier: string;
  titre?: string;
  description?: string;
  typeMime?: string;
  dateUpload: string; 
  auteur?: string;
  // cheminStockage?: string; // Ou URL vers le détail/téléchargement
}

// Pour les Agents (ADAPTEZ À VOTRE STRUCTURE)
export interface Agent {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  email?: string;
  telephone?: string;
  division?: string;
  poste?: string;
}

// --- VALIDATION & FALLBACK ---
const NATURE_RAPPORT_OPTIONS_VALIDATED = Array.isArray(NATURE_RAPPORT_OPTIONS_FROM_PAGE) 
    ? NATURE_RAPPORT_OPTIONS_FROM_PAGE 
    : [];

if (!Array.isArray(NATURE_RAPPORT_OPTIONS_FROM_PAGE)) {
    console.warn("NATURE_RAPPORT_OPTIONS n'est pas un tableau. Utilisation d'un fallback vide.");
}

// --- FONCTIONS DE MAPPING ---
const mapRapportToSearchableItem = (rapport: RapportEnPreparation): SearchableItem => {
  const natureOption = NATURE_RAPPORT_OPTIONS_VALIDATED.find(n => n.value === rapport.nature);
  const natureLabel = natureOption ? natureOption.label : rapport.nature;
  return {
    id: `rapport-${rapport.id}`,
    title: rapport.titre || "Titre manquant",
    typeLabel: 'Rapport',
    category: `Rapport (${natureLabel})`,
    path: `/rapports/preparation#item-${rapport.id}`, 
    description: rapport.notes || `Responsable: ${rapport.responsable || 'N/A'}`,
    icon: <ReportIcon size={18} className="text-blue-500" />,
  };
};

const mapDocumentToSearchableItem = (doc: UploadedDocument): SearchableItem => ({
  id: `doc-${doc.id}`,
  title: doc.titre || doc.nomFichier,
  typeLabel: 'Document',
  category: doc.typeMime || 'Fichier',
  path: `/documents/view/${doc.id}`, // ADAPTEZ CE CHEMIN
  description: doc.description || `Uploadé le: ${new Date(doc.dateUpload).toLocaleDateString()}${doc.auteur ? ' par ' + doc.auteur : ''}`,
  icon: <FileSpreadsheet size={18} className="text-indigo-500" />,
});

const mapAgentToSearchableItem = (agent: Agent): SearchableItem => ({
  id: `agent-${agent.id}`,
  title: `${agent.prenom} ${agent.nom}`,
  typeLabel: 'Agent',
  category: agent.division || 'Personnel',
  path: `/personnel/agents/${agent.id}`, // ADAPTEZ CE CHEMIN
  description: `Matricule: ${agent.matricule}${agent.poste ? ' - ' + agent.poste : ''}`,
  icon: <UsersIcon size={18} className="text-emerald-500" />,
});

// --- HOOK useGlobalSearch ---
export const useGlobalSearch = (initialQuery: string = "") => {
  const [query, _setQuery] = useState(initialQuery);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchResults, setSearchResults] = useState<SearchableItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { // Chargement de l'historique
    const storedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (storedHistory) { try { setHistory(JSON.parse(storedHistory).sort((a:HistoryEntry,b:HistoryEntry) => b.timestamp - a.timestamp)); } catch (e) { console.error("Erreur parsing historique:", e); localStorage.removeItem(SEARCH_HISTORY_KEY); }}
  }, []);

  useEffect(() => { // Sauvegarde de l'historique
    if (history.length > 0 || localStorage.getItem(SEARCH_HISTORY_KEY)) { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history)); }
  }, [history]);

  const addToHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    setHistory(prev => [{ id: `hist-${Date.now()}-${term}`, term, timestamp: Date.now() }, ...prev.filter(entry => entry.term.toLowerCase() !== term.toLowerCase())].slice(0, MAX_HISTORY_ITEMS));
  }, []);

  const clearHistory = useCallback(() => { setHistory([]); localStorage.removeItem(SEARCH_HISTORY_KEY); }, []);
  
  const setQuery = useCallback((newQuery: string) => { _setQuery(newQuery); }, [_setQuery]);

  useEffect(() => { // Logique de recherche principale
    if (!query.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const lowerQuery = query.toLowerCase();
    
    const searchTimeoutId = setTimeout(() => {
      let combinedResults: SearchableItem[] = [];

      // 1. Rapports en Préparation
      try {
        const dataRaw = localStorage.getItem(RAPPORTS_PREPA_KEY);
        if (dataRaw) {
          const items: RapportEnPreparation[] = JSON.parse(dataRaw);
          combinedResults = combinedResults.concat(
            items.filter(item => 
                (item.titre?.toLowerCase().includes(lowerQuery)) ||
                (NATURE_RAPPORT_OPTIONS_VALIDATED.find(n => n.value === item.nature)?.label.toLowerCase().includes(lowerQuery)) ||
                (item.responsable?.toLowerCase().includes(lowerQuery))
            ).slice(0, MAX_RESULTS_PER_SOURCE).map(mapRapportToSearchableItem)
          );
        }
      } catch (error) { console.error("Erreur recherche rapports:", error); }

      // 2. Documents Uploadés (EXEMPLE LOCALSTORAGE - ADAPTEZ SI API OU CONTEXT)
      try {
        const dataRaw = localStorage.getItem(DOCUMENTS_KEY);
        if (dataRaw) {
          const items: UploadedDocument[] = JSON.parse(dataRaw);
          combinedResults = combinedResults.concat(
            items.filter(item => 
              (item.titre?.toLowerCase().includes(lowerQuery)) ||
              (item.nomFichier.toLowerCase().includes(lowerQuery)) ||
              (item.description?.toLowerCase().includes(lowerQuery)) ||
              (item.auteur?.toLowerCase().includes(lowerQuery))
            ).slice(0, MAX_RESULTS_PER_SOURCE).map(mapDocumentToSearchableItem)
          );
        }
      } catch (error) { console.error("Erreur recherche documents:", error); }

      // 3. Agents (EXEMPLE LOCALSTORAGE - ADAPTEZ SI API OU CONTEXT)
      try {
        const dataRaw = localStorage.getItem(AGENTS_KEY);
        if (dataRaw) {
          const items: Agent[] = JSON.parse(dataRaw);
          combinedResults = combinedResults.concat(
            items.filter(item =>
              (item.prenom.toLowerCase().includes(lowerQuery)) ||
              (item.nom.toLowerCase().includes(lowerQuery)) ||
              (`${item.prenom} ${item.nom}`.toLowerCase().includes(lowerQuery)) || // Nom complet
              (item.matricule.toLowerCase().includes(lowerQuery)) ||
              (item.email?.toLowerCase().includes(lowerQuery)) ||
              (item.division?.toLowerCase().includes(lowerQuery))
            ).slice(0, MAX_RESULTS_PER_SOURCE).map(mapAgentToSearchableItem)
          );
        }
      } catch (error) { console.error("Erreur recherche agents:", error); }

      // 4. Recherche dans les Natures de Rapport (métadonnées)
      combinedResults = combinedResults.concat(
        NATURE_RAPPORT_OPTIONS_VALIDATED
          .filter(option => option.label.toLowerCase().includes(lowerQuery))
          .map(option => ({
            id: `meta-nature-${option.value}`,
            title: option.label,
            typeLabel: 'Catégorie',
            category: 'Filtre de Rapport',
            path: `/rapports/filtered?nature=${option.value}`, // ADAPTEZ CE CHEMIN
            icon: <BookText size={18} className="text-cyan-500" />
          } as SearchableItem))
      );
      
      // Deduplication finale basée sur l'ID
      const uniqueResults = Array.from(new Map(combinedResults.map(item => [item.id, item])).values());
      
      // Optionnel: trier les résultats (par ex. par pertinence si vous avez un score, ou par typeLabel)
      // uniqueResults.sort((a, b) => a.typeLabel.localeCompare(b.typeLabel) || a.title.localeCompare(b.title));

      setSearchResults(uniqueResults);
      setIsLoading(false);
    }, 300); // Délai pour simuler la recherche et debounce léger

    return () => clearTimeout(searchTimeoutId);
  }, [query]);

  const historySuggestions = useMemo((): SearchableItem[] => (
    history.map(entry => ({
      id: entry.id,
      title: entry.term,
      typeLabel: 'Historique',
      category: 'Recherche Récente',
      path: `/search/results?q=${encodeURIComponent(entry.term)}`, // ADAPTEZ CE CHEMIN
      icon: <Clock size={18} className="text-slate-500" />,
      isHistory: true,
    }))
  ), [history]);

  const performSearchOrNavigate = useCallback((itemOrTerm: SearchableItem | string) => {
    const term = typeof itemOrTerm === 'string' ? itemOrTerm : itemOrTerm.title;
    const path = typeof itemOrTerm === 'string' ? `/search/results?q=${encodeURIComponent(itemOrTerm)}` : itemOrTerm.path; // ADAPTEZ LE CHEMIN PAR DÉFAUT

    _setQuery(term); 
    addToHistory(term); 
    
    if (path) {
      navigate(path);
    } else {
      console.warn("Item de recherche sans path, la recherche va se mettre à jour pour:", term);
    }
  }, [navigate, addToHistory, _setQuery]);

  return {
    query,
    setQuery,
    searchResults,
    historySuggestions,
    isLoading,
    addToHistory,
    performSearchOrNavigate,
    clearHistory,
  };
};