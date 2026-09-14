# AndréStudio.dev

AndréStudio.dev is my professional portfolio and technology blog, where I showcase real projects, Web development, applied AI, automation, and digital solutions.

## Website

[andrestudio.dev.br](https://andrestudio.dev.br)

## Objetivo

O projeto funciona como portfólio, vitrine de serviços, apresentação de cases e demonstrações interativas, publicação de conteúdo técnico e canal de contato para novos projetos.

## Principais áreas

- Home
- Serviços
- Portfólio
- Cases
- Blog e conteúdo técnico
- Sobre
- Contato

## Cases e demonstrações

- **Lead Flow Studio:** protótipo funcional de CRM com funil Kanban e mensagens simuladas.
- **OmniAgent Studio:** demonstração interativa de uma central de atendimento com IA.
- **Cardápio Digital:** MVP demonstrativo de pedidos e checkout local, sem integração comercial real.
- **Nexus BI & Finance:** estudo de produto para visualização de indicadores financeiros.
- **Visual Lab:** estudos autorais de direção de arte, motion e experimentação com IA.

As demonstrações usam dados fictícios e deixam explícito quando uma integração é apenas simulada. O repositório não apresenta esses protótipos como produtos SaaS completos.

## Stack

- HTML5 sem framework
- CSS3 responsivo
- JavaScript modular executado diretamente no navegador
- Python 3 para montagem determinística do pacote público
- Node.js para testes de regressão e validação em navegador
- Cloudflare Pages para hospedagem do site estático

O projeto não exige gerenciador de pacotes nem instalação de dependências para o build principal.

## Estrutura

```text
assets/       imagens, vídeos e ilustrações públicas
blog/         conteúdo técnico
cases/        estudos de caso
data/         catálogo de projetos usado pela interface
demo/         demonstração do Lead Flow Studio
portfolio/    portfólio e demos interativas
scripts/      build por allowlist e validações locais
servicos/     páginas de serviços
```

## Segurança e publicação

- O pacote público é montado por uma allowlist explícita em `scripts/build-public.py`.
- O build valida o conjunto final de arquivos e referências locais de HTML e CSS.
- `_headers` aplica CSP, HSTS e outras políticas de segurança no Cloudflare Pages.
- `_redirects` e `.pagesignore` adicionam proteção contra publicação acidental de arquivos internos.
- Os testes verificam tratamento seguro de conteúdo inserido nas demos e impedem navegação comercial real em fluxos simulados.

## Desenvolvimento local

Pré-requisitos: Python 3 e Node.js moderno.

```bash
python3 scripts/build-public.py --self-test
python3 scripts/build-public.py
node scripts/test-security-fixes.cjs
python3 scripts/serve-public.py
```

O último comando serve `build/public` em `http://127.0.0.1:8765`. O teste de navegador em `scripts/test-browser.cjs` requer uma instância local do Chrome com Chrome DevTools Protocol disponível.

## Validação

```bash
git diff --check
python3 scripts/build-public.py --self-test
python3 scripts/build-public.py
node scripts/test-security-fixes.cjs
```

O pipeline de CI executa essas verificações sem credenciais e sem deploy automático.

## Deploy

O site está hospedado no Cloudflare Pages. A saída publicável é exclusivamente `build/public`; o diretório-fonte inteiro não deve ser enviado como artefato de produção.

## Estado

Site em produção, com páginas institucionais, cases, conteúdo técnico e demonstrações interativas responsivas.

## Assets e autoria

O código e os materiais autorais do projeto são de André Rodrigues. A origem e o licenciamento dos recursos visuais de terceiros estão documentados em [ASSETS.md](ASSETS.md).

## Licença

Este repositório ainda não possui uma licença de software definida. Recursos de terceiros permanecem sujeitos às licenças descritas em [ASSETS.md](ASSETS.md).
