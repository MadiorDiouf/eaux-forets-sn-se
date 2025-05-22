// src/components/EnAttenteValidationPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const EnAttenteValidationPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
        <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">Inscription en Attente</h2>
        <p className="mt-2 text-sm text-gray-600">
          Merci pour votre inscription ! Votre demande est en cours de traitement. Un administrateur
          validera votre compte prochainement.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Vous serez notifié par email une fois votre compte activé. (Note: l'envoi d'email n'est pas implémenté dans cette version).
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retour à la page de Connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EnAttenteValidationPage;