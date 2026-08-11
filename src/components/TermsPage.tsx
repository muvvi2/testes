import { Shield, ArrowLeft, FileText, ScrollText, Fingerprint, Lock, Scale, Gavel, ExternalLink, Calendar } from 'lucide-react';
import { useApp } from '@/AppContext';
import type { VipPlan, EstVipPlan } from '@/types';

export function TermsPage({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/80 backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          {onBack && (
            <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-500" />
            <h1 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Termos de Uso</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-500/15">
              <Shield className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">FreelaAgora</h2>
              <p className="text-sm text-neutral-400">Termos e Condições de Uso da Plataforma — Versão 1.9</p>
            </div>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            <Clause icon={ScrollText} title="CLÁUSULA PRIMEIRA – DO OBJETO">
              <p><strong>1.1.</strong> O FreelaAgora é um software de aproximação logística e de negócios entre Estabelecimentos e Freelancers.</p>
            </Clause>

            <Clause icon={Fingerprint} title="CLÁUSULA SEGUNDA – REGISTRO E DOCUMENTOS">
              <p><strong>2.1.</strong> O acesso exige cadastro completo com CPF/CNPJ e endereço comercial válidos.</p>
            </Clause>

            <Clause icon={Calendar} title="CLÁUSULA TERCEIRA – DO PERÍODO DE TESTE (TRIAL DE 15 DIAS)">
              <p><strong>3.1.</strong> Todo novo Estabelecimento cadastrado na plataforma recebe automaticamente um período de teste gratuito (Trial) com duração de 15 (quinze) dias corridos.</p>
              <p className="mt-2"><strong>3.2.</strong> Durante o período de teste, o Estabelecimento contará com benefícios operacionais estendidos, permitindo testar a publicação de vagas no feed conforme as configurações vigentes no Painel Administrativo.</p>
              <p className="mt-2"><strong>3.3.</strong> Após o encerramento do prazo de 15 dias do Trial, a conta será automaticamente convertida para o plano selecionado ou para o Plano Gratuito padrão, passando a vigorar os limites e taxas correspondentes.</p>
            </Clause>

            <Clause icon={Lock} title="CLÁUSULA QUARTA – PRIVACIDADE">
              <p><strong>4.1.</strong> Dados de contato permanecem ocultos até a confirmação do pagamento de custódia pelo gateway parceiro (<a href="https://www.asaas.com/r/7efd51e9-dd93-4c9c-8450-7be9873f6653" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline inline-flex items-center gap-1 font-semibold">Asaas <ExternalLink className="h-3 w-3" /></a>).</p>
            </Clause>

            <Clause icon={Scale} title="CLÁUSULA QUINTA – DA TAXA DE INTERMEDIAÇÃO E LIQUIDAÇÃO">
              <p><strong>5.1.</strong> O Estabelecimento concorda em pagar uma taxa de intermediação calculada sobre o valor total bruto da diária. Esta taxa será integralmente ADICIONADA ao valor bruto cobrado pelo profissional, garantindo que o valor integral do freelancer não sofra descontos ou deduções da plataforma.</p>
              <p className="mt-2"><strong>5.2.</strong> O percentual da taxa aditiva e o limite semanal de publicações do Estabelecimento refletem em tempo real as configurações ativas no Painel Administrativo:</p>
              <div className="mt-2">
                <DynamicEstablishmentPlansList />
              </div>
              
              <div className="mt-4">
                <p><strong>5.3.</strong> Planos e Benefícios Dinâmicos dos Freelancers:</p>
                <p className="text-xs text-neutral-500 mb-2">Os benefícios e limites de categorias dos freelancers refletem em tempo real as configurações ativas no Painel Administrativo:</p>
                <DynamicFreelancerPlansList />
              </div>

              <p className="mt-4"><strong>5.4.</strong> O desbloqueio de dados de contato e a validação da reserva ficam estritamente condicionados à confirmação de compensação bancária enviada pelo gateway de pagamento.</p>
              <p className="mt-2"><strong>5.5.</strong> Em caso de cancelamento por falta de disponibilidade do Freelancer, os valores da diária e taxas serão integralmente estornados para a carteira do Estabelecimento no prazo de 24h úteis.</p>
              <p className="mt-2"><strong>5.6.</strong> Tentativas de burlar o sistema de pagamento geram bloqueio imediato da conta e aplicação de multa.</p>
              <p className="mt-2"><strong>5.7.</strong> O FreelaAgora atua apenas como interface tecnológica, não sendo responsável por eventuais instabilidades, atrasos na compensação ou falhas técnicas operadas pelo gateway (<a href="https://www.asaas.com/r/7efd51e9-dd93-4c9c-8450-7be9873f6653" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline inline-flex items-center gap-1 font-semibold">Asaas <ExternalLink className="h-3 w-3" /></a>), cabendo ao usuário verificar o status de sua transação junto à instituição processadora.</p>
            </Clause>

            <Clause icon={Shield} title="CLÁUSULA SEXTA – ISENÇÃO DE RESPONSABILIDADE TRABALHISTA E CIVIL">
              <p><strong>6.1.</strong> A relação entre as partes é estritamente civil, sem qualquer vínculo empregatício ou subordinação.</p>
              <p className="mt-2"><strong>6.2.</strong> O FreelaAgora é isento de qualquer responsabilidade por atos, omissões, litígios, acidentes ou danos causados por usuários.</p>
              <p className="mt-2"><strong>6.3.</strong> A plataforma emite Nota Fiscal apenas sobre a sua taxa de intermediação. O valor da diária é de responsabilidade tributária do prestador.</p>
              <p className="mt-2"><strong>6.4.</strong> O usuário causador de litígio judicial obriga-se a requerer a exclusão da plataforma do polo passivo ou arcar com todos os custos de defesa.</p>
            </Clause>

            <Clause icon={Gavel} title="CLÁUSULA SÉTIMA – ASSINATURA ELETRÔNICA">
              <p><strong>7.1.</strong> O clique em 'Aceito' registra o IP e metadados como assinatura digital vinculante e jurídica.</p>
            </Clause>
          </div>

          <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800">
              <Fingerprint className="h-4 w-4 text-neutral-400" />
              <p className="text-xs text-neutral-500">
                Versão <strong>v1.9</strong> · FreelaAgora Tecnologia Ltda. · Assinatura digital auditável.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DynamicEstablishmentPlansList() {
  const { data } = useApp();
  return (
    <div className="space-y-3 ml-2">
      {data.estVipPlans.map((plan: EstVipPlan) => {
        let jobsLimit = plan.maxActiveJobs;
        if (!jobsLimit || jobsLimit <= 0) {
          if (plan.tier === 'free') jobsLimit = 2;
          else if (plan.tier === 'trial') jobsLimit = 10;
          else if (plan.tier === 'vip1') jobsLimit = 5;
          else if (plan.tier === 'vip2') jobsLimit = 20;
          else jobsLimit = 999;
        }

        return (
          <div key={plan.tier}>
            <p className="font-semibold text-neutral-900 dark:text-white">
              {plan.label} {plan.intermediationFee === 0 ? '(Isenção total - 0% de taxa)' : `(taxa de ${plan.intermediationFee}% somada ao valor total)`} — Limite de {jobsLimit >= 999 ? 'vagas ilimitadas' : `${jobsLimit} vagas por semana`}:
            </p>
            <ul className="mt-1 list-disc list-inside space-y-1 ml-2">
              {plan.features.map((f: string, i: number) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function DynamicFreelancerPlansList() {
  const { data } = useApp();
  return (
    <div className="space-y-3 ml-2">
      {data.vipPlans.map((plan: VipPlan) => (
        <div key={plan.tier}>
          <p className="font-semibold text-neutral-900 dark:text-white">{plan.label}:</p>
          <ul className="mt-1 list-disc list-inside space-y-1 ml-2">
            {plan.features.map((f: string, i: number) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Clause({ icon: Icon, title, children }: { icon: typeof Shield; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <Icon className="h-4 w-4 text-primary-500" />
        </div>
        <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-white">{title}</h3>
      </div>
      <div className="ml-10 space-y-1">{children}</div>
    </section>
  );
}
