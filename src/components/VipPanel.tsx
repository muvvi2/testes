import { useState, useEffect } from 'react';
import { Crown, Check, Sparkles, ShieldCheck, Diamond, Star, Store, Percent, Ticket, QrCode, CreditCard, FileText, Wallet, AlertCircle, Copy, ArrowLeft, Users, Building2, Upload, Trash2, ImageIcon } from 'lucide-react';
import { useApp } from '@/AppContext';
import { supabase } from '@/lib/supabase';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Field';
import { formatCurrency, periodLabel, getPlan, getEstPlan } from '@/utils';
import { isPaymentConfigured, getActiveProviderInfo } from '@/services/paymentService';
import type { Tier, EstTier, Period, Coupon, EstVipPlan } from '@/types';

type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'WALLET';
const BILLING_OPTIONS: { id: BillingType; label: string; icon: typeof QrCode }[] = [
  { id: 'WALLET', label: 'Carteira', icon: Wallet },
  { id: 'PIX', label: 'PIX', icon: QrCode },
  { id: 'BOLETO', label: 'Boleto', icon: FileText },
  { id: 'CREDIT_CARD', label: 'Cartão', icon: CreditCard },
];

const SLOT_NAMES = ["Topo da Página", "Centro do Feed", "Rodapé da Página"];
const SLOT_DIMENSIONS = [
  { width: 600, height: 900, label: "600x900 px" },
  { width: 600, height: 500, label: "600x500 px" },
  { width: 600, height: 200, label: "600x200 px" },
];

const tierIcon: Record<Tier, typeof Crown> = { 
  free: Sparkles, vip1: Star, vip2: ShieldCheck, vip3: Diamond, vip4: Crown, vip5: Crown, vip6: Crown 
};

const tierTone: Record<Tier, string> = {
  free: 'border-neutral-200 dark:border-neutral-800',
  vip1: 'border-primary-300 dark:border-primary-500/40 shadow-sm',
  vip2: 'border-secondary-300 dark:border-secondary-500/40 shadow-sm',
  vip3: 'border-warning-300 dark:border-warning-500/40 shadow-sm',
  vip4: 'border-amber-400 dark:border-amber-500/60 shadow-md',
  vip5: 'border-purple-400 dark:border-purple-500/60 shadow-md',
  vip6: 'border-rose-400 dark:border-rose-500/60 shadow-md',
};

const estTierTone: Record<EstTier, string> = {
  free: 'border-neutral-200 dark:border-neutral-800',
  trial: 'border-accent-300 dark:border-accent-500/40 shadow-sm',
  vip1: 'border-primary-300 dark:border-primary-500/40 shadow-sm',
  vip2: 'border-secondary-300 dark:border-secondary-500/40 shadow-sm',
  vip3: 'border-warning-300 dark:border-warning-500/40 shadow-sm',
  vip4: 'border-amber-400 dark:border-amber-500/60 shadow-md',
  vip5: 'border-purple-400 dark:border-purple-500/60 shadow-md',
  vip6: 'border-rose-400 dark:border-rose-500/60 shadow-md',
};

const getTierColor = (tier: string) => {
  if (tier === 'vip6') return 'text-rose-500';
  if (tier === 'vip5') return 'text-purple-500';
  if (tier === 'vip4') return 'text-amber-500';
  if (tier === 'vip3') return 'text-warning-500';
  if (tier === 'vip2') return 'text-secondary-500';
  if (tier === 'vip1') return 'text-primary-500';
  return 'text-neutral-400';
};

