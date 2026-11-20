const body = document.querySelector('.article-body');
if (body && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
  const synth = window.speechSynthesis;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn';
  button.textContent = '▶ Ouvir este texto';
  const stop = document.createElement('button');
  stop.className = 'btn';
  stop.type = 'button';
  stop.textContent = 'Encerrar';
  stop.hidden = true;
  const status = document.createElement('span');
  status.setAttribute('role', 'status');
  const controls = document.createElement('div');
  controls.className = 'actions';
  controls.append(button, stop, status);
  body.prepend(controls);
  const chunks = [...body.querySelectorAll('h2,h3,p,li')].filter(el => !el.querySelector('p,li'))
    .flatMap(el => el.innerText.match(/[^.!?]+[.!?]*|[.!?]+/g) || [])
    .flatMap(line => line.trim().match(/.{1,180}(?:\s|$)|\S+/g) || []);
  let position = 0;
  let generation = 0;
  let state = 'idle';
  function reset() {
    generation++;
    synth.cancel();
    position = 0;
    state = 'idle';
    button.textContent = '▶ Ouvir este texto';
    stop.hidden = true;
    status.textContent = '';
  }
  function speak() {
    if (position >= chunks.length) return reset();
    const current = generation;
    const speech = new SpeechSynthesisUtterance(chunks[position]);
    speech.lang = 'pt-BR';
    const voice = synth.getVoices().find(v => /^pt[-_]BR/i.test(v.lang));
    if (voice) speech.voice = voice;
    speech.onend = () => {
      if (generation !== current) return;
      position++;
      speak();
    };
    speech.onerror = () => {
      if (generation !== current) return;
      reset();
      status.textContent = 'A voz está indisponível neste aparelho.';
    };
    synth.speak(speech);
  }
  button.onclick = () => {
    if (state === 'playing') {
      generation++;
      synth.cancel();
      state = 'paused';
      button.textContent = '▶ Continuar leitura';
      return;
    }
    state = 'playing';
    status.textContent = '';
    button.textContent = 'Ⅱ Pausar leitura';
    stop.hidden = false;
    speak();
  };
  stop.onclick = reset;
  window.addEventListener('pagehide', reset);
}
