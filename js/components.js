/**
 * NEXUS WEB COMPONENTS - v4.1 (ES Module)
 * Emergency Fix: Restored global functions and video logic.
 */

import { nexusAssistant } from './modules/ai/assistant.js';

/* =============================================
   SYSTEM FUNCTIONS (Global scope equivalent)
   ============================================= */
let isMotivationMode = localStorage.getItem('nexus-motivation-mode') === 'true';

window.toggleMotivationMode = (forceState) => {
    const video = document.getElementById('motivationVideo');
    const stars = document.getElementById('starsCanvas');
    if (!video) return;

    const isGlobalMute = localStorage.getItem('nexus-mute') === 'true';
    const bgMode = localStorage.getItem('nexus-bg-video-mode') || 'playlist';

    if (forceState !== undefined) isMotivationMode = !forceState;

    if (!isMotivationMode) {
        // Turn ON - SELECT RANDOM VIDEO
        const randomIndex = Math.floor(Math.random() * NEXUS_PLAYLIST.length);
        localStorage.setItem('nexus-video-index', randomIndex);
        localStorage.setItem('nexus-video-time', '0');
        
        video.src = NEXUS_PLAYLIST[randomIndex];
        video.style.opacity = '0.5';
        video.muted = isGlobalMute;
        video.play().catch(() => console.log("Play failed"));
        
        if(stars) stars.style.opacity = '0.3';
        isMotivationMode = true;
        localStorage.setItem('nexus-motivation-mode', 'true');
    } else {
        // Turn OFF
        video.style.opacity = '0';
        video.muted = true;
        if(stars) stars.style.opacity = '1';
        isMotivationMode = false;
        localStorage.setItem('nexus-motivation-mode', 'false');
    }
};

/* =============================================
   COMPONENTS
   ============================================= */

class NexusNavbar extends HTMLElement {
  connectedCallback() {
    const activePage = this.getAttribute('active') || 'home';
    this.innerHTML = `
      <nav class="navbar">
        <a href="index.html" class="nav-logo" aria-label="Retour à l'accueil CORE OPS">
          <span class="logo-icon" aria-hidden="true">⬡</span>
          <span class="logo-text">CORE OPS</span>
        </a>
        <ul class="nav-links">
          <li><a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}"><span class="nav-num">🏠</span>DASHBOARD</a></li>
          <li><a href="training.html" class="nav-link ${activePage === 'training' ? 'active' : ''}"><span class="nav-num">💪</span>TRAINING</a></li>
          <li><a href="recipes.html" class="nav-link ${activePage === 'recipes' ? 'active' : ''}"><span class="nav-num">🥗</span>RECETTES</a></li>
          <li><a href="network.html" class="nav-link ${activePage === 'network' ? 'active' : ''}"><span class="nav-num">🌐</span>NEBULA LINK</a></li>
          <li><a href="gallery.html" class="nav-link ${activePage === 'gallery' ? 'active' : ''}"><span class="nav-num">🎨</span>VISUAL ARCHIVE</a></li>
        </ul>
        <div class="nav-status">
          <span class="status-dot"></span>
          <span class="status-text">ONLINE</span>
          <a href="settings.html" class="nav-settings-cog ${activePage === 'settings' ? 'active' : ''}" title="Paramètres">⚙️</a>
        </div>
      </nav>
    `;
  }
}

const NEXUS_PLAYLIST = [
    'assets/videos/Teck-jacket background video.mp4',
    'assets/videos/Invincible Variants background video.mp4',
    'assets/videos/Invincible Variants Background video 2.mp4',
    'assets/videos/Join the Viltrumite background video.mp4',
];

