import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { formatCurrency, SERVICES_CATALOG } from '../utils/helpers';
import { generateBrandedPDF } from '../utils/pdfGenerator';
import { Plus, ArrowRightLeft, FileText, Trash2, Divide, CheckSquare, Square } from 'lucide-react';

const Transactions = ({ user, clients, transactions, settings }) => {
  const [amount, setAmount] = useState(''); 
  const [currency, setCurrency] = useState('COP');
  const [amountCOP, setAmountCOP] = useState('');
  const [clientId, setClientId] = useState(''); 
  const [concept, setConcept] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [beneficiaries, setBeneficiaries] = useState(['Luis', 'Israel', 'Anthony', 'Space']);
  const [splitReason, setSplitReason] = useState('');

  const toggleBeneficiary = (name) => {
    setBeneficiaries(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]);
  };

  const add = async (e) => { 
    e.preventDefault(); 
    if (beneficiaries.length === 0) { alert("Selecciona al menos un beneficiario"); return; }
    const c = clients.find(cl => cl.id === clientId); 
    const finalCOP = currency === 'COP' ? Number(amount) : Number(amountCOP);
    const [y, m, d] = date.split('-').map(Number);
    const entryDate = new Date(y, m-1, d, 12, 0, 0);

    const newTransaction = { 
      amount: Number(amount), 
      currency,
      amountCOP: finalCOP,
      clientId, 
      clientName: c?.company || 'Cliente', 
      clientData: c || {}, 
      concept, 
      date: Timestamp.fromDate(entryDate),
      beneficiaries,
      splitReason,
      createdBy: user.uid 
    };

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), newTransaction);
    
    generateReceipt(newTransaction); // Generate PDF immediately

    setAmount(''); setCurrency('COP'); setAmountCOP(''); setConcept(''); setDate(new Date().toISOString().split('T')[0]); setBeneficiaries(['Luis', 'Israel', 'Anthony', 'Space']); setSplitReason('');
  };

  const deleteTransaction = async (id) => { if(window.confirm('¿Borrar?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', id)); };
  
  const generateReceipt = (t) => { 
    const doc = generateBrandedPDF("COMPROBANTE DE INGRESO", (d, y) => {
      const client = t.clientData || {};
      d.setFillColor(245, 245, 245); d.roundedRect(20, y, 170, 35, 3, 3, 'F');
      d.setFontSize(10); d.setFont("helvetica", "bold"); d.text("RECIBIDO DE:", 25, y+8);
      d.setFont("helvetica", "normal"); d.text(`Cliente: ${client.company || t.clientName}`, 25, y+16);
      d.text(`NIT/CC: ${client.nit || ''}`, 25, y+22); d.text(`Teléfono: ${client.phone || ''}`, 25, y+28); 
      d.text(`Contacto: ${client.firstName || ''}`, 100, y+16);
      y += 50; d.setFont("helvetica", "bold"); d.text("CONCEPTO", 20, y); d.text("VALOR", 190, y, null, null, "right");
      d.line(20, y+2, 190, y+2); y += 10; d.setFont("helvetica", "normal"); d.text(t.concept, 20, y);
      d.text(formatCurrency(t.amount, t.currency), 190, y, null, null, "right");
      y += 20; d.setFont("helvetica", "bold"); d.setFontSize(12); d.text("TOTAL RECIBIDO:", 20, y);
      d.text(formatCurrency(t.amount, t.currency), 190, y, null, null, "right");
      return y;
    }, settings);
    doc.save(`Recibo_${t.clientName}.pdf`);
  };

  return ( 
    <div className="space-y-8"><div className="bg-white p-8 rounded-3xl shadow-lg"><h3 className="text-2xl font-black mb-6 text-[#000000] flex items-center border-b pb-4"><Plus className="inline mr-2 text-[#522b85]"/> Registrar Nuevo Ingreso</h3><form onSubmit={add} className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cliente</label><select value={clientId} onChange={e=>setClientId(e.target.value)} className="w-full p-4 border rounded-xl bg-gray-50 font-medium" required><option value="">Seleccionar Cliente...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.company}</option>)}</select></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha del Ingreso</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-4 border rounded-xl bg-gray-50 font-medium" required /></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Moneda</label><select value={currency} onChange={e=>setCurrency(e.target.value)} className="w-full p-4 border rounded-xl font-bold text-[#522b85] bg-gray-50"><option value="COP">COP $</option><option value="USD">USD $</option><option value="EUR">EUR €</option></select></div><div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Monto Recibido</label><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-4 border rounded-xl text-xl font-bold bg-gray-50" placeholder="0.00" required/></div></div>{currency !== 'COP' && (<div className="bg-blue-50 p-6 rounded-xl border border-blue-100"><label className="block text-xs font-bold text-blue-600 mb-2 flex items-center gap-1"><ArrowRightLeft size={14}/> Valor Real Recibido en Pesos (COP)</label><input type="number" value={amountCOP} onChange={e=>setAmountCOP(e.target.value)} className="w-full p-4 border border-blue-200 rounded-xl text-lg font-medium" placeholder="Ej: 400000" required/><p className="text-xs text-blue-400 mt-2">Para contabilidad exacta en pesos.</p></div>)}
    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200"><label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Divide size={18}/> Destino del Presupuesto (División)</label><div className="flex flex-wrap gap-4 mb-4">{['Luis', 'Israel', 'Anthony', 'Space'].map(name => (<button key={name} type="button" onClick={() => toggleBeneficiary(name)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${beneficiaries.includes(name) ? 'border-[#f7c303] bg-[#f7c303]/10 text-black font-bold' : 'border-gray-200 text-gray-400'}`}>{beneficiaries.includes(name) ? <CheckSquare size={18}/> : <Square size={18}/>}{name}</button>))}</div><div className="flex items-center justify-between text-xs text-gray-500"><span>Se dividirá entre: <strong>{beneficiaries.length}</strong> partes.</span>{beneficiaries.length < 4 && (<input value={splitReason} onChange={e=>setSplitReason(e.target.value)} className="border-b border-gray-300 bg-transparent outline-none w-1/2 text-right" placeholder="Motivo (Opcional)..."/>)}</div></div>
    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Concepto / Descripción</label><input value={concept} onChange={e=>setConcept(e.target.value)} className="w-full p-4 border rounded-xl bg-gray-50" placeholder="Ej: Pago Mensualidad Diseño..." required/></div><button className="w-full bg-[#522b85] hover:bg-[#3e1f66] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#522b85]/20 transition-all transform hover:-translate-y-1">Guardar Ingreso</button></form></div><div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"><h3 className="text-xl font-black mb-6 text-[#000000]">Historial de Ingresos</h3><div className="space-y-3">{transactions.map(t => (<div key={t.id} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-50 last:border-0"><div><span className="font-bold text-gray-800 block">{t.clientName}</span><span className="text-xs text-gray-400">{t.concept} • {t.date?.seconds ? new Date(t.date.seconds * 1000).toLocaleDateString() : ''}</span>{t.beneficiaries && t.beneficiaries.length < 4 && (<div className="flex flex-wrap gap-1 mt-1">{t.beneficiaries.map(b => <span key={b} className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">{b}</span>)}<span className="text-[9px] text-gray-400 italic ml-1">{t.splitReason}</span></div>)}</div><div className="text-right flex items-center gap-3"><div><span className={`font-black text-lg ${t.currency !== 'COP' ? 'text-blue-600' : 'text-green-600'}`}>{formatCurrency(t.amount, t.currency)}</span>{t.currency !== 'COP' && (<p className="text-[10px] text-gray-400">≈ {formatCurrency(t.amountCOP, 'COP')}</p>)}</div><button onClick={() => generateReceipt(t)} className="bg-[#f7c303] p-2 rounded-lg hover:bg-[#d4a000] text-black transition-colors" title="Recibo PDF"><FileText size={16}/></button><button onClick={() => deleteTransaction(t.id)} className="bg-gray-100 p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div></div>))}</div></div></div> );
};
export default Transactions;