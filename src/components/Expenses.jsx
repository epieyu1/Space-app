import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { formatCurrency } from '../utils/helpers';

const Expenses = ({ user }) => {
  const [amount, setAmount] = useState(''); const [description, setDescription] = useState(''); const [expenses, setExpenses] = useState([]);
  useEffect(() => { if(!user) return; const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'expenses')), (s) => setExpenses(s.docs.map(d => ({id: d.id, ...d.data()})))); return () => unsub(); }, [user]);
  
  const add = async (e) => { e.preventDefault(); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'expenses'), { amount: Number(amount), description, date: Timestamp.now(), createdBy: user.uid }); };
  
  return ( <div className="bg-white p-8 rounded-3xl shadow-lg"><h3 className="text-xl font-black mb-6 text-red-500">Gasto</h3><form onSubmit={add} className="space-y-4"><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-4 border rounded-xl" placeholder="Monto"/><input value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-4 border rounded-xl" placeholder="Concepto"/><button className="w-full bg-red-500 text-white font-bold py-4 rounded-xl">Guardar</button></form><div className="mt-8">{expenses.map(e=><div key={e.id} className="p-4 border-b flex justify-between"><span>{e.description}</span><span className="font-bold text-red-500">-{formatCurrency(e.amount)}</span></div>)}</div></div> );
};
export default Expenses;