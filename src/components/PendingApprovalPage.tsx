// src/components/PendingApprovalPage.tsx
import React from 'react';
import { Link } from 'react-router-dom'; // TRÈS IMPORTANT: L'import pour le lien

const PendingApprovalPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-center p-4">
      <div className="bg-white p-8 sm:p-10 md:p-12 rounded-xl shadow-2xl w-full max-w-md border-t-4 border-yellow-500">
        {/* Icône d'horloge/attente */}
        <svg 
          className="mx-auto h-16 w-16 text-yellow-500 mb-6" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth="1.5" 
          stroke="currentColor" 
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
          Inscription en Attente
        </h2>
        <p className="text-base text-gray-600 mb-3">
          Merci pour votre inscription ! Votre demande est en cours de traitement.
        </p>
        <p className="text-base text-gray-600 mb-6">
          Un administrateur validera votre compte prochainement. Vous recevrez une notification une fois votre compte activé.
        </p>
        
        {/* Bouton de retour à la connexion */}
        <div className="mt-8">
          <Link
            to="/login" // Ceci est la destination du lien
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            Retour à la page de Connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;