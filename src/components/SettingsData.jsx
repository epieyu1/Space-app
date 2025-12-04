import React, { useState } from 'react';
import { collection, addDoc, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { formatCurrency } from '../utils/helpers';
import { Landmark, Trash2, ListPlus, CreditCard } from 'lucide-react';

// Datos iniciales por si la base de datos está vacía
const INITIAL_PAYMENT_ACCOUNTS = [
  { id: 'bancolombia_luis', type: 'Bancolombia Ahorros', number: '91200070645', owner: 'Luis Julio', currency: 'COP' },
  { id: 'paypal_isra', type: 'Paypal', number: 'israsubero@gmail.com', owner: 'Israel Subero', currency: 'USD' },
];

const INITIAL_SERVICES_CATALOG = [
  { name: 'Gestión Redes Sociales (Básico)', prices: { COP: 1200000, USD: 350, EUR: 320 } },
  { name: 'Diseño de Logotipo', prices: { COP: 800000, USD: 250, EUR: 230 } },
];

const PARTNERS = ['Luis Julio', 'Israel Subero', 'Anthony'];

// Gestor de Cuentas
const PaymentAccountsManager = ({ accounts }) => {
    const [form, setForm] = useState({ id: '', type: 'Bancolombia Ahorros', number: '', owner: PARTNERS[0], currency: 'COP' });

    const initializeAccounts = async () => {
        if (accounts && accounts.length > 0 || !window.confirm('¿Desea inicializar las cuentas predeterminadas?')) return;
        await Promise.all(INITIAL_PAYMENT_ACCOUNTS.map(acc => 
            setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payment_accounts', acc.id), acc)
        ));
        alert('Cuentas inicializadas.');
    };

    const addOrUpdateAccount = async (e) => {
        e.preventDefault();
        const docId = form.id || form.number.replace(/\D/g, ''); 
        if (!docId) { alert("El número de cuenta es requerido."); return; }
        
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'payment_accounts', docId);
        await setDoc(docRef, { ...form, id: docId });
        setForm({ id: '', type: 'Bancolombia Ahorros', number: '', owner: PARTNERS[0], currency: 'COP' });
    };

    const deleteAccount = async (id) => {
        if (window.confirm('¿Borrar esta cuenta de forma permanente?')) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payment_accounts', id));
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-black flex items-center gap-2 text-[#522b85] border-b pb-2"><Landmark size={20} /> Cuentas de Pago</h3>
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Administra los destinos de pago.</p>
                <button type="button" onClick={initializeAccounts} className="text-xs bg-gray-200 px-3 py-1 rounded-lg hover:bg-gray-300">Inicializar Cuentas</button>
            </div>
            <form onSubmit={addOrUpdateAccount} className="grid md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">Tipo / Número</label><input value={form.number} onChange={e => setForm({...form, number: e.target.value})} placeholder="Número de cuenta" className="w-full p-2 border rounded-lg" required/></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Propietario</label><select value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} className="w-full p-2 border rounded-lg">{PARTNERS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Moneda</label><select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="w-full p-2 border rounded-lg"><option value="COP">COP</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div>
                <div className="md:col-span-4"><button type="submit" className="w-full bg-[#f7c303] text-black font-bold py-2 rounded-xl hover:bg-yellow-400">{form.id ? 'Actualizar' : 'Agregar'}</button></div>
            </form>
            <div className="space-y-3 pt-4">
                {accounts.map(acc => (
                    <div key={acc.id} className="p-3 bg-white rounded-lg border shadow-sm flex justify-between items-center">
                        <div><p className="font-bold text-sm">{acc.owner} ({acc.currency})</p><p className="text-xs text-gray-500 font-mono">{acc.number}</p></div>
                        <button onClick={() => deleteAccount(acc.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Gestor de Servicios
const ServicesCatalogManager = ({ services }) => {
    const [form, setForm] = useState({ name: '', prices: { COP: 0, USD: 0, EUR: 0 } });

    const initializeServices = async () => {
        if (services && services.length > 0 || !window.confirm('¿Desea inicializar el catálogo?')) return;
        await Promise.all(INITIAL_SERVICES_CATALOG.map(svc => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'services_catalog', svc.name), svc)));
        alert('Servicios inicializados.');
    };

    const addOrUpdateService = async (e) => {
        e.preventDefault();
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'services_catalog', form.name), form);
        setForm({ name: '', prices: { COP: 0, USD: 0, EUR: 0 } });
    };
    
    const updatePrice = (currency, value) => { setForm(prev => ({ ...prev, prices: { ...prev.prices, [currency]: Number(value) } })); };
    const deleteService = async (name) => { if (window.confirm(`¿Borrar ${name}?`)) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'services_catalog', name)); };

    return (
        <div className="space-y-6 pt-8 border-t border-gray-200 mt-8">
            <h3 className="text-xl font-black flex items-center gap-2 text-[#522b85]"><CreditCard size={20} /> Catálogo de Servicios</h3>
            <div className="flex justify-between items-center"><p className="text-sm text-gray-500">Define servicios y precios.</p><button type="button" onClick={initializeServices} className="text-xs bg-gray-200 px-3 py-1 rounded-lg hover:bg-gray-300">Inicializar Servicios</button></div>
            <form onSubmit={addOrUpdateService} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Nombre</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: Diseño Web" className="w-full p-2 border rounded-lg font-bold" required/></div>
                <div className="grid grid-cols-3 gap-3">{['COP', 'USD', 'EUR'].map(curr => (<div key={curr}><label className="block text-xs font-bold text-gray-500 mb-1">{curr}</label><input type="number" value={form.prices[curr]} onChange={e => updatePrice(curr, e.target.value)} className="w-full p-2 border rounded-lg" placeholder="0"/></div>))}</div>
                <button type="submit" className="w-full bg-[#522b85] text-white font-bold py-2 rounded-xl hover:bg-[#402068]">Guardar Servicio</button>
            </form>
            <div className="space-y-3 pt-4">
                {services.map(svc => (
                    <div key={svc.name} className="p-3 bg-white rounded-lg border shadow-sm flex justify-between items-center">
                        <div><p className="font-bold text-sm">{svc.name}</p><p className="text-xs text-gray-500">{formatCurrency(svc.prices.COP, 'COP')} | {formatCurrency(svc.prices.USD, 'USD')}</p></div>
                        <button onClick={() => deleteService(svc.name)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SettingsData = ({ paymentAccounts, servicesCatalog }) => {
    return (
        <div className="p-8 bg-white rounded-3xl shadow-lg">
            <h2 className="text-2xl font-black text-[#000000] mb-6">Gestión de Datos Estáticos</h2>
            <PaymentAccountsManager accounts={paymentAccounts} />
            <ServicesCatalogManager services={servicesCatalog} />
        </div>
    );
};
export default SettingsData;