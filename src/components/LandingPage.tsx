import { useState } from 'react';
import { LogIn, UserPlus, Shield, Wallet, Calendar, MapPin, Check, Eye, EyeOff, ChefHat, Store, Fingerprint, AlertCircle, ExternalLink, Info } from 'lucide-react';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Field';
import { emailValid, maskCPF, maskCNPJ, maskPhone, maskCEP, validateCPF, validateCNPJ } from '@/utils';
import { LEGAL_VERSION } from '@/mockData';
import { ASAAS_REFERRAL_LINK } from '@/services/paymentService';
import type { AccountType, User, Address, TermsAcceptance } from '@/types';

const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export function LandingPage({ onNavigateTerms }: { onNavigateTerms?: () => void }) {
  const [authModal, setAuthModal] = useState<null | 'login' | 'register'>(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-primary-950/40" />
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-secondary-500/15 blur-3xl" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="flex items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <img src="/image.png" alt="FreelaAgora" className="h-16 w-auto max-w-[260px] object-contain sm:h-20 sm:max-w-[320px]" />
          </div>
          <button onClick={onNavigateTerms} className="text-sm font-medium text-neutral-400 transition hover:text-white">Termos de Uso</button>
        </nav>

        <main className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center sm:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-neutral-300 backdrop-blur">
            <Shield className="h-3.5 w-3.5 text-secondary-400" />
            Pagamento seguro com garantia (escrow) via Cora
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
            Precisa de alguém?<br />
            <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Chame aqui!</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-neutral-400 sm:text-lg">
            O marketplace de contratação emergencial de freelancers para bares, restaurantes, buffets e eventos. Garçom, churrasqueiro, bartender — encontre quem precisa em minutos.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => setAuthModal('login')} className="bg-primary-500 text-white hover:bg-primary-600 shadow-glow"><LogIn className="h-5 w-5" /> Entrar</Button>
            <Button size="lg" variant="outline" onClick={() => setAuthModal('register')} className="border-white/20 text-white hover:bg-white/10"><UserPlus className="h-5 w-5" /> Cadastrar-se</Button>
          </div>
          <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            <FeatureCard icon={Wallet} title="Garantia (Escrow)" desc="Pagamento retido até a conclusão do serviço. Segurança para os dois lados." />
            <FeatureCard icon={Calendar} title="Agenda de turnos" desc="Freelancers definem disponibilidade por manhã, tarde e noite." />
            <FeatureCard icon={MapPin} title="Busca por proximidade" desc="Só aparecem profissionais da sua cidade e região metropolitana." />
          </div>
        </main>

        <footer className="px-5 py-6 text-center text-xs text-neutral-500 sm:px-8">
          FreelaAgora · Plataforma fintech de freelancers · {new Date().getFullYear()}
        </footer>
      </div>

      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onSwitch={(m) => setAuthModal(m)} onNavigateTerms={onNavigateTerms} />}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: typeof Shield; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur transition hover:border-white/20">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15"><Icon className="h-5 w-5 text-primary-400" /></div>
      <h3 className="font-display font-bold text-white">{title}</h3>
      <p className="mt-1 text-sm text-neutral-400">{desc}</p>
    </div>
  );
}

function AuthModal({ mode, onClose, onSwitch, onNavigateTerms }: { mode: 'login' | 'register'; onClose: () => void; onSwitch: (m: 'login' | 'register') => void; onNavigateTerms?: () => void }) {
  return mode === 'login' ? <LoginForm onClose={onClose} onSwitch={onSwitch} /> : <RegisterForm onClose={onClose} onSwitch={onSwitch} onNavigateTerms={onNavigateTerms} />;
}

