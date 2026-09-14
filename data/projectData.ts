/**
 * ============================================================================
 * ANDRESTUDIO.DEV — CENTRAL DE DADOS DE PROJETOS E SERVIÇOS
 * Definição em TypeScript com tipos explícitos para garantir rigor de contrato,
 * clareza arquitetural e fácil inspeção estática.
 * ============================================================================
 */

export type ProjectCategory = 'Sistemas e IA' | 'Sites e MVPs' | 'Visual Lab';
export type ProjectStatus = 'Demonstração local' | 'Showcase funcional' | 'Estudo de produto' | 'MVP demonstrativo' | 'Conceito autoral' | 'Experimento com IA' | 'Estudo autoral' | 'Projeto real';
export type ImplementationLevel = 'Operacional demonstrativo' | 'Ambiente interativo ao vivo' | 'Conceito em desenvolvimento' | 'Estudo visual autoral';

export interface Project {
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  category: ProjectCategory;
  tags: string[];
  status: ProjectStatus;
  image: string;
  imageAlt: string;
  href: string;
  demoHref?: string;
  caseStudyHref: string;
  featured: boolean;
  implementationLevel: ImplementationLevel;
  available: boolean;
  ctaLabel: string;
}

export interface ServicePillar {
  id: string;
  title: string;
  subtitle: string;
  deliverables: string[];
  actionLabel: string;
  actionHref: string;
}

export const projectCategories: Record<string, ProjectCategory> = {
  systems: 'Sistemas e IA',
  web: 'Sites e MVPs',
  visual: 'Visual Lab',
};

export const projectStatus: Record<string, ProjectStatus> = {
  omniagent: 'Demonstração local',
  leadflow: 'Showcase funcional',
  nexus: 'Estudo de produto',
  cardapio: 'MVP demonstrativo',
  mundo: 'Conceito autoral',
  nuvens: 'Experimento com IA',
  camadas: 'Estudo autoral',
};

export const servicePillars: ServicePillar[] = [
  {
    id: 'sistemas-ia',
    title: 'Sistemas e Inteligência Artificial',
    subtitle: 'CRMs, dashboards, plataformas internas, agentes de IA e automações desenvolvidos para organizar processos e acelerar operações.',
    deliverables: [
      'Sistemas empresariais',
      'CRMs',
      'Dashboards',
      'Agentes de IA',
      'Automações',
      'Integrações',
      'APIs',
      'Protótipos funcionais',
    ],
    actionLabel: 'Ver sistemas desenvolvidos',
    actionHref: '/portfolio/#sistemas-ia',
  },
  {
    id: 'sites-experiencias',
    title: 'Sites e Experiências Digitais',
    subtitle: 'Landing pages, sites institucionais, interfaces comerciais e MVPs criados para apresentar marcas, validar ideias e gerar oportunidades.',
    deliverables: [
      'Landing pages',
      'Sites institucionais',
      'Páginas comerciais',
      'Interfaces',
      'MVPs',
      'Catálogos',
      'Cardápios digitais',
      'Experiências responsivas',
    ],
    actionLabel: 'Explorar projetos web',
    actionHref: '/portfolio/#sistemas-ia',
  },
  {
    id: 'conteudo-motion',
    title: 'Conteúdo Visual e Motion',
    subtitle: 'Vídeos, direção de arte, peças digitais e conteúdo em movimento para marcas, campanhas e produtos.',
    deliverables: [
      'Edição de vídeo',
      'Motion design',
      'Peças digitais',
      'Conteúdo para redes sociais',
      'Direção visual',
      'Identidade de campanhas',
      'Vídeos de produto',
    ],
    actionLabel: 'Conhecer o Visual Lab',
    actionHref: '/portfolio/#visual-lab',
  },
];

