/**
 * NEXUS GALLERY MODULE
 * Advanced filtering, sorting, and lightbox management.
 */

const GALLERY_KEY = 'nexus-gallery-items';
let galleryItems = [];
let currentFilter = 'all';
let currentSort = 'newest';

/**
 * MOODBOARD SYSTEM
 */
const MOODBOARD_KEY = 'nexus-moodboard-items';
let moodboardItems = [];

function loadMoodboard() {
    try { return JSON.parse(localStorage.getItem(MOODBOARD_KEY)) || []; }
    catch { return []; }
}

function saveMoodboard(items) {
    localStorage.setItem(MOODBOARD_KEY, JSON.stringify(items));
}

function renderMoodboard() {
    const grid = document.getElementById('moodGrid');
    const empty = document.getElementById('moodEmpty');
    if (!grid) return;

    grid.innerHTML = '';
    if (moodboardItems.length === 0) {
        if(empty) empty.style.display = 'block';
        return;
    }
    if(empty) empty.style.display = 'none';

    moodboardItems.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'mood-item';
        div.innerHTML = `
            <img src="${item.src}" alt="Mood item" />
            <button onclick="removeMoodItem(${idx})" style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); border:none; color:white; border-radius:50%; width:24px; height:24px; cursor:pointer; z-index:10;">✕</button>
        `;
        div.style.position = 'relative';
        div.addEventListener('click', (e) => {
            if(e.target.tagName !== 'BUTTON') openLightbox(item.src, "MOODBOARD REF #" + (idx + 1));
        });
        grid.appendChild(div);
    });
}

window.removeMoodItem = (idx) => {
    moodboardItems.splice(idx, 1);
    saveMoodboard(moodboardItems);
    renderMoodboard();
    if(window.nexus) nexus.notify("Référence supprimée", "warning");
};

function handleMoodFiles(files) {
    files.forEach(f => {
        const reader = new FileReader();
        reader.onload = e => {
            moodboardItems.push({ src: e.target.result, date: new Date().getTime() });
            saveMoodboard(moodboardItems);
            renderMoodboard();
        };
        reader.readAsDataURL(f);
    });
}

function loadGallery() {
  try { return JSON.parse(localStorage.getItem(GALLERY_KEY)) || []; }
  catch { return []; }
}

function saveGallery(items) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
}

function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    let items = [...galleryItems];

    // Filter
    if (currentFilter !== 'all') {
        items = items.filter(i => i.cat === currentFilter);
    }

    // Sort
    if (currentSort === 'newest') {
        items.reverse();
    } else if (currentSort === 'oldest') {
        // stay as is (if they were pushed chronologically)
    } else if (currentSort === 'az') {
        items.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Clear and Render
    const placeholders = grid.querySelectorAll('.gallery-item:not([data-real])');
    if (galleryItems.length > 0) {
        placeholders.forEach(p => p.style.display = 'none');
    } else {
        placeholders.forEach(p => p.style.display = 'block');
    }

    grid.querySelectorAll('.gallery-item[data-real]').forEach(el => el.remove());

    items.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.setAttribute('data-real', '1');
        div.setAttribute('data-cat', item.cat);
        div.innerHTML = `
            <img class="gallery-thumb" src="${item.src}" alt="${item.title}" />
            <div class="gallery-info">
                <div class="gallery-tag">${item.cat === 'ia' ? '🤖 ART IA' : '✒️ DESSIN'}</div>
                <div class="gallery-name">${item.title}</div>
            </div>
            <button class="hub-remove-btn" onclick="removeGalleryItem(${galleryItems.indexOf(item)})" title="Supprimer" style="position:absolute;top:8px;right:8px;background:rgba(255,0,0,0.5);border:none;color:white;border-radius:50%;width:26px;height:26px;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;">✕</button>
        `;
        div.style.position = 'relative';
        div.querySelector('img').addEventListener('click', () => {
            openLightbox(item.src, item.title);
            const pBox = document.getElementById('paletteBox');
            if(pBox) pBox.innerHTML = '';
        });
        grid.insertBefore(div, document.getElementById('uploadZone'));
    });
}

window.removeGalleryItem = (idx) => {
    galleryItems.splice(idx, 1);
    saveGallery(galleryItems);
    renderGallery();
    nexus.notify("Image supprimée", "warning");
};

// Lightbox
function openLightbox(src, caption) {
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lbImg');
    const lbCap = document.getElementById('lbCaption');
    const loupe = document.getElementById('loupe');
    if (!lb || !lbImg) return;
    
    lbImg.src = src;
    lbCap.textContent = caption;
    lb.classList.add('active');
    
    // Reset loupe & palette
    if(loupe) {
        loupe.style.display = 'none';
        loupe.style.backgroundImage = `url(${src})`;
    }
    const pBox = document.getElementById('paletteBox');
    if(pBox) pBox.innerHTML = '';
}

/**
 * PALETTE EXTRACTOR
 */
