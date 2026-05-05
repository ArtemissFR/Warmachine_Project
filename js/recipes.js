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
window.applyCalculatedMacros = () => applyCalculatedMacros();
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

function toggleFav(id) {
  if (favSet.has(id)) favSet.delete(id);
  else favSet.add(id);
  saveFavs();
  renderGrid();
  // If detail modal is open, update fav button state
  const favBtn = document.querySelector(`#recipeDetailModal .rc-btn.fav`);
  const isFav = favSet.has(id);
  if (favBtn && document.getElementById('recipeDetailModal')?.classList.contains('open')) {
    favBtn.classList.toggle('active', isFav);
    favBtn.textContent = isFav ? '⭐' : '☆';
  }
}

// ───────────────────────────────────────────────────────────────────
//  ADD / EDIT SYSTEM
// ───────────────────────────────────────────────────────────────────
function openFormModal(prefill = null) {
  editingId = prefill?.id || null;
  selectedEmoji = prefill?.emoji || '🍗';
  selectedTags = prefill?.tags ? [...prefill.tags] : [];
  currentPhoto = prefill?.photo || null;

  document.getElementById('fName').value = prefill?.name || '';
  document.getElementById('fKcal').value = prefill?.kcal || '';
  document.getElementById('fProt').value = prefill?.prot || '';
  document.getElementById('fGluc').value = prefill?.gluc || '';
  document.getElementById('fLip').value = prefill?.lip || '';
  document.getElementById('fDesc').value = prefill?.desc || '';
  document.getElementById('fTime').value = prefill?.time || '';
  document.getElementById('fPortions').value = prefill?.portions || '1';
  document.getElementById('fIngredients').value = prefill?.ingredients || '';
  document.getElementById('fInstructions').value = prefill?.instructions || '';

  // Emoji
  document.querySelectorAll('.emoji-opt').forEach(o => {
    o.classList.toggle('selected', o.dataset.emoji === selectedEmoji);
  });

  // Tags
  document.querySelectorAll('.tag-check').forEach(o => {
    o.classList.toggle('checked', selectedTags.includes(o.dataset.tag));
  });

  // Photo
  const zone = document.getElementById('photoUploadZone');
  const preview = document.getElementById('photoPreviewImg');
  if (currentPhoto && zone && preview) {
    preview.src = currentPhoto;
    zone.classList.add('has-photo');
  } else if (zone) {
    zone.classList.remove('has-photo');
  }

  const title = document.getElementById('formModalTitle');
  if (title) title.textContent = editingId ? '✏️ MODIFIER LA RECETTE' : '🍳 NOUVELLE RECETTE';

  document.getElementById('macrCalcPanel')?.classList.remove('visible');
  openModal('recipeFormModal');
}
function openEdit(id) { const r = userRecipes.find(x => x.id === id); if(r) openFormModal(r); }
function copyAndEdit(id) { const r = allRecipes().find(x => x.id === id); if(r) openFormModal({...r, id: null}); }
function saveRecipe() {
  const name = document.getElementById('fName').value.trim();
  if(!name) return;
  const recipe = {
    id: editingId || `user_${Date.now()}`,
    name,
    emoji: selectedEmoji,
    tags: selectedTags,
    kcal: parseInt(document.getElementById('fKcal').value) || 0,
    prot: parseInt(document.getElementById('fProt').value) || 0,
    gluc: parseInt(document.getElementById('fGluc').value) || 0,
    lip:  parseInt(document.getElementById('fLip').value)  || 0,
    desc: document.getElementById('fDesc').value.trim(),
    time: document.getElementById('fTime').value.trim(),
    portions: parseInt(document.getElementById('fPortions').value) || 1,
    ingredients: document.getElementById('fIngredients').value.trim(),
    instructions: document.getElementById('fInstructions').value.trim(),
    photo: currentPhoto || null,
    source: 'user',
    createdAt: Date.now()
  };
  if(editingId) userRecipes = userRecipes.map(r => r.id === editingId ? recipe : r);
  else userRecipes.unshift(recipe);
  saveUserRecipes(); closeFormModal(); renderGrid();
  showToast(`✓ ${recipe.name} enregistrée`);
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
  detailRecipeId = id;
  currentPortions = 1;

  // Photo area
  const photoArea = document.getElementById('detailPhotoArea');
  const photoImg  = document.getElementById('detailPhotoImg');
  if (photoArea && photoImg) {
    if (r.photo) { photoImg.src = r.photo; photoArea.classList.add('visible'); }
    else photoArea.classList.remove('visible');
  }

  // Header
  const style = getStyle(r);
  const tagBadges = r.tags.slice(0,3).map(t => BADGE_HTML[t]||'').join('');
  const aiBadge = r.source === 'builtin' ? AI_BADGE : '';
  const headerEl = document.getElementById('detailHeader');
  if (headerEl) headerEl.innerHTML = `
    <div class="detail-emoji-big">${r.photo ? `<img src="${r.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:16px;">` : (r.emoji||'🍽️')}</div>
    <div class="detail-title-block">
      <div class="detail-title">${h(r.name)}</div>
      <div class="detail-category" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">${aiBadge}${tagBadges}</div>
      ${r.desc ? `<div style="font-family:var(--font-body);font-size:.78rem;color:var(--text-secondary);margin-top:.5rem;line-height:1.5;">${h(r.desc)}</div>` : ''}
    </div>`;

  // Portion multiplier
  const portionEl = document.getElementById('detailPortionMult');
  if (portionEl) portionEl.innerHTML = `
    <div class="portion-mult-label"><span>PORTIONS</span><span class="portion-mult-val" id="portionVal">×1</span></div>
    <input type="range" class="portion-range" id="portionRange" min="1" max="5" step="0.5" value="1">
    <div class="portion-ticks"><span>×1</span><span>×2</span><span>×3</span><span>×4</span><span>×5</span></div>`;

  const updateMacros = (p) => {
    const macrosEl = document.getElementById('detailMacros');
    if (!macrosEl) return;
    macrosEl.innerHTML = `
      <div class="detail-macro-box dm-kcal"><span class="dm-val">${Math.round((r.kcal||0)*p)}</span><span class="dm-label">kcal</span></div>
      <div class="detail-macro-box dm-prot"><span class="dm-val">${Math.round((r.prot||0)*p)}g</span><span class="dm-label">protéines</span></div>
      <div class="detail-macro-box dm-gluc"><span class="dm-val">${Math.round((r.gluc||0)*p)}g</span><span class="dm-label">glucides</span></div>
      <div class="detail-macro-box dm-lip"><span class="dm-val">${Math.round((r.lip||0)*p)}g</span><span class="dm-label">lipides</span></div>`;
  };
  updateMacros(1);

  document.getElementById('portionRange')?.addEventListener('input', e => {
    const p = parseFloat(e.target.value);
    currentPortions = p;
    document.getElementById('portionVal').textContent = `×${p}`;
    updateMacros(p);
  });

  // Body
  const bodyEl = document.getElementById('detailBody');
  if (bodyEl) {
    const ingLines = (r.ingredients||'').split('\n').filter(Boolean);
    const ingHtml = ingLines.length
      ? ingLines.map(l => `<div class="ingredient-item">${h(l)}</div>`).join('')
      : '<div class="ingredient-item" style="color:var(--text-dim);">Non renseigné</div>';

    const timing = r.time ? `<div style="display:flex;gap:8px;margin-bottom:1rem;"><div class="macro-pill time"><span class="macro-val">${h(r.time)}</span><span class="macro-label">prep</span></div>${r.portions>1?`<div class="macro-pill"><span class="macro-val">${r.portions}</span><span class="macro-label">portions</span></div>`:''}</div>` : '';

    const starsHtmlStr = starsHtml(r.rating, true, r.id);
    bodyEl.innerHTML = `
      ${timing}
      <div class="detail-section-label">INGRÉDIENTS</div>
      <div class="detail-ingredients">${ingHtml}</div>
      ${r.instructions ? `<div class="detail-section-label">PRÉPARATION</div><div class="detail-instructions">${h(r.instructions)}</div>` : ''}
      <div class="detail-section-label" style="margin-top:1.5rem;">NOTE PERSO</div>
      <div class="star-rating-widget" style="margin-bottom:.6rem;">${starsHtmlStr}</div>
      <textarea class="recipe-note-area" placeholder="Ajouter une note..." oninput="saveNote('${r.id}',this.value)">${h(r.note||'')}</textarea>
      <div style="display:flex;gap:8px;margin-top:1.2rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,.05);">
        ${r.source==='builtin'
          ? `<button class="rc-btn" onclick="copyAndEdit('${r.id}'); closeDetailModal();">📋 COPIER & ÉDITER</button>`
          : `<button class="rc-btn" onclick="openEdit('${r.id}'); closeDetailModal();">✏️ ÉDITER</button><button class="rc-btn danger" onclick="deleteRecipe('${r.id}'); closeDetailModal();">🗑</button>`}
        <button class="rc-btn today-btn" onclick="addToDay('${r.id}'); closeDetailModal();">📊 AJOUTER AU JOUR</button>
        <button class="rc-btn fav ${r.fav?'active':''}" onclick="toggleFav('${r.id}')">${r.fav?'⭐':'☆'}</button>
      </div>`;
  }

  openModal('recipeDetailModal');
}
function closeDetailModal() { closeModal('recipeDetailModal'); }

