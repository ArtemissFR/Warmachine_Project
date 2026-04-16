/**
 * CORE OPS — RECIPES.JS  v2.0
 * ═══════════════════════════════════════════════════════════════════
 *  Architecture fichiers :
 *    data/foods.js              → window.FOODS_DB (base alimentaire)
 *    data/recipes/bundle.js     → window.BUILTIN_RECIPES
 *    data/recipes/*.json        → source de vérité des built-in
 *    localStorage               → recettes user + meta (notes/fav/day)
 *
 *  Modules :
 *    A. Calcul macro journalier
 *    B. Multiplieur de portions (detail modal)
 *    C. Notes & évaluation (stars + textarea)
 *    D. Calcul auto des macros depuis ingrédients
 *    E. Mode Frigo (filtre par ingrédients disponibles)
 *    F. Photos de recette (base64 + resize)
 * ═══════════════════════════════════════════════════════════════════
 */

// ───────────────────────────────────────────────────────────────────
//  STORAGE KEYS
// ───────────────────────────────────────────────────────────────────
const SK_USER     = 'nexus-user-recipes';
const SK_FAVS     = 'nexus-recipe-favs';
const SK_META     = 'nexus-recipe-meta';    // { id: { rating, note } }
const SK_DAY      = 'nexus-daily-meals';    // [{ id, portions, addedAt, date }]
const SK_GOALS    = 'nexus-daily-goals';    // { kcal, prot, gluc, lip }

// ───────────────────────────────────────────────────────────────────
//  STATE
// ───────────────────────────────────────────────────────────────────
let builtinRecipes  = [];
let userRecipes     = [];
let favSet          = new Set();
let recipeMeta      = {};   // { id: { rating:0-5, note:'' } }
let dailyMeals      = [];   // { id, portions, date }
let dailyGoals      = { kcal: 2500, prot: 180, gluc: 250, lip: 70 };

let activeFilter    = 'all';
let activeSearch    = '';
let fridgeActive    = false;
let fridgeIngredients = [];

let editingId       = null;
let selectedEmoji   = '🍗';
let selectedTags    = [];
let currentPhoto    = null;   // base64 string or null
let calcResult      = null;   // last macro calc result
let currentPortions = 1;      // portion multiplier in detail modal
let detailRecipeId  = null;   // currently open detail

// ───────────────────────────────────────────────────────────────────
//  STORAGE HELPERS
// ───────────────────────────────────────────────────────────────────
const load  = (key, def) => { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; } };
const store = (key, val) => localStorage.setItem(key, JSON.stringify(val));

function loadUserRecipes()   { userRecipes  = load(SK_USER,  []); }
function saveUserRecipes()   { store(SK_USER,  userRecipes); }
function loadFavs()          { favSet       = new Set(load(SK_FAVS, [])); }
function saveFavs()          { store(SK_FAVS,  [...favSet]); }
function loadMeta()          { recipeMeta   = load(SK_META,  {}); }
function saveMeta()          { store(SK_META,  recipeMeta); }
function loadGoals()         { dailyGoals   = { kcal:2500, prot:180, gluc:250, lip:70, ...load(SK_GOALS, {}) }; }
function saveGoals_()        { store(SK_GOALS, dailyGoals); }

