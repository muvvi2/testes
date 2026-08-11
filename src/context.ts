import { createContext, useContext } from 'react';
import type {
  AppData, User, Job, Contract, WalletTx, AppNotification, Review,
  Tier, Period, WeekAvailability, ContractStatus, Category, EstTier, TermsAcceptance, Coupon, AdminAuditLog,
  VipPlan, EstVipPlan, PaymentSettings,
} from './types';

export interface AppContextValue {
  data: AppData;
  currentUser: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;

  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (user: Omit<User, 'id' | 'createdAt' | 'walletBalance' | 'rating' | 'reviewsCount' | 'completedShifts'> & Partial<User>) => { ok: boolean; error?: string };
  logout: () => void;

  updateUser: (id: string, patch: Partial<User>) => void;
  adminUpdateUser: (id: string, patch: Partial<User>) => void;
  deleteEntity: (id: string) => void;
  banUser: (id: string) => void;
  unbanUser: (id: string) => void;
  setVipTier: (id: string, tier: Tier, period?: Period) => void;
  setEstVipTier: (id: string, tier: EstTier, period?: Period) => void;
  setTermsAcceptance: (id: string, acceptance: TermsAcceptance) => void;

  setAvailability: (userId: string, av: WeekAvailability) => void;
  toggleAvailabilitySlot: (userId: string, day: keyof WeekAvailability, shift: 'manha' | 'tarde' | 'noite') => void;
  toggleDateShift: (userId: string, dateKey: string, shift: 'manha' | 'tarde' | 'noite') => void;

  toggleCategory: (userId: string, categoryId: string) => { ok: boolean; error?: string };

  addJob: (j: Job) => void;
  updateJob: (id: string, patch: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  pauseJob: (id: string) => void;
  applyToJob: (jobId: string, freelancerId: string) => void;

  requestHire: (establishmentId: string, freelancerId: string, jobId: string | null, hours: number, freelancerFee: number) => Contract;
  confirmAvailability: (contractId: string) => void;
  payEscrow: (contractId: string) => void;
  checkInFreelancer: (contractId: string) => void;
  finishService: (contractId: string) => void;
  cancelContract: (contractId: string) => void;

  submitReview: (contractId: string, fromId: string, fromName: string, toId: string, rating: number, comment: string) => void;

  notify: (userId: string, type: AppNotification['type'], title: string, body: string, contractId?: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  userNotifications: (userId: string) => AppNotification[];

  userWalletBalance: (userId: string) => number;
  userWalletTxs: (userId: string) => WalletTx[];
  adminWalletTxs: () => WalletTx[];
  depositToWallet: (userId: string, amount: number, description?: string) => void;
  withdrawFromWallet: (userId: string, amount: number, description?: string) => void;

  reviewsFor: (userId: string) => Review[];

  setDefaultFeePercent: (n: number) => void;
  overrideContractStatus: (contractId: string, status: ContractStatus) => void;
  forceRefund: (contractId: string) => void;
  resetData: () => void;

  coupons: Coupon[];
  validateCoupon: (code: string) => Coupon | null;
  addCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt'>) => void;
  toggleCoupon: (id: string) => void;
  deleteCoupon: (id: string) => void;
  applyCouponToPurchase: (userId: string, tier: Tier | EstTier, period: Period, coupon: Coupon, accountType: 'freelancer' | 'establishment') => { ok: boolean; discountedPrice: number; error?: string };

  auditLogs: AdminAuditLog[];
  logAdminAction: (action: string, targetUserId?: string) => void;

  adminCreateUser: (user: Omit<User, 'id' | 'createdAt' | 'walletBalance' | 'rating' | 'reviewsCount' | 'completedShifts'> & Partial<User>) => { ok: boolean; error?: string };
  adminCreateAdmin: (user: { name: string; email: string; password: string; adminRole: 'super' | 'regular'; photo?: string }) => { ok: boolean; error?: string };
  removeAdmin: (id: string) => void;
  adjustWallet: (userId: string, amount: number, description: string) => void;
  deleteReview: (reviewId: string) => void;
  broadcastNotification: (title: string, body: string) => void;

  updateVipPlan: (tier: Tier, patch: Partial<VipPlan>) => void;
  addVipPlan: (plan: VipPlan) => void;
  removeVipPlan: (tier: Tier) => void;
  updateEstVipPlan: (tier: EstTier, patch: Partial<EstVipPlan>) => void;
  addEstVipPlan: (plan: EstVipPlan) => void;
  removeEstVipPlan: (tier: EstTier) => void;

  updatePaymentSettings: (settings: PaymentSettings) => void;

  freelancers: User[];
  establishments: User[];
  nearbyFreelancers: (city: string) => User[];
  categoryById: (id: string) => Category | undefined;

  adminTab: string;
  setAdminTab: (tab: string) => void;
  adminMode: boolean;
  exitAdminMode: () => void;
  enterAdminMode: () => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