function LoginForm({ onClose, onSwitch }: { onClose: () => void; onSwitch: (m: 'login' | 'register') => void }) {
  const { login } = useApp();
  const { notify } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!emailValid(email)) { setError('Informe um e-mail válido.'); return; }
    if (!password) { setError('Informe sua senha.'); return; }
    const res = login(email, password);
    if (!res.ok) { setError(res.error ?? 'Erro ao entrar.'); return; }
    notify('Bem-vindo de volta!');
    onClose();
  };

  return (
    <Modal open onClose={onClose} size="sm" footer={<div className="text-center text-sm text-neutral-500">Não tem conta? <button onClick={() => onSwitch('register')} className="font-semibold text-primary-600 hover:underline dark:text-primary-400">Cadastrar-se</button></div>}>
      <div className="mb-5 flex items-center gap-2">
        <img src="/image.png" alt="FreelaAgora" className="h-16 w-auto max-w-[260px] object-contain" />
        <div><h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Entrar no FreelaAgora</h2><p className="text-xs text-neutral-400">Acesse sua conta</p></div>
      </div>
      <div className="space-y-4" onKeyDown={(e) => e.key === 'Enter' && submit()}>
        <Input label="E-mail" type="email" placeholder="seu@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} />
        <div className="relative">
          <Input label="Senha" type={showPw ? 'text' : 'password'} placeholder="••••••" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} />
          <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-[34px] text-neutral-400 hover:text-neutral-600">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
        </div>
        {error && <p className="text-sm text-error-500">{error}</p>}
        <Button fullWidth size="lg" onClick={submit}><LogIn className="h-4 w-4" /> Entrar</Button>
      </div>
    </Modal>
  );
}

function emptyAddr(): Address {
  return { cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: 'SP' };
}

