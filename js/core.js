/**
 * NEXUS CORE FRAMEWORK
 * Global utilities for effects, transitions, and notifications.
 */

const throttle = (func, limit) => {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    }
};

window.nexus = {
    /**
     * SYSTEM NOTIFICATIONS
     */
    notify: function(message, type = 'info') {
        const container = document.querySelector('.nexus-notification-container');
        if (!container) {
            const newContainer = document.createElement('div');
            newContainer.className = 'nexus-notification-container';
            document.body.appendChild(newContainer);
            return this.notify(message, type);
        }

        const toast = document.createElement('div');
        toast.className = 'nexus-toast';
        if (type === 'success') toast.style.borderLeftColor = 'var(--neon-green)';
        if (type === 'error') toast.style.borderLeftColor = '#ff4d4d';
        if (type === 'warning') toast.style.borderLeftColor = 'var(--neon-gold)';
        
        toast.textContent = message;
        container.appendChild(toast);

        // Force reflow
        toast.offsetHeight;
        toast.classList.add('visible');

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    },

    /**
     * DYNAMIC FAVICON
     */
    updateFavicon: function() {
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // Draw hexagonal logo
        ctx.fillStyle = accent;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            ctx.lineTo(16 + 14 * Math.cos(i * Math.PI / 3), 16 + 14 * Math.sin(i * Math.PI / 3));
        }
        ctx.closePath();
        ctx.fill();

        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = canvas.toDataURL("image/x-icon");
        document.getElementsByTagName('head')[0].appendChild(link);
    },

    /**
     * FILAMENT CURSOR TRAIL
     */
    initCursor: function() {
        const canvas = document.createElement('canvas');
        canvas.id = 'stardustCanvas';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        let width, height;
        const TRAIL_LENGTH = 24;
        const trail = [];
        // Live cursor position — always up to date, not throttled by RAF
        const mouse = { x: -200, y: -200 };

        const resize = throttle(() => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }, 100);
        window.addEventListener('resize', resize);
        resize();

        window.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            mouse.x = x;
            mouse.y = y;
            trail.push({ x, y });
            if (trail.length > TRAIL_LENGTH) trail.shift();
        });

        const getAccentColor = () =>
            getComputedStyle(document.documentElement)
                .getPropertyValue('--accent-color').trim() || '#00d4ff';

        const hexToRgb = (hex) => {
            const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '0,212,255';
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Build the points list: history + live mouse position as definitive head
            const points = trail.length > 0
                ? [...trail.slice(0, -1), mouse]
                : [mouse];

            if (points.length < 2) {
                requestAnimationFrame(animate);
                return;
            }

            const color = hexToRgb(getAccentColor());
            const len = points.length;

            for (let i = 1; i < len; i++) {
                const t = i / len;          // 0 = tail end, 1 = head
                const alpha = t * t;
                const lineWidth = t * 2.5;

                ctx.beginPath();
                ctx.moveTo(points[i - 1].x, points[i - 1].y);
                ctx.lineTo(points[i].x, points[i].y);
                ctx.strokeStyle = `rgba(${color}, ${alpha})`;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
            }

            // Glowing dot exactly at the live cursor
            const grd = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 6);
            grd.addColorStop(0, `rgba(${color}, 0.85)`);
            grd.addColorStop(1, `rgba(${color}, 0)`);
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();

            requestAnimationFrame(animate);
        };

        animate();
    },

    /**
     * PAGE TRANSITIONS: STAR JUMP (WARP SPEED)
     */
    initTransitions: function() {
        const canvas = document.createElement('canvas');
        canvas.id = 'starJumpCanvas';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        let width, height;
        const stars = [];
        const STAR_COUNT = 800;
        let jumping = false;

        const initStars = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            stars.length = 0;
            for (let i = 0; i < STAR_COUNT; i++) {
                stars.push({
                    x: Math.random() * width - width / 2,
                    y: Math.random() * height - height / 2,
                    z: Math.random() * width,
                    o: Math.random()
                });
            }
        };

        window.addEventListener('resize', initStars);
        initStars();

        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#00d4ff';
        const animate = () => {
            if (!jumping && canvas.style.opacity === '0') {
               requestAnimationFrame(animate); 
               return; 
            }
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;

            ctx.strokeStyle = accent;
            ctx.lineCap = 'round';

            for (let i = 0; i < STAR_COUNT; i++) {
                const s = stars[i];
                const x = s.x / (s.z / width) + cx;
                const y = s.y / (s.z / width) + cy;

                if (x < 0 || x > width || y < 0 || y > height) {
                    s.z = width;
                    continue;
                }

                const size = (1 - s.z / width) * 5;
                ctx.lineWidth = size;
                ctx.beginPath();
                ctx.moveTo(x, y);
                
                const streak = jumping ? 50 : 2;
                s.z -= jumping ? 25 : 2;
                
                const nextX = s.x / (s.z / width) + cx;
                const nextY = s.y / (s.z / width) + cy;
                ctx.lineTo(nextX, nextY);
                ctx.stroke();

                if (s.z <= 0) s.z = width;
            }
            requestAnimationFrame(animate);
        };

        animate();

        // Entrance
        window.addEventListener('load', () => {
            canvas.style.opacity = '1';
            jumping = true;
            setTimeout(() => {
                jumping = false;
                canvas.style.opacity = '0';
            }, 800);
        });

        // Exit
        document.addEventListener('click', e => {
            const link = e.target.closest('a');
            if (link && link.href && !link.target && !link.href.includes('#') && link.origin === window.location.origin) {
                e.preventDefault();
                canvas.style.opacity = '1';
                jumping = true;
                setTimeout(() => {
                    window.location.href = link.href;
                }, 700);
            }
        });
    },

    /**
     * TYPING ANIMATION
     */
    typeWriter: function(element, text, speed = 100, callback) {
        let i = 0;
        element.innerHTML = '';
        const timer = setInterval(() => {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
                if (callback) callback();
            }
        }, speed);
    }
};

// Auto-run core features
document.addEventListener('DOMContentLoaded', () => {
    const isLowPerf = localStorage.getItem('nexus-perf-mode') === 'low';
    if (!isLowPerf) {
        nexus.initCursor();
    }
    nexus.initTransitions();
    nexus.updateFavicon();
    
    // Watch for color changes in settings to update favicon
    const observer = new MutationObserver(() => nexus.updateFavicon());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
});
