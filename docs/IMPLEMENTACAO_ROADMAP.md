# Implementação do roadmap — 16/10/2026

O ROADMAP_ESTRATEGICO.md preserva integralmente o plano aprovado e seus dados históricos de pesquisa. Este arquivo registra o estado executado, sem confundir implementação local com publicação ou validação comercial.

## Entregue localmente
- Catálogo /kits/, página /kits/video-pronto/ e amostra gratuita.
- Catálogo /ferramentas/ e planejador de vídeo por regras, sem API ou cadastro.
- Gancho de 3 segundos; distribuição exata de 30/45 segundos por objetivo; cortes contíguos de 2–3 segundos; orçamento estimado de palavras com pausas.
- B-Roll e SFX por objetivo, cenas editáveis, perguntas prioritárias, Markdown, impressão e resumo estruturado por WhatsApp.
- Configuração pública do checkout em data/commerce.mjs. Nenhum segredo nesse arquivo.
- Materiais autorais de preparação em content/paid/video-pronto/, excluídos do build.
- Build com allowlist, bloqueio adicional de caminhos privados, variáveis de ambiente e symlinks.

## Estado comercial
O kit está em preparação. Aulas roteirizadas não são aulas gravadas. Não anunciar acesso disponível antes de gravar, revisar e carregar os vídeos. Não há checkout real, pagamento, venda ou envio de mensagem executado nesta implementação.

### Ativar Kiwify quando a entrega estiver pronta
1. Concluir seis aulas e revisar os materiais e direitos de uso.
2. Cadastrar produto e área de membros na conta do proprietário; concluir verificação cadastral.
3. Carregar os arquivos privados. Nunca copiá-los para assets/ ou para a allowlist.
4. Em data/commerce.mjs, preencher checkoutUrl com a URL real HTTPS em pay.kiwify.com.br e marcar checkoutEnabled: true.
5. Atualizar as frases “em preparação”, a FAQ e as condições da página para refletir a disponibilidade real. Confirmar limite do lote e preço; o site não administra estoque de compradores.
6. Testar Pix/cartão aprovado, pendente, acesso por e-mail, download e suporte com o mecanismo de teste disponível na plataforma. Não usar números ou credenciais fictícios em produção.
7. Só depois publicar o novo build. Comprar pelo WhatsApp exige confirmar disponibilidade; nenhum número de Pix ou cobrança é inventado.

## IA: deliberadamente não implementada nesta entrega
Não existe endpoint /api/briefings/gerar nem chamada a um provedor. A .env.example é documentação local, com AI_MODEL_ID vazio; não define um modelo padrão.

Quando os critérios de receita e qualidade forem cumpridos, o backend deve ler AI_MODEL_ID do ambiente do Worker, falhar fechado se estiver vazio ou indisponível e guardar a chave como segredo. Não escolher um modelo alternativo silenciosamente. A configuração do servidor jamais entra no pacote estático. Os nomes e custos citados no roadmap são histórico de pesquisa, não configuração executável.

## Critérios ainda não comprovados
Dez vendas e aplicação real; cinco entrevistas do público técnico; testes de briefings reais; receita e margem para APIs; contratação do piloto B2B. Fases 2, 3 com IA e 4 continuam condicionadas a esses critérios. Nenhuma infraestrutura paga foi criada.

## Operação inicial
Registrar contatos qualificados, origem, proposta, pagamento recebido, aplicação do material, minutos de suporte e pedidos de reembolso em registro interno. Não tratar cliques locais como vendas ou usuários únicos. O trabalho do fundador entra na margem e no custo de aquisição.

## Validação local
python3 scripts/build-public.py --self-test
python3 scripts/build-public.py
node scripts/test-security-fixes.cjs
node --test scripts/test-video-planner.mjs

Teste de navegador: scripts/test-video-browser.mjs, com PLAYWRIGHT_MODULE apontando para playwright-core instalado e PUBLIC_TEST_BASE apontando para o servidor do pacote público. Usa perfil de navegador temporário, sem sessão pessoal. O script não envia mensagens nem efetua compras.

Deploy não foi executado. Somente build/public deve ser publicado; nunca a raiz do repositório. ROADMAP_ESTRATEGICO.md, docs/, content/, .env* e ativos pagos ficam fora.

## Verificação desta entrega
- Autoteste do build e regressões de segurança aprovados.
- 25 testes de lógica/configuração aprovados, incluindo todos os objetivos, 30/45 segundos e três formatos.
- Chrome: edição/exportação, clipboard, impressão, XSS, CSP, ausência de persistência e envio automático, checkout desativado, cinco larguras entre 320 e 1440px.
- Arquivos privados e .env.example retornam 404 no servidor do pacote público.
- PDFs renderizados e inspecionados: amostra de duas páginas e guia interno de quatro páginas.
- Checkout real, pagamentos, aulas gravadas e validação comercial continuam pendentes; nenhum deploy foi executado.
