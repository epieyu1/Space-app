import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { auth, db, appId } from './utils/firebase'; 
import { LayoutDashboard, Users, Wallet, Receipt, HandCoins, FileText, Briefcase, BarChart3, FileSpreadsheet, LogOut, Bell, Settings } from 'lucide-react'; 

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
import NotificationsView from './components/NotificationsView'; 
// SettingsView eliminado, importamos SettingsData si quieres gestionar datos base
import SettingsData from './components/SettingsData'; 

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) { setLoading(false); return; }
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { user, loading };
};

const AuthGate = () => <Login />;

const MainApp = ({ user }) => {
    const [view, setView] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    const [clients, setClients] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loans, setLoans] = useState([]);
    const [bills, setBills] = useState([]);
    const [settings, setSettings] = useState(null);
    const [team, setTeam] = useState([]); 
    const [paymentAccounts, setPaymentAccounts] = useState([]);
    const [servicesCatalog, setServicesCatalog] = useState([]);

    useEffect(() => { 
        const s = document.createElement('script'); 
        s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; 
        s.async=true; document.body.appendChild(s); 
        return () => document.body.removeChild(s); 
    }, []);

    useEffect(() => {
        if (!user || !user.email) return; 
        
        const u1 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'clients')), (s) => setClients(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u2 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'transactions')), (s) => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u3 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'expenses')), (s) => setExpenses(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u4 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'loans')), (s) => setLoans(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u5 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'bills')), (s) => setBills(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u6 = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'general'), (d) => { if(d.exists()) setSettings(d.data()); });
        const u7 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'team')), (s) => setTeam(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u8 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'payment_accounts')), (s) => setPaymentAccounts(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u9 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'services_catalog')), (s) => setServicesCatalog(s.docs.map(d => ({id: d.id, ...d.data()}))));
        
        return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); u9(); }; 
    }, [user]);

    const exportData = () => {
        const h = ["Fecha", "Tipo", "Detalle", "Monto", "Moneda"];
        const r = [
            ...transactions.map(t => [new Date(t.date?.seconds*1000).toLocaleDateString(), "Ingreso", t.clientName, t.amount, t.currency]),
            ...expenses.map(e => [new Date(e.date?.seconds*1000).toLocaleDateString(), "Gasto", e.description, -e.amount, 'COP'])
        ];
        const csv = "data:text/csv;charset=utf-8," + h.join(",") + "\n" + r.map(e=>e.join(",")).join("\n");
        const link = document.createElement("a"); link.setAttribute("href", encodeURI(csv)); link.setAttribute("download", "backup.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const inc = transactions.reduce((a,c)=>a + Number(c.amountCOP || c.amount), 0);
    const exp = expenses.reduce((a,c)=>a+Number(c.amount),0);
    const lns = loans.reduce((a,c)=>a+Number(c.amount),0);
    
    const spaceGrossIncome = transactions.reduce((acc, t) => {
        const amount = Number(t.amountCOP || t.amount);
        const beneficiaries = t.beneficiaries || ['Luis', 'Israel', 'Anthony', 'Space'];
        if (beneficiaries.includes('Space')) {
            return acc + (amount / beneficiaries.length);
        }
        if (!t.beneficiaries) return acc + (amount / 4);
        return acc;
    }, 0);

    const netSpace = spaceGrossIncome - exp - lns;

    // Función para cerrar el menú al cambiar de vista en móvil
    const handleMenuClick = (viewId) => {
        setView(viewId);
        setSidebarOpen(false);
    };

    return (
        <div className="flex min-h-screen bg-white text-black font-sans overflow-hidden relative">
            {/* Overlay oscuro para móvil */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar Responsive */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 shadow-2xl md:shadow-none flex flex-col h-full`}>
                <div className="p-8 md:p-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black">SPACE<span className="text-[#f7c303]">.</span></h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-gray-400">V33.0 Mobile</p>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-red-500">
                        <LogOut size={20} className="rotate-180"/>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
                    {[
                        {id:'dashboard', icon:LayoutDashboard, label:'Dashboard'},
                        {id:'notifications', icon:Bell, label:'Notificaciones'},
                        {id:'reports', icon:BarChart3, label:'Informes y Metas'},
                        {id:'transactions', icon:Wallet, label:'Ingresos'},
                        {id:'expenses', icon:Receipt, label:'Gastos'},
                        {id:'loans', icon:HandCoins, label:'Préstamos'},
                        {id:'clients', icon:Users, label:'Clientes'},
                        {id:'billing', icon:FileText, label:'Facturación'},
                        {id:'team', icon:Briefcase, label:'Equipo'},
                        {id:'data', icon:Settings, label:'Datos Base'}, // Reemplaza Configuración
                    ].map(i => (
                        <button key={i.id} onClick={() => handleMenuClick(i.id)} className={`w-full flex items-center gap-4 px-6 py-4 text-sm font-bold rounded-2xl transition-all ${view===i.id?'bg-[#522b85] text-white shadow-lg':'text-gray-400 hover:bg-gray-50 hover:text-[#522b85]'}`}>
                            <i.icon size={20} className={view===i.id?'text-[#f7c303]':''}/> {i.label}
                        </button>
                    ))}
                    <div className="pt-8 space-y-2">
                        <button onClick={exportData} className="w-full flex items-center justify-center gap-3 px-4 py-4 text-xs font-bold text-gray-500 bg-gray-50 bg-gray-50 rounded-xl hover:bg-[#f7c303] hover:text-black"><FileSpreadsheet size={16}/> Backup</button>
                        <button onClick={()=>signOut(auth)} className="w-full flex items-center justify-center gap-3 px-4 py-4 text-xs font-bold text-red-400 hover:bg-red-50 rounded-xl"><LogOut size={16}/> Salir</button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 md:ml-72 overflow-y-auto h-screen relative bg-white">
                <UserHeader user={user} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
                
                <div className="p-4 md:p-10 pb-20 max-w-7xl mx-auto">
                    {view === 'dashboard' && <Dashboard user={user} transactions={transactions} expenses={expenses} loans={loans} bills={bills} paymentAccounts={paymentAccounts} />}
                    {view === 'notifications' && <NotificationsView clients={clients} team={team} />}
                    {view === 'reports' && <Reports transactions={transactions} expenses={expenses} settings={settings} />}
                    {view === 'transactions' && <Transactions user={user} clients={clients} transactions={transactions} settings={settings} />}
                    {view === 'clients' && <Clients user={user} />}
                    {view === 'expenses' && <Expenses user={user} />}
                    {view === 'loans' && <Loans user={user} spaceBalance={netSpace} settings={settings} />} 
                    {view === 'billing' && <Billing user={user} clients={clients} settings={settings} paymentAccounts={paymentAccounts} servicesCatalog={servicesCatalog} />}
                    {view === 'team' && <Team user={user} />}
                    {view === 'data' && <SettingsData paymentAccounts={paymentAccounts} servicesCatalog={servicesCatalog} />}
                </div>
            </main>
        </div>
    );
};

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100">Cargando...</div>;
  if (user && user.email) return <MainApp user={user} />;
  return <AuthGate />;
}