import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { convertToBase64 } from '../utils/helpers';

const SettingsView = ({ settings }) => {
  const [formData, setFormData] = useState({ companyName: 'Space Agencia Creativa', nit: '', logoBase64: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (settings) setFormData(prev => ({...prev, ...settings})); }, [settings]);
  
  const handleFileChange = async (e) => { const file = e.target.files[0]; if (file) { try { const base64 = await convertToBase64(file); setFormData({...formData, logoBase64: base64}); } catch(err) {} } };
  const handleSave = async (e) => { e.preventDefault(); setSaving(true); try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'general'), formData); alert('Guardado'); } catch (error) {} setSaving(false); };
  
  return ( <div className="bg-white p-8 rounded-3xl shadow-lg"><h2 className="text-2xl font-bold mb-4">Configuración</h2><form onSubmit={handleSave}><input type="file" onChange={handleFileChange} className="mb-4"/><input value={formData.companyName} onChange={e=>setFormData({...formData, companyName: e.target.value})} className="w-full p-4 border rounded-xl mb-4" placeholder="Empresa"/><input value={formData.nit} onChange={e=>setFormData({...formData, nit: e.target.value})} className="w-full p-4 border rounded-xl mb-4" placeholder="NIT"/><button className="bg-black text-white px-10 py-4 rounded-xl font-bold">Guardar</button></form></div> );
};
export default SettingsView;