'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/client/api';
import { Card } from '@/components/ui';

// Simple vs. pharma lifecycles get grouped in the dropdown so a non-pharma
// user doesn't have to scroll past GAMP 5 et al to find "Simple".
const LIFECYCLE_GROUPS: Array<{ label: string; keys: string[] }> = [
  { label: 'Lightweight', keys: ['simple', 'software', 'generic'] },
  {
    label: 'Pharma Quality (opinionated)',
    keys: [
      'csv',
      'sop',
      'deviation_capa',
      'change_control',
      'audit',
      'validation',
      'data_integrity',
      'pharmacovigilance'
    ]
  }
];

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    description: '',
    lifecycle: 'simple',
    priority: 'medium',
    gxpImpact: 'none',
    applicationId: searchParams?.get('applicationId') || '',
    teamId: '',
    startDate: '',
    dueDate: '',
    useTemplate: true
  });
  const [lifecycles, setLifecycles] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [showMore, setShowMore] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<any[]>('/lifecycles').then(setLifecycles);
    api<any[]>('/teams').then(setTeams);
    api<any[]>('/applications').then((apps) => {
      setApplications(apps);
      const pre = searchParams?.get('applicationId');
      if (pre) {
        const a = apps.find((x) => x.id === pre);
        if (a) setForm((f) => ({ ...f, lifecycle: a.defaultLifecycle || f.lifecycle }));
      }
    });
  }, [searchParams]);

  useEffect(() => {
    if (form.lifecycle) api<any>(`/lifecycles?key=${form.lifecycle}`).then(setPreview);
  }, [form.lifecycle]);

  function up<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        description: form.description || undefined,
        lifecycle: form.lifecycle,
        priority: form.priority,
        gxpImpact: form.gxpImpact,
        useTemplate: form.useTemplate,
        applicationId: form.applicationId || undefined,
        teamId: form.teamId || undefined,
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined
      };
      const p = await api<any>('/projects', { method: 'POST', body: payload });
      router.push(`/projects/${p.id}`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const lcMeta = lifecycles.find((l) => l.key === form.lifecycle);
  const isPharma = form.lifecycle && ['csv', 'sop', 'deviation_capa', 'change_control', 'audit', 'validation', 'data_integrity', 'pharmacovigilance'].includes(form.lifecycle);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">New project</h1>
        <p className="text-sm text-slate-500 mt-1">
          Just give it a name — everything else can stay empty and be filled in later.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Card>
          <div className="space-y-4">
            <div>
              <label className="label">Project name *</label>
              <input
                className="input text-base"
                required
                autoFocus
                placeholder="e.g. LIMS 7.3 Upgrade Validation"
                value={form.name}
                onChange={(e) => up('name', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Application</label>
                <select
                  className="select"
                  value={form.applicationId}
                  onChange={(e) => {
                    const appId = e.target.value;
                    up('applicationId', appId);
                    const a = applications.find((x) => x.id === appId);
                    if (a?.defaultLifecycle) up('lifecycle', a.defaultLifecycle);
                  }}
                >
                  <option value="">— None (standalone) —</option>
                  {applications.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.key} · {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Lifecycle</label>
                <select
                  className="select"
                  value={form.lifecycle}
                  onChange={(e) => up('lifecycle', e.target.value)}
                >
                  {LIFECYCLE_GROUPS.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.keys.map((k) => {
                        const m = lifecycles.find((l) => l.key === k);
                        return m ? (
                          <option key={k} value={k}>
                            {m.label}
                          </option>
                        ) : null;
                      })}
                    </optgroup>
                  ))}
                </select>
                {lcMeta && (
                  <p className="text-xs text-slate-500 mt-1">{lcMeta.description}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                className="text-sm text-brand-700 hover:underline"
              >
                {showMore ? '− Hide optional details' : '+ Add optional details (description, dates, priority, team)'}
              </button>
            </div>

            {showMore && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="One-paragraph context — what's this project trying to do?"
                    value={form.description}
                    onChange={(e) => up('description', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Start date</label>
                    <input
                      type="date"
                      className="input"
                      value={form.startDate}
                      onChange={(e) => up('startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Due date</label>
                    <input
                      type="date"
                      className="input"
                      value={form.dueDate}
                      onChange={(e) => up('dueDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Priority</label>
                    <select
                      className="select"
                      value={form.priority}
                      onChange={(e) => up('priority', e.target.value as any)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Team</label>
                    <select
                      className="select"
                      value={form.teamId}
                      onChange={(e) => up('teamId', e.target.value)}
                    >
                      <option value="">— Unassigned —</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {isPharma && (
                  <div>
                    <label className="label">GxP impact</label>
                    <select
                      className="select"
                      value={form.gxpImpact}
                      onChange={(e) => up('gxpImpact', e.target.value as any)}
                    >
                      <option value="none">None</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {preview && preview.phases?.some((p: any) => p.tasks.length > 0) && (
          <Card
            title="Template will seed"
            action={
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.useTemplate}
                  onChange={(e) => up('useTemplate', e.target.checked)}
                />
                Use template
              </label>
            }
          >
            {form.useTemplate ? (
              <div className="space-y-2">
                {preview.phases.map((ph: any, i: number) => (
                  <details
                    key={i}
                    className="bg-slate-50 rounded border border-slate-200 p-2"
                  >
                    <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                      {i + 1}. {ph.name}{' '}
                      <span className="text-slate-400">({ph.tasks.length} tasks)</span>
                    </summary>
                    <ul className="mt-2 text-xs space-y-1 ml-3 list-disc">
                      {ph.tasks.map((t: any, j: number) => (
                        <li key={j}>
                          {t.title}
                          {t.qa && <span className="ml-1 text-purple-700">· QA</span>}
                          {t.gxp && <span className="ml-1 text-red-700">· GxP</span>}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
                {preview.regulatoryRefs && (
                  <p className="text-xs text-slate-500 mt-2">
                    <span className="font-semibold">Regulatory refs:</span>{' '}
                    {preview.regulatoryRefs}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Template skipped — phases will be created empty so you can add tasks as you go.
              </p>
            )}
          </Card>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create project'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>
            Cancel
          </button>
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>
      </form>
    </div>
  );
}
