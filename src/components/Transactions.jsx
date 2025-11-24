import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { formatCurrency, SERVICES_CATALOG } from '../utils/helpers';
import { generateBrandedPDF } from '../utils/pdfGenerator';
import { Plus, ArrowRightLeft, FileText, Trash2 } from 'lucide-react';

const Transactions = ({ user, clients, transactions }) => {
  const [amount, setAmount] = useState(''); 
  const [currency, setCurrency] = useState('COP');
  const [amountCOP, setAmountCOP] = useState('');
  const [clientId, setClientId] = useState(''); 
  const [concept, setConcept] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const add = async (e) => { 
      e.preventDefault(); 
      const c = clients.find(cl => cl.id === clientId); 
      // Si la moneda es COP, el amountCOP es el mismo amount. Si no, usamos el campo amountCOP manual.
      const finalCOP = currency === 'COP' ? Number(amount) : Number(amountCOP); 
      
      const [y, m, d] = date.split('-').map(Number); 
      const entryDate = new Date(y, m-1, d, 12, 0, 0); 
      
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), { 
          amount: Number(amount), 
          currency, 
          amountCOP: finalCOP, 
          clientId, 
          clientName: c?.company || 'Cliente', 
          clientData: c || {}, 
          concept, 
          date: Timestamp.fromDate(entryDate), 
          createdBy: user.uid 
      }); 
      setAmount(''); setCurrency('COP'); setAmountCOP(''); setConcept(''); setDate(new Date().toISOString().split('T')[0]); 
  };
  
  const deleteTransaction = async (id) => { if(window.confirm('¿Borrar?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', id)); };
  
  const generateReceipt = (t) => { 
    const doc = generateBrandedPDF("COMPROBANTE DE INGRESO", (d, y) => { 
        const client = t.clientData || {}; 
        
        // Datos del Cliente
        d.setFillColor(245, 245, 245); d.roundedRect(20, y, 170, 40, 3, 3, 'F'); 
        d.setFontSize(10); d.setFont("helvetica", "bold"); d.text("RECIBIDO DE:", 25, y+8); 
        d.setFont("helvetica", "normal"); 
        d.text(`Cliente: ${client.company || t.clientName}`, 25, y+16); 
        d.text(`NIT/CC: ${client.nit || ''}`, 25, y+22); 
        d.text(`Teléfono: ${client.phone || ''}`, 25, y+28); 
        d.text(`Contacto: ${client.firstName || ''}`, 100, y+16); 
        
        y += 50; 
        
        // Detalle
        d.setFont("helvetica", "bold"); d.text("CONCEPTO", 20, y); d.text("VALOR", 190, y, null, null, "right"); 
        d.line(20, y+2, 190, y+2); 
        y += 10; 
        d.setFont("helvetica", "normal"); 
        d.text(t.concept, 20, y); 
        d.text(formatCurrency(t.amount, t.currency), 190, y, null, null, "right"); 
        
        y += 20; 
        
        // Total
        d.setFont("helvetica", "bold"); d.setFontSize(12); 
        d.text("TOTAL RECIBIDO:", 20, y); 
        d.text(formatCurrency(t.amount, t.currency), 190, y, null, null, "right"); 
        
        if (t.currency !== 'COP') {
             y += 6; 
             d.setFont("helvetica", "normal"); d.setFontSize(10); 
             d.text(`Valor en COP: ${formatCurrency(t.amountCOP, 'COP')}`, 20, y);
        }
        
        return y + 10; 
    }); 
    doc.save(`Recibo_${t.clientName}.pdf`); 
  };
  
  return ( <div className="space-y-8"><div className="bg-white p-8 rounded-3xl shadow-lg"><h3 className="text-2xl font-black mb-6 text-[#000000] flex items-center border-b pb-4"><Plus className="inline mr-2 text-[#522b85]"/> Registrar Nuevo Ingreso</h3><form onSubmit={add} className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cliente</label><select value={clientId} onChange={e=>setClientId(e.target.value)} className="w-full p-4 border rounded-xl bg-gray-50 font-medium" required><option value="">Seleccionar Cliente...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.company}</option>)}</select></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha del Ingreso</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-4 border rounded-xl bg-gray-50 font-medium" required /></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Moneda</label><select value={currency} onChange={e=>setCurrency(e.target.value)} className="w-full p-4 border rounded-xl font-bold text-[#522b85] bg-gray-50"><option value="COP">COP $</option><option value="USD">USD $</option><option value="EUR">EUR €</option></select></div><div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Monto Recibido</label><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-4 border rounded-xl text-xl font-bold bg-gray-50" placeholder="0.00" required/></div></div>{currency !== 'COP' && (<div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100"><label className="block text-xs font-bold text-blue-600 mb-2 flex items-center gap-1"><ArrowRightLeft size={14}/> Valor Real Recibido en Pesos (COP)</label><input type="number" value={amountCOP} onChange={e=>setAmountCOP(e.target.value)} className="w-full p-4 border border-blue-200 rounded-xl text-lg font-medium" placeholder="Ej: 400000" required/><p className="text-xs text-blue-400 mt-2">Para contabilidad exacta en pesos.</p></div>)}<div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Concepto / Descripción</label><input value={concept} onChange={e=>setConcept(e.target.value)} className="w-full p-4 border rounded-xl bg-gray-50" placeholder="Ej: Pago Mensualidad Diseño..." required/></div><button className="w-full bg-[#522b85] hover:bg-[#3e1f66] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#522b85]/20 transition-all transform hover:-translate-y-1">Guardar Ingreso</button></form></div><div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"><h3 className="text-xl font-black mb-6 text-[#000000]">Historial de Ingresos</h3><div className="space-y-3">{transactions.map(t => (<div key={t.id} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-50 last:border-0"><div><span className="font-bold text-gray-800 block">{t.clientName}</span><span className="text-xs text-gray-400">{t.concept} • {t.date?.seconds ? new Date(t.date.seconds * 1000).toLocaleDateString() : ''}</span></div><div className="text-right flex items-center gap-3"><div><span className={`font-black text-lg ${t.currency !== 'COP' ? 'text-blue-600' : 'text-green-600'}`}>{formatCurrency(t.amount, t.currency)}</span>{t.currency !== 'COP' && (<p className="text-[10px] text-gray-400">≈ {formatCurrency(t.amountCOP, 'COP')}</p>)}</div><button onClick={() => generateReceipt(t)} className="bg-[#f7c303] p-2 rounded-lg hover:bg-[#d4a000] text-black transition-colors" title="Recibo PDF"><FileText size={16}/></button><button onClick={() => deleteTransaction(t.id)} className="bg-gray-100 p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div></div>))}</div></div></div> );
};
export default Transactions;