# AndreStudio.dev — arquitetura, templates e backlog

Documento de apoio para publicar, manter e escalar o site sem perder a distinção entre trabalho real e exploração autoral.

## Diagnóstico consolidado

Antes desta revisão, a homepage colocava um SVG inline de aproximadamente 700 linhas e três bibliotecas externas de animação antes da proposta comercial. Projetos não tinham links, os serviços não possuíam páginas próprias, o menu apontava majoritariamente para âncoras e não existiam canonical, Open Graph, sitemap, robots ou dados estruturados. O carregamento dependia de loader e scroll artificial; foco visível e movimento reduzido não tinham tratamento completo. Links de redes sociais apontavam para páginas genéricas das plataformas, o que não constituía prova de presença.

A revisão substituiu essa estrutura por HTML semântico multipágina, CSS compartilhado e JavaScript progressivo de aproximadamente uma tela: navegação móvel, estado do cabeçalho, reveal com `IntersectionObserver` e pausa de vídeo fora da viewport. A mensagem e os CTAs permanecem utilizáveis sem JavaScript.

## Sitemap implantado

- `/` — proposta integrada e distribuição para serviços;
- `/portfolio/` — índice rastreável dos trabalhos;
- `/servicos/edicao-de-video-profissional/` — intenção comercial de edição e motion;
- `/servicos/automacao-com-ia/` — intenção comercial de automação aplicada;
- `/servicos/sites-premium/` — intenção comercial de web design/desenvolvimento;
- `/cases/mundo-em-evolucao/` — conceito autoral;
- `/cases/in-the-nuvens/` — experimento com IA;
- `/cases/objeto-em-camadas/` — estudo autoral de motion com `VideoObject`;
- `/sobre/` — autoria, abordagem e princípios;
- `/blog/` — hub editorial e 20 pautas priorizadas;
- `/blog/como-preparar-material-para-edicao-de-video/` — artigo completo com `Article`;
- `/contato/` — contato direto e roteiro de briefing.

`/sobre.html` permanece apenas como página de transição `noindex`; no servidor final, configurar redirecionamento HTTP 301 para `/sobre/`.

## Copy central da homepage

- **Hero:** “Sua marca em movimento. Sua operação em outro ritmo.”
- **Subtítulo:** “A AndreStudio.dev cria vídeos que sustentam atenção, automações que reduzem trabalho manual e experiências web que transformam percepção em oportunidades comerciais.”
- **CTA principal:** “Discutir um projeto”.
- **CTA secundário:** “Ver trabalhos selecionados”.
- **Princípio editorial:** “Estética premium só funciona quando existe uma ideia precisa por trás.”

A copy completa está em `index.html`; as páginas de serviço contêm as versões integrais específicas por oferta.

## Template de case study

Usar a estrutura de qualquer arquivo em `/cases/[slug]/index.html`:

1. rótulo obrigatório: `Case real`, `Conceito autoral`, `Experimento com IA` ou `Estudo autoral`;
2. H1 e resumo sem reivindicação de resultado;
3. metadados: natureza, papel, ano e status;
4. mídia com dimensões, alt e nota de contexto;
5. contexto e desafio;
6. objetivo e solução;
7. processo;
8. entregáveis e stack;
9. resultado — métrica apenas com fonte e autorização;
10. CTA coerente com a disciplina;
11. `CreativeWork` ou `VideoObject` em JSON-LD;
12. title, description, canonical e Open Graph únicos.

Para um case real, acrescentar cliente, período, equipe, restrições, depoimento autorizado e método de medição. Se não for possível publicar números, explicar o tipo de resultado qualitativo e sua evidência.

## Template de artigo

Usar `/blog/como-preparar-material-para-edicao-de-video/index.html` como base:

1. categoria e tempo estimado de leitura;
2. H1 que promete uma decisão ou tarefa concreta;
3. introdução com problema, público e ganho;
4. sumário lateral em desktop;
5. H2 orientados a passos, critérios ou perguntas;
6. exemplos e limites práticos;
7. checklist aplicável;
8. conclusão sem repetir a introdução;
9. CTA para serviço diretamente relacionado;
10. autor, bio, data de publicação e atualização;
11. `Article` em JSON-LD e metadados de artigo no Open Graph;
12. links internos para serviço, case e página de autor.

## Checklist de SEO técnico e on-page

