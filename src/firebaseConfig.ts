// src/firebaseConfig.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
// Si vous aviez besoin de Storage (PAS POUR L'INSTANT, MAIS POUR INFO)
// import { getStorage, FirebaseStorage } from "firebase/storage";

// IMPORTANT : Ce sont les variables que vous allez définir dans Netlify plus tard
// Et pour le développement local, nous créerons un fichier .env.local
const firebaseConfigValues = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // Même si on ne l'utilise pas activement, il fait partie de la config standard
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Vérifiez que toutes les valeurs sont bien des chaînes de caractères (ou undefined)
// Ceci est plus pour la robustesse et pour TypeScript.
const cleanConfig = Object.fromEntries(
    Object.entries(firebaseConfigValues).map(([key, value]) => [key, typeof value === 'string' ? value : undefined])
) as { [key in keyof typeof firebaseConfigValues]: string | undefined };


// Initialiser Firebase
// On s'assure que toutes les clés nécessaires sont présentes avant d'initialiser
// Cela évite les erreurs si une variable d'environnement est manquante
let app: FirebaseApp;
if (
    cleanConfig.apiKey &&
    cleanConfig.authDomain &&
    cleanConfig.projectId &&
    cleanConfig.appId
) {
    app = initializeApp(cleanConfig);
} else {
    console.error(
        "Configuration Firebase manquante ou incomplète. Vérifiez vos variables d'environnement (VITE_FIREBASE_...)."
    );
    // Créez une app 'dummy' pour éviter des erreurs plus loin si les modules sont importés
    // mais elle ne fonctionnera pas réellement.
    // Vous pourriez aussi choisir de lancer une erreur ici : throw new Error("Config Firebase manquante");
    app = initializeApp({}); // Ceci n'est pas idéal mais évite des crashs à l'import.
}

// Exporter les services Firebase pour les utiliser dans votre application
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
// Si vous aviez besoin de Storage (PAS POUR L'INSTANT)
// export const storage: FirebaseStorage = getStorage(app);

export default app; // Vous pouvez aussi exporter 'app' si besoin