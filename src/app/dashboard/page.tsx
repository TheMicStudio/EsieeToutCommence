import { getCurrentUserProfile } from '@/modules/auth/actions';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  CalendarDays,
  GraduationCap,
  MessageSquare,
  Newspaper,
  Sparkles,
  Users,
} from 'lucide-react';

// Actions pédagogie
import {
  computeAverage,
  getCourseMaterials,
  getMyClass,
  getMyTeacherClasses,
} from '@/modules/pedagogy/actions';

// Actions présence
import { getMyAttendanceHistory, getMyTeacherSessions } from '@/modules/attendance/actions';

// Actions support / admin
import { getAllTickets, getMyTickets } from '@/modules/support/actions';
import { getClasses } from '@/modules/admin/actions';
import { getAllUsers } from '@/modules/admin/users-actions';

// Actions actualités
import { getNewsPosts } from '@/modules/news/actions';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/modules/news/types';

// Actions parent
import { getMyLinks } from '@/modules/parent/actions';

export const metadata = { title: 'Tableau de bord — EsieeToutCommence' };

// ── Visuels ──────────────────────────────────────────────────────────────────

const BAR_HEIGHTS = [40, 55, 35, 70, 50, 80, 60];

function BarVisual({ heights = BAR_HEIGHTS }: { heights?: number[] }) {
  return (
    <div className="flex items-end gap-1 h-12">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-[#0471a6]/20 group-hover:bg-[#0471a6]/30 transition-colors"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function CircleVisual({ value }: { value: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative h-12 w-12">
      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-slate-100" />
        <circle
          cx="22" cy="22" r={r} fill="none" strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" className="stroke-[#0471a6]"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#0471a6]">
        {value}%
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const latestNews = await getNewsPosts(4);

  const { profile, role } = userProfile;

  // ── Données selon le rôle ──────────────────────────────────────────────────
  let heroLabel = '';
  let heroValue = '';
  let heroTrend = '';
  let heroSub = '';
  let heroTrendUp = true;
  let heroCtaHref = '/dashboard';
  let heroCtaLabel = 'Accéder';

  type StatCard = {
    label: string;
    value: string;
    sub: string;
    icon: React.ElementType;
    iconBg: string;
    href: string;
    visual: 'bars' | 'circle' | 'badge';
    circleValue?: number;
    barHeights?: number[];
    badges?: string[];
  };

  let stats: StatCard[] = [];

  if (role === 'eleve') {
    const classe = await getMyClass();

    // Moyennes
    const averages = classe
      ? await computeAverage(profile.id, classe.id)
      : [];
    const globalMoy = averages.length > 0
      ? averages.reduce((sum, a) => sum + a.moyenne, 0) / averages.length
      : null;

    // Présence
    const attendanceHistory = await getMyAttendanceHistory();
    const presentCount = attendanceHistory.length;

    // Cours
    const materials = classe ? await getCourseMaterials(classe.id) : [];

    // Hero
    heroLabel = 'Moyenne générale';
    heroValue = globalMoy !== null ? `${globalMoy.toFixed(2)} / 20` : 'Aucune note';
    heroTrend = averages.length > 0 ? `${averages.length} matière${averages.length > 1 ? 's' : ''}` : 'Pas encore de notes';
    heroTrendUp = true;
    heroSub = classe ? `${classe.nom} — Promotion ${classe.annee}` : 'Aucune classe assignée';
    heroCtaHref = '/dashboard/pedagogie/notes';
    heroCtaLabel = 'Voir mes notes';

    // Graphe par matière (barres proportionnelles)
    const barHeights = averages.length > 0
      ? averages.slice(0, 7).map((a) => Math.round((a.moyenne / 20) * 100))
      : BAR_HEIGHTS;

    const presencePct = presentCount > 0 ? Math.min(Math.round((presentCount / Math.max(presentCount + 2, 10)) * 100), 100) : 0;

    stats = [
      {
        label: 'Présences enregistrées',
        value: presentCount > 0 ? `${presentCount} fois` : '—',
        sub: presentCount > 0 ? 'Depuis le début' : 'Aucune présence',
        icon: CalendarDays,
        iconBg: 'bg-blue-100 text-blue-500',
        href: '/dashboard/emargement/scan',
        visual: 'circle',
        circleValue: presencePct,
      },
      {
        label: 'Supports de cours',
        value: materials.length > 0 ? `${materials.length} document${materials.length > 1 ? 's' : ''}` : '—',
        sub: classe ? `${classe.nom}` : 'Aucune classe',
        icon: BookOpen,
        iconBg: 'bg-purple-100 text-purple-500',
        href: '/dashboard/pedagogie/cours',
        visual: 'bars',
        barHeights: materials.length > 0
          ? [30, 50, 40, 70, 55, 80, 65].slice(0, 7)
          : BAR_HEIGHTS,
      },
      {
        label: 'Matières notées',
        value: averages.length > 0 ? `${averages.length} matière${averages.length > 1 ? 's' : ''}` : '—',
        sub: globalMoy !== null ? `Moy. ${globalMoy.toFixed(2)}/20` : 'Pas de notes',
        icon: Briefcase,
        iconBg: 'bg-amber-100 text-amber-500',
        href: '/dashboard/pedagogie/notes',
        visual: 'badge',
        badges: averages.slice(0, 3).map((a) => a.matiere),
      },
    ];

  } else if (role === 'professeur') {
    const [teacherClasses, sessions] = await Promise.all([
      getMyTeacherClasses(),
      getMyTeacherSessions(),
    ]);

    const totalMaterials = await Promise.all(
      teacherClasses.map((c) => getCourseMaterials(c.id))
    ).then((res) => res.flat().length);

    const closedSessions = sessions.filter((s) => s.statut === 'ferme');

    heroLabel = 'Classes actives';
    heroValue = `${teacherClasses.length} classe${teacherClasses.length > 1 ? 's' : ''}`;
    heroTrend = 'Semestre en cours';
    heroSub = 'Suivez vos cours, notes et présences.';
    heroCtaHref = '/dashboard/pedagogie';
    heroCtaLabel = 'Mes classes';

    stats = [
      {
        label: 'Sessions d\'émargement',
        value: `${closedSessions.length} session${closedSessions.length > 1 ? 's' : ''}`,
        sub: 'Terminées',
        icon: CalendarDays,
        iconBg: 'bg-blue-100 text-blue-500',
        href: '/dashboard/emargement',
        visual: 'bars',
        barHeights: [30, 55, 45, 70, 50, 65, 80].slice(0, 7),
      },
      {
        label: 'Supports déposés',
        value: totalMaterials > 0 ? `${totalMaterials} document${totalMaterials > 1 ? 's' : ''}` : '—',
        sub: 'Toutes classes',
        icon: BookOpen,
        iconBg: 'bg-purple-100 text-purple-500',
        href: '/dashboard/pedagogie/cours',
        visual: 'badge',
        badges: teacherClasses.slice(0, 3).map((c) => c.nom),
      },
      {
        label: 'Classes assignées',
        value: `${teacherClasses.length}`,
        sub: teacherClasses.map((c) => c.nom).join(', ') || '—',
        icon: GraduationCap,
        iconBg: 'bg-emerald-100 text-emerald-500',
        href: '/dashboard/pedagogie',
        visual: 'circle',
        circleValue: teacherClasses.length > 0 ? 100 : 0,
      },
    ];

  } else if (role === 'admin') {
    const [tickets, classes, users] = await Promise.all([
      getAllTickets(),
      getClasses(),
      getAllUsers(),
    ]);

    const openTickets = tickets.filter((t) => t.statut === 'ouvert').length;
    const inProgressTickets = tickets.filter((t) => t.statut === 'en_cours').length;

    heroLabel = 'Plateforme';
    heroValue = `${users.length} utilisateur${users.length > 1 ? 's' : ''}`;
    heroTrend = `${classes.length} classe${classes.length > 1 ? 's' : ''} · ${tickets.length} ticket${tickets.length > 1 ? 's' : ''}`;
    heroSub = 'Gérez comptes, classes et tickets depuis un seul endroit.';
    heroTrendUp = true;
    heroCtaHref = '/dashboard/admin';
    heroCtaLabel = 'Administrer';

    stats = [
      {
        label: 'Tickets ouverts',
        value: openTickets > 0 ? `${openTickets} ticket${openTickets > 1 ? 's' : ''}` : '—',
        sub: inProgressTickets > 0 ? `${inProgressTickets} en cours` : 'Aucun en attente',
        icon: MessageSquare,
        iconBg: openTickets > 0 ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-400',
        href: '/dashboard/support/admin',
        visual: 'bars',
        barHeights: [40, 60, 35, 55, 45, 70, 50],
      },
      {
        label: 'Classes',
        value: `${classes.length}`,
        sub: `${users.filter((u) => u.role === 'eleve').length} élève${users.filter((u) => u.role === 'eleve').length > 1 ? 's' : ''}`,
        icon: GraduationCap,
        iconBg: 'bg-purple-100 text-purple-500',
        href: '/dashboard/admin',
        visual: 'badge',
        badges: classes.slice(0, 3).map((c) => c.nom),
      },
      {
        label: 'Utilisateurs',
        value: `${users.length}`,
        sub: `${users.filter((u) => u.role === 'professeur').length} prof${users.filter((u) => u.role === 'professeur').length > 1 ? 's' : ''} · ${users.filter((u) => u.role === 'entreprise').length} entreprise${users.filter((u) => u.role === 'entreprise').length > 1 ? 's' : ''}`,
        icon: Users,
        iconBg: 'bg-[#89aae6]/20 text-[#3685b5]',
        href: '/dashboard/admin?tab=users',
        visual: 'circle',
        circleValue: classes.length > 0 ? Math.min(Math.round((users.filter((u) => u.role === 'eleve').length / Math.max(classes.length * 20, 1)) * 100), 100) : 0,
      },
    ];

  } else if (role === 'parent') {
    const links = await getMyLinks();
    const firstChild = links[0];

    heroLabel = 'Espace parent';
    heroValue = links.length > 0
      ? `${firstChild?.student_prenom} ${firstChild?.student_nom}`
      : 'Aucun enfant lié';
    heroTrend = links.length > 1 ? `${links.length} enfants liés` : firstChild?.student_class ?? 'Lier un enfant';
    heroSub = 'Suivez la scolarité, les notes et les messages de l\'école.';
    heroCtaHref = '/dashboard/enfant';
    heroCtaLabel = 'Voir les notes';

    stats = [
      {
        label: 'Mon enfant',
        value: links.length > 0 ? `${links.length} lié${links.length > 1 ? 's' : ''}` : 'Aucun',
        sub: firstChild ? `${firstChild.student_prenom} ${firstChild.student_nom}` : 'Ajoutez votre enfant',
        icon: GraduationCap,
        iconBg: 'bg-[#89aae6]/20 text-[#3685b5]',
        href: '/dashboard/enfant',
        visual: 'badge',
        badges: links.map((l) => `${l.student_prenom} ${l.student_nom}`).slice(0, 3),
      },
      {
        label: 'Messages',
        value: 'École',
        sub: 'Contacter les profs et l\'admin',
        icon: MessageSquare,
        iconBg: 'bg-purple-100 text-purple-500',
        href: '/dashboard/parent/messages',
        visual: 'bars',
      },
      {
        label: 'Actualités',
        value: 'École',
        sub: 'Annonces et événements',
        icon: BookOpen,
        iconBg: 'bg-amber-100 text-amber-500',
        href: '/dashboard/actualites',
        visual: 'badge',
        badges: ['Annonces', 'Actualités', 'Événements'],
      },
    ];

  } else {
    // entreprise
    const myTickets = await getMyTickets();

    heroLabel = 'Espace entreprise';
    heroValue = 'Alternance';
    heroTrend = 'Contrat en cours';
    heroSub = "Accédez au livret d'apprentissage et à l'espace tripartite.";
    heroCtaHref = '/dashboard/carriere';
    heroCtaLabel = 'Accéder';

    stats = [
      {
        label: 'Livret apprentissage',
        value: 'En cours',
        sub: 'À compléter',
        icon: BookOpen,
        iconBg: 'bg-blue-100 text-blue-500',
        href: '/dashboard/carriere/livret',
        visual: 'bars',
      },
      {
        label: 'Contacts école',
        value: 'Annuaire',
        sub: 'Équipe pédagogique',
        icon: Users,
        iconBg: 'bg-purple-100 text-purple-500',
        href: '/dashboard/annuaire',
        visual: 'badge',
        badges: ['Admin', 'Profs', 'Élèves'],
      },
    ];
  }

  const roleColors: Record<string, string> = {
    eleve: 'bg-[#89aae6]/20 text-[#3685b5]',
    professeur: 'bg-[#ac80a0]/20 text-[#ac80a0]',
    admin: 'bg-[#0471a6]/20 text-[#0471a6]',
    entreprise: 'bg-[#3685b5]/20 text-[#3685b5]',
  };

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400">{heroLabel}</p>
            <p className="mt-1 text-4xl font-bold text-[#0471a6] leading-tight">
              {heroValue}
            </p>
            <div className="mt-2">
              <span className={['inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', heroTrendUp ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'].join(' ')}>
                <ArrowUpRight className="h-3 w-3" />
                {heroTrend}
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-slate-500">{heroSub}</p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <span className="font-medium">
                {new Date().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                {' — '}
                {new Date(new Date().setMonth(new Date().getMonth() + 4)).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <Link
              href={heroCtaHref}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all hover:shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              {heroCtaLabel}
            </Link>
          </div>
        </div>

        {/* Mini graphe */}
        <div className="mt-6 flex items-end gap-2 overflow-hidden">
          {[28, 45, 38, 60, 52, 75, 65, 80, 70, 88, 78, 92].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-gradient-to-t from-[#0471a6]/30 to-[#89aae6]/20"
              style={{ height: `${h * 0.48}px`, minHeight: 8 }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
          <span>Sem. 1</span>
          <span>Sem. 12</span>
        </div>
      </div>

      {/* Widget actualités */}
      {latestNews.length > 0 && (
        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#89aae6]/20">
                <Newspaper className="h-4 w-4 text-[#3685b5]" />
              </div>
              <p className="font-semibold text-[#061826]">Dernières actualités</p>
            </div>
            <Link
              href="/dashboard/actualites"
              className="flex items-center gap-1 text-xs font-semibold text-[#0471a6] hover:underline"
            >
              Tout voir <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {latestNews.map((post) => (
              <div key={post.id} className="flex items-start gap-3 rounded-xl p-3 hover:bg-slate-50 transition-colors">
                <span className={['mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', CATEGORY_COLORS[post.category]].join(' ')}>
                  {CATEGORY_LABELS[post.category]}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#061826] truncate">{post.title}</p>
                  <p className="text-xs text-slate-400">
                    {post.author_name} · {new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href + card.label} href={card.href} className="group block">
              <div className="h-full rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card transition-all duration-200 group-hover:shadow-md group-hover:border-slate-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-[#061826]">{card.value}</p>
                  </div>
                  <div className={['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', card.iconBg].join(' ')}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="my-4">
                  {card.visual === 'bars' && <BarVisual heights={card.barHeights} />}
                  {card.visual === 'circle' && <CircleVisual value={card.circleValue ?? 0} />}
                  {card.visual === 'badge' && (
                    <div className="flex flex-wrap gap-1.5">
                      {(card.badges && card.badges.length > 0 ? card.badges : ['—']).map((b) => (
                        <span key={b} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 truncate max-w-[100px]">
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">{card.sub}</p>
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#0471a6] opacity-0 group-hover:opacity-100 transition-opacity">
                    Voir <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
