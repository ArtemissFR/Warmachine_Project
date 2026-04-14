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

document.addEventListener('DOMContentLoaded', () => {

  /* =========================================
     1. CUSTOM CURSOR
     ========================================= */
  const cursorDot = document.createElement('div');
  const cursorOutline = document.createElement('div');
  
  cursorDot.className = 'cursor-dot';
  cursorOutline.className = 'cursor-outline';
  
  document.body.appendChild(cursorDot);
  document.body.appendChild(cursorOutline);
  
  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let outlineX = currentX;
  let outlineY = currentY;

  window.addEventListener('mousemove', (e) => {
    currentX = e.clientX;
    currentY = e.clientY;
    
    cursorDot.style.left = `${currentX}px`;
    cursorDot.style.top = `${currentY}px`;
  });

  // Smooth follow for the outline
  function animateCursor() {
    outlineX += (currentX - outlineX) * 0.15;
    outlineY += (currentY - outlineY) * 0.15;
    
    cursorOutline.style.left = `${outlineX}px`;
    cursorOutline.style.top = `${outlineY}px`;
    
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover states for cursor
  document.querySelectorAll('a, button, .portal-card, .training-card, .hub-card, .gallery-item').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorOutline.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      cursorOutline.classList.remove('hover');
    });
  });

  /* =========================================
     2. PARALLAX REACTIF AU CURSEUR
     ========================================= */
  const planets = document.querySelectorAll('.planet');
  const nebulas = document.querySelectorAll('.nebula');

  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;

    planets.forEach(p => {
      const speed = p.classList.contains('planet-1') ? 30 : 60;
      p.style.translate = `${x * -speed}px ${y * -speed}px`;
    });

    nebulas.forEach(n => {
      const speed = n.classList.contains('nebula-1') ? 80 : 40;
      n.style.translate = `${x * speed}px ${y * speed}px`;
    });
  });

  /* =========================================
     3. TRANSITIONS DE PAGES FLUIDES
     ========================================= */
  // Reveal page on load
  document.body.classList.add('page-enter');

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) { // If loaded from bfcache (Back button)
      document.body.classList.remove('page-exit');
      document.body.classList.add('page-enter');
    }
  });

  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = link.getAttribute('href');
      
      // Ignore absolute URLs and hash links
      if (target.startsWith('http') || target.startsWith('#') || link.target === '_blank') return;
      
      e.preventDefault();
      document.body.classList.remove('page-enter');
      document.body.classList.add('page-exit');
      
      setTimeout(() => {
        window.location.href = target;
      }, 400); // Matches CSS transition duration
    });
  });

  /* =========================================
     4. MICRO-INTERACTIONS: CARDS GLOW
     ========================================= */
  const cards = document.querySelectorAll('.portal-card, .training-card, .gallery-item');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update custom properties for CSS glowing gradient
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

});
