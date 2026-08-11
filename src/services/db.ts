import { supabase } from '@/lib/supabase';
import { CATEGORIES, VIP_PLANS, EST_VIP_PLANS } from '@/mockData';
import { emptyAvailability } from '@/mockData';
import type {
  User, Job, Contract, WalletTx, AppNotification, Review,
  AppData, WeekAvailability, DateAvailability, DayKey, Tier, EstTier,
  PaymentSettings, PaymentProviderId, PaymentProviderConfig, VipPlan, EstVipPlan,
} from '@/types';

const DAY_KEYS: DayKey[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DAY_INDEX: Record<DayKey, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
const INDEX_TO_DAY: Record<number, DayKey> = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  user_type: string;
  full_name: string;
  photo_url: string | null;
  document_cpf: string | null;
  document_cnpj: string | null;
  whatsapp: string;
  phone_contact: string | null;
  city: string;
  state: string;
  banned: boolean;
  created_at: string;
  nickname: string | null;
  document_verified: boolean;
  terms_acceptance_json: Record<string, unknown> | null;
  last_admin_edit: string | null;
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_lat: number | null;
  address_lng: number | null;
  service_radius_km: number | null;
  accepts_interstate: boolean;
  establishment_type: string | null;
  bio: string | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  pix_key: string | null;
  asaas_wallet_id: string | null;
  rating_average: number;
  reviews_count: number;
  completed_shifts: number;
  vip_tier: string;
  est_vip_tier: string;
  vip_expires_at: string | null;
  est_vip_expires_at: string | null;
  wallet_balance: number;
  is_admin: boolean;
  admin_role: string | null;
  trial_ends_at: string | null;
  ad_images: string[] | null;
  home_ads: string[] | null;
  home_links: string[] | null;
  freelancer_ads: string[] | null;
  freelancer_links: string[] | null;
  establishment_ads: string[] | null;
  establishment_links: string[] | null;
  freelancer_ads_by_slot?: string[][] | null;
  establishment_ads_by_slot?: string[][] | null;
  freelancer_links_by_slot?: string[][] | null;
  establishment_links_by_slot?: string[][] | null;
  allowed_freelancer_slots?: number[] | null;
  allowed_establishment_slots?: number[] | null;
  include_freelancer_ad?: boolean;
  include_establishment_ad?: boolean;
}

export interface DbFreelancerProfile {
  user_id: string;
  bio: string | null;
  specialties: string[] | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  pix_key: string | null;
  vip_plan_id: number | null;
  vip_expires_at: string | null;
  rating_average: number;
  reviews_count: number;
  completed_shifts: number;
  wallet_balance: number;
  is_verified: boolean;
  service_radius_km: number | null;
  accepts_interstate: boolean;
}

export interface DbEstablishmentProfile {
  user_id: string;
  company_description: string | null;
  establishment_type: string | null;
  address: string | null;
  vip_plan_id: number | null;
  vip_expires_at: string | null;
  rating_average: number;
  reviews_count: number;
  wallet_balance: number;
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_lat: number | null;
  address_lng: number | null;
}

export interface DbFreelancerCategory {
  freelancer_id: string;
  category_id: number;
}

export interface DbFreelancerAvailability {
  id: string;
  freelancer_id: string;
  day_of_week: number;
  shift_morning: boolean;
  shift_afternoon: boolean;
  shift_night: boolean;
  specific_date: string | null;
}

export interface DbContract {
  id: string;
  establishment_id: string;
  freelancer_id: string;
  job_id: string | null;
  contract_date: string;
  shifts_contracted: string;
  hours_contracted: number;
  total_freelancer_value: number;
  platform_fee_percentage: number;
  platform_fee_value: number;
  total_amount_paid: number;
  status: string;
  cora_invoice_id: string | null;
  created_at: string;
  category: string | null;
  freelancer_name: string | null;
  establishment_name: string | null;
  freelancer_photo: string | null;
  freelancer_phone: string | null;
  freelancer_whatsapp: string | null;
  review_from_establishment_id: string | null;
  review_from_freelancer_id: string | null;
}

export interface DbContractEvent {
  id: string;
  contract_id: string;
  status: string;
  note: string | null;
  created_at: string;
}

