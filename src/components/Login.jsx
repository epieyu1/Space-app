import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db, appId } from '../utils/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        // Lógica de Registro
        if (!fullName || !jobTitle) {
          throw new Error('Por favor completa todos los campos.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Guardar perfil en Firestore
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_profiles', userCredential.user.uid), {
          fullName,
          jobTitle,
          email,
          createdAt: Timestamp.now(),
          photoBase64: '' 
        });
      } else {
        // Lógica de Login
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error("Error de autenticación:", err);
      
      // Manejo de errores comunes
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado. Intenta iniciar sesión.');
        setIsRegistering(false);
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-4 bg-[#522b85]"></div>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-[#522b85]/10 p-8 border border-gray-100 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tighter text-[#000000]">SPACE<span className="text-[#f7c303]">.</span></h1>
          <p className="text-[#522b85] mt-2 font-bold tracking-widest text-xs uppercase">Finanzas Creativas</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}
        
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#522b85] outline-none transition-all" 
                  placeholder="Ej: Ana Maria" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cargo / Puesto</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#522b85] outline-none transition-all" 
                  placeholder="Ej: Directora General" 
                  value={jobTitle} 
                  onChange={(e) => setJobTitle(e.target.value)} 
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#522b85] outline-none" 
              placeholder="admin@spacecreativa.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#522b85] outline-none" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          
          <button 
            disabled={loading}
            className="w-full bg-[#522b85] hover:bg-[#3e1f66] text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Cargando...' : (isRegistering ? 'Registrar Usuario' : 'Entrar')}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
            className="text-sm text-[#f7c303] font-bold underline hover:text-[#d4a000]"
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : 'Registrar nueva cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;