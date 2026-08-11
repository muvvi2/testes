import type { AppData, Category, MacroCategory, VipPlan, EstVipPlan, MetroMap, User, WeekAvailability, Job, Contract, WalletTx, AppNotification, Review, Address } from './types';

// ============================================================
// MACRO-CATEGORIES (8 Setores Principais)
// ============================================================
export const MACRO_CATEGORIES: MacroCategory[] = [
  { id: 'tecnico', label: 'Técnico, Saúde, Educação e Digital', icon: 'Stethoscope', color: '#8b5cf6' },
  { id: 'alimentacao', label: 'Alimentação e Gastronomia', icon: 'ChefHat', color: '#f97316' },
  { id: 'eventos', label: 'Eventos, Entretenimento e Estética', icon: 'PartyPopper', color: '#ec4899' },
  { id: 'manutencao', label: 'Manutenção, Reformas e Emergências', icon: 'Wrench', color: '#f59e0b' },
  { id: 'domesticos', label: 'Domésticos e Cuidados', icon: 'Home', color: '#22c55e' },
  { id: 'logistica', label: 'Logística, Segurança e Serviços Gerais', icon: 'Truck', color: '#3b82f6' },
  { id: 'varejo', label: 'Varejo, Comércio e Atendimento', icon: 'Store', color: '#0891b2' },
  { id: 'agronegocio', label: 'Agronegócio e Meio Ambiente', icon: 'Sprout', color: '#10b981' },
];

