# Relatório de correções locais — 2026-09-07

Este relatório fica em `docs/`, fora da allowlist de `build/public/`. Durante a implementação e a validação descritas abaixo não houve push, deploy, alteração no painel da hospedagem ou envio de mensagens externas.

## Estado dos achados

| Achado | Estado local | Evidência |
| --- | --- | --- |
| AS-01 — pacote de publicação | **Corrigido e validado localmente; pipeline remoto pendente** | `scripts/build-public.py` copia somente 96 caminhos explicitamente permitidos, compara o conjunto real da saída com a allowlist, valida referências HTML/CSS e gera `build/public-inventory.json`. O self-test cobre arquivos internos fictícios, sobras antigas e arquivo público obrigatório ausente. |
| AS-02 — herança Nginx | **Corrigido no template mantido; validação Nginx pendente** | `deploy/nginx/andrestudio.dev.br.conf` repete os cabeçalhos nos blocos que também têm `add_header Cache-Control`, conforme a herança padrão do Nginx. Não usa `add_header_inherit merge`. Os quatro templates alternativos estão documentados como legados e ficam fora do pacote. O binário `nginx` não existe neste ambiente. |
| AS-03 — renderização das demos | **Corrigido e validado em DOM e navegador local** | As três demos usam nós DOM, `textContent` e propriedades `dataset`; o texto do visitante é separado do markup autoral confiável. O teste estático e o Chrome cobrem nome, empresa, serviço, mensagens, toast e resposta simulada do OmniAgent com sinais de HTML e aspas. |
| AS-04 — checkout demonstrativo | **Corrigido e validado em navegador local** | O checkout do Cardápio usa dados fictícios, conclui uma simulação local e não abre nem solicita WhatsApp. O CTA comercial continua separado e genérico, sem nome, endereço ou observações do checkout. |
| AS-05 — cabeçalhos/CSP | **Corrigido e validado localmente; Nginx e origin remoto pendentes** | `_headers` foi aplicado por `scripts/serve-public.py` e observado por HTTP como `Content-Security-Policy` de enforcement. O Chrome não registrou violações nem erros de página. A configuração Nginx ainda precisa de `nginx -t` e de teste no origin que a utilize. |

## Branch e Git

O HEAD de referência é `546eddeb30155d97451829c657bc45786e129c40` e a branch dedicada `codex/security-fixes-2026-09-07` agora existe e aponta para esse mesmo commit. A working tree já continha as correções locais e arquivos novos; ela foi preservada (42 entradas no `git status` ao final). Não foi usado `reset`, limpeza destrutiva, `sudo` ou alteração indiscriminada de permissões.

Foram examinados `.git/refs/heads`, `.git/index`, atributos e permissões. Não havia arquivo `.lock` abandonado nem referência concorrente para o nome solicitado. As tentativas produziram:

```text
git switch -c codex/security-fixes-2026-09-07
fatal: unable to create directory for .git/refs/heads/codex/security-fixes-2026-09-07

git switch -c codex-security-fixes-2026-09-07
fatal: Unable to create '.../.git/refs/heads/codex-security-fixes-2026-09-07.lock': Operation not permitted
```

As primeiras tentativas no sandbox falharam por restrição de escrita do ambiente do agente sobre `.git`; não era conflito de nome nem lock persistente. Uma execução local controlada permitiu criar a branch, que foi confirmada com `git branch --show-current` e `git show-ref`. Não há lock restante. Se a mesma operação precisar ser repetida em outro checkout, a ação mínima é executar na raiz do repositório:

```sh
git switch -c codex/security-fixes-2026-09-07
```

A criação da branch não moveu, descartou ou restaurou arquivos; as alterações permaneceram intactas na working tree da branch dedicada.

## Revisão do diff e do pacote

As mudanças revisadas abrangem os três scripts de demo, o checkout, `theme.js`, as páginas que carregavam o tema inline, o ajuste responsivo da Agenda, `_headers`, o template Nginx mantido, os scripts de pacote/servidor/testes, a documentação de publicação e o relatório. As páginas principais, quatro demos, estilos responsivos, vídeos, `sitemap.xml`, `robots.txt`, `_headers`, `_redirects`, `.well-known/security.txt` e `site.webmanifest` estão presentes no pacote.

Comandos de pacote:

```sh
python3 scripts/build-public.py --self-test
python3 scripts/build-public.py
```

Resultado: `build/public/` com 96 arquivos e `build/public-inventory.json` com os mesmos 96 caminhos, tamanhos e SHA-256. A comparação independente `inventory_vs_output=PASS` encontrou zero ausências e zero extras. A reconstrução remove o diretório anterior antes de copiar, e a fixture confirmou que `docs/internal-report.md`, `tmp/backup.html` e uma sobra antiga não entram na saída. Remover deliberadamente um arquivo allowlisted fez o build falhar com `FileNotFoundError`, de forma explícita.

Os alvos do sitemap foram conferidos contra o pacote (`23` URLs, `sitemap_local_targets=PASS`). O script de referências também validou links locais em HTML/CSS. Para acrescentar notícia, imagem ou vídeo no futuro, o caminho exato deve ser adicionado à tupla `ALLOWED_FILES` em `scripts/build-public.py`; depois é necessário referenciá-lo a partir da página pública e executar novamente o self-test e a geração. Nenhum diretório inteiro deve ser incluído como atalho.

