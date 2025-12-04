import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { formatCurrency, SERVICES_CATALOG, PAYMENT_ACCOUNTS } from '../utils/helpers';
import { generateBrandedPDF } from '../utils/pdfGenerator';
import { Copy, Trash2, FileText, ListPlus, BadgeDollarSign, Edit } from 'lucide-react';

const Billing = ({ user, clients, settings }) => {
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState({ clientId: '', amount: '', concept: '', frequency: 'Mensual', billingType: 'Cuenta de Cobro', currency: 'COP', targetAccount: PAYMENT_ACCOUNTS[0].id, nextDate: '', paypalFee: 0, items: [{ description: '', price: 0 }] });
  
  useEffect(() => { if(!user) return; const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'bills')), (s) => setBills(s.docs.map(d => ({id: d.id, ...d.data()})))); return () => unsub(); }, [user]);
  
  const handleServiceSelect = (e) => { 
    const val = e.target.value;
    if (!val) return;
    const s = SERVICES_CATALOG.find(s => s.name === val); 
    if (s) {
      setForm(prev => ({
        ...prev,
        items: [...prev.items, { description: s.name, price: s.prices[prev.currency] || 0 }]
      }));
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = field === 'price' ? Number(value) : value;
    setForm({...form, items: newItems});
  };

  const addItem = () => setForm({...form, items: [...form.items, { description: '', price: 0 }]});
  const removeItem = (index) => setForm({...form, items: form.items.filter((_, i) => i !== index)});

  const calculateTotal = () => {
    const subtotal = form.items.reduce((acc, item) => acc + Number(item.price), 0);
    return subtotal + Number(form.paypalFee);
  };

  const add = async (e) => { 
    e.preventDefault(); 
    const c = clients.find(cl => cl.id === form.clientId); 
    const totalAmount = calculateTotal();

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bills'), {
      ...form, 
      amount: totalAmount,
      clientName: c?.company || 'Cliente', 
      clientData: c || {}, 
      createdAt: Timestamp.now() 
    }); 
  };
  
  const del = async (id) => { if(window.confirm('¿Eliminar este documento de forma permanente?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bills', id)); };
  
  const pdf = (bill) => { 
      const doc = generateBrandedPDF(bill.billingType.toUpperCase(), (d, y) => { 
          const client = bill.clientData || {}; 
          d.setFillColor(245, 245, 245); d.roundedRect(20, y, 170, 40, 3, 3, 'F'); 
          d.setFontSize(10); d.setFont("helvetica", "bold"); d.text("CLIENTE:", 25, y+8); 
          d.setFont("helvetica", "normal"); d.text(bill.clientName, 25, y+16); 
          d.text(`NIT: ${client.nit||''}`, 25, y+22); d.text(`Tel: ${client.phone||''}`, 25, y+28); 
          d.text(`Dir: ${client.address||''}`, 100, y+22); 
          y += 50; 
          
          // Table Header
          d.setFont("helvetica", "bold"); 
          d.text("DESCRIPCIÓN", 20, y); d.text("VALOR", 190, y, null, null, "right"); 
          d.line(20, y+2, 190, y+2); 
          y += 10; 
          
          // Loop Items
          d.setFont("helvetica", "normal"); 
          (bill.items || []).forEach(item => {
              d.text(item.description, 20, y); 
              d.text(formatCurrency(item.price, bill.currency), 190, y, null, null, "right"); 
              y += 8;
          });

          // Fee
          if (bill.paypalFee > 0) {
              d.text("Comisión / Envío", 20, y);
              d.text(formatCurrency(bill.paypalFee, bill.currency), 190, y, null, null, "right");
              y += 8;
          }

          y += 10; 
          d.setFont("helvetica", "bold"); d.setFontSize(14); 
          d.text("TOTAL A PAGAR:", 120, y); 
          d.text(formatCurrency(bill.amount, bill.currency), 190, y + 5, null, null, "right"); 
          return y; 
      }, settings); 
      doc.save(`${bill.billingType}_${bill.clientName}.pdf`); 
  };
  
  const copyAccount = (txt) => { const ta = document.createElement("textarea"); ta.value = txt; ta.style.position="fixed"; ta.style.left="-9999px"; document.body.appendChild(ta); ta.focus(); ta.select(); try { document.execCommand('copy'); alert('Copiado'); } catch(e){} document.body.removeChild(ta); };

  return ( 
    <div className="space-y-8">
      <div className="lg:col-span-3 bg-black p-6 rounded-3xl text-white border-b-4 border-[#f7c303]">
        <h3 className="font-bold mb-4">Medios de Pago</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {PAYMENT_ACCOUNTS.map(a => <div key={a.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <button onClick={()=>copyAccount(a.number)} className="float-right"><Copy size={14}/></button>
            <p className="font-bold text-sm">{a.owner}</p>
            <p className="font-mono text-xs">{a.number}</p>
          </div>)}
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-3xl shadow-lg">
        <h3 className="text-2xl font-black mb-6 text-[#522b85]">Facturación</h3>
        <form onSubmit={add} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <select value={form.clientId} onChange={e=>setForm({...form, clientId: e.target.value})} className="w-full p-4 border rounded-xl" required><option value="">Cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.company}</option>)}</select>
            <select value={form.billingType} onChange={e=>setForm({...form, billingType: e.target.value})} className="w-full p-4 border rounded-xl font-bold text-[#522b85]"><option>Cuenta de Cobro</option><option>Factura</option><option>Cotización</option></select>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-xl border">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-1"><select value={form.currency} onChange={e=>setForm({...form, currency: e.target.value})} className="w-full p-3 border rounded-lg font-bold"><option value="COP">COP</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div>
              <div className="md:col-span-2"><select onChange={handleServiceSelect} className="w-full p-3 border rounded-lg"><option value="">-- Agregar Servicio del Catálogo --</option>{SERVICES_CATALOG.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select></div>
            </div>
            
            {/* Dynamic Items List */}
            <div className="space-y-2 mb-4">
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input 
                      value={item.description} 
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      className="flex-1 p-3 border rounded-lg bg-white" 
                      placeholder="Descripción..."
                    />
                    <input 
                      type="number"
                      value={item.price} 
                      onChange={e => updateItem(idx, 'price', e.target.value)}
                      className="w-32 p-3 border rounded-lg bg-white text-right" 
                      placeholder="0.00"
                    />
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addItem} className="text-sm text-[#522b85] font-bold flex items-center gap-1 hover:underline mt-2"><ListPlus size={16}/> Agregar Ítem</button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 border-t pt-4 mt-4">
                <div><label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><BadgeDollarSign size={12}/> Comisión / Envío (Opcional)</label><input value={form.paypalFee} type="number" onChange={e=>setForm({...form, paypalFee: e.target.value})} className="w-full p-3 border rounded-xl bg-white" placeholder="0"/></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-2">Fecha Cobro</label><input type="date" value={form.nextDate} onChange={e=>setForm({...form, nextDate: e.target.value})} className="w-full p-3 border rounded-xl bg-white" required/></div>
            </div>
            <p className="text-right mt-4 text-xl font-black text-[#522b85]">Total: {formatCurrency(calculateTotal(), form.currency)}</p>
          </div>
          
          <button className="w-full bg-[#522b85] text-white font-bold py-4 rounded-xl">Generar Documento</button>
        </form>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-sm border"><h3 className="text-xl font-black mb-6">Historial</h3>{bills.map(b=>(<div key={b.id} className="flex justify-between p-4 border-b"><div><span className="text-xs font-bold uppercase text-[#522b85]">{b.billingType}</span><h4 className="font-bold">{b.clientName}</h4><p className="text-xs text-gray-400">{b.items?.length || 1} ítems</p></div><div className="text-right"><p className="font-black">{formatCurrency(b.amount, b.currency)}</p><button onClick={()=>pdf(b)} className="bg-[#f7c303] px-3 py-1 rounded text-xs font-bold mt-1">PDF</button></div></div>))}</div>
    </div> 
  );
};
export default Billing;