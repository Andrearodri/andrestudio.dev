# Auditoria de seguranca - AndreStudio.dev

Data: 2026-06-26
Escopo local: `/Users/andre10/Downloads/portifoliof1designer`
Dominio declarado nos metadados: `https://andrestudio.dev.br`

## 1. Resumo executivo

O projeto auditado e um site estatico multipagina, feito com HTML, CSS e JavaScript puro. Nao foram encontrados sinais de Next.js, React, Vite, Node, PHP, WordPress, Tailwind, CMS, banco de dados, serverless functions, APIs proprias, uploads ou formulario HTML com submissao para backend.

A superficie de ataque local e baixa: nao ha dependencias JavaScript versionadas, nao ha bundle frontend gerado, nao ha `fetch`, CORS, autenticacao, cookies de aplicacao ou armazenamento de dados pessoais no navegador. O contato acontece por `mailto:` e WhatsApp.

Os principais riscos estao na camada de deploy e governanca: ausencia de configuracao de headers de seguranca no projeto, redirecionamentos HTTP/HTTPS e www/non-www nao definidos localmente, arquivos `.DS_Store` presentes na pasta publica, arquivos brutos grandes em `assets/`, e ausencia de pagina/politica de privacidade para LGPD.

O teste leve de producao com `curl -I` falhou por DNS: `andrestudio.dev.br` e `www.andrestudio.dev.br` nao resolveram neste ambiente. Portanto, headers reais de producao, redirect HTTPS e exposicao publica efetiva nao puderam ser confirmados.

## 2. Riscos criticos

Nenhum risco critico foi confirmado na auditoria local.

## 3. Riscos altos

### H1 - Dominio/hosting nao verificavel por DNS

Impacto: se o dominio deveria estar em producao, a falha de resolucao afeta disponibilidade, validacao de HTTPS, Search Console, sitemap, robots e qualquer teste real de headers.

Prioridade: Alta se o site ja deveria estar publico; media se ainda esta em pre-deploy.

Correcao recomendada: conferir DNS autoritativo, registros A/AAAA/CNAME, configuracao do provedor de hospedagem, certificado TLS e canonical final. Depois repetir testes `HEAD` em `https://andrestudio.dev.br/`, `http://andrestudio.dev.br/` e `https://www.andrestudio.dev.br/`.

Arquivos afetados: metadados usam `https://andrestudio.dev.br` em `index.html`, paginas internas, `sitemap.xml`, `robots.txt` e JSON-LD.

## 4. Riscos medios

### M1 - Headers de seguranca nao configurados no projeto

Impacto: sem HSTS, `nosniff`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, `Permissions-Policy` e CSP gradual, a seguranca dependera totalmente do provedor. Isso aumenta risco de clickjacking, sniffing de MIME, vazamento de referer e execucao permissiva de recursos caso o site evolua.

Prioridade: Media.

Correcao recomendada: adicionar configuracao de headers no formato suportado pelo host. Para CSP, usar primeiro `Content-Security-Policy-Report-Only`, mapeando recursos atuais: `self`, Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), `mailto:` e WhatsApp (`wa.me`). Como ha scripts inline para tema e JSON-LD, uma CSP bloqueante exigira mover scripts inline para arquivo externo ou usar hashes/nonces.

Arquivos afetados: configuracao de deploy ainda ausente; HTML contem scripts inline em `index.html`, `404.html`, `contato/index.html`, `sobre/index.html`, `blog/index.html` e outras paginas.

### M2 - Arquivos `.DS_Store` dentro do pacote publico

Impacto: se a pasta for enviada integralmente para um host estatico, `.DS_Store` pode expor nomes de arquivos e estrutura local. Nao e vazamento de segredo por si so, mas e informacao desnecessaria em producao.

Prioridade: Media.

Correcao recomendada: remover esses arquivos do pacote de deploy e impedir versionamento futuro com `.gitignore`; no host, bloquear `/.DS_Store` e `/assets/.DS_Store`.

Arquivos afetados: `.DS_Store`, `assets/.DS_Store`.

### M3 - Assets brutos grandes e possivelmente nao utilizados no deploy

Impacto: arquivos brutos podem aumentar custo de banda, expor metadados de origem e publicar material de trabalho que nao precisa ser publico.

Prioridade: Media.

Correcao recomendada: publicar somente assets referenciados pelas paginas. Revisar especialmente `assets/0626 (1).mov` (~55 MB), `assets/0626 (1).WAV` (~3.1 MB), `Design sem nome.png` e imagens originais duplicadas quando ja houver versoes em `assets/optimized/`.

Arquivos afetados: `assets/0626 (1).mov`, `assets/0626 (1).WAV`, `Design sem nome.png`, possiveis originais duplicados em `assets/`.

## 5. Riscos baixos

### L1 - Politica de privacidade/LGPD ausente

Impacto: o site divulga e-mail/WhatsApp e incentiva envio de briefing, o que pode envolver nome, telefone, e-mail, mensagem, prazo e orcamento. Mesmo sem formulario proprio, ainda ha tratamento de dados pessoais por canais externos.

Prioridade: Baixa a media, dependendo do inicio de campanhas e analytics.

Correcao recomendada: criar pagina de politica de privacidade com finalidade, base legal, dados coletados, canais de atendimento, retenção, compartilhamento com WhatsApp/e-mail/provedores e direitos do titular. Se analytics, pixels ou cookies forem adicionados, implementar aviso/consentimento conforme necessidade.

Arquivos afetados: ainda nao ha `privacidade/index.html`; `contato/index.html` ja orienta a nao enviar senhas.

### L2 - CSP bloqueante ainda exigiria refatoracao de scripts inline