export function VipPanel({ userId, accountType, onBack }: { userId: string; accountType: 'freelancer' | 'establishment'; onBack?: () => void }) {
  const { currentUser, data, setVipTier, setEstVipTier, validateCoupon, applyCouponToPurchase, updateUser } = useApp();
  const { notify } = useToast();
  const [period, setPeriod] = useState<Period>('monthly');
  const [confirmTier, setConfirmTier] = useState<Tier | null>(null);
  const [confirmEstTier, setConfirmEstTier] = useState<EstTier | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [billingType, setBillingType] = useState<BillingType>('WALLET');
  const [pixData, setPixData] = useState<{ qrCode: string; payload: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [activeFreelaTab, setActiveFreelaTab] = useState<number>(0);
  const [activeEstabTab, setActiveEstabTab] = useState<number>(0);

  const [selectedFreelancerSlots, setSelectedFreelancerSlots] = useState<number[]>(currentUser?.allowedFreelancerSlots ?? []);
  const [selectedEstablishmentSlots, setSelectedEstablishmentSlots] = useState<number[]>(currentUser?.allowedEstablishmentSlots ?? []);

  const currentTier: Tier = currentUser?.vipTier ?? 'free';
  const hasActiveVip = currentUser?.estVipTier && currentUser.estVipTier !== 'free' && currentUser.estVipTier !== 'trial';
  const isOnTrial = !hasActiveVip && (currentUser?.trialEndsAt ? new Date(currentUser.trialEndsAt) > new Date() : false);
  const currentEstTier: EstTier = isOnTrial ? 'trial' : (currentUser?.estVipTier ?? 'free');
  
  const vipPlansList = data?.vipPlans ?? [];
  const estVipPlansList = data?.estVipPlans ?? [];

  const currentPlan = getPlan(currentTier, vipPlansList);
  const currentEstPlan = getEstPlan(currentEstTier, estVipPlansList);

  const maxAdsPerSlot = currentEstTier === 'vip6' ? 5 : currentEstTier === 'vip5' ? 3 : currentEstTier === 'vip4' ? 1 : 3;

  const [freelancerAdsBySlot, setFreelancerAdsBySlot] = useState<string[][]>(() => {
    const existing = currentUser?.freelancerAdsBySlot ?? currentUser?.freelancerAds ?? [[], [], []];
    return Array.from({ length: 3 }, (_, i) => Array.from({ length: maxAdsPerSlot }, (_, j) => Array.isArray(existing) && Array.isArray(existing[i]) ? existing[i][j] ?? '' : ''));
  });

  const [establishmentAdsBySlot, setEstablishmentAdsBySlot] = useState<string[][]>(() => {
    const existing = currentUser?.establishmentAdsBySlot ?? currentUser?.establishmentAds ?? [[], [], []];
    return Array.from({ length: 3 }, (_, i) => Array.from({ length: maxAdsPerSlot }, (_, j) => Array.isArray(existing) && Array.isArray(existing[i]) ? existing[i][j] ?? '' : ''));
  });

  const [freelancerLinksBySlot, setFreelancerLinksBySlot] = useState<string[][]>(() => {
    const existing = currentUser?.freelancerLinksBySlot ?? currentUser?.freelancerLinks ?? [[], [], []];
    return Array.from({ length: 3 }, (_, i) => Array.from({ length: maxAdsPerSlot }, (_, j) => Array.isArray(existing) && Array.isArray(existing[i]) ? existing[i][j] ?? '' : ''));
  });

  const [establishmentLinksBySlot, setEstablishmentLinksBySlot] = useState<string[][]>(() => {
    const existing = currentUser?.establishmentLinksBySlot ?? currentUser?.establishmentLinks ?? [[], [], []];
    return Array.from({ length: 3 }, (_, i) => Array.from({ length: maxAdsPerSlot }, (_, j) => Array.isArray(existing) && Array.isArray(existing[i]) ? existing[i][j] ?? '' : ''));
  });

  useEffect(() => {
    let path = '/vip';
    if (accountType === 'freelancer') path = '/freela';
    if (accountType === 'establishment') path = '/estab';
    window.history.replaceState(null, '', path);
  }, [accountType]);

  const paymentReady = isPaymentConfigured();
  const providerInfo = getActiveProviderInfo();

  if (!currentUser || !data) return <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">Carregando...</div>;

  const applyCoupon = () => {
    if (!couponCode.trim()) { setCouponError('Digite um código.'); return; }
    const c = validateCoupon(couponCode);
    if (!c.coupon) { setCouponError(c.error || 'Cupom inválido.'); setAppliedCoupon(null); return; }
    setAppliedCoupon(c.coupon); setCouponError(''); notify(`Cupom aplicado: ${c.coupon.discountPercentage}% de desconto!`);
  };

  const handleFileChange = (slotIndex: number, adIndex: number, type: 'freelancers' | 'establishments') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const requiredWidth = SLOT_DIMENSIONS[slotIndex].width;
        const requiredHeight = SLOT_DIMENSIONS[slotIndex].height;

        if (img.width !== requiredWidth || img.height !== requiredHeight) {
          notify(`Tamanho inválido! O ${SLOT_NAMES[slotIndex]} exige exatamente ${requiredWidth}x${requiredHeight} pixels. A imagem enviada tem ${img.width}x${img.height}px.`, 'error');
          return;
        }

        const base64Image = reader.result as string;

        if (type === 'freelancers') {
          const updated = [...freelancerAdsBySlot];
          if (!updated[slotIndex]) updated[slotIndex] = [];
          updated[slotIndex][adIndex] = base64Image;
          setFreelancerAdsBySlot(updated);
        } else {
          const updated = [...establishmentAdsBySlot];
          if (!updated[slotIndex]) updated[slotIndex] = [];
          updated[slotIndex][adIndex] = base64Image;
          setEstablishmentAdsBySlot(updated);
        }

        notify(`Imagem carregada com sucesso no ${SLOT_NAMES[slotIndex]} (#${adIndex + 1})!`, 'success');
      };
    };
    reader.readAsDataURL(file);
  };

  const handleLinkChange = (slotIndex: number, adIndex: number, type: 'freelancers' | 'establishments', value: string) => {
    if (type === 'freelancers') {
      const updated = [...freelancerLinksBySlot];
      if (!updated[slotIndex]) updated[slotIndex] = [];
      updated[slotIndex][adIndex] = value;
      setFreelancerLinksBySlot(updated);
    } else {
      const updated = [...establishmentLinksBySlot];
      if (!updated[slotIndex]) updated[slotIndex] = [];
      updated[slotIndex][adIndex] = value;
      setEstablishmentLinksBySlot(updated);
    }
  };

  const handleRemoveAd = (slotIndex: number, adIndex: number, type: 'freelancers' | 'establishments') => {
    if (type === 'freelancers') {
      const updated = [...freelancerAdsBySlot];
      if (updated[slotIndex]) {
        updated[slotIndex][adIndex] = '';
        setFreelancerAdsBySlot(updated);
      }
    } else {
      const updated = [...establishmentAdsBySlot];
      if (updated[slotIndex]) {
        updated[slotIndex][adIndex] = '';
        setEstablishmentAdsBySlot(updated);
      }
    }
    notify('Anúncio removido', 'info');
  };

  const calculateTotalPlanPrice = (planObj: any) => {
    let basePrice = planObj.prices[period];
    if (accountType === 'establishment' && planObj.allowAds) {
      const referencePlan = estVipPlansList.find(p => p.allowAds) || estVipPlansList[0];
      const slotPrices = [referencePlan?.priceSlot1 ?? 30, referencePlan?.priceSlot2 ?? 25, referencePlan?.priceSlot3 ?? 20];
      const freelancerCost = selectedFreelancerSlots.reduce((sum, id) => sum + (slotPrices[id - 1] || 0), 0);
      const estCost = selectedEstablishmentSlots.reduce((sum, id) => sum + (slotPrices[id - 1] || 0), 0);
      
      let adsTotal = freelancerCost + estCost;
      const totalAdsCount = selectedFreelancerSlots.length + selectedEstablishmentSlots.length;
      const hasFreelancerAds = selectedFreelancerSlots.length > 0;
      const hasEstablishmentAds = selectedEstablishmentSlots.length > 0;

      if (totalAdsCount >= 3 || (hasFreelancerAds && hasEstablishmentAds)) {
        adsTotal *= 0.80;
      } else if (totalAdsCount === 2) {
        adsTotal *= 0.90;
      }

      basePrice += adsTotal;
    }

    return appliedCoupon ? Math.round(basePrice * (1 - appliedCoupon.discountPercentage / 100) * 100) / 100 : basePrice;
  };

  const handleEstPlanClick = (plan: EstVipPlan) => {
    if (plan.tier === 'trial') {
      setConfirmEstTier(plan.tier);
      return;
    }
    
    if (plan.allowAds) {
      const totalSelected = selectedFreelancerSlots.length + selectedEstablishmentSlots.length;
      if (totalSelected === 0) {
        notify('Este plano inclui anúncios. Por favor, selecione ao menos uma posição (slot) acima antes de prosseguir.', 'error');
        return;
      }
    }
    setConfirmEstTier(plan.tier);
  };

  const handleProceedPayment = async (tier: Tier | EstTier, type: 'freelancer' | 'establishment') => {
    const planObj = type === 'freelancer' ? getPlan(tier as Tier, vipPlansList) : getEstPlan(tier as EstTier, estVipPlansList);
    const finalPrice = calculateTotalPlanPrice(planObj);
    const userBalance = currentUser?.walletBalance ?? 0;

    const adPermissionsConfig = {
      includeHomeAd: false,
      includeFreelancerAd: selectedFreelancerSlots.length > 0,
      includeEstablishmentAd: selectedEstablishmentSlots.length > 0,
      allowedFreelancerSlots: selectedFreelancerSlots,
      allowedEstablishmentSlots: selectedEstablishmentSlots,
      freelancerAdsBySlot,
      establishmentAdsBySlot,
      freelancerLinksBySlot,
      establishmentLinksBySlot,
      freelancerAds: freelancerAdsBySlot.flat(),
      establishmentAds: establishmentAdsBySlot.flat(),
      freelancerLinks: freelancerLinksBySlot.flat(),
      establishmentLinks: establishmentLinksBySlot.flat(),
    };

    if (billingType === 'WALLET') {
      if (finalPrice > 0 && userBalance < finalPrice) {
        notify(`Saldo insuficiente na carteira! Necessário: ${formatCurrency(finalPrice)} (Disponível: ${formatCurrency(userBalance)})`, 'error');
        return;
      }

      if (type === 'freelancer') {
        const t = tier as Tier;
        if (appliedCoupon) {
          applyCouponToPurchase(userId, t, period, appliedCoupon, 'freelancer');
        } else {
          setVipTier(userId, t, period);
        }
        notify(`Plano ${getPlan(t, vipPlansList).label} ativado com sucesso!`);
      } else {
        const et = tier as EstTier;
        if (appliedCoupon) {
          applyCouponToPurchase(userId, et, period, appliedCoupon, 'establishment');
        } else {
          setEstVipTier(userId, et, period);
        }
        updateUser(userId, adPermissionsConfig);
        notify(`Plano ${getEstPlan(et, estVipPlansList).label} ativado com sucesso!`);
      }
      setConfirmTier(null);
      setConfirmEstTier(null);
    } else {
      try {
        const supabaseUrl = supabase.supabaseUrl;
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token || supabase.supabaseKey;

        const rawDocument = accountType === 'establishment' ? (currentUser?.cnpj || '') : (currentUser?.cpf || currentUser?.cpfCnpj || '');
        const cleanDocument = rawDocument.replace(/\D/g, '');
        const validCpfCnpj = (cleanDocument.length === 11 || cleanDocument.length === 14) ? cleanDocument : '47690623000';

        const res = await fetch(`${supabaseUrl}/functions/v1/asaas-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'payment',
            billingType: billingType,
            value: finalPrice,
            description: `Assinatura ${planObj.label} (${periodLabel(period)})`,
            customerName: currentUser?.name || 'Cliente',
            customerEmail: currentUser?.email || 'cliente@exemplo.com',
            customerCpfCnpj: validCpfCnpj,
            externalReference: userId
          })
        });

        const rawText = await res.text();
        let responseData;
        try {
          responseData = JSON.parse(rawText);
        } catch (e) {
          throw new Error(`A Edge Function retornou resposta inválida (Status ${res.status}): ${rawText.substring(0, 100)}...`);
        }

        if (!res.ok || responseData.error) {
          throw new Error(responseData?.error || 'Erro ao comunicar com o gateway de pagamento.');
        }

        if (billingType === 'PIX') {
          if (!responseData.pixQrCode && !responseData.pixCopyPaste) {
            throw new Error('A API não retornou os dados do QR Code Pix.');
          }
          setPixData({
            qrCode: responseData.pixQrCode ? `data:image/png;base64,${responseData.pixQrCode}` : '',
            payload: responseData.pixCopyPaste || ''
          });
          notify('Cobrança PIX gerada com sucesso! Escaneie o QR Code.');
        } else if (billingType === 'BOLETO' || billingType === 'CREDIT_CARD') {
          notify('Cobrança gerada com sucesso! Redirecionando...');
          if (responseData.invoiceUrl) {
            window.open(responseData.invoiceUrl, '_blank');
          }
        }
      } catch (err: any) {
        console.error("Erro no pagamento:", err);
        notify(err.message || 'Erro ao processar pagamento.', 'error');
        return;
      }

      setConfirmTier(null);
      setConfirmEstTier(null);
    }

    setAppliedCoupon(null);
    setCouponCode('');
  };

  const toggleSlotSelection = (page: 'freelancers' | 'establishments', slotNumber: number) => {
    if (page === 'freelancers') {
      setSelectedFreelancerSlots(prev => 
        prev.includes(slotNumber) ? prev.filter(s => s !== slotNumber) : [...prev, slotNumber].sort()
      );
    } else {
      setSelectedEstablishmentSlots(prev => 
        prev.includes(slotNumber) ? prev.filter(s => s !== slotNumber) : [...prev, slotNumber].sort()
      );
    }
  };

  const referencePlan = estVipPlansList.find(p => p.allowAds) || estVipPlansList[0];
  const slotPrices = [
    referencePlan?.priceSlot1 ?? 30,
    referencePlan?.priceSlot2 ?? 25,
    referencePlan?.priceSlot3 ?? 20
  ];

  const renderCompactSlotManager = (adsBySlot: string[][], linksBySlot: string[][], type: 'freelancers' | 'establishments', activeTab: number, setActiveTab: (t: number) => void) => {
    return (
      <div className="space-y-3">
        <div className="flex border-b border-neutral-800 gap-1 overflow-x-auto">
          {SLOT_NAMES.map((slotName, idx) => {
            const isActive = activeTab === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`px-3 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  isActive 
                    ? 'border-amber-500 text-amber-400 bg-neutral-900 rounded-t-lg' 
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <span>{slotName}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                  {SLOT_DIMENSIONS[idx].label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-950 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: maxAdsPerSlot }).map((_, adIndex) => {
              const adImg = adsBySlot[activeTab]?.[adIndex] || '';
              const adLink = linksBySlot[activeTab]?.[adIndex] || '';

              return (
                <div key={adIndex} className="p-2.5 border border-neutral-800 rounded-lg bg-neutral-900 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400">
                    <span className="text-amber-400">Anúncio #{adIndex + 1}</span>
                    {adImg && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveAd(activeTab, adIndex, type)}
                        className="text-red-400 hover:text-red-300 flex items-center gap-0.5 text-[10px]"
                      >
                        <Trash2 className="h-3 w-3" /> Remover
                      </button>
                    )}
                  </div>

                  {adImg ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-neutral-950 p-1.5 rounded border border-neutral-800">
                        <img src={adImg} className="h-12 w-16 object-cover rounded border border-neutral-700 shrink-0 shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-success-400 truncate">Imagem carregada</p>
                          <p className="text-[9px] text-neutral-500">{SLOT_DIMENSIONS[activeTab].label}</p>
                        </div>
                      </div>
                      <input 
                        type="text" 
                        value={adLink} 
                        onChange={(e) => handleLinkChange(activeTab, adIndex, type, e.target.value)}
                        placeholder="Link de redirecionamento (https://...)"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="cursor-pointer border border-dashed border-neutral-700 hover:border-amber-500 w-full h-14 flex items-center justify-center gap-1.5 rounded bg-neutral-950 transition text-xs text-neutral-400">
                        <Upload className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <div className="text-left">
                          <p className="font-bold text-neutral-300 text-[10px] leading-tight">Carregar Imagem</p>
                          <p className="text-[9px] text-neutral-500">{SLOT_DIMENSIONS[activeTab].label}</p>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange(activeTab, adIndex, type)} />
                      </label>
                      <input 
                        type="text" 
                        value={adLink} 
                        onChange={(e) => handleLinkChange(activeTab, adIndex, type, e.target.value)}
                        placeholder="Link de redirecionamento (https://...)"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button size="sm" variant="outline" onClick={onBack} className="gap-2 border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            )}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-warning-400 to-warning-600 shadow-lg shadow-warning-500/20">
              <Crown className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">Planos de Destaque e Assinaturas VIP</h1>
              <p className="text-sm text-neutral-400">
                {accountType === 'freelancer' ? `Plano atual: ${currentPlan.label}` : `Plano atual: ${currentEstPlan.label}`}
                {isOnTrial ? ' (Em período de Teste Gratuito)' : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 p-1.5 shadow-inner">
            {(['monthly', 'semestral', 'annual'] as Period[]).map((p) => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)} 
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${period === p ? 'bg-primary-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
              >
                {periodLabel(p)} {p !== 'monthly' && <span className="block text-[10px] text-success-400 font-bold uppercase tracking-wider">economize</span>}
              </button>
            ))}
          </div>
        </div>

        {accountType === 'establishment' && (
          <div className="rounded-2xl border border-amber-500/30 bg-neutral-900 p-6 shadow-lg space-y-6">
            <div>
              <h3 className="font-display text-base font-bold text-white mb-1 flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" /> Seleção de Posicionamento e Banners Rotativos
              </h3>
              <p className="text-xs text-neutral-400">
                Os banners rotacionam automaticamente nas páginas a cada 4 segundos. Escolha em quais posições deseja aparecer. <span className="text-success-400 font-bold">Descontos: Ambas as páginas ou 3+ anúncios = 20% OFF | 2 anúncios na mesma página = 10% OFF!</span>
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-400" /> Página de Freelancers
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((slotNum) => {
                    const isSelected = selectedFreelancerSlots.includes(slotNum);
                    return (
                      <button
                        key={slotNum}
                        type="button"
                        onClick={() => toggleSlotSelection('freelancers', slotNum)}
                        className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center ${isSelected ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'}`}
                      >
                        <span className="font-bold text-[11px]">{SLOT_NAMES[slotNum - 1]}</span>
                        <span className="text-[10px] font-normal text-neutral-400">
                          {isSelected ? 'Selecionado' : formatCurrency(slotPrices[slotNum - 1])}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-400" /> Página de Estabelecimentos
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((slotNum) => {
                    const isSelected = selectedEstablishmentSlots.includes(slotNum);
                    return (
                      <button
                        key={slotNum}
                        type="button"
                        onClick={() => toggleSlotSelection('establishments', slotNum)}
                        className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center ${isSelected ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'}`}
                      >
                        <span className="font-bold text-[11px]">{SLOT_NAMES[slotNum - 1]}</span>
                        <span className="text-[10px] font-normal text-neutral-400">
                          {isSelected ? 'Selecionado' : formatCurrency(slotPrices[slotNum - 1])}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {accountType === 'freelancer' ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {vipPlansList.map((plan) => {
              const Icon = tierIcon[plan.tier]; 
              const active = currentTier === plan.tier; 
              const finalPlanPrice = calculateTotalPlanPrice(plan);
              return (
                <div key={plan.tier} className={`relative flex flex-col justify-between rounded-2xl border-2 bg-neutral-900 p-6 transition shadow-xl ${tierTone[plan.tier]} ${active ? 'ring-2 ring-primary-500 bg-neutral-900/90' : 'hover:border-neutral-700'}`}>
                  {active && <div className="absolute -top-3.5 left-5"><Badge tone="primary">Plano Ativo</Badge></div>}
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700">
                        <Icon className={`h-6 w-6 ${getTierColor(plan.tier)}`} />
                      </div>
                      <div>
                        <span className="font-display text-lg font-bold text-white">{plan.label}</span>
                        <p className="text-xs uppercase tracking-wider text-neutral-400">{plan.tier}</p>
                      </div>
                    </div>
                    <div className="my-5">
                      <span className="font-display text-4xl font-extrabold text-white">
                        {finalPlanPrice === 0 ? 'Grátis' : <>{appliedCoupon && <span className="mr-2 text-base text-neutral-500 line-through">{formatCurrency(plan.prices[period])}</span>}{formatCurrency(finalPlanPrice)}</>}
                      </span>
                      {finalPlanPrice > 0 && <span className="text-xs font-medium text-neutral-400">/{periodLabel(period).toLowerCase()}</span>}
                    </div>
                    <ul className="space-y-3 border-t border-neutral-800 pt-5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-300">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-400" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-6">
                    {!active && (
                      <Button fullWidth size="lg" variant={plan.tier === 'free' ? 'outline' : 'warning'} onClick={() => setConfirmTier(plan.tier)}>
                        {plan.tier === 'free' ? 'Voltar para Free' : 'Assinar Plano'}
                      </Button>
                    )}
                    {active && <p className="text-center text-sm font-bold text-primary-400 py-3">You are on this plan</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-2xl bg-secondary-950/50 p-4 border border-secondary-500/30 text-secondary-200">
              <Percent className="h-6 w-6 shrink-0 text-secondary-400" />
              <p className="text-sm">
                O seu plano empresarial define a <strong>taxa de intermediação</strong> cobrada em cada contrato. Quanto mais avançado o plano, menor é a taxa retida pela plataforma.
              </p>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
              {estVipPlansList.map((plan) => {
                const active = currentEstTier === plan.tier; 
                const finalPlanPrice = calculateTotalPlanPrice(plan);
                return (
                  <div key={plan.tier} className={`relative flex flex-col justify-between rounded-2xl border-2 bg-neutral-900 p-6 transition shadow-xl ${estTierTone[plan.tier]} ${active ? 'ring-2 ring-primary-500 bg-neutral-900/90' : 'hover:border-neutral-700'}`}>
                    {active && <div className="absolute -top-3.5 left-5"><Badge tone="primary">Plano Ativo</Badge></div>}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Store className={`h-5 w-5 ${getTierColor(plan.tier)}`} />
                          <span className="font-display text-base font-bold text-white">{plan.label}</span>
                        </div>
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${plan.intermediationFee === 0 ? 'bg-success-500/20 text-success-300 border border-success-500/30' : 'bg-warning-500/20 text-warning-300 border border-warning-500/30'}`}>
                          {plan.intermediationFee === 0 ? '0% taxa' : `${plan.intermediationFee}% taxa`}
                        </span>
                      </div>

                      <div className="my-5">
                        <span className="font-display text-4xl font-extrabold text-white">
                          {finalPlanPrice === 0 ? 'Grátis' : <>{appliedCoupon && <span className="mr-2 text-base text-neutral-500 line-through">{formatCurrency(plan.prices[period])}</span>}{formatCurrency(finalPlanPrice)}</>}
                        </span>
                        {finalPlanPrice > 0 && <span className="text-xs font-medium text-neutral-400">/{periodLabel(period).toLowerCase()}</span>}
                      </div>

                      <ul className="space-y-3 border-t border-neutral-800 pt-5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-300">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-400" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6">
                      {!active && plan.tier !== 'trial' && (
                        <Button fullWidth size="lg" variant={plan.tier === 'free' ? 'outline' : 'warning'} onClick={() => handleEstPlanClick(plan)}>
                          {plan.tier === 'free' ? 'Voltar para Free' : 'Assinar Plano'}
                        </Button>
                      )}
                      {active && <p className="text-center text-sm font-bold text-primary-400 py-3">Você está neste plano</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {accountType === 'establishment' && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-lg space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-amber-400" />
                <h3 className="font-display text-base font-bold text-white">Biblioteca de Imagens e Links dos Anúncios</h3>
              </div>
              <Button 
                size="sm" 
                variant="warning"
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await updateUser(userId, {
                      allowedFreelancerSlots: selectedFreelancerSlots,
                      allowedEstablishmentSlots: selectedEstablishmentSlots,
                      freelancerAdsBySlot,
                      establishmentAdsBySlot,
                      freelancerLinksBySlot,
                      establishmentLinksBySlot,
                      freelancerAds: freelancerAdsBySlot.flat(),
                      establishmentAds: establishmentAdsBySlot.flat(),
                      freelancerLinks: freelancerLinksBySlot.flat(),
                      establishmentLinks: establishmentLinksBySlot.flat(),
                    });
                    notify('Banners e links salvos com sucesso no sistema!', 'success');
                  } catch (e) {
                    notify('Erro ao salvar os banners.', 'error');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="gap-2"
              >
                {isSaving ? 'Salvando...' : <><Check className="h-4 w-4" /> Salvar Banners</>}
              </Button>
            </div>
            <p className="text-xs text-neutral-400">
              Gerencie seus banners utilizando as abas. O sistema valida rigorosamente as dimensões exatas e respeita o limite do seu plano ({maxAdsPerSlot} anúncios por slot). Clique em <strong>Salvar Banners</strong> para atualizar.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2 bg-neutral-950/40 p-4 rounded-xl border border-neutral-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Página de Freelancers
                </h4>
                {renderCompactSlotManager(freelancerAdsBySlot, freelancerLinksBySlot, 'freelancers', activeFreelaTab, setActiveFreelaTab)}
              </div>

              <div className="space-y-2 bg-neutral-950/40 p-4 rounded-xl border border-neutral-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Página de Estabelecimentos
                </h4>
                {renderCompactSlotManager(establishmentAdsBySlot, establishmentLinksBySlot, 'establishments', activeEstabTab, setActiveEstabTab)}
              </div>
            </div>
          </div>
        )}

        <Modal open={!!confirmTier} onClose={() => setConfirmTier(null)} title="Confirmar assinatura" size="sm"
          footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setConfirmTier(null)}>Cancelar</Button><Button variant="warning" fullWidth onClick={() => confirmTier && handleProceedPayment(confirmTier, 'freelancer')}><Check className="h-4 w-4" /> Confirmar</Button></div>}>
          {confirmTier && <div className="space-y-3"><div className="flex items-center gap-3 rounded-xl bg-warning-50 p-3 dark:bg-warning-500/10"><Crown className="h-8 w-8 text-warning-500" /><div><p className="font-bold text-neutral-900 dark:text-white">{getPlan(confirmTier, vipPlansList).label} — {periodLabel(period)}</p><p className="text-xs text-neutral-400">Total: {formatCurrency(calculateTotalPlanPrice(getPlan(confirmTier, vipPlansList)))}</p></div></div>
          <BillingTypeSelector billingType={billingType} setBillingType={setBillingType} paymentReady={paymentReady} providerLabel={providerInfo.label} />
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{billingType === 'WALLET' ? 'Ao confirmar, o valor será debitado da sua carteira e seu plano será ativado imediatamente.' : `Ao confirmar, você será direcionado ao pagamento via ${providerInfo.label}.`}</p></div>}
        </Modal>

        <Modal open={!!confirmEstTier} onClose={() => setConfirmEstTier(null)} title="Confirmar assinatura empresarial" size="sm"
          footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setConfirmEstTier(null)}>Cancelar</Button><Button variant="warning" fullWidth onClick={() => confirmEstTier && handleProceedPayment(confirmEstTier, 'establishment')}><Check className="h-4 w-4" /> Confirmar</Button></div>}>
          {confirmEstTier && <div className="space-y-3"><div className="flex items-center gap-3 rounded-xl bg-warning-50 p-3 dark:bg-warning-500/10"><Store className="h-8 w-8 text-warning-500" /><div><p className="font-bold text-neutral-900 dark:text-white">{getEstPlan(confirmEstTier, estVipPlansList).label} — {periodLabel(period)}</p><p className="text-xs text-neutral-400">Total: {formatCurrency(calculateTotalPlanPrice(getEstPlan(confirmEstTier, estVipPlansList)))} · Taxa: {getEstPlan(confirmEstTier, estVipPlansList).intermediationFee}%</p></div></div>
          <BillingTypeSelector billingType={billingType} setBillingType={setBillingType} paymentReady={paymentReady} providerLabel={providerInfo.label} />
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{billingType === 'WALLET' ? 'Ao confirmar, o valor será debitado da sua carteira e sua nova taxa de intermediação será aplicada nas próximas contratações.' : `Ao confirmar, você será direcionado ao pagamento via ${providerInfo.label}.`}</p></div>}
        </Modal>

        <Modal open={!!pixData} onClose={() => setPixData(null)} title="Pagamento via PIX" size="sm">
          {pixData && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">Escaneie o QR Code abaixo com o aplicativo do seu banco para realizar o pagamento:</p>
              <div className="flex justify-center">
                <img src={pixData.qrCode} alt="QR Code PIX" className="h-48 w-48 rounded-xl border border-neutral-200 p-2 dark:border-neutral-700" />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-neutral-500">Ou copie o código Pix Copia e Cola:</p>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-800">
                  <input type="text" readOnly value={pixData.payload} className="w-full bg-transparent text-xs text-neutral-700 outline-none dark:text-neutral-300" />
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(pixData.payload);
                    notify('Chave PIX copiada para a área de transferência!');
                  }}>
                    <Copy className="h-3.5 w-3.5" /> Copiar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        <div className="max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg">
          <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-neutral-400"><Ticket className="h-4 w-4 text-primary-400" /> Cupom de desconto</label>
          <div className="flex gap-2">
            <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="BEMVINDO10" className="flex-1 bg-neutral-950 border-neutral-800 text-white" />
            <Button size="sm" variant="outline" onClick={applyCoupon} className="border-neutral-700 text-white hover:bg-neutral-800">Aplicar</Button>
          </div>
          {couponError && <p className="mt-2 text-xs text-error-400">{couponError}</p>}
          {appliedCoupon && <p className="mt-2 text-xs text-success-400 font-semibold">Cupom {appliedCoupon.code} aplicado: {appliedCoupon.discountPercentage}% OFF</p>}
        </div>
      </div>
    </div>
  );
}

function BillingTypeSelector({ billingType, setBillingType, paymentReady, providerLabel }: { billingType: BillingType; setBillingType: (b: BillingType) => void; paymentReady: boolean; providerLabel: string }) {
  const finalOptions = paymentReady ? BILLING_OPTIONS : BILLING_OPTIONS.filter((o) => o.id === 'WALLET');
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-neutral-500">Forma de pagamento</label>
      <div className="grid grid-cols-2 gap-2">
        {finalOptions.map((opt) => {
          const Icon = opt.icon;
          const active = billingType === opt.id;
          return (
            <button key={opt.id} type="button" onClick={() => setBillingType(opt.id)} className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${active ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-300'}`}>
              <Icon className="h-4 w-4" /> {opt.label}
            </button>
          );
        })}
      </div>
      {!paymentReady && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-warning-50 p-2.5 text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Pagamento via {providerLabel} não configurado. O admin precisa ativar em Painel Admin → Pagamentos. Por favor, utilize a carteira enquanto isso.</span>
        </div>
      )}
    </div>
  );
}
