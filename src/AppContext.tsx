import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { AppContext, type AppContextValue, useApp } from './context';
import { initialData, CATEGORIES, metroNearby, emptyAvailability } from './mockData';
import { uid, getPlan, canSelectCategories, getEstPlan, getIntermediationFeePercent, calculateFees } from './utils';
import { setPaymentSettings } from '@/services/paymentService';
import { supabase } from '@/lib/supabase';
import type { AppData, User, Job, Contract, WalletTx, AppNotification, Review, Tier, Period, WeekAvailability, DateAvailability, ContractStatus, EstTier, TermsAcceptance, Coupon, VipPlan, EstVipPlan, PaymentSettings } from './types';
import {
  loadAllData, dbInsertUser, dbUpdateUser, dbDeleteUser,
  dbInsertJob, dbUpdateJob, dbDeleteJob, dbApplyToJob,
  dbInsertContract, dbUpdateContractStatus, dbUpdateContractInvoice,
  dbInsertWalletTx, dbUpdateWalletBalance,
  dbInsertNotification, dbMarkNotificationRead, dbMarkAllNotificationsRead,
  dbInsertReview, dbDeleteReview,
  dbInsertCoupon, dbToggleCoupon, dbDeleteCoupon,
  dbInsertAuditLog, dbUpdateDefaultFeePercent, dbUpdatePaymentSettings,
  dbUpsertVipPlan, dbDeleteVipPlan, dbUpsertEstVipPlan, dbDeleteEstVipPlan,
  dbInsertAdmin
} from '@/services/db';

