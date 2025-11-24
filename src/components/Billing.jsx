import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { formatCurrency, SERVICES_CATALOG } from '../utils/helpers';
import { generateBrandedPDF } from '../utils/pdfGenerator';
import { PAYMENT_ACCOUNTS } from '../utils/paymentAccounts';
import { Copy, Trash2, FileText } from 'lucide-react';

const Billing = ({ user, clients }) => {
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState({ clientId: '', amount: '', concept: '', frequency: 'Mensual', billingType: 'Cuenta de Cobro', currency: 'COP', targetAccount: PAYMENT_ACCOUNTS[0].id, nextDate: '' });
  useEffect(() => { if(!user) return; const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'bills')), (s) => setBills(s.docs.map(d => ({id: d.id, ...d.data()})))); return () => unsub(); }, [user]);
  
  const handleServiceSelect = (e) => { 
      const serviceName = e.target.value;
      const s = SERVICES_CATALOG.find(s => s.name === serviceName); 
      if (s) {
          // Si cambia el servicio, actualiza el concepto y el monto según la moneda seleccionada
          setForm(p => ({
              ...p, 
              concept: s.name, 
              amount: s.prices[p.currency] || 0
          }));
      } else {
          setForm(p => ({...p, concept: '', amount: ''})); // Reset if selecting default option
      }
  };
  
  const handleCurrencyChange = (e) => {
      const newCurrency = e.target.value;
      const currentService = SERVICES_CATALOG.find(s => s.name === form.concept);
      
      setForm(p => ({
          ...p, 
          currency: newCurrency,
          // Si hay un servicio seleccionado, actualiza el monto basado en la nueva moneda
          amount: currentService ? (currentService.prices[newCurrency] || 0) : p.amount 
      }));
  };
  
  const add = async (e) => { e.preventDefault(); const c = clients.find(cl => cl.id === form.clientId); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bills'), {...form, amount: Number(form.amount), clientName: c?.company || 'Cliente', clientData: c || {}, createdAt: Timestamp.now() }); };
  const del = async (id) => { if(window.confirm('?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bills', id)); };
  
  const pdf = (bill) => { 
    const doc = generateBrandedPDF(bill.billingType.toUpperCase(), (d, y) => { 
        const client = bill.clientData || {}; 
        d.setFillColor(245, 245, 245); d.roundedRect(20, y, 170, 40, 3, 3, 'F'); 
        d.setFontSize(10); d.setFont("helvetica", "bold"); 
        d.text("CLIENTE:", 25, y+8); 
        d.setFont("helvetica", "normal"); 
        d.text(bill.clientName, 25, y+16); 
        d.text(`NIT: ${client.nit||''}`, 25, y+22); 
        d.text(`Tel: ${client.phone||''}`, 25, y+28); 
        d.text(`Dir: ${client.address||''}`, 100, y+22); 
        
        y += 50; 
        
        d.setFont("helvetica", "bold"); d.text("DESCRIPCIÓN", 20, y); d.text("VALOR", 190, y, null, null, "right"); 
        d.line(20, y+2, 190, y+2); 
        y += 10; 
        d.setFont("helvetica", "normal"); 
        d.text(bill.concept, 20, y); 
        d.text(formatCurrency(bill.amount, bill.currency), 190, y, null, null, "right"); 
        
        y += 20; 
        
        d.setFont("helvetica", "bold"); d.setFontSize(14); 
        d.text("TOTAL:", 120, y); 
        d.text(formatCurrency(bill.amount, bill.currency), 190, y, null, null, "right"); 
        
        return y; 
    }); 
    doc.save(`${bill.billingType}_${bill.clientName}.pdf`); 
  };
  
  const copyAccount = (txt) => { const ta = document.createElement("textarea"); ta.value = txt; ta.style.position="fixed"; ta.style.left="-9999px"; document.body.appendChild(ta); ta.focus(); ta.select(); try { document.execCommand('copy'); alert('Copiado'); } catch(e){} document.body.removeChild(ta); };

  return ( <div className="space-y-8"><div className="lg:col-span-3 bg-black p-6 rounded-3xl text-white border-b-4 border-[#f7c303]"><h3 className="font-bold mb-4">Medios de Pago</h3><div className="grid md:grid-cols-4 gap-4">{PAYMENT_ACCOUNTS.map(a => <div key={a.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700"><button onClick={()=>copyAccount(a.number)} className="float-right"><Copy size={14}/></button><p className="font-bold text-sm">{a.owner}</p><p className="font-mono text-xs">{a.number}</p></div>)}</div></div><div className="bg-white p-8 rounded-3xl shadow-lg"><h3 className="text-2xl font-black mb-6 text-[#522b85]">Facturación</h3><form onSubmit={add} className="space-y-6"><div className="grid md:grid-cols-2 gap-6"><select value={form.clientId} onChange={e=>setForm({...form, clientId: e.target.value})} className="w-full p-4 border rounded-xl" required><option value="">Cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.company}</option>)}</select><select value={form.billingType} onChange={e=>setForm({...form, billingType: e.target.value})} className="w-full p-4 border rounded-xl font-bold text-[#522b85]"><option>Cuenta de Cobro</option><option>Factura</option><option>Cotización</option></select></div><div className="bg-gray-50 p-6 rounded-xl border"><div className="grid md:grid-cols-3 gap-4 mb-4"><div className="md:col-span-1"><select value={form.currency} onChange={handleCurrencyChange} className="w-full p-3 border rounded-lg font-bold"><option value="COP">COP</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div><div className="md:col-span-2"><select onChange={handleServiceSelect} className="w-full p-3 border rounded-lg"><option value="">-- Seleccionar Servicio --</option>{SERVICES_CATALOG.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select></div></div><input value={form.concept} onChange={e=>setForm({...form, concept: e.target.value})} className="w-full p-4 border rounded-xl mb-4" placeholder="Concepto"/><div className="grid md:grid-cols-2 gap-4"><input value={form.amount} type="number" onChange={e=>setForm({...form, amount: e.target.value})} className="w-full p-4 border rounded-xl font-bold text-lg"/><input type="date" value={form.nextDate} onChange={e=>setForm({...form, nextDate: e.target.value})} className="w-full p-4 border rounded-xl" required/></div></div><button className="w-full bg-[#522b85] text-white font-bold py-4 rounded-xl">Generar</button></form></div><div className="bg-white p-8 rounded-3xl shadow-sm border"><h3 className="text-xl font-black mb-6">Historial</h3>{bills.map(b=>(<div key={b.id} className="flex justify-between p-4 border-b"><div><span className="text-xs font-bold uppercase text-[#522b85]">{b.billingType}</span><h4 className="font-bold">{b.clientName}</h4></div><div className="text-right"><p className="font-black">{formatCurrency(b.amount, b.currency)}</p><button onClick={()=>pdf(b)} className="bg-[#f7c303] px-3 py-1 rounded text-xs font-bold mt-1"><FileText size={16}/></button></div></div>))}</div></div> );
};
export default Billing;