import { useState } from 'react';
import { MapPin, Clock, Crown, Pencil, Trash2, Check, DollarSign, Briefcase, Lock, Eye, Globe, Upload } from 'lucide-react';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { Rating } from './ui/Rating';
import { Input, Textarea } from './ui/Field';
import { formatCurrency, getPlan, countAvailableSlots, maskCPF, maskPhone } from '@/utils';
import { CATEGORIES } from '@/mockData';
import type { User } from '@/types';

interface Props {
  freelancer: User;
  onHire?: (f: User) => void;
  onView?: (f: User) => void;
  showAdminActions?: boolean;
  showEdit?: boolean;
  distanceKm?: number;
}

export function FreelancerCard({ freelancer: f, onHire, onView, showAdminActions, showEdit = false, distanceKm }: Props) {
  const { updateUser, deleteEntity, data, currentUser } = useApp();
  const { notify } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const plan = getPlan(f.vipTier ?? 'free', data.vipPlans);

  const hasActiveContract = currentUser ? data.contracts.some(
    (c) => c.freelancerId === f.id && c.establishmentId === currentUser.id && (c.status === 'paid' || c.status === 'checked_in' || c.status === 'completed')
  ) : false;

  const isSelf = currentUser?.id === f.id;
  const showIdentity = isSelf || showAdminActions || hasActiveContract;

  return (
    <>
      <div className={`group relative flex flex-col gap-4 rounded-2xl border bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover dark:bg-neutral-900 ${f.vipTier === 'vip3' || f.vipTier === 'vip4' || f.vipTier === 'vip5' || f.vipTier === 'vip6' ? 'border-amber-400/60 shadow-glow-vip dark:border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-white to-transparent dark:from-amber-950/20 dark:via-neutral-900 dark:to-neutral-900' : f.vipTier === 'vip2' ? 'border-secondary-300/50 dark:border-secondary-500/30' : f.vipTier === 'vip1' ? 'border-primary-200 dark:border-primary-500/30' : 'border-neutral-200 dark:border-neutral-800'}`}>
        {f.vipTier && f.vipTier !== 'free' && (
          <div className="absolute -top-2.5 left-4 z-10">
            <Badge tone="vip"><Crown className="h-3 w-3 text-amber-500" /> {plan.label}</Badge>
          </div>
        )}

        <div className="flex items-start gap-4">
          {showIdentity ? (
            <Avatar src={f.photo} alt={f.name} size={64} ring={f.vipTier && f.vipTier !== 'free' ? 'vip' : 'neutral'} vipBadge={f.vipTier === 'vip2' || f.vipTier === 'vip3'} />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
              <Lock className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-bold text-neutral-900 dark:text-white">
              {showIdentity ? f.name : 'Profissional Confidencial'}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Rating value={f.rating ?? 0} count={f.reviewsCount ?? 0} />
              <span className="inline-flex items-center gap-1 text-xs text-neutral-400"><Briefcase className="h-3.5 w-3.5" /> {f.completedShifts ?? 0} turnos</span>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-neutral-400">
              <span className="inline-flex items-center gap-1">
                {f.unlimitedKm ? <Globe className="h-3.5 w-3.5 text-primary-500" /> : <MapPin className="h-3.5 w-3.5" />} 
                {showIdentity ? (f.unlimitedKm ? 'KM Livre / Disponível para viagens' : `${f.address?.city}${distanceKm != null && distanceKm < 9999 ? ` · ${distanceKm < 1 ? '<1' : Math.round(distanceKm)}km` : ''}`) : 'Região Metropolitana'}
              </span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {countAvailableSlots(f.availability)} horários</span>
            </div>
          </div>
        </div>

        {f.categories && f.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {f.categories.slice(0, 4).map((cid) => {
              const cat = CATEGORIES.find((c) => c.id === cid);
              return <Badge key={cid} tone="primary">{cat?.label ?? cid}</Badge>;
            })}
            {f.categories.length > 4 && <Badge tone="neutral">+{f.categories.length - 4}</Badge>}
          </div>
        )}

        <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{f.bio ?? 'Sem descrição.'}</p>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Lock className="h-3.5 w-3.5" /> {showIdentity ? 'Contato liberado' : 'Nome e contato liberados após contratação e pagamento'}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <div>
            <p className="text-xs text-neutral-400">Diária</p>
            <p className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">{formatCurrency(f.dailyRate ?? 0)}</p>
            <p className="text-xs text-neutral-400">ou {formatCurrency(f.hourlyRate ?? 0)}/h</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {onView && <Button size="sm" variant="outline" onClick={() => onView(f)}><Eye className="h-3.5 w-3.5" /> Ver perfil</Button>}
            {onHire && <Button size="sm" onClick={() => onHire(f)}><DollarSign className="h-4 w-4" /> Contratar</Button>}
            {showEdit && isSelf && <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /> Editar</Button>}
          </div>
        </div>
      </div>

      {editing && isSelf && (
        <FreelancerEditModal freelancer={f} open={editing} onClose={() => setEditing(false)} onSave={(patch) => { updateUser(f.id, patch); setEditing(false); notify('Perfil atualizado com sucesso!'); }} />
      )}
    </>
  );
}

export function FreelancerEditModal({ freelancer, open, onClose, onSave }: { freelancer: User; open: boolean; onClose: () => void; onSave: (patch: Partial<User>) => void }) {
  const [name, setName] = useState(freelancer.name);
  const [photo, setPhoto] = useState(freelancer.photo);
  const [bio, setBio] = useState(freelancer.bio ?? '');
  const [dailyRate, setDailyRate] = useState(String(freelancer.dailyRate ?? 0));
  const [hourlyRate, setHourlyRate] = useState(String(freelancer.hourlyRate ?? 0));
  const [categoryRates, setCategoryRates] = useState<Record<string, { hourly: string; daily: string }>>(freelancer.categoryRates || {});
  const [unlimitedKm, setUnlimitedKm] = useState(freelancer.unlimitedKm || false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar perfil" size="lg"
      footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button><Button fullWidth onClick={() => onSave({ name, photo, bio, dailyRate: Number(dailyRate) || 0, hourlyRate: Number(hourlyRate) || 0, categoryRates, unlimitedKm })}><Check className="h-4 w-4" /> Salvar</Button></div>}>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Diária padrão (R$)" type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
        <Input label="Hora padrão (R$)" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />

        {/* Valores individuais por categoria selecionada */}
        {freelancer.categories?.length > 0 && (
          <div className="sm:col-span-2 space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
            <p className="text-xs font-semibold uppercase text-neutral-500">Valores Individuais por Especialidade</p>
            {freelancer.categories.map((catId: string) => {
              const cat = CATEGORIES.find(c => c.id === catId);
              if (!cat) return null;
              const currentRate = categoryRates[catId] || { hourly: '', daily: '' };
              return (
                <div key={catId} className="flex flex-col sm:flex-row items-center gap-2 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <span className="text-sm font-semibold flex-1 text-neutral-900 dark:text-white">{cat.label}</span>
                  <input 
                    type="number" 
                    placeholder="R$/h" 
                    className="w-28 rounded-lg border border-neutral-200 p-2 text-sm dark:bg-neutral-900 dark:border-neutral-700" 
                    value={currentRate.hourly}
                    onChange={(e) => setCategoryRates({ ...categoryRates, [catId]: { ...currentRate, hourly: e.target.value } })}
                  />
                  <input 
                    type="number" 
                    placeholder="Diária R$" 
                    className="w-28 rounded-lg border border-neutral-200 p-2 text-sm dark:bg-neutral-900 dark:border-neutral-700" 
                    value={currentRate.daily}
                    onChange={(e) => setCategoryRates({ ...categoryRates, [catId]: { ...currentRate, daily: e.target.value } })}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="sm:col-span-2 space-y-2">
          <label className="block text-xs font-semibold text-neutral-500">Foto de Perfil</label>
          <div className="flex items-center gap-4">
            <Avatar src={photo} alt="Preview" size={64} />
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              <Upload className="h-4 w-4" /> Escolher nova imagem
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <div className="sm:col-span-2 flex items-center justify-between p-4 rounded-xl border border-primary-100 bg-primary-50/50 dark:border-primary-900/30 dark:bg-primary-900/10">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <div>
              <p className="font-semibold text-sm text-neutral-900 dark:text-white">KM Livre / Disponível para viagens</p>
              <p className="text-xs text-neutral-500">Aceita propostas de qualquer região ou cidade.</p>
            </div>
          </div>
          <input type="checkbox" checked={unlimitedKm} onChange={(e) => setUnlimitedKm(e.target.checked)} className="h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
        </div>

        <div className="sm:col-span-2"><Textarea label="Biografia" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} /></div>
      </div>
    </Modal>
  );
}