Impacto: CSP forte sem `unsafe-inline` quebraria o script de tema e JSON-LD se aplicada diretamente.

Prioridade: Baixa no estado atual; aumenta se forem adicionados scripts de terceiros, analytics ou formularios.

Correcao recomendada: manter CSP em Report-Only inicialmente. Para enforcement futuro, mover o script de tema para arquivo externo carregado cedo ou aplicar hashes, e manter JSON-LD permitido por hash/nonce conforme suporte do deploy.

### L3 - Dependencias/auditoria de pacotes nao aplicavel

Impacto: nao ha `package.json`, lockfile ou dependencias versionadas para auditar com `npm audit`, `pnpm audit` ou `yarn audit`.

Prioridade: Baixa.

Correcao recomendada: se um pipeline de build for introduzido, versionar lockfile e adicionar scripts `build`, `lint`, `typecheck` quando aplicavel.

## 6. Arquivos afetados

- `index.html`: metadados, Google Fonts, script inline de tema, JSON-LD, links WhatsApp com `rel` correto.
- `script.js`: navegacao, tema, pausa de video; sem `innerHTML`, `eval`, `fetch` ou dados sensiveis.
- `contato/index.html`: contato via `mailto:` e WhatsApp; sem formulario proprio.
- `robots.txt`: permite indexacao de todo o site publico e aponta para sitemap.
- `sitemap.xml`: lista apenas rotas publicas.
- `sobre.html`: transicao `noindex` com meta refresh; ideal e 301 no host.
- `.DS_Store` e `assets/.DS_Store`: nao devem ir para producao.
- `assets/0626 (1).mov`, `assets/0626 (1).WAV`, `Design sem nome.png`: revisar necessidade de publicacao.

## 7. Correcoes recomendadas

1. Adicionar headers basicos no deploy: HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` ou `frame-ancestors`, `Permissions-Policy` e CSP em Report-Only.
2. Configurar redirect 301 de `/sobre.html` para `/sobre/`.
3. Configurar canonicalizacao HTTP -> HTTPS e www -> non-www no provedor.
4. Bloquear ou remover `.DS_Store` do deploy.
5. Adicionar `.gitignore` para `.DS_Store`, `.env*`, chaves, dumps, backups e arquivos brutos que nao devem ser publicados.
6. Revisar assets brutos antes do deploy.
7. Criar politica de privacidade antes de capturar dados por formulario, analytics, pixel ou CRM.
8. Se for adicionado formulario proprio no futuro: validar no servidor, limitar taxa, sanitizar inputs, proteger contra spam, evitar email injection e usar mensagens de erro genericas.

## 8. Correcoes aplicadas

Aplicadas apos o diagnostico inicial:

1. Criado `_headers` com HSTS inicial sem preload, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, cache basico e `Content-Security-Policy-Report-Only`.
2. Criado `_redirects` com canonicalizacao HTTP -> HTTPS, www -> non-www, 301 de `/sobre.html` para `/sobre/` e bloqueios defensivos para `.DS_Store`, `.env`, dumps, backups e chaves comuns.
3. Criado `.gitignore` para impedir versionamento futuro de `.DS_Store`, `.env*`, chaves, dumps, backups, logs, outputs de build e midias brutas de origem.
4. Criado `.well-known/security.txt` com canal de contato de seguranca.
5. Ajustado `style.css` para empilhar CTAs em telas ate 760px, corrigindo corte visual encontrado no teste mobile da homepage.
6. Removidos todos os arquivos `.DS_Store` do projeto e assets brutos pesados nao referenciados (`0626 (1).mov`, `0626 (1).WAV`, `Design sem nome.png`).

Nao foram alterados copy visivel, imagens, videos, rotas publicas, scripts de interface ou SEO on-page.

## 9. Como testar

Depois das correcoes:

1. Abrir as paginas principais localmente: `/`, `/portfolio/`, `/servicos/edicao-de-video-profissional/`, `/servicos/automacao-com-ia/`, `/servicos/sites-premium/`, `/sobre/`, `/blog/`, `/contato/` e `/404.html`.
2. Verificar menu mobile, troca de tema, videos e CTAs.
3. Rodar `curl -I` no dominio final para validar headers e redirects.
4. Testar `http://`, `https://`, `www` e non-www.
5. Confirmar que `/.DS_Store` e `/assets/.DS_Store` nao sao servidos em producao.
6. Validar sitemap e robots no Search Console quando o dominio resolver.

## Validacoes executadas

- `npm audit --audit-level=low`: nao aplicavel; falhou por ausencia de lockfile/package manager.
- `python3 -m json.tool site.webmanifest`: manifest valido.
- `xmllint --noout sitemap.xml`: sitemap XML valido.
- Servidor local com `python3 -m http.server 4173`: rotas principais, `404.html`, `robots.txt`, `sitemap.xml`, CSS, JS, video hero e `/.well-known/security.txt` responderam `200 OK`.
- Chrome headless desktop: homepage carregou corretamente.
- Chrome headless mobile: identificado e corrigido corte do segundo CTA da hero; recaptura confirmou texto visivel.
- Varredura de links externos perigosos: nenhum `target="_blank"` sem `rel="noopener noreferrer"` foi encontrado.
- Varredura de formulario/API: nenhum `<form>`, `fetch`, CORS ou backend local foi encontrado.
- Varredura de secrets: sem secrets confirmados; ocorrencias restantes sao texto editorial sobre seguranca/dados.

## 10. O que ainda precisa ser feito manualmente

- Confirmar o provedor de hospedagem e aplicar formato especifico se ele nao usar `_headers`/`_redirects`.
- Corrigir DNS/certificado se o dominio deveria estar ativo.
- Validar headers reais em producao.
- Definir processo para secrets caso surjam integrações futuras.

