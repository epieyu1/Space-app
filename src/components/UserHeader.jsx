import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { convertToBase64 } from '../utils/helpers';
import { Camera, UserCircle2 } from 'lucide-react';

const UserHeader = ({ user }) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    // Fetch user profile
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'user_profiles', user.uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data());
      } else {
        // Default profile if none exists (e.g. anonymous)
        setProfile({ fullName: 'Usuario Invitado', jobTitle: 'Visitante', photoBase64: '' });
      }
    });
    return () => unsub();
  }, [user]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file && user && profile) {
      try {
        const base64 = await convertToBase64(file);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_profiles', user.uid), {
          ...profile,
          photoBase64: base64
        }, { merge: true });
      } catch(err) {
        alert("Error al subir foto");
      }
    }
  };

  if (!profile) return <div className="h-20"></div>;

  return (
    <div className="bg-white border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
       <div className="flex items-center gap-4">
         <div className="relative group">
           <div className="w-12 h-12 rounded-full bg-[#522b85]/10 overflow-hidden border-2 border-[#f7c303]">
             {profile.photoBase64 ? (
               <img src={profile.photoBase64} className="w-full h-full object-cover" alt="Profile" />
             ) : (
               <UserCircle2 className="w-full h-full text-[#522b85] p-1"/>
             )}
           </div>
           <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" title="Conectado"></div>
           {/* Hidden upload input triggered by clicking the image container in a real app, simplified here with a label overlay */}
           <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
             <Camera size={16} className="text-white"/>
             <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload}/>
           </label>
         </div>
         <div>
           <h2 className="font-bold text-gray-900 leading-tight">{profile.fullName}</h2>
           <p className="text-xs text-[#522b85] font-bold uppercase tracking-wide">{profile.jobTitle}</p>
         </div>
       </div>
       <div className="hidden md:block text-right">
         <p className="text-xs text-gray-400 font-bold uppercase">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
       </div>
    </div>
  );
};
export default UserHeader;