function loadDailyMeals() {
  const today = todayStr();
  const raw   = load(SK_DAY, []);
  // Keep only today's entries
  dailyMeals  = raw.filter(m => m.date === today);
}
function saveDailyMeals() { store(SK_DAY, dailyMeals); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

// ───────────────────────────────────────────────────────────────────
//  BUILTIN RECIPES LOADER
// ───────────────────────────────────────────────────────────────────
async function loadBuiltinRecipes() {
  // Priority 1: bundle.js (works with file://)
  if (Array.isArray(window.BUILTIN_RECIPES) && window.BUILTIN_RECIPES.length) {
    builtinRecipes = window.BUILTIN_RECIPES.map(r => ({ ...r, source: 'builtin' }));
    return;
  }
  // Priority 2: fetch JSON files (HTTP server)
  try {
    const res   = await fetch('data/recipes/index.json');
    const files = await res.json();
    const all   = await Promise.all(files.map(async f => {
      try { return await (await fetch('data/recipes/' + f)).json(); } catch { return null; }
    }));
    builtinRecipes = all.filter(Boolean).map(r => ({ ...r, source: 'builtin' }));
  } catch { builtinRecipes = []; }
}

// ───────────────────────────────────────────────────────────────────
//  MERGED RECIPES VIEW
// ───────────────────────────────────────────────────────────────────
function allRecipes() {
  return [...builtinRecipes, ...userRecipes].map(r => ({
    ...r,
    fav:    favSet.has(r.id),
    rating: recipeMeta[r.id]?.rating || 0,
    note:   recipeMeta[r.id]?.note   || '',
  }));
}

// ───────────────────────────────────────────────────────────────────
//  DESIGN HELPERS
// ───────────────────────────────────────────────────────────────────
const TAG_STYLE = {
  proteine: { gradient:'linear-gradient(135deg,rgba(57,255,20,.07),rgba(0,0,0,0))',  glow:'rgba(57,255,20,.12)',   accent:'var(--neon-green)' },
  lowcal:   { gradient:'linear-gradient(135deg,rgba(0,212,255,.07),rgba(0,0,0,0))',  glow:'rgba(0,212,255,.12)',   accent:'var(--neon-blue)'  },
  cutting:  { gradient:'linear-gradient(135deg,rgba(157,80,187,.07),rgba(0,0,0,0))', glow:'rgba(157,80,187,.12)',  accent:'#c97de8'           },
  bulking:  { gradient:'linear-gradient(135deg,rgba(255,204,0,.07),rgba(0,0,0,0))',  glow:'rgba(255,204,0,.12)',   accent:'var(--neon-gold)'  },
  vegan:    { gradient:'linear-gradient(135deg,rgba(127,255,127,.07),rgba(0,0,0,0))',glow:'rgba(127,255,127,.1)',  accent:'#7fff7f'           },
  rapide:   { gradient:'linear-gradient(135deg,rgba(255,100,50,.06),rgba(0,0,0,0))', glow:'rgba(255,100,50,.1)',   accent:'#ff9060'           },
};
const DEF_STYLE = { gradient:'linear-gradient(135deg,rgba(0,212,255,.05),rgba(157,80,187,.05))', glow:'rgba(0,212,255,.1)', accent:'var(--neon-blue)' };
const getStyle  = r => TAG_STYLE[r.tags?.[0]] || DEF_STYLE;

const BADGE_HTML = {
  proteine: '<span class="recipe-badge badge-protein">PROTÉINE</span>',
  lowcal:   '<span class="recipe-badge badge-lowcal">LOW CAL</span>',
  bulking:  '<span class="recipe-badge badge-bulking">BULKING</span>',
  vegan:    '<span class="recipe-badge badge-vegan">VEGAN</span>',
  cutting:  '<span class="recipe-badge badge-cutting">CUTTING</span>',
  rapide:   '<span class="recipe-badge badge-rapide">RAPIDE</span>',
};
const AI_BADGE = '<span class="recipe-badge badge-ai">🤖 IA</span>';

function starsHtml(n, interactive = false, id = '') {
  if (interactive) {
    return Array.from({ length: 5 }, (_, i) =>
      `<button class="star-btn" onclick="setRating('${id}',${i+1})" title="${i+1} étoile${i>0?'s':''}">${i < n ? '⭐' : '☆'}</button>`
    ).join('');
  }
  if (!n) return '';
  return '⭐'.repeat(n) + '☆'.repeat(5 - n);
}

function h(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ───────────────────────────────────────────────────────────────────
//  FILTER & SEARCH
// ───────────────────────────────────────────────────────────────────
function getFiltered() {
  return allRecipes().filter(r => {
    // Category filter
    const catOk =
      activeFilter === 'all'     ? true :
      activeFilter === 'favoris' ? r.fav :
      r.tags.includes(activeFilter);
    if (!catOk) return false;

    // Search filter
    const q = activeSearch.toLowerCase().trim();
    if (q) {
      const haystack = [r.name, r.desc, ...r.tags, r.ingredients].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // Fridge filter
    if (fridgeActive && fridgeIngredients.length) {
      const ing = (r.ingredients || '').toLowerCase();
      if (!fridgeIngredients.some(fi => ing.includes(fi.toLowerCase()))) return false;
    }

    return true;
  }).sort((a, b) => {
    if (a.fav !== b.fav) return b.fav - a.fav;
    if (a.source !== b.source) return a.source === 'user' ? -1 : 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

// ───────────────────────────────────────────────────────────────────
//  RENDER GRID
// ───────────────────────────────────────────────────────────────────
function renderGrid() {
  const grid     = document.getElementById('recipeGrid');
  if (!grid) return;
  const filtered = getFiltered();

  if (!filtered.length) {
    grid.innerHTML = `<div class="recipe-empty"><div class="empty-icon">🍽️</div><p>Aucune recette trouvée.<br>Cliquez sur <strong>+</strong> pour en ajouter une !</p></div>`;
    updateStats();
    return;
  }

  grid.innerHTML = filtered.map((r, i) => {
    const style    = getStyle(r);
    const tagBadges = r.tags.slice(0, 2).map(t => BADGE_HTML[t] || '').join('');
    const isBuiltin = r.source === 'builtin';
    const badges    = isBuiltin ? AI_BADGE + tagBadges : tagBadges;
    const inDay    = dailyMeals.some(m => m.id === r.id);

    const photoHtml = r.photo
      ? `<img class="card-photo" src="${r.photo}" alt="photo">`
      : '';

    const editBtn = isBuiltin
      ? `<button class="rc-btn" onclick="event.stopPropagation();copyAndEdit('${r.id}')">📋 COPIER</button>`
      : `<button class="rc-btn" onclick="event.stopPropagation();openEdit('${r.id}')">✏️ MODIFIER</button>`;
    const delBtn = isBuiltin ? '' :
      `<button class="rc-btn danger" onclick="event.stopPropagation();deleteRecipe('${r.id}')">🗑</button>`;
    const todayBtn =
      `<button class="rc-btn today-btn ${inDay?'added':''}" onclick="event.stopPropagation();addToDay('${r.id}')" title="Ajouter au repas du jour">📊</button>`;
    const favBtn =
      `<button class="rc-btn fav ${r.fav?'active':''}" onclick="event.stopPropagation();toggleFav('${r.id}')">${r.fav?'⭐':'☆'}</button>`;

    return `
    <div class="recipe-card"
         style="--card-bg-gradient:${style.gradient};--card-glow-color:${style.glow};--card-accent:${style.accent};animation-delay:${i*.05}s"
         onclick="openDetail('${r.id}')">
      <div class="recipe-card-emoji" style="background:${style.gradient}">
        ${photoHtml}
        <span class="emoji-text">${r.photo ? '' : (r.emoji||'🍽️')}</span>
        <div class="recipe-card-badges">${badges}</div>

      </div>
      <div class="recipe-card-body">
        <div class="recipe-card-name">${h(r.name)}</div>
        <div class="recipe-card-desc">${h(r.desc||'')}</div>
        <div class="recipe-macros">
          ${r.kcal?`<div class="macro-pill kcal"><span class="macro-val">${r.kcal}</span><span class="macro-label">kcal</span></div>`:''}
          ${r.prot?`<div class="macro-pill prot"><span class="macro-val">${r.prot}g</span><span class="macro-label">prot</span></div>`:''}
          ${r.time?`<div class="macro-pill time"><span class="macro-val">${h(r.time)}</span><span class="macro-label">prep</span></div>`:''}
        </div>
        ${r.rating?`<div class="recipe-card-rating">${starsHtml(r.rating)}</div>`:''}
        <div class="recipe-card-actions">${editBtn}${delBtn}${todayBtn}${favBtn}</div>
      </div>
    </div>`;
  }).join('');
  updateStats();
}

function updateStats() {
  const all = allRecipes();
  document.getElementById('stat-total').textContent   = all.length;
  document.getElementById('stat-protein').textContent = all.filter(r=>r.tags.includes('proteine')).length;
  document.getElementById('stat-lowcal').textContent  = all.filter(r=>r.tags.includes('lowcal')).length;
  document.getElementById('stat-fav').textContent     = all.filter(r=>r.fav).length;
}

// ───────────────────────────────────────────────────────────────────
//  MODULE A — DAILY MACRO TRACKER
// ───────────────────────────────────────────────────────────────────
function addToDay(id) {
  const r = allRecipes().find(x => x.id === id);
  if (!r) return;
  const existing = dailyMeals.find(m => m.id === id);
  if (existing) {
    existing.portions = (existing.portions || 1) + 1;
    showToast(`📊 +1 portion de ${r.name}`);
  } else {
    dailyMeals.push({ id, portions: 1, date: todayStr() });
    showToast(`📊 ${r.name} ajouté au repas du jour`);
  }
  saveDailyMeals();
  renderDailyTracker();
  renderMiniPanel();
  renderGrid();
}

function removeFromDay(id) {
  dailyMeals = dailyMeals.filter(m => m.id !== id);
  saveDailyMeals();
  renderDailyTracker();
  renderMiniPanel();
  renderGrid();
}

function clearDailyMeals() {
  dailyMeals = [];
  saveDailyMeals();
  renderDailyTracker();
  renderMiniPanel();
  renderGrid();
  showToast('🗑 Journée vidée');
}

function toggleDailyTracker() {
  const body = document.getElementById('trackerBody');
  const icon = document.getElementById('trackerToggleIcon');
  const open = body.classList.toggle('open');
  icon.classList.toggle('open', open);
}

function renderDailyTracker() {
  const totals = { kcal:0, prot:0, gluc:0, lip:0 };
  const recipes = allRecipes();

  dailyMeals.forEach(m => {
    const r = recipes.find(x => x.id === m.id);
    if (!r) return;
    const p = m.portions || 1;
    totals.kcal += (r.kcal || 0) * p;
    totals.prot += (r.prot || 0) * p;
    totals.gluc += (r.gluc || 0) * p;
    totals.lip  += (r.lip  || 0) * p;
  });

  // Summary in header
  document.getElementById('dtSummary').textContent =
    `${Math.round(totals.kcal)} kcal · ${Math.round(totals.prot)}g prot`;

  // Goal bars
  const pct = (v, g) => Math.min(100, g > 0 ? (v / g) * 100 : 0);
  const over = (v, g) => v > g;

  const setBar = (key, val, goal, unit='') => {
    const fill = document.getElementById(`tg-${key}-fill`);
    const num  = document.getElementById(`tg-${key}-num`);
    if (!fill || !num) return;
    fill.style.width = pct(val, goal) + '%';
    fill.style.opacity = over(val, goal) ? '1' : '0.8';
    num.textContent = `${Math.round(val)}${unit} / ${goal}${unit}`;
    num.style.color = over(val, goal) ? '#ff4d6d' : '';
  };
  setBar('kcal', totals.kcal, dailyGoals.kcal);
  setBar('prot', totals.prot, dailyGoals.prot, 'g');
  setBar('gluc', totals.gluc, dailyGoals.gluc, 'g');
  setBar('lip',  totals.lip,  dailyGoals.lip,  'g');

  // Meals list
  const list = document.getElementById('trackerMealsList');
  if (!list) return;
  if (!dailyMeals.length) {
    list.innerHTML = '<div class="tracker-empty-day">Aucun repas ajouté aujourd\'hui.<br>Cliquez sur 📊 sur une recette.</div>';
    return;
  }
  list.innerHTML = dailyMeals.map(m => {
    const r = recipes.find(x => x.id === m.id);
    if (!r) return '';
    const p = m.portions || 1;
    const k = Math.round((r.kcal||0)*p);
    const pt= Math.round((r.prot||0)*p);
    return `
    <div class="tracker-meal-item">
      <span class="tracker-meal-emoji">${r.emoji||'🍽️'}</span>
      <div class="tracker-meal-info">
        <div class="tracker-meal-name">${h(r.name)} ${p>1?`<span style="color:var(--neon-blue);font-size:.65rem;">×${p}</span>`:''}</div>
        <div class="tracker-meal-macros">${k} kcal · ${pt}g prot</div>
      </div>
      <button class="tracker-meal-remove" onclick="removeFromDay('${m.id}')" title="Retirer">✕</button>
    </div>`;
  }).join('');
}

// ───────────────────────────────────────────────────────────────────
//  MINI MEAL PANEL
// ───────────────────────────────────────────────────────────────────
function renderMiniPanel() {
  const panel  = document.getElementById('miniMealPanel');
  if (!panel) return;

  const hasItems = dailyMeals.length > 0;
  panel.classList.toggle('visible', hasItems);
  if (!hasItems) return;

  const recipes = allRecipes();
  const totals  = { kcal:0, prot:0, gluc:0, lip:0 };
  dailyMeals.forEach(m => {
    const r = recipes.find(x => x.id === m.id);
    if (!r) return;
    const p = m.portions || 1;
    totals.kcal += (r.kcal||0)*p; totals.prot += (r.prot||0)*p;
    totals.gluc += (r.gluc||0)*p; totals.lip  += (r.lip ||0)*p;
  });

  // Badge count
  document.getElementById('mmpBadge').textContent = dailyMeals.reduce((s,m)=>s+(m.portions||1),0);

  // Footer totals
  document.getElementById('mmp-kcal').textContent = Math.round(totals.kcal);
  document.getElementById('mmp-prot').textContent = Math.round(totals.prot)+'g';
  document.getElementById('mmp-gluc').textContent = Math.round(totals.gluc)+'g';
  document.getElementById('mmp-lip').textContent  = Math.round(totals.lip)+'g';

  // Items list
  document.getElementById('mmpItems').innerHTML = dailyMeals.map(m => {
    const r = recipes.find(x => x.id === m.id);
    if (!r) return '';
    const p = m.portions || 1;
    return `
      <div class="mmp-item">
        <span class="mmp-emoji">${r.emoji||'🍽️'}</span>
        <div class="mmp-info">
          <div class="mmp-name">${h(r.name)}</div>
          <div class="mmp-macros">${Math.round((r.kcal||0)*p)} kcal · ${Math.round((r.prot||0)*p)}g prot</div>
        </div>
        <div class="mmp-portions">
          <button class="mmp-port-btn" onclick="adjustPortionInPanel('${m.id}',-1)">−</button>
          <span class="mmp-port-num">${p}</span>
          <button class="mmp-port-btn" onclick="adjustPortionInPanel('${m.id}',1)">+</button>
        </div>
      </div>`;
  }).join('');
}

function adjustPortionInPanel(id, delta) {
  const m = dailyMeals.find(x => x.id === id);
  if (!m) return;
  m.portions = Math.max(1, (m.portions||1) + delta);
  saveDailyMeals();
  renderDailyTracker();
  renderMiniPanel();
  renderGrid();
}

function openGoalsModal() {
  document.getElementById('goalKcal').value = dailyGoals.kcal;
  document.getElementById('goalProt').value = dailyGoals.prot;
  document.getElementById('goalGluc').value = dailyGoals.gluc;
  document.getElementById('goalLip').value  = dailyGoals.lip;
  openModal('goalsModal');
}
function closeGoalsModal() { closeModal('goalsModal'); }
function saveGoals() {
  dailyGoals = {
    kcal: parseInt(document.getElementById('goalKcal').value) || 2500,
    prot: parseInt(document.getElementById('goalProt').value) || 180,
    gluc: parseInt(document.getElementById('goalGluc').value) || 250,
    lip:  parseInt(document.getElementById('goalLip').value)  || 70,
  };
  saveGoals_();
  closeGoalsModal();
  renderDailyTracker();
  showToast('✓ Objectifs mis à jour');
}

// ───────────────────────────────────────────────────────────────────
//  MODULE B — PORTION MULTIPLIER (detail modal)
// ───────────────────────────────────────────────────────────────────
function renderPortionMult(recipe) {
  const el = document.getElementById('detailPortionMult');
  if (!el) return;
  currentPortions = 1;
  el.innerHTML = `
    <div class="portion-mult-label">
      <span>MULTIPLIER LES PORTIONS</span>
      <span class="portion-mult-val" id="portionDisplay">×1</span>
    </div>
    <input type="range" class="portion-range" id="portionSlider" min="0.5" max="5" step="0.5" value="1">
    <div class="portion-ticks">
      <span>×½</span><span>×1</span><span>×1.5</span><span>×2</span><span>×2.5</span><span>×3</span><span>×3.5</span><span>×4</span><span>×4.5</span><span>×5</span>
    </div>`;
  document.getElementById('portionSlider').addEventListener('input', function() {
    currentPortions = parseFloat(this.value);
    document.getElementById('portionDisplay').textContent = `×${currentPortions}`;
    updateDetailMacros(recipe);
  });
}

function updateDetailMacros(r) {
  const p = currentPortions;
  document.getElementById('detailMacros').innerHTML = `
    <div class="detail-macro-box dm-kcal">
      <span class="dm-val">${Math.round((r.kcal||0)*p)}</span><span class="dm-label">KCAL</span>
    </div>
    <div class="detail-macro-box dm-prot">
      <span class="dm-val">${Math.round((r.prot||0)*p)}g</span><span class="dm-label">PROTÉINES</span>
    </div>
    <div class="detail-macro-box dm-gluc">
      <span class="dm-val">${r.gluc!==undefined?Math.round(r.gluc*p)+'g':'—'}</span><span class="dm-label">GLUCIDES</span>
    </div>
    <div class="detail-macro-box dm-lip">
      <span class="dm-val">${r.lip!==undefined?Math.round(r.lip*p)+'g':'—'}</span><span class="dm-label">LIPIDES</span>
    </div>`;
  const portLabel = document.getElementById('portionDisplay');
  if (portLabel) portLabel.textContent = `×${p}`;
}

// ───────────────────────────────────────────────────────────────────
//  MODULE C — NOTES & RATING
// ───────────────────────────────────────────────────────────────────
function setRating(id, n) {
  if (!recipeMeta[id]) recipeMeta[id] = { rating: 0, note: '' };
  const current = recipeMeta[id].rating;
  // Click same star again = remove rating
  recipeMeta[id].rating = (current === n) ? 0 : n;
  saveMeta();
  // Re-render stars in the detail body
  const starRow = document.getElementById(`starRow_${id}`);
  if (starRow) starRow.innerHTML = starsHtml(recipeMeta[id].rating, true, id);
  renderGrid();
}

function saveNote(id, text) {
  if (!recipeMeta[id]) recipeMeta[id] = { rating: 0, note: '' };
  recipeMeta[id].note = text;
  saveMeta();
}

function getMeta(id) {
  return recipeMeta[id] || { rating: 0, note: '' };
}

// ───────────────────────────────────────────────────────────────────
//  MODULE D — MACRO AUTO-CALCULATOR
// ───────────────────────────────────────────────────────────────────
const UNIT_G = {
  'g': 1, 'gramme': 1, 'grammes': 1,
};
const UNIT_ML = {
  'ml': 1, 'cl': 10, 'l': 1000,
};
const CS_WEIGHT = 15;   // cuillère à soupe en grammes
const CC_WEIGHT = 5;    // cuillère à café en grammes

function findFood(nameStr) {
  if (!window.FOODS_DB) return null;
  const n = nameStr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return window.FOODS_DB.find(f => {
    const fn = f.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (n.includes(fn) || fn.includes(n)) return true;
    return (f.aliases || []).some(a => {
      const an = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return n.includes(an) || an.includes(n);
    });
  }) || null;
}

function parseLine(line) {
  /* Returns { grams, foodName } or null */
  const s = line.trim().toLowerCase();
  if (!s || s.startsWith('#')) return null;

  let m;

  // "200g blanc de poulet" or "200 g poulet"
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:grammes?|g)\s+(.+)$/);
  if (m) return { grams: parseFloat(m[1].replace(',','.')), foodName: m[2] };

  // "250ml lait"
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:ml|cl|l)\s+(.+)$/);
  if (m) {
    const unit = m[0].match(/ml|cl|l/)?.[0] || 'ml';
    const mult = { ml:1, cl:10, l:1000 }[unit] || 1;
    return { grams: parseFloat(m[1].replace(',','.')) * mult, foodName: m[2] };
  }

  // "1 c.s. huile d'olive" or "2 c.c. miel"
  m = s.match(/^(\d+(?:[.,]\d+)?)\s+c\.?s\.?\s+(.+)$/);
  if (m) return { grams: parseFloat(m[1]) * CS_WEIGHT, foodName: m[2] };
  m = s.match(/^(\d+(?:[.,]\d+)?)\s+c\.?c\.?\s+(.+)$/);
  if (m) return { grams: parseFloat(m[1]) * CC_WEIGHT, foodName: m[2] };

  // "1 scoop whey" → 30g
  m = s.match(/^(\d+(?:[.,]\d+)?)\s+scoop\s+(.+)$/);
  if (m) return { grams: parseFloat(m[1]) * 30, foodName: m[2] };

  // "1/2 avocat"
  m = s.match(/^(\d+)\/(\d+)\s+(.+)$/);
  if (m) {
    const frac = parseFloat(m[1]) / parseFloat(m[2]);
    const itemW = guessItemWeight(m[3]);
    return { grams: frac * itemW, foodName: m[3] };
  }

  // "2 oeufs" or "3 bananes"
  m = s.match(/^(\d+(?:[.,]\d+)?)\s+(\w.+)$/);
  if (m) {
    const count = parseFloat(m[1].replace(',','.'));
    const itemW = guessItemWeight(m[2]);
    return { grams: count * itemW, foodName: m[2] };
  }

  return null;
}

function guessItemWeight(name) {
  if (!window.FOODS_ITEM_WEIGHTS) return 100;
  const n = name.toLowerCase();
  for (const [k, w] of Object.entries(window.FOODS_ITEM_WEIGHTS)) {
    if (n.includes(k)) return w;
  }
  return 100;
}

function parseMacrosFromIngredients(text, portions = 1) {
  const lines    = text.split('\n').filter(l => l.trim());
  const totals   = { kcal:0, prot:0, gluc:0, lip:0 };
  const breakdown = [];

  lines.forEach(line => {
    const parsed = parseLine(line);
    if (!parsed) { breakdown.push({ line, matched: false }); return; }

    const food = findFood(parsed.foodName);
    if (!food) { breakdown.push({ line, matched: false }); return; }

    const ratio = parsed.grams / 100;
    totals.kcal += food.kcal * ratio;
    totals.prot += food.prot * ratio;
    totals.gluc += food.gluc * ratio;
    totals.lip  += food.lip  * ratio;
    breakdown.push({ line, matched: true, food: food.name, grams: parsed.grams,
      added: { kcal: Math.round(food.kcal*ratio), prot: Math.round(food.prot*ratio) } });
  });

  const perPortion = portions > 0 ? portions : 1;
  return {
    totals: {
      kcal: Math.round(totals.kcal / perPortion),
      prot: Math.round(totals.prot / perPortion),
      gluc: Math.round(totals.gluc / perPortion),
      lip:  Math.round(totals.lip  / perPortion),
    },
    breakdown,
  };
}

function runMacroCalc() {
  const text     = document.getElementById('fIngredients').value;
  const portions = parseInt(document.getElementById('fPortions').value) || 1;
  const panel    = document.getElementById('macrCalcPanel');
  const resGrid  = document.getElementById('calcResultGrid');
  const bd       = document.getElementById('calcBreakdown');

  if (!text.trim()) { showToast('⚠ Ajoutez des ingrédients pour calculer.'); return; }

  const result = parseMacrosFromIngredients(text, portions);
  calcResult   = result.totals;
  panel.classList.add('visible');

  resGrid.innerHTML = `
    <div class="calc-result-item cri-kcal"><span class="crv">${result.totals.kcal}</span><span class="crl">kcal</span></div>
    <div class="calc-result-item cri-prot"><span class="crv">${result.totals.prot}g</span><span class="crl">prot</span></div>
    <div class="calc-result-item cri-gluc"><span class="crv">${result.totals.gluc}g</span><span class="crl">gluc</span></div>
    <div class="calc-result-item cri-lip"><span class="crv">${result.totals.lip}g</span><span class="crl">lip</span></div>`;

  bd.innerHTML = result.breakdown.map(b =>
    b.matched
      ? `<span class="cb-match">✓ ${h(b.food)}</span> (${b.grams}g) → ${b.added.kcal} kcal, ${b.added.prot}g prot<br>`
      : `<span class="cb-nomatch">✗ ${h(b.line)}</span> — ingrédient non reconnu<br>`
  ).join('');
}

function applyCalculatedMacros() {
  if (!calcResult) return;
  document.getElementById('fKcal').value = calcResult.kcal;
  document.getElementById('fProt').value = calcResult.prot;
  document.getElementById('fGluc').value = calcResult.gluc;
  document.getElementById('fLip').value  = calcResult.lip;
  showToast('✓ Macros appliquées !');
  document.getElementById('macrCalcPanel').classList.remove('visible');
}

// ───────────────────────────────────────────────────────────────────
//  MODULE E — MODE FRIGO
// ───────────────────────────────────────────────────────────────────
function toggleFridgeModal() {
  if (fridgeActive) { clearFridgeMode(); return; }
  openModal('fridgeModal');
}

function closeFridgeModal() { closeModal('fridgeModal'); }

function applyFridgeMode() {
  const raw = document.getElementById('fridgeInput').value;
  fridgeIngredients = raw
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (!fridgeIngredients.length) { showToast('⚠ Saisissez au moins un ingrédient.'); return; }

  fridgeActive = true;
  closeFridgeModal();

  // UI update
  const chip = document.getElementById('fridgeChip');
  if (chip) chip.classList.add('active');

  const bar  = document.getElementById('fridgeActiveBar');
  const tags = document.getElementById('fridgeTags');
  if (bar) bar.classList.add('visible');
  if (tags) tags.innerHTML = fridgeIngredients.map(f => `<span class="fridge-tag">${h(f)}</span>`).join('');

  renderGrid();
  showToast(`🧊 Mode frigo actif — ${fridgeIngredients.length} ingrédient(s)`);
}

function clearFridgeMode() {
  fridgeActive    = false;
  fridgeIngredients = [];
  document.getElementById('fridgeChip')?.classList.remove('active');
  document.getElementById('fridgeActiveBar')?.classList.remove('visible');
  document.getElementById('fridgeInput').value = '';
  renderGrid();
  showToast('🧊 Mode frigo désactivé');
}

// ───────────────────────────────────────────────────────────────────
//  MODULE F — PHOTOS
// ───────────────────────────────────────────────────────────────────
function initPhotoUpload() {
  const input = document.getElementById('photoFileInput');
  if (!input) return;
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      resizeImage(ev.target.result, 800, 0.75, b64 => {
        currentPhoto = b64;
        const zone = document.getElementById('photoUploadZone');
        const img  = document.getElementById('photoPreviewImg');
        const ph   = document.getElementById('photoPlaceholder');
        if (img)  { img.src = b64; img.style.display = 'block'; }
        if (ph)   ph.style.display = 'none';
        if (zone) zone.classList.add('has-photo');
      });
    };
    reader.readAsDataURL(file);
  });
}

