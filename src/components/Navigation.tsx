// src/components/Navigation.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Database, 
  BookOpen,
  ClipboardList,
  ListChecks, 
  BarChartHorizontalBig, 
  Shield, 
  Archive, 
  ClipboardEdit, 
  TrendingUp, 
  CalendarClock, 
  CalendarCheck2,
  Sprout, 
  TreePine, 
  Flame, 
  Squirrel, 
  CloudSun, 
  Map, 
  Gavel
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface SubSubItem { id: string; label: string; path: string; icon?: JSX.Element; }
export interface SubItem { id: string; label: string; path?: string; icon?: JSX.Element; subSubItems?: SubSubItem[]; }
export interface NavigationItem { id: string; label: string; mainIcon?: JSX.Element; path?: string; subItems?: SubItem[]; }

// initialNavigationItems (INCHANGÉ)
const initialNavigationItems: NavigationItem[] = [ 
  { id: 'dsefs', label: 'Tableau de Bord', mainIcon: <Database size={18} />, path: "/" },
  {
    id: 'rapports',
    label: 'Rapports',
    mainIcon: <FileText size={18} />,
    subItems: [
      { id: 'rapports-preparation', label: 'Rapports en préparation', path: '/rapports/preparation', icon: <ListChecks size={16} className="text-orange-500"/> },
      { id: 'rapports-ptba', label: 'Plan de Travail et Budget Annuel', path: '/rapports/ptba', icon: <ClipboardEdit size={16} className="text-blue-500" /> },
      { id: 'rapports-performances', label: 'Rapports de performances', path: '/rapports/performances', icon: <TrendingUp size={16} className="text-green-500" /> },
      { id: 'rapports-annuels', label: 'Rapports annuels', path: '/rapports/annuels', icon: <CalendarClock size={16} className="text-cyan-500" /> },
      { id: 'rapports-trimestriels', label: 'Rapports trimestriels', path: '/rapports/trimestriels', icon: <CalendarCheck2 size={16} className="text-indigo-400" /> },
      { id: 'rapports-projets-defccs', label: 'Projets DEFCCS', path: '/rapports/projets-defccs', icon: <Archive size={16} className="text-purple-500"/> },
      {
        id: 'statistiques-forestieres',
        label: 'Statistiques Forestières',
        icon: <BarChartHorizontalBig size={16} className="text-indigo-600"/>,
        subSubItems: [
          { id: 'stat-drcs',        label: 'DRCS',        path: '/statistiques/drcs',        icon: <Sprout size={15} className="text-green-600"/> },
          { id: 'stat-dapf',        label: 'DAPF',        path: '/statistiques/dapf',        icon: <TreePine size={15} className="text-teal-600"/> },
          { id: 'stat-dpf',         label: 'DPF',         path: '/statistiques/dpf',         icon: <Flame size={15} className="text-red-600"/>  },
          { id: 'stat-dgf',         label: 'DGF',         path: '/statistiques/dgf',         icon: <Squirrel size={15} className="text-yellow-700"/> },
          { id: 'stat-bcc',         label: 'BCC',         path: '/statistiques/bcc',         icon: <CloudSun size={15} className="text-sky-600"/>    },
          { id: 'stat-cersi',       label: 'CERSI',       path: '/statistiques/cersi',       icon: <Map size={15} className="text-blue-600"/>     },
          { id: 'stat-bcbn',        label: 'BCBN',        path: '/statistiques/bcbn',        icon: <Gavel size={15} className="text-gray-700"/> },
        ]
      },
    ]
  },
  { id: 'documents', label: 'Documents utiles', mainIcon: <BookOpen size={18} />, path: "/documents" },
  { id: 'comptes-rendus', label: 'Comptes rendus', mainIcon: <ClipboardList size={18} />, path: "/comptes-rendus" },
  { id: 'securite', label: 'Sécurité', mainIcon: <Shield size={18} />, path: "/securite" },
];

