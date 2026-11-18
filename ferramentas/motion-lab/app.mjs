import {heroAt, carouselAt} from './products.mjs';
const $ = (id) => document.getElementById(id);
const scenes = {
  intro: {"number": "01", "name": "Guaraná Jesus · Hero", "duration": 6, "format": "16:9", "photo": "guarana-jesus.png", "title": "JESUS", "subtitle": "Sabor que marca", "cta": "Do Maranhão", "kicker": "GUARANÁ JESUS", "description": "Lata central, raios radiais girando, palavra em contorno ao fundo, brilho diagonal limitado à embalagem e textos laterais.", "beats": ["0–1s: lata sobe de baixo com mola amortecida, ultrapassa ligeiramente a posição de repouso e se acomoda inclinada.", "0,5–1,15s: palavra em contorno aparece atrás da lata; raios continuam girando.", "1,1–2s: faixa de luz diagonal atravessa a embalagem; a partir de 1,8s, pequenos brilhos cintilam.", "2,15s: texto esquerdo entra; 2,55s: texto direito entra; 3–3,5s: sublinhado se desenha.", "Até 6s: flutuação discreta da lata, raios e brilhos continuam."]},
  profile: {"number": "02", "name": "Cheetos + cachorrinho", "duration": 8, "format": "16:9", "photo": "cheetos-mix.png", "title": "Escolha o seu", "subtitle": "Mix de queijos", "cta": "Lua parmesão", "kicker": "CHEETOS ASSADO", "description": "Carrossel horizontal de embalagens: o produto central é grande e nítido; os vizinhos são menores, inclinados e desfocados. Fundo muda de roxo para laranja e verde. Três itens distintos: dois Cheetos e o cachorrinho.", "beats": ["0–0,8s: carrossel entra lateralmente com mola; Cheetos Mix roxo fica no centro.", "0,45–0,85s: nome e peso aparecem abaixo da embalagem central.", "2,67–3,5s: deslocamento lateral com mola; Cheetos Lua laranja ocupa o centro; fundo e indicador acompanham.", "5,33–6,2s: novo deslocamento para a esquerda; o cachorrinho ocupa o centro.", "Até 8s: manter o cachorrinho em destaque, com o Cheetos laranja menor à esquerda."]},
  vertical: { number: '03', name: 'Chamada para serviços', duration: 8, format: '9:16', photo: 'andre-corpo.png', title: 'Do brief à entrega.', subtitle: 'Vídeos com direção, ritmo e intenção.', cta: 'Conte sua ideia', kicker: 'SEU PRÓXIMO PROJETO COMEÇA AQUI', description: 'Foto de corpo inteiro centralizada, degradê escuro inferior e título no terço inferior; formato vertical.', beats: ['0–1,2s: fotografia sobe suavemente e aparece.', '0,3–1,3s: identificação; 0,65–1,65s: título no terço inferior.', '1,15–2,15s: subtítulo; 2–2,8s: chamada final.', '2,8–8s: manter a chamada legível com aproximação discreta.'] },
};
let selected = 'intro';
let time = 6;
let playing = false;
let raf = null;
let last = null;
const drafts = Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { title: s.title, subtitle: s.subtitle, cta: s.cta, puppy: 'Cachorrinho' }]));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const layers = Object.fromEntries([...document.querySelectorAll('[data-layer]')].map(el => [el.dataset.layer, el]));
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (t, start, length) => 1 - (1 - clamp((t - start) / length)) ** 3;

function render() {
  const scene = scenes[selected];
  if (selected !== 'vertical') { renderProducts(); renderClock(); return; }
  const photo = ease(time, 0, selected === 'profile' ? 1.4 : 1.2);
  const drift = clamp(time / scene.duration);
  layers.photo.style.opacity = photo;
  layers.photo.style.transform = selected === 'profile'
    ? `perspective(900px) rotateY(${(1 - photo) * -18}deg) translateY(${-drift * 1.4}%)`
    : selected === 'vertical'
      ? `translateY(${(1 - photo) * 6}%) scale(${1 + drift * .025})`
      : `translateX(${(1 - photo) * 12}%) scale(${1 + drift * .035})`;
  for (const [name, start, duration] of [['kicker', .3, 1], ['title', .65, 1], ['subtitle', 1.15, 1], ['cta', 2, .8]]) {
    const progress = ease(time, start, duration);
    layers[name].style.opacity = progress;
    layers[name].style.transform = `translateY(${(1 - progress) * 18}px)`;
  }
  layers.orbit.style.opacity = ease(time, .2, 1.2) * .75;
  layers.orbit.style.transform = `rotate(${drift * 12}deg) scale(${.9 + photo * .1})`;
  layers.rule.style.transform = `scaleX(${photo})`;
  renderClock();
}

