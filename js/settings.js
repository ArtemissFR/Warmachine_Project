import { State } from './modules/core/state.js';

/**
 * NEXUS - Settings Module Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    // SAVE BIO-DATA
    document.getElementById('saveBioData').addEventListener('click', () => {
        const name = document.getElementById('setName').value.trim();
        const gender = document.getElementById('setGender').value;
        const age = document.getElementById('setAge').value;
        const height = document.getElementById('setHeight').value;
        
        State.set('nexus-username', name);
        State.set('nexus-user-gender', gender);
        State.set('nexus-user-age', age);
        State.set('nexus-user-height', height);
        
        showNotification('Bio-Data mis à jour !');
    });

    // SAVE GOALS & WEIGHT
    document.getElementById('saveGoalData').addEventListener('click', () => {
        const goal = document.getElementById('setGoal').value;
        const weightGoal = document.getElementById('setWeightGoal').value;
        State.set('nexus-training-goal', goal);
        State.set('nexus-weight-goal', weightGoal);

        const currentWeight = parseFloat(document.getElementById('setWeightCurrent').value);
        if (!isNaN(currentWeight)) {
            const history = JSON.parse(localStorage.getItem('nexus-weight-history') || '[]');
            const lastEntry = history.length > 0 ? history[history.length - 1] : null;
            if (!lastEntry || parseFloat(lastEntry.val) !== currentWeight) {
                history.push({ 
                    date: new Date().toLocaleDateString('fr-FR'), 
                    val: currentWeight.toFixed(1) 
                });
                localStorage.setItem('nexus-weight-history', JSON.stringify(history));
            }
        }
        showNotification('Objectifs enregistrés !');
    });

    // APPARENCE (Sync with theme.js variables)
    const themeBtn = document.getElementById('page-theme-toggle');
    themeBtn.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const newTheme = isLight ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        State.set('nexus-theme', newTheme);
        themeBtn.innerHTML = newTheme === 'light' ? '☀️ Clair' : '🌙 Sombre';
    });

    const accentPicker = document.getElementById('page-accent-picker');
    accentPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        // Use theme system: accent + computed complementary for --neon-blue
        if (window.nexusTheme) nexusTheme.applyAccent(color);
        else applyAccentColor(color);
        localStorage.setItem('nexus-accent', color);
        // Clear saved variant so secondary is recomputed next time
        localStorage.removeItem('nexus-variant');
    });

    // VARIANTS
    const VARIANTS = {
        allen: { p: '#FF9F43', s: '#2E86DE' },
        eve:   { p: '#FF69B4', s: '#EE5253' },
        robot: { p: '#D35400', s: '#27AE60' },
        zack:  { p: '#5D9CEC', s: '#4A89DC' },
        invincible_classic: { p: '#F6B93B', s: '#0A3D62' },
        invincible_blue: { p: '#1E3799', s: '#0C2461' },
        omniman: { p: '#B71C1C', s: '#F5F5F5' },
        conquest: { p: '#AEB6BF', s: '#4D5656' },
        thragg: { p: '#6B1B1B', s: '#D4AF37' }
    };



    // Ensure overlay exists
    let overlay = document.querySelector('.reveal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'reveal-overlay';
        document.body.appendChild(overlay);
    }

    document.querySelectorAll('.variant-head').forEach(btn => {
        btn.addEventListener('click', () => {
            const v = btn.getAttribute('data-variant');
            const data = VARIANTS[v];
            if (data) {
                // PHANTOM REVEAL LOGIC
                const rect = btn.getBoundingClientRect();
                const phantom = document.createElement('div');
                phantom.className = 'hero-reveal-phantom';
                
                // Copy computed styles for reliability
                const computedStyle = window.getComputedStyle(btn);
                phantom.style.backgroundImage = computedStyle.backgroundImage;
                phantom.style.top = rect.top + 'px';
                phantom.style.left = rect.left + 'px';
                phantom.style.width = rect.width + 'px';
                phantom.style.height = rect.height + 'px';
                
                document.body.appendChild(phantom);
                overlay.classList.add('active');
                
                phantom.addEventListener('animationend', () => {
                    phantom.remove();
                    overlay.classList.remove('active');
                });


                // Apply accent + predefined secondary colour for this variant
                if (window.nexusTheme) {
                    nexusTheme.applyAccent(data.p, data.s);
                    nexusTheme.applyCharacter(v);
                } else {
                    applyAccentColor(data.p);
                }
                State.set('nexus-accent', data.p);
                State.set('nexus-variant', v);

                document.querySelectorAll('.variant-head').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                showNotification(`Thème : ${v.toUpperCase()} activé !`);
            }
        });
    });




    // Fallback if nexusTheme not loaded yet
    function applyAccentColor(hex) {
        document.documentElement.style.setProperty('--accent-color', hex);
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        document.documentElement.style.setProperty('--accent-r', r);
        document.documentElement.style.setProperty('--accent-g', g);
        document.documentElement.style.setProperty('--accent-b', b);
        if (window.nexusTheme) {
            const secondary = nexusTheme.computeComplementary(hex);
            document.documentElement.style.setProperty('--neon-blue', secondary);
        }
    }

    // SOUND
    const soundBtn = document.getElementById('sound-toggle');
    soundBtn.addEventListener('click', () => {
        const isMuted = localStorage.getItem('nexus-mute') === 'true';
        const newMuted = !isMuted;
        localStorage.setItem('nexus-mute', newMuted);
        soundBtn.innerHTML = newMuted ? '🔇 Coupé' : '🔊 Activé';
        
        // Immediate apply if possible
        const video = document.getElementById('motivationVideo');
        if (video) video.muted = newMuted;
    });

    // VIDEO MODE
    const bgVideoMode = document.getElementById('bgVideoMode');
    const fixedVideoRow = document.getElementById('fixedVideoRow');
    const bgVideoSelect = document.getElementById('bgVideoSelect');

    bgVideoMode.addEventListener('change', () => {
        const mode = bgVideoMode.value;
        localStorage.setItem('nexus-bg-video-mode', mode);
        fixedVideoRow.style.display = mode === 'fixed' ? 'flex' : 'none';
        
        if (mode === 'fixed') {
             // Reset to selected video instantly
             localStorage.setItem('nexus-video-index', bgVideoSelect.value);
             localStorage.setItem('nexus-video-time', '0');
        }
    });

    bgVideoSelect.addEventListener('change', () => {
        localStorage.setItem('nexus-video-index', bgVideoSelect.value);
        localStorage.setItem('nexus-video-time', '0');
    });

    // SCAN INTENSITY
    const scanRange = document.getElementById('scanIntensity');
    scanRange.addEventListener('input', (e) => {
        const val = e.target.value / 100;
        document.documentElement.style.setProperty('--scan-opacity', val);
        localStorage.setItem('nexus-scan-intensity', val);
    });

    // PERFORMANCE MODE
    const perfBtn = document.getElementById('perf-mode-toggle');
    perfBtn.addEventListener('click', () => {
        const isEpic = localStorage.getItem('nexus-perf-mode') !== 'low';
        const newMode = isEpic ? 'low' : 'epic';
        localStorage.setItem('nexus-perf-mode', newMode);
        perfBtn.innerHTML = newMode === 'low' ? '🚀 Optimisé' : '🚀 Épic';
        nexus.notify(`Mode ${newMode === 'low' ? 'Performance' : 'Élite'} activé. Rafraîchir pour appliquer.`, "info");
    });

    // ASSISTANT PERSONALITY
    const personalitySelect = document.getElementById('assistantPersonality');
    personalitySelect.addEventListener('change', () => {
        localStorage.setItem('nexus-assistant-personality', personalitySelect.value);
        showNotification('Personnalité de l\'assistant mise à jour !');
    });

});

function loadSettings() {
    const name = localStorage.getItem('nexus-username') || '';
    document.getElementById('setName').value = name;

    const goal = localStorage.getItem('nexus-training-goal') || 'maintenance';
    document.getElementById('setGoal').value = goal;

    const weightGoal = localStorage.getItem('nexus-weight-goal') || '';
    document.getElementById('setWeightGoal').value = weightGoal;

    const history = JSON.parse(localStorage.getItem('nexus-weight-history') || '[]');
    const currentWeight = history.length > 0 ? history[history.length - 1].val : '';
    document.getElementById('setWeightCurrent').value = currentWeight;

    document.getElementById('setGender').value = localStorage.getItem('nexus-user-gender') || 'M';
    document.getElementById('setAge').value = localStorage.getItem('nexus-user-age') || '';
    document.getElementById('setHeight').value = localStorage.getItem('nexus-user-height') || '';

    const currentTheme = localStorage.getItem('nexus-theme') || 'dark';
    document.getElementById('page-theme-toggle').innerHTML = currentTheme === 'light' ? '☀️ Clair' : '🌙 Sombre';

    const currentAccent = localStorage.getItem('nexus-accent') || '#00d4ff';
    document.getElementById('page-accent-picker').value = currentAccent;

    const isMuted = localStorage.getItem('nexus-mute') === 'true';
    document.getElementById('sound-toggle').innerHTML = isMuted ? '🔇 Coupé' : '🔊 Activé';

    const currentVGMode = localStorage.getItem('nexus-bg-video-mode') || 'playlist';
    document.getElementById('bgVideoMode').value = currentVGMode;
    document.getElementById('fixedVideoRow').style.display = currentVGMode === 'fixed' ? 'flex' : 'none';

    const currentVGIndex = localStorage.getItem('nexus-video-index') || '0';
    document.getElementById('bgVideoSelect').value = currentVGIndex;

    const scanInt = localStorage.getItem('nexus-scan-intensity') || '1';
    document.getElementById('scanIntensity').value = scanInt * 100;

    const perfMode = localStorage.getItem('nexus-perf-mode') || 'epic';
    document.getElementById('perf-mode-toggle').innerHTML = perfMode === 'low' ? '🚀 Optimisé' : '🚀 Épic';

    const personality = localStorage.getItem('nexus-assistant-personality') || 'encouraging';
    document.getElementById('assistantPersonality').value = personality;
}

function showNotification(msg) {
    // Reusing PR notification style for settings? 
    // Let's just use a simple alert or console for now, or create a quick one.
    const note = document.createElement('div');
    note.className = 'pr-notification active';
    note.style.top = '100px';
    note.innerHTML = `<div class="pr-badge">INFO</div><div style="color:white;font-size:0.8rem;">${msg}</div>`;
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 2500);
}
