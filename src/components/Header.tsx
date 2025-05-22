// src/components/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, BarChart2, ChevronDown, Home, Info, Users, Target, Calendar, X, 
  Clock, FileText, Bell, MessagesSquare, UserCog // AJOUT DE UserCog pour un admin plus explicite
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGlobalSearch, SearchableItem } from '../hooks/useGlobalSearch'; 
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import { toast } from 'react-toastify';

const Header: React.FC = () => {
  // ... (vos états et refs existants pour les dropdowns et la recherche) ...
  const [isDefccsDropdownOpen, setIsDefccsDropdownOpen] = useState(false);
  const [isSuiviEvalDropdownOpen, setIsSuiviEvalDropdownOpen] = useState(false);
  const defccsDropdownRef = useRef<HTMLDivElement>(null);
  const suiviEvalDropdownRef = useRef<HTMLDivElement>(null);
  const { 
    query, 
    setQuery,
    searchResults = [], 
    historySuggestions = [],
    isLoading: isSearchLoading, 
    performSearchOrNavigate, 
  } = useGlobalSearch();
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const { currentUser, pendingRegistrations } = useAuth();
  const { unreadMessagesCount, markMessagesAsRead } = useMessages();
  
  const isAdmin = currentUser?.role === 'admin';
  // Nous allons utiliser pendingRegistrations directement pour la condition
  const pendingCount = pendingRegistrations ? pendingRegistrations.length : 0;

  // ... (vos fonctions toggle et useEffect existants pour les dropdowns et la recherche) ...
  useEffect(() => { 
    const handleClickOutside = (event: MouseEvent) => {
      if (defccsDropdownRef.current && !defccsDropdownRef.current.contains(event.target as Node)) setIsDefccsDropdownOpen(false);
      if (suiviEvalDropdownRef.current && !suiviEvalDropdownRef.current.contains(event.target as Node)) setIsSuiviEvalDropdownOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node) && event.target !== searchInputRef.current) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { 
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        if (searchInputRef.current && searchInputRef.current.value.trim() === '' && historySuggestions.length > 0) {
          setIsSearchDropdownOpen(true);
        }
      }
      if (event.key === 'Escape' && isSearchDropdownOpen) {
        setIsSearchDropdownOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchDropdownOpen, historySuggestions]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const newQuery = e.target.value;
    setQuery(newQuery);
    const queryIsNotEmpty = newQuery.trim() !== '';
    setIsSearchDropdownOpen(queryIsNotEmpty || (!queryIsNotEmpty && historySuggestions.length > 0));
  };

  const handleSearchItemClick = (item: SearchableItem) => { 
    performSearchOrNavigate(item);
    setIsSearchDropdownOpen(false); 
    searchInputRef.current?.blur();
  };

  const handleSearchSubmit = (e: React.FormEvent) => { 
    e.preventDefault();
    const currentQuery = typeof query === 'string' ? query.trim() : '';
    if (currentQuery) {
      if (searchResults && searchResults.length > 0 && searchResults[0].title.toLowerCase() === currentQuery.toLowerCase()) {
        performSearchOrNavigate(searchResults[0]);
      } else {
        performSearchOrNavigate(currentQuery); 
      }
      setIsSearchDropdownOpen(false); 
      searchInputRef.current?.blur();
    }
  };

  const handleInputFocus = () => { 
    const currentQuery = typeof query === 'string' ? query.trim() : '';
    if (currentQuery || (historySuggestions && historySuggestions.length > 0)) {
      setIsSearchDropdownOpen(true);
    }
  };


  // MODIFICATION ICI pour la gestion du clic sur la cloche
  const handleBellClick = () => {
    if (isAdmin) {
      navigate('/securite'); // L'admin est redirigé vers la page de gestion
    } else {
      // Pour les non-admins, on pourrait afficher un message informatif
      toast.info("Des inscriptions sont en attente de validation par un administrateur.", { theme: 'colored' });
      // Ou ne rien faire, ou ouvrir un petit pop-up d'information
    }
  };

  const handleMessageIconClick = () => {
    if (unreadMessagesCount > 0) markMessagesAsRead([]);
    navigate('/discussion');
  };

  const headerButtonBaseClasses = "flex items-center space-x-2.5 border border-green-600 rounded-lg px-4 py-2.5 focus:outline-none transition-all duration-200 ease-in-out transform hover:scale-105";
  const headerButtonIconColor = "text-blue-700";
  const dropdownItemBaseClasses = "flex items-center px-4 py-3 text-sm font-semibold transition-colors duration-150";
  const dropdownItemHoverClasses = "hover:bg-green-100 hover:text-green-800";
  const iconContainerClasses = `p-1.5 flex items-center justify-center relative rounded-full hover:bg-gray-100 transition-colors duration-150`; // cursor-pointer enlevé ici, sera géré sur l'élément
  const badgeBaseClasses = "absolute -top-1.5 -right-2 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center p-0.5 leading-none";

  const isQueryEmpty = !query || (typeof query === 'string' && query.trim() === '');

  return (
    <header className="bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* ... (Logo et menu DEFCCS - inchangé) ... */}
           <div className="relative" ref={defccsDropdownRef}>
             <button onClick={()=> setIsDefccsDropdownOpen(!isDefccsDropdownOpen)} className={`${headerButtonBaseClasses} ${isDefccsDropdownOpen ? 'bg-green-50 scale-105' : 'hover:bg-gray-100'}`}>
              <img src="/logo-direction.png" alt="Logo Direction" className="h-12 w-12 mr-2" />
              <span className={`${headerButtonIconColor}`}><BarChart2 size={28} /></span>
              <span className={`font-bold text-2xl ${headerButtonIconColor}`}>DEFCCS</span>
              <span className={`${headerButtonIconColor}`}><ChevronDown size={22} className={`transition-transform duration-200 ${isDefccsDropdownOpen ? 'rotate-180' : ''}`} /></span>
            </button>
            {isDefccsDropdownOpen && ( 
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-xl z-20 border border-gray-200 py-1">
                <Link to="/" className={`${dropdownItemBaseClasses} ${dropdownItemHoverClasses}`} onClick={() => setIsDefccsDropdownOpen(false)}>
                  <Home size={18} className="mr-3" /> Accueil / Tableau de Bord
                </Link>
                <a href="https://eaux-forets.sn/presentation/" target="_blank" rel="noopener noreferrer" className={`${dropdownItemBaseClasses} ${dropdownItemHoverClasses}`} onClick={() => setIsDefccsDropdownOpen(false)}>
                  <Info size={18} className="mr-3" /> À propos (Site Externe)
                </a>
              </div>
            )}
          </div>
          
          {/* ... (Barre de recherche - inchangée) ... */}
           <div className="relative w-full max-w-lg mx-4" ref={searchContainerRef}>
             <form onSubmit={handleSearchSubmit} role="search">
              <div className="relative">
                  <input 
                    ref={searchInputRef} 
                    type="search" 
                    placeholder="Rechercher (Ctrl+K)..." 
                    className="w-full py-2.5 pl-10 pr-4 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    value={query || ''} 
                    onChange={handleSearchInputChange} 
                    onFocus={handleInputFocus} 
                    autoComplete="off"
                    aria-label="Recherche globale" 
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"> <Search size={18} /> </div>
                  {!isQueryEmpty && (
                    <button 
                      type="button" 
                      onClick={() => { 
                        setQuery(''); 
                        searchInputRef.current?.focus(); 
                        setIsSearchDropdownOpen(historySuggestions.length > 0);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      aria-label="Effacer la recherche"
                    >
                      <X size={16} />
                    </button>
                  )}
              </div>
            </form>
            
            {isSearchDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 w-full bg-white rounded-md shadow-xl z-30 border border-gray-200 max-h-[70vh] overflow-y-auto">
                  {/* ... Contenu du dropdown de recherche ... */}
                </div> 
            )}
          </div>

          {/* Boutons Suivi & Eval, Messages, Notifications (MODIFIÉ pour la cloche) */}
          <div className="flex items-center space-x-3 md:space-x-4"> {/* Augmenté un peu l'espacement */}
            {/* ... (Bouton Suivi & Évaluation - inchangé) ... */}
            <div className="relative" ref={suiviEvalDropdownRef}>
              <button onClick={()=>setIsSuiviEvalDropdownOpen(!isSuiviEvalDropdownOpen)} className={`${headerButtonBaseClasses} ${isSuiviEvalDropdownOpen ? 'bg-green-50 scale-105' : 'hover:bg-gray-100'}`}>
                <span className={`${headerButtonIconColor}`}><BarChart2 size={28} /></span>
                <span className={`font-bold text-lg ${headerButtonIconColor}`}>Suivi & Évaluation</span>
                <span className={`${headerButtonIconColor}`}><ChevronDown size={22} className={`transition-transform duration-200 ${isSuiviEvalDropdownOpen ? 'rotate-180' : ''}`} /></span>
              </button>
              {isSuiviEvalDropdownOpen && ( 
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-xl z-20 border border-gray-200 py-1">
                    <Link to="/dsefs/missions" className={`${dropdownItemBaseClasses} ${dropdownItemHoverClasses}`} onClick={() => setIsSuiviEvalDropdownOpen(false)}> <Target size={18} className="mr-3" /> Missions de la DSEFS </Link>
                    <Link to="/dsefs/agents" className={`${dropdownItemBaseClasses} ${dropdownItemHoverClasses}`} onClick={() => setIsSuiviEvalDropdownOpen(false)}> <Users size={18} className="mr-3" /> Agents de la DSEFS </Link>
                    <Link to="/agenda-dsefs" className={`${dropdownItemBaseClasses} ${dropdownItemHoverClasses}`} onClick={() => setIsSuiviEvalDropdownOpen(false)}> <Calendar size={18} className="mr-3" /> Agenda DSEFS </Link>
                  </div>
              )}
            </div>


            {/* Icône Messages (s'affiche si currentUser existe) */}
            {currentUser && (
                <div
                    onClick={handleMessageIconClick}
                    title={`${unreadMessagesCount > 0 ? unreadMessagesCount + " nouveau(x) message(s)" : "Aucun nouveau message"} - Ouvrir la discussion`}
                    className={`${iconContainerClasses} text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer`} // Ajout cursor-pointer
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleMessageIconClick();}}
                >
                    <span className="relative">
                        <MessagesSquare size={26} strokeWidth={unreadMessagesCount > 0 ? 2.2 : 1.8} /> 
                        {unreadMessagesCount > 0 && (
                        <span className={`${badgeBaseClasses} bg-green-500`}>
                            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                        </span>
                        )}
                    </span>
                </div>
            )}

            {/* Icône Cloche des Inscriptions en Attente (s'affiche TOUJOURS si currentUser existe) */}
            {currentUser && (
              <div 
                onClick={handleBellClick} // Utilise la nouvelle fonction
                title={pendingCount > 0 ? 
                        (isAdmin ? `${pendingCount} inscription(s) en attente - Gérer` : `${pendingCount} inscription(s) en attente de validation administrateur`) :
                        "Aucune inscription en attente"}
                className={`${iconContainerClasses} 
                            ${pendingCount > 0 ? 'text-red-500 hover:text-red-700 hover:bg-red-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                            ${isAdmin && pendingCount > 0 ? 'animate-pulse cursor-pointer' : (pendingCount > 0 ? 'cursor-default' : 'cursor-default')} 
                          `} // L'admin a un curseur pointer si demandes, les autres un curseur normal (ou default)
                role="button" // Toujours un rôle de bouton pour l'accessibilité
                tabIndex={0}  // Rendre focusable
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBellClick();}}
              >
                <span className="relative">
                  <Bell size={28} strokeWidth={pendingCount > 0 ? 2.2 : 1.8} />
                  {pendingCount > 0 && (
                    <span className={`${badgeBaseClasses} bg-red-600`}>
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Optionnel : Icône spécifique pour Admin si vous voulez un lien direct permanent vers la page sécurité */}
            {isAdmin && (
              <Link 
                to="/securite" 
                title="Gestion de la sécurité (Admin)"
                className={`${iconContainerClasses} text-slate-600 hover:text-slate-800 hover:bg-slate-100`}
              >
                <UserCog size={26} strokeWidth={1.8} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;