// ============================================================
// CATEGORIES
// ============================================================
export const CATEGORIES: Category[] = [
  { id: 'suporte_de_ti_infraestrutura_redes', label: 'Suporte de TI / Infraestrutura / Redes', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'assistencia_tecnica_de_celulares_tablets_e_eletronicos', label: 'Assistência Técnica de Celulares, Tablets e Eletrônicos', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'enfermeiroa_particular_home_care', label: 'Enfermeiro(a) Particular / Home Care', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'tecnicoa_em_enfermagem_plantonista', label: 'Técnico(a) em Enfermagem Plantonista', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'fisioterapeuta_domiciliar_ortopedico_e_respiratorio', label: 'Fisioterapeuta Domiciliar / Ortopédico e Respiratório', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'massoterapeuta_terapeuta_holistico', label: 'Massoterapeuta / Terapeuta Holístico', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'acupunturista_quiropraxista', label: 'Acupunturista / Quiropraxista', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'personal_trainer_educadora_fisico', label: 'Personal Trainer / Educador(a) Físico', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'professora_particular_reforco_escolar_idiomas', label: 'Professor(a) Particular / Reforço Escolar / Idiomas', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'psicologoa_clinico_terapeuta', label: 'Psicólogo(a) Clínico / Terapeuta', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'fonoaudiologoa', label: 'Fonoaudiólogo(a)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'nutricionista_clinico_esportivo_domiciliar', label: 'Nutricionista Clínico / Esportivo Domiciliar', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'medicoa_veterinarioa_home_care_pet', label: 'Médico(a) Veterinário(a) Home Care / Pet', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'tradutora_interprete_comercial_e_juramentado', label: 'Tradutor(a) / Intérprete Comercial e Juramentado', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'desenvolvedora_programadora_web_e_apps', label: 'Desenvolvedor(a) / Programador(a) Web e Apps', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'designer_grafico_ui_ux_motion_designer', label: 'Designer Gráfico / UI/UX / Motion Designer', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'social_media_gestora_de_trafego_pago', label: 'Social Media / Gestor(a) de Tráfego Pago', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'redatora_copywriter_revisora_de_texto', label: 'Redator(a) / Copywriter / Revisor(a) de Texto', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'contadora_consultora_fiscal_e_tributario', label: 'Contador(a) / Consultor(a) Fiscal e Tributário', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'advogadoa_consultora_freelancer', label: 'Advogado(a) Consultor(a) Freelancer', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },

  { id: 'cozinheiroa_auxiliar_de_cozinha', label: 'Cozinheiro(a) / Auxiliar de Cozinha', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'cozinheiroa_executivo_chef_de_cozinha', label: 'Cozinheiro(a) Executivo / Chef de Cozinha', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'garcom_garconete', label: 'Garçom / Garçonete', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'barista_especialista_em_cafes', label: 'Barista / Especialista em Cafés', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'bartender_barman_mixologista', label: 'Bartender / Barman / Mixologista', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'padeiroa_artesanal_industrial', label: 'Padeiro(a) Artesanal / Industrial', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'confeiteiroa_cake_designer', label: 'Confeiteiro(a) / Cake Designer', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'pizzaioloa_forneiro', label: 'Pizzaiolo(a) / Forneiro', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'churrasqueiroa_mestre_braseiro', label: 'Churrasqueiro(a) / Mestre Braseiro', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'sushiman_culinaria_japonesa', label: 'Sushiman / Culinária Japonesa', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },

  { id: 'promotora_de_eventos_feiras', label: 'Promotor(a) de Eventos / Feiras', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'recreadora_animadora_infantil', label: 'Recreador(a) / Animador(a) Infantil', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'recepcionista_cerimonialista_de_eventos', label: 'Recepcionista / Cerimonialista de Eventos', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'dj_produtor_musical_de_pista', label: 'DJ / Produtor Musical de Pista', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'fotografoa_profissional', label: 'Fotógrafo(a) Profissional', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'cabeleireiroa_colorista', label: 'Cabeleireiro(a) / Colorista', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'barbeiro_visagista', label: 'Barbeiro / Visagista', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'manicure_pedicure_podologa', label: 'Manicure / Pedicure / Podóloga', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },

  { id: 'montadora_de_moveis', label: 'Montador(a) de Móveis', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'pintora_residencial_e_comercial', label: 'Pintor(a) Residencial e Comercial', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'gesseiroa_instalador_de_drywall', label: 'Gesseiro(a) / Instalador de Drywall', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'eletricista_residencial_comercial_e_predial', label: 'Eletricista Residencial, Comercial e Predial', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'encanadora_bombeiro_hidraulico', label: 'Encanador(a) / Bombeiro Hidráulico', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'pedreiroa_azulejista_ajudante', label: 'Pedreiro(a) / Azulejista / Ajudante', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },

  { id: 'baba_cuidadora_infantil', label: 'Babá / Cuidador(a) Infantil', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'cuidadora_de_idosos', label: 'Cuidador(a) de Idosos', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'diarista_limpeza_residencial', label: 'Diarista / Limpeza Residencial', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'faxineiroa_pos_obra_limpeza_pesada', label: 'Faxineiro(a) Pós-Obra / Limpeza Pesada', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'jardineiroa_paisagista_residencial', label: 'Jardineiro(a) / Paisagista Residencial', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'piscineiroa_tratamento_de_agua', label: 'Piscineiro(a) / Tratamento de Água', icon: 'Home', color: '#22c55e', macro: 'domesticos' },

  { id: 'motoboy_entregadora_com_moto', label: 'Motoboy / Entregador(a) com Moto', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'motorista_entregadora_de_carro_van_fiorino', label: 'Motorista Entregador(a) de Carro / Van / Fiorino', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'seguranca_privada_guarda_costas', label: 'Segurança Privada / Guarda-Costas', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'controladora_de_acesso_portaria', label: 'Controlador(a) de Acesso / Portaria', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },

  { id: 'balconista_atendente_de_loja', label: 'Balconista / Atendente de Loja', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'operadora_de_caixa_frente_de_loja', label: 'Operador(a) de Caixa / Frente de Loja', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'repositora_de_mercadorias_estoque', label: 'Repositor(a) de Mercadorias / Estoque', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'vendedora_temporarioa_de_shopping', label: 'Vendedor(a) Temporário(a) de Shopping', icon: 'Store', color: '#0891b2', macro: 'varejo' },

  { id: 'operador_de_drone_agricola', label: 'Operador de Drone Agrícola', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
  { id: 'tratorista_freelancer_operador_de_maquinario_pesado', label: 'Tratorista Freelancer / Operador de Maquinário Pesado', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
  { id: 'consultor_agronomo_tecnico_agricola', label: 'Consultor Agrônomo / Técnico Agrícola', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
];

// ============================================================
// FREELANCER VIP PLANS
// ============================================================
export const VIP_PLANS: VipPlan[] = [
  { tier: 'free', label: 'Free', maxCategories: 2, features: ['Até 2 categorias ativas', 'Aparição padrão nas buscas'], prices: { monthly: 0, semestral: 0, annual: 0 } },
  { tier: 'vip1', label: 'VIP 1', maxCategories: 4, features: ['Até 4 categorias ativas', 'Impulso leve nas buscas'], prices: { monthly: 14.90, semestral: 59.90, annual: 99.90 }, boost: 'light' },
  { tier: 'vip2', label: 'VIP 2', maxCategories: 5, features: ['Até 5 categorias ativas', 'Selo verificado', 'Ranking superior nas buscas'], prices: { monthly: 24.90, semestral: 99.90, annual: 169.90 }, badge: 'verified', boost: 'top' },
  { tier: 'vip3', label: 'VIP 3', maxCategories: 999, features: ['Categorias ilimitadas', 'Destaque visual máximo', 'Suporte prioritário', 'Ranking máximo'], prices: { monthly: 39.90, semestral: 159.90, annual: 279.90 }, badge: 'diamond', boost: 'max' },
  { tier: 'vip4', label: 'VIP 4', maxCategories: 999, features: ['Categorias ilimitadas', 'Destaque total', 'Prioridade máxima'], prices: { monthly: 59.90, semestral: 229.90, annual: 399.90 }, badge: 'diamond', boost: 'max' },
];

// ============================================================
// ESTABLISHMENT VIP PLANS (Com recursos de anúncios e proibição de vagas na vitrine)
// ============================================================
export const EST_VIP_PLANS: EstVipPlan[] = [
  { tier: 'free', label: 'Plano Gratuito', intermediationFee: 15.0, maxActiveJobs: 2, allowAds: false, maxAds: 0, features: ['Até 2 vagas por semana', 'Taxa de intermediação de 15,0%', 'Proibido anunciar vagas na vitrine (somente marca/produtos)'], prices: { monthly: 0, semestral: 0, annual: 0 } },
  { tier: 'trial', label: 'Teste Gratuito (15 dias)', intermediationFee: 7.5, maxActiveJobs: 10, allowAds: false, maxAds: 0, features: ['Até 10 vagas por semana durante o teste', 'Taxa reduzida de 7,5%', 'Proibido anunciar vagas na vitrine'], prices: { monthly: 0, semestral: 0, annual: 0 } },
  { tier: 'vip1', label: 'Plano VIP 1', intermediationFee: 7.5, maxActiveJobs: 5, allowAds: false, maxAds: 0, features: ['Até 5 vagas por semana', 'Taxa reduzida de 7,5%', 'Prioridade no suporte', 'Proibido anunciar vagas na vitrine'], prices: { monthly: 29.90, semestral: 149.90, annual: 249.90 } },
  { tier: 'vip2', label: 'Plano VIP 2', intermediationFee: 5.0, maxActiveJobs: 20, allowAds: false, maxAds: 0, features: ['Até 20 vagas por semana', 'Taxa reduzida de 5,0%', 'Prioridade no suporte', 'Proibido anunciar vagas na vitrine'], prices: { monthly: 59.90, semestral: 299.90, annual: 499.90 } },
  { tier: 'vip3', label: 'Plano VIP 3', intermediationFee: 0.0, maxActiveJobs: 999, allowAds: false, maxAds: 0, features: ['Vagas ilimitadas por semana', 'Isenção total (0%) de taxas', 'Proibido anunciar vagas na vitrine'], prices: { monthly: 119.90, semestral: 549.00, annual: 949.00 } },
  { tier: 'vip4', label: 'Plano VIP 4', intermediationFee: 0.0, maxActiveJobs: 999, allowAds: true, maxAds: 1, features: ['Vagas ilimitadas', 'Isenção total de taxas', '1 Anúncio na Vitrine (Proibido vagas, apenas marca/produtos)'], prices: { monthly: 149.90, semestral: 699.00, annual: 1199.00 } },
  { tier: 'vip5', label: 'Plano VIP 5', intermediationFee: 0.0, maxActiveJobs: 999, allowAds: true, maxAds: 3, features: ['Vagas ilimitadas', 'Isenção total', 'Até 3 Anúncios na Vitrine (Proibido vagas)'], prices: { monthly: 199.90, semestral: 899.00, annual: 1499.00 } },
  { tier: 'vip6', label: 'Plano VIP 6', intermediationFee: 0.0, maxActiveJobs: 999, allowAds: true, maxAds: 5, features: ['Vagas ilimitadas', 'Isenção total', 'Até 5 Anúncios na Vitrine (Proibido vagas)'], prices: { monthly: 249.90, semestral: 1099.00, annual: 1899.00 } },
];

export const LEGAL_VERSION = 'v1.9';

export const tierLabel: Record<string, string> = { free: 'Free', vip1: 'VIP 1', vip2: 'VIP 2', vip3: 'VIP 3', vip4: 'VIP 4', vip5: 'VIP 5', vip6: 'VIP 6' };
export const estTierLabel: Record<string, string> = { free: 'Gratuito', trial: 'Teste Gratuito', vip1: 'VIP 1', vip2: 'VIP 2', vip3: 'VIP 3', vip4: 'VIP 4', vip5: 'VIP 5', vip6: 'VIP 6' };

// ============================================================
// METRO MAP — São Paulo
// ============================================================
export const METRO_MAP: MetroMap = {
  'São Paulo': ['Guarulhos', 'Osasco', 'Santo André', 'São Bernardo do Campo', 'São Caetano do Sul', 'Diadema', 'Taboão da Serra', 'Embu das Artes'],
  'Guarulhos': ['São Paulo'],
  'Osasco': ['São Paulo', 'Barueri'],
  'Santo André': ['São Paulo', 'São Bernardo do Campo', 'São Caetano do Sul', 'Mauá'],
  'São Bernardo do Campo': ['São Paulo', 'Santo André', 'São Caetano do Sul', 'Diadema'],
  'São Caetano do Sul': ['São Paulo', 'Santo André', 'São Bernardo do Campo'],
  'Diadema': ['São Paulo', 'São Bernardo do Campo'],
  'Taboão da Serra': ['São Paulo', 'Embu das Artes'],
  'Embu das Artes': ['São Paulo', 'Taboão da Serra'],
  'Barueri': ['Osasco', 'Carapicuíba'],
  'Carapicuíba': ['Osasco', 'Barueri'],
  'Mauá': ['Santo André', 'Ribeirão Pires'],
  'Ribeirão Pires': ['Mauá', 'Santo André'],
};

export function metroNearby(city: string): string[] {
  const nearby = METRO_MAP[city] ?? [];
  return [city, ...nearby];
}

export function emptyAvailability(): WeekAvailability {
  const days: WeekAvailability = {} as WeekAvailability;
  for (const d of ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const) {
    days[d] = { manha: false, tarde: false, noite: false };
  }
  return days;
}

export function fullAvailability(): WeekAvailability {
  const days: WeekAvailability = {} as WeekAvailability;
  for (const d of ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const) {
    days[d] = { manha: true, tarde: true, noite: true };
  }
  return days;
}

export const DAY_LABELS: { key: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'; label: string; short: string }[] = [
  { key: 'seg', label: 'Segunda', short: 'Seg' },
  { key: 'ter', label: 'Terça', short: 'Ter' },
  { key: 'qua', label: 'Quarta', short: 'Qua' },
  { key: 'qui', label: 'Quinta', short: 'Qui' },
  { key: 'sex', label: 'Sexta', short: 'Sex' },
  { key: 'sab', label: 'Sábado', short: 'Sáb' },
  { key: 'dom', label: 'Domingo', short: 'Dom' },
];

export const SHIFT_LABELS: { key: 'manha' | 'tarde' | 'noite'; label: string; icon: string }[] = [
  { key: 'manha', label: 'Manhã', icon: 'Sunrise' },
  { key: 'tarde', label: 'Tarde', icon: 'Sun' },
  { key: 'noite', label: 'Noite', icon: 'Moon' },
];

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();
const addrSP = (street: string, num: string, bairro: string, lat = -23.56, lng = -46.65): Address => ({ cep: '01310-100', street, number: num, neighborhood: bairro, city: 'São Paulo', state: 'SP', lat, lng });

export const SEED_USERS: User[] = [
  {
    id: 'admin1', accountType: 'freelancer', isAdmin: true, adminRole: 'super',
    email: 'admin@freelaagora.com', password: 'admin123', name: 'Administrador FreelaAgora',
    photo: 'https://images.pexels.com/photos/804009/pexels-photo-804009.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 90000-0000', whatsapp: '(11) 90000-0000', address: addrSP('R. Augusta', '100', 'Consolação'),
    walletBalance: 0, createdAt: daysAgo(120),
    termsAcceptance: { timestamp: daysAgo(120), ip: '189.45.22.10', userAgent: 'Mozilla/5.0 FreelaAgora', legalVersion: 'v1.0' },
  },
  {
    id: 'fl1', accountType: 'freelancer', email: 'marcos@freelaagora.com', password: '123456',
    name: 'Marcos "Tigrão" Araújo', nickname: 'Tigrão', photo: 'https://images.pexels.com/photos/26621714/pexels-photo-26621714.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 98888-1111', whatsapp: '(11) 98888-1111', address: addrSP('R. dos Pinheiros', '842', 'Pinheiros', -23.57, -46.70),
    cpf: '111.444.777-35', bio: '15 anos de brasa na chapa. Especialista em costela fogo de chão e buffet.',
    specialties: ['Churrasqueiro', 'Cozinheiro'], hourlyRate: 45, dailyRate: 320, pixKey: 'marcos.tigrao@pix.com',
    rating: 4.9, reviewsCount: 47, completedShifts: 142, vipTier: 'vip2',
    vipExpiresAt: new Date(now + 20 * 86400000).toISOString(), categories: ['churrasqueiro', 'cozinha'],
    availability: fullAvailability(), walletBalance: 1240, documentVerified: true, createdAt: daysAgo(90),
    serviceRadiusKm: 25, acceptsInterstate: true,
    termsAcceptance: { timestamp: daysAgo(90), ip: '201.55.33.22', userAgent: 'Mozilla/5.0 Chrome', legalVersion: 'v1.0' },
  },
  {
    id: 'es1', accountType: 'establishment', email: 'contato@bardoze.com.br', password: '123456',
    name: 'Bar do Zé', photo: 'https://images.pexels.com/photos/5531664/pexels-photo-5531664.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 98888-1234', whatsapp: '(11) 98888-1234', address: addrSP('R. dos Pinheiros', '842', 'Pinheiros', -23.57, -46.70),
    cnpj: '12.345.678/0001-90', establishmentType: 'Bar & Restaurante',
    estVipTier: 'vip2', rating: 4.6, reviewsCount: 124, walletBalance: 500, createdAt: daysAgo(100),
    termsAcceptance: { timestamp: daysAgo(100), ip: '189.55.77.88', userAgent: 'Mozilla/5.0 Chrome', legalVersion: 'v1.0' },
  },
];

export const SEED_JOBS: Job[] = [
  { id: 'job1', establishmentId: 'es1', establishmentName: 'Bar do Zé', establishmentPhoto: 'https://images.pexels.com/photos/5531664/pexels-photo-5531664.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', category: 'garcom', title: 'Cobertura de sexta à noite', description: 'Preciso de 1 garçom para a noite de sexta.', date: new Date(now + 2 * 86400000).toISOString(), startTime: '18:00', hours: 6, value: 210, urgency: 'hoje', status: 'active', city: 'São Paulo', state: 'SP', applicants: [], createdAt: daysAgo(1) },
];

export const SEED_CONTRACTS: Contract[] = [];
export const SEED_WALLET_TXS: WalletTx[] = [];
export const SEED_NOTIFICATIONS: AppNotification[] = [];
export const SEED_COUPONS = [{ id: 'cp1', code: 'BEMVINDO10', discountPercentage: 10, isActive: true, createdAt: daysAgo(30) }];
export const SEED_AUDIT_LOGS = [{ id: 'al1', adminId: 'admin1', action: 'Sistema iniciado', createdAt: daysAgo(120) }];

export const initialData: AppData = {
  users: SEED_USERS,
  jobs: SEED_JOBS,
  contracts: SEED_CONTRACTS,
  walletTxs: SEED_WALLET_TXS,
  notifications: SEED_NOTIFICATIONS,
  reviews: [],
  coupons: SEED_COUPONS,
  adminAuditLogs: SEED_AUDIT_LOGS,
  config: { defaultFeePercent: 15.0 },
  paymentSettings: { activeProvider: 'asaas', configs: {} },
  currentUserId: null,
  vipPlans: VIP_PLANS,
  estVipPlans: EST_VIP_PLANS,
};
