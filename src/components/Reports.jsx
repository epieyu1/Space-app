import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { formatCurrency } from '../utils/helpers';
import { getFinancialAdvice } from '../utils/geminiAPI';

const Reports = ({ transactions, expenses }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [goals, setGoals] = useState({ annual: 0, monthly: 0 });
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState("");
  
  useEffect(() => { const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'goals', year.toString()), (d) => { if (d.exists()) setGoals(d.data()); else setGoals({ annual: 0, monthly: 0 }); }); return () => unsub(); }, [year]);
  
  const saveGoals = async () => { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'goals', year.toString()), goals); alert("Metas guardadas"); };
  
  const monthlyData = useMemo(() => { 
      const data = Array(12).fill(0).map((_, i) => ({ month: i, income: 0, expense: 0 })); 
      transactions.forEach(t => { const d = t.date?.toDate ? t.date.toDate() : new Date(t.date.seconds * 1000); if (d.getFullYear() === year) data[d.getMonth()].income += Number(t.amount); }); 
      expenses.forEach(e => { const d = e.date?.toDate ? e.date.toDate() : new Date(e.date.seconds * 1000); if (d.getFullYear() === year) data[d.getMonth()].expense += Number(e.amount); }); 
      return data; 
  }, [transactions, expenses, year]);
  
  const annualSummary = useMemo(() => { const totalIncome = monthlyData.reduce((acc, curr) => acc + curr.income, 0); const totalExpense = monthlyData.reduce((acc, curr) => acc + curr.expense, 0); return { totalIncome, totalExpense, net: totalIncome - totalExpense }; }, [monthlyData]);
  
  const generatePDFReport = async () => { 
      const { jsPDF } = await import("jspdf"); 
      const doc = new jsPDF(); 
      doc.setFillColor(82, 43, 133); doc.rect(0, 0, 210, 40, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text(`INFORME ${year}`, 20, 20); doc.save(`Reporte_${year}.pdf`); 
  };
  
  const runAnalysis = async () => { setLoadingAnalysis(true); const result = await getFinancialAdvice({ type: "Annual Report", year, summary: annualSummary, monthly: monthlyData, goals }); setAnalysis(result); setLoadingAnalysis(false); };
  
  return ( <div className="space-y-8"><div className="bg-white p-8 rounded-3xl shadow-lg flex justify-between"><h2 className="text-3xl font-black">Informes {year}</h2><div className="flex gap-4"><select value={year} onChange={e => setYear(Number(e.target.value))} className="p-3 rounded-xl border font-bold"><option value={2024}>2024</option><option value={2025}>2025</option></select><button onClick={generatePDFReport} className="bg-black text-white px-6 py-3 rounded-xl font-bold">Descargar PDF</button></div></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-lg"><h3 className="text-xl font-black mb-6">Mensual</h3>{monthlyData.map((m, i) => (<div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0"><span className="font-bold text-gray-400 w-10">{i+1}</span><span className="text-green-600">{formatCurrency(m.income)}</span><span className="text-red-500">{formatCurrency(m.expense)}</span><span className="font-bold">{formatCurrency(m.income - m.expense)}</span></div>))}</div><div className="bg-white p-8 rounded-3xl shadow-lg"><h3 className="text-lg font-black mb-4">Balance</h3><p>Neto: <span className="font-black text-[#522b85]">{formatCurrency(annualSummary.net)}</span></p><button onClick={runAnalysis} disabled={loadingAnalysis} className="w-full bg-[#f7c303] text-black py-2 rounded-xl font-bold mt-4">{loadingAnalysis?'...':'Analizar IA'}</button>{analysis && <p className="mt-4 text-sm text-gray-600">{analysis}</p>}</div></div></div> );
};
export default Reports;