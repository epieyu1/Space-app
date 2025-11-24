import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth } from '../utils/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      if (!isRegistering) await signInAnonymously(auth);
      else setError('Error en autenticación.');
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
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleAuth} className="space-y-6">
          <input type="email" required className="w-full px-4 py-4 rounded-xl border-2 border-gray-100 focus:border-[#522b85] outline-none" placeholder="admin@spacecreativa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required className="w-full px-4 py-4 rounded-xl border-2 border-gray-100 focus:border-[#522b85] outline-none" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full bg-[#522b85] hover:bg-[#3e1f66] text-white font-bold py-4 rounded-xl transition-all shadow-lg">{isRegistering ? 'Crear Acceso' : 'Entrar'}</button>
        </form>
        <div className="mt-8 text-center">
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-[#f7c303] font-bold underline">{isRegistering ? 'Inicia sesión' : 'Registrar cuenta'}</button>
        </div>
      </div>
    </div>
  );
};
export default Login;