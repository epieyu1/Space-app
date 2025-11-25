import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, appId } from '../utils/firebase';
import { formatCurrency } from '../utils/helpers';
import { generateBrandedPDF } from '../utils/pdfGenerator';
import { BarChart3, Download, Target, BrainCircuit, Sparkles } from 'lucide-react';

const Reports = ({ transactions, expenses, settings }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState('all'); 
  const [goals, setGoals] = useState({ annual: 0, monthly: 0 });
  const [analysis, setAnalysis] = useState("Análisis IA deshabilitado por seguridad."); 

  useEffect(() => { 
      const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'goals', year.toString()), (d) => { 
          if (d.exists()) setGoals(d.data()); 
          else setGoals({ annual: 0, monthly: 0 }); 
      }); 
      return () => unsub(); 
  }, [year]);
  
  const saveGoals = async () => { 
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'goals', year.toString()), goals); 
      alert("Metas guardadas"); 
  };
  
  const monthlyData = useMemo(() => { 
      const data = Array(12).fill(0).map((_, i) => ({ month: i, income: 0, expense: 0 })); 
      transactions.forEach(t => { 
          const d = t.date?.toDate ? t.date.toDate() : new Date(t.date.seconds * 1000); 
          if (d.getFullYear() === year) data[d.getMonth()].income += Number(t.amountCOP || t.amount); 
      }); 
      expenses.forEach(e => { 
          const d = e.date?.toDate ? e.date.toDate() : new Date(e.date.seconds * 1000); 
          if (d.getFullYear() === year) data[d.getMonth()].expense += Number(e.amount); 
      }); 
      return data; 
  }, [transactions, expenses, year]);
  
  const annualSummary = useMemo(() => { 
      const totalIncome = monthlyData.reduce((acc, curr) => acc + curr.income, 0); 
      const totalExpense = monthlyData.reduce((acc, curr) => acc + curr.expense, 0); 
      return { totalIncome, totalExpense, net: totalIncome - totalExpense }; 
  }, [monthlyData]);

  const currentData = useMemo(() => { 
      if (month === 'all') 
          return { income: annualSummary.totalIncome, expense: annualSummary.totalExpense, net: annualSummary.net, goal: goals.annual }; 
      const mData = monthlyData[Number(month)]; 
      return { income: mData.income, expense: mData.expense, net: mData.income - mData.expense, goal: goals.monthly }; 
  }, [month, annualSummary, monthlyData, goals]);

  const generatePDFReport = () => { 
      const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]; 
      const title = month === 'all' ? `INFORME ANUAL ${year}` : `INFORME ${monthNames[Number(month)]} ${year}`; 
      
      const doc = generateBrandedPDF(title, (d, y) => { 
          d.setTextColor(0, 0, 0); d.setFontSize(14); d.setFont("helvetica", "bold"); 
          d.text("RESUMEN EJECUTIVO", 20, y); 
          
          d.setFontSize(10); d.setFont("helvetica", "normal"); 
          d.text(`Ingresos: ${formatCurrency(currentData.income)}`, 20, y + 10); 
          d.text(`Gastos: ${formatCurrency(currentData.expense)}`, 20, y + 16); 
          d.text(`Utilidad Neta: ${formatCurrency(currentData.net)}`, 20, y + 22); 
          d.text(`Meta: ${formatCurrency(currentData.goal)} (${currentData.goal > 0 ? Math.round((currentData.income / currentData.goal) * 100) : 0}% logrado)`, 20, y + 28); 
          
          let tY = y + 45; 
          
          if (month === 'all') { 
              d.setFillColor(247, 195, 3); d.rect(20, tY, 170, 10, 'F'); 
              d.setTextColor(0,0,0); d.setFont("helvetica", "bold"); 
              d.text("Mes", 25, tY + 7); d.text("Ingresos", 70, tY + 7); d.text("Gastos", 120, tY + 7); d.text("Neto", 170, tY + 7); 
              tY += 15; 
              d.setFont("helvetica", "normal"); 
              const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]; 
              monthlyData.forEach((m, i) => { 
                  d.text(months[i], 25, tY); d.text(formatCurrency(m.income), 70, tY); d.text(formatCurrency(m.expense), 120, tY); 
                  const bal = m.income - m.expense; 
                  d.setTextColor(bal >= 0 ? 0 : 200, bal >= 0 ? 100 : 0, 0); 
                  d.text(formatCurrency(bal), 170, tY); 
                  d.setTextColor(0,0,0); 
                  tY += 8; 
              }); 
          } else { 
              const monthTrans = transactions.filter(t => { 
                  const dateObj = t.date?.toDate ? t.date.toDate() : new Date(t.date.seconds * 1000); 
                  return dateObj.getFullYear() === year && dateObj.getMonth() === Number(month); 
              }); 
              const monthExps = expenses.filter(e => { 
                  const dateObj = e.date?.toDate ? e.date.toDate() : new Date(e.date.seconds * 1000); 
                  return dateObj.getFullYear() === year && dateObj.getMonth() === Number(month); 
              }); 
              
              d.setFont("helvetica", "bold"); d.text("DETALLE DE MOVIMIENTOS", 20, tY); 
              tY += 10; 
              
              // INGRESOS DETAIL
              d.setFillColor(240, 255, 240); d.rect(20, tY, 170, 8, 'F'); 
              d.setFontSize(10); d.setTextColor(0, 100, 0); 
              d.text(`INGRESOS (${monthTrans.length})`, 25, tY + 6); 
              tY += 12; 
              d.setTextColor(0); d.setFont("helvetica", "normal"); 
              monthTrans.forEach(t => { 
                  if (tY > 270) { d.addPage(); tY = 20; } 
                  d.text(`${t.date?.seconds ? new Date(t.date.seconds*1000).toLocaleDateString() : ''} - ${t.clientName}`, 20, tY); 
                  d.text(formatCurrency(t.amountCOP || t.amount), 190, tY, null, null, "right"); 
                  tY += 6; 
              }); 
              tY += 5; 
              
              // GASTOS DETAIL
              d.setFillColor(255, 240, 240); d.rect(20, tY, 170, 8, 'F'); 
              d.setFont("helvetica", "bold"); d.setTextColor(200, 0, 0); 
              d.text(`GASTOS (${monthExps.length})`, 25, tY + 6); 
              tY += 12; 
              d.setTextColor(0); d.setFont("helvetica", "normal"); 
              monthExps.forEach(e => { 
                  if (tY > 270) { d.addPage(); tY = 20; } 
                  d.text(`${e.date?.seconds ? new Date(e.date.seconds*1000).toLocaleDateString() : ''} - ${e.description}`, 20, tY); 
                  d.text(`-${formatCurrency(e.amount)}`, 190, tY, null, null, "right"); 
                  tY += 6; 
              }); 
          } 
          return tY; 
      }, settings); 
      doc.save(`Reporte_${month === 'all' ? 'Anual' : 'Mensual'}_${year}.pdf`); 
  };
  
  return ( 
    <div className="space-y-8">
        <div className="bg-white p-8 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h2 className="text-3xl font-black text-[#000000]">Informes</h2>
                <p className="text-gray-500">Visualiza el rendimiento financiero.</p>
            </div>
            <div className="flex gap-2">
                <select value={month} onChange={e => setMonth(e.target.value)} className="p-3 rounded-xl border font-bold text-[#522b85]">
                    <option value="all">Todo el Año</option>
                    <option value="0">Enero</option><option value="1">Febrero</option><option value="2">Marzo</option><option value="3">Abril</option><option value="4">Mayo</option><option value="5">Junio</option><option value="6">Julio</option><option value="7">Agosto</option><option value="8">Septiembre</option><option value="9">Octubre</option><option value="10">Noviembre</option><option value="11">Diciembre</option>
                </select>
                <select value={year} onChange={e => setYear(Number(e.target.value))} className="p-3 rounded-xl border font-bold">
                    <option value={2024}>2024</option><option value={2025}>2025</option><option value={2026}>2026</option>
                </select>
                <button onClick={generatePDFReport} className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Download size={18}/> PDF</button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-lg">
                <h3 className="text-xl font-black mb-6 text-[#000000] flex items-center gap-2"><BarChart3 className="text-[#522b85]"/> {month === 'all' ? 'Rendimiento Anual' : 'Resumen del Mes'}</h3>
                {month === 'all' ? (
                    <div className="overflow-x-auto">
                        <div className="min-w-[600px] space-y-4">
                            {monthlyData.map((m, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 items-center text-sm">
                                    <span className="col-span-1 font-bold text-gray-400 uppercase">{["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][i]}</span>
                                    <div className="col-span-9 h-8 bg-gray-50 rounded-lg relative overflow-hidden flex items-center">
                                        <div className="absolute top-0 left-0 h-full bg-[#522b85]" style={{ width: `${Math.min((m.income / (goals.monthly || 1)) * 100, 100)}%` }}></div>
                                        <div className="absolute top-0 left-0 h-full bg-red-500 opacity-30" style={{ width: `${Math.min((m.expense / (goals.monthly || 1)) * 100, 100)}%` }}></div>
                                        <span className="relative z-10 ml-2 text-xs text-white font-bold drop-shadow-md">{formatCurrency(m.income)}</span>
                                    </div>
                                    <div className="col-span-2 text-right text-xs font-bold text-[#000000]">{formatCurrency(m.income - m.expense)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-6 bg-green-50 rounded-2xl"><p className="text-gray-500 text-xs uppercase font-bold">Ingresos</p><p className="text-2xl font-black text-green-600">{formatCurrency(currentData.income)}</p></div>
                        <div className="p-6 bg-red-50 rounded-2xl"><p className="text-gray-500 text-xs uppercase font-bold">Gastos</p><p className="text-2xl font-black text-red-600">{formatCurrency(currentData.expense)}</p></div>
                        <div className="col-span-2 p-6 bg-gray-50 rounded-2xl"><p className="text-gray-500 text-xs uppercase font-bold">Neto</p><p className={`text-3xl font-black ${currentData.net >= 0 ? 'text-[#522b85]' : 'text-red-500'}`}>{formatCurrency(currentData.net)}</p></div>
                    </div>
                )}
            </div>

            {/* Metas sin Análisis IA */}
            <div className="space-y-8">
                <div className="bg-[#522b85] p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><Target/> Metas</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs opacity-70 block mb-1">Meta Anual</label><input type="number" value={goals.annual} onChange={e => setGoals({...goals, annual: Number(e.target.value)})} className="bg-white/10 border border-white/20 rounded-lg w-full p-2 text-white"/></div>
                            <div><label className="text-xs opacity-70 block mb-1">Meta Mensual</label><input type="number" value={goals.monthly} onChange={e => setGoals({...goals, monthly: Number(e.target.value)})} className="bg-white/10 border border-white/20 rounded-lg w-full p-2 text-white"/></div>
                            <button onClick={saveGoals} className="w-full bg-[#f7c303] text-black font-bold py-2 rounded-lg text-sm hover:bg-yellow-400">Guardar Metas</button>
                        </div>
                    </div>
                </div>
                {/* Bloque de Análisis IA (Deshabilitado) */}
                <div className="bg-gradient-to-br from-[#000000] to-[#333] p-6 rounded-3xl text-white shadow-xl">
                     <h3 className="font-bold flex items-center gap-2 mb-2"><BrainCircuit size={20}/> Análisis IA</h3>
                     <p className="text-xs text-gray-300 mb-4">El análisis de estrategia está temporalmente deshabilitado por seguridad (clave API expuesta).</p>
                     <button className="w-full bg-gray-600 text-white py-2 rounded-xl font-bold text-sm cursor-not-allowed">Deshabilitado</button>
                </div>
            </div>
        </div>
    </div> 
  );
};
export default Reports;