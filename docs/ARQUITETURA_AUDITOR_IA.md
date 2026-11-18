# Arquitetura Técnica — Auditor de Lucro & Automação com IA (André Studio)

Documento gerado na frente de reconhecimento profundo da arquitetura do repositório `andrestudio.dev.br`.

## 1. Visão Geral da Stack & Build Público

- **Páginas e Estilização**: HTML5 semântico + CSS3 responsivo com design tokens compartilhados (`style.css`, `home.css`, `platform.css`).
- **JavaScript Modular**: ES Modules nativos (`.mjs` / `.js`) executados diretamente no navegador sem bundler externo, mantendo zero dependências npm externas e carregamento instantâneo.
- **Empacotamento Público Determinístico**: `scripts/build-public.py` monta `build/public/` exclusivamente a partir da tupla explícita `ALLOWED_FILES`, gera `build/public-inventory.json` com hashes SHA-256 e valida todas as referências locais (`src`, `href`, `poster`, `url()`), falhando em fechado se houver symlink ou arquivo privado.
- **Runtime Alvo**: Cloudflare Pages (arquivos estáticos de `build/public`) + Cloudflare Pages Functions (`functions/api/*` em Web Standard APIs).

## 2. Design System, Tipografia e Temas

- **Tipografia**:
  - Display: `"Syne", system-ui, sans-serif` (`--display`)
  - Corpo: `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` (`--body`)
- **Temas Suportados**:
  - **Cinema (Dark, padrão)**: `--bg: #08090b`, `--bg-soft: #0e1014`, `--surface: #101216`, `--surface-2: #171a20`, `--text: #f5f5f2`, `--text-soft: #d0d1d4`, `--muted: #aeb0b5`.
  - **Studio (Light, `html[data-theme="light"]`)**: `--bg: #f7f7f8`, `--bg-soft: #eeeeef`, `--surface: #ffffff`, `--text: #101014`, `--text-soft: #3a3a42`, `--muted: #5f6068`.
- **Paleta de Acentos**:
  - Primário / CTA: `--red: #e21b23`, `--red-dark: #a90f16`, `--red-soft: #ff4c52`
  - Positivo / Saudável: `--green: #8dd8a4`
  - Bordas: `--line` e `--line-strong`

## 3. Segurança e Content Security Policy (`_headers`)

- `_headers` e `deploy/nginx/andrestudio.dev.br.conf` aplicam **CSP em modo enforcement** com:
  - `script-src 'self' https://static.cloudflareinsights.com/beacon.min.js/` (proibido JavaScript inline executável e scripts de CDN terceiros).
  - `connect-src 'self'` (chamadas de API permanecem no mesmo domínio `/api/*`).
  - `form-action 'self' mailto: https://wa.me`.
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- Manipulação de DOM nos scripts utiliza estritamente `document.createElement`, `textContent` e `replaceChildren`, sem `innerHTML` com entrada do usuário e sem handlers inline (`onclick=`, etc.).

## 4. Dados Reais Centralizados (`data/brandConfig.mjs` & `data/brandConfig.ts`)

Todos os canais oficiais e verticais de negócio extraídos do repositório foram centralizados em `data/brandConfig.mjs` (com contrato TypeScript em `data/brandConfig.ts`):

- **Marca**: `André Studio` (`AndreStudio.dev`) — `https://andrestudio.dev.br`
- **Responsável**: `André Rodrigues` — São Luís — MA (atendimento remoto para todo o Brasil)
- **WhatsApp oficial**: `5598981483900` (`https://wa.me/5598981483900`)
- **E-mail oficial**: `andre@andrestudio.dev.br`
- **Redes / Código**: GitHub `https://github.com/Andrearodri` e LinkedIn `https://www.linkedin.com/in/andreaparecidorodrigues-dev/`
- **Verticais PME**:
  - **Frente 1 (Educação & Treinamento Prático em IA)**: cursos práticos, mentoria e capacitação in-company do zero ao resultado.
  - **Frente 2 (Engenharia Full-Stack & IA Sob Medida)**: sites de alta performance, sistemas web completos, painéis e agentes de IA integrados ao WhatsApp/operação.

## 5. Arquitetura do Auditor de Lucro & Automação com IA

1. **Motor Financeiro Determinístico (`ferramentas/auditor-ia/financial-engine.mjs`)**:
   - Parser PT-BR resiliente para moedas (`R$ 1.450,90`), percentuais (`12,5%`) e CSV separado por `;`, `,` ou `\t`.
   - Módulos matemáticos isolados:
     - **Módulo A**: Recuperação de Orçamentos no WhatsApp (leads perdidos, receita deixada na mesa, metas conservadora/moderada/agressiva de 30 dias, ROI anualizado).
     - **Módulo B**: Auditoria de Margem, Taxas e Precificação (Markup vs Margem Líquida real, impacto de taxas/impostos/ocultos, itens em prejuízo invisível ou margem corroída e preço ideal sugerido).
     - **Módulo C**: Mapeamento de Automação e Produtividade da Equipe (custo hora-homem real com encargos, desperdício mensal/anual, ganho rápido com treinamento em IA vs ganho estrutural com automação sob medida).
2. **Codec Nativo `.XLSX` (`ferramentas/auditor-ia/xlsx-codec.mjs`)**:
   - Leitor e gerador OOXML 100% nativo usando Web `CompressionStream('deflate-raw')` e `DecompressionStream('deflate-raw')`, carregado sob demanda via `import()` dinâmico para preservar carregamento inicial ultrarrápido.
3. **Camada Cloudflare Edge (`functions/api/auditor-ia.js` e `functions/api/auditor-lead.js`)**:
   - Web Standard APIs puras, rate-limit por IP (`cf-connecting-ip`), validação/sanitização contra prompt injection, adaptador multi-IA (`GEMINI_API_KEY`, `OPENAI_API_KEY`, binding `env.AI` do Workers AI) e motor local analítico de contingência (`ferramentas/auditor-ia/fallback-analyst.mjs`) com disponibilidade 100%.
4. **SEO Técnico & Dados Estruturados**:
   - `robots.txt` libera rastreadores de busca e agentes de IA (`Googlebot`, `Bingbot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`) nas páginas públicas e protege `/api/`.
   - `index.html` publica `@graph` JSON-LD combinado com `ProfessionalService`, `EducationalOrganization`, `SoftwareApplication` e `Person`.
   - `sitemap.xml` indexa `/` e as rotas de ferramentas incluindo `/ferramentas/auditor-ia/` e `/ferramentas/arquiteto-de-escopo/`.
