// src/components/auth/ProtectedRouteGuard.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Ajustez le chemin si AuthContext.tsx est ailleurs

interface ProtectedRouteGuardProps {
  // Vous pouvez ajouter des props si nécessaire
}

const ProtectedRouteGuard: React.FC<ProtectedRouteGuardProps> = () => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Affichez un indicateur de chargement pendant que l'état d'authentification est vérifié
    // Vous pouvez personnaliser ce message ou utiliser un spinner/composant de chargement
    return <div className="flex justify-center items-center min-h-screen"><p>Chargement de la session...</p></div>; 
  }

  if (!currentUser) {
    // Utilisateur non connecté, rediriger vers la page de connexion
    // en sauvegardant l'emplacement actuel pour une redirection après connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser.status !== 'approuve') {
    // Utilisateur connecté mais son statut n'est pas 'approuve'
    // (pourrait être 'en_attente' ou un autre statut que vous gérez)
    // Rediriger vers la page '/en-attente-validation'
    // Si l'utilisateur est déjà sur la page '/en-attente-validation', ne pas rediriger en boucle.
    if (location.pathname !== '/en-attente-validation') {
      return <Navigate to="/en-attente-validation" replace />;
    }
  }
  
  // Si l'utilisateur est 'approuve' mais se retrouve sur '/en-attente-validation', le rediriger
  if (currentUser.status === 'approuve' && location.pathname === '/en-attente-validation') {
    return <Navigate to="/" replace />;
  }

  // Utilisateur connecté et son statut est 'approuve' (ou autre statut permettant l'accès)
  // Afficher le contenu de la route protégée
  return <Outlet />; 
};

export default ProtectedRouteGuard; // <<< LIGNE AJOUTÉE/ASSURÉE