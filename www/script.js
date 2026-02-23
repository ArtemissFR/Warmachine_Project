document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const transitionOverlay = document.getElementById('page-transition');
    const splashScreen = document.getElementById('splash-screen');
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const clockElement = document.getElementById('live-clock');
    const galleryItems = document.querySelectorAll('.gallery-item img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const filterItems = document.querySelectorAll('.gallery-item');
    const tiltElements = document.querySelectorAll('.btn-card, .gallery-item');

    // 0 & 1. Page Transition (Entry) & Splash Screen
    // Ensure we clear the overlays even if something fails
    const clearInitialOverlays = () => {
        if (transitionOverlay) {
            transitionOverlay.classList.add('out');
            setTimeout(() => {
                transitionOverlay.classList.remove('active');
            }, 600);
        }
        if (splashScreen) {
            document.body.classList.add('loaded');
        }
    };

    // If script runs very late, clear immediately
    if (document.readyState === 'complete') {
        clearInitialOverlays();
    } else {
        window.addEventListener('load', clearInitialOverlays);
        // Safety timeout in case load event is slow
        setTimeout(clearInitialOverlays, 3000);
    }

    // 2. Custom Cursor
    if (cursorDot && cursorOutline) {
        document.body.classList.add('custom-cursor-active');

        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        const interactiveElements = document.querySelectorAll('a, button, .gallery-item, .btn-card');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });
    }

    // 3. 3D Tilt Effect
    tiltElements.forEach(el => {
        el.classList.add('tilt-card');
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            // Combined with a slight vertical translate to mimic the CSS effect we removed
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px) scale(1.02)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)`;
        });
    });

    // 4. Lightbox Logic
    if (galleryItems.length > 0 && lightbox && lightboxImg && lightboxClose) {
        galleryItems.forEach(img => {
            img.addEventListener('click', () => {
                lightboxImg.src = img.src;
                lightbox.classList.add('active');
            });
        });
        lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) lightbox.classList.remove('active');
        });
    }

    // 5. Live Clock
    if (clockElement) {
        const updateClock = () => {
            const now = new Date();
            clockElement.textContent = now.toLocaleTimeString('fr-FR');
        };
        setInterval(updateClock, 1000);
        updateClock();
    }

    // 6. Gallery Filter System
    if (filterBtns.length > 0 && filterItems.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.getAttribute('data-filter');
                filterItems.forEach(item => {
                    if (filter === 'all' || item.getAttribute('data-category') === filter) {
                        item.classList.remove('hide');
                        item.classList.add('show');
                    } else {
                        item.classList.remove('show');
                        item.classList.add('hide');
                    }
                });
            });
        });
    }

    // 7. Page Transition (Exit)
    const allLinks = document.querySelectorAll('a');
    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Filter for local links only (skip external, mailto, and anchor-only)
        if (href && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('#') && (href.endsWith('.html') || href === './' || href === 'index.html')) {
            link.addEventListener('click', (e) => {
                const target = link.href;
                const current = window.location.href.split('#')[0].split('?')[0];
                const targetClean = target.split('#')[0].split('?')[0];

                if (targetClean !== current) {
                    e.preventDefault();
                    if (transitionOverlay) {
                        transitionOverlay.classList.remove('out');
                        transitionOverlay.classList.add('active');
                        setTimeout(() => window.location.href = target, 600);
                    } else {
                        window.location.href = target;
                    }
                }
            });
        }
    });
});

