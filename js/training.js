import { State } from './modules/core/state.js';
import { Events, APP_EVENTS } from './modules/core/events.js';
import { Biometrie } from './modules/analytics/biometry.js';

/* =========================================================
   WORKSPACE & PINNING SYSTEM
   ========================================================= */
let pinnedPanels = State.get('core-ops-pins', []);

function togglePin(panelId) {
  const index = pinnedPanels.indexOf(panelId);
  if (index === -1) {
    pinnedPanels.push(panelId);
  } else {
    pinnedPanels.splice(index, 1);
  }
  
  State.set('core-ops-pins', pinnedPanels);
  updatePinButtons();
  updateDashboard();
}

function updatePinButtons() {
  document.querySelectorAll('.pin-btn').forEach(btn => {
    const panelId = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
    if (pinnedPanels.includes(panelId)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function updateDashboard() {
  const dashGrid = document.getElementById('dashboardGrid');
  if(!dashGrid) return;
  
  dashGrid.innerHTML = '';
  
  if (pinnedPanels.length === 0) {
    dashGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color:var(--text-dim); font-size: 0.8rem;">Aucun module épinglé.</div>';
    return;
  }
  
  pinnedPanels.forEach(id => {
    const original = document.getElementById(id);
    if (original) {
      const clone = original.cloneNode(true);
      // Change IDs of cloned elements to avoid conflicts
      clone.querySelectorAll('[id]').forEach(el => {
        el.id = 'dash-' + el.id;
      });
      // Remove original pin btn from clone but maybe add a "remove" one?
      // No, keep it so user can unpin from dashboard too
      const pinBtn = clone.querySelector('.pin-btn');
      if (pinBtn) pinBtn.classList.add('active');
      
      dashGrid.appendChild(clone);
    }
  });
  
  // Re-initialize charts in dashboard if needed
  reinitDashboardCharts();
}

// Global instances for dashboard charts
let dashWChartInstance = null;
let dashPChartInstance = null;

function reinitDashboardCharts() {
  const perfs = State.get('nexus-perf-history', []);
  const weights = State.get('nexus-weight-history', []);
  
  // Weights Chart in Dashboard
  const dashWC = document.getElementById('dash-weightChart');
  if (dashWC) {
    if (dashWChartInstance) dashWChartInstance.destroy();
    
    const labels = weights.map(h => h.date);
    const data = weights.map(h => parseFloat(h.val));
    if (window.Chart) {
      dashWChartInstance = new Chart(dashWC, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Poids (kg)',
            data: data,
            borderColor: '#00f2fe',
            backgroundColor: 'rgba(0, 242, 254, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#00f2fe',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { display: false } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  }
  
  // Perf Chart in Dashboard
  const dashPC = document.getElementById('dash-perfChart');
  const dashSelect = document.getElementById('dash-chartExoSelect');
  if (dashPC && dashSelect && window.Chart) {
    const renderDashPerf = () => {
      const selectedExo = dashSelect.value.toLowerCase();
      const filtered = perfs.filter(p => p.exo.toLowerCase().includes(selectedExo));
      const labels = filtered.map(p => p.date);
      const data = filtered.map(p => parseFloat(p.weight));
      
      if (dashPChartInstance) dashPChartInstance.destroy();
      
      dashPChartInstance = new Chart(dashPC, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Poids soulevé (kg)',
            data: data,
            borderColor: '#b92b27',
            backgroundColor: 'rgba(185, 43, 39, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#b92b27',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { display: false } }
          },
          plugins: { legend: { display: false } }
        }
      });
    };
    
    dashSelect.onchange = renderDashPerf;
    renderDashPerf();
  }
  
  // Re-sync basic numerical stats in dashboard
  if (document.getElementById('dash-calEstimate')) 
    document.getElementById('dash-calEstimate').textContent = document.getElementById('calEstimate').textContent;
  if (document.getElementById('dash-totalVolume'))
    document.getElementById('dash-totalVolume').textContent = document.getElementById('totalVolume').textContent;
  
  // Kcal Progress in dashboard
  const currentK = parseInt(localStorage.getItem('nexus-kcal') || '0', 10);
  const limitK = parseInt(localStorage.getItem('nexus-kcal-limit') || '2500', 10);
  if (document.getElementById('dash-kcalCurrentText')) document.getElementById('dash-kcalCurrentText').textContent = currentK;
  if (document.getElementById('dash-kcalLimitText')) document.getElementById('dash-kcalLimitText').textContent = '/ ' + limitK;
  if (document.getElementById('dash-kcalBar')) {
    let percentage = Math.min((currentK / limitK) * 100, 100);
    document.getElementById('dash-kcalBar').style.width = percentage + '%';
    if(document.getElementById('dash-kcalPct')) document.getElementById('dash-kcalPct').textContent = Math.round(percentage) + '%';
  }

  // Rank and Streak in dashboard (if pinned)
  if (document.getElementById('dash-streakCount')) 
    document.getElementById('dash-streakCount').textContent = document.getElementById('streakCount').textContent;
  if (document.getElementById('dash-userRank')) {
    document.getElementById('dash-userRank').textContent = document.getElementById('userRank').textContent;
    document.getElementById('dash-userRank').className = document.getElementById('userRank').className;
  }
}

window.togglePin = togglePin;
/* =========================================================
   TABS NAVIGATION
   ========================================================= */
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active from all
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Add active to clicked
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-target');
    document.getElementById(targetId).classList.add('active');
  });
});

/* =========================================================
   MODALS MANAGEMENT
   ========================================================= */
