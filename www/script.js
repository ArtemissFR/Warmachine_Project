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
    const themeToggleBtn = document.getElementById('theme-toggle');

    // 0. Theme Management
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        document.documentElement.setAttribute('data-theme', savedTheme);
    };
    initTheme();

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateChartColors(newTheme);
        });

        themeToggleBtn.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        themeToggleBtn.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    }

    // 0.1 Chart Management
    let myChart = null;
    const chartCanvas = document.getElementById('progressionChart');

    const updateChartColors = (theme) => {
        if (!myChart) return;
        const textColor = theme === 'light' ? '#475569' : '#94a3b8';
        const gridColor = theme === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.08)';

        myChart.options.scales.x.ticks.color = textColor;
        myChart.options.scales.y.ticks.color = textColor;
        myChart.options.scales.x.grid.color = gridColor;
        myChart.options.scales.y.grid.color = gridColor;
        myChart.update();
    };

    if (chartCanvas && typeof Chart !== 'undefined') {
        const ctx = chartCanvas.getContext('2d');
        const theme = document.documentElement.getAttribute('data-theme');
        const textColor = theme === 'light' ? '#475569' : '#94a3b8';
        const gridColor = theme === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.08)';

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
                datasets: [{
                    label: 'Volume Total (kg)',
                    data: [3200, 3500, 3400, 3800, 4000, 4200],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#6366f1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    y: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }

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
        let currentIndex = 0;
        const itemsArray = Array.from(galleryItems);

        galleryItems.forEach((img, index) => {
            img.addEventListener('click', () => {
                currentIndex = index;
                showLightbox(img.src);
            });
        });

        const showLightbox = (src) => {
            lightboxImg.src = src;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        };

        const nextImage = () => {
            currentIndex = (currentIndex + 1) % itemsArray.length;
            lightboxImg.src = itemsArray[currentIndex].src;
        };

        const prevImage = () => {
            currentIndex = (currentIndex - 1 + itemsArray.length) % itemsArray.length;
            lightboxImg.src = itemsArray[currentIndex].src;
        };

        lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        // Keyboard Navigation
        window.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
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

    // 8. Back to Top Logic
    const backToTopBtn = document.createElement('div');
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';
    document.body.appendChild(backToTopBtn);

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    backToTopBtn.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    backToTopBtn.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

