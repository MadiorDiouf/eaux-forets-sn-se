// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // <<< AJOUT DE useLocation
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    User as FirebaseUser,
    AuthError
} from "firebase/auth";
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    collection, 
    getDocs, 
    query, 
    where, 
    serverTimestamp,
    Timestamp
} from "firebase/firestore";
import { auth as firebaseAuth, db as firestoreDb } from '../firebaseConfig';
import { useData } from './DataContext'; 

// --- Types ---
export type UserRole = 'lecteur' | 'editeur' | 'admin';
export type UserStatus = 'approuve' | 'en_attente' | 'rejete';

export interface User {
  id: string; 
  nom: string;
  prenom: string;
  email: string; 
  role: UserRole;
  status: UserStatus;
  createdAt?: Timestamp;
}

export interface PendingRegistration {
  id: string; 
  nom: string;
  prenom: string;
  email: string;
  requestedAt: Timestamp;
  firebaseUID?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean, error?: string }>;
  logout: () => Promise<void>;
  register: (nom: string, prenom: string, email: string, pass: string) => Promise<{ success: boolean, error?: string, requiresValidation?: boolean }>;
  pendingRegistrations: PendingRegistration[];
  approveRegistration: (pendingId: string, firebaseUID: string, role: UserRole) => Promise<void>;
  rejectRegistration: (pendingId: string, firebaseUID?: string) => Promise<void>;
  users: User[];
  updateUserRoleAndStatus: (userId: string, newRole: UserRole, newStatus: UserStatus) => Promise<void>;
  deleteUserAccount: (userId: string) => Promise<void>;
  refreshPendingRegistrations: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_COLLECTION = 'users';
