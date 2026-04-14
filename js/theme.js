(() => {
  const THEME_KEY = 'nexus-theme';
  const ACCENT_KEY = 'nexus-accent';
  const defaultAccent = '#00d4ff';
  const defaultSecondary = '#9d50bb';

  // -----------------------------------------------
  // Variant → colours
  // -----------------------------------------------
  const VARIANTS = {
    allen:              { p: '#FF9F43', s: '#2E86DE' },
    eve:                { p: '#FF69B4', s: '#a0eeff' },
    robot:              { p: '#D35400', s: '#27AE60' },
    zack:               { p: '#5D9CEC', s: '#F39C12' },
    invincible_classic: { p: '#F6B93B', s: '#00c3ff' },
    invincible_blue:    { p: '#1E3799', s: '#e0c87a' },
    omniman:            { p: '#B71C1C', s: '#F5F5F5' },
    conquest:           { p: '#AEB6BF', s: '#ffb347' },
    thragg:             { p: '#6B1B1B', s: '#D4AF37' }
  };

  // -----------------------------------------------
  // Variant → character image
  // -----------------------------------------------
  const VARIANT_CHARACTERS = {
    allen:              'assets/images/person/Allen.png',
    eve:                'assets/images/person/Eve.png',
    robot:              'assets/images/person/Robot.png',
    zack:               'assets/images/person/Zack.png',
    invincible_classic: 'assets/images/person/Invincible.png',
    invincible_blue:    'assets/images/person/Invincible Blue.png',
    omniman:            'assets/images/person/Omniman.png',
    conquest:           'assets/images/person/Conquest.png',
    thragg:             'assets/images/person/Thragg.png',
    _default:           'assets/images/person/Invincible.png'
  };

  // -----------------------------------------------
  // Helpers
  // -----------------------------------------------
  function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
  }

  function computeComplementary(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return defaultSecondary;

    let { r, g, b } = rgb;
    r /= 255; g /= 255; b /= 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    h = (h + 150 / 360) % 1;
    s = Math.max(s, 0.65);
    l = 0.62;

    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const rr = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
    const gg = Math.round(hue2rgb(p, q, h) * 255);
    const bb = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
    return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function applyAccent(hexColor, secondaryOverride) {
    const rgb = hexToRgb(hexColor) || hexToRgb(defaultAccent);
    document.documentElement.style.setProperty('--accent-color', hexColor);
    document.documentElement.style.setProperty('--accent-r', rgb.r);
    document.documentElement.style.setProperty('--accent-g', rgb.g);
    document.documentElement.style.setProperty('--accent-b', rgb.b);

    const secondary = secondaryOverride || computeComplementary(hexColor);
    document.documentElement.style.setProperty('--neon-blue', secondary);
    document.documentElement.style.setProperty('--secondary-accent', secondary);
  }

  function applyCharacter(variantKey) {
    const src = VARIANT_CHARACTERS[variantKey] || VARIANT_CHARACTERS['_default'];

    const tryApply = () => {
      const img = document.querySelector('.assistant-scaler img');
      if (img) {
        img.style.transition = 'opacity 0.4s ease';
        img.style.opacity = '0';
        setTimeout(() => {
          img.src = src;
          img.style.opacity = '1';
        }, 400);
        return true;
      }
      return false;
    };

    // Attempt immediately, then retry for late-mounted custom elements
    if (!tryApply()) {
      setTimeout(tryApply, 600);
      setTimeout(tryApply, 1500);
    }
    localStorage.setItem('nexus-variant-char', src);
  }

  // -----------------------------------------------
  // Floating settings icon injection
  // -----------------------------------------------


  // -----------------------------------------------
  // Init
  // -----------------------------------------------
  function init() {
    const savedTheme   = localStorage.getItem(THEME_KEY) || 'dark';
    const savedAccent  = localStorage.getItem(ACCENT_KEY) || defaultAccent;
    const savedVariant = localStorage.getItem('nexus-variant');

    applyTheme(savedTheme);

    const variantSecondary = savedVariant && VARIANTS[savedVariant]
      ? VARIANTS[savedVariant].s
      : null;

    applyAccent(savedAccent, variantSecondary);

    window.addEventListener('DOMContentLoaded', () => {


      // Mark active variant button on settings page
      const activeHead = document.querySelector(`.variant-head[data-variant="${savedVariant}"]`);
      if (activeHead) activeHead.classList.add('active');

      // Apply character image
      if (savedVariant) applyCharacter(savedVariant);
    });

    // Extra retry for components that register after DOMContentLoaded
    setTimeout(() => { if (savedVariant) applyCharacter(savedVariant); }, 900);
  }

  // -----------------------------------------------
  // Public API for other modules
  // -----------------------------------------------
  window.nexusTheme = {
    applyAccent,
    computeComplementary,
    applyCharacter,
    VARIANTS,
    VARIANT_CHARACTERS,
  };

  init();
})();
