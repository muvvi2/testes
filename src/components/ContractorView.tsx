import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Plus, Megaphone, Store, Users, FileText, Pencil, MapPin, Navigation, Crown, Globe, Calendar, Clock, Trash2, Pause, Play, CheckCircle2, Info } from 'lucide-react';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { Rating } from './ui/Rating';
import { FreelancerCard } from './FreelancerCard';
import { FreelancerDetailModal } from './FreelancerDetailModal';
import { JobCard } from './JobCard';
import { JobFormModal } from './JobFormModal';
import { EscrowFlowModal } from './EscrowFlowModal';
import { VipPanel } from './VipPanel';
import { VipSquareWidget } from './VipSquareWidget';
import { EstablishmentEditModal } from './EstablishmentEditModal';
import { Modal } from './ui/Modal';
import { CATEGORIES, MACRO_CATEGORIES } from '@/mockData';
import { formatCurrency, formatDateBR, distanceBetween, isWithinRadius, isAvailableToday, isAvailableTomorrow, isFreelancerAvailableOn, isEstablishmentOnTrial, trialDaysLeft, contractStatusLabel, contractStatusTone, getIntermediationFeePercent, calculateFees } from '@/utils';
import type { User, Job, Contract } from '@/types';

export function calculateDirectHireFee(
  hourlyRate: number,
  dailyRate: number,
  hours: number
): { freelancerFee: number; breakdown: { label: string; amount: number }[] } {
  const hRate = hourlyRate > 0 ? hourlyRate : (dailyRate > 0 ? dailyRate / 8 : 25);
  const dRate = dailyRate > 0 ? dailyRate : hRate * 8;

  if (hours === 8) {
    return {
      freelancerFee: dRate,
      breakdown: [{ label: 'Diária Padrão (8h)', amount: dRate }]
    };
  }

  if (hours < 8) {
    const firstHourPrice = Math.round(hRate * 1.4 * 100) / 100;
    const additionalHoursPrice = (hours - 1) * hRate;
    const totalCalculated = firstHourPrice + additionalHoursPrice;

    if (totalCalculated >= dRate) {
      return {
        freelancerFee: dRate,
        breakdown: [{ label: `Turno de ${hours}h (Teto da Diária)`, amount: dRate }]
      };
    }

    const breakdown = [
      { label: '1ª Hora com adicional (+40%)', amount: firstHourPrice }
    ];
    if (hours > 1) {
      breakdown.push({ label: `${hours - 1}h adicionais (${formatCurrency(hRate)}/h)`, amount: additionalHoursPrice });
    }

    return {
      freelancerFee: totalCalculated,
      breakdown
    };
  }

  const extraHours = hours - 8;
  const extraHourRate = Math.round(hRate * 1.25 * 100) / 100;
  const extraTotal = extraHours * extraHourRate;
  const freelancerFee = dRate + extraTotal;

  return {
    freelancerFee,
    breakdown: [
      { label: 'Diária Padrão (8h)', amount: dRate },
      { label: `${extraHours}h extras (+25% = ${formatCurrency(extraHourRate)}/h)`, amount: extraTotal }
    ]
  };
}

