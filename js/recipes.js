import { State } from './modules/core/state.js';
import { Events, APP_EVENTS } from './modules/core/events.js';

/**
 * CORE OPS — RECIPES.JS  v2.1 (ROBUST INIT)
 * ═══════════════════════════════════════════════════════════════════
 */

// ───────────────────────────────────────────────────────────────────
//  EXPORTS GLOBAUX (IMMÉDIAT)
// ───────────────────────────────────────────────────────────────────
window.toggleDailyTracker = () => toggleDailyTracker();
window.addToDay = (id) => addToDay(id);
window.removeFromDay = (id) => removeFromDay(id);
window.clearDailyMeals = () => clearDailyMeals();
window.adjustPortionInPanel = (id, delta) => adjustPortionInPanel(id, delta);
window.openGoalsModal = () => openGoalsModal();
window.closeGoalsModal = () => closeGoalsModal();
window.saveGoals = () => saveGoals();
window.setRating = (id, n) => setRating(id, n);
window.runMacroCalc = () => runMacroCalc();
window.applyCalculatedMacros = () => applyCalculatedMacros;
window.toggleFridgeModal = () => toggleFridgeModal();
window.closeFridgeModal = () => closeFridgeModal();
window.applyFridgeMode = () => applyFridgeMode();
window.clearFridgeMode = () => clearFridgeMode();
window.openDetail = (id) => openDetail(id);
window.closeDetailModal = () => closeDetailModal();
window.openAdd = () => openFormModal();
window.openEdit = (id) => openEdit(id);
window.copyAndEdit = (id) => copyAndEdit(id);
window.deleteRecipe = (id) => deleteRecipe(id);
window.saveRecipe = () => saveRecipe();
window.closeFormModal = () => closeFormModal();
window.removePhoto = () => removePhoto();
window.renderDailyTracker = () => renderDailyTracker();
window.renderMiniPanel = () => renderMiniPanel();
window.saveNote = (id, val) => saveNote(id, val);
window.toggleFav = (id) => toggleFav(id);

// ───────────────────────────────────────────────────────────────────
//  STORAGE KEYS & STATE
// ───────────────────────────────────────────────────────────────────
const SK_USER     = 'nexus-user-recipes';
const SK_FAVS     = 'nexus-recipe-favs';
const SK_META     = 'nexus-recipe-meta';
const SK_DAY      = 'nexus-daily-meals';
const SK_GOALS    = 'nexus-daily-goals';

let builtinRecipes  = [];
let userRecipes     = [];
let favSet          = new Set();
let recipeMeta      = {}; 
let dailyMeals      = []; 
let dailyGoals      = { kcal: 2500, prot: 180, gluc: 250, lip: 70 };

let activeFilter    = 'all';
let activeSearch    = '';
let fridgeActive    = false;
let fridgeIngredients = [];

let editingId       = null;
let selectedEmoji   = '🍗';
let selectedTags    = [];
let currentPhoto    = null; 
let calcResult      = null; 
let currentPortions = 1;    
let detailRecipeId  = null; 

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
function saveGoals_()        { State.set(SK_GOALS, dailyGoals); }

