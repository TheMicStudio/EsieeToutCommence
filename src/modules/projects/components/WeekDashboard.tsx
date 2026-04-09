'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Users, CalendarClock, StickyNote,
  MessageSquare, Palette, FileText, Search,
  Lock, UserPlus, Star, GitBranch, Presentation,
  Plus, X, Trash2, LogOut,
} from 'lucide-react';
import { createGroup, deleteGroup, leaveGroup } from '../actions';
import { ExportRetroButton } from './ExportRetroButton';
import { GroupChat } from './GroupChat';
import { GroupWhiteboardView } from './GroupWhiteboardView';
import { WeekCourseMaterialsPanel } from './WeekCourseMaterialsPanel';
import { SoutenanceGrid } from './SoutenanceGrid';
import { CreateSoutenanceSlotsForm } from './CreateSoutenanceSlotsForm';
import { RetroBoard } from './RetroBoard';
import { JoinGroupButton } from './JoinGroupButton';
import { SubmitLinksForm } from './SubmitLinksForm';
import { GradeGroupForm } from './GradeGroupForm';
import type {
  ProjectGroup, GroupMessage, GroupWhiteboard,
  WeekCourseMaterial, SoutenanceSlot, RetroBoard as RetroBoardType,
  RetroPostit,
} from '../types';

interface WeekDashboardProps {
  weekId: string;
  week: { title: string; start_date: string; end_date: string };
  groups: ProjectGroup[];
  myGroup: ProjectGroup | null;
  messages: GroupMessage[];
  whiteboard: GroupWhiteboard | null;
  materials: WeekCourseMaterial[];
  slots: SoutenanceSlot[];
  retroBoard: RetroBoardType | null;
  retroPostits: RetroPostit[];
  currentUserId: string;
  currentUserName: string;
  isProf: boolean;
}

type TabId = 'groupes' | 'creneaux' | 'retro' | 'chat' | 'tableau-blanc' | 'supports';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'groupes',       label: 'Groupes',       icon: Users         },
  { id: 'creneaux',      label: 'Créneaux',      icon: CalendarClock },
  { id: 'retro',         label: 'Rétro',         icon: StickyNote    },
  { id: 'chat',          label: 'Chat',          icon: MessageSquare },
  { id: 'tableau-blanc', label: 'Tableau blanc',  icon: Palette       },
  { id: 'supports',      label: 'Supports',      icon: FileText      },
];

const AVATAR_COLORS = [
  'bg-[#89aae6]/20 text-[#3685b5]',
  'bg-[#ac80a0]/20 text-[#ac80a0]',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-violet-100 text-violet-600',
  'bg-rose-100 text-rose-600',
];

