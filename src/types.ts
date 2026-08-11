// ============================================================
// FreelaAgora — Domain Types (enterprise freelance marketplace)
// ============================================================

export type Tier = 'free' | 'vip1' | 'vip2' | 'vip3' | 'vip4' | 'vip5' | 'vip6';
export type EstTier = 'free' | 'trial' | 'vip1' | 'vip2' | 'vip3' | 'vip4' | 'vip5' | 'vip6';
export type Period = 'monthly' | 'semestral' | 'annual';
export type AccountType = 'freelancer' | 'establishment';

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  lat?: number;
  lng?: number;
}

export interface TermsAcceptance {
  timestamp: string;
  ip: string;
  userAgent: string;
  legalVersion: string;
}

export interface User {
  id: string;
  accountType: AccountType;
  email: string;
  password: string;
  name: string;
  nickname?: string;
  photo: string;
  phone: string;
  whatsapp: string;
  address: Address;
  // Freelancer-only
  cpf?: string;
  cnpj?: string;
  gender?: 'Masculino' | 'Feminino' | 'Outro';
  asaasWalletId?: string;
  bio?: string;
  specialties?: string[];
  hourlyRate?: number;
  dailyRate?: number;
  pixKey?: string;
  rating?: number;
  reviewsCount?: number;
  completedShifts?: number;
  vipTier?: Tier;
  vipExpiresAt?: string;
  categories?: string[];
  availability?: WeekAvailability;
  dateAvailability?: DateAvailability;
  walletBalance?: number;
  documentVerified?: boolean;
  serviceRadiusKm?: number;
  acceptsInterstate?: boolean;
  // Establishment-only
  establishmentType?: string;
  estVipTier?: EstTier;
  estVipExpiresAt?: string;
  trialEndsAt?: string;
  adImages?: string[]; // Compatibilidade legada
  homeAds?: string[];
  homeLinks?: string[];
  freelancerAds?: string[];
  freelancerLinks?: string[];
  establishmentAds?: string[];
  establishmentLinks?: string[];
  allowedFreelancerSlots?: number[];
  allowedEstablishmentSlots?: number[];
  includeFreelancerAd?: boolean;
  includeEstablishmentAd?: boolean;
  // Admin-only
  isAdmin?: boolean;
  adminRole?: 'super' | 'regular';
  banned?: boolean;
  // Audit
  termsAcceptance?: TermsAcceptance;
  lastAdminEdit?: string;
  createdAt: string;
}

export type ShiftSlot = 'manha' | 'tarde' | 'noite';
export type WeekAvailability = Record<DayKey, Record<ShiftSlot, boolean>>;
export type DayKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
export type DateAvailability = Record<string, Record<ShiftSlot, boolean>>;

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  macro: string;
}

export interface MacroCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface SearchFilters {
  location: string;
  useGps: boolean;
  lat?: number;
  lng?: number;
  radiusKm: number;
  categoryId: string;
  dateFilter: 'today' | 'tomorrow' | 'custom' | 'any';
  customDate?: string;
}

export interface VipPlan {
  tier: Tier;
  label: string;
  maxCategories: number;
  features: string[];
  prices: Record<Period, number>;
  badge?: 'verified' | 'gold' | 'diamond';
  boost?: 'light' | 'top' | 'max';
}

export interface EstVipPlan {
  tier: EstTier;
  label: string;
  intermediationFee: number;
  maxActiveJobs: number;
  allowAds?: boolean;
  maxAds?: number;
  homeAdPrice?: number;
  freelancerAdPrice?: number;
  establishmentAdPrice?: number;
  priceSlot1?: number;
  priceSlot2?: number;
  priceSlot3?: number;
  features: string[];
  prices: Record<Period, number>;
}

export type JobStatus = 'active' | 'paused' | 'closed';
export type Urgency = 'hoje' | 'amanha' | 'esta_semana';

export interface Job {
  id: string;
  establishmentId: string;
  establishmentName: string;
  establishmentPhoto: string;
  category: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  hours: number;
  value: number;
  urgency: Urgency;
  status: JobStatus;
  city: string;
  state: string;
  applicants: string[];
  createdAt: string;
}