const PENDING_REGISTRATIONS_COLLECTION = 'pending_registrations';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // <<< AJOUTER useLocation
  const { notifyDataChange } = useData();

  const fetchUsers = async () => {
    try {
        const usersQuery = query(collection(firestoreDb, USERS_COLLECTION)); // On récupère tous les users, le filtrage par status peut se faire au besoin
        const querySnapshot = await getDocs(usersQuery);
        const fetchedUsers: User[] = [];
        querySnapshot.forEach((doc) => {
            fetchedUsers.push({ id: doc.id, ...doc.data() } as User);
        });
        setUsers(fetchedUsers);
    } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
        setUsers([]);
    }
  };

  const fetchPendingRegistrations = async () => {
    try {
        const pendingQuery = query(collection(firestoreDb, PENDING_REGISTRATIONS_COLLECTION));
        const querySnapshot = await getDocs(pendingQuery);
        const fetchedPending: PendingRegistration[] = [];
        querySnapshot.forEach((doc) => {
            fetchedPending.push({ id: doc.id, ...doc.data() } as PendingRegistration);
        });
        setPendingRegistrations(fetchedPending);
    } catch (error) {
        console.error("Erreur lors de la récupération des inscriptions en attente:", error);
        setPendingRegistrations([]);
    }
  };
  
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(firestoreDb, USERS_COLLECTION, firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const appUser = { id: firebaseUser.uid, ...userDocSnap.data() } as User;
          if (appUser.status === 'approuve') {
            setCurrentUser(appUser);
            if (location.pathname === '/login' || location.pathname === '/en-attente-validation') {
                 navigate('/');
            }
          } else { 
            setCurrentUser(null);
            // Ne pas déconnecter immédiatement de Firebase Auth ici,
            // pour permettre à la page /en-attente-validation de fonctionner si elle a besoin d'une info.
            // La logique de redirection se fera en fonction du chemin actuel.
            if (location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/en-attente-validation') {
                navigate('/en-attente-validation');
            }
          }
        } else { 
          const pendingDocRef = doc(firestoreDb, PENDING_REGISTRATIONS_COLLECTION, firebaseUser.uid);
          const pendingDocSnap = await getDoc(pendingDocRef);
          
          setCurrentUser(null); // L'utilisateur n'est pas "approuvé" dans l'app
          if (pendingDocSnap.exists()) {
             if (location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/en-attente-validation') {
                navigate('/en-attente-validation'); 
             }
          } else {
            console.warn("Profil Firestore et demande en attente introuvables pour l'utilisateur authentifié:", firebaseUser.uid, "Déconnexion de la session Firebase.");
            await signOut(firebaseAuth); 
            if (location.pathname !== '/login' && location.pathname !== '/register') {
                // navigate('/login'); // On pourrait rediriger ici mais attention aux boucles si le logout déclenche ce useffect
            }
          }
        }
      } else { 
        setCurrentUser(null);
        // Si l'utilisateur est déconnecté et n'est pas sur une page publique,
        // le rediriger vers login peut être géré par ProtectedRouteGuard.
        // Éviter les navigate() ici peut réduire les complexités de redirection en boucle.
      }
      setIsLoading(false);
    });

    // Consider moving these fetches if they are not always needed on auth state change,
    // or if they should only run when a certain type of user is logged in (e.g., admin)
    fetchUsers(); 
    fetchPendingRegistrations();

    return () => unsubscribe();
  }, [navigate, location]); // <<< AJOUTER location aux dépendances


  const login = async (email: string, pass: string): Promise<{ success: boolean, error?: string }> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, pass);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      console.error("Erreur Firebase login:", error);
      const authError = error as AuthError;
      let message = "Email ou mot de passe incorrect.";
      if (authError.code) {
        switch (authError.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-email':
                message = "Email ou mot de passe incorrect.";
                break;
            case 'auth/user-disabled':
                message = "Ce compte a été désactivé.";
                break;
            case 'auth/invalid-credential': // Nouvelle Firebase SDK peut retourner ceci pour user-not-found ou wrong-password
                message = "Identifiants invalides. Veuillez vérifier votre email et mot de passe.";
                break;
            default:
                message = "Erreur de connexion. Veuillez réessayer.";
        }
      }
      return { success: false, error: message };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(firebaseAuth);
      // onAuthStateChanged mettra currentUser à null.
      // La redirection vers /login est gérée par ProtectedRouteGuard si l'utilisateur quitte une page protégée.
      // Si l'on veut forcer une redirection spécifique ici :
      navigate('/login'); 
    } catch (error) {
      console.error("Erreur lors de la déconnexion Firebase :", error);
    }
  };

  const register = async (nom: string, prenom: string, email: string, pass: string): Promise<{ success: boolean, error?: string, requiresValidation?: boolean }> => {
    setIsLoading(true);
    try {
      const userQuery = query(collection(firestoreDb, USERS_COLLECTION), where("email", "==", email));
      const pendingQuery = query(collection(firestoreDb, PENDING_REGISTRATIONS_COLLECTION), where("email", "==", email));
      const userSnap = await getDocs(userQuery);
      const pendingSnap = await getDocs(pendingQuery);

      if (!userSnap.empty || !pendingSnap.empty) {
        setIsLoading(false);
        return { success: false, error: "Cette adresse e-mail est déjà utilisée." };
      }

      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
      const firebaseUser = userCredential.user;

      const newPendingDoc: Omit<PendingRegistration, 'id'> = {
        firebaseUID: firebaseUser.uid,
        nom,
        prenom,
        email: firebaseUser.email!,
        requestedAt: serverTimestamp() as Timestamp,
      };
      await setDoc(doc(firestoreDb, PENDING_REGISTRATIONS_COLLECTION, firebaseUser.uid), newPendingDoc);
      
      await fetchPendingRegistrations();
      notifyDataChange();
      setIsLoading(false);
      return { success: true, requiresValidation: true };

    } catch (error: any) {
      setIsLoading(false);
      console.error("Erreur Firebase register:", error);
      const authError = error as AuthError;
      let message = "Erreur lors de l'inscription.";
       if (authError.code) {
        switch (authError.code) {
            case 'auth/email-already-in-use':
                message = "Cette adresse e-mail est déjà utilisée.";
                break;
            case 'auth/invalid-email':
                message = "L'adresse e-mail n'est pas valide.";
                break;
            case 'auth/weak-password':
                message = "Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.";
                break;
            default:
                message = "Erreur d'inscription. Veuillez réessayer.";
        }
      }
      return { success: false, error: message };
    }
  };

  const approveRegistration = async (pendingId: string, firebaseUID: string, role: UserRole): Promise<void> => {
    const pendingDocRef = doc(firestoreDb, PENDING_REGISTRATIONS_COLLECTION, firebaseUID);
    const pendingDocSnap = await getDoc(pendingDocRef);

    if (!pendingDocSnap.exists()) {
      console.error("Demande d'inscription introuvable:", firebaseUID);
      return;
    }
    const pendingData = pendingDocSnap.data() as PendingRegistration;

    const newUserForFirestore: Omit<User, 'id'> = {
      nom: pendingData.nom,
      prenom: pendingData.prenom,
      email: pendingData.email,
      role: role,
      status: 'approuve',
      createdAt: serverTimestamp() as Timestamp,
    };

    try {
      const userDocRef = doc(firestoreDb, USERS_COLLECTION, firebaseUID);
      await setDoc(userDocRef, newUserForFirestore);
      await deleteDoc(pendingDocRef);

      await fetchUsers();
      await fetchPendingRegistrations();
      notifyDataChange();
    } catch (error) {
        console.error("Erreur lors de l'approbation de l'inscription :", error)
    }
  };

  const rejectRegistration = async (pendingId: string, firebaseUID?: string): Promise<void> => {
    const docIdToDelete = firebaseUID || pendingId;
    const pendingDocRef = doc(firestoreDb, PENDING_REGISTRATIONS_COLLECTION, docIdToDelete);
    try {
        await deleteDoc(pendingDocRef);
        // Ici, vous pourriez aussi vouloir supprimer l'utilisateur de Firebase Auth
        // if (firebaseUID) { /* appeler une cloud function pour delete admin.auth().deleteUser(firebaseUID) */ }
        await fetchPendingRegistrations();
        notifyDataChange();
    } catch (error) {
        console.error("Erreur lors du rejet de l'inscription :", error);
    }
  };

  const updateUserRoleAndStatus = async (userId: string, newRole: UserRole, newStatus: UserStatus): Promise<void> => {
    const userDocRef = doc(firestoreDb, USERS_COLLECTION, userId);
    try {
        await updateDoc(userDocRef, {
            role: newRole,
            status: newStatus,
        });
        if (currentUser && currentUser.id === userId) {
            setCurrentUser(prev => prev ? { ...prev, role: newRole, status: newStatus } : null);
        }
        await fetchUsers();
        notifyDataChange();
    } catch (error) {
        console.error("Erreur lors de la mise à jour du rôle/statut :", error);
    }
  };

  const deleteUserAccount = async (userId: string): Promise<void> => {
    console.warn(`La suppression de l'authentification Firebase pour ${userId} doit être gérée séparément (ex: Cloud Function). Seul le document Firestore sera supprimé.`);
    const userDocRef = doc(firestoreDb, USERS_COLLECTION, userId);
    try {
        await deleteDoc(userDocRef);
        if (currentUser && currentUser.id === userId) {
            await logout();
        } else {
            await fetchUsers();
        }
        notifyDataChange();
    } catch (error) {
        console.error("Erreur lors de la suppression du compte utilisateur (document Firestore) :", error);
    }
  };


  const contextValue: AuthContextType = {
    currentUser,
    isLoading,
    login,
    logout,
    register,
    pendingRegistrations,
    approveRegistration,
    rejectRegistration,
    users,
    updateUserRoleAndStatus,
    deleteUserAccount,
    refreshPendingRegistrations: fetchPendingRegistrations,
    refreshUsers: fetchUsers,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};