function getInitials(prenom?: string, nom?: string) {
  return `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() || '?';
}

/* ── Modal livraisons ──────────────────────────────────────────────── */
function LivraisonsModal({ group, onClose }: { group: ProjectGroup; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-[18px] font-semibold text-slate-900"
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
          >
            Déposer les livrables
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SubmitLinksForm
          groupId={group.id}
          initialRepo={group.repo_url}
          initialSlides={group.slides_url}
          initialSlidesFileUrl={group.slides_file_url}
          initialSlidesFileName={group.slides_file_name}
        />
      </div>
    </div>
  );
}

export function WeekDashboard({
  weekId, week, groups, myGroup, messages, whiteboard,
  materials, slots, retroBoard, retroPostits,
  currentUserId, currentUserName, isProf,
}: WeekDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('groupes');

  useEffect(() => {
    const t = new URLSearchParams(globalThis.window.location.search).get('tab') as TabId;
    if (TABS.some((tab) => tab.id === t)) setActiveTab(t);
  }, []);
  const [search, setSearch] = useState('');
  const [livraisonsGroup, setLivraisonsGroup] = useState<ProjectGroup | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCap, setNewGroupCap] = useState('4');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    setIsCreatingGroup(true);
    setCreateGroupError(null);
    const res = await createGroup(weekId, newGroupName.trim(), Number.parseInt(newGroupCap) || 4);
    setIsCreatingGroup(false);
    if (res.error) { setCreateGroupError(res.error); return; }
    setShowCreateGroup(false);
    setNewGroupName('');
    setNewGroupCap('4');
    globalThis.window.location.reload();
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm('Supprimer ce groupe ? Cette action est irréversible.')) return;
    await deleteGroup(groupId, weekId);
    globalThis.window.location.reload();
  }

  async function handleLeaveGroup(groupId: string) {
    if (!confirm('Quitter ce groupe ?')) return;
    await leaveGroup(groupId, weekId);
    globalThis.window.location.reload();
  }

  function handleTabChange(id: TabId) {
    setActiveTab(id);
    const url = new URL(globalThis.window.location.href);
    url.searchParams.set('tab', id);
    globalThis.window.history.replaceState(null, '', url.toString());
  }

  const filteredGroups = groups.filter((g) =>
    !search || g.group_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* ── Livraisons modal ─────────────────────────────────────────── */}
      {livraisonsGroup && (
        <LivraisonsModal group={livraisonsGroup} onClose={() => setLivraisonsGroup(null)} />
      )}

      <div className="space-y-0">
        {/* ── Single main card ───────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_30px_rgba(15,23,42,0.06)] overflow-hidden">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href="/dashboard/pedagogie/projets"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="min-w-0">
                <h1
                  className="text-[22px] md:text-[26px] font-semibold tracking-tight text-slate-900 leading-tight"
                  style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
                >
                  {week.title}
                </h1>
                <p className="mt-0.5 text-[13px] font-medium text-slate-500">
                  Groupes de travail, créneaux et rétrospectives
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-1" />
          </div>

          {/* Tabs — full-width underline style */}
          <div className="flex border-b border-slate-100">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleTabChange(id)}
                className={[
                  'inline-flex flex-1 min-w-0 items-center justify-center gap-1.5 px-2 py-3 text-[11px] font-semibold transition-all border-b-2 -mb-px',
                  activeTab === id
                    ? 'border-[#0471a6] text-[#0471a6]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200',
                ].join(' ')}
              >
                <Icon className="h-3 w-3 shrink-0 hidden sm:block" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="p-6">

            {/* ── Groupes ──────────────────────────────────────────── */}
            {activeTab === 'groupes' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrer les groupes…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0471a6]/20 focus:border-[#0471a6] transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateGroup((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#0471a6] px-3 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0471a6]/90 transition-colors"
                  >
                    {showCreateGroup ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {showCreateGroup ? 'Annuler' : 'Ajouter un groupe'}
                  </button>
                </div>

                {/* Formulaire création groupe */}
                {showCreateGroup && (
                  <div className="rounded-2xl border border-[#0471a6]/30 bg-[#0471a6]/5 p-4 space-y-3">
                    <p className="text-[13px] font-semibold text-[#061826]">Nouveau groupe</p>
                    <div className="flex gap-3 flex-wrap">
                      <input
                        type="text"
                        placeholder="Nom du groupe"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="flex-1 min-w-[180px] h-9 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0471a6]/20"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-[12px] text-slate-500 whitespace-nowrap">Capacité max</label>
                        <input
                          type="number"
                          min="1" max="20"
                          value={newGroupCap}
                          onChange={(e) => setNewGroupCap(e.target.value)}
                          className="w-16 h-9 rounded-xl border border-slate-200 bg-white px-2 text-[13px] text-slate-700 text-center focus:outline-none focus:ring-2 focus:ring-[#0471a6]/20"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateGroup}
                        disabled={isCreatingGroup || !newGroupName.trim()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0471a6] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-colors"
                      >
                        {isCreatingGroup ? 'Création…' : 'Créer'}
                      </button>
                    </div>
                    {createGroupError && (
                      <p className="text-[12px] text-rose-600">{createGroupError}</p>
                    )}
                  </div>
                )}

                {filteredGroups.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-3xl border border-dashed border-slate-200">
                    <p className="text-[13px] text-slate-400">Aucun groupe trouvé.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredGroups.map((group) => {
                      const members = group.members ?? [];
                      const isMember = members.some((m) => m.student_id === currentUserId);
                      const isMyGrp  = myGroup?.id === group.id;
                      const spots    = group.capacite_max - members.length;
                      const isFull   = spots <= 0;

                      return (
                        <article
                          key={group.id}
                          className={[
                            'rounded-3xl border bg-white p-5',
                            isMyGrp ? 'border-[#0471a6]/20' : 'border-slate-200',
                          ].join(' ')}
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                <Users className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3
                                  className="text-[16px] font-semibold tracking-tight text-slate-900"
                                  style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
                                >
                                  {group.group_name}
                                </h3>
                                {group.feedback_prof && (
                                  <p className="mt-1 text-[13px] font-medium text-slate-600 line-clamp-2">
                                    {group.feedback_prof}
                                  </p>
                                )}
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] font-semibold text-slate-500">
                                  <span>
                                    {members.length}{group.capacite_max ? `/${group.capacite_max}` : ''} membres
                                  </span>
                                  {isFull ? (
                                    <span className="flex items-center gap-1 text-red-500">
                                      <Lock className="h-3 w-3" />Complet
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600">
                                      {spots} place{spots > 1 ? 's' : ''} libre{spots > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {group.note !== undefined && group.note !== null && (
                                    <span className="flex items-center gap-1 text-[#0471a6]">
                                      <Star className="h-3 w-3" />{group.note}/20
                                    </span>
                                  )}
                                </div>

                                {/* Member avatars */}
                                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                                  {members.map((m, i) => (
                                    <div
                                      key={m.student_id}
                                      title={`${m.prenom} ${m.nom}`}
                                      className={['flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold', AVATAR_COLORS[i % AVATAR_COLORS.length]].join(' ')}
                                    >
                                      {getInitials(m.prenom, m.nom)}
                                    </div>
                                  ))}
                                  {Array.from({ length: Math.min(spots > 0 ? spots : 0, 3) }).map((_, i) => (
                                    <div key={`e-${i}`} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-slate-200">
                                      <UserPlus className="h-3 w-3 text-slate-300" />
                                    </div>
                                  ))}
                                </div>

                                {/* Deliverable links */}
                                {(group.repo_url || group.slides_url) && (
                                  <div className="mt-2.5 flex gap-2">
                                    {group.repo_url && (
                                      <a href={group.repo_url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                        <GitBranch className="h-3 w-3" />GitHub
                                      </a>
                                    )}
                                    {group.slides_url && (
                                      <a href={group.slides_url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                        <Presentation className="h-3 w-3" />Slides
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0 md:mt-1 flex-wrap">
                              {!isProf && !myGroup && (
                                <JoinGroupButton groupId={group.id} weekId={weekId} isMember={isMember} isFull={isFull} />
                              )}
                              {isMember && !isProf && (
                                <button
                                  type="button"
                                  onClick={() => setLivraisonsGroup(group)}
                                  className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <FileText className="h-4 w-4" />
                                  Livrables
                                </button>
                              )}
                              {/* Quitter le groupe (élève membre) */}
                              {isMember && !isProf && (
                                <button
                                  type="button"
                                  onClick={() => handleLeaveGroup(group.id)}
                                  className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                                >
                                  <LogOut className="h-4 w-4" />
                                  Quitter
                                </button>
                              )}
                              {/* Supprimer (prof = tous, élève = seulement créateur) */}
                              {(isProf || group.created_by === currentUserId) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                                  title="Supprimer le groupe"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                              {isProf && (
                                <GradeGroupForm groupId={group.id} groupName={group.group_name} initialNote={group.note} initialFeedback={group.feedback_prof} />
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Créneaux ─────────────────────────────────────────── */}
            {activeTab === 'creneaux' && (
              <div className="space-y-5">
                {isProf && (
                  <CreateSoutenanceSlotsForm weekId={weekId} groupCount={groups.length} hasSlots={slots.length > 0} />
                )}
                <SoutenanceGrid slots={slots} weekId={weekId} myGroupId={myGroup?.id} canRelease={!isProf} />
              </div>
            )}

            {/* ── Rétro ────────────────────────────────────────────── */}
            {activeTab === 'retro' && (
              <div className="space-y-5">
                {/* Sub-card: header — export visible uniquement pour les profs */}
                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2
                        className="text-[16px] font-semibold text-slate-900"
                        style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
                      >
                        Rétro — {week.title}
                      </h2>
                      <p className="mt-1 text-[13px] font-medium text-slate-500">
                        Partage ton feedback. Les notes sont anonymisées côté affichage.
                      </p>
                    </div>
                    {isProf && (
                      <div className="shrink-0">
                        <ExportRetroButton postits={retroPostits} weekTitle={week.title} />
                      </div>
                    )}
                  </div>
                </div>

                {retroBoard ? (
                  <RetroBoard
                    board={retroBoard}
                    initialPostits={retroPostits}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    isProf={isProf}
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-3xl border border-dashed border-slate-200">
                    <p className="text-[13px] text-slate-400">
                      {isProf
                        ? 'Le tableau de rétro sera créé automatiquement à la première ouverture.'
                        : "Le tableau de rétro n'est pas encore disponible."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Chat ─────────────────────────────────────────────── */}
            {activeTab === 'chat' && (
              <div>
                {myGroup ? (
                  <GroupChat
                    groupId={myGroup.id}
                    initialMessages={messages ?? []}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    memberNames={Object.fromEntries(
                      (myGroup.members ?? []).map((m) => [m.student_id, `${m.prenom} ${m.nom}`])
                    )}
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-3xl border border-dashed border-slate-200">
                    <p className="text-[13px] text-slate-400">Rejoins un groupe pour accéder au chat.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Tableau blanc ─────────────────────────────────────── */}
            {activeTab === 'tableau-blanc' && (
              <div>
                {myGroup ? (
                  <GroupWhiteboardView
                    groupId={myGroup.id}
                    initialData={whiteboard?.data ?? null}
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-3xl border border-dashed border-slate-200">
                    <p className="text-[13px] text-slate-400">Rejoins un groupe pour accéder au tableau blanc.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Supports ──────────────────────────────────────────── */}
            {activeTab === 'supports' && (
              <WeekCourseMaterialsPanel weekId={weekId} materials={materials} isProf={isProf} />
            )}

          </div>
        </div>
      </div>
    </>
  );
}
