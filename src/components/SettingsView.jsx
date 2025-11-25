import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { convertToBase64 } from '../utils/helpers';
import { ImageIcon, Settings, ListChecks } from 'lucide-react';
import SettingsData from './SettingsData';

const SettingsView = ({ user, settings, paymentAccounts, servicesCatalog }) => {
  const [formData, setFormData] = useState({ companyName: 'Space Agencia Creativa', nit: '', logoBase64: '' });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => { if (settings) setFormData(prev => ({...prev, ...settings})); }, [settings]);
  
  const handleFileChange = async (e) => { 
    const file = e.target.files[0]; 
    if (file) { 
      try { const base64 = await convertToBase64(file); setFormData({...formData, logoBase64: base64}); } 
      catch(err) { console.error("Error:", err); } 
    } 
  };
  
  const handleSave = async (e) => { 
    e.preventDefault(); setSaving(true); 
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'general'), formData, { merge: true }); alert('Guardado.'); } 
    catch (error) { alert('Error al guardar.'); } 
    setSaving(false); 
  };
  
  const GeneralSettings = () => (
    <form onSubmit={handleSave} className="space-y-6 pt-4">
      <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl border">
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-white border flex items-center justify-center">
          {formData.logoBase64 ? <img src={formData.logoBase64} className="w-full h-full object-contain" /> : <ImageIcon className="text-gray-400" size={32} />}
        </div>
        <label className="flex-1 cursor-pointer bg-[#f7c303] text-black font-bold py-2 px-4 rounded-lg text-sm text-center hover:bg-[#d4a000]">
          {formData.logoBase64 ? 'Cambiar Logo' : 'Subir Logo'} <input type="file" onChange={handleFileChange} className="hidden" accept="image/jpeg"/>
        </label>
      </div>
      <div><label className="block text-xs font-bold text-gray-500 mb-2">Razón Social</label><input value={formData.companyName} onChange={e=>setFormData({...formData, companyName: e.target.value})} className="w-full p-4 border rounded-xl" required/></div>
      <div><label className="block text-xs font-bold text-gray-500 mb-2">NIT</label><input value={formData.nit} onChange={e=>setFormData({...formData, nit: e.target.value})} className="w-full p-4 border rounded-xl"/></div>
      <button className="w-full bg-black text-white px-10 py-4 rounded-xl font-bold" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Configuración General'}</button>
    </form> 
  );

  return ( 
    <div className="space-y-8">
        <div className="bg-white p-8 rounded-3xl shadow-lg">
            <div className="flex border-b mb-6">
                <button onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-4 py-2 text-lg font-bold border-b-2 transition-colors ${activeTab === 'general' ? 'border-[#522b85] text-[#522b85]' : 'border-transparent text-gray-500'}`}><Settings size={20} /> General</button>
                <button onClick={() => setActiveTab('data')} className={`flex items-center gap-2 px-4 py-2 text-lg font-bold border-b-2 transition-colors ${activeTab === 'data' ? 'border-[#522b85] text-[#522b85]' : 'border-transparent text-gray-500'}`}><ListChecks size={20} /> Datos Base</button>
            </div>
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'data' && <SettingsData paymentAccounts={paymentAccounts} servicesCatalog={servicesCatalog} />}
        </div>
    </div>
  );
};
export default SettingsView;