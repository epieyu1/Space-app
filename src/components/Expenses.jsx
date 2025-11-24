import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { formatCurrency, convertToBase64 } from '../utils/helpers';
import { Upload, CheckCircle2, Eye, Trash2 } from 'lucide-react';

const Expenses = ({ user }) => {
  const [amount, setAmount] = useState(''); 
  const [description, setDescription] = useState(''); 
  const [expenses, setExpenses] = useState([]); 
  const [supportBase64, setSupportBase64] = useState('');
  
  useEffect(() => { if(!user) return; const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'expenses')), (s) => setExpenses(s.docs.map(d => ({id: d.id, ...d.data()})))); return () => unsub(); }, [user]);
  
  const handleFile = async (e) => { 
      const f = e.target.files[0]; 
      if(!f) return; 
      try { 
          // Redimensiona la imagen a un tamaño razonable para Base64
          setSupportBase64(await convertToBase64(f)); 
      } catch(e){
          console.error("Error processing image:", e);
      } 
  };
  
  const add = async (e) => { 
      e.preventDefault(); 
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'expenses'), { 
          amount: Number(amount), 
          description, 
          supportBase64, 
          date: Timestamp.now(), 
          createdBy: user.uid 
      }); 
      setAmount(''); 
      setDescription(''); 
      setSupportBase64(''); 
  };
  
  const del = async (id) => { if(window.confirm('¿Borrar Gasto?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'expenses', id)); };
  const viewSupport = (b64) => { const win = window.open(); win.document.write(`<img src="${b64}" style="max-width:100%">`); };
  
  return ( <div className="space-y-8"><div className="bg-white p-8 rounded-3xl shadow-lg h-fit"><h3 className="text-2xl font-black mb-6 text-red-500">Gasto</h3><form onSubmit={add} className="space-y-6"><label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-red-300 transition-colors"><input type="file" className="hidden" onChange={handleFile} accept="image/*"/>{supportBase64 ? <><CheckCircle2 className="text-green-600 mb-2"/> <p className="text-sm font-bold text-green-600">Comprobante Adjunto</p></> : <><Upload className="text-gray-400 mb-2"/><p className="text-sm font-bold text-gray-500">Subir Comprobante (Opcional)</p></>}</label><div className="grid md:grid-cols-2 gap-6"><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-4 border rounded-xl text-xl font-bold" placeholder="0" required/><input value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-4 border rounded-xl" placeholder="Descripción" required/></div><button className="w-full bg-red-500 text-white font-bold py-4 rounded-xl">Guardar Gasto</button></form></div><div className="bg-white p-8 rounded-3xl shadow-sm border"><h3 className="text-xl font-black mb-6">Historial</h3>{expenses.map(e=><div key={e.id} className="flex justify-between p-4 border-b"><div><p className="font-bold">{e.description}</p></div><div className="flex items-center gap-4">{e.supportBase64 && <button onClick={()=>viewSupport(e.supportBase64)} className="text-gray-400 hover:text-blue-500"><Eye size={20}/></button>}<span className="font-black text-red-500">-{formatCurrency(e.amount)}</span><button onClick={()=>del(e.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={20}/></button></div></div>)}</div></div> );
};
export default Expenses;