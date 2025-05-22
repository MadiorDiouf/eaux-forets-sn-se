// src/components/SecurityPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth, UserRole, PendingRegistration, User, UserStatus } from '../contexts/AuthContext';
import { Users, ShieldCheck, UserPlus, UserCheck, UserX, Trash2, AlertTriangle, RefreshCw } from 'lucide-react'; // Ajout de RefreshCw

const SecurityPage: React.FC = () => {
  const { 
    pendingRegistrations, 
    approveRegistration, 
    rejectRegistration, 
    users: activeUsersFromContext, // Renommer pour éviter confusion avec l'état local si besoin
    updateUserRoleAndStatus,      // Doit correspondre à ce qui est exporté par AuthContext
    deleteUserAccount,          // Doit correspondre à ce qui est exporté par AuthContext
    currentUser,
    refreshPendingRegistrations,
    refreshUsers,
    isLoading: authContextIsLoading 
  } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false); // Pour une action spécifique (approbation, etc.)

  // État pour stocker les rôles sélectionnés pour les demandes en attente
  const [selectedPendingRoles, setSelectedPendingRoles] = useState<Record<string, UserRole>>({});

  // Rafraîchir les données au montage et permettre un rafraîchissement manuel
  const fetchData = async () => {
    setIsProcessingAction(true); // Indiquer un chargement global pour le rafraîchissement
    setError(null); setSuccessMessage(null);
    try {
      await Promise.all([
        refreshPendingRegistrations(),
        refreshUsers()
      ]);
    } catch (e) {
      setError("Erreur lors du rafraîchissement des données.");
    }
    setIsProcessingAction(false);
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // S'exécute une fois au montage


  const handlePendingRoleChange = (pendingUserId: string, role: UserRole) => {
    setSelectedPendingRoles(prev => ({ ...prev, [pendingUserId]: role }));
  };

  const handleApprove = async (pendingUser: PendingRegistration) => {
    setError(null); setSuccessMessage(null); setIsProcessingAction(true);
    const roleToAssign = selectedPendingRoles[pendingUser.id] || 'lecteur';
    
    if (!pendingUser.firebaseUID) {
        setError("Impossible d'approuver : UID Firebase manquant pour cette demande.");
        setIsProcessingAction(false);
        return;
    }
    try {
        await approveRegistration(pendingUser.id, pendingUser.firebaseUID, roleToAssign);
        setSuccessMessage(`Utilisateur ${pendingUser.prenom} ${pendingUser.nom} approuvé (Rôle: ${roleToAssign}).`);
        setSelectedPendingRoles(prev => { const newState = {...prev}; delete newState[pendingUser.id]; return newState; });
        // Les listes seront mises à jour par AuthContext, mais on peut forcer ici si l'on veut une UI plus réactive
        // await fetchData(); // Optionnel, AuthContext devrait gérer via notifyDataChange normalement
    } catch (e: any) {
        setError(e.message || "Erreur lors de l'approbation.");
    }
    setIsProcessingAction(false);
  };

  const handleReject = async (pendingUser: PendingRegistration) => {
    setError(null); setSuccessMessage(null); setIsProcessingAction(true);
    if (window.confirm("Êtes-vous sûr de vouloir rejeter cette demande d'inscription ?")) {
      try {
        await rejectRegistration(pendingUser.id, pendingUser.firebaseUID);
        setSuccessMessage(`Demande de ${pendingUser.prenom} ${pendingUser.nom} rejetée.`);
      } catch (e: any) {
        setError(e.message || "Erreur lors du rejet.");
      }
    }
    setIsProcessingAction(false);
  };
  
  const handleUpdateUser = async (userId: string, newRole: UserRole, newStatus: UserStatus) => {
    setError(null); setSuccessMessage(null); setIsProcessingAction(true);
    const userToUpdate = activeUsersFromContext.find(u => u.id === userId);
    if (userToUpdate?.email === 'madiordiouf32@gmail.com' && (newRole !== 'admin' || newStatus !== 'approuve')) { // Votre email admin principal
      setError("Le rôle ou statut de l'administrateur principal ne peut être modifié de cette manière.");
      setIsProcessingAction(false);
      refreshUsers(); 
      return;
    }
    try {
      await updateUserRoleAndStatus(userId, newRole, newStatus);
      setSuccessMessage("Profil utilisateur mis à jour.");
    } catch (e: any) {
      setError(e.message || "Erreur lors de la mise à jour du profil.");
    }
    setIsProcessingAction(false);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setError(null); setSuccessMessage(null);
    const userToDelete = activeUsersFromContext.find(u => u.id === userId);
    if (userToDelete?.email === 'madiordiouf32@gmail.com') { // Votre email admin principal
      setError("L'administrateur principal ne peut pas être supprimé.");
      return;
    }
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le profil Firestore de ${userName} ? (L'utilisateur Auth ne sera pas supprimé par cette action).`)) {
      setIsProcessingAction(true);
      try {
        await deleteUserAccount(userId);
        setSuccessMessage(`Profil Firestore de ${userName} supprimé.`);
      } catch (e: any) {
        setError(e.message || "Erreur lors de la suppression du profil.");
      }
      setIsProcessingAction(false);
    }
  };

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'lecteur', label: 'Lecteur' },
    { value: 'editeur', label: 'Éditeur' },
    { value: 'admin', label: 'Administrateur' },
  ];

  const statusOptions: { value: UserStatus; label: string }[] = [
      { value: 'approuve', label: 'Approuvé' },
      { value: 'en_attente', label: 'En Attente' }, // Pourrait être utile de repasser un user en attente
      { value: 'rejete', label: 'Rejeté/Bloqué' },
  ];

  const commonInputClass = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm";
  const commonButtonClass = "px-3 py-1.5 text-xs font-medium rounded-md shadow-sm transition-colors duration-150 flex items-center disabled:opacity-50 disabled:cursor-not-allowed";
  
  const isAdmin = currentUser?.role === 'admin';

  // Protection : AdminRouteGuard gère l'accès, mais une vérification locale est bien
  if (authContextIsLoading && !currentUser) {
    return <div className="p-6 text-center">Chargement initial des données de sécurité...</div>;
  }
  if (!isAdmin) {
    return (
        <div className="p-6 text-center">
            <AlertTriangle size={48} className="mx-auto text-orange-500 mb-4" />
            <h2 className="text-xl font-semibold">Accès Restreint</h2>
            <p>Vous devez être administrateur pour accéder à cette page.</p>
        </div>
    );
  }
  // Fin Protection

  return (
    <div className="container mx-auto p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-700 flex items-center">
          <ShieldCheck size={36} className="mr-3 text-blue-600" />
          Gestion des Utilisateurs et Accès
        </h1>
        <button
          onClick={fetchData}
          disabled={isProcessingAction || authContextIsLoading}
          className={`${commonButtonClass} bg-blue-500 hover:bg-blue-600 text-white`}
          title="Rafraîchir les listes"
        >
          <RefreshCw size={16} className={`mr-1.5 ${isProcessingAction || authContextIsLoading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {(isProcessingAction || authContextIsLoading && (pendingRegistrations.length === 0 || activeUsersFromContext.length <= (currentUser ? 1: 0) ))&& (
        <div className="mb-4 text-sm text-blue-600 p-3 bg-blue-50 rounded-md shadow">Chargement des données...</div>
      )}
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg shadow-md">{error}</div>}
      {successMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg shadow-md">{successMessage}</div>}

      {/* Section des Inscriptions en Attente */}
      <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 mb-10">
        <h2 className="text-xl font-semibold text-gray-700 mb-6 pb-3 border-b border-gray-200 flex items-center">
          <UserPlus size={24} className="mr-3 text-orange-500" />
          Inscriptions en Attente ({pendingRegistrations.length})
        </h2>
        {pendingRegistrations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nom & Prénom</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Demandé le</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Assigner Rôle</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRegistrations.map(pending => (
                  <tr key={pending.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{pending.prenom} {pending.nom}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{pending.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {pending.requestedAt?.toDate ? new Date(pending.requestedAt.toDate()).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select 
                        value={selectedPendingRoles[pending.id] || 'lecteur'}
                        onChange={(e) => handlePendingRoleChange(pending.id, e.target.value as UserRole)}
                        className={commonInputClass}
                        disabled={isProcessingAction}
                      >
                        {roleOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-center space-x-2">
                      <button 
                        onClick={() => handleApprove(pending)}
                        className={`${commonButtonClass} bg-green-500 hover:bg-green-600 text-white`}
                        title="Valider l'inscription"
                        disabled={isProcessingAction}
                      >
                        <UserCheck size={16} className="mr-1.5" /> Valider
                      </button>
                      <button 
                        onClick={() => handleReject(pending)}
                        className={`${commonButtonClass} bg-red-500 hover:bg-red-600 text-white`}
                        title="Rejeter l'inscription"
                        disabled={isProcessingAction}
                      >
                        <UserX size={16} className="mr-1.5" /> Rejeter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !authContextIsLoading && <p className="text-gray-500 italic py-4 text-center">Aucune nouvelle demande d'inscription.</p>
        )}
      </div>
      
      {/* Section des Utilisateurs Actifs */}
      <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-6 pb-3 border-b border-gray-200 flex items-center">
          <Users size={24} className="mr-3 text-indigo-500" />
          {/* Afficher l'admin connecté s'il est le seul utilisateur */}
          Utilisateurs ({activeUsersFromContext.length})
        </h2>
        {authContextIsLoading && activeUsersFromContext.length === 0 ? (<p>Chargement...</p>) :
        activeUsersFromContext.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nom & Prénom</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Rôle Actuel</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Modifier Rôle</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Modifier Statut</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeUsersFromContext.map(user => {
                  const isThisUserTheMainAdmin = user.email === 'madiordiouf32@gmail.com'; // Votre email admin
                  const isThisUserTheCurrentUser = user.id === currentUser?.id;

                  return (
                    <tr key={user.id} className={`hover:bg-slate-50 ${isThisUserTheCurrentUser ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-800">{user.prenom} {user.nom} {isThisUserTheCurrentUser ? <span className="text-blue-600 font-medium">(Vous)</span> : ''}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'editeur' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-sky-100 text-sky-800'
                        }`}>
                          {roleOptions.find(r => r.value === user.role)?.label || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select 
                          value={user.role} 
                          onChange={(e) => handleUpdateUser(user.id, e.target.value as UserRole, user.status)}
                          disabled={isProcessingAction || isThisUserTheMainAdmin}
                          className={`${commonInputClass} ${isThisUserTheMainAdmin ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        >
                          {roleOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                       <td className="px-4 py-3 text-sm">
                        <select
                            value={user.status}
                            onChange={(e) => handleUpdateUser(user.id, user.role, e.target.value as UserStatus)}
                            disabled={isProcessingAction || isThisUserTheMainAdmin}
                            className={`${commonInputClass} ${isThisUserTheMainAdmin ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        >
                            {statusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {!isThisUserTheMainAdmin ? (
                          <button
                            onClick={() => handleDeleteUser(user.id, `${user.prenom} ${user.nom}`)}
                            className={`${commonButtonClass} bg-pink-600 hover:bg-pink-700 text-white`}
                            title="Supprimer le profil Firestore"
                            disabled={isProcessingAction}
                          >
                            <Trash2 size={16} className="mr-1.5" /> Supprimer
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Non modifiable</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
           !authContextIsLoading && <p className="text-gray-500 italic py-4 text-center">Aucun utilisateur actif trouvé.</p>
        )}
      </div>
      
      <div className="mt-8 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-md">
        {/* ... Note importante ... */}
         <p className="font-semibold">Note importante :</p>
        <ul className="list-disc list-inside text-sm mt-1">
          <li>La gestion des utilisateurs est maintenant liée à Firebase.</li>
          <li>La suppression d'un utilisateur ici supprime son profil de la base de données Firestore, mais pas directement de Firebase Authentication.</li>
          <li>Pour une suppression complète (Auth + Firestore), des mécanismes plus avancés (comme des Cloud Functions) sont recommandés en production.</li>
        </ul>
      </div>
    </div>
  );
};

export default SecurityPage;