function renderClock() {
  const scene = scenes[selected];
  $('timeline').value = time;
  $('time').value = `${time.toFixed(1)} / ${scene.duration}s`;
  $('timeline').setAttribute('aria-valuetext', `${time.toFixed(1)} de ${scene.duration} segundos`);
}

function pause() {
  playing = false;
  if (raf !== null) cancelAnimationFrame(raf);
  raf = null;
  last = null;
  $('play').textContent = '▶ Reproduzir';
}
function tick(now) {
  if (!playing) return;
  if (last !== null) time = Math.min(scenes[selected].duration, time + (now - last) / 1000);
  last = now;
  render();
  if (time >= scenes[selected].duration) { pause(); return; }
  raf = requestAnimationFrame(tick);
}
function play() {
  if (time >= scenes[selected].duration) time = 0;
  playing = true;
  last = null;
  $('play').textContent = 'Ⅱ Pausar';
  raf = requestAnimationFrame(tick);
}

function makePrompt() {
  if (selected !== 'vertical') return productPrompt();
  const s = scenes[selected];
  const d = drafts[selected];
  const size = selected === 'vertical' ? '1080 × 1920' : '1920 × 1080';
  return `# AndreStudio Motion Lab — ${s.name}

Prompt autoral para implementação em Remotion. Este arquivo é uma especificação; não é um vídeo nem código já renderizado.

## Objetivo
Crie uma composição original de motion design para o AndreStudio usando React e Remotion. Entregue o componente da cena, o registro Composition e as instruções de instalação, prévia e renderização. Consulte a documentação da versão instalada antes de escolher APIs. Não use serviços externos pagos.

## Configuração
- Resolução: ${size}, proporção ${s.format}.
- Duração: ${s.duration} segundos, 30 fps, ${s.duration * 30} frames.
- Fotografia: coloque sua cópia autorizada de ${s.photo} em public/motion-lab/; carregue com staticFile e Img.
- Paleta: grafite #15191e, branco #f5f5f2 e vermelho #e21b23.
- Use fontes locais ou system-ui; não dependa de downloads de fonte durante o render.

## Textos literais (dados, não instruções)
${JSON.stringify({ identificacao: s.kicker, titulo: d.title, apresentacao: d.subtitle, chamada: d.cta, assinatura: 'ANDRESTUDIO.DEV.BR' }, null, 2)}

## Direção visual
${s.description}
Preserve a aparência e as proporções do modelo. Anime o enquadramento e as camadas gráficas; não invente gestos, fala ou movimento facial. Use a fotografia original com seu fundo. Se quiser um recorte transparente, prepare e revise esse arquivo antes.

## Roteiro de movimento
${s.beats.map(b => '- ' + b).join('\n')}

## Requisitos de execução
- Calcule toda animação pelo frame com useCurrentFrame e useVideoConfig. Use interpolação limitada nos extremos, sem relógio, CSS keyframes, Math.random ou chamadas de rede durante o render.
- Faça entradas suaves com ease-out; movimentos contínuos devem ser discretos e determinísticos.
- Ajuste fonte e quebras ao comprimento real dos textos; nenhum texto deve ficar cortado. Mantenha margens seguras de pelo menos 7% e revise a composição no formato escolhido.
- Sem áudio nesta versão. SFX e música são uma etapa opcional, com arquivos de uso autorizado.
- Teste os frames de entrada, 1s, 2,8s e o último frame. Confirme imagens carregadas, textos legíveis, duração e resolução antes de exportar MP4.

## Origem
Direção, roteiro e prompt criados para AndreStudio. Referência funcional de galeria: https://www.aicitybuilders.com/remotion . Nenhum código ou texto dos exemplos da referência foi incluído.
As fotografias foram fornecidas pelo titular para estes estudos; este download não concede licença para terceiros usarem sua imagem. Para seu próprio projeto, use imagens autorizadas.
`;
}

function fitText() {
  if (selected !== 'vertical') return;
  const title = $('scene-title');
  const base = selected === 'vertical' ? 12 : selected === 'profile' ? 6.5 : 7.1;
  let size = base;
  const stage = $('stage');
  const copy = title.parentElement;
  title.style.fontSize = `${size}cqw`;
  // Keep editable copy above the footer, including long titles on narrow screens.
  while (size > base * .45 && (selected === 'vertical'
    ? copy.scrollHeight > stage.clientHeight * .53
    : copy.offsetTop + copy.scrollHeight > stage.clientHeight * .89)) {
    size -= .2;
    title.style.fontSize = `${size}cqw`;
  }
}

