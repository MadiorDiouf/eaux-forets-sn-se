// src/components/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { useAuth } from '../contexts/AuthContext'; 

const LoginPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regNom, setRegNom] = useState('');
  const [regPrenom, setRegPrenom] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register, isLoading: authIsLoading } = useAuth(); // Récupérer isLoading du contexte si besoin, mais celui local suffit
  const navigate = useNavigate();

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    // CORRECTION ICI : utiliser l'objet retourné par login()
    const result = await login(loginEmail, loginPassword);
    setIsLoading(false);
    if (!result.success) {
      // CORRECTION ICI : utiliser result.error s'il existe
      setError(result.error || 'Email ou mot de passe incorrect.');
    }
    // La redirection en cas de succès est gérée dans AuthContext via onAuthStateChanged
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    if (regPassword !== regConfirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if(regPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setIsLoading(true);
    // CORRECTION ICI : utiliser l'objet retourné par register()
    const result = await register(regNom, regPrenom, regEmail, regPassword);
    setIsLoading(false);
    if (result.success) {
      // Vider les champs seulement en cas de succès total ou de validation requise
      setRegNom(''); setRegPrenom(''); setRegEmail(''); setRegPassword(''); setRegConfirmPassword('');
      if (result.requiresValidation) {
          setSuccessMessage("Inscription réussie ! Votre compte est en attente de validation par un administrateur.");
          navigate('/en-attente-validation'); 
      } else {
          // Ce cas ne devrait pas arriver avec la logique actuelle de register, mais pour être complet
          setSuccessMessage("Inscription réussie !"); 
          // Normalement onAuthStateChanged devrait rediriger si l'utilisateur est automatiquement connecté
      }
    } else {
      // CORRECTION ICI : utiliser result.error s'il existe
      setError(result.error || "Erreur lors de l'inscription. L'email est peut-être déjà utilisé ou une erreur s'est produite.");
    }
  };

  const inputClass = "mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const buttonClass = "w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out";

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="p-8 bg-white rounded-xl shadow-2xl w-full max-w-md border-t-4 border-blue-600">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">
          {isLoginView ? 'Connexion' : 'Inscription'}
        </h2>

        {error && <p className="mb-4 text-sm text-red-600 text-center p-3 bg-red-100 rounded-md">{error}</p>}
        {successMessage && !error && <p className="mb-4 text-sm text-green-600 text-center p-3 bg-green-100 rounded-md">{successMessage}</p>}
        
        {isLoginView ? (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">Adresse e-mail</label>
              <input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label htmlFor="login-password"className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <button type="submit" disabled={isLoading || authIsLoading} className={buttonClass}>
                {isLoading || authIsLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-nom" className="block text-sm font-medium text-gray-700">Nom</label>
                <input id="reg-nom" type="text" value={regNom} onChange={(e) => setRegNom(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label htmlFor="reg-prenom" className="block text-sm font-medium text-gray-700">Prénom</label>
                <input id="reg-prenom" type="text" value={regPrenom} onChange={(e) => setRegPrenom(e.target.value)} required className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">Adresse e-mail</label>
              <input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label htmlFor="reg-password"className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <input id="reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label htmlFor="reg-confirm-password"className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
              <input id="reg-confirm-password" type="password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <button type="submit" disabled={isLoading || authIsLoading} className={buttonClass}>
                {isLoading || authIsLoading ? 'Inscription...' : 'S\'inscrire'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <button 
            onClick={() => {
              setIsLoginView(!isLoginView); 
              setError(''); 
              setSuccessMessage('');
              // Réinitialiser les champs de formulaire lors du basculement
              setLoginEmail(''); setLoginPassword('');
              setRegNom(''); setRegPrenom(''); setRegEmail(''); setRegPassword(''); setRegConfirmPassword('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            {isLoginView ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;