export { useApp };

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const STORAGE_KEY = 'freelaagora_current_user';

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(() => {
    try {
      const savedUserId = localStorage.getItem(STORAGE_KEY);
      if (savedUserId) {
        return { ...initialData, currentUserId: savedUserId };
      }
    } catch (e) {}
    return initialData;
  });

  const [loaded, setLoaded] = useState(false);
  const [adminTab, setAdminTab] = useState('overview');
  const [adminMode, setAdminMode] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dbData = await loadAllData();
        if (!cancelled && dbData) {
          setDataState((prev) => ({ ...dbData, currentUserId: prev.currentUserId ?? dbData.currentUserId }));
        }
      } catch (e) { console.warn("⚠️ Falha ao carregar do Supabase:", e); } finally { if (!cancelled) setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (data?.paymentSettings) {
      setPaymentSettings(data.paymentSettings ?? { activeProvider: 'asaas', configs: {} });
    }
  }, [data?.paymentSettings]);

  const setData = useCallback((updater: AppData | ((prev: AppData) => AppData)) => {
    setDataState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: AppData) => AppData)(prev) : updater;
      try {
        if (next.currentUserId) localStorage.setItem(STORAGE_KEY, next.currentUserId);
        else localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      return next;
    });
  }, []);

  const resetData = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    setDataState(initialData);
  }, []);

  const currentUser = useMemo(() => data?.users.find((u) => u.id === data.currentUserId) ?? null, [data?.users, data?.currentUserId]);
  const isAdmin = !!currentUser?.isAdmin;
  const isSuperAdmin = !!currentUser?.isAdmin && currentUser?.adminRole === 'super';
  const currentAdminId = currentUser?.id ?? ADMIN_ID;

  const login = useCallback((email: string, password: string): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema ainda carregando.' };
    const user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) return { ok: false, error: 'E-mail não cadastrado.' };
    if (user.password !== password) return { ok: false, error: 'Senha incorreta.' };
    if (user.banned) return { ok: false, error: 'Esta conta foi banida.' };
    setData((d) => ({ ...d, currentUserId: user.id }));
    return { ok: true };
  }, [data?.users, setData]);

  const register = useCallback((user: Omit<User, 'id' | 'createdAt' | 'walletBalance' | 'rating' | 'reviewsCount' | 'completedShifts'> & Partial<User>): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema ainda carregando.' };
    if (data.users.some((u) => u.email.toLowerCase() === user.email.toLowerCase().trim())) {
      return { ok: false, error: 'Este e-mail já está cadastrado.' };
    }
    const id = crypto.randomUUID();
    const newUser: User = {
      ...user, id, email: user.email.toLowerCase().trim(), createdAt: new Date().toISOString(),
      walletBalance: 0, rating: user.accountType === 'freelancer' ? 5 : 0, reviewsCount: 0, completedShifts: 0,
      vipTier: user.accountType === 'freelancer' ? 'free' : undefined,
      estVipTier: user.accountType === 'establishment' ? 'trial' : undefined,
      trialEndsAt: user.accountType === 'establishment' ? new Date(Date.now() + 15 * 86400000).toISOString() : undefined,
      categories: user.accountType === 'freelancer' ? (user.categories ?? []) : undefined,
      availability: user.accountType === 'freelancer' ? (user.availability ?? emptyAvailability()) : undefined,
    } as User;
    setData((d) => ({ ...d, users: [...d.users, newUser], currentUserId: id }));
    void dbInsertUser(newUser).catch(() => {});
    return { ok: true };
  }, [data, setData]);

  const logout = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    setData((d) => ({ ...d, currentUserId: null }));
  }, [setData]);

  const updateUser = useCallback((id: string, patch: Partial<User>) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
    void dbUpdateUser(id, patch).catch(() => {});
  }, [setData]);

  const adminUpdateUser = useCallback((id: string, patch: Partial<User>) => {
    const stampedPatch = { ...patch, lastAdminEdit: new Date().toISOString() };
    const auditLog = { id: crypto.randomUUID(), adminId: currentAdminId, action: `Admin alterou dados do usuário ${id}`, targetUserId: id, createdAt: new Date().toISOString() };
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === id ? { ...u, ...stampedPatch } : u)),
      adminAuditLogs: [auditLog, ...d.adminAuditLogs]
    }));
    void dbUpdateUser(id, stampedPatch).catch(() => {});
    void dbInsertAuditLog(auditLog).catch(() => {});
  }, [setData, currentAdminId]);

  const deleteEntity = useCallback((id: string) => {
    setData((d) => ({ ...d, users: d.users.filter((u) => u.id !== id) }));
    void dbDeleteUser(id).catch(() => {});
  }, [setData]);

  const banUser = useCallback((id: string) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, banned: true } : u)) }));
    void dbUpdateUser(id, { banned: true }).catch(() => {});
  }, [setData]);

  const unbanUser = useCallback((id: string) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, banned: false } : u)) }));
    void dbUpdateUser(id, { banned: false }).catch(() => {});
  }, [setData]);

  const setVipTier = useCallback((id: string, tier: Tier, period: Period = 'monthly'): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    const user = data.users.find(u => u.id === id);
    const price = getPlan(tier, data.vipPlans).prices[period];
    if (tier !== 'free' && price > 0 && (user?.walletBalance ?? 0) < price) {
      return { ok: false, error: 'Saldo insuficiente na carteira.' };
    }
    const expiry = tier === 'free' ? undefined : new Date(Date.now() + (period === 'annual' ? 365 : period === 'semestral' ? 180 : 30) * 86400000).toISOString();
    const newTxs: WalletTx[] = price > 0 ? [{ id: crypto.randomUUID(), userId: id, type: 'vip_charge', amount: -price, description: `Assinatura ${getPlan(tier, data.vipPlans).label} (${period})`, date: new Date().toISOString() }] : [];
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === id ? { ...u, vipTier: tier, vipExpiresAt: expiry, walletBalance: Math.max(0, (u.walletBalance ?? 0) - price) } : u)),
      walletTxs: [...newTxs, ...d.walletTxs]
    }));
    void dbUpdateUser(id, { vipTier: tier, vipExpiresAt: expiry }).catch(() => {});
    if (price > 0 && newTxs[0]) {
      void dbInsertWalletTx(newTxs[0]).catch(() => {});
      if (user) void dbUpdateWalletBalance(id, Math.max(0, (user.walletBalance ?? 0) - price)).catch(() => {});
    }
    return { ok: true };
  }, [setData, data]);

  const setEstVipTier = useCallback((id: string, tier: EstTier, period: Period = 'monthly'): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    const user = data.users.find(u => u.id === id);
    const price = getEstPlan(tier, data.estVipPlans).prices[period];
    if (tier !== 'free' && tier !== 'trial' && price > 0 && (user?.walletBalance ?? 0) < price) {
      return { ok: false, error: 'Saldo insuficiente na carteira.' };
    }
    const expiry = (tier === 'free' || tier === 'trial') ? undefined : new Date(Date.now() + (period === 'annual' ? 365 : period === 'semestral' ? 180 : 30) * 86400000).toISOString();
    const newTrialEndsAt = (tier !== 'free' && tier !== 'trial') ? null : user?.trialEndsAt;
    const newTxs: WalletTx[] = price > 0 ? [{ id: crypto.randomUUID(), userId: id, type: 'vip_charge_est', amount: -price, description: `Assinatura ${getEstPlan(tier, data.estVipPlans).label} (${period})`, date: new Date().toISOString() }] : [];
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === id ? { ...u, estVipTier: tier, estVipExpiresAt: expiry, trialEndsAt: newTrialEndsAt, walletBalance: Math.max(0, (u.walletBalance ?? 0) - price) } : u)),
      walletTxs: [...newTxs, ...d.walletTxs]
    }));
    void dbUpdateUser(id, { estVipTier: tier, estVipExpiresAt: expiry, trialEndsAt: newTrialEndsAt }).catch(() => {});
    if (price > 0 && newTxs[0]) {
      void dbInsertWalletTx(newTxs[0]).catch(() => {});
      if (user) void dbUpdateWalletBalance(id, Math.max(0, (user.walletBalance ?? 0) - price)).catch(() => {});
    }
    return { ok: true };
  }, [setData, data]);

  const setTermsAcceptance = useCallback((id: string, acceptance: TermsAcceptance) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, termsAcceptance: acceptance } : u)) }));
    void dbUpdateUser(id, { termsAcceptance: acceptance }).catch(() => {});
  }, [setData]);

  const setAvailability = useCallback((userId: string, av: WeekAvailability) => {
    const user = data?.users.find((u) => u.id === userId);
    updateUser(userId, { availability: av, dateAvailability: user?.dateAvailability ?? {} });
  }, [data?.users, updateUser]);
  
  const toggleAvailabilitySlot = useCallback((userId: string, day: keyof WeekAvailability, shift: 'manha' | 'tarde' | 'noite') => {
    setData((d) => {
      const users = d.users.map((u) => {
        if (u.id !== userId) return u;
        const av = u.availability ?? emptyAvailability();
        const updated = { ...av, [day]: { ...av[day], [shift]: !av[day][shift] } };
        return { ...u, availability: updated };
      });
      const user = users.find((u) => u.id === userId);
      if (user?.availability) void dbUpdateUser(userId, { availability: user.availability, dateAvailability: user.dateAvailability ?? {} }).catch(() => {});
      return { ...d, users };
    });
  }, [setData]);

  const toggleDateShift = useCallback((userId: string, dateKey: string, shift: 'manha' | 'tarde' | 'noite') => {
    setData((d) => {
      const users = d.users.map((u) => {
        if (u.id !== userId) return u;
        const da = { ...(u.dateAvailability ?? {}) } as DateAvailability;
        const day = { ...(da[dateKey] ?? { manha: false, tarde: false, noite: false }) };
        day[shift] = !day[shift];
        if (!day.manha && !day.tarde && !day.noite) { delete da[dateKey]; } else { da[dateKey] = day; }
        return { ...u, dateAvailability: da };
      });
      const user = users.find((u) => u.id === userId);
      if (user) {
        void dbUpdateUser(userId, { availability: user.availability ?? emptyAvailability(), dateAvailability: user.dateAvailability ?? {} }).catch((err) => {
          console.error("Erro ao salvar agenda no banco:", err);
        });
      }
      return { ...d, users };
    });
  }, [setData]);

  const toggleCategory = useCallback((userId: string, categoryId: string): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    const user = data.users.find((u) => u.id === userId);
    if (!user) return { ok: false, error: 'Usuário não encontrado.' };
    const current = user.categories ?? [];
    const tier = user.vipTier ?? 'free';
    if (current.includes(categoryId)) {
      updateUser(userId, { categories: current.filter((c) => c !== categoryId) });
      return { ok: true };
    }
    if (!canSelectCategories(tier, current.length, data.vipPlans)) {
      const plan = getPlan(tier, data.vipPlans);
      return { ok: false, error: `Seu plano ${plan.label} permite até ${plan.maxCategories} categorias.` };
    }
    updateUser(userId, { categories: [...current, categoryId] });
    return { ok: true };
  }, [data, updateUser]);

  const addJob = useCallback((j: Job): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    const est = data.users.find((u) => u.id === j.establishmentId);
    if (!est) return { ok: false, error: 'Estabelecimento não encontrado.' };
    setData((d) => ({ ...d, jobs: [j, ...d.jobs] }));
    void dbInsertJob(j).catch(() => {});
    return { ok: true };
  }, [data, setData]);

  const updateJob = useCallback((id: string, patch: Partial<Job>) => {
    setData((d) => ({ ...d, jobs: d.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) }));
    void dbUpdateJob(id, patch).catch(() => {});
  }, [setData]);

  const deleteJob = useCallback((id: string) => {
    setData((d) => ({ ...d, jobs: d.jobs.filter((j) => j.id !== id) }));
    void dbDeleteJob(id).catch(() => {});
  }, [setData]);

  const pauseJob = useCallback((id: string) => {
    if (!data) return;
    const job = data.jobs.find((j) => j.id === id);
    const newStatus = job?.status === 'paused' ? 'active' : 'paused';
    setData((d) => ({ ...d, jobs: d.jobs.map((j) => (j.id === id ? { ...j, status: newStatus } : j)) }));
    void dbUpdateJob(id, { status: newStatus }).catch(() => {});
  }, [setData, data]);

  const applyToJob = useCallback((jobId: string, freelancerId: string) => {
    setData((d) => ({ ...d, jobs: d.jobs.map((j) => (j.id === jobId && !j.applicants.includes(freelancerId) ? { ...j, applicants: [...j.applicants, freelancerId] } : j)) }));
    void dbApplyToJob(jobId, freelancerId).catch(() => {});
  }, [setData]);

  const notifyUser = useCallback((userId: string, type: AppNotification['type'], title: string, body: string, contractId?: string) => {
    const n: AppNotification = { id: crypto.randomUUID(), userId, type, title, body, read: false, date: new Date().toISOString(), contractId };
    setData((d) => ({ ...d, notifications: [n, ...d.notifications] }));
    void dbInsertNotification(n).catch(() => {});
  }, [setData]);

  const markNotificationRead = useCallback((id: string) => {
    setData((d) => ({ ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    void dbMarkNotificationRead(id).catch(() => {});
  }, [setData]);

  const markAllNotificationsRead = useCallback((userId: string) => {
    setData((d) => ({ ...d, notifications: d.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)) }));
    void dbMarkAllNotificationsRead(userId).catch(() => {});
  }, [setData]);

  const userNotifications = useCallback((userId: string) => data?.notifications.filter((n) => n.userId === userId) ?? [], [data?.notifications]);
  const userWalletBalance = useCallback((userId: string) => data?.users.find((u) => u.id === userId)?.walletBalance ?? 0, [data?.users]);
  const userWalletTxs = useCallback((userId: string) => data?.walletTxs.filter((t) => t.userId === userId) ?? [], [data?.walletTxs]);
  const adminWalletTxs = useCallback(() => data?.walletTxs.filter((t) => t.userId === ADMIN_ID) ?? [], [data?.walletTxs]);

  const depositToWallet = useCallback((userId: string, amount: number, description?: string) => {
    if (!data) return;
    const tx: WalletTx = { id: crypto.randomUUID(), userId, type: 'deposit', amount, description: description ?? 'Depósito', date: new Date().toISOString() };
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === userId ? { ...u, walletBalance: (u.walletBalance ?? 0) + amount } : u)),
      walletTxs: [tx, ...d.walletTxs]
    }));
    void dbInsertWalletTx(tx).catch(() => {});
    const newBal = (data.users.find((u) => u.id === userId)?.walletBalance ?? 0) + amount;
    void dbUpdateWalletBalance(userId, newBal).catch(() => {});
  }, [setData, data]);

  const withdrawFromWallet = useCallback((userId: string, amount: number, description?: string) => {
    if (!data) return;
    const tx: WalletTx = { id: crypto.randomUUID(), userId, type: 'withdraw', amount: -amount, description: description ?? 'Saque', date: new Date().toISOString() };
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === userId ? { ...u, walletBalance: Math.max(0, (u.walletBalance ?? 0) - amount) } : u)),
      walletTxs: [tx, ...d.walletTxs]
    }));
    void dbInsertWalletTx(tx).catch(() => {});
    const newBal = Math.max(0, (data.users.find((u) => u.id === userId)?.walletBalance ?? 0) - amount);
    void dbUpdateWalletBalance(userId, newBal).catch(() => {});
  }, [setData, data]);

  const requestHire = useCallback((establishmentId: string, freelancerId: string, jobId: string | null, hours: number, freelancerFee: number): Contract => {
    const est = data?.users.find((u) => u.id === establishmentId);
    const fl = data?.users.find((u) => u.id === freelancerId);
    const feePercent = est ? getIntermediationFeePercent(est, data.estVipPlans) : data?.config.defaultFeePercent ?? 15;
    const { fee, total } = calculateFees(freelancerFee, feePercent);
    const contract: Contract = {
      id: crypto.randomUUID(), jobId, establishmentId, establishmentName: est?.name ?? '',
      freelancerId, freelancerName: fl?.name ?? '', freelancerPhoto: fl?.photo ?? '',
      freelancerPhone: fl?.phone ?? '', freelancerWhatsapp: fl?.whatsapp ?? '',
      category: fl?.categories?.[0] ?? 'geral', date: new Date().toISOString(), hours,
      freelancerFee, platformFeePercentage: feePercent, platformFee: fee, total,
      status: 'requested', createdAt: new Date().toISOString(), history: [{ status: 'requested', at: new Date().toISOString() }],
    };
    const notifs: AppNotification[] = [
      { id: crypto.randomUUID(), userId: freelancerId, type: 'hire_request', title: 'Nova solicitação', body: `${est?.name} quer te contratar.`, read: false, date: new Date().toISOString(), contractId: contract.id },
    ];
    setData((d) => ({ ...d, contracts: [contract, ...d.contracts], notifications: [...notifs, ...d.notifications] }));
    void dbInsertContract(contract).catch(() => {});
    return contract;
  }, [data, setData]);

  const confirmAvailability = useCallback(async (contractId: string) => {
    if (!data) return;
    const contract = data.contracts.find((c) => c.id === contractId);
    if (!contract) return;
    const { error } = await supabase.rpc('accept_contract', {
      p_contract_id: contractId,
      p_freelancer_id: contract.freelancerId
    });
    if (error) {
      setData((d) => ({ ...d, contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'confirmed', history: [...ct.history, { status: 'confirmed', at: new Date().toISOString() }] } : ct) }));
      void dbUpdateContractStatus(contractId, 'confirmed').catch(() => {});
    } else {
      setData((d) => ({ ...d, contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'confirmed', history: [...ct.history, { status: 'confirmed', at: new Date().toISOString() }] } : ct) }));
    }
  }, [data, setData]);

  // Pagamento descontando do saldo
  const payEscrow = useCallback((contractId: string, paymentMethod: 'wallet' | 'pix' | 'card' = 'wallet'): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    const c = data.contracts.find((x) => x.id === contractId);
    const est = data.users.find(u => u.id === c?.establishmentId);
    if (!c || !est) return { ok: false, error: 'Contrato ou usuário não encontrado.' };

    if (paymentMethod === 'wallet' && (est.walletBalance ?? 0) < c.total) {
      return { ok: false, error: 'Saldo insuficiente na carteira.' };
    }

    const newBalance = paymentMethod === 'wallet' ? Math.max(0, est.walletBalance - c.total) : est.walletBalance;
    const invoiceId = c.coraInvoiceId ?? `inv-${crypto.randomUUID()}`;
    const estTx: WalletTx = { id: crypto.randomUUID(), userId: c.establishmentId, type: 'escrow_hold', amount: -c.total, description: `Escrow — ${c.freelancerName}`, contractId, date: new Date().toISOString() };

    setData((d) => ({
      ...d,
      users: d.users.map(u => u.id === c.establishmentId ? { ...u, walletBalance: newBalance } : u),
      contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'paid', coraInvoiceId: invoiceId, history: [...ct.history, { status: 'paid', at: new Date().toISOString() }] } : ct),
      walletTxs: [estTx, ...d.walletTxs]
    }));

    void dbUpdateContractStatus(contractId, 'paid').catch(() => {});
    void dbUpdateContractInvoice(contractId, invoiceId).catch(() => {});
    void dbInsertWalletTx(estTx).catch(() => {});
    if (paymentMethod === 'wallet') void dbUpdateWalletBalance(c.establishmentId, newBalance).catch(() => {});
    
    return { ok: true };
  }, [data, setData]);

  // 1. O Freelancer solicita o check-in (Chegada ao local)
  const requestCheckIn = useCallback((contractId: string) => {
    if (!data) return;
    const c = data.contracts.find(x => x.id === contractId);
    if (!c) return;

    setData((d) => ({
      ...d,
      contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'check_in_pending', history: [...ct.history, { status: 'check_in_pending', at: new Date().toISOString(), note: 'Profissional registrou chegada, aguardando estabelecimento.' }] } : ct),
      notifications: [
        { id: crypto.randomUUID(), userId: c.establishmentId, type: 'announcement', title: 'Chegada do Profissional', body: `${c.freelancerName} fez o check-in e aguarda sua confirmação de presença.`, read: false, date: new Date().toISOString(), contractId },
        ...d.notifications
      ]
    }));
    void dbUpdateContractStatus(contractId, 'check_in_pending').catch(() => {});
  }, [data, setData]);

  // 2. O Estabelecimento confirma a presença (Check-in duplo concluído)
  const confirmCheckIn = useCallback((contractId: string) => {
    if (!data) return;
    const c = data.contracts.find(x => x.id === contractId);
    if (!c) return;

    setData((d) => ({
      ...d,
      contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'checked_in', history: [...ct.history, { status: 'checked_in', at: new Date().toISOString(), note: 'Estabelecimento confirmou a presença.' }] } : ct),
      notifications: [
        { id: crypto.randomUUID(), userId: c.freelancerId, type: 'announcement', title: 'Check-in Confirmado!', body: `O estabelecimento ${c.establishmentName} confirmou sua presença. Bom trabalho!`, read: false, date: new Date().toISOString(), contractId },
        ...d.notifications
      ]
    }));
    void dbUpdateContractStatus(contractId, 'checked_in').catch(() => {});
  }, [data, setData]);

  const finishService = useCallback((contractId: string) => {
    if (!data) return;
    const c = data.contracts.find((x) => x.id === contractId);
    if (!c) return;
    const flRelease: WalletTx = { id: crypto.randomUUID(), userId: c.freelancerId, type: 'escrow_release', amount: c.freelancerFee, description: `Repasse — ${c.establishmentName}`, contractId, date: new Date().toISOString() };
    const adminFee: WalletTx = { id: crypto.randomUUID(), userId: ADMIN_ID, type: 'platform_fee', amount: c.platformFee, description: `Taxa (${c.platformFeePercentage}%)`, contractId, date: new Date().toISOString() };
    setData((d) => ({
      ...d,
      contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'completed', history: [...ct.history, { status: 'completed', at: new Date().toISOString() }] } : ct),
      walletTxs: [flRelease, adminFee, ...d.walletTxs]
    }));
    void dbUpdateContractStatus(contractId, 'completed').catch(() => {});
    void dbInsertWalletTx(flRelease).catch(() => {});
    void dbInsertWalletTx(adminFee).catch(() => {});
  }, [data, setData]);

  const cancelContract = useCallback((contractId: string) => {
    if (!data) return;
    setData((d) => ({
      ...d,
      contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'cancelled', history: [...ct.history, { status: 'cancelled', at: new Date().toISOString() }] } : ct)
    }));
    void dbUpdateContractStatus(contractId, 'cancelled').catch(() => {});
  }, [data, setData]);

  const submitReview = useCallback((contractId: string, fromId: string, fromName: string, toId: string, rating: number, comment: string) => {
    if (!data) return;
    const review: Review = { id: crypto.randomUUID(), fromId, fromName, toId, rating, comment, date: new Date().toISOString() };
    setData((d) => ({ ...d, reviews: [review, ...d.reviews] }));
    void dbInsertReview(review, contractId, false).catch(() => {});
  }, [data, setData]);

  const reviewsFor = useCallback((userId: string) => data?.reviews.filter((r) => r.toId === userId) ?? [], [data?.reviews]);

  const setDefaultFeePercent = useCallback((n: number) => {
    setData((d) => ({ ...d, config: { ...d.config, defaultFeePercent: n } }));
    void dbUpdateDefaultFeePercent(n).catch(() => {});
  }, [setData]);

  const updatePaymentSettings = useCallback((settings: PaymentSettings) => {
    setData((d) => ({ ...d, paymentSettings: settings }));
    void dbUpdatePaymentSettings(settings).catch(() => {});
  }, [setData]);

  const overrideContractStatus = useCallback((contractId: string, status: ContractStatus) => {
    setData((d) => ({ ...d, contracts: d.contracts.map((c) => c.id === contractId ? { ...c, status } : c) }));
    void dbUpdateContractStatus(contractId, status).catch(() => {});
  }, [setData]);

  const forceRefund = useCallback((contractId: string) => {
    if (!data) return;
    setData((d) => ({ ...d, contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'cancelled' } : ct) }));
    void dbUpdateContractStatus(contractId, 'cancelled').catch(() => {});
  }, [setData, data]);

  const coupons = useMemo(() => data?.coupons ?? [], [data?.coupons]);

  const validateCoupon = useCallback((code: string) => {
    if (!data) return { error: 'Carregando.' };
    const c = data.coupons.find((cp) => cp.code.toUpperCase() === code.toUpperCase().trim() && cp.isActive);
    if (!c) return { error: 'Cupom inválido.' };
    return { coupon: c };
  }, [data]);

  const addCoupon = useCallback((coupon: Omit<Coupon, 'id' | 'createdAt'>) => {
    const newCoupon = { ...coupon, id: crypto.randomUUID(), usedBy: [], createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, coupons: [newCoupon, ...d.coupons] }));
    void dbInsertCoupon(newCoupon).catch(() => {});
  }, [setData]);

  const toggleCoupon = useCallback((id: string) => {
    setData((d) => ({ ...d, coupons: d.coupons.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c) }));
    void dbToggleCoupon(id).catch(() => {});
  }, [setData]);

  const deleteCoupon = useCallback((id: string) => {
    setData((d) => ({ ...d, coupons: d.coupons.filter((c) => c.id !== id) }));
    void dbDeleteCoupon(id).catch(() => {});
  }, [setData]);

  const applyCouponToPurchase = useCallback((userId: string, tier: Tier | EstTier, period: Period, coupon: Coupon, accountType: 'freelancer' | 'establishment') => {
    return { ok: true, discountedPrice: 0 };
  }, []);

  const auditLogs = useMemo(() => data?.adminAuditLogs ?? [], [data?.adminAuditLogs]);
  const logAdminAction = useCallback((action: string, targetUserId?: string) => {
    const auditLog = { id: crypto.randomUUID(), adminId: currentAdminId, action, targetUserId, createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, adminAuditLogs: [auditLog, ...d.adminAuditLogs] }));
    void dbInsertAuditLog(auditLog).catch(() => {});
  }, [setData, currentAdminId]);

  const adminCreateUser = useCallback(async (user: User) => { 
    setData((d) => ({ ...d, users: [...d.users, user] }));
    await dbInsertUser(user);
    return { ok: true };
  }, [setData]);

  const adminCreateAdmin = useCallback(async (user: any) => {
    const adminUser = { ...user, id: crypto.randomUUID(), isAdmin: true };
    setData((d) => ({ ...d, users: [...d.users, adminUser] }));
    await dbInsertAdmin(adminUser);
    return { ok: true };
  }, [setData]);

  const adminRemoveAdmin = useCallback((id: string) => {
    setData((d) => ({ ...d, users: d.users.filter((u) => u.id !== id) }));
    void dbDeleteUser(id).catch(() => {});
  }, [setData]);

  const adjustWallet = useCallback((userId: string, amount: number, description: string) => {
    if (!data) return;
    const tx: WalletTx = { 
      id: crypto.randomUUID(), 
      userId, 
      type: amount >= 0 ? 'deposit' : 'withdraw', 
      amount, 
      description: `[Admin] ${description}`, 
      date: new Date().toISOString() 
    };
    const auditLog = { 
      id: crypto.randomUUID(), 
      adminId: currentAdminId, 
      action: `Admin ajustou carteira de ${userId} em ${amount >= 0 ? '+' : ''}${amount} (${description})`, 
      targetUserId: userId, 
      createdAt: new Date().toISOString() 
    };
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === userId ? { ...u, walletBalance: Math.max(0, (u.walletBalance ?? 0) + amount) } : u)),
      walletTxs: [tx, ...d.walletTxs],
      adminAuditLogs: [auditLog, ...d.adminAuditLogs]
    }));
    void dbInsertWalletTx(tx).catch(() => {});
    const user = data.users.find((u) => u.id === userId);
    if (user) {
      const newBalance = Math.max(0, (user.walletBalance ?? 0) + amount);
      void dbUpdateWalletBalance(userId, newBalance).catch(() => {});
    }
    void dbInsertAuditLog(auditLog).catch(() => {});
  }, [setData, currentAdminId, data]);

  const deleteReview = useCallback((reviewId: string) => {
    setData((d) => ({ ...d, reviews: d.reviews.filter((r) => r.id !== reviewId) }));
    void dbDeleteReview(reviewId).catch(() => {});
  }, [setData]);

  const broadcastNotification = useCallback((title: string, body: string) => {
    data?.users.forEach(u => {
        notifyUser(u.id, 'announcement', title, body);
    });
  }, [data, notifyUser]);

  const updateVipPlan = useCallback((tier: Tier, patch: Partial<VipPlan>) => {
    setData((d) => ({ ...d, vipPlans: d.vipPlans.map((p) => p.tier === tier ? { ...p, ...patch } : p) }));
    const plan = data?.vipPlans.find(p => p.tier === tier);
    if (plan) void dbUpsertVipPlan({ ...plan, ...patch }).catch(() => {});
  }, [setData, data]);

  const addVipPlan = useCallback((plan: VipPlan) => {
    setData((d) => ({ ...d, vipPlans: [...d.vipPlans, plan] }));
    void dbUpsertVipPlan(plan).catch(() => {});
  }, [setData]);

  const removeVipPlan = useCallback((tier: Tier) => {
    setData((d) => ({ ...d, vipPlans: d.vipPlans.filter((p) => p.tier !== tier) }));
    void dbDeleteVipPlan(tier).catch(() => {});
  }, [setData]);

  const updateEstVipPlan = useCallback((tier: EstTier, patch: Partial<EstVipPlan>) => {
    setData((d) => ({ ...d, estVipPlans: d.estVipPlans.map((p) => p.tier === tier ? { ...p, ...patch } : p) }));
    const plan = data?.estVipPlans.find(p => p.tier === tier);
    if (plan) void dbUpsertEstVipPlan({ ...plan, ...patch }).catch(() => {});
  }, [setData, data]);

  const addEstVipPlan = useCallback((plan: EstVipPlan) => {
    setData((d) => ({ ...d, estVipPlans: [...d.estVipPlans, plan] }));
    void dbUpsertEstVipPlan(plan).catch(() => {});
  }, [setData]);

  const removeEstVipPlan = useCallback((tier: EstTier) => {
    setData((d) => ({ ...d, estVipPlans: d.estVipPlans.filter((p) => p.tier !== tier) }));
    void dbDeleteEstVipPlan(tier).catch(() => {});
  }, [setData]);

  const enterAdminMode = useCallback(() => setAdminMode(true), []);
  const exitAdminMode = useCallback(() => { setAdminMode(false); setAdminTab('overview'); }, []);

  const freelancers = useMemo(() => data?.users.filter((u) => u.accountType === 'freelancer' && !u.isAdmin) ?? [], [data?.users]);
  const establishments = useMemo(() => data?.users.filter((u) => u.accountType === 'establishment') ?? [], [data?.users]);
  const nearbyFreelancers = useCallback((city: string) => {
    if (!data) return [];
    const nearby = metroNearby(city);
    return data.users.filter((u) => u.accountType === 'freelancer' && !u.isAdmin && !u.banned && nearby.includes(u.address.city));
  }, [data?.users]);
  const categoryById = useCallback((id: string) => CATEGORIES.find((c) => c.id === id), []);

  const value = useMemo<AppContextValue>(() => ({
    data: data!, currentUser, isAdmin, isSuperAdmin, login, register, logout, updateUser, adminUpdateUser, deleteEntity, banUser, unbanUser, setVipTier, setEstVipTier, setTermsAcceptance,
    setAvailability, toggleAvailabilitySlot, toggleDateShift, toggleCategory,
    addJob, updateJob, deleteJob, pauseJob, applyToJob,
    requestHire, confirmAvailability, payEscrow, requestCheckIn, confirmCheckIn, finishService, cancelContract,
    submitReview, notify: notifyUser, markNotificationRead, markAllNotificationsRead, userNotifications,
    userWalletBalance, userWalletTxs, adminWalletTxs, depositToWallet, withdrawFromWallet,
    reviewsFor, setDefaultFeePercent, updatePaymentSettings, overrideContractStatus, forceRefund, resetData,
    freelancers, establishments, nearbyFreelancers, categoryById,
    adminTab, setAdminTab, adminMode, exitAdminMode, enterAdminMode,
    coupons, validateCoupon, addCoupon, toggleCoupon, deleteCoupon, applyCouponToPurchase,
    auditLogs, logAdminAction, adminCreateUser, adminCreateAdmin, removeAdmin: adminRemoveAdmin, adjustWallet, deleteReview, broadcastNotification,
    updateVipPlan, addVipPlan, removeVipPlan, updateEstVipPlan, addEstVipPlan, removeEstVipPlan,
  }), [
    data, currentUser, isAdmin, isSuperAdmin, login, register, logout, updateUser, adminUpdateUser, deleteEntity, banUser, unbanUser, setVipTier, setEstVipTier, setTermsAcceptance,
    setAvailability, toggleAvailabilitySlot, toggleDateShift, toggleCategory, addJob, updateJob, deleteJob, pauseJob, applyToJob,
    requestHire, confirmAvailability, payEscrow, requestCheckIn, confirmCheckIn, finishService, cancelContract,
    submitReview, notifyUser, markNotificationRead, markAllNotificationsRead, userNotifications,
    userWalletBalance, userWalletTxs, adminWalletTxs, depositToWallet, withdrawFromWallet,
    reviewsFor, setDefaultFeePercent, updatePaymentSettings, overrideContractStatus, forceRefund, resetData, freelancers, establishments, nearbyFreelancers, categoryById,
    adminTab, setAdminTab, adminMode, exitAdminMode, enterAdminMode,
    coupons, validateCoupon, addCoupon, toggleCoupon, deleteCoupon, applyCouponToPurchase,
    auditLogs, logAdminAction, adminCreateUser, adminCreateAdmin, adminRemoveAdmin, adjustWallet, deleteReview, broadcastNotification,
    updateVipPlan, addVipPlan, removeVipPlan, updateEstVipPlan, addEstVipPlan, removeEstVipPlan,
  ]);

  if (!loaded || !data) {
    return <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white"><div className="animate-pulse text-sm">Carregando FreelaAgora…</div></div>;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