function openModal(id) {
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Close on outside click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if(e.target === overlay) overlay.classList.remove('active');
  });
});



/* =========================================================
   ELITE LOGIC: 1RM, VOLUME, RANKS, QUOTES
   ========================================================= */


function triggerPR(exo, weight) {
  const note = document.getElementById('prNote');
  const text = document.getElementById('prText');
  if(!note || !text) return;
  text.textContent = `${exo.toUpperCase()} à ${weight}kg !`;
  note.classList.add('active');
  setTimeout(() => note.classList.remove('active'), 5000);
}

function updateEliteStats(perfs) {
  let totalVolume = 0;
  let weeklyVolume = 0;
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  perfs.forEach(p => {
    const vol = p.weight * p.sets * p.reps;
    totalVolume += vol;
    const [d, m, y] = p.date.split('/');
    const perfDate = new Date(y, m - 1, d);
    if (perfDate > oneWeekAgo) weeklyVolume += vol;
  });

  const today = getTodayString();
  const sessionVol = perfs.filter(p => p.date === today)
                          .reduce((acc, p) => acc + (p.weight * p.sets * p.reps), 0);
                          
  if(document.getElementById('totalVolume')) 
    document.getElementById('totalVolume').textContent = `${sessionVol.toLocaleString()} kg`;
  if(document.getElementById('calEstimate')) 
    document.getElementById('calEstimate').textContent = Math.round(sessionVol * 0.05);

  updateRankAndStreaks(totalVolume, perfs);
  updateBackgroundIntensity(weeklyVolume);
}

function updateRankAndStreaks(totalVol, perfs) {
  const uniqueDatesArr = [...new Set(perfs.map(p => p.date))];
  const trainingDays = uniqueDatesArr.length;
  const xp = Math.round(totalVol * 0.05 + trainingDays * 100);

  const rankEl = document.getElementById('userRank');
  if(rankEl) {
    rankEl.className = 'rank-badge';
    if (xp < 500) { rankEl.textContent = 'Citoyen'; rankEl.classList.add('rank-citizen'); }
    else if (xp < 2000) { rankEl.textContent = 'Garde Frontière'; rankEl.classList.add('rank-guard'); }
    else if (xp < 5000) { rankEl.textContent = 'Légionnaire'; rankEl.classList.add('rank-legionary'); }
    else if (xp < 12000) { rankEl.textContent = 'Décurion'; rankEl.classList.add('rank-centurion'); } // Reusing centurion class for simplicity
    else if (xp < 25000) { rankEl.textContent = 'Centurion'; rankEl.classList.add('rank-centurion'); }
    else if (xp < 50000) { rankEl.textContent = 'Prétorien'; rankEl.classList.add('rank-commander'); }
    else if (xp < 100000) { rankEl.textContent = 'Commandant'; rankEl.classList.add('rank-commander'); }
    else if (xp < 200000) { rankEl.textContent = 'Maître de Guerre'; rankEl.classList.add('rank-grand-regent'); }
    else { rankEl.textContent = 'Grand Régisseur'; rankEl.classList.add('rank-grand-regent'); }
    
    // Add XP display
    rankEl.title = `XP: ${xp.toLocaleString()}`;
  }
  
  const streakEl = document.getElementById('streakCount');
  if(streakEl) {
    streakEl.textContent = `${trainingDays} Jours`;
  }

  // Assistant Memory Update
  if (perfs.length > 0) {
    const last = perfs[perfs.length - 1];
    localStorage.setItem('nexus-last-exo', last.exo);
    localStorage.setItem('nexus-last-date', last.date);
  }
}

function updateBackgroundIntensity(weeklyVol) {
  const ratio = Math.min(weeklyVol / 20000, 1);
  document.documentElement.style.setProperty('--bg-intensity', ratio);
  
  // Transition du Cyan (190) vers le Rouge (0)
  const hue = 190 - (ratio * 190);
  document.documentElement.style.setProperty('--bg-hue', hue);
}

/* =========================================================
   ROUTINES & PHOTOS — ELITE UPGRADE
   ========================================================= */

const AVAILABLE_EXOS = [
    "Développé Couché", "Dips", "Écartés Poulie", "Extensions Triceps",
    "Tractions", "Rowing Barre", "Soulevé de Terre", "Curl Biceps",
    "Squat", "Presse à Cuisses", "Leg Extension", "Leg Curl",
    "Développé Militaire", "Élévations Latérales", "Oiseau Poulie"
];

function addExerciseRow(data = null) {
  const container = document.getElementById('routineExoList');
  if(!container) return;
  
  const div = document.createElement('div');
  div.className = 'routine-exo-row';
  div.style = 'display:grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap:8px; align-items:end; margin-bottom:10px; padding:10px; background:rgba(255,255,255,0.02); border-radius:8px;';
  
  let options = AVAILABLE_EXOS.map(exo => `<option value="${exo}" ${data && data.name === exo ? 'selected' : ''}>${exo}</option>`).join('');
  
  div.innerHTML = `
    <div class="modal-field" style="margin:0;">
      <label style="font-size:0.5rem;">EXO</label>
      <select class="row-exo" style="background:rgba(0,0,0,0.3); color:white; border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:4px; width:100%;">${options}</select>
    </div>
    <div class="modal-field" style="margin:0;">
      <label style="font-size:0.5rem;">SETS</label>
      <input type="number" class="row-sets" value="${data ? data.sets : 4}" min="1" style="width:100%;"/>
    </div>
    <div class="modal-field" style="margin:0;">
      <label style="font-size:0.5rem;">REPS</label>
      <input type="number" class="row-reps" value="${data ? data.reps : 10}" min="1" style="width:100%;"/>
    </div>
    <div class="modal-field" style="margin:0;">
      <label style="font-size:0.5rem;">POIDS</label>
      <input type="number" class="row-weight" value="${data ? data.weight : ''}" placeholder="-" style="width:100%;"/>
    </div>
    <button onclick="this.parentElement.remove()" style="background:none; border:none; color:var(--text-dim); cursor:pointer; font-size:1rem; padding-bottom:8px;">✕</button>
  `;
  container.appendChild(div);
}