export interface DbContractReview {
  id: string;
  contract_id: string;
  from_user_id: string;
  to_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface DbWalletTx {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string | null;
  contract_id: string | null;
  created_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  contract_id: string | null;
  created_at: string;
}

export interface DbJob {
  id: string;
  establishment_id: string;
  category_id: number | null;
  title: string;
  description: string | null;
  job_date: string;
  start_time: string;
  hours: number;
  value: number;
  urgency: string;
  status: string;
  city: string | null;
  state: string | null;
  created_at: string;
  establishment_name: string | null;
  establishment_photo: string | null;
}

export interface DbJobApplicant {
  job_id: string;
  freelancer_id: string;
  created_at: string;
}

export interface DbCoupon {
  id: number;
  code: string;
  discount_percentage: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface DbAuditLog {
  id: string;
  admin_id: string | null;
  action_performed: string;
  target_user_id: string | null;
  created_at: string;
}

const STATUS_TO_DB: Record<string, string> = {
  requested: 'pending_admin_check',
  confirmed: 'accepted_by_freela',
  paid: 'paid_escrow',
  check_in_pending: 'check_in_pending',
  checked_in: 'check_in_done',
  completed: 'completed_split',
  cancelled: 'canceled',
};

const STATUS_FROM_DB: Record<string, string> = {
  pending_admin_check: 'requested',
  accepted_by_freela: 'confirmed',
  paid_escrow: 'paid',
  check_in_pending: 'check_in_pending',
  check_in_done: 'checked_in',
  completed_split: 'completed',
  canceled: 'cancelled',
};

function freelancerTierToId(tier: string): number {
  switch (tier) {
    case 'free': return 1;
    case 'vip1': return 2;
    case 'vip2': return 3;
    case 'vip3': return 4;
    case 'vip4': return 5;
    case 'vip5': return 6;
    case 'vip6': return 7;
    default: return 1;
  }
}

function establishmentTierToId(tier: string): number {
  switch (tier) {
    case 'trial': return 3;
    case 'free': return 4;
    case 'vip1': return 5;
    case 'vip2': return 6;
    case 'vip3': return 7;
    case 'vip4': return 8;
    case 'vip5': return 9;
    case 'vip6': return 10;
    default: return 4;
  }
}

function categorySlugToId(slug: string): number {
  const index = CATEGORIES.findIndex((c) => c.id === slug);
  if (index === -1) return 1;
  return index + 1;
}

function categoryIdToSlug(id: number): string {
  if (id >= 1 && id <= CATEGORIES.length) {
    return CATEGORIES[id - 1].id;
  }
  return 'geral';
}

function mapAvailabilityRows(rows: DbFreelancerAvailability[], freelancerId: string): { availability: WeekAvailability; dateAvailability: DateAvailability } {
  const availability = emptyAvailability();
  const dateAvailability: DateAvailability = {};

  rows.filter((r) => r.freelancer_id === freelancerId).forEach((r) => {
    const shifts = { manha: r.shift_morning, tarde: r.shift_afternoon, noite: r.shift_night };
    if (r.specific_date) {
      dateAvailability[r.specific_date] = shifts;
      return;
    }
    const day = INDEX_TO_DAY[r.day_of_week];
    if (day) availability[day] = shifts;
  });

  return { availability, dateAvailability };
}

function mapDbUserToUser(
  row: DbUser,
  flProfile?: DbFreelancerProfile | null,
  esProfile?: DbEstablishmentProfile | null,
  categories?: string[],
  availability?: WeekAvailability,
  dateAvailability?: DateAvailability,
): User {
  const address = {
    cep: esProfile?.address_cep ?? row.address_cep ?? '',
    street: esProfile?.address_street ?? row.address_street ?? '',
    number: esProfile?.address_number ?? row.address_number ?? '',
    complement: esProfile?.address_complement ?? row.address_complement,
    neighborhood: esProfile?.address_neighborhood ?? row.address_neighborhood ?? '',
    city: esProfile?.address_city ?? row.city,
    state: esProfile?.address_state ?? row.state,
    lat: esProfile?.address_lat ?? row.address_lat ?? undefined,
    lng: esProfile?.address_lng ?? row.address_lng ?? undefined,
  };

  const isFreelancer = row.user_type === 'freelancer' || (row.user_type === 'admin' && !row.establishment_type);
  const isEstablishment = row.user_type === 'establishment';

  return {
    id: row.id,
    accountType: row.user_type === 'admin' ? 'freelancer' : (row.user_type as 'freelancer' | 'establishment'),
    email: row.email,
    password: row.password_hash ?? '',
    name: row.full_name,
    nickname: row.nickname ?? undefined,
    photo: row.photo_url ?? '',
    phone: row.phone_contact ?? row.whatsapp ?? '',
    whatsapp: row.whatsapp,
    address,
    cpf: row.document_cpf ?? undefined,
    cnpj: row.document_cnpj ?? undefined,
    asaasWalletId: row.asaas_wallet_id ?? undefined,
    bio: flProfile?.bio ?? row.bio ?? undefined,
    specialties: flProfile?.specialties ?? undefined,
    hourlyRate: flProfile?.hourly_rate ?? row.hourly_rate ?? undefined,
    dailyRate: flProfile?.daily_rate ?? row.daily_rate ?? undefined,
    pixKey: flProfile?.pix_key ?? row.pix_key ?? undefined,
    rating: row.rating_average ?? flProfile?.rating_average ?? (esProfile?.rating_average ?? 0),
    reviewsCount: row.reviews_count ?? flProfile?.reviews_count ?? (esProfile?.reviews_count ?? 0),
    completedShifts: row.completed_shifts ?? flProfile?.completed_shifts ?? 0,
    vipTier: isFreelancer ? (row.vip_tier as Tier) : undefined,
    vipExpiresAt: isFreelancer ? (row.vip_expires_at ?? undefined) : undefined,
    categories: isFreelancer ? (categories ?? []) : undefined,
    availability: isFreelancer ? (availability ?? emptyAvailability()) : undefined,
    dateAvailability: isFreelancer ? (dateAvailability ?? undefined) : undefined,
    walletBalance: row.wallet_balance ?? flProfile?.wallet_balance ?? esProfile?.wallet_balance ?? 0,
    documentVerified: row.document_verified ?? flProfile?.is_verified ?? false,
    serviceRadiusKm: flProfile?.service_radius_km ?? row.service_radius_km ?? undefined,
    acceptsInterstate: flProfile?.accepts_interstate ?? row.accepts_interstate ?? false,
    establishmentType: isEstablishment ? (esProfile?.establishment_type ?? row.establishment_type ?? undefined) : undefined,
    estVipTier: isEstablishment ? (row.est_vip_tier as EstTier) : undefined,
    estVipExpiresAt: isEstablishment ? (row.est_vip_expires_at ?? undefined) : undefined,
    trialEndsAt: isEstablishment ? (row.trial_ends_at ?? undefined) : undefined,
    isAdmin: row.is_admin ?? row.user_type === 'admin',
    adminRole: row.admin_role === 'super' || row.admin_role === 'regular' ? row.admin_role : undefined,
    banned: row.banned ?? false,
    termsAcceptance: row.terms_acceptance_json as { timestamp: string; ip: string; userAgent: string; legalVersion: string } | undefined,
    lastAdminEdit: row.last_admin_edit ?? undefined,
    createdAt: row.created_at,
    adImages: row.ad_images ?? row.home_ads ?? [],
    homeAds: row.home_ads ?? row.ad_images ?? [],
    homeLinks: row.home_links ?? [],
    freelancerAds: row.freelancer_ads ?? [],
    freelancerLinks: row.freelancer_links ?? [],
    establishmentAds: row.establishment_ads ?? [],
    establishmentLinks: row.establishment_links ?? [],
    freelancerAdsBySlot: row.freelancer_ads_by_slot ?? [],
    establishmentAdsBySlot: row.establishment_ads_by_slot ?? [],
    freelancerLinksBySlot: row.freelancer_links_by_slot ?? [],
    establishmentLinksBySlot: row.establishment_links_by_slot ?? [],
    allowedFreelancerSlots: row.allowed_freelancer_slots ?? [],
    allowedEstablishmentSlots: row.allowed_establishment_slots ?? [],
    includeFreelancerAd: row.include_freelancer_ad ?? false,
    includeEstablishmentAd: row.include_establishment_ad ?? false,
  };
}

function mapUserToDbUser(user: User): Partial<DbUser> {
  return {
    id: user.id,
    email: user.email,
    password_hash: user.password,
    user_type: user.isAdmin ? 'admin' : user.accountType,
    full_name: user.name,
    photo_url: user.photo,
    document_cpf: user.cpf ?? null,
    document_cnpj: user.cnpj ?? null,
    whatsapp: user.whatsapp,
    phone_contact: user.phone,
    city: user.address.city,
    state: user.address.state,
    banned: user.banned ?? false,
    nickname: user.nickname ?? null,
    document_verified: user.documentVerified ?? false,
    terms_acceptance_json: (user.termsAcceptance as Record<string, unknown>) ?? null,
    last_admin_edit: user.lastAdminEdit ?? null,
    address_cep: user.address.cep ?? null,
    address_street: user.address.street ?? null,
    address_number: user.address.number ?? null,
    address_complement: user.address.complement ?? null,
    address_neighborhood: user.address.neighborhood ?? null,
    address_lat: user.address.lat ?? null,
    address_lng: user.address.lng ?? null,
    service_radius_km: user.serviceRadiusKm ?? null,
    accepts_interstate: user.acceptsInterstate ?? false,
    establishment_type: user.establishmentType ?? null,
    bio: user.bio ?? null,
    hourly_rate: user.hourlyRate ?? null,
    daily_rate: user.dailyRate ?? null,
    pix_key: user.pixKey ?? null,
    asaas_wallet_id: user.asaasWalletId ?? null,
    rating_average: user.rating ?? 0,
    reviews_count: user.reviewsCount ?? 0,
    completed_shifts: user.completedShifts ?? 0,
    vip_tier: user.vipTier ?? 'free',
    est_vip_tier: user.estVipTier ?? 'free',
    vip_expires_at: user.vipExpiresAt ?? null,
    est_vip_expires_at: user.estVipExpiresAt ?? null,
    wallet_balance: user.walletBalance ?? 0,
    is_admin: user.isAdmin ?? false,
    admin_role: user.adminRole ?? null,
    trial_ends_at: user.trialEndsAt ?? null,
    ad_images: user.adImages ?? user.homeAds ?? [],
    home_ads: user.homeAds ?? user.adImages ?? [],
    home_links: user.homeLinks ?? [],
    freelancer_ads: user.freelancerAds ?? [],
    freelancer_links: user.freelancerLinks ?? [],
    establishment_ads: user.establishmentAds ?? [],
    establishment_links: user.establishmentLinks ?? [],
    freelancer_ads_by_slot: user.freelancerAdsBySlot ?? [],
    establishment_ads_by_slot: user.establishmentAdsBySlot ?? [],
    freelancer_links_by_slot: user.freelancerLinksBySlot ?? [],
    establishment_links_by_slot: user.establishmentLinksBySlot ?? [],
    allowed_freelancer_slots: user.allowedFreelancerSlots ?? [],
    allowed_establishment_slots: user.allowedEstablishmentSlots ?? [],
    include_freelancer_ad: user.includeFreelancerAd ?? false,
    include_establishment_ad: user.includeEstablishmentAd ?? false,
  };
}

function mapUserToFlProfile(user: User): Partial<DbFreelancerProfile> {
  return {
    user_id: user.id,
    bio: user.bio ?? null,
    specialties: user.specialties ?? null,
    hourly_rate: user.hourlyRate ?? 0,
    daily_rate: user.dailyRate ?? 0,
    pix_key: user.pixKey ?? null,
    vip_plan_id: user.vipTier ? freelancerTierToId(user.vipTier) : 1,
    vip_expires_at: user.vipExpiresAt ?? null,
    rating_average: user.rating ?? 5,
    reviews_count: user.reviewsCount ?? 0,
    completed_shifts: user.completedShifts ?? 0,
    wallet_balance: user.walletBalance ?? 0,
    is_verified: user.documentVerified ?? false,
    service_radius_km: user.serviceRadiusKm ?? 25,
    accepts_interstate: user.acceptsInterstate ?? false,
  };
}

function mapUserToEsProfile(user: User): Partial<DbEstablishmentProfile> {
  return {
    user_id: user.id,
    company_description: user.bio ?? null,
    establishment_type: user.establishmentType ?? null,
    address: `${user.address.street}, ${user.address.number}`,
    vip_plan_id: user.estVipTier ? establishmentTierToId(user.estVipTier) : 4,
    vip_expires_at: user.estVipExpiresAt ?? null,
    rating_average: user.rating ?? 0,
    reviews_count: user.reviewsCount ?? 0,
    wallet_balance: user.walletBalance ?? 0,
    address_cep: user.address.cep ?? null,
    address_street: user.address.street ?? null,
    address_number: user.address.number ?? null,
    address_complement: user.address.complement ?? null,
    address_neighborhood: user.address.neighborhood ?? null,
    address_city: user.address.city ?? null,
    address_state: user.address.state ?? null,
    address_lat: user.address.lat ?? null,
    address_lng: user.address.lng ?? null,
  };
}

export async function loadAllData(): Promise<AppData> {
  const [
    usersRes, flProfilesRes, esProfilesRes, flCategoriesRes, flAvailRes,
    contractsRes, eventsRes, contractReviewsRes, walletRes, notifRes,
    jobsRes, applicantsRes, couponsRes, auditRes, configRes, paymentRes,
    vipFlRes, vipEsRes,
  ] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('freelancer_profiles').select('*'),
    supabase.from('establishment_profiles').select('*'),
    supabase.from('freelancer_categories').select('*'),
    supabase.from('freelancer_availability').select('*'),
    supabase.from('contracts').select('*'),
    supabase.from('contract_events').select('*'),
    supabase.from('contract_reviews').select('*'),
    supabase.from('wallet_transactions').select('*'),
    supabase.from('notifications').select('*'),
    supabase.from('jobs').select('*'),
    supabase.from('job_applicants').select('*'),
    supabase.from('discount_coupons').select('*'),
    supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }),
    supabase.from('platform_config').select('*').limit(1).maybeSingle(),
    supabase.from('payment_settings').select('*').limit(1).maybeSingle(),
    supabase.from('vip_plans_freelancer').select('*'),
    supabase.from('vip_plans_establishment').select('*'),
  ]);

  const usersRows = (usersRes.data ?? []) as unknown as DbUser[];
  const flProfiles = (flProfilesRes.data ?? []) as unknown as DbFreelancerProfile[];
  const esProfiles = (esProfilesRes.data ?? []) as unknown as DbEstablishmentProfile[];
  const flCategories = (flCategoriesRes.data ?? []) as unknown as DbFreelancerCategory[];
  const availabilityRows = (flAvailRes.data ?? []) as unknown as DbFreelancerAvailability[];
  const contractsRows = (contractsRes.data ?? []) as unknown as DbContract[];
  const eventsRows = (eventsRes.data ?? []) as unknown as DbContractEvent[];
  const contractReviewsRows = (contractReviewsRes.data ?? []) as unknown as DbContractReview[];
  const walletRows = (walletRes.data ?? []) as unknown as DbWalletTx[];
  const notifRows = (notifRes.data ?? []) as unknown as DbNotification[];
  const jobsRows = (jobsRes.data ?? []) as unknown as DbJob[];
  const applicantsRows = (applicantsRes.data ?? []) as unknown as DbJobApplicant[];
  const auditRows = (auditRes.data ?? []) as unknown as DbAuditLog[];

  const users: User[] = usersRows.map((row) => {
    const flProfile = flProfiles.find((p) => p.user_id === row.id);
    const esProfile = esProfiles.find((p) => p.user_id === row.id);
    const userCatIds = flCategories.filter((c) => c.freelancer_id === row.id).map((c) => categoryIdToSlug(c.category_id));
    const userAvail = mapAvailabilityRows(availabilityRows, row.id);
    return mapDbUserToUser(row, flProfile, esProfile, userCatIds, userAvail.availability, userAvail.dateAvailability);
  });

  const eventsByContract = new Map<string, DbContractEvent[]>();
  for (const e of eventsRows) {
    const arr = eventsByContract.get(e.contract_id) ?? [];
    arr.push(e);
    eventsByContract.set(e.contract_id, arr);
  }

  const contracts: Contract[] = contractsRows.map((row) =>
    mapDbContractToContract(row, eventsByContract.get(row.id) ?? [], contractReviewsRows),
  );

  const applicantsByJob = new Map<string, string[]>();
  for (const a of applicantsRows) {
    const arr = applicantsByJob.get(a.job_id) ?? [];
    arr.push(a.freelancer_id);
    applicantsByJob.set(a.job_id, arr);
  }

  const jobs: Job[] = jobsRows.map((row) => mapDbJobToJob(row, applicantsByJob.get(row.id) ?? []));

  const walletTxs: WalletTx[] = walletRows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type as WalletTx['type'],
    amount: Number(row.amount),
    description: row.description ?? '',
    contractId: row.contract_id ?? undefined,
    date: row.created_at,
  }));

  const notifications: AppNotification[] = notifRows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type as AppNotification['type'],
    title: row.title,
    body: row.body ?? '',
    read: row.read,
    date: row.created_at,
    contractId: row.contract_id ?? undefined,
  }));

  const reviews: Review[] = contractReviewsRows.map((row) => {
    const fromUser = users.find((u) => u.id === row.from_user_id);
    return {
      id: row.id,
      fromId: row.from_user_id,
      fromName: fromUser?.name ?? '',
      toId: row.to_user_id,
      rating: row.rating,
      comment: row.comment ?? '',
      date: row.created_at,
    };
  });

  const coupons = couponsRes.data ? couponsRes.data.map((row: any) => ({
    id: String(row.id),
    code: row.code,
    discountPercentage: Number(row.discount_percentage),
    isActive: row.is_active,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
  })) : [];

  const adminAuditLogs = auditRows.map((row) => ({
    id: row.id,
    adminId: row.admin_id ?? '',
    action: row.action_performed,
    targetUserId: row.target_user_id ?? undefined,
    createdAt: row.created_at,
  }));

  const vipPlans: VipPlan[] = VIP_PLANS.map(plan => {
    const targetId = freelancerTierToId(plan.tier);
    const dbPlan = vipFlRes.data?.find((p: any) => p.id === targetId);
    if (dbPlan) {
      return {
        ...plan,
        label: dbPlan.name || plan.label,
        maxCategories: dbPlan.max_categories ?? plan.maxCategories,
        prices: {
          monthly: Number(dbPlan.monthly_price ?? plan.prices.monthly),
          semestral: Number(dbPlan.semestral_price ?? plan.prices.semestral),
          annual: Number(dbPlan.annual_price ?? plan.prices.annual),
        },
        badge: dbPlan.badge_type || plan.badge,
        features: dbPlan.features || plan.features,
      };
    }
    return plan;
  });

  const estVipPlans: EstVipPlan[] = EST_VIP_PLANS.map(plan => {
    const dbPlan = vipEsRes.data?.find((p: any) => 
      p.id === establishmentTierToId(plan.tier) || 
      p.name?.toLowerCase().includes(plan.label.toLowerCase()) ||
      p.name?.toLowerCase().includes(plan.tier.toLowerCase())
    );
    if (dbPlan) {
      return {
        ...plan,
        label: dbPlan.name || plan.label,
        intermediationFee: Number(dbPlan.intermediation_fee_percentage ?? dbPlan.intermediationFee ?? plan.intermediationFee),
        prices: {
          monthly: Number(dbPlan.monthly_price ?? plan.prices.monthly),
          semestral: Number(dbPlan.semestral_price ?? plan.prices.semestral),
          annual: Number(dbPlan.annual_price ?? plan.prices.annual),
        },
        allowAds: Boolean(dbPlan.allow_ads ?? plan.allowAds ?? false),
        maxAds: Number(dbPlan.max_ads ?? plan.maxAds ?? 0),
        priceSlot1: Number(dbPlan.price_slot_1 ?? plan.priceSlot1 ?? 30),
        priceSlot2: Number(dbPlan.price_slot_2 ?? plan.priceSlot2 ?? 25),
        priceSlot3: Number(dbPlan.price_slot_3 ?? plan.priceSlot3 ?? 20),
        features: dbPlan.features || plan.features,
      };
    }
    return plan;
  });

  let paymentSettings: PaymentSettings = { activeProvider: 'asaas', configs: {} };
  if (paymentRes.data) {
    const ps = paymentRes.data as { active_provider: string; configs: Record<string, unknown> };
    const configs: Partial<Record<PaymentProviderId, PaymentProviderConfig>> = {};
    if (ps.configs) {
      for (const [key, val] of Object.entries(ps.configs)) {
        if (val && typeof val === 'object') {
          const v = val as { apiKey?: string; env?: string };
          configs[key as PaymentProviderId] = {
            apiKey: v.apiKey ?? '',
            env: (v.env as 'sandbox' | 'production') ?? 'sandbox',
          };
        }
      }
    }
    paymentSettings = {
      activeProvider: (ps.active_provider as PaymentProviderId) ?? 'asaas',
      configs,
    };
  }

  return {
    users,
    jobs,
    contracts,
    walletTxs,
    notifications,
    reviews,
    coupons,
    adminAuditLogs,
    config: { defaultFeePercent: configRes.data ? Number((configRes.data as { default_fee_percent: number }).default_fee_percent) : 15.0 },
    paymentSettings,
    currentUserId: null,
    vipPlans,
    estVipPlans,
  };
}

