/**
 * NEXUS NETWORK HUB
 * Handles service rendering, admin mode, drag & drop, and markdown notes.
 */

const DEFAULT_SERVICES = [
  { name: 'Plex', url: 'http://192.168.1.100:32400', desc: 'Serveur média · Films & Séries', icon: '🎬', category: 'media' },
  { name: 'Jellyfin', url: 'http://192.168.1.100:8096', desc: 'Media server open-source', icon: '📺', category: 'media' },
  { name: 'Pi-hole', url: 'http://192.168.1.1/admin', desc: 'Bloqueur de pubs réseau', icon: '🛡️', category: 'network' },
  { name: 'Nextcloud', url: 'http://192.168.1.102:8080', desc: 'Cloud personnel · Fichiers & Photos', icon: '☁️', category: 'storage' },
  { name: 'Portainer', url: 'http://192.168.1.100:9000', desc: 'Gestion des containers Docker', icon: '🐋', category: 'admin' },
  { name: 'Home Assistant', url: 'http://192.168.1.103:8123', desc: 'Domotique · Smart home', icon: '🏠', category: 'iot' },
  { name: 'Gitea', url: 'http://192.168.1.104:3000', desc: 'Forge Git locale', icon: '📦', category: 'dev' },
  { name: 'Grafana', url: 'http://192.168.1.100:3001', desc: 'Dashboards & Monitoring', icon: '📊', category: 'admin' },
  { name: 'Vaultwarden', url: 'http://192.168.1.105:80', desc: 'Gestionnaire de mots de passe', icon: '🔐', category: 'security' },
  { name: 'Sonarr', url: 'http://192.168.1.100:8989', desc: 'Téléchargement automatique séries', icon: '📡', category: 'media' },
  { name: 'Radarr', url: 'http://192.168.1.100:7878', desc: 'Téléchargement automatique films', icon: '📽️', category: 'media' },
];

const STORAGE_KEY = 'nexus-hub-services';
const NOTES_KEY = 'nexus-hub-notes';

let services = [];
let isAdmin = sessionStorage.getItem('nexus-admin') === 'true';

function loadServices() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && saved.length ? saved : DEFAULT_SERVICES;
  } catch { return DEFAULT_SERVICES; }
}

function saveServices(svcs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(svcs));
}

function renderHub(filter = '') {
  const grid = document.getElementById('hubGrid');
  const countEl = document.getElementById('hubCount');
  if(!grid) return;

  const filtered = filter
    ? services.filter(s =>
        s.name.toLowerCase().includes(filter) ||
        s.desc.toLowerCase().includes(filter) ||
        (s.category || '').toLowerCase().includes(filter)
      )
    : services;

  grid.innerHTML = '';
  filtered.forEach((svc, idx) => {
    const card = document.createElement('div');
    card.className = 'hub-card';
    card.dataset.id = services.indexOf(svc);
    card.innerHTML = `
      <div class="hub-card-header">
        <div class="hub-card-icon-box">${svc.icon || '🌐'}</div>
        <div class="hub-card-title-group">
          <div class="hub-card-name">${svc.name}</div>
          <div class="hub-card-category">${(svc.category || 'service').toUpperCase()}</div>
        </div>
      </div>
      <div class="hub-card-body">
        <div class="hub-card-desc">${svc.desc}</div>
        <div class="hub-card-footer">
          <div class="hub-status-inline">
            <span class="status-dot-pulse"></span> ONLINE
          </div>
          <div class="hub-card-url">${svc.url.replace(/^https?:\/\//, '')}</div>
        </div>
      </div>
      ${isAdmin ? `<button class="hub-remove-btn" onclick="removeService(${services.indexOf(svc)})" title="Supprimer">✕</button>` : ''}
    `;
    
    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      window.open(svc.url, '_blank');
    });
    grid.appendChild(card);
  });

  // Add card button
  if (isAdmin) {
    const addCard = document.createElement('div');
    addCard.className = 'add-hub-card';
    addCard.innerHTML = '<div class="plus">+</div><div>AJOUTER UN SERVICE</div>';
    addCard.addEventListener('click', () => openModal('addModal'));
    grid.appendChild(addCard);
    
    initSortable();
  }

  if(countEl) countEl.textContent = `${filtered.length} service${filtered.length > 1 ? 's' : ''}`;
}

