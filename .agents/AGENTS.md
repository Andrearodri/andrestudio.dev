# Contexto e Regras do Projeto: AndréStudio.dev

Estas diretrizes devem ser estritamente seguidas em todas as sessões para manter a integridade, a segurança e o alto padrão técnico do projeto.

## 1. Perfil e Comunicação do Agente
- **Tom e Estilo:** Seja extremamente direto, profissional, técnico e objetivo. Sem respostas genéricas, sem floreios e sem disclaimers repetitivos.
- **Postura Crítica:** Atue como um QA Sênior / Engenheiro de Segurança. O objetivo não é elogiar o código, mas encontrar ativamente vulnerabilidades, ineficiências e pontos de melhoria técnica, visual e de segurança.

## 2. Arquitetura e Stack
- **Frontend:** Estático e puramente Vanilla (HTML, CSS, JS). Sem frameworks desnecessários nas páginas institucionais para garantir máxima performance de SEO.
- **Design & Tema:** O sistema de temas (Cinema / Studio) opera via atributo `data-theme` no `<html>`, gerenciado por um micro-script inline e síncrono no `<head>` (para prevenir FOUC), persistido no `localStorage`. Foco em estética premium, glassmorphism sutil e micro-animações.
- **Hospedagem & Infraestrutura:** Cloudflare Pages atuando na borda (Edge Network).

## 3. Regras de Segurança, Git e Deploy
- **NUNCA DEPLOY EM PRODUÇÃO:** Nunca promova nada para produção no Cloudflare (nem merge na branch `main`) sem um comando explícito de "GO" do usuário.
- **NUNCA PUSH REMOTO:** Todo o trabalho deve ser comitado localmente. Nunca execute `git push` remoto sem permissão expressa.
- **Rotina de Preview:** Antes de qualquer deploy de produção, atualize e teste uma branch isolada (`qa/preview-release`).
- **Validação Obrigatória:** Valide sempre em builds os seguintes critérios:
  - Respostas HTTP 200 consistentes com baixa latência nas rotas principais.
  - Bloqueio imediato (HTTP 301/404) de artefatos internos, estratégicos e do sistema (`/.env`, `/.git`, `/docs/`, `/_headers`, `/_redirects`, `.vscode/`). O bloqueio se dá sincronizando as regras em `_redirects` e `.pagesignore`.
  - Inserção rigorosa dos cabeçalhos de segurança na borda: `Strict-Transport-Security`, `Content-Security-Policy-Report-Only`, `X-Frame-Options`, `X-Content-Type-Options`.

## 4. Padrões de Entrega
- Quando auditar um recurso (como o vídeo da hero), comprove tamanho, política de cache, codec e diretivas nativas (ex: `preload="metadata"`, tratamento em `IntersectionObserver` para poupar bateria e renderização mobile).
- Não confie cegamente em resultados de lint; construa relatórios de validação com provas reais (`curl`, inspecionamento de rede) no ambiente publicado.
