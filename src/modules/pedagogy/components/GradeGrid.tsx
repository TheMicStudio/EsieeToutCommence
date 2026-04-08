'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { addGrade } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Grade } from '../types';

interface Student {
  id: string;
  nom: string;
  prenom: string;
}

interface GradeGridProps {
  classId: string;
  students: Student[];
  grades: Grade[];
  matieres: string[];
}

export function GradeGrid({ classId, students, grades, matieres }: GradeGridProps) {
  const [state, action, pending] = useActionState(addGrade, null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  // Reset le formulaire après succès
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setSelectedStudent('');
    }
  }, [state]);

  return (
    <div className="space-y-6">
      {/* Formulaire saisie note */}
      <form ref={formRef} action={action} className="rounded-xl border bg-card p-5 space-y-4">
        <h3 className="font-semibold">Ajouter une note</h3>
        <input type="hidden" name="class_id" value={classId} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="student_id">Élève</Label>
            <select
              id="student_id"
              name="student_id"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Sélectionner…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.prenom} {s.nom}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="matiere">Matière</Label>
            <select
              id="matiere"
              name="matiere"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Sélectionner…</option>
              {matieres.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examen">Intitulé de l&apos;examen</Label>
            <Input id="examen" name="examen" placeholder="Contrôle n°1" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (/20)</Label>
            <Input id="note" name="note" type="number" min="0" max="20" step="0.5" placeholder="13.5" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coefficient">Coefficient</Label>
            <Input id="coefficient" name="coefficient" type="number" min="0.5" step="0.5" defaultValue="1" required />
          </div>
        </div>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.success && <p className="text-sm text-primary">Note ajoutée avec succès.</p>}

        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer la note'}
        </Button>
      </form>

      {/* Récap notes existantes (anonymisé — vue prof) */}
      {grades.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Notes saisies ({grades.length})
          </h3>
          <div className="rounded-lg border divide-y">
            {grades.map((g) => {
              const student = students.find((s) => s.id === g.student_id);
              return (
                <div key={g.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <span className="font-medium">
                      {student ? `${student.prenom} ${student.nom}` : 'Élève inconnu'}
                    </span>
                    <span className="ml-2 text-muted-foreground">— {g.matiere} / {g.examen}</span>
                  </div>
                  <span className="font-semibold">
                    {g.note}/20{' '}
                    <span className="font-normal text-muted-foreground">×{g.coefficient}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
