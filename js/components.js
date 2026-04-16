/**
 * NEXUS WEB COMPONENTS
 * Architecture logic for deduplicating HTML
 */

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
    'assets/videos/Invincible Variants background video.mp4'
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
      
      <!-- Video Motivation Layer -->
      <video id="motivationVideo" playsinline style="position:fixed; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index: 2; opacity:0; transition: opacity 2s ease; pointer-events:none;">
        <source id="videoSource" src="${NEXUS_PLAYLIST[0]}" type="video/mp4">
      </video>
      <canvas id="nexusVisualizer"></canvas>
    `;

    // Visualizer Logic
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
                requestAnimationFrame(draw);
                if (video.paused || video.muted || video.style.opacity === '0') {
                    ctx.clearRect(0,0, canvas.width, canvas.height);
                    return;
                }

                analyser.getByteFrequencyData(dataArray);
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const barWidth = (canvas.width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color') || '#00d4ff';

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = dataArray[i] / 2;
                    ctx.fillStyle = accentColor;
                    ctx.globalAlpha = 0.5;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
            };

            const resize = () => {
                canvas.width = window.innerWidth;
                canvas.height = 60;
            };
            window.addEventListener('resize', resize);
            resize();
            draw();
            audioInited = true;
        } catch(e) { console.log("Visualizer blocked or error", e); }
    };

    // Auto-load logic (Muted by default if setting says so)
    window.addEventListener('load', () => {
        const video = document.getElementById('motivationVideo');
        if (!video) return;

        // Interaction wrapper to start AudioContext
        document.addEventListener('click', initVisualizer, { once: true });
        document.addEventListener('touchstart', initVisualizer, { once: true });

        const savedIndex = parseInt(localStorage.getItem('nexus-video-index') || '0');
        const savedTime = localStorage.getItem('nexus-video-time') || 0;
        const savedMode = localStorage.getItem('nexus-motivation-mode') === 'true';
        const isGlobalMute = localStorage.getItem('nexus-mute') === 'true';
        const bgMode = localStorage.getItem('nexus-bg-video-mode') || 'playlist';

        // Restore correct video source
        const validIndex = savedIndex % NEXUS_PLAYLIST.length;
        video.src = NEXUS_PLAYLIST[validIndex];
        video.currentTime = parseFloat(savedTime);
        video.muted = isGlobalMute || !savedMode;
        video.loop = bgMode === 'fixed';

        const startPlayback = () => {
            video.play().catch(e => console.log("Autoplay blocked"));
            if (savedMode) {
                video.style.opacity = '0.5';
                isMotivationMode = true;
                if(document.getElementById('starsCanvas')) document.getElementById('starsCanvas').style.opacity = '0.3';
            }
        };

        video.addEventListener('loadedmetadata', startPlayback, { once: true });

        // Handle video end to alternate (only if NOT in fixed loop mode)
        video.addEventListener('ended', () => {
            if (bgMode === 'playlist') {
                const nextIndex = (validIndex + 1) % NEXUS_PLAYLIST.length;
                localStorage.setItem('nexus-video-index', nextIndex);
                localStorage.setItem('nexus-video-time', '0');
                
                // Direct source update with fade
                video.style.opacity = '0';
                setTimeout(() => {
                    video.src = NEXUS_PLAYLIST[nextIndex];
                    video.play();
                    video.style.opacity = savedMode ? '0.5' : '0';
                }, 2000);
            }
        });

        // Save time periodically
        setInterval(() => {
            if (video && !video.paused) {
                localStorage.setItem('nexus-video-time', video.currentTime);
            }
        }, 1000);

        // PWA Registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Registration failed', err));
        }
    });
  }
}

let isMotivationMode = false;
window.toggleMotivationMode = () => {
    const video = document.getElementById('motivationVideo');
    const stars = document.getElementById('starsCanvas');
    if (!video) return;

    const isGlobalMute = localStorage.getItem('nexus-mute') === 'true';
    const bgMode = localStorage.getItem('nexus-bg-video-mode') || 'playlist';

    if (!isMotivationMode) {
        // Sélection Aléatoire uniquement si mode playlist
        if (bgMode === 'playlist') {
            const randomIndex = Math.floor(Math.random() * NEXUS_PLAYLIST.length);
            localStorage.setItem('nexus-video-index', randomIndex);
            localStorage.setItem('nexus-video-time', '0');
            video.src = NEXUS_PLAYLIST[randomIndex];
            video.loop = false;
        } else {
            video.loop = true;
        }
        
        video.style.opacity = '0.5';
        video.muted = isGlobalMute;
        video.play();
        
        if(stars) stars.style.opacity = '0.3';
        isMotivationMode = true;
        localStorage.setItem('nexus-motivation-mode', 'true');
    } else {
        video.style.opacity = '0';
        video.muted = true;
        if(stars) stars.style.opacity = '1';
        isMotivationMode = false;
        localStorage.setItem('nexus-motivation-mode', 'false');
    }
};

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
    const pools = {
      encouraging: [
        "Ne lâche rien ! Chaque répétition compte.",
        "La constance est la clé de la transformation.",
        "Nexus est fier de ton parcours today.",
        "Le volume d'entraînement est ton meilleur allié.",
        "N'oublie pas de t'hydrater, Soldat.",
        "La seule mauvaise séance est celle que tu n'as pas faite.",
        "Visualise ta réussite avant chaque série."
      ],
      military: [
        "Soldat ! Reprenez le rythme. Pas de repos pour les braves.",
        "L'acier ne ment jamais. Poussez plus fort !",
        "Discipline au-dessus de tout. Exécution immédiate.",
        "Nexus n'accepte que l'excellence. Dépassez vos limites.",
        "Hydratez-vous. C'est un ordre.",
        "La douleur est une information. Gérez-la.",
        "Rapport de mission : Volume insuffisant. Augmentez la charge."
      ],
      sarcastic: [
        "Oh, une autre série ? J'espère que celle-là compte.",
        "Nexus enregistre tout... même vos pauses trop longues.",
        "Incroyable. Vous avez vraiment l'intention de soulever ça ?",
        "L'hydratation, c'est pour les faibles ? Non, buvez un coup.",
        "Votre rythme cardiaque est... intéressant. On s'amuse bien ?",
        "Ne mourez pas tout de suite, les stats sont en cours.",
        "C'est ça votre maximum ? J'ai vu des robots plus lents."
      ]
    };

    const personality = localStorage.getItem('nexus-assistant-personality') || 'encouraging';
    const messages = pools[personality] || pools.encouraging;

    // Determine which character to show (saved variant or default)
    const savedVariant = localStorage.getItem('nexus-variant');
    const VARIANT_CHARS = {
      allen:              'assets/images/person/Allen.png',
      eve:                'assets/images/person/Eve.png',
      robot:              'assets/images/person/Robot.png',
      zack:               'assets/images/person/Zack.png',
      invincible_classic: 'assets/images/person/Invincible.png',
      invincible_blue:    'assets/images/person/Invincible Blue.png',
      omniman:            'assets/images/person/Omniman.png',
      conquest:           'assets/images/person/Conquest.png',
      thragg:             'assets/images/person/Thragg.png',
    };
    const charSrc = (savedVariant && VARIANT_CHARS[savedVariant])
      ? VARIANT_CHARS[savedVariant]
      : 'assets/images/person/Invincible.png';

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
    
    // Restore Position
    const savedPos = JSON.parse(localStorage.getItem('nexus-assistant-pos'));
    if (savedPos) {
      wrapper.style.bottom = 'auto';
      wrapper.style.right = 'auto';
      wrapper.style.left = savedPos.x + 'px';
      wrapper.style.top = savedPos.y + 'px';
    }

    let isDragging = false;
    let startX, startY;
    let initialX, initialY;
    let moved = false;

    const onStart = (e) => {
      // Prevent default browser dragging of images
      if (e.cancelable) e.preventDefault();
      
      isDragging = true;
      moved = false;
      const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
      
      startX = clientX;
      startY = clientY;
      
      const rect = wrapper.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      wrapper.classList.add('dragging');
      wrapper.style.transition = 'none'; // Disable transition for snap-to-mouse
    };

    const onMove = (e) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
      
      const dx = clientX - startX;
      const dy = clientY - startY;
      
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      
      wrapper.style.bottom = 'auto';
      wrapper.style.right = 'auto';
      wrapper.style.left = (initialX + dx) + 'px';
      wrapper.style.top = (initialY + dy) + 'px';
    };

    const onEnd = (e) => {
      if (!isDragging) return;
      isDragging = false;
      wrapper.classList.remove('dragging');
      wrapper.style.transition = ''; // Restore transition
      
      // Save Position
      const rect = wrapper.getBoundingClientRect();
      localStorage.setItem('nexus-assistant-pos', JSON.stringify({ x: rect.left, y: rect.top }));
      
      if (!moved) {
        // Handle Click Logic
        scaler.classList.add('vibrating');
        if (window.toggleMotivationMode) window.toggleMotivationMode();
        this.showMessage(messages);
        setTimeout(() => scaler.classList.remove('vibrating'), 300);
      }
    };

    container.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    
    container.addEventListener('touchstart', onStart);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onEnd);

    // Affichage cyclique (toutes les 45s)
    setInterval(() => {
      this.showMessage(messages);
    }, 45000);

    // Premier message après 5s
    setTimeout(() => this.showMessage(messages), 5000);
  }

  showMessage(messages) {
    const bubble = this.querySelector('#assistantBubble');
    if (!bubble) return;
    
    // Si déjà active, on la cache d'abord
    bubble.classList.remove('active');
    
    setTimeout(() => {
      const username = localStorage.getItem('nexus-username') || 'Soldat';
      const lastExo = localStorage.getItem('nexus-last-exo');
      let msg = messages[Math.floor(Math.random() * messages.length)];
      
      // Memory Integration
      if (lastExo && Math.random() > 0.7) {
        msg = `Ta dernière séance de ${lastExo} était impressionnante. Prêt à faire mieux ?`;
      }

      bubble.textContent = `${username}, ${msg.toLowerCase()}`;
      bubble.classList.add('active');
      
      // Cacher après 8s
      setTimeout(() => bubble.classList.remove('active'), 8000);
    }, 300);
  }
}

// Define custom elements
customElements.define('nexus-navbar', NexusNavbar);
customElements.define('nexus-background', NexusBackground);
customElements.define('nexus-footer', NexusFooter);
customElements.define('nexus-assistant', NexusAssistant);
