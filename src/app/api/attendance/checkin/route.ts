import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeAttendanceStatus } from '@/lib/utils/attendance';

export async function POST(req: NextRequest) {
  try {
    const { codeUnique, deviceFingerprint } = await req.json();
    if (!codeUnique || !deviceFingerprint) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier la session
    const { data: session } = await supabase
      .from('attendance_sessions')
      .select()
      .eq('code_unique', codeUnique)
      .eq('statut', 'ouvert')
      .gt('expiration', new Date().toISOString())
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: 'Session expirée ou introuvable' }, { status: 404 });
    }

    // Calculer présent ou en retard
    const statut_presence = computeAttendanceStatus(
      new Date(session.created_at),
      new Date(session.expiration),
      new Date(),
    );

    const { error } = await supabase.from('attendance_records').insert({
      session_id: session.id,
      student_id: user.id,
      device_fingerprint: deviceFingerprint,
      statut_presence,
    });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Déjà pointé pour cette session' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, statut: statut_presence });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