function initSortable() {
    const grid = document.getElementById('hubGrid');
    if (!grid || !window.Sortable) return;
    
    Sortable.create(grid, {
        animation: 150,
        ghostClass: 'hub-card-ghost',
        draggable: '.hub-card',
        onEnd: function (evt) {
            const items = Array.from(grid.querySelectorAll('.hub-card')).map(card => {
                const id = parseInt(card.dataset.id);
                return services[id];
            });
            services = items;
            saveServices(services);
            renderHub();
            nexus.notify("Ordre mis à jour", "success");
        }
    });
}

window.removeService = (idx) => {
  services.splice(idx, 1);
  saveServices(services);
  renderHub(document.getElementById('hubSearch').value.toLowerCase().trim());
  nexus.notify("Service supprimé", "warning");
};

/**
 * ADMIN NOTES (MARKDOWN)
 */
function initNotes() {
    const notesArea = document.getElementById('adminNotesArea');
    const notesPrev = document.getElementById('adminNotesPreview');
    if (!notesArea) return;

    const saved = localStorage.getItem(NOTES_KEY) || "# Notes Admin\n- Bienvenue dans le Nexus Hub.\n- Utilisez ce panneau pour vos rappels réseau.";
    notesArea.value = saved;
    updateNotesPreview(saved);

    notesArea.addEventListener('input', (e) => {
        const val = e.target.value;
        localStorage.setItem(NOTES_KEY, val);
        updateNotesPreview(val);
    });
    
    // Toggle based on Admin
    const notesCont = document.getElementById('adminNotesContainer');
    if (notesCont) {
        notesCont.style.display = isAdmin ? 'block' : 'none';
    }
}

function updateNotesPreview(val) {
    const notesPrev = document.getElementById('adminNotesPreview');
    if (!notesPrev) return;
    
    if (window.marked) {
        notesPrev.innerHTML = marked.parse(val);
    } else {
        notesPrev.textContent = val;
    }
}

// Global UI Init
document.addEventListener('DOMContentLoaded', () => {
  services = loadServices();
  
  const adminBtn = document.getElementById('adminToggleBtn');
  const updateAdminBtn = () => {
    adminBtn.innerHTML = isAdmin ? '🔓 Quitter Admin' : '🔒 Mode Admin';
    adminBtn.style.color = isAdmin ? 'var(--neon-green)' : '';
    adminBtn.style.borderColor = isAdmin ? 'var(--neon-green)' : '';
    const notesCont = document.getElementById('adminNotesContainer');
    if (notesCont) notesCont.style.display = isAdmin ? 'block' : 'none';
  };

  adminBtn.addEventListener('click', () => {
    if (isAdmin) {
      isAdmin = false;
      sessionStorage.removeItem('nexus-admin');
      nexus.notify("Mode Admin Désactivé");
    } else {
      const pwd = prompt('Mot de passe administrateur :');
      if (pwd === 'admin' || pwd === 'nexus') {
        isAdmin = true;
        sessionStorage.setItem('nexus-admin', 'true');
        nexus.notify("Accès Admin Accordé", "success");
      } else if (pwd !== null) {
        nexus.notify("Mot de passe incorrect", "error");
      }
    }
    updateAdminBtn();
    renderHub(document.getElementById('hubSearch').value.toLowerCase().trim());
  });

  updateAdminBtn();
  renderHub();
  initNotes();

  document.getElementById('hubSearch').addEventListener('input', e => {
    renderHub(e.target.value.toLowerCase().trim());
  });

  // Modal logic
  document.getElementById('confirmModal').addEventListener('click', () => {
    const name = document.getElementById('svcName').value.trim();
    const url = document.getElementById('svcUrl').value.trim();
    const desc = document.getElementById('svcDesc').value.trim();
    const icon = document.getElementById('svcIcon').value.trim() || '🌐';
    if (!name || !url) { nexus.notify('Nom et URL requis !', 'error'); return; }
    services.push({ name, url, desc, icon, category: 'custom' });
    saveServices(services);
    closeModal('addModal');
    renderHub();
    nexus.notify("Service ajouté", "success");
  });
});

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
