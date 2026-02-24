// Priority 1: Clear Overlays
// We do this immediately if the script is at the bottom of the body
const clearOverlays = () => {
    const transitionOverlay = document.getElementById('page-transition');
    const splashScreen = document.getElementById('splash-screen');

    if (transitionOverlay) {
        transitionOverlay.classList.add('out');
        setTimeout(() => transitionOverlay.classList.remove('active'), 600);
    }
    if (splashScreen) {
        document.body.classList.add('loaded');
    }
    console.log("Overlays cleared.");
};

// Immediate check
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    clearOverlays();
} else {
    window.addEventListener('load', clearOverlays);
    document.addEventListener('DOMContentLoaded', clearOverlays);
}
// Safety backup
setTimeout(clearOverlays, 2000);

document.addEventListener('DOMContentLoaded', () => {
    console.log("Portfolio script initialized.");

    // Helper for safe element selection
    const safeAddEvent = (id, event, callback) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, callback);
    };

    // Helper for Toasts
    const showToast = (message, type = 'success') => {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        toast.innerHTML = `<span>${icons[type] || ''}</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    };

    // Modal "Esc" support
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        }
    });

    // 1. Theme Management
    try {
        const themeToggleBtn = document.getElementById('theme-toggle');
        const initTheme = () => {
            const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
            document.documentElement.setAttribute('data-theme', savedTheme);
        };
        initTheme();

        // Auto-detect system theme
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                if (typeof updateChartColors === 'function') updateChartColors(newTheme);
            }
        });

        if (themeToggleBtn) {
            themeToggleBtn.onclick = () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                if (typeof updateChartColors === 'function') updateChartColors(newTheme);
                showToast(`Mode ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`, 'info');
            };
        }
    } catch (e) { console.error("Theme Error:", e); }

    // 2. Custom Cursor
    try {
        const cursorDot = document.querySelector('.cursor-dot');
        const cursorOutline = document.querySelector('.cursor-outline');
        if (cursorDot && cursorOutline) {
            document.body.classList.add('custom-cursor-active');
            window.addEventListener('mousemove', e => {
                cursorDot.style.left = e.clientX + 'px';
                cursorDot.style.top = e.clientY + 'px';
                cursorOutline.animate({ left: e.clientX + 'px', top: e.clientY + 'px' }, { duration: 500, fill: "forwards" });
            });
        }
    } catch (e) { console.error("Cursor Error:", e); }

    // 3. 3D Tilt
    try {
        const tiltElements = document.querySelectorAll('.btn-card, .gallery-item');
        tiltElements.forEach(el => {
            el.onmousemove = e => {
                const r = el.getBoundingClientRect();
                const x = e.clientX - r.left - r.width / 2;
                const y = e.clientY - r.top - r.height / 2;
                el.style.transform = `perspective(1000px) rotateX(${-y / 10}deg) rotateY(${x / 10}deg) scale(1.02)`;
            };
            el.onmouseleave = () => el.style.transform = '';
        });
    } catch (e) { console.error("Tilt Error:", e); }

    // 4. Live Clock
    try {
        const clockElement = document.getElementById('live-clock');
        if (clockElement) {
            const up = () => clockElement.textContent = new Date().toLocaleTimeString('fr-FR');
            setInterval(up, 1000);
            up();
        }
    } catch (e) { console.error("Clock Error:", e); }

    // 5. Gym App Logic (Specific to gym.html)
    try {
        const gymForm = document.getElementById('gym-form');
        const gymTableBody = document.querySelector('table tbody');
        const progressionCanvas = document.getElementById('progressionChart');

        if (gymForm || progressionCanvas || gymTableBody) {
            let myChart = null;
            let muscleChart = null;

            const calculateOneRM = (w, r) => (r <= 0) ? 0 : (r === 1 ? w : Math.round(w * (1 + r / 30)));
            const getGymData = () => JSON.parse(localStorage.getItem('gym_data') || '[]');

            const renderGymData = () => {
                const data = getGymData();

                // Stats
                const updateStat = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
                if (data.length > 0) {
                    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
                    updateStat('stat-last-session', sorted[0].date);
                    updateStat('stat-last-exercise', `Focus: ${sorted[0].exercise}`);
                    const vol = data.reduce((s, i) => s + (i.weight * i.reps), 0);
                    updateStat('stat-total-volume', vol >= 1000 ? (vol / 1000).toFixed(1) + 't' : vol + 'kg');
                    updateStat('stat-sessions-count', new Set(data.map(d => d.date)).size);
                }

                // PRs
                const prGrid = document.getElementById('pr-grid');
                if (prGrid) {
                    prGrid.innerHTML = '';
                    const prs = {};
                    data.forEach(i => {
                        const orm = calculateOneRM(i.weight, i.reps);
                        if (!prs[i.exercise] || orm > prs[i.exercise].orm) prs[i.exercise] = { ...i, orm };
                    });
                    Object.values(prs).forEach(pr => {
                        const div = document.createElement('div');
                        div.className = 'stat-card';
                        div.innerHTML = `<div class="stat-label">${pr.exercise}</div><div class="stat-value">${pr.weight}kg x${pr.reps}</div><div class="stat-trend trend-up">1RM: ${pr.orm}kg</div>`;
                        prGrid.appendChild(div);
                    });
                }

                // Table
                if (gymTableBody) {
                    gymTableBody.innerHTML = '';
                    data.forEach(i => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `<td>${i.date}</td><td>${i.exercise}</td><td>${i.weight}</td><td>${i.reps}</td><td><span class="badge badge-delete" data-id="${i.id}">&times;</span></td>`;
                        gymTableBody.appendChild(tr);
                    });
                    document.querySelectorAll('.badge-delete').forEach(b => b.onclick = () => {
                        if (confirm('Supprimer cette entrée ?')) {
                            const nid = b.getAttribute('data-id');
                            localStorage.setItem('gym_data', JSON.stringify(getGymData().filter(x => x.id != nid)));
                            renderGymData();
                            showToast('Entrée supprimée', 'info');
                        }
                    });
                }

                // Chart
                if (progressionCanvas && typeof Chart !== 'undefined') {
                    const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
                    if (!myChart) {
                        myChart = new Chart(progressionCanvas, {
                            type: 'line',
                            data: { labels: sorted.map(d => d.date), datasets: [{ label: '1RM Est.', data: sorted.map(d => calculateOneRM(d.weight, d.reps)), borderColor: '#6366f1', tension: 0.4 }] },
                            options: { responsive: true, maintainAspectRatio: false }
                        });
                    } else {
                        myChart.data.labels = sorted.map(d => d.date);
                        myChart.data.datasets[0].data = sorted.map(d => calculateOneRM(d.weight, d.reps));
                        myChart.update();
                    }
                }
            };

            renderGymData();

            // 1RM Preview Logic
            const gymWeightInput = document.getElementById('gym-weight');
            const gymRepsInput = document.getElementById('gym-reps');
            const oneRMPreview = document.getElementById('1rm-preview');
            if (gymWeightInput && gymRepsInput && oneRMPreview) {
                const upPrev = () => {
                    const w = parseFloat(gymWeightInput.value), r = parseInt(gymRepsInput.value);
                    oneRMPreview.textContent = w && r ? `Estimation 1RM: ${calculateOneRM(w, r)} kg` : 'Estimation 1RM: -- kg';
                };
                gymWeightInput.oninput = gymRepsInput.oninput = upPrev;
            }

            // Modal
            const openBtn = document.getElementById('open-record-modal');
            const modal = document.getElementById('record-modal');
            const closeBtn = document.querySelector('.modal-close');
            if (openBtn && modal) {
                openBtn.onclick = () => { modal.classList.add('active'); document.getElementById('gym-date').valueAsDate = new Date(); };
                if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
            }

            if (gymForm) {
                gymForm.onsubmit = e => {
                    e.preventDefault();
                    const d = getGymData();
                    d.push({
                        id: Date.now(),
                        date: document.getElementById('gym-date').value,
                        exercise: document.getElementById('gym-exercise').value,
                        category: document.getElementById('gym-category').value,
                        weight: parseFloat(document.getElementById('gym-weight').value),
                        reps: parseInt(document.getElementById('gym-reps').value),
                    });
                    localStorage.setItem('gym_data', JSON.stringify(d));
                    renderGymData();
                    gymForm.reset();
                    modal.classList.remove('active');
                    showToast('Séance enregistrée !');
                };
            }

            // Export/Import
            const exBtn = document.getElementById('export-btn');
            const imBtn = document.getElementById('import-btn');
            const imFl = document.getElementById('import-file');
            if (exBtn) {
                exBtn.onclick = () => {
                    const blob = new Blob([JSON.stringify({ gym: getGymData() }, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    showToast('Export réussi', 'success');
                };
            }
            if (imBtn && imFl) {
                imBtn.onclick = () => imFl.click();
                imFl.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onload = (ev) => {
                        try {
                            const data = JSON.parse(ev.target.result);
                            if (data.gym) localStorage.setItem('gym_data', JSON.stringify(data.gym));
                            renderGymData();
                            showToast('Données importées', 'success');
                        } catch (err) { showToast('Import échoué', 'error'); }
                    };
                    r.readAsText(file);
                };
            }
        }
    } catch (e) { console.error("Gym Error:", e); }

    // 6. Scroll Reveal Logic
    try {
        const reveals = document.querySelectorAll('.animate-in, .stat-card, .btn-card, .chart-section');
        reveals.forEach(el => el.classList.add('reveal'));
        const revealOnScroll = () => {
            reveals.forEach(el => {
                const windowHeight = window.innerHeight;
                const elementTop = el.getBoundingClientRect().top;
                const elementVisible = 150;
                if (elementTop < windowHeight - elementVisible) el.classList.add('active');
            });
        };
        window.addEventListener('scroll', revealOnScroll);
        revealOnScroll(); // Initial check
    } catch (e) { console.error("Reveal Error:", e); }

    // 7. Gallery Filters (collection.html)
    try {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const galleryItems = document.querySelectorAll('.gallery-item');
        if (filterBtns.length > 0) {
            filterBtns.forEach(btn => {
                btn.onclick = () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const filt = btn.getAttribute('data-filter');
                    galleryItems.forEach(item => {
                        const cat = item.getAttribute('data-category');
                        item.style.display = (filt === 'all' || cat === filt) ? 'block' : 'none';
                    });
                    showToast(`Filtre : ${btn.textContent}`, 'info');
                };
            });
        }
    } catch (e) { console.error("Gallery Error:", e); }

    // 8. Page Transitions
    try {
        const transitionOverlay = document.getElementById('page-transition');
        document.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('#')) {
                link.onclick = (e) => {
                    const target = link.href;
                    if (target.split('#')[0] !== window.location.href.split('#')[0]) {
                        e.preventDefault();
                        if (transitionOverlay) {
                            transitionOverlay.classList.remove('out');
                            transitionOverlay.classList.add('active');
                            setTimeout(() => window.location.href = target, 600);
                        } else window.location.href = target;
                    }
                };
            }
        });
    } catch (e) { console.error("Transition Error:", e); }
});