window.addExerciseRow = addExerciseRow;

let currentRoutineIndex = -1;
let activeRoutine = null;

function initRoutines() {
  const list = document.getElementById('routineList');
  if(!list) return;
  const routines = JSON.parse(localStorage.getItem('nexus-routines') || '[]');
  list.innerHTML = routines.length === 0 ? '<div style="color:var(--text-dim);font-size:0.75rem;">Aucune routine.</div>' : '';
  
  routines.forEach((r, idx) => {
    const div = document.createElement('div');
    div.className = 'routine-item';
    div.innerHTML = `
      <div>
        <div style="font-weight:700;font-size:0.8rem;">${r.name}</div>
        <div style="font-size:0.6rem;color:var(--text-dim);">${(r.exercises || []).length} exos · ${r.duration || 60} min</div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn-confirm" style="padding:4px 8px;font-size:0.6rem;" onclick="event.stopPropagation(); startRoutine(${idx})">DÉMARRER</button>
        <button onclick="event.stopPropagation(); deleteRoutine(${idx})" style="background:none;border:none;color:red;cursor:pointer;">✕</button>
      </div>
    `;
    list.appendChild(div);
  });
}

window.startRoutine = (idx) => {
  const routines = JSON.parse(localStorage.getItem('nexus-routines') || '[]');
  activeRoutine = routines[idx];
  currentRoutineIndex = 0;
  loadRoutineExercise();
};

function loadRoutineExercise() {
  if(!activeRoutine) return;
  const exercises = activeRoutine.exercises || [];
  
  if(currentRoutineIndex >= exercises.length) {
    const kcal = calculateBurnedCalories(activeRoutine.duration || 60);
    alert(`Séance terminée ! Bravo Titan. Calories brûlées estimées : ${kcal} kcal.`);
    activeRoutine = null;
    currentRoutineIndex = -1;
    return;
  }
  
  const exoData = exercises[currentRoutineIndex];
  const select = document.getElementById('perfExo');
  if(select) {
    select.value = exoData.name;
    document.getElementById('perfSets').value = exoData.sets || '';
    document.getElementById('perfReps').value = exoData.reps || '';
    document.getElementById('perfWeight').value = exoData.weight || '';
    
    openModal('perfModal');
    const title = document.querySelector('#perfModal .modal-title');
    if(title) title.innerHTML = `PERFORMANCE <span style="font-size:0.7rem;color:var(--neon-purple);">(${currentRoutineIndex + 1}/${exercises.length})</span>`;
  }
}

window.deleteRoutine = (idx) => {
  const routines = JSON.parse(localStorage.getItem('nexus-routines') || '[]');
  routines.splice(idx, 1);
  localStorage.setItem('nexus-routines', JSON.stringify(routines));
  initRoutines();
};

const confirmRouBtn = document.getElementById('confirmRoutine');
if(confirmRouBtn) {
  confirmRouBtn.onclick = () => {
    const name = document.getElementById('rouName').value.trim();
    const duration = parseInt(document.getElementById('rouDuration').value) || 60;
    const rows = document.querySelectorAll('.routine-exo-row');
    const exercises = [];
    
    rows.forEach(row => {
        exercises.push({
            name: row.querySelector('.row-exo').value,
            sets: parseInt(row.querySelector('.row-sets').value) || 0,
            reps: parseInt(row.querySelector('.row-reps').value) || 0,
            weight: parseFloat(row.querySelector('.row-weight').value) || 0
        });
    });

    if(name && exercises.length > 0) {
      const routines = JSON.parse(localStorage.getItem('nexus-routines') || '[]');
      routines.push({ name, exercises, duration });
      localStorage.setItem('nexus-routines', JSON.stringify(routines));
      initRoutines();
      closeModal('routineModal');
      // Reset
      document.getElementById('routineExoList').innerHTML = '';
      document.getElementById('rouName').value = '';
    }
  };
}

function calculateBurnedCalories(durationMins) {
  const gender = localStorage.getItem('nexus-user-gender') || 'M';
  const age = parseInt(localStorage.getItem('nexus-user-age')) || 25;
  const height = parseInt(localStorage.getItem('nexus-user-height')) || 175;
  const history = JSON.parse(localStorage.getItem('nexus-weight-history') || '[]');
  const weight = history.length > 0 ? parseFloat(history[history.length-1].val) : 75;

  // Mifflin-St Jeor BMR
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr += (gender === 'M' ? 5 : -161);

  // Strength training MET ~6.0
  const met = 6.0;
  const durationHours = durationMins / 60;
  return Math.round((bmr / 24) * met * durationHours);
}