export const projectData: Project[] = [
  {
    slug: 'omniagent-ai-studio',
    title: 'OmniAgent Studio',
    shortDescription: 'Demonstração local de triagem, recuperação de contexto e payloads com dados fictícios.',
    longDescription: 'Showcase interativo de uma central de atendimento para explorar triagem, consulta de contexto e encaminhamento de oportunidades; não representa operação de clientes nem integrações de produção.',
    category: 'Sistemas e IA',
    tags: ['IA, AUTOMAÇÃO E RAG', 'WHATSAPP API'],
    status: 'Demonstração local',
    image: '/assets/optimized/omniagent-ai-hero.png',
    imageAlt: 'Interface corporativa do OmniAgent Studio para automação de atendimento e triagem B2B com inteligência artificial',
    href: '/cases/omniagent-ai-studio/',
    demoHref: '/portfolio/omniagent-ai-demo/',
    caseStudyHref: '/cases/omniagent-ai-studio/',
    featured: true,
    implementationLevel: 'Ambiente interativo ao vivo',
    available: true,
    ctaLabel: 'Explorar demonstração →',
  },
  {
    slug: 'lead-flow-studio',
    title: 'Lead Flow Studio',
    shortDescription: 'Showcase interativo de CRM com funil Kanban, dashboard, templates e dados fictícios.',
    longDescription: 'Demonstração de produto para explorar gestão de leads, métricas calculadas localmente, templates e mensageria simulada; não representa um SaaS completo nem backend próprio.',
    category: 'Sistemas e IA',
    tags: ['CRM E AUTOMAÇÃO', 'KANBAN INTERATIVO'],
    status: 'Showcase funcional',
    image: '/assets/optimized/lead-flow-studio-crm.png',
    imageAlt: 'Interface em Dark Mode da plataforma Lead Flow Studio com quadro Kanban de vendas e cartões interativos',
    href: '/cases/lead-flow-studio/',
    demoHref: '/demo/',
    caseStudyHref: '/cases/lead-flow-studio/',
    featured: true,
    implementationLevel: 'Operacional demonstrativo',
    available: true,
    ctaLabel: 'Explorar showcase →',
  },
  {
    slug: 'nexus-bi-finance',
    title: 'Nexus BI & Finance',
    shortDescription: 'Plataforma demonstrativa de inteligência financeira, projeções de caixa, faturas e indicadores executivos.',
    longDescription: 'Conceito visual com dados sintéticos para explorar organização de faturas, fluxo de caixa e KPIs, sem motor preditivo ou integração ativa.',
    category: 'Sistemas e IA',
    tags: ['BI E GESTÃO FINANCEIRA', 'DASHBOARD EXECUTIVO'],
    status: 'Estudo de produto',
    image: '/assets/optimized/saas-showcase-dark.png',
    imageAlt: 'Dashboard executivo frontal do Nexus BI & Finance com gráficos de fluxo de caixa e indicadores financeiros em tema escuro',
    href: '/cases/nexus-bi-finance/',
    caseStudyHref: '/cases/nexus-bi-finance/',
    featured: true,
    implementationLevel: 'Conceito em desenvolvimento',
    available: false,
    ctaLabel: 'Conhecer o conceito →',
  },
  {
    slug: 'cardapio-digital',
    title: 'Cardápio Digital — Delivery',
    shortDescription: 'Sistema de pedidos interativo sem comissões para restaurantes, hamburguerias e delivery com checkout nativo no WhatsApp.',
    longDescription: 'Solução completa de cardápio digital interativo que roda direto no navegador do cliente (sem necessidade de aplicativo), gerando a ordem formatada com cálculo de frete para envio no WhatsApp.',
    category: 'Sites e MVPs',
    tags: ['PEDIDOS E WHATSAPP', 'DELIVERY INTERATIVO'],
    status: 'MVP demonstrativo',
    image: '/portfolio/cardapio-digital-demo/img/burger.png',
    imageAlt: 'Interface demonstrativa em smartphone com hamburguer gourmet no sistema Cardápio Digital',
    href: '/cases/cardapio-digital/',
    demoHref: '/portfolio/cardapio-digital-demo/',
    caseStudyHref: '/cases/cardapio-digital/',
    featured: false,
    implementationLevel: 'Operacional demonstrativo',
    available: true,
    ctaLabel: 'Testar MVP demonstrativo →',
  },
  {
    slug: 'mundo-em-evolucao',
    title: 'Mundo em Evolução',
    shortDescription: 'Sistema visual automotivo criado para explorar velocidade, contraste, precisão e linguagem cinematográfica aplicada a marcas.',
    longDescription: 'Um estudo autoral de direção visual que combina velocidade, reflexos escuros e luzes vermelhas dramáticas para projetar posicionamento de alta performance e sofisticação técnica.',
    category: 'Visual Lab',
    tags: ['DIREÇÃO DE ARTE', 'LINGUAGEM CINEMATOGRÁFICA'],
    status: 'Conceito autoral',
    image: '/assets/optimized/automotive.jpg',
    imageAlt: 'Carro esportivo em túnel escuro com rastros de luz vermelha e alto contraste cinematográfico',
    href: '/cases/mundo-em-evolucao/',
    caseStudyHref: '/cases/mundo-em-evolucao/',
    featured: false,
    implementationLevel: 'Estudo visual autoral',
    available: true,
    ctaLabel: 'Conhecer o projeto →',
  },
  {
    slug: 'in-the-nuvens',
    title: 'In the Nuvens',
    shortDescription: 'Pesquisa visual sobre atmosfera, profundidade de campo, texturas e composição gerativa para peças em movimento.',
    longDescription: 'Experimento visual combinando direção de arte humana com motores generativos para investigar texturas atmosféricas, iluminação volumétrica e transições contínuas de ambiente.',
    category: 'Visual Lab',
    tags: ['MOTION DESIGN', 'EXPERIMENTO COM IA'],
    status: 'Experimento com IA',
      image: '/assets/optimized/showcase-cinematic.jpg',
      imageAlt: 'Composição cinematográfica de criação digital com lente futurista e circuitos luminosos',
    href: '/cases/in-the-nuvens/',
    caseStudyHref: '/cases/in-the-nuvens/',
    featured: false,
    implementationLevel: 'Estudo visual autoral',
    available: true,
    ctaLabel: 'Assistir ao experimento →',
  },
  {
    slug: 'objeto-em-camadas',
    title: 'Objeto em Camadas',
    shortDescription: 'Exploração de tempo, matéria e desmontagem visual 3D em tempo real para aberturas de sistemas e product films.',
    longDescription: 'Estudo autoral de movimento de câmeras e separação de materiais em camadas (teardown animation), focado no detalhe técnico e no acabamento cinematográfico de lançamentos de produtos.',
    category: 'Visual Lab',
    tags: ['MOTION E 3D', 'PRODUCT FILM'],
    status: 'Estudo autoral',
    image: '/assets/optimized/showcase-cinematic.jpg',
    imageAlt: 'Objeto abstrato se desmontando em camadas de precisão técnica com iluminação cinematográfica',
    href: '/cases/objeto-em-camadas/',
    caseStudyHref: '/cases/objeto-em-camadas/',
    featured: false,
    implementationLevel: 'Estudo visual autoral',
    available: true,
    ctaLabel: 'Ver estudo autoral →',
  },
];

export const featuredProjects = projectData.filter(p => p.category === 'Sistemas e IA' || p.category === 'Sites e MVPs');
export const visualLabProjects = projectData.filter(p => p.category === 'Visual Lab');
