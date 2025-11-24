import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { formatCurrency } from '../utils/helpers';
import { PAYMENT_ACCOUNTS } from '../utils/paymentAccounts';
import { Copy, Trash2 } from 'lucide-react';

const Billing = ({ user, clients, settings }) => {
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState({ clientId: '', amount: '', concept: '', frequency: 'Mensual', billingType: 'Cuenta de Cobro', currency: 'COP', targetAccount: PAYMENT_ACCOUNTS[0].id, nextDate: '' });
  useEffect(() => { if(!user) return; const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'bills')), (s) => setBills(s.docs.map(d => ({id: d.id, ...d.data()})))); return () => unsub(); }, [user]);
  
  const add = async (e) => { e.preventDefault(); const c = clients.find(cl => cl.id === form.clientId); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bills'), {...form, amount: Number(form.amount), clientName: c?.company || 'Cliente', clientData: c || {}, createdAt: Timestamp.now() }); };
  const del = async (id) => { if(window.confirm('?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bills', id)); };
  const copy = (txt) => { navigator.clipboard.writeText(txt).then(() => alert('Copiado')); };
  const pdf = async (bill) => { const { jsPDF } = await import("jspdf"); const doc = new jsPDF(); doc.text(`COBRO: ${bill.clientName}`, 20, 20); doc.save(`Cobro.pdf`); };
  
  return ( <div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-3 bg-black p-6 rounded-3xl text-white border-b-4 border-[#f7c303]"><h3 className="font-bold mb-4">Medios de Pago</h3><div className="grid md:grid-cols-4 gap-4">{PAYMENT_ACCOUNTS.map(a => <div key={a.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700"><button onClick={()=>copy(a.number)} className="float-right"><Copy size={14}/></button><p className="font-bold text-sm">{a.owner}</p><p className="font-mono text-xs">{a.number}</p></div>)}</div></div><div className="bg-white p-6 rounded-3xl shadow-sm h-fit"><h3 className="font-bold mb-4 text-[#522b85]">Nuevo Cobro</h3><form onSubmit={add} className="space-y-4"><select value={form.clientId} onChange={e=>setForm({...form, clientId: e.target.value})} className="w-full p-3 border rounded-xl"><option>Cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.company}</option>)}</select><input value={form.concept} onChange={e=>setForm({...form, concept: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Concepto"/><input type="date" value={form.nextDate} onChange={e=>setForm({...form, nextDate: e.target.value})} className="w-full p-3 border rounded-xl" required title="Fecha para alerta"/><input value={form.amount} type="number" onChange={e=>setForm({...form, amount: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Monto"/><button className="w-full bg-[#522b85] text-white font-bold py-3 rounded-xl">Guardar</button></form></div><div className="lg:col-span-2 space-y-4">{bills.map(b => (<div key={b.id} className="bg-white p-5 rounded-2xl shadow-sm flex justify-between items-center"><div><h4 className="font-bold">{b.clientName}</h4><p className="text-sm">{b.concept} - {b.nextDate}</p></div><div className="text-right"><p className="font-black">{formatCurrency(b.amount, b.currency)}</p><div className="flex gap-2 justify-end mt-2"><button onClick={()=>del(b.id)} className="text-red-500"><Trash2/></button><button onClick={()=>pdf(b)} className="bg-[#f7c303] px-2 py-1 rounded font-bold text-xs">PDF</button></div></div></div>))}</div></div> );
};
export default Billing;