import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getGroups, getSoutenanceSlots } from '@/modules/projects/actions';
import { createClient } from '@/lib/supabase/server';
import { Users, CalendarClock, ClipboardList, ArrowRight, ChevronLeft } from 'lucide-react';

interface WeekPageProps {
  params: Promise<{ weekId: string }>;
}

export default async function WeekPage({ params }: WeekPageProps) {
  const { weekId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  if (profile.role !== 'eleve' && profile.role !== 'professeur') redirect('/dashboard');

  const supabase = await createClient();
  const { data: week } = await supabase.from('project_weeks').select().eq('id', weekId).single();
  if (!week) notFound();

  const [groups, slots] = await Promise.all([
    getGroups(weekId),
    getSoutenanceSlots(weekId),
  ]);

  const start = new Date(week.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const end = new Date(week.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const navCards = [
    { href: `/dashboard/pedagogie/projets/${weekId}/groupes`, icon: Users, label: 'Groupes', value: groups.length, color: 'text-[#0471a6]', bg: 'bg-[#89aae6]/10 border-[#89aae6]/30' },
    { href: `/dashboard/pedagogie/projets/${weekId}/soutenances`, icon: CalendarClock, label: 'Créneaux', value: slots.length, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200/60' },
    { href: `/dashboard/pedagogie/projets/${weekId}/retro`, icon: ClipboardList, label: 'Rétro', value: '→', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200/60' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/pedagogie/projets"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Retour aux semaines
        </Link>
        <h1 className="text-2xl font-bold text-[#061826]">{week.title}</h1>
        <p className="text-sm text-slate-500">{start} → {end}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {navCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`group flex flex-col items-center gap-1.5 rounded-2xl border px-6 py-6 text-center transition-all hover:shadow-md ${card.bg}`}
          >
            <card.icon className={`h-6 w-6 ${card.color}`} />
            <span className={`text-3xl font-bold ${card.color}`}>{card.value}</span>
            <span className="text-sm text-slate-500">{card.label}</span>
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href={`/dashboard/pedagogie/projets/${weekId}/groupes`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all"
        >
          Voir les groupes
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/dashboard/pedagogie/projets/${weekId}/retro`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Mur de rétro
        </Link>
      </div>
    </div>
  );
}
