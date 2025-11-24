import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { auth, db, appId } from './utils/firebase';
// IMPORTACIÓN CORREGIDA: Incluye 'Settings' para resolver el error de ReferenceError
import { LayoutDashboard, Users, Wallet, Receipt, HandCoins, FileText, Briefcase, BarChart3, FileSpreadsheet, LogOut, Settings } from 'lucide-react'; 

// Importación de componentes
import Login from './components/Login';
import UserHeader from './components/UserHeader';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Transactions from './components/Transactions';
import Clients from './components/Clients';
import Expenses from './components/Expenses';
import Billing from './components/Billing';
import Team from './components/Team';
import Loans from './components/Loans';
import SettingsView from './components/SettingsView'; 

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Estados Globales
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loans, setLoans] = useState([]);
  const [bills, setBills] = useState([]);
  const [settings, setSettings] = useState(null);

  // Carga de librería PDF (Se mantiene el método de CDN para jspdf)
  useEffect(() => { const s = document.createElement('script'); s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; s.async=true; document.body.appendChild(s); return () => document.body.removeChild(s); }, []);

  // Inicialización y Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
        } else {
            // Manejo de usuario no autenticado (para login por credenciales)
            setUser(null);
        }
    });
    return () => unsub();
  }, []);

  // Firestore Listeners (se activa solo si hay usuario)
  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'clients')), (s) => setClients(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u2 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'transactions')), (s) => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u3 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'expenses')), (s) => setExpenses(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u4 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'loans')), (s) => setLoans(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u5 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'bills')), (s) => setBills(s.docs.map(d => ({id: d.id, ...d.data()}))));
    
    // Listener para configuración
    const docSettings = doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'general');
    const u6 = onSnapshot(docSettings, (d) => { if(d.exists()) setSettings(d.data()); });
    
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); };
  }, [user]);

  // Cálculo de Caja Menor (Balance Total / 4 - Gastos - Préstamos)
  const inc = transactions.reduce((a,c)=>a + Number(c.amountCOP || c.amount), 0);
  const exp = expenses.reduce((a,c)=>a+Number(c.amount),0);
  const lns = loans.reduce((a,c)=>a+Number(c.amount),0);
  const spaceBalance = (inc/4) - exp - lns;

  const exportData = () => {
    const h = ["Fecha", "Tipo", "Detalle", "Monto", "Moneda"];
    const r = [
      ...transactions.map(t => [new Date(t.date?.seconds*1000).toLocaleDateString(), "Ingreso", t.clientName, t.amount, t.currency]),
      ...expenses.map(e => [new Date(e.date?.seconds*1000).toLocaleDateString(), "Gasto", e.description, -e.amount, 'COP'])
    ];
    const csv = "data:text/csv;charset=utf-8," + h.join(",") + "\n" + r.map(e=>e.join(",")).join("\n");
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csv)); link.setAttribute("download", "backup.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (!user) return <Login />;

  const menuItems = [
    {id:'dashboard', icon:LayoutDashboard, label:'Dashboard'},
    {id:'reports', icon:BarChart3, label:'Informes y Metas'},
    {id:'transactions', icon:Wallet, label:'Ingresos'},
    {id:'expenses', icon:Receipt, label:'Gastos'},
    {id:'loans', icon:HandCoins, label:'Préstamos'},
    {id:'clients', icon:Users, label:'Clientes'},
    {id:'billing', icon:FileText, label:'Facturación'},
    {id:'team', icon:Briefcase, label:'Equipo'},
    {id:'settings', icon:Settings, label:'Configuración'}
  ];

  return (
    <div className="flex min-h-screen bg-white text-black font-sans overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r transform ${isSidebarOpen?'translate-x-0':'-translate-x-full'} md:translate-x-0 transition-transform shadow-2xl md:shadow-none flex flex-col h-full`}>
        <div className="p-10"><h1 className="text-4xl font-black">SPACE<span className="text-[#f7c303]">.</span></h1><p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-gray-400">V21.0 Profile</p></div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
          {menuItems.map(i => (
            <button key={i.id} onClick={()=>{setView(i.id);setSidebarOpen(false)}} className={`w-full flex items-center gap-4 px-6 py-4 text-sm font-bold rounded-2xl transition-all ${view===i.id?'bg-[#522b85] text-white shadow-lg':'text-gray-400 hover:bg-gray-50 hover:text-[#522b85]'}`}>
              <i.icon size={20} className={view===i.id?'text-[#f7c303]':''}/> {i.label}
            </button>
          ))}
          <div className="pt-8 space-y-2">
            <button onClick={exportData} className="w-full flex items-center justify-center gap-3 px-4 py-4 text-xs font-bold text-gray-500 bg-gray-50 rounded-xl hover:bg-[#f7c303] hover:text-black"><FileSpreadsheet size={16}/> Backup</button>
            <button onClick={()=>signOut(auth)} className="w-full flex items-center justify-center gap-3 px-4 py-4 text-xs font-bold text-red-400 hover:bg-red-50 rounded-xl"><LogOut size={16}/> Salir</button>
          </div>
        </div>
      </aside>
      <main className="flex-1 md:ml-72 overflow-y-auto h-screen relative bg-white">
        {/* Encabezado de Usuario */}
        <UserHeader user={user} />
        
        <div className="p-4 md:p-10 pb-20 max-w-7xl mx-auto">
          {view === 'dashboard' && <Dashboard user={user} transactions={transactions} expenses={expenses} loans={loans} bills={bills} />}
          {view === 'reports' && <Reports transactions={transactions} expenses={expenses} />}
          {view === 'transactions' && <Transactions user={user} clients={clients} transactions={transactions} />}
          {view === 'clients' && <Clients user={user} />}
          {view === 'expenses' && <Expenses user={user} />}
          {view === 'loans' && <Loans user={user} spaceBalance={spaceBalance} />} 
          {view === 'billing' && <Billing user={user} clients={clients} />}
          {view === 'team' && <Team user={user} />}
          {view === 'settings' && <SettingsView user={user} settings={settings} />}
        </div>
      </main>
    </div>
  );
}