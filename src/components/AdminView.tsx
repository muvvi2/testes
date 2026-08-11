import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users, Store, Briefcase, Percent, TrendingUp, Shield,
  RotateCcw, Trash2, Pencil, Megaphone, Wallet, Ban, CheckCircle2, Crown, AlertCircle,
  User as UserIcon, MapPin, Tags, Calendar, Save, Ticket, Terminal, RotateCcw as RefundIcon, Plus,
  Search, Star, UserPlus, Eye, EyeOff, UserCog, Camera, Lock, DollarSign, MoreVertical, Image as ImageIcon,
  Check, X
} from 'lucide-react';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Rating } from './ui/Rating';
import { Modal } from './ui/Modal';
import { Input, Select } from './ui/Field';
import { EscrowFlowModal } from './EscrowFlowModal';
import { formatCurrency, formatDate, formatDateTime, contractStatusLabel, getPlan, getEstPlan, maskDocumentDisplay } from '@/utils';
import type { Contract, User, Tier, EstTier, ContractStatus, VipPlan, EstVipPlan } from '@/types';

type Tab = 'overview' | 'freelancers' | 'establishments' | 'contracts' | 'jobs' | 'reviews' | 'coupons' | 'audit' | 'wallet' | 'vip' | 'admins';

const getPlanTierColor = (tier: string) => {
  if (tier === 'vip6') return 'text-rose-500';
  if (tier === 'vip5') return 'text-purple-500';
  if (tier === 'vip4') return 'text-amber-500';
  if (tier === 'vip3') return 'text-warning-500';
  if (tier === 'vip2') return 'text-secondary-500';
  if (tier === 'vip1') return 'text-primary-500';
  if (tier === 'trial') return 'text-accent-500';
  return 'text-neutral-400';
};

