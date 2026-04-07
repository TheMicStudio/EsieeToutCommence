import Link from 'next/link';
import { BookOpen, GraduationCap, MessageSquare, Star } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getMyClass, getMyTeacherClasses } from '@/modules/pedagogy/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Espace pédagogique — Hub École' };

const NAV_ITEMS = [
  { href: '/dashboard/pedagogie/cours', label: 'Supports de cours', icon: BookOpen, description: 'Accédez aux ressources pédagogiques' },
  { href: '/dashboard/pedagogie/notes', label: 'Notes', icon: Star, description: 'Consultez vos notes et moyennes' },
  { href: '/dashboard/pedagogie/chat', label: 'Chat de classe', icon: MessageSquare, description: 'Discutez avec votre classe' },
];

export default async function PedagogiePage() {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const isProf = userProfile.role === 'professeur';
  const classe = isProf ? null : await getMyClass();
  const teacherClasses = isProf ? await getMyTeacherClasses() : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Espace pédagogique</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isProf
            ? `${teacherClasses.length} classe${teacherClasses.length > 1 ? 's' : ''} assignée${teacherClasses.length > 1 ? 's' : ''}`
            : classe ? `Classe : ${classe.nom} — Promo ${classe.annee}` : 'Aucune classe assignée'}
        </p>
      </div>

      {/* Classes du prof */}
      {isProf && teacherClasses.length > 0 && (
        <div>
          <h2 className="mb-3 font-semibold">Mes classes</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teacherClasses.map((c) => (
              <Card key={c.id} className="border-primary/20">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{c.nom}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">Promo {c.annee}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Navigation modules */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="group h-full cursor-pointer transition-all hover:border-primary/40 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="mt-3 text-base">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