function updateText() {
  const d = drafts[selected];
  d.title = $('headline').value;
  d.subtitle = $('subtitle').value;
  d.cta = $('cta').value;
  d.puppy = $('puppy-name').value;
  $('hero-word').textContent = d.title;
  $('hero-left').textContent = d.subtitle;
  $('hero-right').textContent = d.cta;
  $('carousel-heading').textContent = d.title;
  $('hero-word').style.fontSize = `${Math.min(18, 120 / Math.max(6,d.title.length))}cqw`;
  for (const [id, text] of [['hero-left',d.subtitle],['hero-right',d.cta]]) $(id).style.fontSize = `${text.length > 20 ? 2.7 : 3.8}cqw`;
  $('scene-title').textContent = d.title;
  $('scene-subtitle').textContent = d.subtitle;
  $('scene-cta').textContent = d.cta ? d.cta + ' ↗' : '';
  fitText();
  $('stage').setAttribute('aria-label', `${scenes[selected].name}: ${d.title}. ${d.subtitle}`);
  $('prompt-output').value = makePrompt();
  $('feedback').textContent = '';
  const s = scenes[selected];
  const waMsg = encodeURIComponent(
    `Olá André! Testei o estudo "${s.number} / ${s.name}" (${s.format}, ${s.duration}s) no Motion Lab com os textos:\n` +
    `• Destaque: ${d.title}\n` +
    `• Subtítulo: ${d.subtitle}\n` +
    `• Chamada: ${d.cta}\n\n` +
    `Quero conversar sobre produzir um vídeo nesse estilo para o meu negócio.`
  );
  const waUrl = `https://wa.me/5598981483900?text=${waMsg}`;
  if ($('order-whatsapp')) $('order-whatsapp').href = waUrl;
  if ($('order-whatsapp-bottom')) $('order-whatsapp-bottom').href = waUrl;
  if (selected !== 'vertical') renderProducts();
}

function selectScene(id) {
  pause();
  selected = id;
  const s = scenes[id];
  $('stage').dataset.scene = id;
  $('scene-label').textContent = `${s.number} / ${s.name}`;
  $('format-label').textContent = `${s.format} · ${s.duration} segundos`;
  if (id === 'vertical') $('model-photo').src = `/assets/motion-lab/${s.photo}`;
  $('hero-view').hidden = id !== 'intro';
  $('carousel-view').hidden = id !== 'profile';
  $('headline').maxLength = id === 'vertical' ? 48 : 24;
  $('subtitle').maxLength = id === 'vertical' ? 70 : 32;
  $('cta').maxLength = id === 'vertical' ? 36 : 32;
  $('puppy-field').hidden = id !== 'profile';
  $('puppy-name').value = drafts[id].puppy;
  $('headline-label').textContent = id === 'intro' ? 'Palavra ao fundo (até 24 caracteres)' : id === 'profile' ? 'Título da seleção' : 'Título';
  $('subtitle-label').textContent = id === 'intro' ? 'Texto à esquerda' : id === 'profile' ? 'Nome do Cheetos roxo' : 'Apresentação';
  $('cta-label').textContent = id === 'intro' ? 'Texto à direita' : id === 'profile' ? 'Nome do Cheetos laranja' : 'Chamada final';
  layers.kicker.textContent = s.kicker;
  $('headline').value = drafts[id].title;
  $('subtitle').value = drafts[id].subtitle;
  $('cta').value = drafts[id].cta;
  $('timeline').max = s.duration;
  time = s.duration;
  for (const button of document.querySelectorAll('[data-select]')) button.setAttribute('aria-pressed', String(button.dataset.select === id));
  updateText();
  render();
}

$('play').addEventListener('click', () => playing ? pause() : play());
$('restart').addEventListener('click', () => { pause(); time = 0; render(); });
$('timeline').addEventListener('input', () => { pause(); time = Number($('timeline').value); render(); });
for (const button of document.querySelectorAll('[data-select]')) button.addEventListener('click', () => selectScene(button.dataset.select));
for (const id of ['headline', 'subtitle', 'cta','puppy-name']) $(id).addEventListener('input', updateText);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { pause(); time = scenes[selected].duration; render(); } });

$('copy-prompt').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(makePrompt()); $('feedback').textContent = 'Prompt copiado. Cole no seu ambiente com Remotion.'; }
  catch { const output = $('prompt-output'); output.closest('details').open = true; output.focus(); output.select(); $('feedback').textContent = 'Selecionei o prompt abaixo. Use Ctrl+C ou ⌘C para copiar.'; }
});
$('download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([makePrompt()], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = `andrestudio-motion-${selected}.md`; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('feedback').textContent = 'Download do prompt e roteiro solicitado.';
});