- [x] title e meta description únicos nas páginas indexáveis;
- [x] um H1 por página e hierarquia de headings;
- [x] slugs descritivos em pt-BR;
- [x] canonical absoluto;
- [x] Open Graph e Twitter card;
- [x] favicon PNG derivado fielmente do logo oficial;
- [x] `sitemap.xml` e `robots.txt`;
- [x] links internos em HTML, sem depender de clique por script;
- [x] alt contextual e imagens decorativas com alt vazio;
- [x] `Organization`, `Person`, `Service`, `CreativeWork`, `Article` e `VideoObject` onde aplicáveis;
- [x] página 404 com `noindex`;
- [ ] confirmar o domínio canônico antes do deploy;
- [ ] validar JSON-LD no Rich Results Test;
- [ ] cadastrar domínio e enviar sitemap no Search Console;
- [ ] definir redirecionamento 301 de `/sobre.html` no host;
- [ ] conectar analytics/consentimento somente quando houver plano de medição;
- [ ] adicionar `LocalBusiness` apenas se houver endereço/área presencial e dados comerciais públicos consistentes.

## Checklist de acessibilidade

- [x] link “Pular para o conteúdo”;
- [x] landmarks e navegação nomeada;
- [x] foco visível de alto contraste;
- [x] menu móvel com botão, estado `aria-expanded` e Escape;
- [x] rótulos textuais além da cor para natureza dos projetos;
- [x] contraste alto na base escura;
- [x] `prefers-reduced-motion` e conteúdo visível sem animação;
- [x] vídeos com controles na página dedicada e fallback textual;
- [x] elementos decorativos ignorados por tecnologia assistiva;
- [ ] testar navegação completa por teclado em Safari, Chrome e Firefox;
- [ ] testar VoiceOver/TalkBack antes da publicação;
- [ ] revisar legendas e transcrição quando novos vídeos com fala forem incluídos;
- [ ] validar contraste após qualquer mudança de cor ou imagem de fundo.

## Checklist de performance

- [x] remoção de GSAP, ScrollTrigger e Lenis;
- [x] remoção de loader e scroll artificial;
- [x] imagem hero com dimensões e `fetchpriority="high"`;
- [x] imagens abaixo da dobra com lazy-load;
- [x] versões JPEG otimizadas em `/assets/optimized/`;
- [x] vídeos com `preload="metadata"` ou `none`, poster e pausa fora da viewport;
- [x] animação via transform/opacity e desligamento por preferência;
- [x] espaço reservado com aspect-ratio para reduzir layout shift;
- [ ] gerar AVIF/WebP no pipeline de deploy e usar `<picture>` com fallback;
- [ ] definir cache longo para fontes, imagens, CSS e JS com hash de arquivo;
- [ ] medir LCP, INP e CLS em aparelho móvel real após deploy;
- [ ] criar poster específico do vídeo em vez de imagem genérica;
- [ ] considerar fontes locais para eliminar a dependência do Google Fonts.

## Backlog priorizado

### P0 — antes de indexar

1. Confirmar se o domínio final é `andrestudio.dev.br`; atualizar canonical, Open Graph, JSON-LD, sitemap e robots se for diferente.
2. Confirmar e testar e-mail e número do WhatsApp.
3. Fornecer URLs reais de LinkedIn, Behance e Instagram; só publicar links de perfil verificados.
4. Configurar redirecionamento 301, HTTPS, compressão Brotli/Gzip e cabeçalhos de cache no host.
5. Testar todas as páginas em produção e enviar `sitemap.xml` ao Search Console.

### P1 — autoridade e conversão

1. Publicar o primeiro case real com cliente/autorização, escopo e resultado verificável.
2. Adicionar depoimentos somente com nome, contexto e permissão.
3. Criar formulário com proteção anti-spam e política de privacidade; hoje o contato usa e-mail/WhatsApp para evitar backend improvisado.
4. Produzir posters e thumbnails próprios para cada projeto.
5. Publicar quatro artigos-pilar, um por categoria editorial, antes de aumentar frequência.
6. Definir eventos de conversão: clique em WhatsApp, e-mail, CTA de serviço e leitura de case.

### P2 — escala

1. Introduzir CMS ou gerador estático quando a cadência justificar; manter URL e metadados atuais.
2. Criar feeds RSS e `BlogPosting`/breadcrumbs estruturados em escala.
3. Automatizar imagem responsiva, minificação e hash de assets no build.
4. Criar versão bilíngue apenas com arquitetura `hreflang` e revisão humana completa.
5. Auditar conteúdo trimestralmente: atualizar datas apenas quando houver mudança material.

## Premissas que exigem confirmação

O domínio `https://andrestudio.dev.br` foi usado como canonical operacional porque o repositório não informava a URL pública. Não foram inventados endereço, CNPJ, redes sociais, clientes, depoimentos, métricas ou disponibilidade. `LocalBusiness` foi deliberadamente omitido até existirem dados locais aplicáveis.