class NexusBackground extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <canvas id="starsCanvas"></canvas>
      <div class="planet planet-1"></div>
      <div class="planet planet-2"></div>
      <div class="nebula nebula-1"></div>
      <div class="nebula nebula-2"></div>
      <div id="intensityOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; transition: background 2s; background: rgba(255, 60, 60, calc(var(--bg-intensity, 0) * 0.1)); z-index: 1;"></div>
      
      <video id="motivationVideo" playsinline style="position:fixed; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index: 2; opacity:0; transition: opacity 2s ease; pointer-events:none;">
        <source id="videoSource" src="${NEXUS_PLAYLIST[0]}" type="video/mp4">
      </video>
      <canvas id="nexusVisualizer"></canvas>
    `;

    let audioInited = false;
    const initVisualizer = () => {
        if (audioInited) return;
        const video = document.getElementById('motivationVideo');
        if (!video) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContext();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaElementSource(video);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const canvas = document.getElementById('nexusVisualizer');
            const ctx = canvas.getContext('2d');

            const draw = () => {
                if (document.hidden) { requestAnimationFrame(draw); return; }
                requestAnimationFrame(draw);
                if (video.paused || video.muted || video.style.opacity === '0') {
                    ctx.clearRect(0,0, canvas.width, canvas.height);
                    return;
                }
                analyser.getByteFrequencyData(dataArray);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const barWidth = (canvas.width / bufferLength) * 2.5;
                let x = 0;
                const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color') || '#00d4ff';
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = dataArray[i] / 2;
                    ctx.fillStyle = accentColor;
                    ctx.globalAlpha = 0.5;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
            };
            const resize = () => { canvas.width = window.innerWidth; canvas.height = 60; };
            window.addEventListener('resize', resize);
            resize();
            draw();
            audioInited = true;
        } catch(e) { console.log("Visualizer blocked"); }
    };

    window.addEventListener('load', () => {
        const video = document.getElementById('motivationVideo');
        if (!video) return;

        document.addEventListener('click', initVisualizer, { once: true });
        document.addEventListener('touchstart', initVisualizer, { once: true });

        const savedIndex = parseInt(localStorage.getItem('nexus-video-index') || '0');
        const savedTime = localStorage.getItem('nexus-video-time') || 0;
        const savedMode = localStorage.getItem('nexus-motivation-mode') === 'true';
        const isGlobalMute = localStorage.getItem('nexus-mute') === 'true';

        video.src = NEXUS_PLAYLIST[savedIndex % NEXUS_PLAYLIST.length];
        video.currentTime = parseFloat(savedTime);
        video.muted = isGlobalMute || !savedMode;

        video.play().then(() => {
            if (savedMode) {
                video.style.opacity = '0.5';
                if(document.getElementById('starsCanvas')) document.getElementById('starsCanvas').style.opacity = '0.3';
            }
        }).catch(() => console.log("Autoplay blocked"));

        video.addEventListener('ended', () => {
            const bgMode = localStorage.getItem('nexus-bg-video-mode') || 'playlist';
            if (bgMode === 'playlist') {
                const nextIndex = (parseInt(localStorage.getItem('nexus-video-index') || '0') + 1) % NEXUS_PLAYLIST.length;
                localStorage.setItem('nexus-video-index', nextIndex);
                localStorage.setItem('nexus-video-time', '0');
                
                video.style.opacity = '0';
                setTimeout(() => {
                    video.src = NEXUS_PLAYLIST[nextIndex];
                    video.play();
                    // Keep motivation mode opacity if active
                    const savedMode = localStorage.getItem('nexus-motivation-mode') === 'true';
                    video.style.opacity = savedMode ? '0.5' : '0';
                }, 1500);
            }
        });

        setInterval(() => {
            if (video && !video.paused) localStorage.setItem('nexus-video-time', video.currentTime);
        }, 1000);
    });
  }
}

class NexusFooter extends HTMLElement {
  connectedCallback() {
    const pageName = this.getAttribute('page') || 'SYSTEM';
    this.innerHTML = `
      <footer class="site-footer">
        <div class="footer-grid">
          <div class="footer-coord">MODULE — ${pageName.toUpperCase()}</div>
          <div class="footer-copy">© CORE OPS INTERFACE — 2026</div>
          <div class="footer-status">SYS:OK · NET:LOCAL · SEC:HIGH</div>
        </div>
      </footer>
    `;
  }
}

class NexusAssistant extends HTMLElement {
  connectedCallback() {
    const charSrc = nexusAssistant.getCharImage();

    this.innerHTML = `
      <div class="assistant-wrapper">
        <div class="assistant-bubble" id="assistantBubble"></div>
        <div class="assistant-container" id="invincibleCont">
          <div class="assistant-scaler" id="invincibleScaler">
            <img src="${charSrc}" alt="Assistant Holographique Nexus" class="hologram" loading="lazy">
          </div>
        </div>
      </div>
    `;

    const wrapper = this.querySelector('.assistant-wrapper');
    const container = this.querySelector('#invincibleCont');
    const scaler = this.querySelector('#invincibleScaler');
    
    const savedPos = JSON.parse(localStorage.getItem('nexus-assistant-pos'));
    if (savedPos) {
      wrapper.style.bottom = 'auto'; wrapper.style.right = 'auto';
      wrapper.style.left = savedPos.x + 'px'; wrapper.style.top = savedPos.y + 'px';
    }

    let isDragging = false, startX, startY, initialX, initialY, moved = false;

    const onStart = (e) => {
      if (e.cancelable) e.preventDefault();
      isDragging = true; moved = false;
      const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
      startX = clientX; startY = clientY;
      const rect = wrapper.getBoundingClientRect();
      initialX = rect.left; initialY = rect.top;
      wrapper.classList.add('dragging');
      wrapper.style.transition = 'none';
    };

    const onMove = (e) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
      const dx = clientX - startX, dy = clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      wrapper.style.left = (initialX + dx) + 'px';
      wrapper.style.top = (initialY + dy) + 'px';
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      wrapper.classList.remove('dragging');
      wrapper.style.transition = '';
      const rect = wrapper.getBoundingClientRect();
      localStorage.setItem('nexus-assistant-pos', JSON.stringify({ x: rect.left, y: rect.top }));
      
      if (!moved) {
        scaler.classList.add('vibrating');
        if (window.toggleMotivationMode) window.toggleMotivationMode();
        this.showMessage();
        setTimeout(() => scaler.classList.remove('vibrating'), 300);
      }
    };

    container.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    container.addEventListener('touchstart', onStart);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onEnd);

    setInterval(() => this.showMessage(), 45000);
    setTimeout(() => this.showMessage(), 5000);
  }

  showMessage() {
    const bubble = this.querySelector('#assistantBubble');
    if (!bubble) return;
    bubble.classList.remove('active');
    setTimeout(() => {
      bubble.textContent = nexusAssistant.generateMessage();
      bubble.classList.add('active');
      setTimeout(() => bubble.classList.remove('active'), 8000);
    }, 300);
  }
}

customElements.define('nexus-navbar', NexusNavbar);
customElements.define('nexus-background', NexusBackground);
customElements.define('nexus-footer', NexusFooter);
customElements.define('nexus-assistant', NexusAssistant);
