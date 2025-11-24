import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { formatCurrency, convertToBase64, motivationalQuotes } from '../utils/helpers';
import { PAYMENT_ACCOUNTS } from '../utils/paymentAccounts';
import { Bell, AlertTriangle, MessageCircle, CheckCircle2, Camera } from 'lucide-react';

const Dashboard = ({ user, transactions, expenses, loans, bills }) => {
  const [quote, setQuote] = useState('');
  const [partnerImages, setPartnerImages] = useState({});
  const [checkedAlerts, setCheckedAlerts] = useState({}); 

  useEffect(() => {
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'partners'), (d) => {
      if (d.exists()) setPartnerImages(d.data());
    });
    return () => unsub();
  }, []);

  const alerts = useMemo(() => {
    if (!bills) return [];
    const today = new Date();
    today.setHours(0,0,0,0);
    return bills.filter(bill => {
      if (!bill.nextDate) return false;
      const [y,m,d] = bill.nextDate.split('-').map(Number);
      const billDate = new Date(y, m-1, d); 
      const diffDays = Math.ceil((billDate - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && !checkedAlerts[bill.id];
    }).map(bill => {
        const [y,m,d] = bill.nextDate.split('-').map(Number);
        const diffDays = Math.ceil((new Date(y, m-1, d) - new Date()) / (1000 * 60 * 60 * 24));
        return { ...bill, daysLeft: diffDays };
    });
  }, [bills, checkedAlerts]);

  const handleImg = async (name, e) => { 
    const f = e.target.files[0]; 
    if(f) { 
      try { 
        const b64 = await convertToBase64(f); 
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'partners'), { ...partnerImages, [name]: b64 }); 
      } catch(e){} 
    } 
  };

  const copyReminder = (alert) => {
    const account = PAYMENT_ACCOUNTS.find(a => a.id === alert.targetAccount) || PAYMENT_ACCOUNTS[0];
    const msg = `Hola ${alert.clientName}, recordatorio de pago ${alert.concept}. Cuenta: ${account.type} ${account.number} (${account.owner}).`;
    const ta = document.createElement("textarea"); ta.value = msg; ta.style.position="fixed"; ta.style.left="-9999px"; document.body.appendChild(ta); ta.focus(); ta.select(); try { document.execCommand('copy'); alert('Copiado'); } catch(e){} document.body.removeChild(ta);
  };

  const dismissAlert = (id) => {
    setCheckedAlerts(prev => ({...prev, [id]: true}));
  };

  // CÁLCULO DE INGRESOS TOTALES: Usa amountCOP si existe, sino amount
  const inc = transactions.reduce((a,c)=>a + Number(c.amountCOP || c.amount), 0);
  const exp = expenses.reduce((a,c)=>a+Number(c.amount),0);
  const lns = loans.reduce((a,c)=>a+Number(c.amount),0);
  const split = inc/4;
  const net = split - exp - lns; 

  return (
    <div className="space-y-8">
      {alerts.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border-l-4 border-[#f7c303] animate-fade-in-down">
          <h3 className="text-xl font-black text-[#000000] mb-4 flex items-center gap-2">
            <Bell className="text-[#f7c303] fill-current" /> Cobros Pendientes
          </h3>
          <div className="grid gap-4">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-gray-50 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-100">
                <div className="flex items-center gap-4 w-full">
                  <div className={`p-3 rounded-full ${alert.daysLeft < 0 ? 'bg-red-100 text-red-600' : 'bg-[#f7c303]/20 text-[#d4a000]'}`}>
                    {alert.daysLeft < 0 ? <AlertTriangle size={20}/> : <Bell size={20}/>}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{alert.clientName}</h4>
                    <p className="text-sm text-gray-500">{alert.concept} • {alert.daysLeft < 0 ? 'Vencido' : 'Próximo'}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => copyReminder(alert)} className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><MessageCircle size={16}/> WhatsApp</button>
                  <button onClick={() => dismissAlert(alert.id)} className="flex-1 md:flex-none bg-gray-200 hover:bg-gray-300 text-gray-600 px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Listo</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-black to-[#1a1a1a] rounded-[2.5rem] p-10 text-white shadow-2xl border-b-4 border-[#f7c303]"><h2 className="text-4xl font-black mb-3">Hola, Equipo <span className="text-[#f7c303]">🚀</span></h2><p className="opacity-80 italic font-light border-l-2 border-[#522b85] pl-4">"{quote}"</p></div>
      <div className="grid md:grid-cols-3 gap-6"><div className="bg-white p-8 rounded-3xl shadow-lg"><h3 className="text-gray-400 font-bold text-xs tracking-widest mb-6">INGRESOS TOTALES (COP)</h3><p className="text-4xl font-black">{formatCurrency(inc)}</p></div><div className="bg-white p-8 rounded-3xl shadow-lg"><h3 className="text-gray-400 font-bold text-xs tracking-widest mb-6">GASTOS</h3><p className="text-4xl font-black">{formatCurrency(exp)}</p></div><div className="bg-white p-8 rounded-3xl shadow-lg"><h3 className="text-gray-400 font-bold text-xs tracking-widest mb-6">PRÉSTAMOS</h3><p className="text-4xl font-black">{formatCurrency(lns)}</p></div></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{['Luis','Israel','Anthony'].map(p=><div key={p} className="bg-white p-6 rounded-3xl shadow-sm flex flex-col items-center relative group"><div className="w-20 h-20 rounded-full bg-gray-50 border-4 border-white shadow-lg mb-4 overflow-hidden flex items-center justify-center">{partnerImages[p]?<img src={partnerImages[p]} className="w-full h-full object-cover"/>:<span className="text-2xl font-bold text-gray-300">{p[0]}</span>}<label className="absolute bottom-20 right-6 bg-black text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer"><Camera size={12}/><input type="file" className="hidden" onChange={e=>handleImg(p,e)}/></label></div><span className="text-xs font-bold text-[#522b85] uppercase">Socio</span><span className="font-bold text-lg">{p}</span><span className="font-black font-mono text-xl mt-2">{formatCurrency(split)}</span></div>)}<div className="bg-[#522b85] p-6 rounded-3xl shadow-xl text-center text-white"><div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 font-black text-2xl mx-auto text-[#f7c303]">S</div><span className="text-xs font-bold uppercase opacity-60">Caja Menor (Disponible)</span><span className="font-bold text-lg block">Space</span><span className={`block font-black font-mono text-xl mt-2 ${net>=0?'text-[#f7c303]':'text-red-400'}`}>{formatCurrency(net)}</span></div></div>
    </div>
  );
};
export default Dashboard;