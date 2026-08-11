import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Bell, Wallet, LogOut, Shield, ChevronDown, LayoutGrid, Users, Store, Briefcase, Star, Crown, Receipt, Ticket, UserCog, CreditCard, Home } from 'lucide-react';
import { useApp } from '@/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from './ui/Avatar';
import { formatCurrency, timeAgo } from '@/utils';
import { AdminProfileModal } from './AdminView';
import type { AppNotification } from '@/types';

export function Header({ onNavigateHome, onNavigateVip }: { onNavigateHome?: () => void; onNavigateVip?: () => void }) {
  const { currentUser, logout, userNotifications, markAllNotificationsRead, markNotificationRead, isAdmin, adminTab, setAdminTab, adminMode, exitAdminMode, updateUser } = useApp();
  const { theme, toggle } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdminProfile, setShowAdminProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const notifs = currentUser ? userNotifications(currentUser.id) : [];
  const unread = notifs.filter((n) => !n.read).length;
  const balance = currentUser?.walletBalance ?? 0;

  const adminTabs = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutGrid },
    { id: 'freelancers', label: 'Freelancers', icon: Users },
    { id: 'establishments', label: 'Estabelecimentos', icon: Store },
    { id: 'contracts', label: 'Escrow', icon: Briefcase },
    { id: 'jobs', label: 'Vagas', icon: Briefcase },
    { id: 'reviews', label: 'Avaliações', icon: Star },
    { id: 'vip', label: 'Planos VIP', icon: Crown },
    { id: 'wallet', label: 'Carteiras', icon: Wallet },
    { id: 'coupons', label: 'Cupons', icon: Ticket },
    { id: 'audit', label: 'Auditoria', icon: Receipt },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
  ];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/85 backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-950/85">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <img src="/image.png" alt="FreelaAgora" className="h-16 w-auto max-w-[240px] object-contain sm:h-20 sm:max-w-[300px]" />
          <button
            onClick={() => {
              if (onNavigateHome) {
                onNavigateHome();
              } else {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new Event('popstate'));
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <Home className="h-4 w-4 text-primary-500" />
            <span className="hidden sm:inline">Início</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 sm:flex dark:border-neutral-800 dark:bg-neutral-900">
            <Wallet className="h-4 w-4 text-primary-500" />
            <span className="text-sm font-bold text-neutral-900 dark:text-white">{formatCurrency(balance)}</span>
          </div>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
            </button>
            {notifOpen && (
              <div className="animate-slide-down absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card-hover dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                  <span className="font-display text-sm font-bold text-neutral-900 dark:text-white">Notificações</span>
                  {unread > 0 && <button onClick={() => markAllNotificationsRead(currentUser.id)} className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">Marcar todas lidas</button>}
                </div>
                <div className="no-scrollbar max-h-80 overflow-y-auto">
                  {notifs.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">Nenhuma notificação.</p>}
                  {notifs.slice(0, 12).map((n) => (
                    <NotifItem key={n.id} n={n} onClick={() => markNotificationRead(n.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 py-1 pl-1 pr-2 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              <Avatar src={currentUser.photo} alt={currentUser.name} size={32} ring={currentUser.vipTier && currentUser.vipTier !== 'free' ? 'vip' : undefined} />
              <ChevronDown className="h-4 w-4 text-neutral-400" />
            </button>
            {menuOpen && (
              <div className="animate-slide-down absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card-hover dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                  <p className="truncate text-sm font-bold text-neutral-900 dark:text-white">{currentUser.name}</p>
                  <p className="truncate text-xs text-neutral-400">{currentUser.email}</p>
                  {isAdmin && <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-500"><Shield className="h-3 w-3" /> Administrador</span>}
                </div>
                
                <div className="p-2 space-y-2">
                  <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                    <span className="inline-flex items-center gap-2"><Wallet className="h-4 w-4 text-primary-500" /> Carteira</span>
                    <span className="font-bold">{formatCurrency(balance)}</span>
                  </div>

                  {isAdmin && adminMode && (
                    <>
                      <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                      <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-neutral-400">Painel Admin</p>
                      <div className="max-h-56 overflow-y-auto">
                        {adminTabs.map((t) => {
                          const Icon = t.icon;
                          const active = adminTab === t.id;
                          return (
                            <button key={t.id} onClick={() => { setAdminTab(t.id); setMenuOpen(false); }} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-neutral-50 dark:hover:bg-neutral-800 ${active ? 'font-bold text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-300'}`}>
                              <Icon className="h-4 w-4 shrink-0" /> {t.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                      <button onClick={() => { setShowAdminProfile(true); setMenuOpen(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800">
                        <UserCog className="h-4 w-4" /> Editar perfil
                      </button>
                      <button onClick={exitAdminMode} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800">
                        <LayoutGrid className="h-4 w-4" /> Sair do Admin
                      </button>
                    </>
                  )}
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-error-600 transition hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10">
                    <LogOut className="h-4 w-4" /> Sair da conta
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {showAdminProfile && isAdmin && <AdminProfileModal open={showAdminProfile} onClose={() => setShowAdminProfile(false)} admin={currentUser} onSave={updateUser} />}
    </header>
  );
}

function NotifItem({ n, onClick }: { n: AppNotification; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full gap-3 border-b border-neutral-50 px-4 py-3 text-left transition hover:bg-neutral-50 dark:border-neutral-800/50 dark:hover:bg-neutral-800/50 ${!n.read ? 'bg-primary-50/50 dark:bg-primary-500/5' : ''}`}>
      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-neutral-300' : 'bg-primary-500'}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{n.title}</p>
        <p className="line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">{n.body}</p>
        <p className="mt-0.5 text-[10px] text-neutral-400">{timeAgo(n.date)}</p>
      </div>
    </button>
  );
}