function removePhoto() {
  currentPhoto = null;
  const zone = document.getElementById('photoUploadZone');
  if (zone) zone.classList.remove('has-photo');
  const preview = document.getElementById('photoPreviewImg');
  if (preview) { preview.src = ''; }
}

// ───────────────────────────────────────────────────────────────────
//  MACRO CALCULATOR
// ───────────────────────────────────────────────────────────────────
function runMacroCalc() {
  const raw = document.getElementById('fIngredients')?.value || '';
  const lines = raw.split('\n').filter(Boolean);
  const panel = document.getElementById('macrCalcPanel');
  const resultGrid = document.getElementById('calcResultGrid');
  const breakdown = document.getElementById('calcBreakdown');
  if (!panel || !resultGrid || !breakdown) return;

  const foods = window.FOODS || [];
  let totals = { kcal:0, prot:0, gluc:0, lip:0 };
  let breakdownHtml = '';

  lines.forEach(line => {
    const match = line.match(/(\d+(?:[.,]\d+)?)\s*g?\s+(.+)/i);
    if (!match) { breakdownHtml += `<div class="cb-nomatch">${h(line)} — non reconnu</div>`; return; }
    const qty = parseFloat(match[1].replace(',', '.'));
    const name = match[2].trim().toLowerCase();
    const food = foods.find(f => name.includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(name));
    if (!food) { breakdownHtml += `<div class="cb-nomatch">${h(line)} — ingrédient inconnu</div>`; return; }
    const f = qty / 100;
    totals.kcal += (food.kcal||0) * f;
    totals.prot += (food.prot||0) * f;
    totals.gluc += (food.gluc||0) * f;
    totals.lip  += (food.lip||0)  * f;
    breakdownHtml += `<div class="cb-match">${Math.round(qty)}g ${food.name} → ${Math.round((food.kcal||0)*f)} kcal / ${Math.round((food.prot||0)*f)}g prot</div>`;
  });

  calcResult = { kcal: Math.round(totals.kcal), prot: Math.round(totals.prot), gluc: Math.round(totals.gluc), lip: Math.round(totals.lip) };

  resultGrid.innerHTML = `
    <div class="calc-result-item cri-kcal"><span class="crv">${calcResult.kcal}</span><span class="crl">kcal</span></div>
    <div class="calc-result-item cri-prot"><span class="crv">${calcResult.prot}g</span><span class="crl">prot</span></div>
    <div class="calc-result-item cri-gluc"><span class="crv">${calcResult.gluc}g</span><span class="crl">gluc</span></div>
    <div class="calc-result-item cri-lip"><span class="crv">${calcResult.lip}g</span><span class="crl">lip</span></div>`;
  breakdown.innerHTML = breakdownHtml || '<div style="color:var(--text-dim)">Aucun ingrédient reconnu.</div>';
  panel.classList.add('visible');
}

