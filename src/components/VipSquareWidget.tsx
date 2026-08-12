import { useState, useEffect } from 'react';
import { useApp } from '@/AppContext';

export function VipSquareWidget({ pageType = 'freelancers', slot = 1 }: { pageType?: 'freelancers' | 'establishments'; slot: 1 | 2 | 3 }) {
  const { data } = useApp();
  const slotIndex = slot - 1; 
  const activeAds: { imageUrl: string; linkUrl: string; title?: string }[] = [];
  
  data.users.forEach((u) => {
    if (u.accountType === 'establishment' && u.estVipTier && u.estVipTier !== 'free') {
      const isOnTrial = u.trialEndsAt ? new Date(u.trialEndsAt) > new Date() : false;
      const currentTier = isOnTrial ? 'trial' : u.estVipTier;
      const plan = data.estVipPlans.find((p) => p.tier === currentTier);

      if (plan?.allowAds || ['vip4', 'vip5', 'vip6', 'trial'].includes(currentTier)) {
        const adsBySlot = pageType === 'freelancers' ? (u.freelancerAdsBySlot || [[], [], []]) : (u.establishmentAdsBySlot || [[], [], []]);
        const linksBySlot = pageType === 'freelancers' ? (u.freelancerLinksBySlot || [[], [], []]) : (u.establishmentLinksBySlot || [[], [], []]);
        const rawSlots = pageType === 'freelancers' ? u.allowedFreelancerSlots : u.allowedEstablishmentSlots;
        const allowedSlots = (rawSlots && rawSlots.length > 0) ? rawSlots : [1, 2, 3];

        if (allowedSlots.includes(slot)) {
          const targetAds = adsBySlot[slotIndex] || [];
          const targetLinks = linksBySlot[slotIndex] || [];
          targetAds.forEach((img, imgIndex) => {
            if (img && typeof img === 'string' && img.trim() !== '') {
              const link = targetLinks[imgIndex] || '';
              activeAds.push({ imageUrl: img, linkUrl: link });
            }
          });
        }
      }
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeAds.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) + 1 >= activeAds.length ? 0 : prev + 1);
    }, 4000); 
    return () => clearInterval(timer);
  }, [activeAds.length]);

  if (activeAds.length === 0) return null;

  const currentAd = activeAds[currentIndex % activeAds.length];
  
  // Proporções exatas baseadas no Guia Técnico (Topo 2:1, Centro, etc)
  const sizeClass = slot === 1 
    ? 'w-full aspect-[2/1] min-h-[180px] sm:min-h-[220px]' 
    : slot === 2 
    ? 'w-full max-w-[380px] h-[250px]' 
    : 'w-full aspect-[3.3:1] min-h-[120px]';

  return (
    <a 
      href={currentAd.linkUrl || '#'} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`relative block overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-lg transition-transform hover:scale-[1.01] ${sizeClass}`}
    >
      {/* Imagem de Fundo com preenchimento perfeito */}
      <img 
        src={currentAd.imageUrl} 
        alt="Anúncio Patrocinado" 
        className="absolute inset-0 w-full h-full object-cover opacity-85 transition-opacity duration-500" 
      />
      
      {/* Gradiente escuro para legibilidade e destaque idêntico ao modelo */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

      {/* Selo discreto de Patrocinado */}
      <div className="absolute top-3 right-3 z-10 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium tracking-wide text-neutral-300 backdrop-blur-md">
        Patrocinado
      </div>
    </a>
  );
}
