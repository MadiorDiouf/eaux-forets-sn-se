// src/components/divisions/DivisionSubNav.tsx
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react'; // Pour les sous-menus déroulants

export interface SubSubNavItem {
  label: string;
  path: string; // Path complet, ex: 'realisations-physiques/plantations-massives'
}
export interface SubNavItem {
  label: string;
  path?: string; // Path relatif à basePath, ex: 'jna'. Peut être vide si c'est un parent de sous-menu.
  subItems?: SubSubNavItem[]; // Pour les menus déroulants
}

interface DivisionSubNavProps {
  items: SubNavItem[];
  basePath: string; // Ex: /statistiques/drcs
}

const DivisionSubNav: React.FC<DivisionSubNavProps> = ({ items, basePath }) => {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const activeStyle = "bg-blue-600 text-white";
  const inactiveStyle = "bg-white text-blue-700 hover:bg-blue-100";
  const commonStyle = "px-4 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm border border-blue-200";

  const activeDropdownParentStyle = "bg-blue-500 text-white"; // Style pour le parent d'un sous-item actif

  return (
    <nav className="mb-6 bg-gray-50 p-3 rounded-lg shadow">
      <ul className="flex flex-wrap items-center gap-2">
        {items.map((item) => {
          // Déterminer si le parent du dropdown est actif
          let isDropdownParentActive = false;
          if (item.subItems) {
            isDropdownParentActive = item.subItems.some(sub => 
                location.pathname === `${basePath}/${sub.path}` || 
                location.pathname.startsWith(`${basePath}/${sub.path}/`)
            );
          }

          return (
            <li key={item.label} className="relative">
              {!item.subItems ? (
                <NavLink
                  to={`${basePath}/${item.path}`}
                  className={({ isActive }) => `${commonStyle} ${isActive ? activeStyle : inactiveStyle}`}
                >
                  {item.label}
                </NavLink>
              ) : (
                // Gestion du menu déroulant pour "Réalisations physiques"
                <div>
                  <button
                    onClick={() => toggleDropdown(item.label)}
                    className={`${commonStyle} flex items-center justify-between min-w-[200px] ${openDropdown === item.label || isDropdownParentActive ? activeDropdownParentStyle : inactiveStyle}`}
                  >
                    {item.label}
                    {openDropdown === item.label ? <ChevronDown size={18} className="ml-2 -mr-1" /> : <ChevronRight size={18} className="ml-2 -mr-1" />}
                  </button>
                  {openDropdown === item.label && item.subItems && (
                    <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-30 py-1">
                      {item.subItems.map((subItem) => (
                        <NavLink
                          key={subItem.label}
                          to={`${basePath}/${subItem.path}`}
                          className={({ isActive }) => 
                            `block px-4 py-2.5 text-sm ${isActive ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`
                          }
                          onClick={() => setOpenDropdown(null)} // Ferme le dropdown au clic
                        >
                          {subItem.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default DivisionSubNav;