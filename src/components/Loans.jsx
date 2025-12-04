import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { formatCurrency } from '../utils/helpers';
import { generateBrandedPDF } from '../utils/pdfGenerator';
import { HandCoins, AlertTriangle, FileSignature, Trash2 } from 'lucide-react';

const Loans = ({ user, settings, spaceBalance }) => {
  const [amount, setAmount] = useState('');
  const [borrower, setBorrower] = useState('');
  const [date, setDate] = useState('');
  const [concept, setConcept] = useState('');
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'loans'));
    const unsubscribe = onSnapshot(q, (s) => {
      setLoans(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
    return () => unsubscribe();
  }, [user]);

  const generateLoanPDF = (loanData) => {
    const doc = generateBrandedPDF("COMPROBANTE DE PRÉSTAMO", (d, y) => {
       d.setFillColor(245, 245, 245); d.roundedRect(20, y, 170, 30, 3, 3, 'F');
       d.setFontSize(10); d.setFont("helvetica", "bold"); d.text("BENEFICIARIO:", 25, y+10);
       d.setFont("helvetica", "normal"); d.text(loanData.borrower, 60, y+10);
       d.text(`Fecha Préstamo: ${new Date(loanData.date.seconds * 1000).toLocaleDateString()}`, 60, y+18);
       
       y += 45;
       d.setFont("helvetica", "bold"); d.text("CONCEPTO", 20, y); d.text("MONTO", 190, y, null, null, "right");
       d.line(20, y+2, 190, y+2);
       y += 10;
       d.setFont("helvetica", "normal"); d.text(loanData.concept, 20, y);
       d.text(formatCurrency(loanData.amount), 190, y, null, null, "right");
       
       y += 40;
       d.line(20, y, 80, y); d.text("Firma Beneficiario", 20, y+5);
       d.line(110, y, 170, y); d.text("Firma Autoriza (Space)", 110, y+5);
       return y + 20;
    }, settings);
    doc.save(`Prestamo_${loanData.borrower}.pdf`);
  };

  const addLoan = async (e) => {
    e.preventDefault();
    const loanDate = date ? new Date(date) : new Date();
    const newLoan = { amount: Number(amount), borrower, concept, date: Timestamp.fromDate(loanDate), createdAt: Timestamp.now() };
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'loans'), newLoan);
    generateLoanPDF(newLoan);
    setAmount(''); setBorrower(''); setConcept(''); setDate('');
  };

  const deleteLoan = async (id) => {
    if(window.confirm('¿Borrar préstamo?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'loans', id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-lg">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h3 className="text-2xl font-black text-[#000000] flex items-center"><HandCoins className="inline mr-2 text-[#522b85]"/> Nuevo Préstamo (Caja Menor)</h3>
          <div className={`text-right text-sm font-bold px-4 py-2 rounded-xl ${spaceBalance >= 0 ? 'bg-[#f7c303]/20 text-[#d4a000]' : 'bg-red-100 text-red-600'}`}>
            Disponible: {formatCurrency(spaceBalance)}
          </div>
        </div>
        <form onSubmit={addLoan} className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Beneficiario</label><input value={borrower} onChange={e=>setBorrower(e.target.value)} className="w-full p-4 border rounded-xl font-medium bg-gray-50" placeholder="Nombre Completo" required/></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha del Préstamo</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-4 border rounded-xl bg-gray-50" required/></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Monto (COP)</label><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-4 border rounded-xl text-xl font-bold text-[#d4a000] bg-gray-50" placeholder="0.00" required/></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Concepto / Motivo</label><input value={concept} onChange={e=>setConcept(e.target.value)} className="w-full p-4 border rounded-xl bg-gray-50" placeholder="Ej: Adelanto de nómina" required/></div></div>{Number(amount) > spaceBalance && <p className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertTriangle size={12}/> Advertencia: El monto excede el saldo de Caja Menor disponible.</p>}<button className="w-full bg-[#522b85] hover:bg-[#3e1f66] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#522b85]/20 transition-all">Registrar y Generar PDF</button></form>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-black mb-6 text-[#000000]">Libro de Préstamos</h3>
        <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="text-gray-400 text-xs uppercase border-b border-gray-100"><th className="pb-3 pl-2">Fecha</th><th className="pb-3">Beneficiario</th><th className="pb-3">Motivo</th><th className="pb-3 text-right">Monto</th><th className="pb-3 text-right pr-2">Acción</th></tr></thead><tbody className="divide-y divide-gray-50">{loans.map(l => (<tr key={l.id} className="hover:bg-gray-50 transition-colors"><td className="py-4 pl-2 text-sm text-gray-500">{l.date?.seconds ? new Date(l.date.seconds * 1000).toLocaleDateString() : ''}</td><td className="py-4 font-bold text-gray-800">{l.borrower}</td><td className="py-4 text-sm text-gray-600">{l.concept}</td><td className="py-4 text-right font-black text-[#d4a000]">{formatCurrency(l.amount)}</td><td className="py-4 text-right pr-2 flex justify-end gap-2"><button onClick={() => generateLoanPDF(l)} className="text-[#522b85] hover:text-black p-1" title="Descargar PDF"><FileSignature size={16}/></button><button onClick={() => deleteLoan(l.id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>
      </div>
    </div>
  );
};
export default Loans;