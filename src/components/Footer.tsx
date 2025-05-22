// src/components/Footer.tsx
import React from 'react';
// MODIFICATION ICI: Importer useAuth depuis le contexte
import { useAuth } from '../contexts/AuthContext'; // Assurez-vous que le chemin est correct
import { LogOut } from 'lucide-react'; 

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  // Le hook useAuth vient maintenant du contexte global
  const { currentUser: user, logout } = useAuth(); // Renommer currentUser en user pour correspondre à votre code existant

  return (
    <footer className="bg-slate-800 text-slate-300 py-4 mt-auto shadow-inner"> 
      <div className="container mx-auto px-4 sm:px-6 lg:px-8"> 
        <div className="flex flex-col sm:flex-row justify-between items-center">
          {/* Copyright à gauche */}
          <div className="text-center sm:text-left mb-3 sm:mb-0">
            <p className="text-xs sm:text-sm">© {currentYear} Plateforme de Suivi et Évaluation. Tous droits réservés.</p>
          </div>
          
          {/* Informations utilisateur et déconnexion à droite */}
          {user && (
            <div className="flex items-center space-x-3 text-xs sm:text-sm">
              {/* Affichage du nom/prénom si disponibles, sinon l'email */}
              <span>Connecté en tant que: <span className="font-semibold text-slate-100">{user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email}</span> ({user.role})</span>
              <button 
                onClick={logout}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white font-medium py-1.5 px-3 rounded-md transition-colors duration-150 ease-in-out text-xs shadow"
                title="Se déconnecter"
              >
                <LogOut size={14} className="mr-1.5" />
                Déconnexion
              </button>
            </div>
          )}

          {/* Liens optionnels (si pas d'utilisateur connecté ou si vous voulez les garder) */}
          {!user && (
            <div className="flex space-x-4 text-xs sm:text-sm">
              {/* Si vous voulez utiliser react-router-dom pour ces liens aussi, remplacez <a> par <Link> */}
              <a href="#" className="hover:text-white transition-colors">Assistance</a>
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;