function RegisterForm({ onClose, onSwitch, onNavigateTerms }: { onClose: () => void; onSwitch: (m: 'login' | 'register') => void; onNavigateTerms?: () => void }) {
  const { register } = useApp();
  const { notify } = useToast();
  const [accountType, setAccountType] = useState<AccountType>('freelancer');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [addr, setAddr] = useState<Address>(emptyAddr());
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [establishmentType, setEstablishmentType] = useState('Bar & Restaurante');
  const [serviceRadius, setServiceRadius] = useState('25');
  const [interstate, setInterstate] = useState(false);
  const [asaasWalletId, setAsaasWalletId] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) { setError('Informe seu nome.'); return; }
    if (!emailValid(email)) { setError('Informe um e-mail válido.'); return; }
    if (password.length < 6) { setError('A senha deve ter ao menos 6 caracteres.'); return; }
    if (!phone) { setError('Informe um telefone de contato.'); return; }
    if (!addr.cep || !addr.street || !addr.number || !addr.neighborhood || !addr.city) { setError('Preencha o endereço completo (CEP, rua, número, bairro, cidade).'); return; }

    if (accountType === 'freelancer') {
      if (!cpf) { setError('Informe seu CPF.'); return; }
      if (!validateCPF(cpf)) { setError('CPF inválido'); return; }
      if (!asaasWalletId.trim()) { setError('Informe seu ID da Conta Asaas para receber repasses via Split de Pagamento.'); return; }
    } else {
      if (!cnpj) { setError('Informe seu CNPJ.'); return; }
      if (!validateCNPJ(cnpj)) { setError('CNPJ inválido'); return; }
    }

    if (!acceptedTerms) { setError('Você deve aceitar os Termos de Uso para continuar.'); return; }

    const acceptance: TermsAcceptance = {
      timestamp: new Date().toISOString(),
      ip: '189.45.22.10',
      userAgent: navigator.userAgent,
      legalVersion: LEGAL_VERSION,
    };

    const base = { accountType, name: name.trim(), nickname: nickname.trim() || undefined, email, password, photo: defaultPhoto(accountType), phone, whatsapp: whatsapp || phone, address: addr, termsAcceptance: acceptance };
    const extra = accountType === 'freelancer'
      ? { cpf, asaasWalletId: asaasWalletId.trim(), bio: '', specialties: [], dailyRate: 0, hourlyRate: 0, pixKey: '', serviceRadiusKm: Number(serviceRadius) || 25, acceptsInterstate: interstate }
      : { cnpj, establishmentType };
    const res = register({ ...base, ...extra } as User);
    if (!res.ok) { setError(res.error ?? 'Erro ao cadastrar.'); return; }
    notify('Conta criada com sucesso! Bem-vindo ao FreelaAgora.');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Criar sua conta" subtitle="Cadastro completo — leva menos de um minuto" size="lg"
      footer={
        <div className="flex flex-col gap-2">
          <Button fullWidth size="lg" onClick={submit} disabled={!acceptedTerms || !termsScrolled} className={(!acceptedTerms || !termsScrolled) ? 'opacity-50 cursor-not-allowed' : ''}><Check className="h-4 w-4" /> Criar conta</Button>
          {(!acceptedTerms || !termsScrolled) && (
            <p className="text-center text-xs text-neutral-400">Role os termos até o final e marque o checkbox para ativar o botão de cadastro.</p>
          )}
          <div className="text-center text-sm text-neutral-500">Já tem conta? <button onClick={() => onSwitch('login')} className="font-semibold text-primary-600 hover:underline dark:text-primary-400">Entrar</button></div>
        </div>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3">
        <TypeCard active={accountType === 'freelancer'} onClick={() => setAccountType('freelancer')} icon={ChefHat} label="Sou Freelancer" desc="Presto serviços" />
        <TypeCard active={accountType === 'establishment'} onClick={() => setAccountType('establishment')} icon={Store} label="Sou Estabelecimento" desc="Contrato profissionais" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label={accountType === 'freelancer' ? 'Nome completo' : 'Nome do estabelecimento'} value={name} onChange={(e) => { setName(e.target.value); setError(''); }} /></div>
        {accountType === 'freelancer' && <Input label="Apelido / Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ex: Tigrão" />}
        <Input label="E-mail" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} />
        <Input label="Senha (mín. 6 caracteres)" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} />
        <Input label="Telefone de contato" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(11) 99999-9999" />
        <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} placeholder="(11) 99999-9999" hint="Oculto até escrow" />
      </div>

      {/* Address block */}
      <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Endereço Completo</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="CEP" value={addr.cep} onChange={(e) => setAddr({ ...addr, cep: maskCEP(e.target.value) })} placeholder="00000-000" />
          <div className="sm:col-span-2"><Input label="Logradouro (Rua)" value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} /></div>
          <Input label="Número" value={addr.number} onChange={(e) => setAddr({ ...addr, number: e.target.value })} />
          <Input label="Complemento" value={addr.complement ?? ''} onChange={(e) => setAddr({ ...addr, complement: e.target.value })} />
          <Input label="Bairro" value={addr.neighborhood} onChange={(e) => setAddr({ ...addr, neighborhood: e.target.value })} />
          <Input label="Cidade" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
          <Select label="Estado (UF)" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })}>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      {/* Geo preferences (freelancers only) */}
      {accountType === 'freelancer' && (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Área de Atendimento</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Raio de atendimento (km)" type="number" value={serviceRadius} onChange={(e) => setServiceRadius(e.target.value)} placeholder="25" />
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <input type="checkbox" checked={interstate} onChange={(e) => setInterstate(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500/20" />
                Aceito contratos interestaduais
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Document & Establishment Type */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {accountType === 'freelancer' ? (
          <>
            <Input label="CPF" value={cpf} onChange={(e) => { setCpf(maskCPF(e.target.value)); setError(''); }} placeholder="000.000.000-00" hint="Validação algorítmica" />
            <div className="flex items-end pb-2"><div className="flex items-center gap-1.5 text-xs text-neutral-400"><Fingerprint className="h-4 w-4 text-secondary-500" /> Validação matemática de dígitos</div></div>
          </>
        ) : (
          <>
            <Input label="CNPJ" value={cnpj} onChange={(e) => { setCnpj(maskCNPJ(e.target.value)); setError(''); }} placeholder="00.000.000/0000-00" hint="Validação algorítmica" />
            <Select label="Tipo de estabelecimento" value={establishmentType} onChange={(e) => setEstablishmentType(e.target.value)}>
              {['Bar & Restaurante', 'Buffet & Eventos', 'Restaurante', 'Bar', 'Lanchonete', 'Padaria', 'Casa de Shows', 'Hotel'].map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </>
        )}
      </div>

      {/* Asaas wallet ID — freelancers only */}
      {accountType === 'freelancer' && (
        <div className="mt-4 space-y-3">
          <Input
            label="ID da Conta Asaas (Chave da Carteira)"
            value={asaasWalletId}
            onChange={(e) => { setAsaasWalletId(e.target.value); setError(''); }}
            placeholder="Ex: wallet_abc123..."
            hint="Obrigatório para receber repasses via Split de Pagamento"
          />
          <div className="flex items-start gap-2.5 rounded-xl bg-primary-50 p-3 dark:bg-primary-500/10">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
            <div className="space-y-1">
              <p className="text-xs text-primary-800 dark:text-primary-300">
                O FreelaAgora utiliza repasse automático via Split de Pagamento. Para receber suas diárias, você precisa ter uma conta digital ativa no Asaas.
              </p>
              <a
                href={ASAAS_REFERRAL_LINK}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline dark:text-primary-400"
              >
                Criar conta gratuita no Asaas (Indicação FreelaAgora)
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Terms acceptance with scroll-to-bottom enforcement */}
      <div className="mt-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <button
          type="button"
          onClick={() => setTermsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300"
        >
          <span>Termos e Condições de Uso — v1.9</span>
          <span className="text-xs text-neutral-400">{termsOpen ? 'Recolher' : 'Expandir'}</span>
        </button>
        {termsOpen && (
          <div
            className="max-h-64 overflow-y-auto border-t border-neutral-200 px-4 py-3 text-xs leading-relaxed text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
            onScroll={(e) => {
              const el = e.currentTarget;
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
                setTermsScrolled(true);
              }
            }}
          >
            <p className="font-bold text-neutral-800 dark:text-neutral-200">TERMOS E CONDIÇÕES DE USO DA PLATAFORMA — VERSÃO 1.9 — FREELAAGORA</p>
            <p className="mt-2 font-semibold">CLÁUSULA PRIMEIRA – DO OBJETO</p>
            <p>1.1. O FreelaAgora atua estritamente como um software de aproximação logística e de negócios entre Contratantes (Estabelecimentos) e Prestadores de Serviços Autônomos (Freelancers).</p>
            <p className="mt-2 font-semibold">CLÁUSULA SEGUNDA – REGISTRO E VALIDAÇÃO DE DOCUMENTOS</p>
            <p>2.1. O acesso fica condicionado ao preenchimento de cadastro completo com CPF ou CNPJ validados algoritmicamente pelo sistema, além do endereço comercial estruturado com CEP, rua, número e bairro.</p>
            <p className="mt-2 font-semibold">CLÁUSULA TERCEIRA – PRIVACIDADE E FLUXO DE CONTATO</p>
            <p>3.1. Os dados de contato direto (WhatsApp e telefone) permanecem protegidos e inacessíveis até que o fluxo financeiro de custódia seja integralmente processado e confirmado pelo gateway de pagamento parceiro.</p>
            <p className="mt-2 font-semibold">CLÁUSULA QUARTA – DOS PLANOS DE ASSINATURA, RECURSOS E TAXAS</p>
            <p>4.1. Parametrização Dinâmica: Todas as mensalidades, taxas de intermediação, taxas fixas, limites de categorias no perfil e níveis de destaque na busca são definidos e alterados dinamicamente via Painel Administrativo, integrando-se automaticamente a este contrato conforme os valores vigentes configurados no sistema no ato da transação.</p>
            <p className="mt-2"><strong>4.2.</strong> VIP Corporativo e Profissional: Os planos de assinatura e suas respectivas vantagens de redução de taxas (para estabelecimentos) ou de ganho de visibilidade e recursos (para freelancers) seguem rigorosamente a tabela ativa detalhada nas áreas de contratação do próprio aplicativo.</p>
            <p className="mt-2"><strong>4.3.</strong> O desbloqueio de contatos exige a compensação bancária integral pelo gateway.</p>
            <p className="mt-2"><strong>4.4.</strong> Cancelamentos por falta do Freelancer geram estorno integral na carteira do Estabelecimento em até 24h úteis.</p>
            <p className="mt-2"><strong>4.5.</strong> Tentativas de burlar o sistema de pagamentos geram bloqueio imediato e multa.</p>
            <p className="mt-2"><strong>4.6.</strong> A plataforma é isenta de responsabilidade por falhas técnicas, instabilidades ou atrasos operados pelo gateway de pagamento.</p>
            <p className="mt-2 font-semibold">CLÁUSULA QUINTA – DA AUSÊNCIA DE VÍNCULO TRABALHISTA E ISENÇÃO DE RESPONSABILIDADE</p>
            <p>5.1. A relação entre a plataforma, o Freelancer e o Estabelecimento é de caráter puramente civil, sem qualquer subordinação, habitualidade ou vínculo empregatício.</p>
            <p>5.2. O FreelaAgora fica expressamente ISENTO de qualquer culpa, litígio, dolo, responsabilidade civil ou trabalhista decorrente dos atos, omissões, acidentes de trabalho, condutas inadequadas ou danos materiais causados por freelancers ou estabelecimentos antes, durante ou após a execução das diárias. Cada parte responde individual e integralmente por suas ações civis e criminais.</p>
            <p>5.3. O FreelaAgora emitirá Nota Fiscal de Serviço (NFS-e) referente exclusivamente ao valor da taxa de intermediação retida pela plataforma. O valor principal da diária, que transita pelo gateway em regime de custódia para o Freelancer, é de responsabilidade tributária integral do prestador do serviço.</p>
            <p>5.4. Caso o FreelaAgora seja acionado judicialmente por atos de um Usuário, o Usuário causador do dano obriga-se a requerer a exclusão da plataforma do polo passivo da ação ou arcar com todas as custas processuais e honorários advocatícios despendidos pela plataforma em sua defesa (Denunciação da Lide).</p>
            <p className="mt-2 font-semibold">CLÁUSULA SEXTA – AUDITORIA DE ASSINATURA ELETRÔNICA</p>
            <p>6.1. Ao clicar em 'Aceito', o usuário autoriza o registro irrevogável do seu endereço de IP e metadados como assinatura digital vinculante para fins de comprovação jurídica de aceite contratual.</p>
            <p className="mt-2 text-neutral-400">Documento eletrônico versão v1.9 · FreelaAgora Tecnologia Ltda. · Aceite com assinatura digital auditável.</p>
            {!termsScrolled && (
              <p className="mt-2 rounded-lg bg-warning-50 px-3 py-2 text-xs font-semibold text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                Role até o final para confirmar que leu os termos.
              </p>
            )}
            {termsScrolled && (
              <p className="mt-2 rounded-lg bg-success-50 px-3 py-2 text-xs font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-400">
                Termos lidos. Você já pode aceitar abaixo.
              </p>
            )}
          </div>
        )}
      </div>
      <label className={`mt-3 flex items-start gap-2.5 ${!termsScrolled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        <input
          type="checkbox"
          checked={acceptedTerms}
          disabled={!termsScrolled}
          onChange={(e) => { setAcceptedTerms(e.target.checked); setError(''); }}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-primary-500 focus:ring-primary-400 disabled:cursor-not-allowed dark:border-neutral-600 dark:bg-neutral-800"
        />
        <span className="text-sm text-neutral-600 dark:text-neutral-300">
          Li e aceito os{' '}
          <button type="button" onClick={(e) => { e.preventDefault(); onNavigateTerms?.(); }} className="font-semibold text-primary-600 hover:underline dark:text-primary-400">Termos de Uso do FreelaAgora</button>
        </span>
      </label>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-error-50 px-3 py-2 dark:bg-error-500/10">
          <AlertCircle className="h-4 w-4 text-error-500" />
          <p className="text-sm text-error-500">{error}</p>
        </div>
      )}

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-secondary-50 p-3 dark:bg-secondary-500/10">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-secondary-500" />
        <p className="text-xs text-secondary-700 dark:text-secondary-300">Seus dados de contato (WhatsApp e telefone) ficarão <strong>ocultos</strong> para estabelecimentos até que uma contratação com pagamento em garantia seja confirmada. O aceite dos termos registra IP, User Agent e timestamp como assinatura digital.</p>
      </div>
    </Modal>
  );
}

function TypeCard({ active, onClick, icon: Icon, label, desc }: { active: boolean; onClick: () => void; icon: typeof Store; label: string; desc: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition ${active ? 'border-primary-400 bg-primary-50 dark:bg-primary-500/10' : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'}`}>
      <Icon className={`h-7 w-7 ${active ? 'text-primary-500' : 'text-neutral-400'}`} />
      <div><p className={`text-sm font-bold ${active ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{label}</p><p className="text-xs text-neutral-400">{desc}</p></div>
    </button>
  );
}

function defaultPhoto(type: AccountType): string {
  return type === 'freelancer'
    ? 'https://images.pexels.com/photos/804009/pexels-photo-804009.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
    : 'https://images.pexels.com/photos/5531664/pexels-photo-5531664.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
}
