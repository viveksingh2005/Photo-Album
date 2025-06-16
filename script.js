const uploadInput = document.getElementById('upload');
const gallery = document.getElementById('gallery');
const favorites = document.getElementById('favorites');
const actionBar = document.querySelector('.action-bar');
const viewer = document.getElementById('photo-viewer');
const viewerImg = document.getElementById('viewer-img');

let allImages = JSON.parse(localStorage.getItem('allImages')) || [];
let favoriteImages = JSON.parse(localStorage.getItem('favoriteImages')) || [];
let currentIndex = 0;

// Restore saved images on load
window.onload = () => {
  allImages.forEach(src => createPhotoCard(src, gallery));
  favoriteImages.forEach(src => createPhotoCard(src, favorites));
};



uploadInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = height * (maxSize / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = width * (maxSize / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress
        allImages.push(compressedDataUrl);
        localStorage.setItem('photoAlbum_images', JSON.stringify(allImages));
        createPhotoCard(compressedDataUrl, gallery);
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });

  e.target.value = ''; // reset file input
});


function createPhotoCard(src, container) {
  const photo = document.createElement('div');
  photo.className = 'photo';

  const img = document.createElement('img');
  img.src = src;
  img.onclick = () => openViewer(src);

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'select-box';
  checkbox.addEventListener('change', toggleActionBarVisibility);

  const menu = document.createElement('div');
  menu.className = 'photo-menu';

  const btnFav = createMenuBtn('❤️ Favorite', () => moveToFavorites(photo, src));
  const btnSave = createMenuBtn('💾 Save', () => saveImage(src));
  const btnDel = createMenuBtn('🗑️ Delete', () => {
    photo.remove();
    removeImage(src);
    toggleActionBarVisibility();
  });

  menu.append(btnFav, btnSave, btnDel);
  photo.append(checkbox, img, menu);
  container.appendChild(photo);
}

function createMenuBtn(text, onClick) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.onclick = onClick;
  return btn;
}

function moveToFavorites(photo, src) {
  const alreadyInFavorites = favoriteImages.includes(src);
  if (alreadyInFavorites) return;
  removeImage(src);
  favoriteImages.push(src);
  updateLocalStorage();
  photo.remove();
  createPhotoCard(src, favorites);
}

function removeImage(src) {
  if (allImages.includes(src)) {
    allImages = allImages.filter(i => i !== src);
  }
  if (favoriteImages.includes(src)) {
    favoriteImages = favoriteImages.filter(i => i !== src);
  }
  updateLocalStorage();
}

function saveImage(src) {
  const link = document.createElement('a');
  link.href = src;
  link.download = 'photo';
  link.click();
}

function bulkDelete() {
  document.querySelectorAll('.select-box:checked').forEach(box => {
    const photo = box.closest('.photo');
    const src = photo.querySelector('img').src;
    photo.remove();
    removeImage(src);
  });
  toggleActionBarVisibility();
}

function bulkFavorite() {
  document.querySelectorAll('.select-box:checked').forEach(box => {
    const photo = box.closest('.photo');
    const src = photo.querySelector('img').src;
    if (!favoriteImages.includes(src)) {
      favoriteImages.push(src);
      allImages = allImages.filter(i => i !== src);
      updateLocalStorage();
      photo.remove();
      createPhotoCard(src, favorites);
    }
  });
  toggleActionBarVisibility();
}

function toggleActionBarVisibility() {
  const anySelected = document.querySelectorAll('.select-box:checked').length > 0;
  actionBar.classList.toggle('show', anySelected);
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
}

function openViewer(src) {
  currentIndex = [...gallery.querySelectorAll('img'), ...favorites.querySelectorAll('img')]
    .map(img => img.src)
    .indexOf(src);
  viewerImg.src = src;
  viewer.classList.remove('hidden');
}

function showPreviousPhoto() {
  const allImgs = [...gallery.querySelectorAll('img'), ...favorites.querySelectorAll('img')];
  if (currentIndex > 0) currentIndex--;
  viewerImg.src = allImgs[currentIndex].src;
}

function showNextPhoto() {
  const allImgs = [...gallery.querySelectorAll('img'), ...favorites.querySelectorAll('img')];
  if (currentIndex < allImgs.length - 1) currentIndex++;
  viewerImg.src = allImgs[currentIndex].src;
}

function closeViewer() {
  viewer.classList.add('hidden');
}

function updateLocalStorage() {
  localStorage.setItem('allImages', JSON.stringify(allImages));
  localStorage.setItem('favoriteImages', JSON.stringify(favoriteImages));
}
