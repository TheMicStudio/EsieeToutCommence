import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '../actions';
import type { RolePrincipal, UserProfile } from '../types';

interface RoleGuardProps {
  allowedRoles: RolePrincipal[];
  children: (userProfile: UserProfile) => React.ReactNode;
}

export async function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const userProfile = await getCurrentUserProfile();

  if (!userProfile) {
    redirect('/auth/login');
  }

  if (!allowedRoles.includes(userProfile.role)) {
    redirect('/dashboard');
  }

  return <>{children(userProfile)}</>;
}
