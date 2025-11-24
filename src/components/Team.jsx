import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { convertToBase64 } from '../utils/helpers';
import { Trash2 } from 'lucide-react';

const Team = ({ user }) => {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ fullName: '', birthDate: '', accountNumber: '', bank: '', role: 'Colaborador', jobTitle: '', photoBase64: '' });
  useEffect(() => { if(!user) return; const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'team')); const unsub = onSnapshot(q, (s) => setMembers(s.docs.map(d => ({id: d.id, ...d.data()})))); return () => unsub(); }, [user]);
  
  const handlePhoto = async (e) => { const f = e.target.files[0]; if(f) setForm({...form, photoBase64: await convertToBase64(f)}); };
  const add = async (e) => { e.preventDefault(); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'team'), {...form, createdAt: Timestamp.now()}); };
  const del = async (id) => { if(window.confirm('?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team', id)); };
  
  return ( <div className="grid lg:grid-cols-3 gap-8"><div className="bg-white p-8 rounded-3xl shadow-lg"><h3 className="text-xl font-black mb-6 text-[#522b85]">Nuevo</h3><form onSubmit={add} className="space-y-4"><input type="file" onChange={handlePhoto}/><input value={form.fullName} onChange={e=>setForm({...form, fullName: e.target.value})} placeholder="Nombre" className="w-full p-4 border rounded-xl"/><input value={form.jobTitle} onChange={e=>setForm({...form, jobTitle: e.target.value})} placeholder="Cargo" className="w-full p-4 border rounded-xl"/><input value={form.bank} onChange={e=>setForm({...form, bank: e.target.value})} placeholder="Banco" className="w-full p-4 border rounded-xl"/><input value={form.accountNumber} onChange={e=>setForm({...form, accountNumber: e.target.value})} placeholder="Cuenta" className="w-full p-4 border rounded-xl"/><button className="w-full bg-[#522b85] text-white font-bold py-4 rounded-xl">Guardar</button></form></div><div className="lg:col-span-2 space-y-4">{members.map(m => (<div key={m.id} className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4"><div className="w-12 h-12 rounded-full overflow-hidden"><img src={m.photoBase64} className="w-full h-full object-cover"/></div><div><p className="font-bold">{m.fullName}</p><p className="text-xs">{m.jobTitle} - {m.bank}</p></div><button onClick={()=>del(m.id)} className="text-red-500 ml-auto"><Trash2/></button></div>))}</div></div> );
};
export default Team;