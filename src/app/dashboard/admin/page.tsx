import { getCurrentUserProfile } from '@/modules/auth/actions';
import { redirect } from 'next/navigation';
import { getClasses, getStudents, getTeachers } from '@/modules/admin/actions';
import { getAllUsers, getAlternants } from '@/modules/admin/users-actions';
import {
  getSubjects,
  getAdminFunctions,
  getTicketCategories,
  getSecondaryRoles,
} from '@/modules/admin/config-actions';
import { getAllJobOffers, getAllCareerEvents } from '@/modules/career/actions';
import { AdminClassPanel } from './AdminClassPanel';
import { UsersPanel } from './UsersPanel';
import { TripartitePanel } from './TripartitePanel';
import { ConfigPanel } from './ConfigPanel';
import { CareerPanel } from './CareerPanel';
import { AdminTabs } from './AdminTabs';

export const metadata = { title: 'Administration — EsieeToutCommence' };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'admin') redirect('/dashboard');

  const { tab = 'classes' } = await searchParams;

  const [classes, students, teachers, users, alternants, subjects, adminFunctionsList, secondaryRolesList] =
    await Promise.all([
      getClasses(),
      getStudents(),
      getTeachers(),
      getAllUsers(),
      getAlternants(),
      getSubjects(),
      getAdminFunctions(),
      getSecondaryRoles(),
    ]);

  const adminUsers = users.filter((u) => u.role === 'admin');
  const entrepriseUsers = users.filter((u) => u.role === 'entreprise');

  const ticketCategories = tab === 'config' ? await getTicketCategories() : [];
  const [jobOffers, careerEvents] = tab === 'career'
    ? await Promise.all([getAllJobOffers(), getAllCareerEvents()])
    : [[], []];

  // Données de config formatées pour les panels
  const subjectNames = subjects.map((s) => s.nom);
  const adminFunctionNames = adminFunctionsList.map((f) => f.nom);
  const secondaryRolesFormatted = secondaryRolesList.map((r) => ({ value: r.slug, label: r.label }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Administration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gérez les classes, les comptes, l&apos;alternance et la configuration.
        </p>
      </div>

      <AdminTabs activeTab={tab} />

      {tab === 'classes' && (
        <AdminClassPanel classes={classes} students={students} teachers={teachers} />
      )}
      {tab === 'users' && (
        <UsersPanel
          users={users}
          subjects={subjectNames}
          adminFunctions={adminFunctionNames}
          secondaryRoles={secondaryRolesFormatted}
        />
      )}
      {tab === 'alternance' && (
        <TripartitePanel alternants={alternants} admins={adminUsers} entreprises={entrepriseUsers} />
      )}
      {tab === 'career' && (
        <CareerPanel jobOffers={jobOffers} careerEvents={careerEvents} />
      )}
      {tab === 'config' && (
        <ConfigPanel
          subjects={subjects}
          adminFunctions={adminFunctionsList}
          ticketCategories={ticketCategories}
          secondaryRoles={secondaryRolesList}
        />
      )}
    </div>
  );
}
