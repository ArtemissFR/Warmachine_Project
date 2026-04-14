/**
 * NEXUS GALLERY MODULE
 * Advanced filtering, sorting, and lightbox management.
 */

const GALLERY_KEY = 'nexus-gallery-items';
let galleryItems = [];
let currentFilter = 'all';
let currentSort = 'newest';

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
        div.querySelector('img').addEventListener('click', () => openLightbox(item.src, item.title));
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
    if (!lb || !lbImg) return;
    
    lbImg.src = src;
    lbCap.textContent = caption;
    lb.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    galleryItems = loadGallery();
    renderGallery();

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

    // Lightbox Close
    const lbClose = document.getElementById('lbClose');
    if (lbClose) lbClose.addEventListener('click', () => document.getElementById('lightbox').classList.remove('active'));
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
