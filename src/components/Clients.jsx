import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { Trash2 } from 'lucide-react';

const Clients = ({ user }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', company: '', nit: '', email: '', phone: '', address: '', serviceType: '', startDate: '' });
  const [clients, setClients] = useState([]);
  useEffect(() => { if(!user) return; const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'clients')), (s) => setClients(s.docs.map(d => ({id: d.id, ...d.data()})))); return () => unsub(); }, [user]);
  
  const add = async (e) => { e.preventDefault(); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'clients'), {...form, createdAt: Timestamp.now()}); };
  const del = async (id) => { if(window.confirm('?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', id)); };
  
  return ( <div className="space-y-8"><div className="bg-white p-8 rounded-3xl shadow-lg"><h3 className="text-xl font-black mb-6 text-[#522b85]">Cliente</h3><form onSubmit={add} className="grid md:grid-cols-2 gap-4"><input value={form.company} onChange={e=>setForm({...form, company: e.target.value})} placeholder="Empresa" className="p-4 border rounded-xl"/><input value={form.nit} onChange={e=>setForm({...form, nit: e.target.value})} placeholder="NIT" className="p-4 border rounded-xl"/><input value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} placeholder="Contacto" className="p-4 border rounded-xl"/><input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="Email" className="p-4 border rounded-xl"/><input value={form.startDate} type="date" onChange={e=>setForm({...form, startDate: e.target.value})} className="p-4 border rounded-xl"/><button className="col-span-2 bg-[#522b85] text-white py-4 rounded-xl font-bold">Guardar</button></form></div><div className="grid md:grid-cols-2 gap-4">{clients.map(c => (<div key={c.id} className="bg-white p-6 rounded-2xl border shadow-sm"><h4 className="font-black">{c.company}</h4><p>{c.nit}</p><button onClick={()=>del(c.id)} className="text-red-500"><Trash2/></button></div>))}</div></div> );
};
export default Clients;