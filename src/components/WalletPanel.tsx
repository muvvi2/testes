import { useState } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight, Plus, ArrowUpFromLine, Lock, TrendingUp, DollarSign, Check, Ticket, Copy, QrCode as QrIcon } from 'lucide-react';
import { useApp } from '@/AppContext';
import { supabase } from '@/lib/supabase';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Field';
import { Badge } from './ui/Badge';
import { formatCurrency, formatDate } from '@/utils';
import type { WalletTx } from '@/types';

const txMeta: Record<WalletTx['type'], { icon: typeof Plus; tone: 'success' | 'warning' | 'primary' | 'secondary' | 'error' | 'neutral'; label: string }> = {
  deposit: { icon: Plus, tone: 'success', label: 'Depósito' },
  escrow_hold: { icon: Lock, tone: 'warning', label: 'Garantia' },
  escrow_release: { icon: TrendingUp, tone: 'success', label: 'Repasse' },
  platform_fee: { icon: DollarSign, tone: 'primary', label: 'Taxa' },
  withdraw: { icon: ArrowUpFromLine, tone: 'neutral', label: 'Saque' },
  vip_charge: { icon: DollarSign, tone: 'error', label: 'VIP' },
  vip_charge_est: { icon: DollarSign, tone: 'error', label: 'VIP Empresa' },
  coupon_discount: { icon: Ticket, tone: 'secondary', label: 'Cupom' },
};

export function WalletPanel({ userId }: { userId: string }) {
  const { currentUser, userWalletBalance, userWalletTxs, depositToWallet, withdrawFromWallet } = useApp();
  const { notify } = useToast();
  const balance = userWalletBalance(userId);
  const txs = userWalletTxs(userId);
  const [modal, setModal] = useState<null | 'deposit' | 'withdraw'>(null);
  const [amount, setAmount] = useState('');
  const [pixData, setPixData] = useState<{ qrCode: string; payload: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const v = Number(amount);
    if (!v || v <= 0) { notify('Informe um valor válido', 'warning'); return; }
    
    if (modal === 'deposit') {
      try {
        setLoading(true);
        // Gera cobrança real no Asaas para o depósito via PIX
        const response = await supabase.functions.invoke('asaas-payment', {
          body: {
            value: v, // Ajustado para 'value' para bater com a Edge Function
            description: `Depósito na carteira FreelaAgora`,
            customerName: currentUser?.name || 'Cliente FreelaAgora',
            customerEmail: currentUser?.email || 'cliente@freelaagora.com', // E-mail obrigatório
            customerCpfCnpj: currentUser?.cpfCnpj || '00000000000',
            externalReference: userId,
            type: 'payment',
            billingType: 'PIX'
          }
        });

        if (response.error || !response.data?.success) {
          throw new Error(response.error?.message || response.data?.error || 'Erro ao gerar PIX de depósito.');
        }

        setPixData({
          qrCode: `data:image/png;base64,${response.data.encodedImage}`,
          payload: response.data.payload
        });
        notify('PIX de depósito gerado com sucesso!');
      } catch (err: any) {
        notify(err.message || 'Erro ao processar depósito.', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      if (v > balance) { notify('Saldo insuficiente para saque', 'warning'); return; }
      withdrawFromWallet(userId, v); 
      notify(`${formatCurrency(v)} sacado da carteira`);
      setModal(null); 
      setAmount('');
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-500/15"><Wallet className="h-5 w-5 text-primary-500" /></div>
        <h3 className="font-display font-bold text-neutral-900 dark:text-white">Carteira Digital</h3>
      </div>

      {/* Balance card */}
      <div className="rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-4 text-white">
        <p className="text-xs text-white/70">Saldo disponível</p>
        <p className="mt-1 font-display text-3xl font-extrabold">{formatCurrency(balance)}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setModal('deposit')} className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-white/30">
            <Plus className="h-3.5 w-3.5" /> Depositar
          </button>
          <button onClick={() => setModal('withdraw')} className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-white/30">
            <ArrowUpFromLine className="h-3.5 w-3.5" /> Sacar
          </button>
        </div>
      </div>

      {/* Transaction history */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Extrato</p>
        <div className="space-y-2">
          {txs.length === 0 && <p className="py-4 text-center text-sm text-neutral-400">Sem movimentações ainda.</p>}
          {txs.slice(0, 10).map((tx) => {
            const meta = txMeta[tx.type];
            const positive = tx.amount > 0;
            return (
              <div key={tx.id} className="flex items-center gap-3 rounded-lg border border-neutral-100 p-2.5 dark:border-neutral-800">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${positive ? 'bg-success-100 text-success-600 dark:bg-success-500/15 dark:text-success-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'}`}>
                  {positive ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{tx.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <span className="text-xs text-neutral-400">{formatDate(tx.date)}</span>
                  </div>
                </div>
                <span className={`shrink-0 text-sm font-bold ${positive ? 'text-success-600 dark:text-success-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  {positive ? '+' : ''}{formatCurrency(tx.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={!!modal} onClose={() => { setModal(null); setPixData(null); }} title={modal === 'deposit' ? 'Depositar na carteira via PIX' : 'Sacar da carteira'} size="sm"
        footer={!pixData ? <div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setModal(null)}>Cancelar</Button><Button fullWidth onClick={submit} disabled={loading}><Check className="h-4 w-4" /> {loading ? 'Gerando...' : 'Confirmar'}</Button></div> : undefined}>
        <div className="space-y-3">
          {!pixData ? (
            <>
              <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
                <p className="text-xs text-neutral-400">Saldo atual</p>
                <p className="font-display text-xl font-bold text-neutral-900 dark:text-white">{formatCurrency(balance)}</p>
              </div>
              <Input label="Valor (R$)" type="number" min={0} placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              {modal === 'withdraw' && <p className="text-xs text-neutral-400">O saque é processado via PIX para a chave cadastrada.</p>}
            </>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">Escaneie o QR Code abaixo para adicionar saldo à carteira:</p>
              <div className="flex justify-center">
                <img src={pixData.qrCode} alt="QR Code PIX Depósito" className="h-48 w-48 rounded-xl border border-neutral-200 p-2 dark:border-neutral-700" />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-neutral-500">Pix Copia e Cola:</p>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-800">
                  <input type="text" readOnly value={pixData.payload} className="w-full bg-transparent text-xs text-neutral-700 outline-none dark:text-neutral-300" />
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(pixData.payload);
                    notify('Chave PIX copiada!');
                  }}>
                    <Copy className="h-3.5 w-3.5" /> Copiar
                  </Button>
                </div>
              </div>
              <Button fullWidth variant="outline" onClick={() => { setModal(null); setPixData(null); setAmount(''); }}>
                Concluir / Fechar
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
