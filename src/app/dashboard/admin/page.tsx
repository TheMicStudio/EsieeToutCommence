import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getUserPermissions } from '@/lib/permissions';
import { getPermissionsMatrix } from '@/modules/admin/permissions-actions';
import type { UserProfile } from '@/modules/auth/types';
import { redirect } from 'next/navigation';
import { getClasses, getStudents } from '@/modules/admin/actions';
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
import { PermissionsPanel } from './PermissionsPanel';
import { AdminTabs } from './AdminTabs';

export const metadata = { title: 'Administration — EsieeToutCommence' };

const TAB_PERMISSIONS = {
  classes:     'class.manage',
  users:       'user.manage',
  alternance:  'alternance.validate',
  career:      'career_event.manage',
  config:      'permission.manage',
  permissions: 'permission.manage',
} as const;

type TabId = keyof typeof TAB_PERMISSIONS;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) redirect('/dashboard');

  const ALLOWED_ROLES: UserProfile['role'][] = ['admin', 'coordinateur', 'staff'];
  if (!ALLOWED_ROLES.includes(userProfile.role)) redirect('/dashboard');

  const permissions = await getUserPermissions(userProfile.profile.id, userProfile.role);

  let effectivePermissions = permissions;
  if (permissions.size === 0) {
    const DEFAULTS: Record<string, string[]> = {
      admin:       ['class.manage', 'user.manage', 'alternance.validate', 'career_event.manage', 'permission.manage'],
      coordinateur:['class.manage', 'alternance.validate'],
      staff:       ['career_event.manage'],
    };
    effectivePermissions = new Set(DEFAULTS[userProfile.role] ?? []);
  }

  const visibleTabs = (Object.keys(TAB_PERMISSIONS) as TabId[]).filter(
    (tabId) => effectivePermissions.has(TAB_PERMISSIONS[tabId])
  );

  if (visibleTabs.length === 0) redirect('/dashboard');

  const { tab: rawTab = visibleTabs[0] } = await searchParams;
  const tab = visibleTabs.includes(rawTab as TabId) ? rawTab : visibleTabs[0];

  const [classes, students, users, alternants, subjects, adminFunctionsList, secondaryRolesList] =
    await Promise.all([
      effectivePermissions.has('class.manage') ? getClasses() : Promise.resolve([]),
      effectivePermissions.has('class.manage') ? getStudents() : Promise.resolve([]),
      effectivePermissions.has('user.manage') ? getAllUsers() : Promise.resolve([]),
      effectivePermissions.has('alternance.validate') ? getAlternants() : Promise.resolve([]),
      getSubjects(),
      getAdminFunctions(),
      getSecondaryRoles(),
    ]);

  const adminUsers = users.filter((u) => u.role === 'admin');
  const entrepriseUsers = users.filter((u) => u.role === 'entreprise');

  const ticketCategories = tab === 'config' && effectivePermissions.has('permission.manage')
    ? await getTicketCategories()
    : [];
  const [jobOffers, careerEvents] = tab === 'career' && effectivePermissions.has('career_event.manage')
    ? await Promise.all([getAllJobOffers(), getAllCareerEvents()])
    : [[], []];
  const permissionsMatrix = tab === 'permissions' && effectivePermissions.has('permission.manage')
    ? await getPermissionsMatrix()
    : null;

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

      <AdminTabs activeTab={tab} visibleTabs={visibleTabs} />

      {tab === 'classes' && effectivePermissions.has('class.manage') && (
        <AdminClassPanel classes={classes} students={students} />
      )}
      {tab === 'users' && effectivePermissions.has('user.manage') && (
        <UsersPanel
          users={users}
          subjects={subjectNames}
          adminFunctions={adminFunctionNames}
          secondaryRoles={secondaryRolesFormatted}
        />
      )}
      {tab === 'alternance' && effectivePermissions.has('alternance.validate') && (
        <TripartitePanel alternants={alternants} admins={adminUsers} entreprises={entrepriseUsers} />
      )}
      {tab === 'career' && effectivePermissions.has('career_event.manage') && (
        <CareerPanel jobOffers={jobOffers} careerEvents={careerEvents} />
      )}
      {tab === 'config' && effectivePermissions.has('permission.manage') && (
        <ConfigPanel
          subjects={subjects}
          adminFunctions={adminFunctionsList}
          ticketCategories={ticketCategories}
          secondaryRoles={secondaryRolesList}
        />
      )}
      {tab === 'permissions' && effectivePermissions.has('permission.manage') && permissionsMatrix && (
        <PermissionsPanel
          permissions={permissionsMatrix.permissions}
          matrix={permissionsMatrix.matrix}
        />
      )}
    </div>
  );
}
