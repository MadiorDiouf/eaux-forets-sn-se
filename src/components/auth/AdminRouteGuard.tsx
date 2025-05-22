// src/components/auth/AdminRouteGuard.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Ajustez le chemin si AuthContext.tsx est ailleurs

interface AdminRouteGuardProps {
  // Vous pouvez ajouter des props si nécessaire
}

const AdminRouteGuard: React.FC<AdminRouteGuardProps> = () => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Affichez un indicateur de chargement pendant que l'état d'authentification est vérifié
    return <div className="flex justify-center items-center min-h-screen"><p>Vérification de l'authentification admin...</p></div>; 
  }

  if (!currentUser) {
    // Utilisateur non connecté, rediriger vers la page de connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser.status !== 'approuve') {
    // Si l'admin potentiel n'est même pas encore approuvé, il ne peut pas accéder aux routes admin.
    // Le rediriger vers la page d'attente de validation.
    if (location.pathname !== '/en-attente-validation') {
         return <Navigate to="/en-attente-validation" replace />;
    }
     // S'il est déjà sur la page d'attente, on le laisse là (ce cas est rare pour un admin mais bon à avoir)
     return <Outlet /> // ou un message spécifique
  }

  if (currentUser.role !== 'admin') {
    // Utilisateur connecté et approuvé, mais pas admin.
    // Rediriger vers une page d'accès refusé ou la page d'accueil.
    console.warn("Accès admin refusé : L'utilisateur n'a pas le rôle 'admin'.", currentUser);
    // Vous pourriez vouloir créer une page "/unauthorized" ou simplement rediriger à l'accueil.
    return <Navigate to="/" replace />; 
  }

  // Utilisateur connecté, approuvé, et est admin. Afficher le contenu de la route admin.
  return <Outlet />; 
};

export default AdminRouteGuard; // <<< LIGNE AJOUTÉE/ASSURÉE