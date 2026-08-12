import type { Urgency, Tier, Period, WeekAvailability, DayKey, ShiftSlot, ContractStatus, EstTier, User, Address, Category, VipPlan, EstVipPlan } from './types';
import { VIP_PLANS, EST_VIP_PLANS, CATEGORIES } from './mockData';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export function formatDateBR(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export function urgencyLabel(u: Urgency): string {
  return u === 'hoje' ? 'Hoje' : u === 'amanha' ? 'Amanhã' : 'Esta semana';
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function countAvailableSlots(av: WeekAvailability | undefined): number {
  if (!av) return 0;
  let n = 0;
  for (const d of Object.keys(av) as DayKey[]) {
    for (const s of ['manha', 'tarde', 'noite'] as ShiftSlot[]) {
      if (av[d]?.[s]) n++;
    }
  }
  return n;
}

export function emptyAddress(): Address {
  return { cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: 'SP' };
}

// --- Freelancer VIP ---
export function getPlan(tier: Tier, plans?: VipPlan[]) {
  const arr = plans ?? VIP_PLANS;
  return arr.find((p) => p.tier === tier) ?? arr[0];
}
export function planPrice(tier: Tier, period: Period, plans?: VipPlan[]): number {
  return getPlan(tier, plans).prices[period];
}
export function periodLabel(p: Period): string {
  return p === 'monthly' ? 'Mensal' : p === 'semestral' ? 'Semestral' : 'Anual';
}
export function canSelectCategories(tier: Tier, currentCount: number, plans?: VipPlan[]): boolean {
  const max = getPlan(tier, plans).maxCategories;
  return currentCount < max;
}

// --- Establishment VIP ---
export function getEstPlan(tier: EstTier, plans?: EstVipPlan[]) {
  const arr = plans ?? EST_VIP_PLANS;
  return arr.find((p) => p.tier === tier) ?? arr[0];
}
export function estPlanPrice(tier: EstTier, period: Period, plans?: EstVipPlan[]): number {
  return getEstPlan(tier, plans).prices[period];
}

export function isEstablishmentOnTrial(user: User): boolean {
  if (!user || user.accountType !== 'establishment') return false;
  if (user.estVipTier === 'trial' || user.vipTier === 'trial') {
    if (!user.trialEndsAt) return true;
    return new Date(user.trialEndsAt) > new Date();
  }
  if (user.trialEndsAt && (!user.estVipTier || user.estVipTier === 'free' || user.estVipTier === 'trial')) {
    return new Date(user.trialEndsAt) > new Date();
  }
  return false;
}

// BUSCA A TAXA CONFIGURADA DINAMICAMENTE NO PAINEL ADMIN
export function getIntermediationFeePercent(
  user: User,
  estPlans?: EstVipPlan[],
  vipPlans?: VipPlan[],
  defaultFeePercent: number = 15
): number {
  if (!user || user.accountType !== 'establishment') return defaultFeePercent;

  // 1. Isenção total durante o período de teste grátis (Trial)
  if (isEstablishmentOnTrial(user)) {
    const trialPlan = estPlans?.find((p) => String(p.tier).toLowerCase() === 'trial');
    if (trialPlan) {
      const fee = trialPlan.feePercent ?? (trialPlan as any).intermediationFee;
      if (typeof fee === 'number') return fee;
    }
    return 0;
  }

  // 2. Trava direta de segurança para VIP 6 / Isento
  const userTier = (user.estVipTier || user.vipTier || 'free').toString().toLowerCase();
  if (userTier === 'vip6' || userTier.includes('isento')) return 0;

  // 3. Busca no cadastro de planos do Estabelecimento no Admin
  if (estPlans && estPlans.length > 0) {
    const matchingEstPlan = estPlans.find(
      (p) => String(p.tier).toLowerCase() === userTier || String(p.id).toLowerCase() === userTier
    );
    if (matchingEstPlan) {
      const fee = matchingEstPlan.feePercent ?? (matchingEstPlan as any).intermediationFee;
      if (typeof fee === 'number') return fee;
    }
  }

  // 4. Busca no cadastro geral de planos VIP do Admin
  if (vipPlans && vipPlans.length > 0) {
    const matchingVipPlan = vipPlans.find(
      (p) => String(p.tier).toLowerCase() === userTier || String(p.id).toLowerCase() === userTier
    );
    if (matchingVipPlan) {
      const fee = matchingVipPlan.feePercent ?? (matchingVipPlan as any).intermediationFee;
      if (typeof fee === 'number') return fee;
    }
  }

  // 5. Fallback para getEstPlan se existir em mock
  const plan = getEstPlan(user.estVipTier ?? 'free', estPlans);
  if (plan) {
    const fee = plan.feePercent ?? (plan as any).intermediationFee;
    if (typeof fee === 'number') return fee;
  }

  return defaultFeePercent;
}

export function trialDaysLeft(user: User): number {
  if (!user.trialEndsAt) return 0;
  const diff = new Date(user.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function calculateFees(freelancerFee: number, feePercent: number): { fee: number; total: number } {
  const percentFee = Math.round(freelancerFee * (feePercent / 100) * 100) / 100;
  const fixedFee = feePercent > 0 ? 2.0 : 0.0;
  const fee = Math.round((percentFee + fixedFee) * 100) / 100;
  const total = Math.round((freelancerFee + fee) * 100) / 100;
  return { fee, total };
}

// 🛠️ Inclui o estado intermediário do check-in duplo
export const CONTRACT_STATUS_FLOW: ContractStatus[] = ['requested', 'confirmed', 'paid', 'check_in_pending', 'checked_in', 'completed'];

export function contractStatusLabel(s: ContractStatus): string {
  const map: Record<ContractStatus, string> = {
    requested: 'Solicitação enviada',
    confirmed: 'Disponibilidade confirmada',
    paid: 'Pago em garantia',
    check_in_pending: 'Aguardando confirmação do estabelecimento',
    checked_in: 'Check-in realizado',
    completed: 'Concluído e repassado',
    cancelled: 'Cancelado',
  };
  return map[s];
}

export function contractStatusTone(s: ContractStatus): 'neutral' | 'primary' | 'secondary' | 'warning' | 'success' | 'error' {
  const map: Record<ContractStatus, 'neutral' | 'primary' | 'secondary' | 'warning' | 'success' | 'error'> = {
    requested: 'primary',
    confirmed: 'secondary',
    paid: 'warning',
    check_in_pending: 'warning',
    checked_in: 'secondary',
    completed: 'success',
    cancelled: 'error',
  };
  return map[s];
}

export function contractStepIndex(s: ContractStatus): number {
  const i = CONTRACT_STATUS_FLOW.indexOf(s);
  return i < 0 ? 0 : i;
}

export function emailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================
// GEO / DISTANCE HELPERS
// ============================================================
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceBetween(a: Address, b: Address): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 9999;
  return haversineKm(a.lat, a.lng, b.lat, b.lng);
}

export function isWithinRadius(freelancer: User, origin: Address, radiusKm: number): boolean {
  if (freelancer.acceptsInterstate) return true;
  const dist = distanceBetween(freelancer.address, origin);
  const maxRadius = freelancer.serviceRadiusKm ?? 25;
  return dist <= Math.min(radiusKm, maxRadius);
}

export function dayKeyForDate(iso: string): DayKey {
  const d = new Date(iso);
  const day = d.getDay();
  const map: DayKey[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  return map[day];
}

export function isFreelancerAvailableOn(freelancer: User, dateIso: string): boolean {
  const av = freelancer.availability;
  if (!av) return false;
  const dayKey = dayKeyForDate(dateIso);
  const dayAv = av[dayKey];
  if (!dayAv) return false;
  return dayAv.manha || dayAv.tarde || dayAv.noite;
}

export function isAvailableToday(freelancer: User): boolean {
  return isFreelancerAvailableOn(freelancer, new Date().toISOString());
}

export function isAvailableTomorrow(freelancer: User): boolean {
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  return isFreelancerAvailableOn(freelancer, tomorrow);
}

export function categoriesByMacro(macroId: string): Category[] {
  return CATEGORIES.filter((c) => c.macro === macroId);
}

// ============================================================
// MASKS
// ============================================================
export function maskCPF(v: string): string {
  return v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function maskCNPJ(v: string): string {
  return v.replace(/\D/g, '').slice(0, 14).replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

export function maskCEP(v: string): string {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
}

// ============================================================
// CPF / CNPJ ALGORITHMIC VALIDATION
// ============================================================
export function validateCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(nums)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(nums[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  if (d2 !== parseInt(nums[10])) return false;

  return true;
}

export function validateCNPJ(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(nums)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(nums[i]) * weights1[i];
  let d1 = sum % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  if (d1 !== parseInt(nums[12])) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(nums[i]) * weights2[i];
  let d2 = sum % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  if (d2 !== parseInt(nums[13])) return false;

  return true;
}

export function validateDocument(doc: string, type: 'cpf' | 'cnpj'): boolean {
  return type === 'cpf' ? validateCPF(doc) : validateCNPJ(doc);
}

// ============================================================
// MASKED DISPLAY
// ============================================================
export function maskDocumentDisplay(doc: string): string {
  const nums = doc.replace(/\D/g, '');
  if (nums.length === 11) return `***.${nums.slice(3, 6)}.${nums.slice(6, 9)}-**`;
  if (nums.length === 14) return `**.${nums.slice(2, 5)}.${nums.slice(5, 8)}/****-**`;
  return '***';
}

// ============================================================
// CAROUSEL / ADS RADIUS FILTER (Até 60km - Nacional)
// ============================================================
export function filterAdsByRadius(users: User[], currentUser: User | null) {
  const activeAds: { establishmentName: string; imageUrl: string; city: string; state: string }[] = [];
  const userLat = currentUser?.address?.lat;
  const userLng = currentUser?.address?.lng;

  users.forEach((u) => {
    if (u.accountType === 'establishment' && u.adImages && u.adImages.length > 0) {
      const estLat = u.address?.lat;
      const estLng = u.address?.lng;

      let showAd = true;
      if (userLat != null && userLng != null && estLat != null && estLng != null) {
        const distanceKm = haversineKm(userLat, userLng, estLat, estLng);
        if (distanceKm > 60) {
          showAd = false;
        }
      }

      if (showAd) {
        u.adImages.forEach((img) => {
          if (img && typeof img === 'string' && img.trim() !== '') {
            activeAds.push({
              establishmentName: u.name,
              imageUrl: img,
              city: u.address?.city || '',
              state: u.address?.state || '',
            });
          }
        });
      }
    }
  });

  return activeAds;
}

// ============================================================
// TAX RECEIPT (Comprovante Contábil) — printable HTML
// ============================================================
export function generateTaxReceipt(contract: {
  id: string;
  establishmentName: string;
  freelancerName: string;
  date: string;
  hours: number;
  freelancerFee: number;
  platformFee: number;
  platformFeePercentage: number;
  total: number;
}): string {
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Comprovante de Prestação de Contas — ${contract.id}</title>
<style>
  @page { margin: 2cm; } body { font-family: Arial, sans-serif; color: #1a1a1a; max-width: 720px; margin: 0 auto; padding: 32px; }
  .header { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #ff7a14; padding-bottom: 16px; margin-bottom: 24px; }
  .logo { background: linear-gradient(135deg, #ff9838, #f05e06); width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #fff; }
  .brand h1 { font-size: 22px; margin: 0; } .brand p { font-size: 12px; color: #666; margin: 2px 0 0; }
  h2 { font-size: 16px; color: #ff7a14; margin: 0 0 16px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 24px; }
  .info-grid div { font-size: 13px; } .info-grid .label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; } .info-grid .value { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th, td { padding: 10px 12px; text-align: left; font-size: 13px; border-bottom: 1px solid #e5e5e5; }
  th { background: #f8f8f8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
  .total-row td { font-weight: 700; font-size: 14px; border-bottom: 2px solid #333; }
  .disclaimer { font-size: 11px; color: #888; line-height: 1.5; border-top: 1px solid #e5e5e5; padding-top: 16px; }
  .disclaimer strong { color: #555; }
  .transaction-id { font-family: monospace; font-size: 12px; background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
</style></head><body>
<div class="header"><div class="logo">🔥</div><div class="brand"><h1>FreelaAgora</h1><p>Comprovante de Prestação de Contas (Escrituração Fiscal)</p></div></div>
<h2>Comprovante de Prestação de Contas</h2>
<div class="info-grid">
  <div><div class="label">ID da Transação</div><div class="value transaction-id">${contract.id}</div></div>
  <div><div class="label">Data do Serviço</div><div class="value">${formatDate(contract.date)}</div></div>
  <div><div class="label">Estabelecimento</div><div class="value">${contract.establishmentName}</div></div>
  <div><div class="label">Prestador (Freelancer)</div><div class="value">${contract.freelancerName}</div></div>
  <div><div class="label">Horas Contratadas</div><div class="value">${contract.hours}h</div></div>
  <div><div class="label">Taxa de Intermediação Aplicada</div><div class="value">${contract.platformFeePercentage}%</div></div>
</div>
<table>
  <thead><tr><th>Descrição</th><th style="text-align:right">Valor (R$)</th></tr></thead>
  <tbody>
    <tr><td>Valor Bruto da Diária do Freelancer</td><td style="text-align:right">${formatCurrency(contract.freelancerFee)}</td></tr>
    <tr><td>Taxa de Intermediação da Plataforma (${contract.platformFeePercentage}%)</td><td style="text-align:right">${formatCurrency(contract.platformFee)}</td></tr>
    <tr class="total-row"><td>Total Pago em Garantia</td><td style="text-align:right">${formatCurrency(contract.total)}</td></tr>
  </tbody>
</table>
<div class="disclaimer">
  Este documento serve como comprovante de movimentação financeira e intermediação de negócios privados para fins de escrituração contábil e declaração de ajuste fiscal.
  <br/><br/>
  Emitido em: ${formatDateTime(new Date().toISOString())} · FreelaAgora Tecnologia Ltda.
</div>
</body></html>`;
  return html;
}

export function downloadTaxReceipt(contract: Parameters<typeof generateTaxReceipt>[0]) {
  const html = generateTaxReceipt(contract);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => { setTimeout(() => win.print(), 500); };
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