function updateEliteStats(perfs) {
  let totalVolume = 0;
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let weeklyVolume = 0;

  perfs.forEach(p => {
    const vol = p.weight * p.sets * p.reps;
    totalVolume += vol;
    const [d, m, y] = p.date.split('/');
    const perfDate = new Date(y, m - 1, d);
    if (perfDate > oneWeekAgo) weeklyVolume += vol;
  });

  const today = getTodayString();
  const todayPerfs = perfs.filter(p => p.date === today);
  const sessionVol = todayPerfs.reduce((acc, p) => acc + (p.weight * p.sets * p.reps), 0);
                          
  if(document.getElementById('totalVolume')) 
    document.getElementById('totalVolume').textContent = `${sessionVol.toLocaleString()} kg`;
  
  if(document.getElementById('calEstimate')) {
    const duration = activeRoutine ? (activeRoutine.duration || 60) : 60;
    document.getElementById('calEstimate').textContent = sessionVol > 0 ? calculateBurnedCalories(duration) : 0;
  }

  updateRankAndStreaks(totalVolume, perfs);
  updateBackgroundIntensity(weeklyVolume);
}

let activePhotoType = '';
window.triggerPhoto = (type) => {
  activePhotoType = type;
  document.getElementById('photoInput').click();
};

document.getElementById('photoInput').onchange = (e) => {
  const file = e.target.files[0];
  if(!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      // CANVAS COMPRESSION
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
      localStorage.setItem(`nexus-photo-${activePhotoType}`, compressedBase64);
      initPhotos();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};

window.comparePhotos = () => {
   const before = localStorage.getItem('nexus-photo-before');
   const after = localStorage.getItem('nexus-photo-after');
   if(!before || !after) {
     alert("Veuillez uploader les deux photos pour comparer !");
     return;
   }
   document.getElementById('compImgBefore').src = before;
   document.getElementById('compImgAfter').src = after;
   openModal('comparisonModal');
};

function initPhotos() {
  ['before', 'after'].forEach(t => {
    const data = localStorage.getItem(`nexus-photo-${t}`);
    const img = document.getElementById(`img${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const plus = document.getElementById(`plus${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if(data && img) {
      img.src = data; img.style.display = 'block';
      if(plus) plus.style.display = 'none';
    }
  });
}

function getTodayString() {
  return new Date().toLocaleDateString('fr-FR');
}

/* =========================================================
   KCAL TRACKER
   ========================================================= */
const kcalCurrentText = document.getElementById('kcalCurrentText');
const kcalLimitText = document.getElementById('kcalLimitText');
const kcalBar = document.getElementById('kcalBar');
const kcalPct = document.getElementById('kcalPct');

function initKcal() {
  const today = getTodayString();
  const savedDate = localStorage.getItem('nexus-kcal-date');
  
  if (savedDate !== today) {
    // Reset if it's a new day
    localStorage.setItem('nexus-kcal', '0');
    localStorage.setItem('nexus-kcal-date', today);
  }

  const current = parseInt(localStorage.getItem('nexus-kcal') || '0', 10);
  const limit = parseInt(localStorage.getItem('nexus-kcal-limit') || '2500', 10);
  
  kcalCurrentText.textContent = current;
  kcalLimitText.textContent = '/ ' + limit;
  
  let percentage = Math.min((current / limit) * 100, 100);
  kcalBar.style.width = percentage + '%';
  kcalPct.textContent = Math.round(percentage) + '%';
}

document.getElementById('confirmKcal').addEventListener('click', () => {
  const i = document.getElementById('kcalInput');
  const val = parseInt(i.value, 10);
  if (!isNaN(val) && val > 0) {
    let current = parseInt(localStorage.getItem('nexus-kcal') || '0', 10);
    localStorage.setItem('nexus-kcal', (current + val).toString());
    initKcal();
  }
  i.value = '';
  closeModal('kcalModal');
});

document.getElementById('confirmKcalLimit').addEventListener('click', () => {
  const i = document.getElementById('kcalLimitInput');
  const val = parseInt(i.value, 10);
  if (!isNaN(val) && val >= 500) {
    localStorage.setItem('nexus-kcal-limit', val.toString());
    initKcal();
  }
  i.value = '';
  closeModal('kcalLimitModal');
});


/* =========================================================
   CHARTS & GRAPHS
   ========================================================= */
let wChartInstance = null;
let pChartInstance = null;

function renderWeightChart(history) {
  const ctx = document.getElementById('weightChart');
  if (!ctx) return;
  if (wChartInstance) wChartInstance.destroy();
  
  if (!history || history.length === 0) return;
  
  const labels = history.map(h => h.date);
  const data = history.map(h => parseFloat(h.val));

  wChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Poids (kg)',
        data: data,
        borderColor: '#00f2fe',
        backgroundColor: 'rgba(0, 242, 254, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#00f2fe',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { display: false } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderPerfChart(perfs) {
  const ctx = document.getElementById('perfChart');
  if (!ctx) return;
  
  const select = document.getElementById('chartExoSelect');
  if(!select) return;
  
  if (!select.dataset.bound) {
    select.addEventListener('change', () => {
      renderPerfChart(JSON.parse(localStorage.getItem('nexus-perf-history') || '[]'));
    });
    select.dataset.bound = "true";
  }

  const selectedExo = select.value.toLowerCase();
  if (pChartInstance) pChartInstance.destroy();
  
  const filtered = perfs.filter(p => p.exo.toLowerCase().includes(selectedExo));
  
  const labels = filtered.map(p => p.date);
  const data = filtered.map(p => parseFloat(p.weight));

  pChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Poids soulevé (kg)',
        data: data,
        borderColor: '#b92b27',
        backgroundColor: 'rgba(185, 43, 39, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#b92b27',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { display: false } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

/* =========================================================
   WEIGHT TRACKER
   ========================================================= */
const weightHistoryEl = document.getElementById('weightHistory');

function initWeight() {
  const history = JSON.parse(localStorage.getItem('nexus-weight-history') || '[]');
  weightHistoryEl.innerHTML = '';
  
  // Render Chart
  renderWeightChart(history);
  
  if (history.length === 0) {
    weightHistoryEl.innerHTML = '<div style="color:var(--text-dim);font-size:0.8rem;text-align:center;">Aucune pesée enregistrée.</div>';
    return;
  }
  
  // Render history (newest first)
  history.reverse().forEach(entry => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-item-date">${entry.date}</div>
      <div class="history-item-val">${entry.val} kg</div>
    `;
    weightHistoryEl.appendChild(div);
  });
}

document.getElementById('confirmWeight').addEventListener('click', () => {
  const i = document.getElementById('weightInput');
  const val = parseFloat(i.value);
  if (!isNaN(val) && val > 0) {
    const history = JSON.parse(localStorage.getItem('nexus-weight-history') || '[]');
    history.push({ date: getTodayString(), val: val.toFixed(1) });
    localStorage.setItem('nexus-weight-history', JSON.stringify(history));
    initWeight();
  }
  i.value = '';
  closeModal('weightModal');
});


/* =========================================================
   PERFORMANCE TRACKER
   ========================================================= */
function updateOverviewStats(perfs) {
  let bestDC = 0, bestSQ = 0, bestSDT = 0, bestDM = 0;
  let rmDC = 0, rmSQ = 0, rmSDT = 0, rmDM = 0;
  
  perfs.forEach(p => {
    const e = p.exo.toLowerCase();
    const w = parseFloat(p.weight);
    const r = parseInt(p.reps);
    const estRM = Math.round(w * (1 + 0.0333 * r));
    
    if (e.includes('couch') || e.includes('dc') || e.includes('bench')) {
      if(w > bestDC) bestDC = w;
      if(estRM > rmDC) rmDC = estRM;
    }
    if (e.includes('squat') || e.includes('sq')) {
      if(w > bestSQ) bestSQ = w;
      if(estRM > rmSQ) rmSQ = estRM;
    }
    if (e.includes('terre') || e.includes('sdt') || e.includes('deadlift')) {
      if(w > bestSDT) bestSDT = w;
      if(estRM > rmSDT) rmSDT = estRM;
    }
    if (e.includes('milit') || e.includes('dm') || e.includes('ohp') || e.includes('epaule')) {
      if(w > bestDM) bestDM = w;
      if(estRM > rmDM) rmDM = estRM;
    }
  });

  const getPct = (val, max) => Math.min((val / max) * 100, 100) + '%';
  
  if(document.getElementById('overview-max-dc')) {
    document.getElementById('overview-max-dc').textContent = bestDC > 0 ? bestDC + ' kg' : '---';
    document.getElementById('bar-dc').style.width = getPct(bestDC, 120);
    document.getElementById('rm-dc').textContent = rmDC;
  }
  if(document.getElementById('overview-max-sq')) {
    document.getElementById('overview-max-sq').textContent = bestSQ > 0 ? bestSQ + ' kg' : '---';
    document.getElementById('bar-sq').style.width = getPct(bestSQ, 160);
    document.getElementById('rm-sq').textContent = rmSQ;
  }
  if(document.getElementById('overview-max-sdt')) {
    document.getElementById('overview-max-sdt').textContent = bestSDT > 0 ? bestSDT + ' kg' : '---';
    document.getElementById('bar-sdt').style.width = getPct(bestSDT, 200);
    document.getElementById('rm-sdt').textContent = rmSDT;
  }
  if(document.getElementById('overview-max-dm')) {
    document.getElementById('overview-max-dm').textContent = bestDM > 0 ? bestDM + ' kg' : '---';
    document.getElementById('bar-dm').style.width = getPct(bestDM, 80);
    document.getElementById('rm-dm').textContent = rmDM;
  }
}

const perfHistoryGrid = document.getElementById('perfHistoryGrid');

function initPerf() {
  const perfs = JSON.parse(localStorage.getItem('nexus-perf-history') || '[]');
  perfHistoryGrid.innerHTML = '';
  
  // Sync Overview stats and chart
  updateOverviewStats(perfs);
  updateEliteStats(perfs);
  renderPerfChart(perfs);
  renderAdvancedAnalytics();
  
  if (perfs.length === 0) {
    perfHistoryGrid.innerHTML = '<div style="color:var(--text-dim);font-size:0.8rem;">Aucune performance enregistrée.</div>';
    return;
  }
  
  // Render from newest
  [...perfs].reverse().forEach(p => {
    const card = document.createElement('div');
    card.className = 'hub-card'; // Reuse nice styling
    card.style.cursor = 'default';
    card.innerHTML = `
      <div style="font-family:var(--font-display);font-size:0.7rem;color:var(--neon-blue);margin-bottom:8px;">${p.date}</div>
      <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;margin-bottom:12px;color:var(--text-primary);">${p.exo.toUpperCase()}</div>
      
      <div style="display:flex;gap:15px;font-family:var(--font-body);font-size:0.8rem;color:var(--text-secondary);">
        <div><span style="color:var(--neon-purple);font-weight:700;">${p.sets}</span> Séries</div>
        <div><span style="color:var(--neon-green);font-weight:700;">${p.reps}</span> Reps</div>
      </div>
      <div style="font-family:var(--font-display);font-size:1.4rem;font-weight:900;color:var(--neon-gold);margin-top:10px;">
        ${p.weight} <span style="font-size:0.8rem;color:var(--text-dim);">KG</span>
      </div>
    `;
    perfHistoryGrid.appendChild(card);
  });
}

document.getElementById('confirmPerf').addEventListener('click', () => {
  const exo = document.getElementById('perfExo').value.trim();
  const sets = parseInt(document.getElementById('perfSets').value, 10);
  const reps = parseInt(document.getElementById('perfReps').value, 10);
  const weight = parseFloat(document.getElementById('perfWeight').value);
  
  if (exo && !isNaN(sets) && !isNaN(reps) && !isNaN(weight)) {
    const perfs = JSON.parse(localStorage.getItem('nexus-perf-history') || '[]');
    
    // 1RM Calculation Logic
    const oldBest = parseFloat(localStorage.getItem(`nexus-best-${exo.toLowerCase()}`) || '0');
    if(weight > oldBest) {
      localStorage.setItem(`nexus-best-${exo.toLowerCase()}`, weight.toString());
      triggerPR(exo, weight);
    }
    
    perfs.push({ date: getTodayString(), exo, sets, reps, weight });
    localStorage.setItem('nexus-perf-history', JSON.stringify(perfs));
    initPerf();
    
    // Continue Routine if active
    if(activeRoutine) {
      currentRoutineIndex++;
      setTimeout(() => loadRoutineExercise(), 600);
    }

    // Clear
    if(document.getElementById('perfExo').tagName === 'INPUT') document.getElementById('perfExo').value = '';
    document.getElementById('perfSets').value = '';
    document.getElementById('perfReps').value = '';
    document.getElementById('perfWeight').value = '';
    closeModal('perfModal');
  } else {
    alert("Veuillez remplir tous les champs correctement.");
  }
});

/* =========================================================
   NEXUS PHASE 2 — AI INSIGHTS
   ========================================================= */
function updateAIInsights(perfs) {
  calculateNeuralPrediction(perfs);
  const insightText = document.getElementById('aiInsightText');
  if(!insightText || perfs.length < 2) return;

  const majorExos = ['Développé Couché', 'Squat', 'Soulevé de Terre', 'Développé Militaire'];
  let insight = "Analyse terminée : Votre régularité est votre plus grande force. Continuez ainsi !";

  // Look for the last major lift progress
  for(const exo of majorExos) {
    const history = perfs.filter(p => p.exo === exo);
    if(history.length >= 2) {
      const last = history[history.length - 1];
      const prev = history[history.length - 2];
      const diff = parseFloat(last.weight) - parseFloat(prev.weight);
      
      if(diff > 0) {
        insight = `NEXUS AI : Progression détectée sur le **${exo}** (+${diff}kg). Vos fibres musculaires s'adaptent parfaitement.`;
        break;
      } else if(diff === 0) {
        const volLast = last.weight * last.reps * last.sets;
        const volPrev = prev.weight * prev.reps * prev.sets;
        if(volLast > volPrev) {
          insight = `NEXUS AI : Volume en hausse sur le **${exo}**. Vous bâtissez une endurance de Titan.`;
          break;
        }
      }
    }
  }

  insightText.innerHTML = insight;
}

/* =========================================================
   NEXUS PHASE 2 — HEATMAP
   ========================================================= */
function renderHeatmap() {
  const container = document.getElementById('constancyHeatmap');
  if(!container) return;

  const perfs = JSON.parse(localStorage.getItem('nexus-perf-history') || '[]');
  const dateMap = {};
  perfs.forEach(p => {
    dateMap[p.date] = (dateMap[p.date] || 0) + 1;
  });

  container.innerHTML = '';
  const now = new Date();
  // Start from 52 weeks ago (Sunday)
  const startDate = new Date();
  startDate.setDate(now.getDate() - 364);

  for(let i = 0; i < 371; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toLocaleDateString('fr-FR');
    
    const day = document.createElement('div');
    day.className = 'heatmap-day';
    day.title = `${dateStr} : ${dateMap[dateStr] || 0} exercices`;
    
    const count = dateMap[dateStr] || 0;
    if(count > 0) {
      if(count >= 5) day.classList.add('active-3');
      else if(count >= 3) day.classList.add('active-2');
      else day.classList.add('active-1');
    }
    
    container.appendChild(day);
  }
}


/* =========================================================
   BOSS GOALS SYSTEM
   ========================================================= */
function initBossGoals() {
  const grid = document.getElementById('bossGoalsGrid');
  if(!grid) return;
  
  const goals = JSON.parse(localStorage.getItem('nexus-boss-goals') || '[]');
  const perfs = JSON.parse(localStorage.getItem('nexus-perf-history') || '[]');
  
  grid.innerHTML = '';
  if(goals.length === 0) {
    grid.innerHTML = '<div style="color:var(--text-dim); font-size:0.75rem;">Aucun objectif actif.</div>';
    return;
  }
  
  goals.forEach((goal, idx) => {
    // Current PR for this exo
    const exoHistory = perfs.filter(p => p.exo === goal.exo);
    const currentBest = exoHistory.length > 0 ? Math.max(...exoHistory.map(p => p.weight)) : 0;
    const progress = Math.min((currentBest / goal.target) * 100, 100);
    const isCompleted = progress >= 100;
    
    const div = document.createElement('div');
    div.className = 'training-card boss-card';
    div.style.padding = '1.5rem';
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div class="boss-badge">${isCompleted ? 'DÉTRUIT' : 'CIBLE : BOSS'}</div>
          <div style="font-family:var(--font-display); font-size:1.1rem; font-weight:900; color:white;">${goal.exo.toUpperCase()}</div>
        </div>
        <button onclick="removeBossGoal(${idx})" style="background:none; border:none; color:var(--text-dim); cursor:pointer;">✕</button>
      </div>
      
      <div class="boss-progress-container">
        <div class="boss-stats">
          <span>PROGRESSION</span>
          <span>${currentBest} / ${goal.target} KG</span>
        </div>
        <div class="progress-bar-bg" style="height:6px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden;">
          <div class="progress-bar-fill" style="width:${progress}%; height:100%; background:var(--neon-gold); box-shadow:0 0 10px var(--neon-gold);"></div>
        </div>
        <div style="margin-top:8px; font-family:var(--font-display); font-size:0.6rem; color:${isCompleted ? 'var(--neon-gold)' : 'var(--text-dim)'}; text-align:right;">
          ${isCompleted ? 'MISSION ACCOMPLIE' : Math.round(progress) + '% DU NIVEAU BOSS'}
        </div>
      </div>
    `;
    grid.appendChild(div);
  });
}

window.removeBossGoal = (idx) => {
  const goals = JSON.parse(localStorage.getItem('nexus-boss-goals') || '[]');
  goals.splice(idx, 1);
  localStorage.setItem('nexus-boss-goals', JSON.stringify(goals));
  initBossGoals();
};

document.getElementById('confirmBossGoal')?.addEventListener('click', () => {
  const exo = document.getElementById('bossExo').value;
  const target = parseFloat(document.getElementById('bossTarget').value);
  
  if(!isNaN(target) && target > 0) {
    const goals = JSON.parse(localStorage.getItem('nexus-boss-goals') || '[]');
    goals.push({ exo, target });
    localStorage.setItem('nexus-boss-goals', JSON.stringify(goals));
    initBossGoals();
    closeModal('addBossModal');
    document.getElementById('bossTarget').value = '';
    if(window.nexus) nexus.notify("Nouvel Objectif Boss Actif", "success");
  } else {
    if(window.nexus) nexus.notify("Veuillez entrer une cible valide", "error");
  }
});

/* =========================================================
   V3.3.0 — BIOMETRY LOGIC
   ========================================================= */

const MUSCLE_MAP = {
  "Développé Couché": { primary: "chest", secondary: ["shoulders-l", "shoulders-r", "triceps-l", "triceps-r"], category: "PUSH" },
  "Squat": { primary: "quads-r", secondary: ["quads-l", "glutes", "abs"], category: "LEGS" },
  "Soulevé de Terre": { primary: "back", secondary: ["glutes", "hams-l", "hams-r", "abs"], category: "PULL" },
  "Développé Militaire": { primary: "shoulders-l", secondary: ["shoulders-r", "triceps-l", "triceps-r"], category: "PUSH" },
  "Dips": { primary: "triceps-l", secondary: ["triceps-r", "chest"], category: "PUSH" },
  "Tractions": { primary: "back", secondary: ["traps", "biceps-l", "biceps-r"], category: "PULL" },
  "Rowing Barre": { primary: "back", secondary: ["traps", "biceps-l", "biceps-r"], category: "PULL" },
  "Curl Biceps": { primary: "biceps-l", secondary: ["biceps-r"], category: "PULL" },
  "Extensions Triceps": { primary: "triceps-l", secondary: ["triceps-r"], category: "PUSH" },
  "Leg Extension": { primary: "quads-l", secondary: ["quads-r"], category: "LEGS" },
  "Leg Curl": { primary: "hams-l", secondary: ["hams-r"], category: "LEGS" },
  "Élévations Latérales": { primary: "shoulders-l", secondary: ["shoulders-r"], category: "PUSH" },
  "Oiseau Poulie": { primary: "shoulders-l", secondary: ["shoulders-r", "traps"], category: "PULL" },
  "Presse à Cuisses": { primary: "quads-l", secondary: ["quads-r", "glutes"], category: "LEGS" },
  "Abdominaux": { primary: "abs", secondary: [], category: "CORE" }
};

let radarChartInstance = null;

function renderAdvancedAnalytics() {
  const perfs = JSON.parse(localStorage.getItem('nexus-perf-history') || '[]');
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const muscleScores = {};
  const categoryScores = { "PUSH": 0, "PULL": 0, "LEGS": 0, "CORE": 0 };
  
  perfs.forEach(p => {
    const [d, m, y] = p.date.split('/');
    const pDate = new Date(y, m-1, d);
    if(pDate < thirtyDaysAgo) return;

    const mapping = MUSCLE_MAP[p.exo];
    if(!mapping) return;

    const vol = p.weight * p.sets * p.reps;
    
    // Primary muscle (100% volume)
    muscleScores[mapping.primary] = (muscleScores[mapping.primary] || 0) + vol;
    // Secondary muscles (30% volume)
    mapping.secondary.forEach(m => {
      muscleScores[m] = (muscleScores[m] || 0) + (vol * 0.3);
    });
    // Category score
    categoryScores[mapping.category] = (categoryScores[mapping.category] || 0) + vol;
  });

  // 1. HEATMAP (SVG)
  const maxScore = Math.max(...Object.values(muscleScores), 1000);
  Object.keys(muscleScores).forEach(mId => {
    const score = muscleScores[mId];
    const pct = Math.min((score / maxScore) * 100, 100);
    const paths = document.querySelectorAll(`#muscle-${mId}`);
    paths.forEach(p => {
        // HSL: From Green (120) to Red (0)
        const hue = 120 - (pct * 1.2); 
        p.style.fill = `hsla(${hue}, 80%, 50%, 0.3)`;
        p.style.stroke = `hsla(${hue}, 100%, 50%, 0.6)`;
        p.dataset.pct = Math.round(pct);
    });
  });

  // 2. RADAR CHART
  renderRadar(categoryScores);

  // 3. NEURAL PREDICTION
  calculateNeuralPrediction(perfs);
}

function renderRadar(scores) {
  const ctx = document.getElementById('radarChart');
  if(!ctx) return;
  if(radarChartInstance) radarChartInstance.destroy();

  radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['PUSH', 'PULL', 'LEGS', 'CORE'],
      datasets: [{
        label: 'Balance Volumétrique',
        data: [scores.PUSH, scores.PULL, scores.LEGS, scores.CORE],
        backgroundColor: 'rgba(0, 242, 254, 0.2)',
        borderColor: '#00f2fe',
        pointBackgroundColor: '#00f2fe',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(255,255,255,0.1)' },
          grid: { color: 'rgba(255,255,255,0.1)' },
          pointLabels: { color: 'rgba(255,255,255,0.5)', font: { family: 'Outfit', size: 10 } },
          ticks: { display: false }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function calculateNeuralPrediction(perfs) {
  const text = document.getElementById('neuralPredictionText');
  const textOverview = document.getElementById('neuralPredictionText_overview');
  if(!text) return;

  const majorExos = ["Développé Couché", "Squat", "Soulevé de Terre"];
  let lines = [];

  majorExos.forEach(exo => {
    const history = perfs.filter(p => p.exo === exo).slice(-5);
    if(history.length < 3) return;

    const n = history.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    history.forEach((p, i) => {
      sumX += i;
      sumY += p.weight;
      sumXY += i * p.weight;
      sumXX += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    if(slope > 0) {
      lines.push(`${exo.toUpperCase()} : +${slope.toFixed(1)}kg suggéré.`);
    } else {
      lines.push(`${exo.toUpperCase()} : Focus volume.`);
    }
  });

  const output = lines.length ? lines.join('<br>') : "Enregistrez plus de séances pour l'extrapolation.";
  text.innerHTML = output;
  if(textOverview) textOverview.innerHTML = output;
}

// Tooltip Management
document.addEventListener('mouseover', (e) => {
    if(e.target.classList.contains('muscle-group')) {
        const tt = document.getElementById('muscleTooltip');
        const name = e.target.getAttribute('title');
        const pct = e.target.dataset.pct || 0;
        
        document.getElementById('mt-name').textContent = name.toUpperCase();
        document.getElementById('mt-pct').textContent = pct + '%';
        document.getElementById('mt-fill').style.width = pct + '%';
        
        tt.style.visibility = 'visible';
        tt.style.opacity = '1';
        
        const rect = e.target.getBoundingClientRect();
        tt.style.left = (rect.left + window.scrollX + 20) + 'px';
        tt.style.top = (rect.top + window.scrollY - 100) + 'px';
    }
});
document.addEventListener('mouseout', (e) => {
    if(e.target.classList.contains('muscle-group')) {
        const tt = document.getElementById('muscleTooltip');
        tt.style.opacity = '0';
        tt.style.visibility = 'hidden';
    }
});

// Warm-up Gen
document.getElementById('genWupBtn')?.addEventListener('click', () => {
    const target = parseFloat(document.getElementById('wupTarget').value);
    if(!target || target <= 0) return;

    const res = document.getElementById('wupResult');
    const container = document.getElementById('wupSets');
    res.style.display = 'block';
    container.innerHTML = '';

    const protocol = [
        { pct: 0.5, reps: 10, label: "ÉVEIL NERVEUX" },
        { pct: 0.7, reps: 5, label: "CALIBRAGE" },
        { pct: 0.85, reps: 2, label: "ACCLIMATATION" }
    ];

    protocol.forEach(step => {
        const weight = Math.round(target * step.pct);
        const div = document.createElement('div');
        div.className = 'wup-row';
        div.innerHTML = `<span>${step.label}</span> <span>${weight}kg × ${step.reps}</span>`;
        container.appendChild(div);
    });
});

// --- EXPORTS GLOBAUX POUR COMPATIBILITÉ ---
window.togglePin = togglePin;
window.updateDashboard = updateDashboard;
window.reinitDashboardCharts = reinitDashboardCharts;
window.openModal = window.openModal || ((id) => document.getElementById(id)?.classList.add('active'));
window.closeModal = window.closeModal || ((id) => document.getElementById(id)?.classList.remove('active'));
window.initKcal = initKcal;
window.initWeight = initWeight;
window.initPerf = initPerf;
window.initRoutines = initRoutines;
window.initPhotos = initPhotos;
window.initBossGoals = initBossGoals;
window.renderAdvancedAnalytics = renderAdvancedAnalytics;
window.renderHeatmap = renderHeatmap;
window.updateAIInsights = updateAIInsights;
window.updatePinButtons = updatePinButtons;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initKcal();
  initWeight();
  initPerf();
  initRoutines();
  initPhotos();
  initBossGoals();
  renderAdvancedAnalytics();
  renderHeatmap();
  const perfs = JSON.parse(localStorage.getItem('nexus-perf-history') || '[]');
  updateAIInsights(perfs);
  updatePinButtons();
  updateDashboard();

  // Biométrie Sync
  State.subscribe('nexus-perf-history', () => {
    Biometrie.updateHeatmap();
    renderAdvancedAnalytics();
  });
  
  // Workspace Sync
  State.subscribe('core-ops-pins', () => {
    pinnedPanels = State.get('core-ops-pins', []);
    updatePinButtons();
    updateDashboard();
  });
});