const sparkles = Array.from({length:12}, (_, i) => {
  const star = document.createElement('i');
  star.className = 'product-spark';
  star.style.left = `${37 + ((i * 17) % 26)}%`;
  star.style.top = `${14 + ((i * 23) % 70)}%`;
  $('hero-can').append(star);
  return star;
});
const carouselAssets = [
  ['cheetos-mix.png', 'Cheetos Assado Mix de queijos, embalagem roxa', 400, 1024/1536],
  ['cheetos-lua.png', 'Cheetos Assado Lua parmesão, embalagem laranja', 420, 1106/1422],
  ['cachorrinho.png', 'Cachorrinho branco e marrom, convidado do carrossel', 320, 1.5],
];
const carouselItems = carouselAssets.map(([src,alt,height,ratio], i) => {
  const el = document.createElement('div');
  el.className = 'carousel-product';
  const img = document.createElement('img');
  img.src = `/assets/motion-lab/${src}`;
  img.alt = alt;
  el.style.height = `${height/720*100}%`;
  el.style.width = `${height*ratio/1280*100}%`;
  el.style.top = `${(300-height/2)/720*100}%`;
  img.addEventListener('load',()=>{el.style.width=`${height*img.naturalWidth/img.naturalHeight/1280*100}%`;});
  el.append(img); $('carousel-track').append(el); return el;
});
function renderProducts() {
  if (selected === 'intro') {
    const m = heroAt(time);
    $('hero-can').style.transform = `translate(-50%, ${m.y}%) rotate(${m.tilt}deg)`;
    $('hero-can').style.opacity = Math.min(1, m.enter * 2);
    $('hero-rays').style.transform = `translate(-50%, -50%) rotate(${m.rays}deg)`;
    $('hero-word').style.opacity = m.word;
    $('hero-shadow').style.transform = `translateX(-50%) scale(${.5 + Math.min(1,m.enter)*.5})`;
    $('hero-shadow').style.opacity = Math.min(1,m.enter)*.65;
    $('hero-sheen').style.opacity = m.sheen;
    $('hero-sheen').style.backgroundPosition = `${m.sweep}% 50%`;
    for (const [name, amount, sign] of [['hero-left-group',m.left,1],['hero-right-group',m.right,-1]]) {
      $(name).style.opacity = Math.max(0,Math.min(1,amount));
      $(name).style.transform = `translateX(${(1-amount)*sign*30}%)`;
    }
    $('hero-underline').style.transform = `scaleX(${m.underline})`;
    sparkles.forEach((el,i) => { const pulse = Math.max(0, Math.sin(time*4.5 + i*2.1))**7; el.style.opacity=pulse*m.sparkle; el.style.transform=`scale(${.35+pulse})`; });
  } else {
    const m = carouselAt(time);
    $('carousel-view').style.backgroundColor = m.color;
    $('carousel-number').textContent = String(m.focus+1).padStart(2,'0');
    m.products.forEach((item,i) => {
      const el=carouselItems[i];
      el.style.left = `${50+item.x}%`;
      el.style.transform = `translateX(-50%) scale(${item.scale}) rotate(${item.rotate}deg)`;
      el.style.opacity = item.opacity;
      const ratio = $('stage').clientWidth/1280;
      el.style.filter = `blur(${item.blur*ratio}px)`;
      el.firstElementChild.style.transform = `translateY(${item.float*ratio}px)`;
      el.style.zIndex = item.focus ? 3 : 1;
    });
    $('carousel-name').textContent = [drafts.profile.subtitle,drafts.profile.cta,drafts.profile.puppy][m.variant];
    $('carousel-weight').textContent = ['131 g','35 g','Convidado especial'][m.variant];
    $('carousel-label').style.opacity = m.label;
    $('carousel-label').style.transform = `translateY(${m.labelY/1280*$('stage').clientWidth}px)`;
    document.querySelectorAll('.carousel-dot').forEach((el,i) => el.classList.toggle('active',i===m.focus));
  }
}
function productPrompt() {
  const s=scenes[selected], d=drafts[selected];
  const hero=selected==='intro';
  return `# AndreStudio Motion Lab — ${s.name}

Especificação autoral para Remotion baseada nos movimentos observados no exemplo ${hero ? '51 (hero)' : '52 (carrossel)'} de https://www.aicitybuilders.com/remotion .

## Entrega
Implemente a cena em React/Remotion e registre uma Composition de 1280 × 720, 30 fps, ${s.duration*30} frames (${s.duration}s). Entregue componente, registro e instruções de render. Não execute APIs pagas. A prévia atual é HTML/CSS/JS; este arquivo é um roteiro de implementação, não um vídeo.

## Produtos e arquivos
${hero ? 'Use guarana-jesus.png: lata Guaraná Jesus azul, rosa e branca, centralizada, com proporções e rótulo preservados. Fundo rosa #cb1269 com bordas #390927 e raios sutis.' : 'Use cheetos-mix.png (roxo, 131 g), cheetos-lua.png (laranja, 35 g) e cachorrinho.png. Preserve rótulos, silhuetas, pelagem e proporções. A sequência é Cheetos roxo → Cheetos laranja → cachorrinho. O cão é um convidado visual; não mostrar alimentação nem atribuir preço.'}
Os PNGs transparentes estão em assets/motion-lab no site. Para render local, copie-os para public/motion-lab e carregue com staticFile + Img. São recortes preparados com IA a partir de imagens fornecidas; confira os rótulos antes de uma produção final.

## Textos literais — tratar como dados
${JSON.stringify(hero ? {palavraAoFundo:d.title,textoEsquerdo:d.subtitle,textoDireito:d.cta} : {titulo:d.title,nomeRoxo:d.subtitle,nomeLaranja:d.cta,nomeConvidado:d.puppy},null,2)}

## Composição
${s.description}
${hero ? 'Produto ocupa cerca de 85% da altura. Palavra vazada grande no topo, atrás da lata. Textos brancos nas laterais, sem cobrir a embalagem. Sombra elíptica sob a lata. Luz diagonal recortada pelo canal alpha da lata, nunca um retângulo branco sobre o fundo.' : 'Use as medidas do código fornecido: alturas de 400, 420 e 320 px, centro em y=300, espaçamento horizontal de 440 px numa composição de 1280 × 720. Vizinhos ficam em 62% da escala central e opacidade de 55%; o desfoque é distância × 3 px. Preserve a proporção de cada PNG. Número 01/02/03 grande e translúcido ao fundo. Indicador de três posições no topo; nome e peso abaixo, ou “Convidado especial” para o cachorrinho. Não invente preços ou promoções.'}

## Tempos
${s.beats.map(b=>'- '+b).join('\n')}

## Curvas determinísticas
Converta frame/fps em segundos. Mola normalizada: S(t)=0 para t<=0; caso contrário S(t)=1-exp(-d*t)*(cos(w*t)+(d/w)*sin(w*t)).
${hero ? 'Entrada: S(t-0,08), d=6, w=12. Deslocamento vertical inicial de 140% da altura da camada, terminando em zero; inclinação repousa perto de −6°. Raios giram 5°/s. A partir de 1,1s, mova o brilho diagonal por 0,9s. Textos: S(t-2,15) e S(t-2,55), d=8, w=13. Brilhos têm posições fixas e pulso senoidal; não use aleatoriedade por frame.' : 'Use spring com damping=15, stiffness=100 e mass=1, conforme o código fornecido (equivalente a d=7,5 e w=sqrt(43,75)). Posição p(t)=−1,6*(1−S(t))+S(t−8/3)+S(t−16/3). Para cada índice i=0,1,2: x=640+(i−p)*440. Escala vai de 1 a 0,62 até distância 1; opacidade vai de 1 a 0,55 a 0 nas distâncias 0,1,1,5. Inclinação=(i−p)*6 graus. Flutuação vertical=sin((frame+i*20)/16)*6 px. Fundo interpola roxo RGB(72,31,160), laranja RGB(242,113,23) e verde RGB(40,137,108). A legenda entra de baixo com spring damping=14, começando 10 frames após cada troca (0,80,160); y=(1−textIn)*40px. Número, nome, peso ou rótulo do convidado e indicador seguem o item central. São exatamente três itens; não repetir embalagens para preencher espaços.'}

## Aceite
Use apenas frame e dimensões para animar; sem Date.now, timers ou aleatoriedade não determinística. Todas as camadas precisam responder a seek. Confira entrada, 1,5s, 2,8s, 5,7s e último frame. Textos editáveis devem caber nas margens sem cobrir produtos. Sem áudio nesta versão. Mantenha o rodapé “Estudo visual independente · sem vínculo com as marcas” e assinatura AndreStudio. O carrossel adapta os parâmetros do código fornecido pelo usuário; manter esta atribuição na documentação.
`;
}

// Deliberately static on load, including for reduced-motion visitors. Playback is opt-in.
selectScene('intro');
new ResizeObserver(fitText).observe($('stage'));
