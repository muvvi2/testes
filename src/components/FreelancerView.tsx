import { useState } from 'react';
import { User as UserIcon, MapPin, Tags, Calendar, Crown, Wallet, Briefcase, Fingerprint, ShieldCheck, MessageSquare, Save, Inbox, Megaphone, Upload, Check, X, Globe, Sliders } from 'lucide-react';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Field';
import { Rating } from './ui/Rating';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { VipPanel } from './VipPanel';
import { WalletPanel } from './WalletPanel';
import { JobCard } from './JobCard';
import { VipSquareWidget } from './VipSquareWidget';
import { EscrowFlowModal } from './EscrowFlowModal';
import { ReviewModal } from './ReviewModal';

import { formatCurrency, getPlan, countAvailableSlots, maskCEP, maskCPF, maskPhone, formatDateTime } from '@/utils';
import type { Contract, ShiftSlot, Address } from '@/types';
import { CATEGORIES, MACRO_CATEGORIES } from '@/mockData';

const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export function FreelancerView() {
  const { currentUser, data, toggleDateShift, toggleCategory, reviewsFor, updateUser } = useApp();
  const { notify } = useToast();
  const me = currentUser!;
  const plan = getPlan(me.vipTier ?? 'free', data.vipPlans);

  const [escrowContract, setEscrowContract] = useState<Contract | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Contract | null>(null);
  const [tab, setTab] = useState<'opportunities' | 'personal' | 'address' | 'specialties' | 'agenda' | 'vip' | 'wallet'>('opportunities');
  const [radiusKm, setRadiusKm] = useState<number>(50);

  const myContracts = data.contracts.filter((c) => c.freelancerId === me.id);
  const openJobs = data.jobs.filter((j) => {
    if (j.status !== 'active') return false;
    if (me.unlimitedKm) return true;
    return !j.city || j.city.toLowerCase() === (me.address?.city || '').toLowerCase();
  });

  const tabs = [
    { id: 'opportunities' as const, label: 'Oportunidades e Propostas', icon: Megaphone },
    { id: 'personal' as const, label: 'Dados Pessoais', icon: UserIcon },
    { id: 'address' as const, label: 'Endereço', icon: MapPin },
    { id: 'specialties' as const, label: 'Especialidades', icon: Tags },
    { id: 'agenda' as const, label: 'Agenda', icon: Calendar },
    { id: 'vip' as const, label: 'Plano VIP', icon: Crown },
    { id: 'wallet' as const, label: 'Carteira', icon: Wallet },
  ];

  if (tab === 'vip') {
    return <VipPanel userId={me.id} accountType="freelancer" onBack={() => setTab('opportunities')} />;
  }

  // 🛠️ ATUALIZADO: Inclui todos os status ativos para o contrato não sumir da tela do prestador
  const activeInvites = myContracts.filter((c) => ['requested', 'confirmed', 'paid', 'check_in_pending', 'checked_in'].includes(c.status));

  return (
    <div className="mx-auto w-[98%] max-w-[1800px] px-4 py-6 sm:px-6 space-y-6">
      
      {/* PROFILE HEADER CARD COM ESTATÍSTICAS INTEGRADAS E SLOT 1 À DIREITA */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6 shadow-sm">
        {me.vipTier && me.vipTier !== 'free' && <div className="absolute right-4 top-4 z-10"><Badge tone="vip"><Crown className="h-3 w-3" /> {plan.label}</Badge></div>}
        
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-center">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar src={me.photo} alt={me.name} size={96} ring={me.vipTier && me.vipTier !== 'free' ? 'vip' : 'primary'} vipBadge={me.vipTier === 'vip2' || me.vipTier === 'vip3' || me.vipTier === 'vip4'} />
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-extrabold text-neutral-900 dark:text-white">{me.name}</h1>
                  {me.documentVerified && <ShieldCheck className="h-5 w-5 text-secondary-500" />}
                </div>
                {me.nickname && <p className="text-sm text-neutral-400">"{me.nickname}"</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Rating value={me.rating ?? 0} count={me.reviewsCount ?? 0} />
                  <span className="inline-flex items-center gap-1 text-sm text-neutral-400"><Briefcase className="h-4 w-4" /> {me.completedShifts ?? 0} turnos</span>
                  <span className="text-sm text-neutral-400">{me.unlimitedKm ? '🌐 KM Livre / Disponível para viagens' : `${me.address?.city}, ${me.address?.state}`}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{me.bio ?? 'Sem biografia. Edite seu perfil para adicionar uma descrição.'}</p>
              </div>

              {/* ESTATÍSTICAS INTEGRADAS */}
              <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800 sm:grid-cols-4">
                <InfoBox label="Diária fechada" value={formatCurrency(me.dailyRate ?? 0)} />
                <InfoBox label="Hora comercial" value={formatCurrency(me.hourlyRate ?? 0)} />
                <InfoBox label="Disponibilidade" value={`${countAvailableSlots(me.availability)} turnos`} />
                <InfoBox label="Plano" value={plan.label} />
              </div>
            </div>
          </div>

          {/* SLOT 1 NO HEADER DO PERFIL (LADO DIREITO) */}
          <div className="w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
            <VipSquareWidget pageType="freelancers" slot={1} />
          </div>
        </div>
      </div>

      {/* Audit log card */}
      {me.termsAcceptance && (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
          <Fingerprint className="h-4 w-4 shrink-0 text-neutral-400" />
          <p className="text-xs text-neutral-500">
            Aceite dos termos registrado em <strong>{formatDateTime(me.termsAcceptance.timestamp)}</strong> · IP: <span className="font-mono">{me.termsAcceptance.ip}</span> · Versão: {me.termsAcceptance.legalVersion}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
        {tabs.map((t) => { const Icon = t.icon; const active = tab === t.id; return <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${active ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'}`}><Icon className="h-4 w-4" /> {t.label}</button>; })}
      </div>

      <div>
        {tab === 'opportunities' && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr_1fr] items-start">
            
            {/* COLUNA 1: Convites Diretos / Contratos Ativos no topo + SLOT 3 no rodapé esquerdo */}
            <div className="flex flex-col justify-between h-full space-y-6">
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-neutral-900 dark:text-white"><Inbox className="h-5 w-5 text-primary-500" /> Propostas e Contratos</h2>
                {activeInvites.length > 0 ? (
                  <div className="space-y-3">
                    {activeInvites.map((c) => {
                      const statusBadgeTone = c.status === 'confirmed' ? 'success' : c.status === 'paid' ? 'warning' : c.status === 'check_in_pending' ? 'warning' : c.status === 'checked_in' ? 'secondary' : 'warning';
                      const statusLabel = c.status === 'requested' ? 'Pendente' : c.status === 'confirmed' ? 'Confirmado' : c.status === 'paid' ? 'Pago em Garantia' : c.status === 'check_in_pending' ? 'Aguardando Aprovação' : 'Check-in Realizado';
                      return (
                        <button key={c.id} onClick={() => setEscrowContract(c)} className="flex w-full items-center gap-3 rounded-xl border border-neutral-100 p-3 text-left transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
                          <Avatar src={c.freelancerPhoto} alt={c.freelancerName} size={40} />
                          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{c.establishmentName}</p><p className="text-xs text-neutral-400">{formatCurrency(c.freelancerFee)} · {c.category}</p></div>
                          <Badge tone={statusBadgeTone}>{statusLabel}</Badge>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl bg-neutral-50 p-6 text-center dark:bg-neutral-800/50">
                    <Inbox className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                    <p className="text-sm text-neutral-400">Nenhum convite ou contrato ativo no momento.</p>
                  </div>
                )}
              </section>

              {/* SLOT 3: Rodapé esquerdo da página */}
              <div className="w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm mt-auto">
                <VipSquareWidget pageType="freelancers" slot={3} />
              </div>
            </div>

            {/* COLUNA 2 E 3: Mural de Vagas */}
            <section className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <h2 className="flex items-center gap-2 font-display font-bold text-neutral-900 dark:text-white">
                  <Megaphone className="h-5 w-5 text-secondary-500" /> Mural de Vagas
                </h2>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                    <input type="checkbox" checked={me.unlimitedKm} onChange={(e) => updateUser(me.id, { unlimitedKm: e.target.checked })} className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" /> KM Livre
                  </label>
                </div>
              </div>

              {/* Slider Escalável 0 a 100km */}
              <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-800/50">
                <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-500">Raio de Atuação:</span>
                <input type="range" min={1} max={100} step={1} disabled={me.unlimitedKm} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className={`flex-1 accent-primary-500 ${me.unlimitedKm ? 'opacity-40' : ''}`} />
                <span className="w-16 text-right text-xs font-bold text-neutral-700 dark:text-neutral-300">{me.unlimitedKm ? 'Ilistado' : `${radiusKm}km`}</span>
              </div>

              {openJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center md:justify-items-stretch">
                  
                  {openJobs[0] && (
                    <div className="w-full max-w-[380px] justify-self-center">
                      <JobCard job={openJobs[0]} variant="apply" />
                    </div>
                  )}

                  {openJobs[1] && (
                    <div className="w-full max-w-[380px] justify-self-center">
                      <JobCard job={openJobs[1]} variant="apply" />
                    </div>
                  )}

                  {/* Anúncio SLOT 2 */}
                  <div className="w-full max-w-[380px] h-[250px] justify-self-center">
                    <VipSquareWidget pageType="freelancers" slot={2} />
                  </div>

                  {openJobs[2] && (
                    <div className="w-full max-w-[380px] justify-self-center">
                      <JobCard job={openJobs[2]} variant="apply" />
                    </div>
                  )}

                  {openJobs.slice(3).map((j) => (
                    <div key={j.id} className="w-full max-w-[380px] justify-self-center">
                      <JobCard job={j} variant="apply" />
                    </div>
                  ))}

                </div>
              ) : (
                <div className="rounded-xl bg-neutral-50 p-8 text-center dark:bg-neutral-800/50">
                  <Megaphone className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                  <p className="text-sm text-neutral-400">Nenhuma vaga aberta na sua região no momento.</p>
                </div>
              )}
            </section>

          </div>
        )}

        {tab === 'personal' && <PersonalTab me={me} onSave={(patch) => { updateUser(me.id, patch); notify('Dados pessoais atualizados com sucesso!'); }} />}
        {tab === 'address' && <AddressTab me={me} onSave={(addrPatch) => { updateUser(me.id, addrPatch); notify('Endereço atualizado com sucesso!'); }} />}
        {tab === 'specialties' && <SpecialtiesTab me={me} onToggleCat={(catId: string) => { const res = toggleCategory(me.id, catId); if (!res.ok) notify(res.error ?? 'Erro', 'warning'); else notify('Categoria atualizada'); }} onSave={(patch) => { updateUser(me.id, patch); notify('Valores atualizados!'); }} />}
        
        {tab === 'agenda' && (
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Agenda interativa de disponibilidade</h2>
              <p className="text-sm text-neutral-400">Selecione o turno ativo e clique nos dias do calendário para marcar sua disponibilidade. As cores indicam: laranja = manhã, azul claro = tarde, roxo = noite.</p>
            </div>
            <AvailabilityCalendar 
              dateAvailability={me.dateAvailability} 
              editable 
              onToggle={(dateKey: string, shift: ShiftSlot) => {
                toggleDateShift(me.id, dateKey, shift);
                notify('Agenda salva com sucesso!');
              }} 
            />
          </section>
        )}

        {tab === 'wallet' && <WalletPanel userId={me.id} />}
      </div>

      {escrowContract && <EscrowFlowModal contract={escrowContract} open={!!escrowContract} onClose={() => setEscrowContract(null)} />}
      {reviewTarget && <ReviewModal open={!!reviewTarget} onClose={() => setReviewTarget(null)} contractId={reviewTarget.id} fromId={me.id} fromName={me.name} toId={reviewTarget.establishmentId} toName={reviewTarget.establishmentName} />}
    </div>
  );
}

function PersonalTab({ me, onSave }: { me: any; onSave: (patch: any) => void }) {
  const [name, setName] = useState(me.name || '');
  const [nickname, setNickname] = useState(me.nickname || '');
  const [phone, setPhone] = useState(me.phone || '');
  const [whatsapp, setWhatsapp] = useState(me.whatsapp || '');
  const [cpf, setCpf] = useState(me.cpf || '');
  const [asaasWalletId, setAsaasWalletId] = useState(me.asaasWalletId || '');
  const [bio, setBio] = useState(me.bio || '');
  const [photo, setPhoto] = useState(me.photo || '');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 space-y-4 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-neutral-900 dark:text-white"><UserIcon className="h-5 w-5 text-primary-500" /> Dados Pessoais</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Apelido / Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        <Input label="Telefone" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
        <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} />
        <Input label="CPF" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} />
        <Input label="ID da Conta Asaas" value={asaasWalletId} onChange={(e) => setAsaasWalletId(e.target.value)} />
        <div className="sm:col-span-2 space-y-2">
          <label className="block text-xs font-semibold text-neutral-500">Foto de Perfil</label>
          <div className="flex items-center gap-4">
            <Avatar src={photo} alt="Preview" size={64} />
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              <Upload className="h-4 w-4" /> Escolher imagem
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-neutral-500">Biografia</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
        </div>
      </div>
      <Button onClick={() => onSave({ name, nickname, phone, whatsapp, cpf, asaasWalletId, bio, photo })}><Save className="h-4 w-4" /> Salvar alterações</Button>
    </section>
  );
}

function AddressTab({ me, onSave }: { me: any; onSave: (patch: any) => void }) {
  const [cep, setCep] = useState(me.address?.cep || '');
  const [street, setStreet] = useState(me.address?.street || '');
  const [number, setNumber] = useState(me.address?.number || '');
  const [complement, setComplement] = useState(me.address?.complement || '');
  const [neighborhood, setNeighborhood] = useState(me.address?.neighborhood || '');
  const [city, setCity] = useState(me.address?.city || '');
  const [state, setState] = useState(me.address?.state || 'SP');

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 space-y-4 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-neutral-900 dark:text-white"><MapPin className="h-5 w-5 text-primary-500" /> Endereço Residencial</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="CEP" value={cep} onChange={(e) => setCep(maskCEP(e.target.value))} />
        <div className="sm:col-span-2"><Input label="Logradouro" value={street} onChange={(e) => setStreet(e.target.value)} /></div>
        <Input label="Número" value={number} onChange={(e) => setNumber(e.target.value)} />
        <Input label="Complemento" value={complement} onChange={(e) => setComplement(e.target.value)} />
        <Input label="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
        <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
        <Select label="Estado (UF)" value={state} onChange={(e) => setState(e.target.value)}>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <Button onClick={() => onSave({ address: { cep, street, number, complement, neighborhood, city, state } })}><Save className="h-4 w-4" /> Salvar endereço</Button>
    </section>
  );
}

function SpecialtiesTab({ me, onToggleCat, onSave }: { me: any; onToggleCat: (catId: string) => void; onSave: (patch: any) => void }) {
  const [hourlyRate, setHourlyRate] = useState(String(me.hourlyRate ?? 0));
  const [dailyRate, setDailyRate] = useState(String(me.dailyRate ?? 0));
  const [categoryRates, setCategoryRates] = useState<Record<string, { hourly: string; daily: string }>>(me.categoryRates || {});
  const [selectedMacro, setSelectedMacro] = useState(MACRO_CATEGORIES[0].id);
  const filteredCategories = CATEGORIES.filter(cat => cat.macro === selectedMacro);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm space-y-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-neutral-900 dark:text-white"><Tags className="h-5 w-5 text-primary-500" /> Especialidades e Valores</h2>
      
      {me.categories?.length > 0 && (
        <div className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-neutral-500">Valores Individuais por Especialidade ({me.categories.length} selecionadas)</p>
            <span className="text-[11px] text-neutral-400">Opcional: se vazio, vale o padrão global</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {me.categories.map((catId: string) => {
              const cat = CATEGORIES.find(c => c.id === catId);
              if (!cat) return null;
              const currentRate = categoryRates[catId] || { hourly: '', daily: '' };
              return (
                <div key={catId} className="flex items-center justify-between gap-2 bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate flex-1" title={cat.label}>{cat.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input type="number" placeholder="R$/h" className="w-20 rounded border border-neutral-200 px-2 py-1 text-xs dark:bg-neutral-800 dark:border-neutral-700 text-neutral-900 dark:text-white" value={currentRate.hourly} onChange={(e) => setCategoryRates({ ...categoryRates, [catId]: { ...currentRate, hourly: e.target.value } })} />
                    <input type="number" placeholder="Diária" className="w-20 rounded border border-neutral-200 px-2 py-1 text-xs dark:bg-neutral-800 dark:border-neutral-700 text-neutral-900 dark:text-white" value={currentRate.daily} onChange={(e) => setCategoryRates({ ...categoryRates, [catId]: { ...currentRate, daily: e.target.value } })} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden p-4 bg-neutral-50 dark:bg-neutral-900">
        <div className="space-y-1 md:col-span-1">
          {MACRO_CATEGORIES.map(macro => (
            <button key={macro.id} onClick={() => setSelectedMacro(macro.id)} className={`w-full p-3 text-left text-xs font-semibold rounded-lg transition flex items-center gap-2.5 ${selectedMacro === macro.id ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800'}`}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: macro.color }} />
              <span className="truncate">{macro.label}</span>
            </button>
          ))}
        </div>
        <div className="md:col-span-2 space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {filteredCategories.map(cat => {
            const isSelected = (me.categories || []).includes(cat.id);
            return (
              <button key={cat.id} onClick={() => onToggleCat(cat.id)} className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-medium transition text-left border ${isSelected ? 'bg-primary-50 border-primary-300 text-primary-800 dark:bg-primary-950/40 dark:border-primary-500/40 dark:text-primary-300' : 'bg-white border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'}`}>
                {cat.label}
                {isSelected && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 pt-2">
        <Input label="Valor Padrão da Hora (R$/h)" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
        <Input label="Valor Padrão da Diária (R$)" type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
      </div>
      <Button className="mt-4" onClick={() => onSave({ hourlyRate: Number(hourlyRate), dailyRate: Number(dailyRate), categoryRates })}><Save className="h-4 w-4" /> Salvar valores</Button>
    </section>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-neutral-400">{label}</p><p className="mt-0.5 font-semibold text-neutral-900 dark:text-white">{value}</p></div>; }
