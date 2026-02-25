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

    // --- AUTHENTICATION & PROFILE LOGIC ---
    let currentUser = null;

    const updateAuthUI = (user) => {
        const loginBtn = document.getElementById('login-open-btn');
        const userMenu = document.getElementById('user-menu');
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');

        if (user) {
            currentUser = user;
            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'flex';
                userName.textContent = user.username;
                userAvatar.src = user.profile_picture || '/uploads/default-profile.png';
            }
            if (document.getElementById('guest-view')) document.getElementById('guest-view').style.display = 'none';
            if (document.getElementById('auth-content')) document.getElementById('auth-content').style.display = 'block';
            if (typeof renderGymData === 'function') renderGymData();
        } else {
            currentUser = null;
            if (loginBtn) loginBtn.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
            if (document.getElementById('guest-view')) document.getElementById('guest-view').style.display = 'flex';
            if (document.getElementById('auth-content')) document.getElementById('auth-content').style.display = 'none';
        }
    };

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            updateAuthUI(data.loggedIn ? data.user : null);
        } catch (e) {
            updateAuthUI(null);
        }
    };

    // Auth Modal Handlers
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const authTitle = document.getElementById('auth-title');
    let isLoginMode = true;

    if (tabLogin && tabRegister) {
        tabLogin.onclick = () => {
            isLoginMode = true;
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            authTitle.textContent = "Connexion";
        };
        tabRegister.onclick = () => {
            isLoginMode = false;
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            authTitle.textContent = "Inscription";
        };
    }

    safeAddEvent('login-open-btn', 'click', () => authModal.classList.add('active'));
    safeAddEvent('auth-modal-close', 'click', () => authModal.classList.remove('active'));

    if (authForm) {
        authForm.onsubmit = async (e) => {
            e.preventDefault();
            const username = document.getElementById('auth-username').value;
            const password = document.getElementById('auth-password').value;
            const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';

            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (res.ok) {
                    showToast(data.message);
                    authModal.classList.remove('active');
                    checkAuth();
                } else {
                    showToast(data.error, 'error');
                }
            } catch (err) {
                showToast('Erreur serveur', 'error');
            }
        };
    }

    safeAddEvent('logout-btn', 'click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        showToast('Déconnecté');
        window.location.reload();
    });

    // Profile Photo Upload
    const profileModal = document.getElementById('profile-modal');
    const profileForm = document.getElementById('profile-photo-form');
    const avatarClickable = document.getElementById('avatar-clickable');

    if (avatarClickable) {
        avatarClickable.onclick = () => profileModal.classList.add('active');
    }
    safeAddEvent('profile-modal-close', 'click', () => profileModal.classList.remove('active'));

    if (profileForm) {
        profileForm.onsubmit = async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('profile-photo-input');
            const formData = new FormData();
            formData.append('photo', fileInput.files[0]);

            try {
                const res = await fetch('/api/user/upload-photo', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (res.ok) {
                    showToast('Photo mise à jour');
                    profileModal.classList.remove('active');
                    checkAuth();
                } else {
                    showToast(data.error, 'error');
                }
            } catch (err) {
                showToast('Erreur upload', 'error');
            }
        };
    }

    // Initial Auth Check
    checkAuth();

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
            let weightChart = null;

            const calculateOneRM = (w, r) => (r <= 0) ? 0 : (r === 1 ? w : Math.round(w * (1 + r / 30)));

            const getGymData = async () => {
                try {
                    const response = await fetch('/api/gym');
                    if (!response.ok) throw new Error('Fetch failed');
                    return await response.json();
                } catch (err) {
                    console.error("API error:", err);
                    return [];
                }
            };

            const getWeightData = async () => {
                try {
                    const response = await fetch('/api/weight');
                    if (!response.ok) throw new Error('Fetch failed');
                    return await response.json();
                } catch (err) {
                    console.error("Weight API error:", err);
                    return [];
                }
            };

            const renderGymData = async () => {
                const data = await getGymData();
                const targets = await getTargets();

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

                // Heatmap
                renderHeatmap(data);

                // Weight Stats
                const wData = await getWeightData();
                if (wData.length > 0) {
                    const lastW = wData[wData.length - 1];
                    updateStat('stat-body-weight', `${lastW.weight} kg`);
                    if (wData.length > 1) {
                        const diff = (lastW.weight - wData[wData.length - 2].weight).toFixed(1);
                        const trendEl = document.getElementById('stat-weight-trend');
                        if (trendEl) {
                            trendEl.textContent = `${diff > 0 ? '+' : ''}${diff}kg (Dernière)`;
                            trendEl.className = `stat-trend ${diff > 0 ? 'trend-up' : 'trend-down'}`;
                        }
                    }
                }
                renderWeightChart(wData);

                // PRs & Targets
                const prs = {};
                data.forEach(i => {
                    const orm = calculateOneRM(i.weight, i.reps);
                    if (!prs[i.exercise] || orm > prs[i.exercise].orm) prs[i.exercise] = { ...i, orm };
                });

                const prGrid = document.getElementById('pr-grid');
                if (prGrid) {
                    prGrid.innerHTML = '';
                    Object.values(prs).forEach(pr => {
                        const div = document.createElement('div');
                        div.className = 'stat-card';
                        div.innerHTML = `<div class="stat-label">${pr.exercise}</div><div class="stat-value">${pr.weight}kg x${pr.reps}</div><div class="stat-trend trend-up">1RM: ${pr.orm}kg</div>`;
                        prGrid.appendChild(div);
                    });
                }

                renderTargets(targets, prs);

                // Table with Delta
                if (gymTableBody) {
                    renderHistoryTable(data);
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

            const renderHeatmap = (data) => {
                const container = document.getElementById('gym-heatmap');
                if (!container) return;
                container.innerHTML = '';

                const dates = data.reduce((acc, curr) => {
                    acc[curr.date] = (acc[curr.date] || 0) + 1;
                    return acc;
                }, {});

                const today = new Date();
                const yearAgo = new Date();
                yearAgo.setFullYear(today.getFullYear() - 1);

                for (let i = 0; i < 365; i++) {
                    const d = new Date(yearAgo);
                    d.setDate(d.getDate() + i);
                    const dateStr = d.toISOString().split('T')[0];
                    const count = dates[dateStr] || 0;

                    const day = document.createElement('div');
                    day.className = `heatmap-day ${count > 0 ? (count > 2 ? 'level-3' : (count > 1 ? 'level-2' : 'level-1')) : ''}`;
                    day.title = `${dateStr}: ${count} série(s)`;
                    container.appendChild(day);
                }
            };

            const renderHistoryTable = (data, filter = "") => {
                if (!gymTableBody) return;
                gymTableBody.innerHTML = '';
                const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));

                sorted.filter(i => i.exercise.toLowerCase().includes(filter.toLowerCase())).forEach((item, index, list) => {
                    const tr = document.createElement('tr');

                    // Delta Calculation
                    let deltaHtml = '--';
                    const prev = list.slice(index + 1).find(p => p.exercise === item.exercise);
                    if (prev) {
                        const diff = (item.weight - prev.weight).toFixed(1);
                        deltaHtml = `<span class="delta-tag ${diff > 0 ? 'delta-pos' : (diff < 0 ? 'delta-neg' : '')}">${diff > 0 ? '+' : ''}${diff}kg</span>`;
                    }

                    tr.innerHTML = `
                        <td>${item.date}</td>
                        <td class="table-exercise-col">${item.exercise}</td>
                        <td>${item.weight}kg</td>
                        <td>${item.reps}</td>
                        <td>${deltaHtml}</td>
                        <td><span class="badge badge-delete" data-id="${item.id}">&times;</span></td>
                    `;
                    gymTableBody.appendChild(tr);
                });

                // Attach delete logic again
                document.querySelectorAll('.badge-delete').forEach(b => b.onclick = async () => {
                    if (confirm('Supprimer cette entrée ?')) {
                        const nid = b.getAttribute('data-id');
                        try {
                            const response = await fetch(`/api/gym/${nid}`, { method: 'DELETE' });
                            if (response.ok) {
                                renderGymData();
                                showToast('Entrée supprimée', 'info');
                            }
                        } catch (err) { showToast('Erreur suppression', 'error'); }
                    }
                });
            };

            const getTargets = async () => {
                try {
                    const response = await fetch('/api/targets');
                    return await response.json();
                } catch (err) { return []; }
            };

            const renderTargets = (targets, prs) => {
                const grid = document.getElementById('target-grid');
                if (!grid) return;
                grid.innerHTML = '';

                targets.forEach(t => {
                    const pr = prs[t.exercise] ? prs[t.exercise].weight : 0;
                    const progress = Math.min(Math.round((pr / t.target_weight) * 100), 100);

                    const div = document.createElement('div');
                    div.className = 'target-card animate-in';
                    div.innerHTML = `
                        <div class="target-delete" data-id="${t.id}">&times;</div>
                        <div class="stat-label">${t.exercise}</div>
                        <div class="stat-value" style="font-size: 1.2rem;">${pr} / ${t.target_weight}kg</div>
                        <div class="target-progress-bg">
                            <div class="target-progress-bar" style="width: ${progress}%"></div>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${progress}% complété</div>
                    `;
                    grid.appendChild(div);
                });

                document.querySelectorAll('.target-delete').forEach(btn => {
                    btn.onclick = async () => {
                        const id = btn.getAttribute('data-id');
                        if (confirm('Supprimer cet objectif ?')) {
                            const res = await fetch(`/api/targets/${id}`, { method: 'DELETE' });
                            if (res.ok) renderGymData();
                        }
                    };
                });
            };

            const renderWeightChart = (wData) => {
                const canvas = document.getElementById('weightChart');
                if (!canvas || typeof Chart === 'undefined') return;

                if (!weightChart) {
                    weightChart = new Chart(canvas, {
                        type: 'line',
                        data: {
                            labels: wData.map(d => d.date),
                            datasets: [{
                                label: 'Poids (kg)',
                                data: wData.map(d => d.weight),
                                borderColor: '#a855f7',
                                tension: 0.4,
                                fill: true,
                                backgroundColor: 'rgba(168, 85, 247, 0.1)'
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false }
                    });
                } else {
                    weightChart.data.labels = wData.map(d => d.date);
                    weightChart.data.datasets[0].data = wData.map(d => d.weight);
                    weightChart.update();
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
                gymForm.onsubmit = async e => {
                    e.preventDefault();
                    const entry = {
                        date: document.getElementById('gym-date').value,
                        exercise: document.getElementById('gym-exercise').value,
                        category: document.getElementById('gym-category').value,
                        weight: parseFloat(document.getElementById('gym-weight').value),
                        reps: parseInt(document.getElementById('gym-reps').value),
                    };

                    try {
                        const response = await fetch('/api/gym', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(entry)
                        });
                        if (response.ok) {
                            renderGymData();
                            gymForm.reset();
                            modal.classList.remove('active');
                            showToast('Séance enregistrée !');
                        }
                    } catch (err) { showToast('Erreur sauvegarde', 'error'); }
                };
            }

            // Advanced 1RM Tool Logic
            const calcWeight = document.getElementById('calc-weight');
            const calcReps = document.getElementById('calc-reps');
            const calcResult = document.getElementById('calc-1rm-result');
            const calcTable = document.getElementById('calc-percentages-table');

            if (calcWeight && calcReps && calcResult && calcTable) {
                const updateCalc = () => {
                    const w = parseFloat(calcWeight.value);
                    const r = parseInt(calcReps.value);
                    if (!w || !r) {
                        calcResult.textContent = '-- kg';
                        calcTable.innerHTML = '';
                        return;
                    }

                    const orm = calculateOneRM(w, r);
                    calcResult.textContent = `${orm} kg`;

                    let tableHtml = '<tr><th>Pourcentage</th><th>Poids</th><th>Reps Est.</th></tr>';
                    const percs = [100, 95, 90, 85, 80, 75, 70, 65, 60];
                    const repsEst = [1, 2, 4, 6, 8, 10, 12, 16, 20];

                    percs.forEach((p, idx) => {
                        tableHtml += `<tr><td>${p}%</td><td>${Math.round(orm * (p / 100))}kg</td><td>${repsEst[idx]}</td></tr>`;
                    });
                    calcTable.innerHTML = tableHtml;
                };
                calcWeight.oninput = calcReps.oninput = updateCalc;
            }

            // History Search
            const historySearch = document.getElementById('history-search');
            if (historySearch) {
                historySearch.oninput = async () => {
                    const data = await getGymData();
                    renderHistoryTable(data, historySearch.value);
                };
            }

            // Target Modal
            const openTargetBtn = document.getElementById('open-target-modal');
            const targetModal = document.getElementById('target-modal');
            const targetModalClose = document.getElementById('target-modal-close');
            const targetForm = document.getElementById('target-form');

            if (openTargetBtn && targetModal) {
                openTargetBtn.onclick = () => targetModal.classList.add('active');
                if (targetModalClose) targetModalClose.onclick = () => targetModal.classList.remove('active');
            }

            if (targetForm) {
                targetForm.onsubmit = async (e) => {
                    e.preventDefault();
                    const entry = {
                        exercise: document.getElementById('target-exercise').value,
                        target_weight: parseFloat(document.getElementById('target-weight').value)
                    };
                    const res = await fetch('/api/targets', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(entry)
                    });
                    if (res.ok) {
                        renderGymData();
                        targetForm.reset();
                        targetModal.classList.remove('active');
                        showToast('Objectif ajouté !');
                    }
                };
            }

            // Weight Modal & Form
            const openWeightBtn = document.getElementById('open-weight-modal');
            const weightModal = document.getElementById('weight-modal');
            const weightModalClose = document.getElementById('weight-modal-close');
            const weightForm = document.getElementById('weight-form');

            if (openWeightBtn && weightModal) {
                openWeightBtn.onclick = () => {
                    weightModal.classList.add('active');
                    document.getElementById('body-date').valueAsDate = new Date();
                };
                if (weightModalClose) weightModalClose.onclick = () => weightModal.classList.remove('active');
            }

            if (weightForm) {
                weightForm.onsubmit = async (e) => {
                    e.preventDefault();
                    const entry = {
                        date: document.getElementById('body-date').value,
                        weight: parseFloat(document.getElementById('body-weight').value)
                    };
                    try {
                        const response = await fetch('/api/weight', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(entry)
                        });
                        if (response.ok) {
                            renderGymData();
                            weightForm.reset();
                            weightModal.classList.remove('active');
                            showToast('Poids enregistré !');
                        }
                    } catch (err) { showToast('Erreur sauvegarde poids', 'error'); }
                };
            }

            // Export/Import
            const exBtn = document.getElementById('export-btn');
            const imBtn = document.getElementById('import-btn');
            const imFl = document.getElementById('import-file');
            if (exBtn) {
                exBtn.onclick = async () => {
                    const data = await getGymData();
                    const blob = new Blob([JSON.stringify({ gym: data }, null, 2)], { type: 'application/json' });
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
                    r.onload = async (ev) => {
                        try {
                            const data = JSON.parse(ev.target.result);
                            if (data.gym) {
                                const response = await fetch('/api/gym/import', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ entries: data.gym })
                                });
                                if (response.ok) {
                                    renderGymData();
                                    showToast('Données importées', 'success');
                                }
                            }
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

    // 7. Gallery & Lightbox (collection.html)
    try {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const galleryItems = document.querySelectorAll('.gallery-item');
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxClose = document.querySelector('.lightbox-close');

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

        if (lightbox && lightboxImg && galleryItems.length > 0) {
            galleryItems.forEach(item => {
                item.onclick = () => {
                    const src = item.querySelector('img').src;
                    lightboxImg.src = src;
                    lightbox.classList.add('active');
                };
            });
            if (lightboxClose) lightboxClose.onclick = () => lightbox.classList.remove('active');
            lightbox.onclick = (e) => { if (e.target === lightbox) lightbox.classList.remove('active'); };
        }
    } catch (e) { console.error("Gallery Error:", e); }

    // 8. Sub-navigation & Smooth Scroll (gym.html)
    try {
        const subNavLinks = document.querySelectorAll('.sub-nav a');
        const sections = document.querySelectorAll('.section-container');

        if (subNavLinks.length > 0) {
            subNavLinks.forEach(link => {
                link.onclick = (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').substring(1);
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        window.scrollTo({
                            top: targetSection.offsetTop - 150,
                            behavior: 'smooth'
                        });
                    }
                };
            });

            const highlightSubNav = () => {
                let current = "";
                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    if (window.scrollY >= sectionTop - 200) {
                        current = section.getAttribute('id');
                    }
                });
                subNavLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href').substring(1) === current) {
                        link.classList.add('active');
                    }
                });
            };
            window.addEventListener('scroll', highlightSubNav);
            highlightSubNav();
        }
    } catch (e) { console.error("SubNav Error:", e); }

    // 9. Page Transitions
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