function applyCalculatedMacros() {
  if (!calcResult) return;
  document.getElementById('fKcal').value = calcResult.kcal;
  document.getElementById('fProt').value = calcResult.prot;
  document.getElementById('fGluc').value = calcResult.gluc;
  document.getElementById('fLip').value  = calcResult.lip;
  showToast('✓ Macros appliquées');
}

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

    // ── Emoji picker ──────────────────────────────────────────────
    document.querySelectorAll('.emoji-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.emoji-opt').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedEmoji = opt.dataset.emoji;
        });
    });

    // ── Tag picker ────────────────────────────────────────────────
    document.querySelectorAll('.tag-check').forEach(tag => {
        tag.addEventListener('click', () => {
            const t = tag.dataset.tag;
            tag.classList.toggle('checked');
            if (tag.classList.contains('checked')) {
                if (!selectedTags.includes(t)) selectedTags.push(t);
            } else {
                selectedTags = selectedTags.filter(x => x !== t);
            }
        });
    });

    // ── Photo upload ──────────────────────────────────────────────
    const photoInput = document.getElementById('photoFileInput');
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 800;
                    let w = img.width, h = img.height;
                    if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    currentPhoto = canvas.toDataURL('image/jpeg', 0.75);
                    const preview = document.getElementById('photoPreviewImg');
                    const zone = document.getElementById('photoUploadZone');
                    if (preview) preview.src = currentPhoto;
                    if (zone) zone.classList.add('has-photo');
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // ── Close modals on overlay click ─────────────────────────────
    document.querySelectorAll('.recipe-detail-modal, .recipe-form-modal').forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === m) m.classList.remove('open');
        });
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
