import { useState, useEffect } from 'react';
import { useApp } from '@/AppContext';

export function VipSquareWidget({ pageType = 'freelancers', slot = 1 }: { pageType?: 'freelancers' | 'establishments'; slot: 1 | 2 | 3 }) {
  const { data } = useApp();
  const slotIndex = slot - 1; 
  const activeAds: { imageUrl: string; linkUrl: string }[] = [];
  
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
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, 4000); 
    return () => clearInterval(timer);
  }, [activeAds.length]);

  if (activeAds.length === 0) return null;

  const currentAd = activeAds[currentIndex % activeAds.length];
  
  // Regras CSS exatas para o card-anuncio
  const sizeClass = slot === 1 
    ? 'aspect-[600/900]' 
    : slot === 2 
    ? 'w-full max-w-[380px] h-[250px]' 
    : 'aspect-[3/1]';

  const imageFit = slot === 2 ? 'object-contain bg-neutral-50 dark:bg-neutral-900' : 'object-cover';

  return (
    <a href={currentAd.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className={`block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-transform hover:scale-[1.01] dark:border-neutral-800 dark:bg-neutral-900 ${sizeClass}`}>
      <img src={currentAd.imageUrl} alt="Anúncio" className={`w-full h-full ${imageFit}`} />
    </a>
  );
}