function extractPalette() {
    const img = document.getElementById('lbImg');
    const box = document.getElementById('paletteBox');
    if(!img || !img.src || !box) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const tempImg = new Image();
    
    tempImg.crossOrigin = "Anonymous";
    tempImg.onload = function() {
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(tempImg, 0, 0, 50, 50);
        
        const data = ctx.getImageData(0, 0, 50, 50).data;
        const colors = {};

        for(let i = 0; i < data.length; i += 20) { // Sample every 5th pixel (4 bytes per pixel)
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            // Simplify color to reduce noise (quantization)
            const key = `${Math.round(r/20)*20},${Math.round(g/20)*20},${Math.round(b/20)*20}`;
            colors[key] = (colors[key] || 0) + 1;
        }

        const sorted = Object.entries(colors).sort((a,b) => b[1] - a[1]).slice(0, 6);
        box.innerHTML = '';
        sorted.forEach(([rgb]) => {
            const swatch = document.createElement('div');
            swatch.className = 'swatch';
            const hex = rgbToHex(...rgb.split(',').map(Number));
            swatch.style.backgroundColor = hex;
            swatch.title = hex;
            swatch.onclick = () => {
                navigator.clipboard.writeText(hex);
                if(window.nexus) nexus.notify(`Copié : ${hex}`, "success");
            };
            box.appendChild(swatch);
        });
    };
    tempImg.src = img.src;
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * REFERENCE TIMER
 */
let timerId = null;
let timerIndex = 0;

function startReferenceTimer() {
    if(moodboardItems.length === 0) return;
    
    const delay = parseInt(document.getElementById('timerDelay').value) || 60000;
    const startBtn = document.getElementById('startTimer');
    const stopBtn = document.getElementById('stopTimer');
    
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    
    timerIndex = 0;
    showTimerImage();
    
    timerId = setInterval(() => {
        timerIndex++;
        if(timerIndex >= moodboardItems.length) timerIndex = 0;
        showTimerImage();
    }, delay);
}

function showTimerImage() {
    const item = moodboardItems[timerIndex];
    if(item) openLightbox(item.src, `TIMER : RÉFÉRENCE ${timerIndex + 1}/${moodboardItems.length}`);
}

function stopReferenceTimer() {
    clearInterval(timerId);
    document.getElementById('startTimer').style.display = 'block';
    document.getElementById('stopTimer').style.display = 'none';
}

/**
 * ENHANCED LOUPE LOGIC
 */
function initLoupe() {
    const lbImg = document.getElementById('lbImg');
    const loupe = document.getElementById('loupe');
    if (!lbImg || !loupe) return;

    lbImg.addEventListener('mousemove', (e) => {
        loupe.style.display = 'block';
        const rect = lbImg.getBoundingClientRect();
        
        // Use page coordinates for loupe positioning
        loupe.style.left = `${e.clientX - 75}px`;
        loupe.style.top = `${e.clientY - 75}px`;

        // Background position for zoom effect
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const bgX = (x / rect.width) * 100;
        const bgY = (y / rect.height) * 100;
        
        loupe.style.backgroundSize = `${rect.width * 2}px ${rect.height * 2}px`;
        loupe.style.backgroundPosition = `${bgX}% ${bgY}%`;
    });

    lbImg.addEventListener('mouseleave', () => {
        loupe.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    galleryItems = loadGallery();
    moodboardItems = loadMoodboard();
    renderGallery();
    initLoupe();

    // Tabs Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.style.color = 'var(--text-dim)';
            });
            btn.classList.add('active');
            btn.style.color = 'white';
            tabContents.forEach(c => c.style.display = 'none');
            const targetView = document.getElementById(`view-${target}`);
            if(targetView) targetView.style.display = 'block';
            
            if(target === 'moodboard') renderMoodboard();
            else renderGallery();
        });
    });

    // Filter Buttons
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderGallery();
        });
    });

    // Sort Dropdown
    const sortSelect = document.getElementById('gallerySort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderGallery();
        });
    }

    // Modal & Upload
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
            if (files.length) handleFiles(files);
        });
    }

    // Moodboard Input
    const moodInput = document.getElementById('moodInput');
    if (moodInput) {
        moodInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
            if (files.length) handleMoodFiles(files);
        });
    }

    // Lightbox Close
    const lbClose = document.getElementById('lbClose');
    if (lbClose) lbClose.addEventListener('click', () => {
        document.getElementById('lightbox').classList.remove('active');
        const loupe = document.getElementById('loupe');
        if(loupe) loupe.style.display = 'none';
        stopReferenceTimer();
    });

    // Artist Tools Events
    document.getElementById('extractBtn')?.addEventListener('click', extractPalette);
    document.getElementById('startTimer')?.addEventListener('click', startReferenceTimer);
    document.getElementById('stopTimer')?.addEventListener('click', stopReferenceTimer);
});

function handleFiles(files) {
    files.forEach(f => {
        const reader = new FileReader();
        reader.onload = e => {
            openAddModal(e.target.result, f.name.replace(/\.[^.]+$/, ''));
        };
        reader.readAsDataURL(f);
    });
}

let pendingFile = null;
function openAddModal(src, name) {
    const modal = document.getElementById('addImgModal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.getElementById('imgTitle').value = name || '';
    pendingFile = src;
    const preview = document.getElementById('previewContainer');
    preview.innerHTML = `<img src="${src}" style="max-height:120px;max-width:100%;border-radius:6px;" />`;
}

document.getElementById('confirmImgModal')?.addEventListener('click', () => {
    const title = document.getElementById('imgTitle').value.trim() || 'Sans titre';
    const cat = document.getElementById('imgCat').value;
    if (!pendingFile) return;
    galleryItems.push({ src: pendingFile, title, cat, date: new Date().getTime() });
    saveGallery(galleryItems);
    document.getElementById('addImgModal').style.display = 'none';
    pendingFile = null;
    renderGallery();
    nexus.notify("Image ajoutée à la galerie", "success");
});

document.getElementById('cancelImgModal')?.addEventListener('click', () => {
    document.getElementById('addImgModal').style.display = 'none';
    pendingFile = null;
});