export function AdminView() {
  const { data, currentUser, isSuperAdmin, overrideContractStatus, forceRefund, resetData, banUser, unbanUser, deleteEntity, adminWalletTxs, coupons, addCoupon, toggleCoupon, deleteCoupon, auditLogs, deleteReview, broadcastNotification, deleteJob, updateJob, updateVipPlan, addVipPlan, removeVipPlan, updateEstVipPlan, addEstVipPlan, removeEstVipPlan, adminTab: tab, adminRemoveAdmin, adminUpdateAdmin, adminUpdateUser } = useApp();
  const { notify } = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const [escrowContract, setEscrowContract] = useState<Contract | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [vipTarget, setVipTarget] = useState<User | null>(null);
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [refundTarget, setRefundTarget] = useState<Contract | null>(null);
  
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponPct, setNewCouponPct] = useState('');
  const [newCouponExpiresAt, setNewCouponExpiresAt] = useState('');

  const [search, setSearch] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [walletTarget, setWalletTarget] = useState<User | null>(null);
  const [editAdminTarget, setEditAdminTarget] = useState<User | null>(null);

  const stats = useMemo(() => {
    const escrowTotal = data.contracts.filter((c) => c.status === 'paid' || c.status === 'checked_in').reduce((a, c) => a + c.total, 0);
    const feesCollected = data.walletTxs.filter((t) => t.type === 'platform_fee' && t.amount > 0).reduce((a, t) => a + t.amount, 0);
    const completedRepasses = data.contracts.filter((c) => c.status === 'completed').reduce((a, c) => a + c.freelancerFee, 0);
    const flSubRevenue = data.walletTxs.filter((t) => t.type === 'vip_charge').reduce((a, t) => a + Math.abs(t.amount), 0);
    const esSubRevenue = data.walletTxs.filter((t) => t.type === 'vip_charge_est').reduce((a, t) => a + Math.abs(t.amount), 0);
    const fee15 = data.contracts.filter((c) => c.platformFeePercentage === 15.0 && c.status === 'completed').reduce((a, c) => a + c.platformFee, 0);
    const fee7_5 = data.contracts.filter((c) => c.platformFeePercentage === 7.5 && c.status === 'completed').reduce((a, c) => a + c.platformFee, 0);
    const fee5 = data.contracts.filter((c) => c.platformFeePercentage === 5.0 && c.status === 'completed').reduce((a, c) => a + c.platformFee, 0);
    const fee0 = data.contracts.filter((c) => c.platformFeePercentage === 0 && c.status === 'completed').length;
    return { escrowTotal, feesCollected, completedRepasses, flSubRevenue, esSubRevenue, fee15, fee7_5, fee5, fee0 };
  }, [data]);

  const freelancers = data.users.filter((u) => u.accountType === 'freelancer' && !u.isAdmin);
  const establishments = data.users.filter((u) => u.accountType === 'establishment');
  const adminTxs = adminWalletTxs();

  const filteredFreelancers = useMemo(() => {
    if (!search.trim()) return freelancers;
    const q = search.toLowerCase();
    return freelancers.filter((f) => f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || (f.nickname ?? '').toLowerCase().includes(q) || f.address.city.toLowerCase().includes(q));
  }, [freelancers, search]);

  const filteredEstablishments = useMemo(() => {
    if (!search.trim()) return establishments;
    const q = search.toLowerCase();
    return establishments.filter((e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || (e.establishmentType ?? '').toLowerCase().includes(q) || e.address.city.toLowerCase().includes(q));
  }, [establishments, search]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 dark:bg-neutral-100"><Shield className="h-5 w-5 text-white dark:text-neutral-900" /></div>
        <div>
          <h1 className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">Painel do {isSuperAdmin ? 'Super Admin' : 'Administrador'}</h1>
          <p className="text-sm text-neutral-400">{isSuperAdmin ? 'Acesso total: taxas, escrow, usuários, carteiras e admins' : 'Gestão de usuários, vagas e avaliações'}</p>
        </div>
        {isSuperAdmin && <Badge tone="vip"><Crown className="h-3 w-3" /> Super Admin</Badge>}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FinancialCard icon={Wallet} label="Volume em Escrow" value={formatCurrency(stats.escrowTotal)} tone="warning" desc="Retido em garantia" />
            <FinancialCard icon={Percent} label="Taxas de Intermediação" value={formatCurrency(stats.feesCollected)} tone="primary" desc="15% + 7,5% + 5% combinadas" />
            <FinancialCard icon={CheckCircle2} label="Repasses Concluídos" value={formatCurrency(stats.completedRepasses)} tone="success" desc="Liberações para freelancers" />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-4 flex items-center gap-2 font-display font-bold text-neutral-900 dark:text-white"><TrendingUp className="h-5 w-5 text-primary-500" /> Receita Total por Fonte</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <RevenueRow icon={Crown} label="Assinaturas Freelancer" value={formatCurrency(stats.flSubRevenue)} tone="primary" />
              <RevenueRow icon={Store} label="Assinaturas Estabelecimento" value={formatCurrency(stats.esSubRevenue)} tone="secondary" />
              <RevenueRow icon={Percent} label="Taxas de Intermediação" value={formatCurrency(stats.feesCollected)} tone="success" />
            </div>
            <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Detalhamento por faixa de taxa</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FeeBreakdown label="Taxa 15,0% (Gratuito)" value={formatCurrency(stats.fee15)} tone="error" />
                <FeeBreakdown label="Taxa 7,5% (VIP 1)" value={formatCurrency(stats.fee7_5)} tone="warning" />
                <FeeBreakdown label="Taxa 5,0% (VIP 2)" value={formatCurrency(stats.fee5)} tone="primary" />
                <FeeBreakdown label="Isento 0% (VIP 3)" value={`${stats.fee0} contrato(s)`} tone="success" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <AdminStat icon={Users} label="Freelancers" value={String(freelancers.length)} tone="primary" />
            <AdminStat icon={Store} label="Estabelecimentos" value={String(establishments.length)} tone="secondary" />
            <AdminStat icon={Megaphone} label="Vagas ativas" value={String(data.jobs.filter((j) => j.status === 'active').length)} tone="accent" />
            <AdminStat icon={Briefcase} label="Contratos" value={String(data.contracts.length)} tone="neutral" />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-3 flex items-center gap-2 font-display font-bold text-neutral-900 dark:text-white"><AlertCircle className="h-5 w-5 text-warning-500" /> Escrows pendentes</h3>
            <div className="space-y-2">
              {data.contracts.filter((c) => c.status !== 'completed' && c.status !== 'cancelled').length === 0 && <p className="text-sm text-neutral-400">Nenhum escrow pendente.</p>}
              {data.contracts.filter((c) => c.status !== 'completed' && c.status !== 'cancelled').map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
                  <div className="flex items-center gap-2"><Avatar src={c.freelancerPhoto} alt={c.freelancerName} size={32} /><div><p className="text-sm font-semibold text-neutral-900 dark:text-white">{c.freelancerName}</p><p className="text-xs text-neutral-400">{c.establishmentName}</p></div></div>
                  <div className="flex items-center gap-3"><span className="font-display font-bold text-neutral-900 dark:text-white">{formatCurrency(c.total)}</span><Badge tone="warning">{contractStatusLabel(c.status)}</Badge><Button size="sm" variant="outline" onClick={() => setEscrowContract(c)}>Gerenciar</Button></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'freelancers' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail, apelido ou cidade..." className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
            </div>
            <Button onClick={() => setShowAddUser(true)}><UserPlus className="h-4 w-4" /> Novo</Button>
          </div>
          {filteredFreelancers.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">Nenhum freelancer encontrado.</p>}
          {filteredFreelancers.map((f) => (
            <div key={f.id} className={`rounded-2xl border bg-white p-4 dark:bg-neutral-900 ${f.banned ? 'border-error-200 opacity-60 dark:border-error-500/30' : 'border-neutral-200 dark:border-neutral-800'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={f.photo} alt={f.name} size={48} ring={f.vipTier && f.vipTier !== 'free' ? 'vip' : 'neutral'} vipBadge={f.vipTier === 'vip2' || f.vipTier === 'vip3'} />
                  <div>
                    <div className="flex items-center gap-2"><p className="font-semibold text-neutral-900 dark:text-white">{f.name}</p>{f.vipTier && f.vipTier !== 'free' && <Badge tone="vip"><Crown className="h-3 w-3" /> {getPlan(f.vipTier, data.vipPlans).label}</Badge>}{f.banned && <Badge tone="error">Banido</Badge>}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-400"><Rating value={f.rating ?? 0} /><span>{f.address.city}, {f.address.state}</span><span>{f.email}</span>{f.cpf && <span>CPF: {maskDocumentDisplay(f.cpf)}</span>}{f.vipExpiresAt && <span className="text-warning-500">VIP expira: {formatDate(f.vipExpiresAt)}</span>}</div>
                  </div>
                </div>
                <ActionMenu items={[
                  { icon: Pencil, label: 'Editar', onClick: () => setEditUser(f) },
                  { icon: Crown, label: 'Gerenciar VIP', onClick: () => setVipTarget(f) },
                  { icon: DollarSign, label: 'Ajustar carteira', onClick: () => setWalletTarget(f) },
                  ...(f.banned
                    ? [{ icon: CheckCircle2, label: 'Desbanir', onClick: () => { unbanUser(f.id); notify('Usuário desbanido'); } }]
                    : [{ icon: Ban, label: 'Banir', danger: true, onClick: () => setBanTarget(f) }]),
                  { icon: Trash2, label: 'Excluir', danger: true, onClick: () => { if (confirm(`Excluir ${f.name}? Esta ação não pode ser desfeita.`)) { deleteEntity(f.id); notify('Usuário excluído', 'warning'); } } },
                ]} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'establishments' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail, tipo ou cidade..." className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
            </div>
            <Button onClick={() => setShowAddUser(true)}><UserPlus className="h-4 w-4" /> Novo</Button>
          </div>
          {filteredEstablishments.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">Nenhum estabelecimento encontrado.</p>}
          {filteredEstablishments.map((e) => (
            <div key={e.id} className={`rounded-2xl border bg-white p-4 dark:bg-neutral-900 ${e.banned ? 'border-error-200 opacity-60 dark:border-error-500/30' : 'border-neutral-200 dark:border-neutral-800'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={e.photo} alt={e.name} size={48} ring={e.estVipTier && e.estVipTier !== 'free' ? 'vip' : 'neutral'} vipBadge={e.estVipTier === 'vip2' || e.estVipTier === 'vip3'} />
                  <div>
                    <div className="flex items-center gap-2"><p className="font-semibold text-neutral-900 dark:text-white">{e.name}</p>{e.estVipTier && <Badge tone={e.estVipTier === 'trial' ? 'neutral' : 'vip'}><Crown className="h-3 w-3" /> {getEstPlan(e.estVipTier, data.estVipPlans).label}</Badge>}{e.banned && <Badge tone="error">Banido</Badge>}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-400"><span>{e.establishmentType}</span><span>{e.address.city}, {e.address.state}</span><span>{e.email}</span>{e.cnpj && <span>CNPJ: {maskDocumentDisplay(e.cnpj)}</span>}{e.estVipExpiresAt && <span className="text-warning-500">VIP/Trial expira: {formatDate(e.estVipExpiresAt)}</span>}</div>
                  </div>
                </div>
                <ActionMenu items={[
                  { icon: Pencil, label: 'Editar', onClick: () => setEditUser(e) },
                  { icon: Crown, label: 'Gerenciar VIP / Plano', onClick: () => setVipTarget(e) },
                  { icon: DollarSign, label: 'Ajustar carteira', onClick: () => setWalletTarget(e) },
                  ...(e.banned
                    ? [{ icon: CheckCircle2, label: 'Desbanir', onClick: () => { unbanUser(e.id); notify('Desbanido'); } }]
                    : [{ icon: Ban, label: 'Banir', danger: true, onClick: () => setBanTarget(e) }]),
                  { icon: Trash2, label: 'Excluir', danger: true, onClick: () => { if (confirm(`Excluir ${e.name}? Esta ação não pode ser desfeita.`)) { deleteEntity(e.id); notify('Excluído', 'warning'); } } },
                ]} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'contracts' && (
        <div className="space-y-2">
          {data.contracts.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-3"><Avatar src={c.freelancerPhoto} alt={c.freelancerName} size={40} /><div><p className="font-semibold text-neutral-900 dark:text-white">{c.freelancerName} ↔ {c.establishmentName}</p><p className="text-xs text-neutral-400">{formatDate(c.date)} · {formatCurrency(c.total)} · {c.platformFeePercentage}% taxa</p></div></div>
              <div className="flex items-center gap-2">
                <Badge tone={c.status === 'completed' ? 'success' : c.status === 'cancelled' ? 'error' : 'warning'}>{contractStatusLabel(c.status)}</Badge>
                {isSuperAdmin ? <>
                  <Select value={c.status} onChange={(e) => { overrideContractStatus(c.id, e.target.value as ContractStatus); notify('Status sobrescrito'); }} className="w-40 py-1.5 text-xs">
                    {(['requested', 'confirmed', 'paid', 'checked_in', 'completed', 'cancelled'] as ContractStatus[]).map((s) => <option key={s} value={s}>{contractStatusLabel(s)}</option>)}
                  </Select>
                  {(c.status === 'paid' || c.status === 'checked_in') && <Button size="sm" variant="danger" onClick={() => setRefundTarget(c)}><RefundIcon className="h-3.5 w-3.5" /> Forçar Estorno</Button>}
                </> : <Lock className="h-4 w-4 text-neutral-400" />}
                <Button size="sm" variant="outline" onClick={() => setEscrowContract(c)}>Ver</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'jobs' && (
        <div className="space-y-2">
          {data.jobs.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">Nenhuma vaga cadastrada.</p>}
          {data.jobs.map((j) => (
            <div key={j.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-3">
                <Avatar src={j.establishmentPhoto} alt={j.establishmentName} size={40} />
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{j.title}</p>
                  <p className="text-xs text-neutral-400">{j.establishmentName} · {j.city}/{j.state} · {formatDate(j.date)} · {formatCurrency(j.value)} · {j.applicants.length} candidato(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={j.status === 'active' ? 'success' : j.status === 'paused' ? 'warning' : 'neutral'}>{j.status === 'active' ? 'Ativa' : j.status === 'paused' ? 'Pausada' : 'Fechada'}</Badge>
                {j.status === 'active' ? <Button size="sm" variant="outline" onClick={() => { updateJob(j.id, { status: 'paused' }); notify('Vaga pausada'); }}>Pausar</Button> : <Button size="sm" variant="outline" onClick={() => { updateJob(j.id, { status: 'active' }); notify('Vaga reativada'); }}>Reativar</Button>}
                <Button size="sm" variant="ghost" className="text-error-500" onClick={() => { if (confirm('Excluir esta vaga?')) { deleteJob(j.id); notify('Vaga excluída', 'warning'); } }}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-2">
          {data.reviews.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">Nenhuma avaliação cadastrada.</p>}
          {data.reviews.map((r) => {
            const fromUser = data.users.find((u) => u.id === r.fromId);
            const toUser = data.users.find((u) => u.id === r.toId);
            return (
              <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning-100 text-warning-600 dark:bg-warning-500/15"><Star className="h-5 w-5" /></div>
                    <div>
                      <div className="flex items-center gap-2"><Rating value={r.rating} /><span className="text-xs text-neutral-400">{formatDate(r.date)}</span></div>
                      <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">{r.comment}</p>
                      <p className="mt-1 text-xs text-neutral-400">De: {fromUser?.name ?? r.fromName} → Para: {toUser?.name ?? r.toId}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-error-500" onClick={() => { if (confirm('Remover esta avaliação?')) { deleteReview(r.id); notify('Avaliação removida', 'warning'); } }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'coupons' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-4 flex items-center gap-2 font-display font-bold text-neutral-900 dark:text-white"><Ticket className="h-5 w-5 text-primary-500" /> Gerenciar Cupons de Desconto</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Código do cupom" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())} placeholder="PROMO25" />
              <Input label="Desconto (%)" type="number" value={newCouponPct} onChange={(e) => setNewCouponPct(e.target.value)} placeholder="25" />
              <Input label="Validade (opcional)" type="date" value={newCouponExpiresAt} onChange={(e) => setNewCouponExpiresAt(e.target.value)} />
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={() => { 
                if (!newCouponCode.trim() || !newCouponPct) { notify('Preencha código e desconto', 'warning'); return; } 
                addCoupon({ 
                  code: newCouponCode.trim(), 
                  discountPercentage: Math.min(100, Math.max(1, Number(newCouponPct) || 0)), 
                  expiresAt: newCouponExpiresAt ? new Date(newCouponExpiresAt).toISOString() : undefined,
                  isActive: true 
                }); 
                setNewCouponCode(''); 
                setNewCouponPct(''); 
                setNewCouponExpiresAt('');
                notify('Cupom criado com sucesso!'); 
              }}><Plus className="h-4 w-4" /> Criar Cupom</Button>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {coupons.length === 0 && <p className="p-6 text-center text-neutral-400">Nenhum cupom criado.</p>}
              {coupons.map((cp) => (
                <div key={cp.id} className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-500/15"><Ticket className="h-5 w-5" /></div>
                    <div>
                      <p className="font-display font-bold text-neutral-900 dark:text-white">{cp.code}</p>
                      <p className="text-xs text-neutral-400">
                        {cp.discountPercentage}% de desconto · Usos totais: {cp.usedBy?.length ?? 0} (1 por usuário)
                        {cp.expiresAt ? ` · Expira em: ${formatDate(cp.expiresAt)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={cp.isActive ? 'success' : 'neutral'}>{cp.isActive ? 'Ativo' : 'Inativo'}</Badge>
                    <Button size="sm" variant="outline" onClick={() => { toggleCoupon(cp.id); notify(cp.isActive ? 'Cupom desativado' : 'Cupom ativado'); }}>{cp.isActive ? 'Desativar' : 'Ativar'}</Button>
                    <Button size="sm" variant="ghost" className="text-error-500" onClick={() => { deleteCoupon(cp.id); notify('Cupom removido', 'warning'); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-900 p-0 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-neutral-700 px-4 py-3"><Terminal className="h-4 w-4 text-success-400" /><span className="font-mono text-xs text-success-400">admin@freelaagora:~$ audit-log --tail</span></div>
          <div className="max-h-[60vh] overflow-y-auto p-4 font-mono text-xs leading-relaxed">
            {auditLogs.length === 0 && <p className="text-neutral-500">Nenhum registro de auditoria.</p>}
            {auditLogs.map((log) => (
              <div key={log.id} className="py-1 text-neutral-300"><span className="text-neutral-500">[{formatDateTime(log.createdAt)}]</span> <span className="text-success-400">ADMIN</span> <span className="text-neutral-400">→</span> {log.action}{log.targetUserId && <span className="text-neutral-500"> (alvo: {log.targetUserId})</span>}</div>
            ))}
          </div>
        </div>
      )}

      {tab === 'wallet' && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {adminTxs.length === 0 && <p className="p-6 text-center text-neutral-400">Sem transações.</p>}
            {adminTxs.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 bg-white p-4 dark:bg-neutral-900">
                <div><p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{t.description}</p><p className="text-xs text-neutral-400">{formatDate(t.date)}</p></div>
                <span className={`font-display font-bold ${t.amount > 0 ? 'text-success-600 dark:text-success-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{t.amount > 0 ? '+' : ''}{formatCurrency(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'vip' && (
        <VipPlansTab
          vipPlans={data.vipPlans}
          estVipPlans={data.estVipPlans}
          onUpdateVipPlan={updateVipPlan}
          onAddVipPlan={addVipPlan}
          onRemoveVipPlan={removeVipPlan}
          onUpdateEstVipPlan={updateEstVipPlan}
          onAddEstVipPlan={addEstVipPlan}
          onRemoveEstVipPlan={removeEstVipPlan}
        />
      )}

      {tab === 'admins' && isSuperAdmin && (
        <AdminsTab
          admins={data.users.filter((u) => u.isAdmin)}
          currentAdminId={currentUser!.id}
          onRemove={(id) => {
            adminRemoveAdmin(id);
            notify('Administrador removido com sucesso!', 'warning');
          }}
          onEdit={(adminUser) => setEditAdminTarget(adminUser)}
          onAdd={() => setShowAddAdmin(true)}
        />
      )}

      {escrowContract && <EscrowFlowModal contract={escrowContract} open={!!escrowContract} onClose={() => setEscrowContract(null)} />}
      {editUser && <AdminEditUserModal user={editUser} open={!!editUser} onClose={() => setEditUser(null)} />}
      {editAdminTarget && (
        <AdminEditAdminModal
          adminUser={editAdminTarget}
          open={!!editAdminTarget}
          onClose={() => setEditAdminTarget(null)}
          onSave={(id, patch) => {
            adminUpdateUser(id, patch);
            notify('Dados do administrador atualizados com sucesso!');
          }}
        />
      )}
      {vipTarget && <AdminVipModal user={vipTarget} open={!!vipTarget} onClose={() => setVipTarget(null)} />}
      {showAddUser && <AdminCreateUserModal open={showAddUser} onClose={() => setShowAddUser(false)} />}
      {showBroadcast && <AdminBroadcastModal open={showBroadcast} onClose={() => setShowBroadcast(false)} />}
      {showAddAdmin && <AdminCreateAdminModal open={showAddAdmin} onClose={() => setShowAddAdmin(false)} />}
      {walletTarget && <AdminWalletModal user={walletTarget} open={!!walletTarget} onClose={() => setWalletTarget(null)} />}
      {banTarget && (
        <Modal open={!!banTarget} onClose={() => setBanTarget(null)} title="Banir usuário" size="sm"
          footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setBanTarget(null)}>Cancelar</Button><Button variant="danger" fullWidth onClick={() => { banUser(banTarget.id); setBanTarget(null); notify('Usuário banido', 'warning'); }}><Ban className="h-4 w-4" /> Banir</Button></div>}>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Banir <strong>{banTarget.name}</strong>? O usuário não poderá acessar a plataforma.</p>
        </Modal>
      )}
      {refundTarget && (
        <Modal open={!!refundTarget} onClose={() => setRefundTarget(null)} title="Forçar Estorno de Custódia" size="sm"
          footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setRefundTarget(null)}>Cancelar</Button><Button variant="danger" fullWidth onClick={() => { forceRefund(refundTarget.id); setRefundTarget(null); notify(`Estorno de ${formatCurrency(refundTarget.total)} processado`, 'warning'); }}><RefundIcon className="h-3.5 w-3.5" /> Forçar Estorno de Custódia (Reembolso Direto)</Button></div>}>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Confirmar reembolso direto de <strong>{formatCurrency(refundTarget.total)}</strong> para <strong>{refundTarget.establishmentName}</strong>? O contrato será cancelado e os valores devolvidos à carteira do estabelecimento.</p>
        </Modal>
      )}
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Restaurar dados" size="sm"
        footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setConfirmReset(false)}>Cancelar</Button><Button variant="danger" fullWidth onClick={() => { resetData(); setConfirmReset(false); notify('Dados restaurados', 'info'); }}><RotateCcw className="h-4 w-4" /> Resetar</Button></div>}>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Todas as alterações serão perdidas e os dados voltarão ao estado inicial.</p>
      </Modal>
    </div>
  );
}

function AdminEditUserModal({ user, open, onClose }: { user: User; open: boolean; onClose: () => void }) {
  const { adminUpdateUser } = useApp();
  const { notify } = useToast();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(user.whatsapp ?? '');
  const [city, setCity] = useState(user.address?.city ?? '');
  const [state, setState] = useState(user.address?.state ?? 'SP');

  const save = () => {
    if (!name.trim() || !email.trim()) { notify('Nome e e-mail são obrigatórios', 'warning'); return; }
    adminUpdateUser(user.id, {
      name: name.trim(),
      email: email.trim(),
      phone,
      whatsapp: whatsapp || phone,
      address: { ...user.address, city, state }
    });
    notify('Usuário atualizado com sucesso!');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Editar — ${user.name}`} size="md"
      footer={<div className="flex gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save}><Save className="h-4 w-4" /> Salvar</Button></div>}>
      <div className="space-y-4">
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
          <Select label="Estado" value={state} onChange={(e) => setState(e.target.value)}>
            {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>
    </Modal>
  );
}

function AdminEditAdminModal({ adminUser, open, onClose, onSave }: { adminUser: User; open: boolean; onClose: () => void; onSave: (id: string, patch: Partial<User>) => void }) {
  const { notify } = useToast();
  const [name, setName] = useState(adminUser.name);
  const [email, setEmail] = useState(adminUser.email);
  const [password, setPassword] = useState(adminUser.password);
  const [adminRole, setAdminRole] = useState<'super' | 'regular'>(adminUser.adminRole ?? 'regular');

  const save = () => {
    if (!name.trim() || !email.trim()) { notify('Nome e e-mail obrigatórios', 'warning'); return; }
    onSave(adminUser.id, { name: name.trim(), email: email.trim(), password, adminRole });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar Administrador" size="sm"
      footer={<div className="flex gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save}><Save className="h-4 w-4" /> Salvar</Button></div>}>
      <div className="space-y-4">
        <div className="flex gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-700 dark:bg-neutral-800">
          {(['regular', 'super'] as const).map((r) => (
            <button key={r} onClick={() => setAdminRole(r)} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${adminRole === r ? 'bg-white text-primary-600 shadow-sm dark:bg-neutral-700 dark:text-primary-400' : 'text-neutral-500'}`}>{r === 'super' ? 'Super Admin' : 'Moderador'}</button>
          ))}
        </div>
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
    </Modal>
  );
}

export function AdminProfileModal({ open, onClose, admin, onSave }: { open: boolean; onClose: () => void; admin: User; onSave: (id: string, patch: Partial<User>) => void }) {
  const { notify } = useToast();
  const [email, setEmail] = useState(admin.email);
  const [password, setPassword] = useState(admin.password);
  const [photo, setPhoto] = useState(admin.photo ?? '');
  const [showPassword, setShowPassword] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { notify('Imagem muito grande (máx 5MB)', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 256;
        let { width, height } = img;
        if (width > height && width > max) { height = Math.round(height * max / width); width = max; }
        else if (height > max) { width = Math.round(width * max / height); height = max; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setPhoto(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!email.trim() || !password.trim()) { notify('E-mail e senha são obrigatórios', 'warning'); return; }
    onSave(admin.id, { email: email.trim(), password, photo: photo.trim() || undefined });
    onClose();
    notify('Perfil do administrador atualizado');
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar perfil do Admin" size="sm"
      footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button><Button fullWidth onClick={save}><Save className="h-4 w-4" /> Salvar</Button></div>}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
          <Avatar src={photo || admin.photo} alt={admin.name} size={48} ring="vip" />
          <div><p className="font-semibold text-neutral-900 dark:text-white">{admin.name}</p><p className="text-xs text-neutral-400">Conta administrador</p></div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-500">Foto do perfil</label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar src={photo || admin.photo} alt="Preview" size={56} />
              <label htmlFor="admin-photo-upload" className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary-500 text-white shadow-lg transition hover:bg-primary-600">
                <Camera className="h-3 w-3" />
              </label>
              <input id="admin-photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>
            <div className="flex-1">
              <Input label="" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="URL da foto ou faça upload" />
            </div>
          </div>
        </div>
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-500">Senha</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 pr-10 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AdminVipModal({ user, open, onClose }: { user: User; open: boolean; onClose: () => void }) {
  const { adminUpdateUser } = useApp();
  const { notify } = useToast();
  const isEst = user.accountType === 'establishment';
  const [tier, setTier] = useState<any>(isEst ? user.estVipTier ?? 'free' : user.vipTier ?? 'free');

  const save = () => {
    const patch = isEst ? { estVipTier: tier } : { vipTier: tier };
    adminUpdateUser(user.id, patch);
    notify('Plano VIP / Trial atualizado com sucesso!');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Gerenciar Plano — ${user.name}`} size="sm"
      footer={<div className="flex gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save}><Crown className="h-4 w-4" /> Salvar</Button></div>}>
      <div className="space-y-4">
        <Select label="Selecionar Plano" value={tier} onChange={(e) => setTier(e.target.value)}>
          {isEst ? [
            <option key="free" value="free">Gratuito</option>,
            <option key="trial" value="trial">Teste Gratuito (15 dias)</option>,
            <option key="vip1" value="vip1">VIP 1</option>,
            <option key="vip2" value="vip2">VIP 2</option>,
            <option key="vip3" value="vip3">VIP 3</option>,
            <option key="vip4" value="vip4">VIP 4 (Com Anúncios)</option>,
            <option key="vip5" value="vip5">VIP 5 (Com Anúncios)</option>,
            <option key="vip6" value="vip6">VIP 6 (Com Anúncios)</option>,
          ] : [
            <option key="free" value="free">Free</option>,
            <option key="vip1" value="vip1">VIP 1</option>,
            <option key="vip2" value="vip2">VIP 2</option>,
            <option key="vip3" value="vip3">VIP 3</option>,
            <option key="vip4" value="vip4">VIP 4</option>,
          ]}
        </Select>
      </div>
    </Modal>
  );
}

function FinancialCard({ icon: Icon, label, value, tone, desc }: { icon: typeof Wallet; label: string; value: string; tone: 'warning' | 'primary' | 'success'; desc: string }) {
  const toneClass = { warning: 'from-warning-500 to-warning-700', primary: 'from-primary-500 to-primary-700', success: 'from-success-500 to-success-700' }[tone];
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${toneClass} p-5 text-white`}>
      <Icon className="h-7 w-7 opacity-80" />
      <p className="mt-3 font-display text-2xl font-extrabold">{value}</p>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-white/70">{desc}</p>
    </div>
  );
}

function RevenueRow({ icon: Icon, label, value, tone }: { icon: typeof Crown; label: string; value: string; tone: 'primary' | 'secondary' | 'success' }) {
  const toneClass = { primary: 'bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400', secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-400', success: 'bg-success-100 text-success-600 dark:bg-success-500/15 dark:text-success-400' }[tone];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-100 p-3 dark:border-neutral-800">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClass}`}><Icon className="h-4 w-4" /></div>
      <div className="min-w-0"><p className="text-xs text-neutral-400">{label}</p><p className="font-display text-base font-bold text-neutral-900 dark:text-white">{value}</p></div>
    </div>
  );
}

function FeeBreakdown({ label, value, tone }: { label: string; value: string; tone: 'error' | 'warning' | 'primary' | 'success' }) {
  const toneClass = { error: 'text-error-600 dark:text-error-400', warning: 'text-warning-600 dark:text-warning-400', primary: 'text-primary-600 dark:text-primary-400', success: 'text-success-600 dark:text-success-400' }[tone];
  return (
    <div className="rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className={`font-display text-lg font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function AdminStat({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: string; tone: 'primary' | 'secondary' | 'accent' | 'neutral' }) {
  const toneClass = { primary: 'bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400', secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-400', accent: 'bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400', neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300' }[tone];
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}><Icon className="h-5 w-5" /></div>
      <p className="mt-3 font-display text-2xl font-extrabold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-400">{label}</p>
    </div>
  );
}

function AdminCreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { adminCreateUser } = useApp();
  const { notify } = useToast();
  const [accountType, setAccountType] = useState<AccountType>('freelancer');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [photo, setPhoto] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [establishmentType, setEstablishmentType] = useState('');
  const [vipTier, setVipTier] = useState<Tier>('free');
  const [showPassword, setShowPassword] = useState(false);

  const reset = () => {
    setAccountType('freelancer'); setName(''); setNickname(''); setEmail(''); setPassword('123456'); setPhone(''); setWhatsapp(''); setPhoto(''); setCep(''); setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState('SP'); setEstablishmentType(''); setVipTier('free');
  };

  const create = () => {
    if (!name.trim() || !email.trim() || !password.trim()) { notify('Preencha nome, e-mail e senha', 'warning'); return; }
    if (!city.trim() || !street.trim()) { notify('Preencha cidade e logradouro', 'warning'); return; }
    if (accountType === 'establishment' && !establishmentType.trim()) { notify('Defina o tipo do estabelecimento', 'warning'); return; }
    const base = {
      accountType, name: name.trim(), nickname: nickname.trim() || undefined, email: email.trim(), password, phone, whatsapp: whatsapp || phone, photo: photo.trim() || `https://images.pexels.com/photos/804009/pexels-photo-804009.jpeg?auto=compress&cs=tinysrgb&h=650&w=940`,
      address: { cep, street, number, neighborhood, city, state },
    };
    const extra = accountType === 'freelancer' ? { vipTier } : { establishmentType };
    const result = adminCreateUser({ ...base, ...extra } as any);
    if (result.ok) { notify(`${accountType === 'freelancer' ? 'Freelancer' : 'Estabelecimento'} criado com sucesso!`); reset(); onClose(); }
    else notify(result.error ?? 'Erro ao criar usuário', 'warning');
  };

  return (
    <Modal open={open} onClose={onClose} title="Adicionar novo usuário (Admin)" size="lg"
      footer={<div className="flex gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={create}><UserPlus className="h-4 w-4" /> Criar usuário</Button></div>}>
      <div className="space-y-4">
        <div className="flex gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-700 dark:bg-neutral-800">
          {(['freelancer', 'establishment'] as AccountType[]).map((t) => (
            <button key={t} onClick={() => setAccountType(t)} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${accountType === t ? 'bg-white text-primary-600 shadow-sm dark:bg-neutral-700 dark:text-primary-400' : 'text-neutral-500'}`}>{t === 'freelancer' ? 'Freelancer' : 'Estabelecimento'}</button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome / Razão Social" value={name} onChange={(e) => setName(e.target.value)} />
          {accountType === 'freelancer' && <Input label="Apelido (opcional)" value={nickname} onChange={(e) => setNickname(e.target.value)} />}
          <div className="sm:col-span-2"><Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-500">Senha de acesso</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 pr-10 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
          {accountType === 'establishment' && <Input label="Tipo do estabelecimento" value={establishmentType} onChange={(e) => setEstablishmentType(e.target.value)} placeholder="Bar & Restaurante" />}
          <div className="sm:col-span-2"><Input label="URL da foto (opcional)" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://..." /></div>
        </div>

        <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Endereço</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="CEP" value={cep} onChange={(e) => setCep(maskCEP(e.target.value))} />
            <div className="sm:col-span-2"><Input label="Logradouro" value={street} onChange={(e) => setStreet(e.target.value)} /></div>
            <Input label="Número" value={number} onChange={(e) => setNumber(e.target.value)} />
            <Input label="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
            <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
            <Select label="Estado" value={state} onChange={(e) => setState(e.target.value)}>{['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((s) => <option key={s} value={s}>{s}</option>)}</Select>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ActionMenu({ items }: { items: { icon: typeof Pencil; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        aria-label="Ações"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          {items.map((item, i) => (
            <button
              key={i}
              disabled={item.disabled}
              onClick={() => { if (item.disabled) return; item.onClick(); setOpen(false); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-neutral-50 dark:hover:bg-neutral-700/50 ${item.danger ? 'text-error-500' : 'text-neutral-700 dark:text-neutral-200'} ${item.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VipPlansTab({ vipPlans, estVipPlans, onUpdateVipPlan, onAddVipPlan, onRemoveVipPlan, onUpdateEstVipPlan, onAddEstVipPlan, onRemoveEstVipPlan }: {
  vipPlans: VipPlan[];
  estVipPlans: EstVipPlan[];
  onUpdateVipPlan: (tier: Tier, patch: Partial<VipPlan>) => void;
  onAddVipPlan: (plan: VipPlan) => void;
  onRemoveVipPlan: (tier: Tier) => void;
  onUpdateEstVipPlan: (tier: EstTier, patch: Partial<EstVipPlan>) => void;
  onAddEstVipPlan: (plan: EstVipPlan) => void;
  onRemoveEstVipPlan: (tier: EstTier) => void;
}) {
  const { notify } = useToast();
  const [section, setSection] = useState<'freelancer' | 'establishment'>('freelancer');

  const addFreelancerPlan = () => {
    const tierNum = vipPlans.length;
    const newTier = `vip${tierNum}` as Tier;
    if (vipPlans.some((p) => p.tier === newTier)) { notify('Já existe um plano com esse nível', 'warning'); return; }
    onAddVipPlan({ tier: newTier, label: `VIP ${tierNum}`, prices: { monthly: 49.9, semestral: 249.9, annual: 449.9 }, maxCategories: 5, features: ['Novo plano'] });
    notify('Plano adicionado');
  };

  const addEstPlan = () => {
    const tierNum = estVipPlans.length;
    const newTier = `vip${tierNum}` as EstTier;
    if (estVipPlans.some((p) => p.tier === newTier)) { notify('Já existe um plano com esse nível', 'warning'); return; }
    onAddEstVipPlan({ tier: newTier, label: `VIP ${tierNum}`, prices: { monthly: 99.9, semestral: 499.9, annual: 899.9 }, intermediationFee: 5, maxActiveJobs: 5, allowAds: false, maxAds: 0, homeAdPrice: 30, freelancerAdPrice: 20, establishmentAdPrice: 20, features: ['Novo plano'] });
    notify('Plano adicionado');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-700 dark:bg-neutral-800">
        {(['freelancer', 'establishment'] as const).map((s) => (
          <button key={s} onClick={() => setSection(s)} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${section === s ? 'bg-white text-primary-600 shadow-sm dark:bg-neutral-700 dark:text-primary-400' : 'text-neutral-500'}`}>
            {s === 'freelancer' ? 'Planos Freelancer' : 'Planos Estabelecimento'}
          </button>
        ))}
      </div>

      {section === 'freelancer' && (
        <div className="space-y-3">
          {vipPlans.map((plan) => (
            <VipPlanEditor key={plan.tier} plan={plan} isEst={false} onUpdate={(patch) => onUpdateVipPlan(plan.tier, patch as Partial<VipPlan>)} onRemove={() => onRemoveVipPlan(plan.tier)} />
          ))}
          <Button variant="outline" fullWidth onClick={addFreelancerPlan}><Plus className="h-4 w-4" /> Adicionar novo plano freelancer</Button>
        </div>
      )}

      {section === 'establishment' && (
        <div className="space-y-3">
          {estVipPlans.map((plan) => (
            <VipPlanEditor key={plan.tier} plan={plan} isEst={true} onUpdate={(patch) => onUpdateEstVipPlan(plan.tier, patch as Partial<EstVipPlan>)} onRemove={() => onRemoveEstVipPlan(plan.tier)} />
          ))}
          <Button variant="outline" fullWidth onClick={addEstPlan}><Plus className="h-4 w-4" /> Adicionar novo plano estabelecimento</Button>
        </div>
      )}

      <p className="text-xs text-neutral-400">Alterações nos preços, taxas e limites são aplicadas imediatamente e sincronizadas com o Supabase.</p>
    </div>
  );
}

function VipPlanEditor({ plan, onUpdate, onRemove, isEst }: {
  plan: VipPlan | EstVipPlan;
  onUpdate: (patch: Partial<VipPlan> | Partial<EstVipPlan>) => void;
  onRemove: () => void;
  isEst: boolean;
}) {
  const { notify } = useToast();
  const [expanded, setExpanded] = useState(false);
  const canDelete = plan.tier !== 'free' && plan.tier !== 'trial';
  const estPlan = isEst ? (plan as EstVipPlan) : null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-left">
          <Crown className={`h-4 w-4 ${getPlanTierColor(plan.tier)}`} />
          <span className="font-semibold text-neutral-900 dark:text-white">{plan.label}</span>
          <Badge tone={plan.tier === 'free' ? 'neutral' : 'vip'}>{plan.tier.toUpperCase()}</Badge>
          {isEst && estPlan?.allowAds && <Badge tone="success"><ImageIcon className="h-3 w-3" /> Anúncios Ativos ({estPlan.maxAds ?? 0})</Badge>}
        </button>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}><Pencil className="h-3.5 w-3.5" /></Button>
          {canDelete && <Button size="sm" variant="ghost" className="text-error-500" onClick={() => { if (confirm(`Remover o plano ${plan.label}? Usuários neste plano voltarão ao Gratuito.`)) { onRemove(); notify('Plano removido', 'warning'); } }}><Trash2 className="h-3.5 w-3.5" /></Button>}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nome do plano" value={plan.label} onChange={(e) => onUpdate({ label: e.target.value })} />
            {!isEst && <Input label="Máx. categorias (999 = ilimitado)" type="number" value={String((plan as VipPlan).maxCategories)} onChange={(e) => onUpdate({ maxCategories: Number(e.target.value) || 0 } as Partial<VipPlan>)} />}
            {isEst && (
              <>
                <Input label="Taxa de intermediação (%)" type="number" step="0.5" value={String((plan as EstVipPlan).intermediationFee)} onChange={(e) => onUpdate({ intermediationFee: Number(e.target.value) || 0 } as Partial<EstVipPlan>)} />
                <Input label="Máx. vagas semanais (999 = ilimitado)" type="number" value={String((plan as EstVipPlan).maxActiveJobs ?? 2)} onChange={(e) => onUpdate({ maxActiveJobs: Number(e.target.value) || 0 } as Partial<EstVipPlan>)} />
              </>
            )}
          </div>

          {isEst && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 dark:bg-amber-500/10 space-y-3">
              <label className="flex cursor-pointer items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-amber-500" /> Permitir Anúncios / Propagandas (Páginas Freela e Estabelecimentos)
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Ao ativar, os estabelecimentos deste plano poderão cadastrar imagens de propaganda rotativas (600x900px) nas páginas de freelancers e estabelecimentos.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={estPlan?.allowAds ?? false}
                  onChange={(e) => onUpdate({ allowAds: e.target.checked } as Partial<EstVipPlan>)}
                  className="h-5 w-5 rounded border-neutral-300 text-amber-500 focus:ring-amber-400"
                />
              </label>

              <div className="pt-2 border-t border-amber-500/20 space-y-3">
                <Input
                  label="Quantidade máxima de anúncios permitidos por slot"
                  type="number"
                  value={String(estPlan?.maxAds ?? 0)}
                  onChange={(e) => onUpdate({ maxAds: Number(e.target.value) || 0 } as Partial<EstVipPlan>)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    label="Preço: Topo da Página (R$)"
                    type="number"
                    value={String((estPlan as any)?.priceSlot1 ?? 30)}
                    onChange={(e) => onUpdate({ priceSlot1: Number(e.target.value) || 0 } as Partial<EstVipPlan>)}
                  />
                  <Input
                    label="Preço: Centro do Feed (R$)"
                    type="number"
                    value={String((estPlan as any)?.priceSlot2 ?? 25)}
                    onChange={(e) => onUpdate({ priceSlot2: Number(e.target.value) || 0 } as Partial<EstVipPlan>)}
                  />
                  <Input
                    label="Preço: Rodapé da Página (R$)"
                    type="number"
                    value={String((estPlan as any)?.priceSlot3 ?? 20)}
                    onChange={(e) => onUpdate({ priceSlot3: Number(e.target.value) || 0 } as Partial<EstVipPlan>)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Preço mensal (R$)" type="number" value={String(plan.prices.monthly)} onChange={(e) => onUpdate({ prices: { ...plan.prices, monthly: Number(e.target.value) || 0 } })} />
            <Input label="Preço semestral (R$)" type="number" value={String(plan.prices.semestral)} onChange={(e) => onUpdate({ prices: { ...plan.prices, semestral: Number(e.target.value) || 0 } })} />
            <Input label="Preço annual (R$)" type="number" value={String(plan.prices.annual)} onChange={(e) => onUpdate({ prices: { ...plan.prices, annual: Number(e.target.value) || 0 } })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-500">Benefícios (um por linha)</label>
            <textarea value={plan.features.join('\n')} onChange={(e) => onUpdate({ features: e.target.value.split('\n').filter(Boolean) })} rows={4} className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
          </div>
        </div>
      )}
    </div>
  );
}

function AdminsTab({ admins, currentAdminId, onRemove, onEdit, onAdd }: { admins: User[]; currentAdminId: string; onRemove: (id: string) => void; onEdit: (adminUser: User) => void; onAdd: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">{admins.length} administrador(es) ativo(s)</p>
        <Button size="sm" onClick={onAdd}><UserPlus className="h-4 w-4" /> Novo Admin</Button>
      </div>
      {admins.map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <Avatar src={a.photo} alt={a.name} size={44} ring={a.adminRole === 'super' ? 'vip' : 'neutral'} />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-neutral-900 dark:text-white">{a.name}</p>
                {a.adminRole === 'super' ? <Badge tone="vip"><Crown className="h-3 w-3" /> Super Admin</Badge> : <Badge tone="primary">Moderador</Badge>}
              </div>
              <p className="text-xs text-neutral-400">{a.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(a)}><Pencil className="h-3.5 w-3.5" /> Editar</Button>
            {a.id !== currentAdminId && (
              <Button size="sm" variant="ghost" className="text-error-500" onClick={() => { if (confirm(`Remover ${a.name} como administrador?`)) { onRemove(a.id); } }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminWalletModal({ user, open, onClose }: { user: User; open: boolean; onClose: () => void }) {
  const { adjustWallet } = useApp();
  const { notify } = useToast();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const apply = (dir: 'add' | 'sub') => {
    const amt = Number(amount) || 0;
    if (amt <= 0) { notify('Digite um valor válido', 'warning'); return; }
    adjustWallet(user.id, dir === 'add' ? amt : -amt, description.trim() || `Ajuste manual pelo Admin`);
    setAmount(''); setDescription('');
    notify(`Saldo ${dir === 'add' ? 'adicionado' : 'debitado'} pelo Admin`);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Ajustar carteira — ${user.name}`} size="sm"
      footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button><Button variant="primary" fullWidth onClick={() => apply('add')}><CheckCircle2 className="h-4 w-4" /> Adicionar</Button><Button variant="danger" fullWidth onClick={() => apply('sub')}><RotateCcw className="h-4 w-4" /> Debitar</Button></div>}>
      <div className="space-y-4">
        <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
          <p className="text-xs text-neutral-400">Saldo atual</p>
          <p className="font-display text-2xl font-extrabold text-neutral-900 dark:text-white">{formatCurrency(user.walletBalance ?? 0)}</p>
        </div>
        <Input label="Valor (R$)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        <Input label="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ajuste manual de saldo" />
      </div>
    </Modal>
  );
}