// renderNavItem (INCHANGÉ)
const renderNavItem = (
  item: NavigationItem,
  locationPathname: string,
  expandedItem: string | null,
  expandedSubItem: string | null,
  toggleExpand: (id: string) => void,
  toggleSubExpand: (id: string) => void,
  handleLinkClick: (path: string) => void,
  commonLinkClasses: string,
  activeLinkClassesBase: string,
  inactiveLinkClassesBase: string,
  commonDropdownItemClasses: string,
  activeDropdownItemClasses: string,
  inactiveDropdownItemClasses: string,
  subSubDropdownItemClasses: string,
  activeSubSubDropdownItemClasses: string
) => {
  let isParentEffectivelyActive = locationPathname === item.path;
  if (item.subItems) {
    isParentEffectivelyActive = isParentEffectivelyActive || item.subItems.some(sub =>
      (sub.path && (locationPathname === sub.path || locationPathname.startsWith(sub.path + '/'))) ||
      (sub.subSubItems && sub.subSubItems.some(sss => locationPathname === sss.path || locationPathname.startsWith(sss.path + '/')))
    );
  }
  const currentLinkClasses = isParentEffectivelyActive || expandedItem === item.id ? activeLinkClassesBase : inactiveLinkClassesBase;

  return (
    <div key={item.id} className="relative group my-1">
      {item.subItems ? (
        <button onClick={() => toggleExpand(item.id)} className={`${commonLinkClasses} ${currentLinkClasses}`}>
          {item.mainIcon && <span>{React.cloneElement(item.mainIcon, { size: 22 })}</span>}
          <span>{item.label}</span>
          <span className="ml-2"><ChevronDown size={20} className={`transition-transform duration-200 ${expandedItem === item.id ? 'rotate-180' : ''}`} /></span>
        </button>
      ) : (
        <button onClick={() => handleLinkClick(item.path || '/')} className={`${commonLinkClasses} ${locationPathname === item.path ? activeLinkClassesBase : inactiveLinkClassesBase}`}>
          {item.mainIcon && <span>{React.cloneElement(item.mainIcon, { size: 22 })}</span>}
          <span>{item.label}</span>
        </button>
      )}

      {item.subItems && expandedItem === item.id && (
        <div className="absolute z-20 w-72 mt-2 py-1 bg-white border border-gray-200 rounded-md shadow-xl animate-fadeIn">
          {item.subItems.map((subItem) => {
            let isSubItemEffectivelyActive = subItem.path ? (locationPathname === subItem.path || locationPathname.startsWith(subItem.path + '/')) : false;
            if (subItem.subSubItems && !isSubItemEffectivelyActive) {
              isSubItemEffectivelyActive = subItem.subSubItems.some(sss => locationPathname === sss.path || locationPathname.startsWith(sss.path + '/'));
            }
            const subItemDisplayClasses = isSubItemEffectivelyActive || expandedSubItem === subItem.id ? activeDropdownItemClasses : inactiveDropdownItemClasses;

            return (
              <div key={subItem.id} className="relative">
                {subItem.subSubItems ? (
                  <button onClick={() => toggleSubExpand(subItem.id)} className={`${commonDropdownItemClasses} ${subItemDisplayClasses}`}>
                    <span className="flex-grow">{subItem.label}</span>
                    {subItem.icon && <span className="ml-3 mr-1">{React.cloneElement(subItem.icon, { size: 18 })}</span>}
                    <ChevronRight size={16} className={`transition-transform duration-200 ${expandedSubItem === subItem.id ? 'rotate-90' : ''}`} />
                  </button>
                ) : (
                  <button onClick={() => handleLinkClick(subItem.path || '/')} className={`${commonDropdownItemClasses} ${subItemDisplayClasses}`}>
                    <span className="flex-grow">{subItem.label}</span>
                    {subItem.icon && <span className="ml-3">{React.cloneElement(subItem.icon, { size: 18 })}</span>}
                  </button>
                )}

                {subItem.subSubItems && expandedSubItem === subItem.id && (
                  <div className="absolute left-full top-0 mt-0 ml-0.5 w-max min-w-[250px] max-w-xs bg-white border border-gray-200 rounded-md shadow-lg py-1 animate-fadeIn">
                    {subItem.subSubItems.map((subSubItem) => (
                      <button
                        key={subSubItem.id}
                        onClick={() => handleLinkClick(subSubItem.path)}
                        className={`${subSubDropdownItemClasses} ${locationPathname === subSubItem.path ? activeSubSubDropdownItemClasses : 'hover:bg-green-50'}`}
                      >
                        <span className="flex-grow">{subSubItem.label}</span>
                        {subSubItem.icon && <span className="ml-2">{React.cloneElement(subSubItem.icon, { size: 15 })}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Navigation (INCHANGÉ SAUF LA CLASSE DE <nav>)
const Navigation: React.FC = () => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [expandedSubItem, setExpandedSubItem] = useState<string | null>(null);
  const location = useLocation();
  const subMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const closeAllMenus = () => { 
    setExpandedItem(null);
    setExpandedSubItem(null);
  };
  const handleLinkClick = (path: string) => { 
    navigate(path);
    setTimeout(() => {
      closeAllMenus();
    }, 0); 
  };
  useEffect(() => { 
    let parentToExpand: string | null = null;
    let subItemToExpand: string | null = null;
    for (const item of initialNavigationItems) {
      if (item.subItems) {
        for (const subItem of item.subItems) {
          if (subItem.path === location.pathname || (subItem.path && location.pathname.startsWith(subItem.path + '/'))) {
            parentToExpand = item.id;
            if (subItem.subSubItems && subItem.subSubItems.some(sss => location.pathname === sss.path || location.pathname.startsWith(sss.path + '/'))) {
                subItemToExpand = subItem.id;
            }
            break; 
          }
          if (subItem.subSubItems && subItem.subSubItems.some(sss => 
                location.pathname === sss.path || location.pathname.startsWith(sss.path + '/')
             )) {
            parentToExpand = item.id;
            subItemToExpand = subItem.id;
            break; 
          }
        }
      }
      if (parentToExpand) break; 
    }
    if (!parentToExpand && location.pathname.startsWith('/rapports/')) {
        parentToExpand = 'rapports'; 
    } else if (!parentToExpand && location.pathname.startsWith('/statistiques/')) {
      parentToExpand = 'rapports'; 
      subItemToExpand = 'statistiques-forestieres'; 
    }
    setExpandedItem(parentToExpand);
    setExpandedSubItem(subItemToExpand);
  }, [location.pathname]); 
  const toggleExpand = (id: string) => { 
    const isOpeningNew = expandedItem !== id;
    setExpandedItem(isOpeningNew ? id : null);
    if (isOpeningNew || expandedItem === id) { 
      setExpandedSubItem(null);
    }
  };
  const toggleSubExpand = (subId: string) => { 
    setExpandedSubItem(prev => (prev === subId ? null : subId));
  };
  useEffect(() => { 
    const handleClickOutside = (event: MouseEvent) => {
      if (subMenuRef.current && !subMenuRef.current.contains(event.target as Node)) {
        closeAllMenus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); 

  const commonLinkClasses = "flex items-center space-x-2.5 px-6 py-4 text-base font-bold transition-all duration-200 ease-in-out transform";
  const activeLinkClassesBase = "text-green-700 border-b-2 border-green-600 scale-105";
  const inactiveLinkClassesBase = "text-gray-700 hover:text-green-700 hover:bg-green-50 hover:scale-105";
  const commonDropdownItemClasses = "flex items-center justify-between w-full text-left px-4 py-3 text-sm font-semibold transition-colors duration-150";
  const activeDropdownItemClasses = "bg-green-100 text-green-800";
  const inactiveDropdownItemClasses = "text-gray-700 hover:bg-green-50 hover:text-green-800";
  const subSubDropdownItemClasses = "flex items-center justify-between w-full text-left px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-800";
  const activeSubSubDropdownItemClasses = "bg-green-100 text-green-800 font-bold";
  
  return (
    // MODIFIÉ : "shadow-sm" et "mt-1" retirés de className
    <nav className="bg-white py-1" ref={subMenuRef}>
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-center md:justify-start items-center space-x-0.5 md:space-x-1">
          {initialNavigationItems.map((item) => (
            renderNavItem(
                item,
                location.pathname,
                expandedItem,
                expandedSubItem,
                toggleExpand,
                toggleSubExpand,
                handleLinkClick,
                commonLinkClasses, activeLinkClassesBase, inactiveLinkClassesBase,
                commonDropdownItemClasses, activeDropdownItemClasses, inactiveDropdownItemClasses,
                subSubDropdownItemClasses, activeSubSubDropdownItemClasses
            )
          ))}
        </div>
      </div>
    </nav>
  );
};
export default Navigation;