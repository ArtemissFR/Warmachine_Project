// mark.js — Mark Grayson / Invincible animations & speech
(function() {
  const mark = document.getElementById('mark');
  const speech = document.getElementById('speech');
  if (!mark || !speech) return;

  // Page-specific quotes
  const pageQuotes = {
    'index.html': [
      "Bienvenue dans mon univers !",
      "Je suis Invincible. Littéralement.",
      "Sympa ton site !",
      "Tu as vu mes nouvelles capacités ?",
      "OMNI-MAN était là avant moi 👀",
      "Prêt à explorer ?",
    ],
    'musculation.html': [
      "La muscu c'est mon cardio chaud.",
      "Tu skip le leg day ? Honte à toi.",
      "Rep après rep, c'est comme ça qu'on devient fort.",
      "Mark Grayson approuve ce programme !",
      "Avec mes pouvoirs, je pourrais soulever la salle...",
      "Plus de whey. Toujours plus.",
    ],
    'hub.html': [
      "Réseau sécurisé. Comme ma cape.",
      "Je surveille le réseau local.",
      "Ping parfait. Mission accomplie.",
      "On dirait la salle de crise de la Coalition.",
      "Tous les systèmes sont opérationnels !",
    ],
    'galerie.html': [
      "Tes créations sont incroyables !",
      "L'art, c'est mon côté humain.",
      "Joli dessin ! Même moi je peux pas faire ça.",
      "Je veux ma propre galerie maintenant.",
      "C'est encore plus beau que Viltrum.",
    ],
  };

  // Determine current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const quotes = pageQuotes[currentPage] || pageQuotes['index.html'];
  let quoteIndex = 0;
  let speechVisible = false;
  let speechTimeout = null;

  function showSpeech(text) {
    speech.textContent = text;
    speech.classList.add('visible');
    speechVisible = true;
    clearTimeout(speechTimeout);
    speechTimeout = setTimeout(hideSpeech, 4000);
  }

  function hideSpeech() {
    speech.classList.remove('visible');
    speechVisible = false;
  }

  function nextQuote() {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    showSpeech(quotes[quoteIndex]);
  }

  // Click to speak
  mark.addEventListener('click', () => {
    nextQuote();
  });

  // Auto-speak on enter
  setTimeout(() => {
    showSpeech(quotes[0]);
  }, 2500);

  // Periodic random speech
  setInterval(() => {
    if (!speechVisible && Math.random() < 0.4) {
      nextQuote();
    }
  }, 8000);

  // Hover: make eyes track cursor direction slightly
  mark.addEventListener('mousemove', (e) => {
    const rect = mark.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / 100;
    const dy = (e.clientY - cy) / 100;
    const eyes = mark.querySelectorAll('.eye::after');
    // Move body slightly toward cursor
    const body = mark.querySelector('.char-body');
    if (body) {
      body.style.transform = `rotate(${dx * 3}deg)`;
    }
  });

  mark.addEventListener('mouseleave', () => {
    const body = mark.querySelector('.char-body');
    if (body) body.style.transform = '';
  });

  // Double-click: fly animation
  mark.addEventListener('dblclick', () => {
    mark.classList.add('flying');
    showSpeech("À plus ! 💨");
    setTimeout(() => {
      mark.classList.remove('flying');
      showSpeech("Je suis de retour !");
    }, 2500);
  });

  // Keyboard shortcut: M key summons Mark
  document.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      nextQuote();
    }
  });

  // Easter egg: Konami code
  const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiIdx = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key === konami[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === konami.length) {
        konamiIdx = 0;
        showSpeech("CODE KONAMI ! Tu es digne d'être Invincible 🌟");
        mark.querySelector('.character-sprite').style.animation = 'charFloat 0.5s ease-in-out infinite';
        setTimeout(() => {
          mark.querySelector('.character-sprite').style.animation = '';
        }, 3000);
      }
    } else {
      konamiIdx = 0;
    }
  });
})();