export type ContractStatus =
  | 'requested'
  | 'confirmed'
  | 'paid'
  | 'checked_in'
  | 'completed'
  | 'cancelled';

export interface Contract {
  id: string;
  jobId: string | null;
  establishmentId: string;
  establishmentName: string;
  freelancerId: string;
  freelancerName: string;
  freelancerPhoto: string;
  freelancerPhone: string;
  freelancerWhatsapp: string;
  category: string;
  date: string;
  hours: number;
  freelancerFee: number;
  platformFeePercentage: number;
  platformFee: number;
  total: number;
  status: ContractStatus;
  coraInvoiceId?: string;
  createdAt: string;
  history: ContractEvent[];
  reviewFromEstablishment?: Review;
  reviewFromFreelancer?: Review;
}

export interface ContractEvent {
  status: ContractStatus;
  at: string;
  note?: string;
}

export type TxType = 'deposit' | 'escrow_hold' | 'escrow_release' | 'platform_fee' | 'withdraw' | 'vip_charge' | 'vip_charge_est' | 'coupon_discount';
export interface WalletTx {
  id: string;
  userId: string;
  type: TxType;
  amount: number;
  description: string;
  contractId?: string;
  date: string;
}

export type NotificationType = 'hire_request' | 'contract_update' | 'review' | 'vip' | 'payment' | 'system';
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  date: string;
  contractId?: string;
}

export interface Review {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface PlatformConfig {
  defaultFeePercent: number;
}

export type PaymentProviderId = 'asaas' | 'mercadopago' | 'pagseguro' | 'stone' | 'inter';

export interface PaymentProviderInfo {
  id: PaymentProviderId;
  label: string;
  docsUrl: string;
  signupUrl: string;
  supportsPix: boolean;
  supportsBoleto: boolean;
  supportsCard: boolean;
  supportsSplit: boolean;
}

export const PAYMENT_PROVIDERS: PaymentProviderInfo[] = [
  { id: 'asaas', label: 'Asaas', docsUrl: 'https://docs.asaas.com/', signupUrl: 'https://www.asaas.com/r/FREELAAGORA', supportsPix: true, supportsBoleto: true, supportsCard: true, supportsSplit: true },
  { id: 'mercadopago', label: 'Mercado Pago', docsUrl: 'https://www.mercadopago.com.br/developers/pt/', signupUrl: 'https://www.mercadopago.com.br/', supportsPix: true, supportsBoleto: true, supportsCard: true, supportsSplit: true },
  { id: 'pagseguro', label: 'PagSeguro', docsUrl: 'https://dev.pagseguro.uol.com.br/', signupUrl: 'https://pagseguro.uol.com.br/', supportsPix: true, supportsBoleto: true, supportsCard: true, supportsSplit: false },
  { id: 'stone', label: 'Stone (Ton)', docsUrl: 'https://docs.ton.com.br/', signupUrl: 'https://ton.com.br/', supportsPix: true, supportsBoleto: false, supportsCard: true, supportsSplit: true },
  { id: 'inter', label: 'Banco Inter', docsUrl: 'https://developers.bancointer.com.br/', signupUrl: 'https://www.bancointer.com.br/', supportsPix: true, supportsBoleto: true, supportsCard: false, supportsSplit: false },
];

export interface PaymentProviderConfig {
  apiKey: string;
  env: 'sandbox' | 'production';
}

export type PaymentSettings = {
  activeProvider: PaymentProviderId;
  configs: Partial<Record<PaymentProviderId, PaymentProviderConfig>>;
};

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  targetUserId?: string;
  createdAt: string;
}

export interface AppData {
  users: User[];
  jobs: Job[];
  contracts: Contract[];
  walletTxs: WalletTx[];
  notifications: AppNotification[];
  reviews: Review[];
  coupons: Coupon[];
  adminAuditLogs: AdminAuditLog[];
  config: PlatformConfig;
  paymentSettings: PaymentSettings;
  currentUserId: string | null;
  vipPlans: VipPlan[];
  estVipPlans: EstVipPlan[];
}

export interface MetroMap {
  [city: string]: string[];
}