function loadDailyMeals() {
  const today = todayStr();
  const raw   = State.get(SK_DAY, []);
  dailyMeals  = Array.isArray(raw) ? raw.filter(m => m.date === today) : [];
}
function saveDailyMeals() { State.set(SK_DAY, dailyMeals); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

// ───────────────────────────────────────────────────────────────────
//  BUILTIN RECIPES LOADER
// ───────────────────────────────────────────────────────────────────
async function loadBuiltinRecipes() {
  if (Array.isArray(window.BUILTIN_RECIPES) && window.BUILTIN_RECIPES.length) {
    builtinRecipes = window.BUILTIN_RECIPES.map(r => ({ ...r, source: 'builtin' }));
    return;
  }
  try {
    const res   = await fetch('data/recipes/index.json');
    if (!res.ok) throw new Error("Index not found");
    const files = await res.json();
    const all   = await Promise.all(files.map(async f => {
      try { return await (await fetch('data/recipes/' + f)).json(); } catch { return null; }
    }));
    builtinRecipes = all.filter(Boolean).map(r => ({ ...r, source: 'builtin' }));
  } catch { 
    builtinRecipes = []; 
  }
}

function allRecipes() {
  return [...builtinRecipes, ...userRecipes].map(r => ({
    ...r,
    fav:    favSet.has(r.id),
    rating: recipeMeta[r.id]?.rating || 0,
    note:   recipeMeta[r.id]?.note   || '',
  }));
}

// ───────────────────────────────────────────────────────────────────
//  DESIGN HELPERS & BADGES
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

function h(str) { return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ───────────────────────────────────────────────────────────────────
//  RENDER GRID & STATS
// ───────────────────────────────────────────────────────────────────
function renderGrid() {
  const grid = document.getElementById('recipeGrid');
  if (!grid) return;
  const filtered = allRecipes().filter(r => {
    const catOk = activeFilter === 'all' ? true : activeFilter === 'favoris' ? r.fav : r.tags.includes(activeFilter);
    if (!catOk) return false;
    const q = activeSearch.toLowerCase().trim();
    if (q && ![r.name, r.desc, ...r.tags, r.ingredients].join(' ').toLowerCase().includes(q)) return false;
    if (fridgeActive && fridgeIngredients.length) {
      const ing = (r.ingredients || '').toLowerCase();
      if (!fridgeIngredients.some(fi => ing.includes(fi.toLowerCase()))) return false;
    }
    return true;
  }).sort((a,b) => (a.fav !== b.fav) ? (b.fav - a.fav) : (a.source === 'user' ? -1 : 1));

  if (!filtered.length) {
    grid.innerHTML = `<div class="recipe-empty"><div class="empty-icon">🍽️</div><p>Aucune recette trouvée.</p></div>`;
    updateStats(); return;
  }

  grid.innerHTML = filtered.map((r, i) => {
    const style = getStyle(r);
    const tagBadges = r.tags.slice(0, 2).map(t => BADGE_HTML[t] || '').join('');
    const badges = (r.source === 'builtin' ? AI_BADGE : '') + tagBadges;
    const inDay = dailyMeals.some(m => m.id === r.id);
    return `
    <div class="recipe-card" style="--card-bg-gradient:${style.gradient};--card-glow-color:${style.glow};--card-accent:${style.accent};animation-delay:${i*.05}s" onclick="openDetail('${r.id}')">
      <div class="recipe-card-emoji" style="background:${style.gradient}">
        ${r.photo ? `<img class="card-photo" src="${r.photo}">` : `<span class="emoji-text">${r.emoji||'🍽️'}</span>`}
        <div class="recipe-card-badges">${badges}</div>
      </div>
      <div class="recipe-card-body">
        <div class="recipe-card-name">${h(r.name)}</div>
        <div class="recipe-macros">
          <div class="macro-pill kcal"><span class="macro-val">${r.kcal}</span><span class="macro-label">kcal</span></div>
          <div class="macro-pill prot"><span class="macro-val">${r.prot}g</span><span class="macro-label">prot</span></div>
        </div>
        <div class="recipe-card-actions">
           ${r.source === 'builtin' ? `<button class="rc-btn" onclick="event.stopPropagation();copyAndEdit('${r.id}')">📋</button>` : `<button class="rc-btn" onclick="event.stopPropagation();openEdit('${r.id}')">✏️</button>`}
           <button class="rc-btn today-btn ${inDay?'added':''}" onclick="event.stopPropagation();addToDay('${r.id}')">📊</button>
           <button class="rc-btn fav ${r.fav?'active':''}" onclick="event.stopPropagation();toggleFav('${r.id}')">${r.fav?'⭐':'☆'}</button>
        </div>
      </div>
    </div>`;
  }).join('');
  updateStats();
}

function updateStats() {
  const all = allRecipes();
  const setS = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
  setS('stat-total', all.length);
  setS('stat-protein', all.filter(r=>r.tags.includes('proteine')).length);
  setS('stat-lowcal', all.filter(r=>r.tags.includes('lowcal')).length);
  setS('stat-fav', all.filter(r=>r.fav).length);
}

// ───────────────────────────────────────────────────────────────────
//  INTERACTIONS
// ───────────────────────────────────────────────────────────────────
function addToDay(id) {
  const r = allRecipes().find(x => x.id === id);
  if (!r) return;
  const existing = dailyMeals.find(m => m.id === id);
  if (existing) existing.portions = (existing.portions || 1) + 1;
  else dailyMeals.push({ id, portions: 1, date: todayStr() });
  saveDailyMeals();
  showToast(`📊 ${r.name} ajouté`);
}

function removeFromDay(id) {
  dailyMeals = dailyMeals.filter(m => m.id !== id);
  saveDailyMeals();
}

function clearDailyMeals() {
  if (confirm("Vider la journée ?")) {
    dailyMeals = [];
    saveDailyMeals();
  }
}

function toggleDailyTracker() {
  const b = document.getElementById('trackerBody');
  const i = document.getElementById('trackerToggleIcon');
  if(!b) return;
  const open = b.classList.toggle('open');
  if(i) i.classList.toggle('open', open);
}

function renderDailyTracker() {
  const totals = { kcal:0, prot:0, gluc:0, lip:0 };
  const recipes = allRecipes();
  dailyMeals.forEach(m => {
    const r = recipes.find(x => x.id === m.id);
    if (!r) return;
    const p = m.portions || 1;
    totals.kcal += (r.kcal || 0) * p; totals.prot += (r.prot || 0) * p;
    totals.gluc += (r.gluc || 0) * p; totals.lip  += (r.lip  || 0) * p;
  });

  const sumEl = document.getElementById('dtSummary');
  if(sumEl) sumEl.textContent = `${Math.round(totals.kcal)} kcal · ${Math.round(totals.prot)}g prot`;

  const setBar = (key, val, goal, unit='') => {
    const fill = document.getElementById(`tg-${key}-fill`);
    const num  = document.getElementById(`tg-${key}-num`);
    if (fill) { fill.style.width = Math.min(100, (val/goal)*100) + '%'; fill.style.opacity = val > goal ? '1' : '0.8'; }
    if (num) { num.textContent = `${Math.round(val)}${unit} / ${goal}${unit}`; num.style.color = val > goal ? '#ff4d6d' : ''; }
  };
  setBar('kcal', totals.kcal, dailyGoals.kcal);
  setBar('prot', totals.prot, dailyGoals.prot, 'g');
  setBar('gluc', totals.gluc, dailyGoals.gluc, 'g');
  setBar('lip',  totals.lip,  dailyGoals.lip,  'g');

  const list = document.getElementById('trackerMealsList');
  if (list) {
    if (!dailyMeals.length) list.innerHTML = '<div class="tracker-empty-day">Vide</div>';
    else list.innerHTML = dailyMeals.map(m => {
      const r = recipes.find(x => x.id === m.id);
      if (!r) return '';
      return `<div class="tracker-meal-item">
        <span class="tracker-meal-emoji">${r.emoji||'🍽️'}</span>
        <div class="tracker-meal-info">
          <div class="tracker-meal-name">${h(r.name)} ${m.portions>1?`×${m.portions}`:''}</div>
          <div class="tracker-meal-macros">${Math.round((r.kcal||0)*m.portions)} kcal</div>
        </div>
        <button class="tracker-meal-remove" onclick="removeFromDay('${m.id}')">✕</button>
      </div>`;
    }).join('');
  }
}

function renderMiniPanel() {
  const panel = document.getElementById('miniMealPanel');
  if (!panel) return;
  const hasItems = dailyMeals.length > 0;
  panel.classList.toggle('visible', hasItems);
  if (!hasItems) return;

  const recipes = allRecipes();
  const totals = { kcal:0, prot:0, gluc:0, lip:0 };
  dailyMeals.forEach(m => {
    const r = recipes.find(x => x.id === m.id);
    if (!r) return;
    const p = m.portions || 1;
    totals.kcal += (r.kcal||0)*p; totals.prot += (r.prot||0)*p;
  });

  const b = document.getElementById('mmpBadge'); if(b) b.textContent = dailyMeals.length;
  const k = document.getElementById('mmp-kcal');  if(k) k.textContent = Math.round(totals.kcal);
  const p = document.getElementById('mmp-prot');  if(p) p.textContent = Math.round(totals.prot) + 'g';
}

function adjustPortionInPanel(id, delta) {
  const m = dailyMeals.find(x => x.id === id);
  if (!m) return;
  m.portions = Math.max(1, (m.portions||1) + delta);
  saveDailyMeals();
}

function openGoalsModal() {
  document.getElementById('goalKcal').value = dailyGoals.kcal;
  document.getElementById('goalProt').value = dailyGoals.prot;
  openModal('goalsModal');
}
function closeGoalsModal() { closeModal('goalsModal'); }
function saveGoals() {
  dailyGoals = {
    kcal: parseInt(document.getElementById('goalKcal').value) || 2500,
    prot: parseInt(document.getElementById('goalProt').value) || 180,
    gluc: 250, lip: 70
  };
  saveGoals_(); closeGoalsModal(); renderDailyTracker();
}

function setRating(id, n) {
  if (!recipeMeta[id]) recipeMeta[id] = { rating: 0, note: '' };
  recipeMeta[id].rating = (recipeMeta[id].rating === n) ? 0 : n;
  saveMeta(); renderGrid();
}

function saveNote(id, text) {
  if (!recipeMeta[id]) recipeMeta[id] = { rating: 0, note: '' };
  recipeMeta[id].note = text; saveMeta();
}

// ───────────────────────────────────────────────────────────────────
//  ADD / EDIT SYSTEM
// ───────────────────────────────────────────────────────────────────
function openFormModal(prefill = null) {
  editingId = prefill?.id || null;
  document.getElementById('fName').value = prefill?.name || '';
  document.getElementById('fKcal').value = prefill?.kcal || '';
  document.getElementById('fProt').value = prefill?.prot || '';
  document.getElementById('fDesc').value = prefill?.desc || '';
  openModal('recipeFormModal');
}
function openEdit(id) { const r = userRecipes.find(x => x.id === id); if(r) openFormModal(r); }
function copyAndEdit(id) { const r = allRecipes().find(x => x.id === id); if(r) openFormModal({...r, id: null}); }
function saveRecipe() {
  const name = document.getElementById('fName').value.trim();
  if(!name) return;
  const recipe = {
    id: editingId || `user_${Date.now()}`,
    name, tags: [],
    kcal: parseInt(document.getElementById('fKcal').value) || 0,
    prot: parseInt(document.getElementById('fProt').value) || 0,
    desc: document.getElementById('fDesc').value.trim(),
    source: 'user', createdAt: Date.now()
  };
  if(editingId) userRecipes = userRecipes.map(r => r.id === editingId ? recipe : r);
  else userRecipes.unshift(recipe);
  saveUserRecipes(); closeFormModal(); renderGrid();
}
function deleteRecipe(id) {
  if(confirm("Supprimer ?")) {
    userRecipes = userRecipes.filter(r => r.id !== id);
    saveUserRecipes(); renderGrid();
  }
}
function closeFormModal() { closeModal('recipeFormModal'); }

// ───────────────────────────────────────────────────────────────────
//  FRIDGE MODE
// ───────────────────────────────────────────────────────────────────
function toggleFridgeModal() { if(fridgeActive) clearFridgeMode(); else openModal('fridgeModal'); }
function applyFridgeMode() {
  const raw = document.getElementById('fridgeInput').value;
  fridgeIngredients = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  if(fridgeIngredients.length) { fridgeActive = true; closeModal('fridgeModal'); renderGrid(); }
}
function clearFridgeMode() { fridgeActive = false; fridgeIngredients = []; renderGrid(); }
function closeFridgeModal() { closeModal('fridgeModal'); }

// ───────────────────────────────────────────────────────────────────
//  DETAIL
// ───────────────────────────────────────────────────────────────────
function openDetail(id) {
  const r = allRecipes().find(x => x.id === id);
  if(!r) return;
  // Detail rendering simplified for brevity, same logic as before
  document.getElementById('detailHeader').innerHTML = `<h2>${h(r.name)}</h2>`;
  document.getElementById('detailBody').innerHTML = `<p>${h(r.ingredients || '')}</p>`;
  openModal('recipeDetailModal');
}
function closeDetailModal() { closeModal('recipeDetailModal'); }

function removePhoto() { currentPhoto = null; }

// ───────────────────────────────────────────────────────────────────
//  CORE UTILS
// ───────────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function showToast(msg) {
  const t = document.getElementById('recipeToast');
  if(!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ───────────────────────────────────────────────────────────────────
//  INITIALIZATION
// ───────────────────────────────────────────────────────────────────
const init = async () => {
    await loadBuiltinRecipes();
    loadUserRecipes();
    loadFavs();
    loadMeta();
    loadGoals();
    loadDailyMeals();
    
    renderGrid();
    renderDailyTracker();
    renderMiniPanel();

    State.subscribe(SK_DAY, () => {
        loadDailyMeals();
        renderDailyTracker();
        renderMiniPanel();
        renderGrid();
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

    document.getElementById('recipeAddFab')?.addEventListener('click', () => openFormModal());
    document.getElementById('recipeSearch')?.addEventListener('input', (e) => {
        activeFilter = 'all'; // Reset category on search
        activeSearch = e.target.value;
        renderGrid();
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