export async function dbInsertUser(user: User): Promise<void> {
  const dbUser = mapUserToDbUser(user);
  const { error } = await supabase.from('users').insert(dbUser as never);
  if (error) throw new Error(`Erro ao inserir usuário: ${error.message}`);

  if (user.accountType === 'freelancer') {
    const flProfile = mapUserToFlProfile(user);
    const { error: e2 } = await supabase.from('freelancer_profiles').insert(flProfile as never);
    if (e2) throw new Error(`Erro ao inserir perfil freelancer: ${e2.message}`);
  } else if (user.accountType === 'establishment') {
    const esProfile = mapUserToEsProfile(user);
    const { error: e2 } = await supabase.from('establishment_profiles').insert(esProfile as never);
    if (e2) throw new Error(`Erro ao inserir perfil estabelecimento: ${e2.message}`);
  }
}

export async function dbInsertAdmin(user: User): Promise<void> {
  await dbInsertUser(user);
}

export async function dbUpdateUser(id: string, patch: Partial<User>): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.full_name = patch.name;
  if (patch.email !== undefined) dbPatch.email = patch.email;
  if (patch.walletBalance !== undefined) dbPatch.wallet_balance = patch.walletBalance;

  if (Object.keys(dbPatch).length > 0) {
    const { error } = await supabase.from('users').update(dbPatch).eq('id', id);
    if (error) throw error;
  }

  if (patch.availability !== undefined || patch.dateAvailability !== undefined) {
    await dbSaveAvailability(id, patch.availability ?? emptyAvailability(), patch.dateAvailability ?? {});
  }
}

