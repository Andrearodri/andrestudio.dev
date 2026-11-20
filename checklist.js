const group = document.querySelector('.ed-check');
const result = document.querySelector('#saldo');
function update() {
  const marked = group.querySelectorAll('input:checked').length;
  result.textContent = marked + ' de 5 pontos atendidos.';
}
group.addEventListener('change', update);
window.addEventListener('pageshow', update);
