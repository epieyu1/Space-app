import React, { useMemo } from 'react';
import { Sparkles, Bell, PartyPopper, Clock } from 'lucide-react';

const NotificationsView = ({ clients, team }) => {
  const notifications = useMemo(() => {
    const notes = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    if (team) {
      team.forEach(member => {
        if (member.birthDate) {
          const [y, m, d] = member.birthDate.split('-').map(Number);
          const bdayThisYear = new Date(today.getFullYear(), m - 1, d);
          const diffTime = bdayThisYear - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 5) {
            notes.push({ id: `bday-${member.id}`, type: 'birthday', title: `🎉 ¡Cumpleaños de ${member.fullName}!`, desc: diffDays === 0 ? '¡Es hoy! Deséale un feliz día.' : `Será en ${diffDays} días (${d}/${m}).`, date: bdayThisYear });
          }
        }
      });
    }
    if (clients) {
      clients.forEach(client => {
        if (client.cutOffDay) {
          const cutDay = Number(client.cutOffDay);
          const currentDay = today.getDate();
          const diff = cutDay - currentDay;
          if (diff >= 0 && diff <= 3) {
             notes.push({ id: `bill-${client.id}`, type: 'billing', title: `🔔 Corte: ${client.company}`, desc: diff === 0 ? '¡El corte es HOY!' : `Corte en ${diff} días (Día ${cutDay}).`, date: today });
          }
        }
      });
    }
    return notes.sort((a,b) => a.type === 'birthday' ? -1 : 1);
  }, [clients, team]);
  return ( <div className="space-y-6"><div className="bg-white p-8 rounded-3xl shadow-lg"><h2 className="text-3xl font-black text-[#000000] mb-2 flex items-center gap-3"><Bell className="text-[#f7c303] fill-current" /> Centro de Notificaciones</h2><p className="text-gray-500">Alertas automáticas de cumpleaños y cortes de facturación.</p></div><div className="grid gap-4">{notifications.length === 0 ? (<div className="bg-gray-50 p-8 rounded-2xl text-center text-gray-400 border-2 border-dashed border-gray-200"><Sparkles className="mx-auto mb-2 text-gray-300" size={32}/><p>Todo tranquilo por aquí. No hay alertas próximas.</p></div>) : (notifications.map(note => (<div key={note.id} className={`p-6 rounded-2xl border-l-4 shadow-sm flex items-center gap-4 ${note.type === 'birthday' ? 'bg-purple-50 border-purple-500' : 'bg-yellow-50 border-yellow-500'}`}><div className={`p-3 rounded-full ${note.type === 'birthday' ? 'bg-purple-100 text-purple-600' : 'bg-yellow-100 text-yellow-600'}`}>{note.type === 'birthday' ? <PartyPopper size={24} /> : <Clock size={24} />}</div><div><h4 className="font-bold text-lg text-gray-900">{note.title}</h4><p className="text-sm text-gray-600">{note.desc}</p></div></div>)))}</div></div> );
};
export default NotificationsView;