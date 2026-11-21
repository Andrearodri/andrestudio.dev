# CONTINUAR — site andrestudio.dev (estado em 20/11/2026)

> Para qualquer IA (Claude, Codex) que pegar este projeto: leia este arquivo antes de mexer.

## Regras do dono (valem sempre)
- **Nada falso:** nenhum número sem fonte, nenhuma promessa de resultado, demos sempre marcadas
  "dados fictícios", capturas reais em vez de imagens geradas por IA. Advocacia segue o
  Provimento 205/2021 da OAB; saúde segue o conselho de cada profissão; dados seguem a LGPD.
- **Nada genérico:** pesquisar o que está funcionando e é bonito, e modelar sem copiar.
- **Público:** donos de pequenos e médios negócios (atendimento no WhatsApp, anúncios, vídeo
  curto). Notícias de tecnologia saíram do site.
- **Commit e push a cada passo** que funciona. Trabalho novo em branch, nunca direto na main.
- Texto para o usuário final em português do Brasil.

## Como rodar e validar
- `npm run check` (build + lint + CSP + 65 testes). No Windows o Python é chamado por
  `scripts/run-python.mjs`, que escolhe `python` ou `python3`.
- `PORT=8766 npm run dev` → http://127.0.0.1:8766 (a 8765 é do Radar, outro projeto).
- Toda página nova precisa entrar na allowlist de `scripts/build-public.py` e no `sitemap.xml`.
- CSP: nada de `<script>` inline nem `onclick`; JS sempre em arquivo `.mjs`.
- Commits com o e-mail noreply do GitHub (já configurado neste repo); o GitHub recusa o Gmail.

## Onde está cada coisa (branches empilhadas, ainda NÃO publicadas)
`main` = versão publicada em 20/11. Em cima dela, em ordem:
1. `feat/scout-vitrine`: `/ferramentas/scout/` (vitrine do Radar com demo fictícia; o nome
   "Scout" é provisório, o dono pode trocar).
2. `feat/blog-negocios`: blog limpo (12 posts de tecnologia/urna saíram com 301 para /blog/ no
   `_redirects`), 2 posts novos com fontes e capas próprias.
3. `feat/portfolio-telas-reais` (contém as anteriores):
   - capturas reais das demos no lugar das imagens de IA (Lead Flow, OmniAgent, Nexus);
   - nova demo `/portfolio/nexus-bi-demo/` (projeção de caixa 30/60/90, faturas, alertas);
   - `/solucoes/servicos/?area=advocacia|contabilidade|clinicas|imobiliarias|outros`:
     página para escritórios e empresas de serviço com seletor de área.

4. `feat/integracao` (publicada na main em 21/11): junta tudo acima com a branch do Codex
   `fix/consistent-public-navigation` (cursos e 7 aulas, /assista/, posts Epoch AI e GPT-6.2,
   menu padronizado em 43 páginas, `npm run test:navigation`). Ficaram fora: os 12 posts de
   notícias de tecnologia e o feed "Direto da fonte" do blog (radar.js continua no repo, mas
   não é usado no blog). No /assista/ saiu o vídeo recomendado do YouTube (o dono não quer).

5. `feat/enxugar` (**a mais recente, use esta**; a `main` já publicada = `feat/integracao`):
   menu de 6 itens + botão "Raio-X grátis"; Assista dentro de Cursos (301); saem a demo
   Agenda Cheia e os estudos In the Nuvens e Mundo em Evolução (301); página inicial nova
   ("Do primeiro contato ao pagamento") com seção Três frentes. 40 menus, 68 testes.
   Nome "Raio-X" em discussão: o dono pode trocar (botão do menu, home, blog, soluções e o
   repo `raiox-negocio`).

## ANTES DE PUBLICAR (importante)
Resolvido em 20/11: as páginas que só estavam no Mac (`/cursos/`, `/assista/`, post da Epoch)
chegaram pelo Codex e estão em `feat/integracao`. Antes de publicar, ainda confirmar na Cloudflare
de qual branch a publicação sai.

## Próximos passos combinados
- Dono está testando `/solucoes/servicos/` e quer terminar a página hoje.
- Raio-X (repo `raiox-negocio`, separado): imagem de prévia (og:image), opção "anúncios" no
  campo de gargalo (precisa mudar a lista em `app/api/leads/route.ts` também), bloco do Scout,
  e decidir o nome da marca (André Studio × AndreStudio.dev).
