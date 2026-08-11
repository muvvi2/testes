import { useState } from 'react';
import {
  Send, Check, Lock, Shield, Wallet, MapPin, MessageCircle, Star, Loader2,
  ArrowRight, DollarSign, Phone, Download, Clock,
} from 'lucide-react';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { formatCurrency, formatDateBR, contractStatusLabel, contractStepIndex, CONTRACT_STATUS_FLOW, downloadTaxReceipt } from '@/utils';
import { ReviewModal } from './ReviewModal';
import type { Contract } from '@/types';
import { paymentService } from '@/services/paymentService';

const STEP_ICONS = [Send, Check, Wallet, Clock, MapPin, DollarSign];

export function EscrowFlowModal({ contract, open, onClose }: { contract: Contract; open: boolean; onClose: () => void }) {
  const { currentUser, data, confirmAvailability, payEscrow, requestCheckIn, confirmCheckIn, finishService, cancelContract } = useApp();
  const { notify } = useToast();
  const [processing, setProcessing] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<'wallet' | 'pix' | 'card'>('wallet');
  const [paymentStage, setPaymentStage] = useState<'select' | 'pix' | 'card'>('select');
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixPayload, setPixPayload] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  if (!currentUser) return null;
  const isFreelancer = currentUser.id === contract.freelancerId;
  const isEstablishment = currentUser.id === contract.establishmentId;
  const stepIdx = contractStepIndex(contract.status);
  const contactUnlocked = contract.status === 'paid' || contract.status === 'check_in_pending' || contract.status === 'checked_in' || contract.status === 'completed';
  const canReview = contract.status === 'completed';

  const estUser = data?.users.find(u => u.id === contract.establishmentId);
  const balance = estUser?.walletBalance ?? 0;
  const hasEnoughBalance = balance >= contract.total;

  const handlePay = async () => {
    if (payMethod === 'wallet') {
      if (!hasEnoughBalance) {
        notify('Saldo insuficiente na carteira. Escolha PIX ou Cartão de Crédito.', 'error');
        return;
      }
      setProcessing(true);
      const res = payEscrow(contract.id, 'wallet');
      setProcessing(false);
      if (!res.ok) {
        notify(res.error || 'Erro ao processar pagamento.', 'error');
      } else {
        notify('Pagamento em garantia realizado! Contato do freelancer liberado.');
      }
      return;
    }

    setProcessing(true);
    try {
      const result = await paymentService.createPaymentWithSplit({
        customer: contract.establishmentId,
        billingType: payMethod === 'pix' ? 'PIX' : 'CREDIT_CARD',
        value: contract.total,
        dueDate: new Date().toISOString().slice(0, 10),
        description: `Escrow — ${contract.freelancerName}`,
        splits: [],
        externalReference: contract.id,
      });

      if (payMethod === 'pix') {
        if (!result.pixQrCode) throw new Error('O gateway não retornou um QR Code PIX.');
        setPixQrCode(result.pixQrCode);
        setPixPayload(result.pixQrCode);
        setPaymentStage('pix');
        notify('QR Code PIX gerado. O contrato será liberado após a confirmação do pagamento.');
      } else {
        if (!result.invoiceUrl) throw new Error('O gateway não retornou um checkout para cartão.');
        setCheckoutUrl(result.invoiceUrl);
        setPaymentStage('card');
        notify('Checkout seguro criado. Conclua o pagamento na nova página.');
      }
    } catch {
      notify('Não foi possível iniciar este pagamento. O provedor de pagamentos ainda não está disponível.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleFinish = () => {
    setProcessing(true);
    setTimeout(() => { finishService(contract.id); setProcessing(false); notify('Serviço concluído! Repasse realizado via split payment.'); }, 1400);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Contratação com Garantia" subtitle={`Contrato ${contract.id.slice(0, 12)}`} size="lg">
        {/* Parties */}
        <div className="flex items-center justify-center gap-4 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
          <div className="flex flex-col items-center gap-1.5">
            <Avatar src={contract.freelancerPhoto} alt={contract.freelancerName} size={48} ring={contactUnlocked ? 'primary' : 'neutral'} />
            <p className="max-w-[100px] truncate text-xs font-semibold text-neutral-700 dark:text-neutral-300">{contract.freelancerName}</p>
            <Badge tone="secondary">Freelancer</Badge>
          </div>
          <ArrowRight className="h-5 w-5 text-neutral-400" />
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-500/15"><Shield className="h-6 w-6 text-primary-500" /></div>
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Garantia Escrow</p>
            <Badge tone="warning">{formatCurrency(contract.total)}</Badge>
          </div>
          <ArrowRight className="h-5 w-5 text-neutral-400" />
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-500/15"><Wallet className="h-6 w-6 text-secondary-500" /></div>
            <p className="max-w-[100px] truncate text-xs font-semibold text-neutral-700 dark:text-neutral-300">{contract.establishmentName}</p>
            <Badge tone="primary">Contratante</Badge>
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Progresso</p>
          <div className="flex items-center justify-between">
            {CONTRACT_STATUS_FLOW.map((s, i) => {
              const Icon = STEP_ICONS[i] ?? Check;
              const done = i <= stepIdx && contract.status !== 'cancelled';
              const isCurrent = i === stepIdx && contract.status !== 'completed' && contract.status !== 'cancelled';
              return (
                <div key={s} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${done ? 'border-success-500 bg-success-500 text-white' : isCurrent ? 'border-primary-500 bg-primary-50 text-primary-500 dark:bg-primary-500/15' : 'border-neutral-200 bg-neutral-50 text-neutral-300 dark:border-neutral-700 dark:bg-neutral-800'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-center text-[10px] leading-tight ${done ? 'font-semibold text-neutral-700 dark:text-neutral-200' : 'text-neutral-400'}`}>{contractStatusLabel(s).split(' ').slice(0, 2).join(' ')}</span>
                  {i < CONTRACT_STATUS_FLOW.length - 1 && <div className={`hidden h-0.5 w-full sm:block ${i < stepIdx ? 'bg-success-500' : 'bg-neutral-200 dark:bg-neutral-700'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="mt-5 space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
          <Row label="Valor do freela" value={formatCurrency(contract.freelancerFee)} />
          <Row label={`Taxa de intermediação (${contract.platformFeePercentage}%)`} value={contract.platformFee === 0 ? 'Isento' : formatCurrency(contract.platformFee)} />
          <div className="border-t border-dashed border-neutral-200 pt-2 dark:border-neutral-700">
            <Row label="Total pago em garantia" value={formatCurrency(contract.total)} bold />
          </div>
        </div>

        {/* Contact unlock */}
        {isEstablishment && contactUnlocked && (
          <div className="mt-4 rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-500/30 dark:bg-success-500/10">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-success-600 dark:text-success-400" />
              <p className="font-semibold text-success-800 dark:text-success-300">Contato do freelancer liberado!</p>
            </div>
            <p className="mt-1 text-sm text-success-700 dark:text-success-400">O pagamento em garantia desbloqueou o WhatsApp e telefone do profissional. Combine os detalhes do serviço diretamente.</p>
            <div className="mt-3 flex gap-2">
              <a href={`https://wa.me/55${contract.freelancerWhatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-success-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-success-600">
                <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
              </a>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-success-300 px-3 py-1.5 text-xs font-semibold text-success-700 dark:border-success-500/30 dark:text-success-400">
                <Phone className="h-4 w-4" /> {contract.freelancerPhone}
              </span>
            </div>
          </div>
        )}

        {isEstablishment && !contactUnlocked && contract.status !== 'cancelled' && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">O contato do freelancer (WhatsApp e telefone) será liberado após o pagamento em garantia.</p>
          </div>
        )}

        {/* Action area */}
        <div className="mt-5">
          {contract.status === 'cancelled' && (
            <div className="rounded-xl border border-error-200 bg-error-50 p-4 text-center dark:border-error-500/30 dark:bg-error-500/10">
              <p className="font-semibold text-error-700 dark:text-error-400">Contrato cancelado</p>
            </div>
          )}

          {isFreelancer && contract.status === 'requested' && (
            <Button fullWidth size="lg" variant="secondary" onClick={() => { confirmAvailability(contract.id); notify('Disponibilidade confirmada! Aguardando pagamento.'); }}>
              <Check className="h-5 w-5" /> Confirmar Disponibilidade
            </Button>
          )}

          {/* Opções de Pagamento para o Estabelecimento */}
          {isEstablishment && contract.status === 'confirmed' && (
            <div className="space-y-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Escolha a Forma de Pagamento</p>
              
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button"
                  onClick={() => setPayMethod('wallet')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${payMethod === 'wallet' ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' : 'border-neutral-200 bg-white text-neutral-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'}`}
                >
                  <Wallet className="h-4 w-4 mb-1 text-primary-500" />
                  Carteira
                  <span className="text-[10px] text-neutral-400 font-normal mt-0.5">{formatCurrency(balance)}</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setPayMethod('pix')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${payMethod === 'pix' ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' : 'border-neutral-200 bg-white text-neutral-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'}`}
                >
                  <DollarSign className="h-4 w-4 mb-1 text-success-500" />
                  PIX Instantâneo
                </button>

                <button 
                  type="button"
                  onClick={() => setPayMethod('card')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${payMethod === 'card' ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' : 'border-neutral-200 bg-white text-neutral-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'}`}
                >
                  <Shield className="h-4 w-4 mb-1 text-secondary-500" />
                  Cartão de Crédito
                </button>
              </div>

              {payMethod === 'wallet' && !hasEnoughBalance && (
                <p className="text-[11px] text-error-500 font-medium">⚠️ Saldo em carteira insuficiente. Selecione PIX ou Cartão para prosseguir.</p>
              )}

              {processing && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                  Processando pagamento ({payMethod.toUpperCase()})...
                </div>
              )}

              <Button fullWidth size="lg" onClick={handlePay} disabled={processing || (payMethod === 'wallet' && !hasEnoughBalance)}>
                {processing ? <><Loader2 className="h-5 w-5 animate-spin" /> Processando...</> : <><Lock className="h-5 w-5" /> {payMethod === 'wallet' ? `Pagar ${formatCurrency(contract.total)} em Garantia` : `Gerar pagamento de ${formatCurrency(contract.total)}`}</>}
              </Button>

              {paymentStage === 'pix' && pixQrCode && (
                <div className="space-y-3 rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-500/30 dark:bg-success-500/10">
                  <div>
                    <p className="font-semibold text-success-800 dark:text-success-300">PIX aguardando pagamento</p>
                    <p className="mt-1 text-xs text-success-700 dark:text-success-400">Escaneie o QR Code ou copie o código. O contato só será liberado após a confirmação.</p>
                  </div>
                  {pixQrCode.startsWith('data:image/') ? (
                    <img src={pixQrCode} alt="QR Code PIX" className="mx-auto h-48 w-48 rounded-lg bg-white p-2" />
                  ) : (
                    <div className="rounded-lg border border-dashed border-success-300 bg-white p-3 text-center text-xs text-neutral-600">O provedor retornou o código PIX. Copie o código abaixo para pagar.</div>
                  )}
                  <div className="flex gap-2">
                    <input readOnly value={pixPayload ?? ''} className="min-w-0 flex-1 rounded-lg border border-success-200 bg-white px-3 py-2 text-xs text-neutral-700" aria-label="Código PIX" />
                    <Button size="sm" variant="outline" onClick={() => { if (pixPayload) void navigator.clipboard.writeText(pixPayload); notify('Código PIX copiado.'); }}>Copiar</Button>
                  </div>
                </div>
              )}

              {paymentStage === 'card' && checkoutUrl && (
                <div className="space-y-3 rounded-xl border border-secondary-200 bg-secondary-50 p-4 dark:border-secondary-500/30 dark:bg-secondary-500/10">
                  <p className="font-semibold text-secondary-800 dark:text-secondary-300">Checkout seguro do cartão</p>
                  <p className="text-xs text-secondary-700 dark:text-secondary-400">Os dados do cartão serão preenchidos diretamente no provedor. Este contrato continua aguardando até o pagamento ser confirmed.</p>
                  <a href={checkoutUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center rounded-lg bg-secondary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-700">Abrir checkout do cartão</a>
                </div>
              )}
            </div>
          )}

          {/* CHECK-IN DUPLO: Solicitação do Freelancer */}
          {isFreelancer && contract.status === 'paid' && (
            <Button fullWidth size="lg" variant="secondary" onClick={() => { requestCheckIn(contract.id); notify('Check-in registrado! Aguardando confirmação do estabelecimento.'); }}>
              <MapPin className="h-5 w-5" /> Registrar Chegada (Fazer Check-in)
            </Button>
          )}

          {isFreelancer && contract.status === 'check_in_pending' && (
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-3 text-center dark:border-warning-500/30 dark:bg-warning-500/10">
              <p className="text-xs font-semibold text-warning-700 dark:text-warning-300">⏳ Check-in enviado. Aguardando o estabelecimento confirmar sua presença no local.</p>
            </div>
          )}

          {/* CHECK-IN DUPLO: Confirmação do Estabelecimento */}
          {isEstablishment && contract.status === 'check_in_pending' && (
            <div className="space-y-2">
              <div className="rounded-xl border border-warning-200 bg-warning-50 p-3 text-center dark:border-warning-500/30 dark:bg-warning-500/10">
                <p className="text-xs font-semibold text-warning-700 dark:text-warning-300">🔔 O profissional registrou chegada! Confirme a presença para iniciar o turno.</p>
              </div>
              <Button fullWidth size="lg" variant="primary" onClick={() => { confirmCheckIn(contract.id); notify('Presença do profissional confirmada com sucesso!'); }}>
                <Check className="h-5 w-5" /> Confirmar Presença do Profissional
              </Button>
            </div>
          )}

          {isFreelancer && contract.status === 'checked_in' && (
            <Button fullWidth size="lg" variant="secondary" onClick={handleFinish} disabled={processing}>
              {processing ? <><Loader2 className="h-5 w-5 animate-spin" /> Processando repasse...</> : <><Check className="h-5 w-5" /> Finalizar Serviço (Check-out)</>}
            </Button>
          )}

          {canReview && (
            <Button fullWidth size="lg" variant="primary" onClick={() => setReviewOpen(true)}>
              <Star className="h-5 w-5" /> Avaliar {isFreelancer ? 'estabelecimento' : 'freelancer'}
            </Button>
          )}

          {contract.status !== 'completed' && contract.status !== 'cancelled' && (
            <button onClick={() => { cancelContract(contract.id); notify('Contrato cancelado', 'warning'); }} className="mt-3 w-full text-center text-xs font-semibold text-error-500 hover:underline">
              Cancelar contratação
            </button>
          )}
        </div>

        {/* History */}
        <div className="mt-5 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Histórico</p>
          <div className="space-y-1.5">
            {contract.history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>{contractStatusLabel(h.status)}</span>
                <span>{formatDateBR(h.at)}</span>
              </div>
            ))}
          </div>
        </div>

        {contract.status === 'completed' && (
          <div className="mt-4">
            <Button fullWidth size="lg" variant="outline" onClick={() => downloadTaxReceipt(contract)}>
              <Download className="h-5 w-5" /> Baixar Comprovante de Prestação (Contabilidade)
            </Button>
          </div>
        )}
      </Modal>

      {reviewOpen && canReview && (
        <ReviewModal
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          contractId={contract.id}
          fromId={currentUser.id}
          fromName={currentUser.name}
          toId={isFreelancer ? contract.establishmentId : contract.freelancerId}
          toName={isFreelancer ? contract.establishmentName : contract.freelancerName}
        />
      )}
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? 'font-semibold text-neutral-900 dark:text-white' : 'text-sm text-neutral-600 dark:text-neutral-300'}>{label}</span>
      <span className={bold ? 'font-display text-lg font-extrabold text-primary-600 dark:text-primary-400' : 'font-semibold text-neutral-800 dark:text-neutral-100'}>{value}</span>
    </div>
  );
}
