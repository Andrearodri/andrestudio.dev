# Biblioteca e navegação pública — 20/11/2026

## Conteúdo integrado

- Cursos: índice, curso de vídeo curto com três aulas e curso de IA na rotina da equipe com quatro aulas (10 páginas).
- Assista: vídeo vertical do estúdio, curadoria com link externo para YouTube e guia PDF existente.
- Posts locais sobre avaliação de trabalho de IA (Epoch) e orçamento com GPT-6.2.
- Posts sobre anúncios de concorrentes e WhatsApp Business, preservados da branch remota `feat/blog-negocios`.
- Scout e suas capas: dependências dos posts de negócios já disponíveis no remoto; nenhuma remoção de artigos ou assets antigos dessa branch foi aplicada.
- Checklist do atendimento, leitura em voz alta no navegador e Radar com quatro fontes fixas.
- Home do Auditor preservada, com uma seção de acesso à biblioteca.

Os arquivos locais vieram da cópia de trabalho de 17/11 em Documentos/Codex. A integração foi seletiva: não substituiu a home, as demos, as Functions do Auditor ou os assets existentes. Outros experimentos de home e demonstração dessa cópia não são dependências dos cursos e permanecem na origem.

## Navegação e segurança

53 páginas compartilham Auditor IA, Ferramentas, Kits, Soluções, Projetos, Sobre, Conteúdo, Cursos, Assista e Contato. Nas páginas internas, as seções da home usam `/#fragmento`. Controles próprios das demos e redirecionamentos foram preservados. O menu recolhe até 1280 px; a ação comercial duplicada do cabeçalho fica oculta para acomodar os destinos (Contato permanece no menu).

A CSP de bloqueio não foi relaxada. Assista abre a recomendação externa no YouTube, evitando incorporar iframe bloqueado pela política. O vídeo local continua disponível na página. Radar usa apenas URLs fixas, renderiza títulos por `textContent`, restringe os domínios dos links e mantém links estáticos se as fontes estiverem indisponíveis. Testes do backend usam respostas simuladas, sem consultar serviços externos.

Não foram incluídos arquivos `.env`, chaves, dados de clientes, bancos, caches ou build gerado. A lista pública contém 174 arquivos e corresponde exatamente ao diretório gerado. A varredura por formatos comuns de credenciais não encontrou ocorrências nos arquivos da entrega; isso não substitui auditoria exaustiva. Esta integração preserva o texto dos artigos de origem e não constitui nova verificação factual das publicações externas citadas.

## Validação

```bash
npm run check
node scripts/test-browser-navigation.cjs
git diff --check
```

- Fixture de build, lista permitida, referências de assets e segurança: aprovadas.
- 68 testes unitários e de regressão: aprovados.
- 53 menus com destinos e fragmentos válidos: aprovados.
- Chrome isolado, servidor local com `_headers`: 159 verificações em 1440, 1180 e 390 px. Links visíveis, abertura e fechamento móvel e cabeçalhos sem overflow.
- `test-browser-navigation.cjs` requer Chrome com CDP em `127.0.0.1:9224` e pacote servido em `127.0.0.1:8877`. Os endereços podem ser configurados por `CDP_ENDPOINT` e `PUBLIC_TEST_BASE`. Capturas e resultado JSON ficam em `/private/tmp`, fora do Git e do pacote.

## Entrega

A base consultada foi `c7d463f`, compartilhada por `origin/main` e `origin/feat/auditor-ia-autonomo`. A branch `fix/consistent-public-navigation` reúne conteúdo e menus, sem alterar as branches de trabalho de outros agentes. A main local antiga não foi restaurada nem usada como base.

Nenhuma publicação na Cloudflare foi solicitada ou executada nesta etapa. O envio desta branch pode acionar preview se o operador tiver alterado as regras remotas de build. A futura integração em main exige nova conferência dos commits concorrentes e da configuração do projeto Pages antes da publicação.
