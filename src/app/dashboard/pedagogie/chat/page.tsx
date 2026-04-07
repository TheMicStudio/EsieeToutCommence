import { getCurrentUserProfile } from '@/modules/auth/actions';
import {
  getChannelMessages,
  getClassChannels,
  getMyClass,
  getMyTeacherClasses,
} from '@/modules/pedagogy/actions';
import { ClassChat } from '@/modules/pedagogy/components/ClassChat';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Chat de classe — Hub École' };

export default async function ChatPage() {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const isProf = userProfile.role === 'professeur';
  const classe = isProf
    ? (await getMyTeacherClasses())[0] ?? null
    : await getMyClass();

  if (!classe) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Chat de classe</h1>
        <p className="text-muted-foreground">
          {isProf ? 'Aucune classe assignée.' : 'Vous n\'êtes assigné à aucune classe.'}
        </p>
      </div>
    );
  }

  const channels = await getClassChannels(classe.id);
  if (channels.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Chat de classe</h1>
        <p className="text-muted-foreground">Aucun canal disponible pour l&apos;instant.</p>
      </div>
    );
  }

  // Charger les messages du premier canal
  const initialMessages = await getChannelMessages(channels[0].id);

  // Construire un mapping author_id -> nom complet pour affichage
  const supabase = await createClient();
  const authorIds = [...new Set(initialMessages.map((m) => m.author_id))];
  const authorNames: Record<string, string> = {};

  if (authorIds.length > 0) {
    const [{ data: students }, { data: teachers }] = await Promise.all([
      supabase.from('student_profiles').select('id, prenom, nom').in('id', authorIds),
      supabase.from('teacher_profiles').select('id, prenom, nom').in('id', authorIds),
    ]);

    [...(students ?? []), ...(teachers ?? [])].forEach((p) => {
      const profile = p as { id: string; prenom: string; nom: string };
      authorNames[profile.id] = `${profile.prenom} ${profile.nom}`;
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Chat de classe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {classe.nom} — {channels.length} canal{channels.length > 1 ? 'x' : ''}
        </p>
      </div>

      <ClassChat
        channels={channels}
        initialMessages={initialMessages}
        currentUserId={userProfile.profile.id}
        authorNames={authorNames}
      />
    </div>
  );
}
