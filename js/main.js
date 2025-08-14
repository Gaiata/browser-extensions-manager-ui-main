let allItems = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle();
  setupFilters();
  loadData();
});

/* =========================
   Data
   ========================= */
async function loadData() {
  const container = document.getElementById('cards-container');
  try {
    const res = await fetch('./data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();

    // Añadimos un id estable a cada item
    allItems = items.map((it, i) => ({ ...it, id: i }));
    applyFilter(currentFilter);
  } catch (err) {
    console.error('Error cargando data.json:', err);
    container.innerHTML = `<p>Error cargando datos</p>`;
  }
}

/* =========================
   Render
   ========================= */
function renderCards(items) {
  const container = document.getElementById('cards-container');
  const frag = document.createDocumentFragment();

  items.forEach(item => {
    const { id, logo, name, description, isActive } = item;

    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = String(id);

    card.innerHTML = `
  <div class="card__logo">
    <img src="${logo}" alt="Logo de ${escapeHtml(name)}" loading="lazy">
  </div>

  <div class="card__content">
    <h3 class="card__title">${escapeHtml(name)}</h3>
    <p class="card__desc">${escapeHtml(description)}</p>
  </div>

  <button class="btn-remove" type="button" aria-label="Eliminar ${escapeHtml(name)}">Remove</button>

  <!-- Icono toggle (SUSTITUYE al botón anterior) -->
  <img
    class="toggle-icon"
    src="./assets/images/${isActive ? 'toggle-on.svg' : 'toggle-off.svg'}"
    alt=""
    role="switch"
    aria-checked="${isActive}"
    tabindex="0"
  />
`;

    // Eventos
    const btnRemove = card.querySelector('.btn-remove');
    const toggleImg = card.querySelector('.toggle-icon');

    btnRemove.addEventListener('click', () => handleRemove(id));

    toggleImg.addEventListener('click', () => handleToggle(id));

    // Teclado: Enter o Space
    toggleImg.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle(id);
    }
    });


    // fallback mini: si el logo falla, que no rompa el layout
    const logoImg = card.querySelector('.card__logo img');
    logoImg.addEventListener('error', () => {
    logoImg.style.display = 'none';
    });

    frag.appendChild(card);
  });

  container.replaceChildren(frag);
}


/* =========================
   Acciones (Remove/Toggle)
   ========================= */
function handleRemove(id) {
  allItems = allItems.filter(it => it.id !== id);
  applyFilter(currentFilter); // re-render con filtro actual
}

function handleToggle(id) {
  const idx = allItems.findIndex(it => it.id === id);
  if (idx === -1) return;

  // Cambiar estado
  allItems[idx].isActive = !allItems[idx].isActive;

  // Lógica para desaparecer inmediatamente si cambia de lista
  if (currentFilter === 'active' && !allItems[idx].isActive) {
    applyFilter('active');
    return;
  }
  if (currentFilter === 'inactive' && allItems[idx].isActive) {
    applyFilter('inactive');
    return;
  }

  // Si estoy en 'all' o el cambio no saca la card del filtro actual
  applyFilter(currentFilter);
}





/* =========================
   Filtros
   ========================= */
function setupFilters() {
  const filterBtns = document.querySelectorAll('.btn-filter');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      currentFilter = btn.dataset.filter;
      applyFilter(currentFilter);
    });
  });
}

function applyFilter(type) {
  let filtered = allItems;
  if (type === 'active') filtered = allItems.filter(it => it.isActive);
  if (type === 'inactive') filtered = allItems.filter(it => !it.isActive);
  renderCards(filtered);
}

/* =========================
   Tema (oscuro/ligero)
   ========================= */
function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  // Estado inicial desde localStorage
  const stored = localStorage.getItem('theme');
  if (stored === 'light') document.body.classList.add('light-theme');
  updateThemeButtonIcon(btn);

  btn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeButtonIcon(btn);
  });
}

function updateThemeButtonIcon(btn) {
  const isLight = document.body.classList.contains('light-theme');
  // Limpiar el contenido previo
  btn.innerHTML = '';
  // Crear el elemento img para el SVG
  const icon = document.createElement('img');
  icon.src = isLight
    ? './assets/images/moon-regular-full.svg'
    : './assets/images/sun-regular-full.svg' ;
  icon.alt = isLight ? 'Icono sol' : 'Icono luna';
  icon.style.width = '1.5em';
  icon.style.height = '1.5em';
  btn.appendChild(icon);
  btn.setAttribute('aria-label', isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
}

/* =========================
   Util
   ========================= */
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