function removePhoto() {
  currentPhoto = null;
  const zone = document.getElementById('photoUploadZone');
  const img  = document.getElementById('photoPreviewImg');
  const ph   = document.getElementById('photoPlaceholder');
  const inp  = document.getElementById('photoFileInput');
  if (img)  { img.src = ''; img.style.display = 'none'; }
  if (ph)   ph.style.display = 'flex';
  if (zone) zone.classList.remove('has-photo');
  if (inp)  inp.value = '';
}

function resizeImage(dataUrl, maxWidth, quality, callback) {
  const img = new Image();
  img.onload = () => {
    const ratio  = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement('canvas');
    canvas.width  = img.width  * ratio;
    canvas.height = img.height * ratio;
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    callback(canvas.toDataURL('image/jpeg', quality));
  };
  img.src = dataUrl;
}

// ───────────────────────────────────────────────────────────────────
//  DETAIL MODAL
// ───────────────────────────────────────────────────────────────────
function openDetail(id) {
  const r = allRecipes().find(x => x.id === id);
  if (!r) return;
  detailRecipeId  = id;
  currentPortions = 1;
  const style = getStyle(r);
  const meta  = getMeta(id);

  // Photo area
  const photoArea = document.getElementById('detailPhotoArea');
  const photoImg  = document.getElementById('detailPhotoImg');
  if (r.photo) {
    photoImg.src = r.photo;
    photoArea.classList.add('visible');
  } else {
    photoArea.classList.remove('visible');
    photoImg.src = '';
  }

  // Header
  document.getElementById('detailHeader').innerHTML = `
    <div class="detail-emoji-big" style="background:${style.gradient};border-color:${style.accent}30">${r.photo ? '📷' : (r.emoji||'🍽️')}</div>
    <div class="detail-title-block">
      <div class="detail-title">${h(r.name)}</div>
      <div class="detail-category">
        ${isBuiltin ? AI_BADGE : ''}
        ${r.tags.map(t=>BADGE_HTML[t]||'').join(' ')}
      </div>
      <div style="margin-top:.5rem;font-family:var(--font-body);font-size:.75rem;color:var(--text-dim);">
        ${r.portions?`${r.portions} portion${r.portions>1?'s':''}`:''}
        ${r.time?` · ⏱ ${h(r.time)}`:''}
        ${r.source==='builtin'?' · <span style="color:rgba(255,255,255,.2);font-size:.65rem;">BUILT-IN</span>':''}
      </div>
    </div>`;

  // Portion multiplier
  renderPortionMult(r);

  // Macros
  updateDetailMacros(r);

  // Body: ingredients + instructions + rating + notes + actions
  const lines = (r.ingredients||'').split('\n').filter(l=>l.trim());
  const ingrHtml = lines.length
    ? lines.map(l=>`<div class="ingredient-item">${h(l)}</div>`).join('')
    : `<div style="color:var(--text-dim);font-size:.8rem;font-family:var(--font-body);">Aucun ingrédient.</div>`;

  const isBuiltin = r.source === 'builtin';
  const editBtn   = isBuiltin
    ? `<button class="rc-btn" style="flex:1;padding:12px;" onclick="closeDetailModal();copyAndEdit('${id}')">📋 COPIER & MODIFIER</button>`
    : `<button class="rc-btn" style="flex:1;padding:12px;" onclick="closeDetailModal();openEdit('${id}')">✏️ MODIFIER</button>`;

  document.getElementById('detailBody').innerHTML = `
    ${r.desc?`<p style="font-family:var(--font-body);font-size:.82rem;color:var(--text-secondary);margin-bottom:1.5rem;line-height:1.7;">${h(r.desc)}</p>`:''}
    <div class="detail-section-label">INGRÉDIENTS</div>
    <div class="detail-ingredients">${ingrHtml}</div>
    ${r.instructions?`<div class="detail-section-label">PRÉPARATION</div><div class="detail-instructions">${h(r.instructions)}</div>`:''}

    <div class="detail-section-label" style="margin-top:1.5rem;">ÉVALUATION PERSONNELLE</div>
    <div class="star-rating-widget" id="starRow_${id}">${starsHtml(meta.rating, true, id)}</div>
    <textarea class="recipe-note-area" id="noteArea_${id}" placeholder="Ajoutez vos notes personnelles..." onblur="saveNote('${id}', this.value)">${h(meta.note)}</textarea>

    <div style="display:flex;gap:10px;margin-top:2rem;">
      ${editBtn}
      <button class="rc-btn today-btn" style="padding:12px 16px;flex:0;" onclick="addToDay('${id}')" title="Ajouter au repas du jour">📊 +JOUR</button>
      <button class="rc-btn fav ${r.fav?'active':''}" style="padding:12px 14px;flex:0;font-size:1rem;" onclick="toggleFav('${id}');this.classList.toggle('active');this.textContent=favSet.has('${id}')?'⭐':'☆';" >${r.fav?'⭐':'☆'}</button>
    </div>`;

  document.getElementById('recipeDetailModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  document.getElementById('recipeDetailModal').classList.remove('open');
  document.body.style.overflow = '';
  detailRecipeId = null;
}

// ───────────────────────────────────────────────────────────────────
//  FORM MODAL — OPEN / CLOSE
// ───────────────────────────────────────────────────────────────────
function openFormModal(prefill = null) {
  editingId    = null;
  selectedEmoji = prefill?.emoji || '🍗';
  selectedTags  = prefill?.tags ? [...prefill.tags] : [];
  currentPhoto  = prefill?.photo || null;
  calcResult    = null;

  document.getElementById('formModalTitle').textContent = '🍳 NOUVELLE RECETTE';
  document.getElementById('fName').value         = prefill?.name         || '';
  document.getElementById('fKcal').value         = prefill?.kcal         || '';
  document.getElementById('fProt').value         = prefill?.prot         || '';
  document.getElementById('fGluc').value         = prefill?.gluc != null ? prefill.gluc : '';
  document.getElementById('fLip').value          = prefill?.lip  != null ? prefill.lip  : '';
  document.getElementById('fTime').value         = prefill?.time         || '';
  document.getElementById('fPortions').value     = prefill?.portions      || 1;
  document.getElementById('fDesc').value         = prefill?.desc         || '';
  document.getElementById('fIngredients').value  = prefill?.ingredients  || '';
  document.getElementById('fInstructions').value = prefill?.instructions || '';
  document.getElementById('macrCalcPanel').classList.remove('visible');

  // Photo preview
  const zone = document.getElementById('photoUploadZone');
  const img  = document.getElementById('photoPreviewImg');
  const ph   = document.getElementById('photoPlaceholder');
  if (currentPhoto) {
    img.src = currentPhoto; img.style.display = 'block';
    ph.style.display = 'none'; zone.classList.add('has-photo');
  } else {
    img.src = ''; img.style.display = 'none';
    ph.style.display = 'flex'; zone.classList.remove('has-photo');
  }
  const inp = document.getElementById('photoFileInput'); if (inp) inp.value = '';

  refreshEmojiPicker(); refreshTagPicker();
  openModal('recipeFormModal');
}

function openEdit(id) {
  const r = userRecipes.find(x => x.id === id);
  if (!r) return;
  editingId = id;
  openFormModal(r);
  document.getElementById('formModalTitle').textContent = '✏️ MODIFIER LA RECETTE';
}

function copyAndEdit(id) {
  const r = allRecipes().find(x => x.id === id);
  if (!r) return;
  openFormModal({ ...r, name: r.name + ' (copie)', source: 'user', photo: null });
}

function closeFormModal() { closeModal('recipeFormModal'); }

function refreshEmojiPicker() {
  document.querySelectorAll('.emoji-opt').forEach(el =>
    el.classList.toggle('selected', el.dataset.emoji === selectedEmoji));
}
function refreshTagPicker() {
  document.querySelectorAll('.tag-check').forEach(el =>
    el.classList.toggle('checked', selectedTags.includes(el.dataset.tag)));
}

// ───────────────────────────────────────────────────────────────────
//  SAVE USER RECIPE
// ───────────────────────────────────────────────────────────────────
function saveRecipe() {
  const name = document.getElementById('fName').value.trim();
  if (!name) { showToast('⚠ Le nom est requis.'); return; }

  const recipe = {
    id:           editingId || `user_${Date.now()}`,
    name,
    emoji:        selectedEmoji,
    tags:         [...selectedTags],
    kcal:         parseInt(document.getElementById('fKcal').value)     || 0,
    prot:         parseInt(document.getElementById('fProt').value)     || 0,
    gluc:         parseInt(document.getElementById('fGluc').value)     || 0,
    lip:          parseInt(document.getElementById('fLip').value)      || 0,
    time:         document.getElementById('fTime').value.trim(),
    portions:     parseInt(document.getElementById('fPortions').value) || 1,
    desc:         document.getElementById('fDesc').value.trim(),
    ingredients:  document.getElementById('fIngredients').value.trim(),
    instructions: document.getElementById('fInstructions').value.trim(),
    photo:        currentPhoto || null,
    source:       'user',
    createdAt:    editingId
                    ? (userRecipes.find(r=>r.id===editingId)?.createdAt || Date.now())
                    : Date.now(),
  };

  if (editingId) {
    userRecipes = userRecipes.map(r => r.id === editingId ? recipe : r);
    showToast('✓ Recette mise à jour !');
  } else {
    userRecipes.unshift(recipe);
    showToast('✓ Recette ajoutée !');
  }

  saveUserRecipes();
  closeFormModal();
  renderGrid();
}

// ───────────────────────────────────────────────────────────────────
//  DELETE & FAVOURITES
// ───────────────────────────────────────────────────────────────────
function deleteRecipe(id) {
  if (!confirm('Supprimer cette recette définitivement ?')) return;
  userRecipes = userRecipes.filter(r => r.id !== id);
  saveUserRecipes();
  favSet.delete(id); saveFavs();
  dailyMeals = dailyMeals.filter(m => m.id !== id); saveDailyMeals();
  renderGrid();
  renderDailyTracker();
  showToast('🗑 Recette supprimée.');
}

function toggleFav(id) {
  favSet.has(id) ? favSet.delete(id) : favSet.add(id);
  saveFavs();
  renderGrid();
}

// ───────────────────────────────────────────────────────────────────
//  MODAL HELPERS
// ───────────────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open');    document.body.style.overflow='hidden'; }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); document.body.style.overflow=''; }

// ───────────────────────────────────────────────────────────────────
//  TOAST
// ───────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('recipeToast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ───────────────────────────────────────────────────────────────────
//  INIT
// ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Load all data
  await loadBuiltinRecipes();
  loadUserRecipes();
  loadFavs();
  loadMeta();
  loadGoals();
  loadDailyMeals();

  // First render
  renderGrid();
  renderDailyTracker();
  renderMiniPanel();
  initPhotoUpload();

  // FAB
  document.getElementById('recipeAddFab').addEventListener('click', () => openFormModal());

  // Modal backdrop clicks
  ['recipeDetailModal','recipeFormModal','fridgeModal','goalsModal'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', function(e) {
      if (e.target === this) {
        if (id === 'recipeDetailModal') closeDetailModal();
        else closeModal(id);
      }
    });
  });

  // ESC
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeDetailModal();
    ['recipeFormModal','fridgeModal','goalsModal'].forEach(closeModal);
  });

  // Filter chips
  document.querySelectorAll('.recipe-chip:not(.fridge-chip)').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.recipe-chip:not(.fridge-chip)').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      renderGrid();
    });
  });

  // Search
  document.getElementById('recipeSearch').addEventListener('input', function() {
    activeSearch = this.value;
    renderGrid();
  });

  // Emoji picker
  document.getElementById('emojiPicker').addEventListener('click', e => {
    const opt = e.target.closest('.emoji-opt');
    if (!opt) return;
    selectedEmoji = opt.dataset.emoji;
    refreshEmojiPicker();
  });

  // Tag picker
  document.getElementById('tagPicker').addEventListener('click', e => {
    const tag = e.target.closest('.tag-check');
    if (!tag) return;
    const t = tag.dataset.tag;
    selectedTags.includes(t) ? (selectedTags = selectedTags.filter(x=>x!==t)) : selectedTags.push(t);
    refreshTagPicker();
  });
});
