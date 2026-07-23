async function loadGames() {
  const res = await fetch('data/games.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Không tải được data/games.json');
  return res.json();
}

function normalize(str) {
  return (str || '').trim().toLowerCase();
}

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Deterministic-but-varied stripe colors per card, based on the name
function stripeFor(name) {
  const palettes = [
    ['#ff6b5b', '#ffc857'],
    ['#5ad1c9', '#7c6bff'],
    ['#ffc857', '#ff6b5b'],
    ['#7c6bff', '#5ad1c9'],
  ];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return palettes[hash % palettes.length];
}

function cardHTML(game, opts = {}) {
  const [a, b] = stripeFor(game.name);
  return `
    <a class="card ${opts.hiddenMatch ? 'hidden-match' : ''}" href="${game.file}" target="_blank" rel="noopener">
      ${opts.hiddenMatch ? '<span class="hidden-badge">Ẩn</span>' : ''}
      <div class="label-stripe" style="--stripe-a:${a};--stripe-b:${b}">
        <div class="notch"></div>
      </div>
      <div class="body">
        <div class="name">${game.name}</div>
        <div class="meta">🗓 ${formatDate(game.date)}</div>
        <div class="play">▶ Chơi ngay</div>
      </div>
    </a>
  `;
}

function render(games, query) {
  const grid = document.getElementById('grid');
  const countPill = document.getElementById('count-pill');
  const q = normalize(query);

  const visible = games
    .filter(g => !g.hidden)
    .filter(g => normalize(g.name).includes(q))
    .sort((x, y) => new Date(y.date) - new Date(x.date));

  const hiddenMatches = q
    ? games.filter(g => g.hidden && normalize(g.name) === q)
    : [];

  const all = [...hiddenMatches, ...visible];

  countPill.textContent = `${all.length} game`;

  if (all.length === 0) {
    grid.innerHTML = `<div class="empty-state">Không tìm thấy game nào khớp với "${query}".</div>`;
    return;
  }

  grid.innerHTML =
    hiddenMatches.map(g => cardHTML(g, { hiddenMatch: true })).join('') +
    visible.map(g => cardHTML(g)).join('');
}

(async function init() {
  const searchInput = document.getElementById('search');
  const grid = document.getElementById('grid');

  let games = [];
  try {
    games = await loadGames();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">Lỗi tải danh sách game: ${err.message}</div>`;
    return;
  }

  render(games, '');

  searchInput.addEventListener('input', (e) => render(games, e.target.value));
})();