As verificações automatizadas finais também foram:

```sh
node scripts/test-security-fixes.cjs
node --check demo/app.js
node --check portfolio/agenda-cheia-slz-demo/app.js
node --check portfolio/cardapio-digital-demo/app.js
node --check portfolio/omniagent-ai-demo/app.js
node --check scripts/test-browser.cjs
git diff --check
```

Todas passaram. A comparação independente do inventário foi executada em Python e retornou `inventory_vs_output=PASS files=96`; a conferência do sitemap retornou `sitemap_local_targets=PASS urls=23`.

## HTTP e navegador

O pacote foi servido exclusivamente de `build/public/` pelo validador local `scripts/serve-public.py`, que interpreta `_headers`; não foi usado um servidor estático genérico para aprovar cabeçalhos. O servidor foi Python `3.9.6` e o Chrome foi `Google Chrome 152.0.7977.76`.

Comandos usados nessa etapa:

```sh
python3 scripts/serve-public.py --directory build/public --port 8765
curl --dump-header - --output /dev/null http://127.0.0.1:8765/
PUBLIC_TEST_BASE=http://127.0.0.1:8765 CDP_ENDPOINT=http://127.0.0.1:9222 node scripts/test-browser.cjs
```

Uma resposta `200` da home, das três demos de portfólio, de `/demo/` e do vídeo, além de uma resposta `404`, mostrou os cabeçalhos de segurança. A CSP observada foi de enforcement, sem `Content-Security-Policy-Report-Only`:

```text
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none';
form-action 'self' mailto: https://wa.me; script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self';
connect-src 'self'; frame-src 'none'; manifest-src 'self'; upgrade-insecure-requests
```

O primeiro ensaio headless direto com `file://` foi abortado e não foi contado como aprovado. A investigação registrou mensagens de ambiente (`CVDisplayLinkCreateWithCGDisplay`, GPU/display e serviços auxiliares do Chrome), sem evidência de violação da aplicação. A validação foi repetida com uma instância headless isolada, endpoint CDP e navegação de topo; o teste por iframe foi descartado porque `frame-ancestors 'none'` bloqueia corretamente esse tipo de enquadramento.

`node scripts/test-browser.cjs` passou com viewport desktop de `1440×900` e emulação móvel solicitada de `390×844`. Foram exercitados tema, navegação, fontes, vídeo, layout sem overflow e as quatro demos. O resultado foi `violations=[]`, `errors=[]` e `consoleErrors=[]`. As entradas com `<svg onload=...>` e aspas apareceram como texto literal; não foram criados elementos executáveis ou eventos. O checkout exibiu `Simulação concluída`, não navegou para `wa.me`, não gerou requisição para esse domínio e o CTA comercial permaneceu sem os campos preenchidos.

A inspeção visual inicial da Agenda revelou o motivo da diferença observada: em 390px, `visualViewport=390`, mas `innerWidth=425`, `clientWidth=390` e `scrollWidth=425`; os controles do cabeçalho chegavam a `right=424` e ficavam cortados. O teste anterior não detectava isso porque comparava `scrollWidth` com `innerWidth`. Foi aplicada uma correção pequena em `styles.css` para limitar o cabeçalho/herói a `100vw`, permitir quebra dos controles e acomodar o badge/texto. Após reconstruir, a captura CDP mostrou `innerWidth=390`, `clientWidth=390`, `scrollWidth=390`, sem elementos excedentes; o screenshot visual confirmou que a Agenda não corta mais o cabeçalho nem o título.

## Publicação e pendências de infraestrutura

Não há `.openai/hosting.json`, `wrangler.toml`/`wrangler.json` ou configuração de pipeline versionada no projeto. Há apenas cache local do Wrangler com identificadores de projeto/conta; ele não confirma o comando nem o diretório efetivamente usados. O binário `wrangler` não está disponível e nenhuma configuração remota foi consultada ou alterada. Também não havia conector Cloudflare Pages ou sessão autenticada do Dashboard disponível para capturar o print solicitado.

Para integração Git com Cloudflare Pages, o operador deve conferir no projeto remoto, em modo somente leitura, a origem/repositório e branch, a raiz configurada, o comando de build e o diretório de saída. A configuração pretendida é:

```text
Comando: python3 scripts/build-public.py
Diretório de saída: build/public
```

Para upload direto, somente o conteúdo de `build/public/` deve ser enviado. Se Nginx fizer parte da infraestrutura, ainda faltam a versão efetiva, o template ativo, `nginx -t` e respostas HTTP reais para home, assets, 404, robots, sitemap e CSP. Os templates legados permanecem fora do pacote público.

## Conclusão

A versão local está **pronta para homologação remota**, mas o push permanece condicionado à conferência do Pages: o pacote é reproduzível e fechado, os quatro fluxos demonstrativos passaram no navegador local com CSP real, a diferença 390/425 da Agenda foi corrigida e a inspeção visual final não mostrou clipping.

A branch dedicada já foi criada localmente. Antes da publicação em produção, ainda é necessário confirmar no provedor o pipeline (ou usar somente `build/public/` no upload direto), verificar os cabeçalhos no domínio/preview real e, caso Nginx seja usado, validar o template ativo com a versão instalada. A exposição em produção não é declarada resolvida apenas pela validação local.
