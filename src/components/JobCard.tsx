import { useState } from 'react';
import { Clock, Calendar, Pencil, Pause, Play, Trash2, Users, Zap, CheckCircle2, Lock } from 'lucide-react';
import type { Job } from '@/types';
import { formatCurrency, formatDate, urgencyLabel } from '@/utils';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { JobFormModal } from './JobFormModal';

const urgencyTone = { hoje: 'error', amanha: 'warning', esta_semana: 'secondary' } as const;

export function JobCard({ job, variant = 'manage' }: { job: Job; variant?: 'manage' | 'apply' }) {
  const { data, pauseJob, deleteJob, applyToJob, requestHire, currentUser, categoryById } = useApp();
  const { notify } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);

  const applied = currentUser ? job.applicants.includes(currentUser.id) : false;
  const paused = job.status === 'paused';
  const cat = categoryById(job.category);

  const apply = () => {
    if (!currentUser || applied) return;
    applyToJob(job.id, currentUser.id);
    notify('Candidatura enviada!');
  };

  const establishment = data.users.find((u) => u.id === job.establishmentId);
  const applicantsList = data?.users?.filter((u) => job.applicants?.includes(u.id)) || [];

  // Verifica se o usuário logado já tem um contrato pago/confirmado com este estabelecimento para esta vaga
  const hasActiveContract = currentUser ? data.contracts.some(
    (c) => c.establishmentId === job.establishmentId && c.freelancerId === currentUser.id && (c.status === 'paid' || c.status === 'checked_in' || c.status === 'completed')
  ) : false;

  // Se for o próprio estabelecimento gerorando a vaga (manage), ele vê os dados. Se for o freela (apply), só vê os dados se houver contrato fechado/pago.
  const showIdentity = variant === 'manage' || hasActiveContract;

  return (
    <>
      <div className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 transition-all hover:shadow-card-hover dark:bg-neutral-900 ${paused ? 'border-neutral-200 opacity-70 dark:border-neutral-800' : job.urgency === 'hoje' ? 'border-error-200 dark:border-error-500/30' : 'border-neutral-200 dark:border-neutral-800'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {showIdentity ? (
              <Avatar src={job.establishmentPhoto} alt={job.establishmentName} size={44} ring="neutral" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                <Lock className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">
                {showIdentity ? job.establishmentName : 'Estabelecimento Confidencial'}
              </p>
              <p className="text-xs text-neutral-400">
                {showIdentity ? `${job.city}, ${job.state}` : 'Região Metropolitana'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {paused && <Badge tone="neutral">Pausada</Badge>}
            <Badge tone={urgencyTone[job.urgency]}><Zap className="h-3 w-3" /> {urgencyLabel(job.urgency)}</Badge>
          </div>
        </div>

        <div>
          <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">{job.title}</h3>
          {cat && <div className="mt-1"><Badge tone="primary">{cat.label}</Badge></div>}
        </div>

        <p className="line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">{job.description}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(job.date)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {job.startTime} · {job.hours}h</span>
          {variant === 'manage' && (
            <button 
              onClick={() => setShowApplicants(true)}
              className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold hover:underline cursor-pointer"
            >
              <Users className="h-3.5 w-3.5" /> {job.applicants.length} candidato(s)
            </button>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <p className="font-display text-lg font-extrabold text-neutral-900 dark:text-white">{formatCurrency(job.value ?? job.dailyRate ?? 0)}</p>
          {variant === 'manage' ? (
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" onClick={() => { pauseJob(job.id); notify(paused ? 'Vaga reativada' : 'Vaga pausada', paused ? 'success' : 'info'); }}>
                {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </Button>
              <Button size="sm" variant="ghost" className="text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10" onClick={() => setConfirmDelete(true)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ) : (
            <Button size="sm" variant={applied ? 'secondary' : 'primary'} disabled={applied || paused} onClick={apply}>
              {applied ? <><CheckCircle2 className="h-4 w-4" /> Candidatado</> : 'Candidatar-se Já'}
            </Button>
          )}
        </div>
      </div>

      {/* Modal de Exclusão */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir vaga" size="sm"
        footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setConfirmDelete(false)}>Cancelar</Button><Button variant="danger" fullWidth onClick={() => { deleteJob(job.id); setConfirmDelete(false); notify('Vaga excluída', 'warning'); }}><Trash2 className="h-4 w-4" /> Excluir</Button></div>}>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Excluir a vaga <strong>"{job.title}"</strong>?</p>
      </Modal>

      {/* Modal para Listar Candidatos */}
      <Modal open={showApplicants} onClose={() => setShowApplicants(false)} title={`Candidatos (${applicantsList.length})`} size="md">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {applicantsList.length === 0 ? (
            <p className="text-center text-sm text-neutral-400 py-8">Nenhum candidato nesta vaga ainda.</p>
          ) : (
            applicantsList.map((applicant) => (
              <div key={applicant.id} className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3">
                  <Avatar src={applicant.photo} alt={applicant.name} size={40} />
                  <div>
                    <p className="font-semibold text-sm text-neutral-900 dark:text-white">{applicant.name}</p>
                    <p className="text-xs text-neutral-400">Diária: {formatCurrency(applicant.dailyRate || job.dailyRate || job.value || 0)}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    requestHire(job.establishmentId, applicant.id, job.id, job.hours, applicant.dailyRate || job.dailyRate || job.value || 0);
                    notify('Solicitação de contratação enviada com sucesso!');
                    setShowApplicants(false);
                  }}
                >
                  Contratar
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {editing && establishment && <JobFormModal key={job.id} open={editing} onClose={() => setEditing(false)} editing={job} establishment={establishment} />}
    </>
  );
}
