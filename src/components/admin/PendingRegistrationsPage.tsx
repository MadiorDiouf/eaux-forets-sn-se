// src/components/admin/PendingRegistrationsPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth, PendingRegistration, UserRole } from '../../contexts/AuthContext'; // Ajustez le chemin

const PendingRegistrationsPage: React.FC = () => {
  const { 
    pendingRegistrations, 
    approveRegistration, 
    rejectRegistration,
    refreshPendingRegistrations, // Pour recharger la liste
    isLoading 
  } = useAuth();
  
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Charger ou rafraîchir les demandes au montage de la page
    refreshPendingRegistrations(); 
  }, [refreshPendingRegistrations]);

  const handleApprove = async (pendingItem: PendingRegistration, roleToAssign: UserRole) => {
    setError(null);
    setSuccessMessage(null);
    if (!pendingItem.firebaseUID) {
        setError("Impossible d'approuver : UID Firebase manquant pour cette demande.");
        return;
    }
    try {
      await approveRegistration(pendingItem.id, pendingItem.firebaseUID, roleToAssign);
      setSuccessMessage(`L'utilisateur ${pendingItem.prenom} ${pendingItem.nom} a été approuvé avec le rôle ${roleToAssign}.`);
      // La liste pendingRegistrations sera mise à jour par AuthContext après l'appel et le re-fetch
    } catch (e: any) {
      console.error("Erreur lors de l'approbation:", e);
      setError(e.message || "Une erreur est survenue lors de l'approbation.");
    }
  };

  const handleReject = async (pendingItem: PendingRegistration) => {
    setError(null);
    setSuccessMessage(null);
    try {
      await rejectRegistration(pendingItem.id, pendingItem.firebaseUID);
      setSuccessMessage(`L'inscription de ${pendingItem.prenom} ${pendingItem.nom} a été rejetée.`);
    } catch (e: any) {
      console.error("Erreur lors du rejet:", e);
      setError(e.message || "Une erreur est survenue lors du rejet.");
    }
  };

  if (isLoading && pendingRegistrations.length === 0) { // Afficher chargement si la liste est vide et qu'on charge
    return <div className="p-4">Chargement des demandes en attente...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Demandes d'Inscription en Attente</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {successMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{successMessage}</div>}

      {pendingRegistrations.length === 0 ? (
        <p className="text-gray-600">Aucune demande d'inscription en attente pour le moment.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prénom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demandé le</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingRegistrations.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.nom}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.prenom}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item.requestedAt ? new Date(item.requestedAt.toDate()).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                    {/* Logique pour sélectionner un rôle avant d'approuver */}
                    <select 
                        defaultValue="lecteur" // Rôle par défaut à assigner
                        id={`role-${item.id}`}
                        className="p-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="lecteur">Lecteur</option>
                      <option value="editeur">Éditeur</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => {
                        const roleSelect = document.getElementById(`role-${item.id}`) as HTMLSelectElement;
                        handleApprove(item, roleSelect.value as UserRole);
                      }}
                      className="text-green-600 hover:text-green-800 hover:underline transition-colors duration-150"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => handleReject(item)}
                      className="text-red-600 hover:text-red-800 hover:underline transition-colors duration-150"
                    >
                      Rejeter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingRegistrationsPage;