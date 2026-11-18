# Motion Lab — produtos e convidado

Implementação local em 17/10/2026. Caminho: ferramentas/motion-lab/.

## Referência e escopo
- Fonte visual: https://www.aicitybuilders.com/remotion, exemplos 51 e 52.
- Vídeos públicos observados: /video/remotion/51.mp4 (6s) e /video/remotion/52.mp4 (8s), ambos 960×540, 30fps.
- Carrossel: parâmetros adaptados do código Remotion enviado pelo usuário em Texto colado.txt. Três itens, STEP=80, GAP=440, mola damping=15, mass=1, stiffness=100; legenda damping=14, atraso de 10 frames; escala lateral 0,62, blur proporcional à distância, flutuação senoidal. Prévia proporcional à base 1280×720.
- Cheetos roxo → Cheetos laranja → cachorrinho. O cachorro aparece como convidado visual, sem preço nem alimentação.
- Hero Guaraná Jesus: reprodução aproximada da sequência observada (entrada com mola, raios, brilho recortado e textos). Não é equivalência quadro a quadro.
- O terceiro estudo de André continua disponível.
- Prévia HTML/CSS/JS; não houve render MP4 ou execução de um projeto Remotion. Prompt exportado descreve a implementação posterior.

## Imagens e ferramenta
Preparadas com a ferramenta integrada image_gen, modo de edição e fundo transparente. Fontes: anexos enviados pelo usuário. Os arquivos gerados originais permanecem em ~/.codex/generated_images/. Cópias usadas pelo site:
- assets/motion-lab/guarana-jesus.png
- assets/motion-lab/cheetos-mix.png
- assets/motion-lab/cheetos-lua.png
- assets/motion-lab/cachorrinho.png

Os recortes foram gerados/restaurados por IA; detalhes de rótulo e pelagem podem divergir das imagens pequenas de origem. Não tratar como packshots oficiais. A prévia identifica o estudo independente.

## Prompts de preparação dos assets (especificações utilizadas)
1. Guaraná Jesus: extrair a lata fornecida, retirar somente o fundo branco externo, preservar rótulo azul/rosa/branco, lettering, ornamentos, bordas metálicas, perspectiva e proporções; fundo realmente transparente, margem de 5%; sem redesenho, gotas, sombra ou novas palavras.
2. Cheetos roxo: extrair somente a embalagem roxa à esquerda, preservar logo, ASSADO, mascote, ilustrações e 131g; retirar badge PROMOÇÃO e reconstruir apenas a pequena região encoberta; excluir tile e produto laranja; transparência e margem de 5%.
3. Cheetos laranja: extrair somente a embalagem laranja à direita, preservar logo, ASSADO, LUA, PARMESÃO, mascote e 35g; retirar tile, itens soltos e embalagem roxa; completar somente a borda cortada; transparência e margem de 5%.
4. Cachorrinho: retirar grama, jardim e cantos arredondados; preservar o mesmo cachorro, pose, pelagem branca/marrom, rosto, quatro patas e cauda levantada; fotografia com transparência, margem de 5%, sem objetos ou comida.

## Manutenção
products.mjs contém curvas puras amostradas pela linha do tempo; app.mjs aplica o estado às camadas. Não usar timers independentes para animação. Assets públicos entram somente por allowlist. Materiais pagos continuam excluídos.
