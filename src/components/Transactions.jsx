import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { formatCurrency } from '../utils/helpers';
import { Plus } from 'lucide-react';

const Transactions = ({ user, clients, transactions }) => {
  const [amount, setAmount] = useState(''); const [clientId, setClientId] = useState(''); const [concept, setConcept] = useState('');
  
  const add = async (e) => { e.preventDefault(); const c = clients.find(cl => cl.id === clientId); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), { amount: Number(amount), clientId, clientName: c?.company || 'Cliente', concept, date: Timestamp.now(), createdBy: user.uid }); };
  
  return ( <div className="grid lg:grid-cols-3 gap-8"><div className="bg-white p-8 rounded-3xl shadow-lg h-fit"><h3 className="text-xl font-black mb-6 text-[#000000]"><Plus className="inline"/> Ingreso</h3><form onSubmit={add} className="space-y-4"><select value={clientId} onChange={e=>setClientId(e.target.value)} className="w-full p-4 border rounded-xl"><option>Cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.company}</option>)}</select><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-4 border rounded-xl" placeholder="Monto"/><input value={concept} onChange={e=>setConcept(e.target.value)} className="w-full p-4 border rounded-xl" placeholder="Concepto"/><button className="w-full bg-[#522b85] text-white font-bold py-4 rounded-xl">Guardar</button></form></div><div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm"><h3 className="text-xl font-black mb-6">Historial</h3>{transactions.map(t=><div key={t.id} className="flex justify-between p-4 border-b"><span>{t.clientName}</span><span className="font-black text-green-600">{formatCurrency(t.amount)}</span></div>)}</div></div> );
};
export default Transactions;