export function ContractorView() {
  const { currentUser, data, requestHire, categoryById, deleteJob, pauseJob } = useApp();
  const { notify } = useToast();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [macroFilter, setMacroFilter] = useState<string>('all');
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price'>('distance');
  const [useGps, setUseGps] = useState(false);
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [dateFilter, setDateFilter] = useState<'any' | 'today' | 'tomorrow' | 'custom'>('any');
  const [customDate, setCustomDate] = useState('');
  const [viewing, setViewing] = useState<User | null>(null);
  const [directHireTarget, setDirectHireTarget] = useState<User | null>(null);
  const [directHours, setDirectHours] = useState<number>(8);
  const [escrowContract, setEscrowContract] = useState<Contract | null>(null);
  const [jobForm, setJobForm] = useState<{ open: boolean; editing: Job | null }>({ open: false, editing: null });
  const [editEstablishment, setEditEstablishment] = useState(false);
  const [viewVipPage, setViewVipPage] = useState(false);
  
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [showContractsModal, setShowContractsModal] = useState(false);
  const [showNearbyModal, setShowNearbyModal] = useState(false);

  if (!currentUser || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-neutral-400">Carregando painel do estabelecimento...</p>
      </div>
    );
  }

  const me = currentUser;
  const myJobs = data.jobs?.filter((j) => j.establishmentId === me.id) || [];
  const myContracts = data.contracts?.filter((c) => c.establishmentId === me.id) || [];

  const handleGps = () => {
    if (useGps) { setUseGps(false); return; }
    if (!navigator.geolocation) { notify('Geolocalização não suportada neste navegador.', 'warning'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsLat(pos.coords.latitude); setGpsLng(pos.coords.longitude); setUseGps(true); notify('Localização GPS detectada com sucesso!'); },
      () => { notify('Não foi possível obter sua localização GPS.', 'warning'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const establishmentCity = me.address?.city || 'Pitangueiras';
  const establishmentState = me.address?.state || 'SP';

  const origin = useGps && gpsLat != null && gpsLng != null
    ? { cep: '', street: '', number: '', neighborhood: '', city: 'GPS Atual', state: establishmentState, lat: gpsLat, lng: gpsLng }
    : (me.address || { cep: '', street: '', number: '', neighborhood: '', city: establishmentCity, state: establishmentState, lat: -21.01, lng: -48.22 });

  const filtered = useMemo(() => {
    if (!data.users) return [];
    let list = data.users.filter((f) => {
      if (f.accountType !== 'freelancer' || f.isAdmin || f.banned) return false;
      if (!isUnlimited && !isWithinRadius(f, origin, radiusKm)) return false;

      if (macroFilter !== 'all') {
        const macroCats = CATEGORIES.filter((c) => c.macro === macroFilter).map((c) => c.id);
        if (!(f.categories ?? []).some((c) => macroCats.includes(c))) return false;
      }
      if (category !== 'all' && !(f.categories ?? []).includes(category)) return false;
      if ((f.rating ?? 0) < minRating) return false;
      if (dateFilter === 'today' && !isAvailableToday(f)) return false;
      if (dateFilter === 'tomorrow' && !isAvailableTomorrow(f)) return false;
      if (dateFilter === 'custom' && customDate && !isFreelancerAvailableOn(f, customDate)) return false;
      if (query) {
        const q = query.toLowerCase();
        const catLabels = (f.categories ?? []).map((c) => categoryById(c)?.label.toLowerCase() ?? '').join(' ');
        if (!f.name.toLowerCase().includes(q) && !catLabels.includes(q) && !(f.bio ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const tierRank: Record<string, number> = { vip3: 0, vip2: 1, vip1: 2, free: 3 };
    list = [...list].sort((a, b) => {
      const tierDiff = (tierRank[a.vipTier ?? 'free'] ?? 3) - (tierRank[b.vipTier ?? 'free'] ?? 3);
      if (tierDiff !== 0) return tierDiff;
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === 'price') return (a.dailyRate ?? 9999) - (b.dailyRate ?? 9999);
      return distanceBetween(a.address, origin) - distanceBetween(b.address, origin);
    });
    return list;
  }, [data.users, origin, radiusKm, isUnlimited, macroFilter, category, minRating, dateFilter, customDate, query, sortBy, categoryById]);

  const openDirectHireModal = (f: User) => {
    setDirectHireTarget(f);
    setDirectHours(8);
  };

  const confirmDirectHire = () => {
    if (!directHireTarget) return;
    const { freelancerFee } = calculateDirectHireFee(
      directHireTarget.hourlyRate ?? 0,
      directHireTarget.dailyRate ?? 0,
      directHours
    );
    const contract = requestHire(me.id, directHireTarget.id, null, directHours, freelancerFee);
    setDirectHireTarget(null);
    setEscrowContract(contract);
    notify('Solicitação de contratação enviada! Aguarde a confirmação do freelancer.');
  };

  if (viewVipPage) {
    return (
      <VipPanel 
        userId={me.id} 
        accountType="establishment" 
        onBack={() => setViewVipPage(false)} 
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 space-y-6 text-neutral-900 dark:text-white">
      
      {/* LAYOUT PRINCIPAL EM DUAS COLUNAS */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr] items-start">
        
        {/* COLUNA ESQUERDA */}
        <aside className="space-y-6 w-full">
          <div className="w-full aspect-[600/900] overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
             <VipSquareWidget pageType="establishments" slot={1} />
          </div>

          {filtered[0] && (
            <div>
              <FreelancerCard freelancer={filtered[0]} onHire={openDirectHireModal} onView={setViewing} distanceKm={distanceBetween(filtered[0].address, origin)} />
            </div>
          )}
        </aside>

        {/* COLUNA DIREITA */}
        <div className="space-y-6">
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
              <div className="flex items-center gap-4">
                <Avatar src={me.photo} alt={me.name} size={64} />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">{me.name}</h1>
                    <Badge tone="primary">{me.establishmentType}</Badge>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{establishmentCity} - {establishmentState} · <Rating value={me.rating ?? 0} count={me.reviewsCount ?? 0} /></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditEstablishment(true)}><Pencil className="h-4 w-4 mr-1" /> Editar Perfil</Button>
                <Button size="sm" className="bg-gradient-to-r from-warning-500 to-warning-600 text-white shadow-md hover:from-warning-600 hover:to-warning-700" onClick={() => setViewVipPage(true)}><Crown className="h-4 w-4 mr-1" /> Plano VIP & Banners</Button>
              </div>
            </div>

            {isEstablishmentOnTrial(me) && (
              <div className="flex items-center gap-3 rounded-2xl border border-success-200 bg-success-50 p-3.5 dark:border-success-500/30 dark:bg-success-500/10">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-success-500 text-white">
                  <Crown className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-display text-xs font-bold text-success-800 dark:text-success-300">
                    Período de teste gratuito — {trialDaysLeft(me)} dias restantes
                  </p>
                  <p className="text-[11px] text-success-700 dark:text-success-400">Você não paga taxa de intermediação durante os 15 primeiros dias.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div onClick={() => setShowJobsModal(true)} className="cursor-pointer transition-transform hover:scale-[1.02]">
                <CompactStatCard icon={Megaphone} label="Vagas publicadas" value={String(myJobs.length)} tone="primary" />
              </div>
              <div onClick={() => setShowApplicantsModal(true)} className="cursor-pointer transition-transform hover:scale-[1.02]">
                <CompactStatCard icon={Users} label="Candidaturas" value={String(myJobs.reduce((acc, j) => acc + j.applicants.length, 0))} tone="secondary" />
              </div>
              <div onClick={() => setShowContractsModal(true)} className="cursor-pointer transition-transform hover:scale-[1.02]">
                <CompactStatCard icon={FileText} label="Contratações" value={String(myContracts.length)} tone="accent" />
              </div>
              <div onClick={() => setShowNearbyModal(true)} className="cursor-pointer transition-transform hover:scale-[1.02]">
                <CompactStatCard icon={MapPin} label="Profissionais próximos" value={String(filtered.length)} tone="neutral" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Profissionais na sua região</h2>
                  <p className="text-xs text-neutral-400">
                    {isUnlimited ? 'Filtrando por: Km Livre (Nacional)' : `Filtrando a até ${radiusKm} km de ${establishmentCity} - ${establishmentState}.`}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, categoria ou descrição..."
                      className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-primary-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
                  </div>
                  <Button variant="outline" onClick={handleGps} className={useGps ? 'border-secondary-400 text-secondary-600 bg-secondary-50' : ''}><Navigation className={`h-4 w-4 ${useGps ? 'fill-current' : ''}`} /></Button>
                  <Button variant="outline" onClick={() => setShowFilters((s) => !s)} className={showFilters ? 'border-primary-400 text-primary-600' : ''}><SlidersHorizontal className="h-4 w-4" /></Button>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-neutral-500">Categorias:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    <button
                      onClick={() => { setMacroFilter('all'); setCategory('all'); }}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold transition text-center truncate ${macroFilter === 'all' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'}`}
                    >
                      Todas
                    </button>
                    {MACRO_CATEGORIES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setMacroFilter(m.id); setCategory('all'); }}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition text-center truncate ${macroFilter === m.id ? 'text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'}`}
                        style={macroFilter === m.id ? { backgroundColor: m.color } : undefined}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                    <span className="text-xs font-semibold text-neutral-500">Distância</span>
                    <input type="range" min={1} max={100} disabled={isUnlimited} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className={`flex-1 accent-primary-500 ${isUnlimited ? 'opacity-40' : ''}`} />
                    <span className="w-16 text-right text-xs font-bold text-neutral-700 dark:text-neutral-300">{isUnlimited ? 'Ilimitado' : `${radiusKm}km`}</span>
                  </div>
                  <Button size="sm" variant={isUnlimited ? 'warning' : 'outline'} onClick={() => setIsUnlimited(!isUnlimited)}>
                    <Globe className="h-4 w-4" /> {isUnlimited ? 'Km Livre Ativo' : 'Ativar Km Livre'}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.slice(1).map((f) => <FreelancerCard key={f.id} freelancer={f} onHire={openDirectHireModal} onView={setViewing} distanceKm={distanceBetween(f.address, origin)} />)}
              </div>
              {filtered.length === 0 && (
                <div className="rounded-2xl border border-dashed border-neutral-300 py-12 text-center dark:border-neutral-700">
                  <p className="text-neutral-400">Nenhum profissional encontrado com esses filtros.</p>
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display font-bold text-neutral-900 dark:text-white">Minhas vagas</h3>
                  <Button size="sm" onClick={() => setJobForm({ open: true, editing: null })}><Plus className="h-4 w-4" /> Publicar</Button>
                </div>
                <div className="space-y-3">
                  {myJobs.length === 0 && <p className="py-6 text-center text-sm text-neutral-400">Nenhuma vaga publicada.</p>}
                  {myJobs.length > 0 && <JobCard job={myJobs[0]} variant="manage" />}
                </div>
              </div>

              <div className="w-full aspect-[6/5] overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
                <VipSquareWidget pageType="establishments" slot={2} />
              </div>

              {myJobs.slice(1).length > 0 && (
                <div className="space-y-3">
                  {myJobs.slice(1).map((j) => <JobCard key={j.id} job={j} variant="manage" />)}
                </div>
              )}

              <div className="w-full aspect-[3/1] overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
                <VipSquareWidget pageType="establishments" slot={3} />
              </div>
            </aside>

          </div>
        </div>
      </div>

      {/* MODAL DE CONTRATAÇÃO DIRETA COM DURAÇÃO DE HORAS */}
      {directHireTarget && (
        <Modal open={!!directHireTarget} onClose={() => setDirectHireTarget(null)} title={`Contratar ${directHireTarget.name}`} size="md">
          {(() => {
            const feeInfo = calculateDirectHireFee(
              directHireTarget.hourlyRate ?? 0,
              directHireTarget.dailyRate ?? 0,
              directHours
            );
            const feePercent = getIntermediationFeePercent(me, data.estVipPlans);
            const { fee, total } = calculateFees(feeInfo.freelancerFee, feePercent);

            return (
              <div className="space-y-5">
                <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-800/50">
                  <Avatar src={directHireTarget.photo} alt={directHireTarget.name} size={48} />
                  <div>
                    <p className="font-semibold text-sm text-neutral-900 dark:text-white">{directHireTarget.name}</p>
                    <p className="text-xs text-neutral-400">
                      Hora Padrão: {formatCurrency(directHireTarget.hourlyRate ?? 25)}/h · Diária (8h): {formatCurrency(directHireTarget.dailyRate ?? 180)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-neutral-600 dark:text-neutral-300">Duração do Turno de Trabalho:</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400 text-sm">{directHours} hora{directHours > 1 ? 's' : ''}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    value={directHours}
                    onChange={(e) => setDirectHours(Number(e.target.value))}
                    className="w-full accent-primary-500"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>1h (Mínimo)</span>
                    <span>8h (Diária)</span>
                    <span>24h</span>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 space-y-2 text-xs">
                  <p className="font-bold text-neutral-800 dark:text-neutral-200 border-b pb-2 dark:border-neutral-800 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-primary-500" /> Detalhamento de Custos
                  </p>
                  
                  {feeInfo.breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>{item.label}</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}

                  <div className="flex justify-between font-semibold text-neutral-900 dark:text-white pt-2 border-t dark:border-neutral-800">
                    <span>Subtotal do Profissional</span>
                    <span>{formatCurrency(feeInfo.freelancerFee)}</span>
                  </div>

                  <div className="flex justify-between text-neutral-500">
                    <span>Taxa da Plataforma ({feePercent}%)</span>
                    <span>{fee === 0 ? 'Isento (VIP)' : formatCurrency(fee)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-extrabold text-primary-600 dark:text-primary-400 pt-2 border-t border-dashed dark:border-neutral-800">
                    <span>Total no Escrow</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <Button fullWidth size="lg" onClick={confirmDirectHire}>
                  Confirmar Contratação ({formatCurrency(total)})
                </Button>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* 1. Modal de Vagas Publicadas */}
      <Modal open={showJobsModal} onClose={() => setShowJobsModal(false)} title={`Vagas Publicadas (${myJobs.length})`} size="md">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {myJobs.length === 0 ? (
            <p className="text-center text-sm text-neutral-400 py-8">Você não possui vagas publicadas.</p>
          ) : (
            myJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <div>
                  <p className="font-semibold text-sm text-neutral-900 dark:text-white">{job.title}</p>
                  <p className="text-xs text-neutral-400">{formatDateBR(job.date)} · {formatCurrency(job.value ?? 0)} · {job.applicants.length} candidato(s)</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => { pauseJob(job.id); notify('Status alterado'); }}>
                    {job.status === 'paused' ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-error-500" onClick={() => deleteJob(job.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* 2. Modal de Candidaturas — TRAVADO NO VALOR DA VAGA (job.value) */}
      <Modal open={showApplicantsModal} onClose={() => setShowApplicantsModal(false)} title="Candidaturas Recebidas" size="md">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {myJobs.flatMap(j => j.applicants).length === 0 ? (
            <p className="text-center text-sm text-neutral-400 py-8">Nenhuma candidatura recebida nas suas vagas ainda.</p>
          ) : (
            myJobs.map((job) => {
              const applicantsList = data?.users?.filter((u) => job.applicants?.includes(u.id)) || [];
              if (applicantsList.length === 0) return null;
              return (
                <div key={job.id} className="space-y-2">
                  <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Vaga: {job.title}</p>
                  {applicantsList.map((applicant) => {
                    const agreedValue = job.value > 0 ? job.value : (applicant.dailyRate || 0);

                    return (
                      <div key={applicant.id} className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-3">
                          <Avatar src={applicant.photo} alt={applicant.name} size={36} />
                          <div>
                            <p className="font-semibold text-sm text-neutral-900 dark:text-white">{applicant.name}</p>
                            <p className="text-xs text-neutral-400">Valor da Vaga: {formatCurrency(agreedValue)} · {job.hours}h</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => { 
                          requestHire(me.id, applicant.id, job.id, job.hours, agreedValue); 
                          notify('Solicitação de contratação enviada!'); 
                          setShowApplicantsModal(false); 
                        }}>
                          Contratar
                        </Button>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* 3. Modal de Contratações */}
      <Modal open={showContractsModal} onClose={() => setShowContractsModal(false)} title={`Contratações (${myContracts.length})`} size="md">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {myContracts.length === 0 ? (
            <p className="text-center text-sm text-neutral-400 py-8">Nenhuma contratação realizada até o momento.</p>
          ) : (
            myContracts.map((contract) => (
              <div key={contract.id} className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3">
                  <Avatar src={contract.freelancerPhoto} alt={contract.freelancerName} size={40} />
                  <div>
                    <p className="font-semibold text-sm text-neutral-900 dark:text-white">{contract.freelancerName}</p>
                    <p className="text-xs text-neutral-400">Total: {formatCurrency(contract.total)} · {contract.hours}h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={contractStatusTone(contract.status)}>{contractStatusLabel(contract.status)}</Badge>
                  <Button size="sm" variant="outline" onClick={() => { setEscrowContract(contract); setShowContractsModal(false); }}>
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* 4. Modal de Profissionais Próximos */}
      <Modal open={showNearbyModal} onClose={() => setShowNearbyModal(false)} title={`Profissionais Próximos (${filtered.length})`} size="md">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-neutral-400 py-8">Nenhum profissional encontrado no raio de distância atual.</p>
          ) : (
            filtered.map((freelancer) => (
              <div key={freelancer.id} className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3">
                  <Avatar src={freelancer.photo} alt={freelancer.name} size={40} />
                  <div>
                    <p className="font-semibold text-sm text-neutral-900 dark:text-white">{freelancer.name}</p>
                    <p className="text-xs text-neutral-400">{freelancer.address?.city || 'Pitangueiras'} · {formatCurrency(freelancer.dailyRate || 0)} / diária</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setViewing(freelancer); setShowNearbyModal(false); }}>
                    Ver Perfil
                  </Button>
                  <Button size="sm" onClick={() => { openDirectHireModal(freelancer); setShowNearbyModal(false); }}>
                    Contratar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {viewing && <FreelancerDetailModal freelancer={viewing} open={!!viewing} onClose={() => setViewing(null)} onHire={openDirectHireModal} />}
      {escrowContract && <EscrowFlowModal contract={escrowContract} open={!!escrowContract} onClose={() => setEscrowContract(null)} />}
      <JobFormModal open={jobForm.open} onClose={() => setJobForm({ open: false, editing: null })} editing={jobForm.editing} establishment={me} />
      <EstablishmentEditModal establishment={me} open={editEstablishment} onClose={() => setEditEstablishment(false)} />
    </div>
  );
}

function CompactStatCard({ icon: Icon, label, value, tone }: { icon: typeof Store; label: string; value: string; tone: 'primary' | 'secondary' | 'accent' | 'neutral' }) {
  const toneClass = {
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
    secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-400',
    accent: 'bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400',
    neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  }[tone];
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClass}`}><Icon className="h-4 w-4" /></div>
      <div className="min-w-0"><p className="font-display text-base font-extrabold leading-none text-neutral-900 dark:text-white">{value}</p><p className="mt-0.5 truncate text-[11px] text-neutral-400">{label}</p></div>
    </div>
  );
}