export async function dbDeleteUser(id: string): Promise<void> {
  await supabase.from('users').delete().eq('id', id);
}

export async function dbInsertJob(job: Job): Promise<void> {
  const row = mapJobToDbRow(job);
  await supabase.from('jobs').insert(row as never);
}

export async function dbUpdateJob(id: string, patch: Partial<Job>): Promise<void> {
  const updateRow: Record<string, unknown> = {};
  if (patch.status !== undefined) updateRow.status = patch.status;
  if (Object.keys(updateRow).length > 0) {
    await supabase.from('jobs').update(updateRow).eq('id', id);
  }
}

export async function dbDeleteJob(id: string): Promise<void> {
  await supabase.from('jobs').delete().eq('id', id);
}

export async function dbApplyToJob(jobId: string, freelancerId: string): Promise<void> {
  const { error } = await supabase.from('job_applicants').upsert(
    { job_id: jobId, freelancer_id: freelancerId } as never,
    { onConflict: 'job_id,freelancer_id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function dbSaveAvailability(userId: string, availability: WeekAvailability, dateAvailability: DateAvailability): Promise<void> {
  const rows = [
    ...DAY_KEYS.map((day) => ({
      freelancer_id: userId,
      day_of_week: DAY_INDEX[day],
      shift_morning: availability[day]?.manha ?? false,
      shift_afternoon: availability[day]?.tarde ?? false,
      shift_night: availability[day]?.noite ?? false,
      specific_date: null as string | null,
    })),
    ...Object.entries(dateAvailability).map(([specificDate, shifts]) => ({
      freelancer_id: userId,
      day_of_week: new Date(`${specificDate}T00:00:00Z`).getUTCDay(),
      shift_morning: shifts.manha,
      shift_afternoon: shifts.tarde,
      shift_night: shifts.noite,
      specific_date: specificDate,
    })),
  ];

  const { error: deleteError } = await supabase.from('freelancer_availability').delete().eq('freelancer_id', userId);
  if (deleteError) throw deleteError;
  const { error: insertError } = await supabase.from('freelancer_availability').insert(rows as never);
  if (insertError) throw insertError;
}

export async function dbInsertContract(contract: Contract): Promise<void> {
  const row = mapContractToDbRow(contract);
  const { error } = await supabase.from('contracts').insert(row as never);
  if (error) throw error;

  if (contract.jobId) {
    const { error: applicantError } = await supabase.from('job_applicants')
      .delete()
      .match({ job_id: contract.jobId, freelancer_id: contract.freelancerId });
    if (applicantError) throw applicantError;

    const { error: jobError } = await supabase.from('jobs')
      .update({ status: 'closed' })
      .eq('id', contract.jobId);
    if (jobError) throw jobError;
  }
}

export async function dbUpdateContractStatus(contractId: string, status: string, note?: string): Promise<void> {
  const dbStatus = STATUS_TO_DB[status] ?? status;
  const { error: updateError } = await supabase.from('contracts').update({ status: dbStatus }).eq('id', contractId);
  if (updateError) throw updateError;
  const { error: eventError } = await supabase.from('contract_events').insert({
    contract_id: contractId,
    status: dbStatus,
    note: note ?? null,
  } as never);
  if (eventError) throw eventError;
}

export async function dbUpdateContractInvoice(contractId: string, invoiceId: string): Promise<void> {
  await supabase.from('contracts').update({ cora_invoice_id: invoiceId }).eq('id', contractId);
}

export async function dbInsertWalletTx(tx: WalletTx): Promise<void> {
  await supabase.from('wallet_transactions').insert({
    id: tx.id,
    user_id: tx.userId,
    type: tx.type,
    amount: tx.amount,
    description: tx.description,
    contract_id: tx.contractId ?? null,
    created_at: tx.date,
  } as never);
}

export async function dbUpdateWalletBalance(userId: string, newBalance: number): Promise<void> {
  await supabase.rpc('admin_update_wallet_balance', {
    p_user_id: userId,
    p_wallet_balance: newBalance
  });
}

export async function dbInsertNotification(n: AppNotification): Promise<void> {
  await supabase.from('notifications').insert({
    id: n.id,
    user_id: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.read,
    contract_id: n.contractId ?? null,
    created_at: n.date,
  } as never);
}

export async function dbMarkNotificationRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function dbMarkAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
}

export async function dbInsertReview(review: Review, contractId: string, fromEstablishment: boolean): Promise<void> {
  const { data } = await supabase.from('contract_reviews').insert({
    id: review.id,
    contract_id: contractId,
    from_user_id: review.fromId,
    to_user_id: review.toId,
    rating: review.rating,
    comment: review.comment,
    created_at: review.date,
  } as never).select().single();
  if (data) {
    const updateCol = fromEstablishment ? 'review_from_establishment_id' : 'review_from_freelancer_id';
    await supabase.from('contracts').update({ [updateCol]: (data as { id: string }).id }).eq('id', contractId);
  }
}

export async function dbDeleteReview(reviewId: string): Promise<void> {
  await supabase.from('contract_reviews').delete().eq('id', reviewId);
}

export async function dbInsertCoupon(coupon: any): Promise<void> {
  await supabase.from('discount_coupons').insert(coupon as never);
}

export async function dbToggleCoupon(id: string): Promise<void> {
  const { data } = await supabase.from('discount_coupons').select('is_active').eq('id', Number(id)).single();
  if (data) {
    await supabase.from('discount_coupons').update({ is_active: !(data as { is_active: boolean }).is_active }).eq('id', Number(id));
  }
}

export async function dbDeleteCoupon(id: string): Promise<void> {
  await supabase.from('discount_coupons').delete().eq('id', Number(id));
}

export async function dbInsertAuditLog(log: any): Promise<void> {
  await supabase.from('admin_audit_logs').insert({
    id: log.id,
    admin_id: log.adminId,
    action_performed: log.action,
    target_user_id: log.targetUserId ?? null,
    created_at: log.createdAt,
  } as never);
}

export async function dbUpdateDefaultFeePercent(value: number): Promise<void> {
  await supabase.from('platform_config').update({ default_fee_percent: value }).eq('id', 1);
}

export async function dbUpdatePaymentSettings(settings: PaymentSettings): Promise<void> {
  await supabase.from('payment_settings').update({
    active_provider: settings.activeProvider,
    configs: settings.configs,
    updated_at: new Date().toISOString(),
  }).eq('id', 1);
}

export async function dbUpsertVipPlan(plan: any): Promise<void> {
  await supabase.from('vip_plans_freelancer').upsert(plan as never);
}

export async function dbDeleteVipPlan(tier: string): Promise<void> {
  const numericId = freelancerTierToId(tier);
  await supabase.from('vip_plans_freelancer').delete().eq('id', numericId);
}

export async function dbUpsertEstVipPlan(plan: any): Promise<void> {
  await supabase.from('vip_plans_establishment').upsert(plan as never);
}

export async function dbDeleteEstVipPlan(tier: string): Promise<void> {
  const numericId = establishmentTierToId(tier);
  await supabase.from('vip_plans_establishment').delete().eq('id', numericId);
}

function mapDbContractToContract(row: DbContract, events: DbContractEvent[], reviews: DbContractReview[]): Contract {
  return {
    id: row.id,
    jobId: row.job_id,
    establishmentId: row.establishment_id,
    establishmentName: row.establishment_name ?? '',
    freelancerId: row.freelancer_id,
    freelancerName: row.freelancer_name ?? '',
    freelancerPhoto: row.freelancer_photo ?? '',
    freelancerPhone: row.freelancer_phone ?? '',
    freelancerWhatsapp: row.freelancer_whatsapp ?? '',
    category: row.category ?? 'geral',
    date: row.contract_date,
    hours: row.hours_contracted,
    freelancerFee: Number(row.total_freelancer_value),
    platformFeePercentage: Number(row.platform_fee_percentage),
    platformFee: Number(row.platform_fee_value),
    total: Number(row.total_amount_paid),
    status: (STATUS_FROM_DB[row.status] ?? 'requested') as Contract['status'],
    coraInvoiceId: row.cora_invoice_id ?? undefined,
    createdAt: row.created_at,
    history: events.map((e) => ({
      status: (STATUS_FROM_DB[e.status] ?? 'requested') as Contract['status'],
      at: e.created_at,
      note: e.note ?? undefined,
    })),
  };
}

function mapContractToDbRow(c: Contract): Partial<DbContract> {
  return {
    id: c.id,
    establishment_id: c.establishmentId,
    freelancer_id: c.freelancerId,
    job_id: c.jobId,
    contract_date: c.date.slice(0, 10),
    shifts_contracted: 'manha',
    hours_contracted: c.hours,
    total_freelancer_value: c.freelancerFee,
    platform_fee_percentage: c.platformFeePercentage,
    platform_fee_value: c.platformFee,
    total_amount_paid: c.total,
    status: STATUS_TO_DB[c.status] ?? 'pending_admin_check',
    cora_invoice_id: c.coraInvoiceId ?? null,
    created_at: c.createdAt,
    category: c.category,
    freelancer_name: c.freelancerName,
    establishment_name: c.establishmentName,
    freelancer_photo: c.freelancerPhoto,
    freelancer_phone: c.freelancerPhone,
    freelancer_whatsapp: c.freelancerWhatsapp,
  };
}

function mapDbJobToJob(row: DbJob, applicants: string[]): Job {
  return {
    id: row.id,
    establishmentId: row.establishment_id,
    establishmentName: row.establishment_name ?? '',
    establishmentPhoto: row.establishment_photo ?? '',
    category: row.category_id ? categoryIdToSlug(row.category_id) : 'geral',
    title: row.title,
    description: row.description ?? '',
    date: row.job_date,
    startTime: row.start_time,
    hours: row.hours,
    value: Number(row.value),
    urgency: (row.urgency as Job['urgency']) ?? 'esta_semana',
    status: (row.status as Job['status']) ?? 'active',
    city: row.city ?? '',
    state: row.state ?? '',
    applicants,
    createdAt: row.created_at,
  };
}

function mapJobToDbRow(j: Job): Partial<DbJob> {
  return {
    id: j.id,
    establishment_id: j.establishmentId,
    category_id: categorySlugToId(j.category),
    title: j.title,
    description: j.description,
    job_date: j.date ? j.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    start_time: j.startTime,
    hours: j.hours,
    value: j.value,
    urgency: j.urgency,
    status: j.status,
    city: j.city,
    state: j.state,
    created_at: j.createdAt || new Date().toISOString(),
    establishment_name: j.establishmentName,
    establishment_photo: j.establishmentPhoto,
  };
}
