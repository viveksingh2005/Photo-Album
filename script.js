const uploadInput = document.getElementById('upload');
const gallery = document.getElementById('gallery');
const favorites = document.getElementById('favorites');

const viewer = document.getElementById('photo-viewer');
const viewerImg = document.getElementById('viewer-img');
const actionBar = document.querySelector('.action-bar');


let allImages = JSON.parse(localStorage.getItem('allImages')) || [];
let favoriteImages = JSON.parse(localStorage.getItem('favoriteImages')) || [];
let currentIndex = 0;

window.onload = () => {
  allImages.forEach(src => createPhotoCard(src, gallery));
  favoriteImages.forEach(src => createPhotoCard(src, favorites));
};


uploadInput.addEventListener('change', (e) => {
  handleFiles(Array.from(e.target.files));
  e.target.value = '';
});


document.body.addEventListener("dragover", (e) => e.preventDefault());
document.body.addEventListener("drop", (e) => {
  e.preventDefault();
  const files = Array.from(e.dataTransfer.files);
  handleFiles(files);
});

function handleFiles(files) {
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 600;
        let { width, height } = img;

        if (width > height && width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        } else if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        allImages.push(compressedDataUrl);
        updateLocalStorage();
        createPhotoCard(compressedDataUrl, gallery);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function createPhotoCard(src, container) {
  const photo = document.createElement('div');
  photo.className = 'photo fade-in bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg shadow-sm';

  // IMAGE (inside fixed-size thumbnail wrapper)
  const img = document.createElement('img');
  img.src = src;
  img.className = 'w-full h-full object-cover cursor-pointer rounded';
  img.onclick = () => openViewer(src);

  const thumb = document.createElement('div');
  thumb.className = 'overflow-hidden rounded-lg w-full h-48 bg-zinc-200 dark:bg-zinc-700';
  thumb.appendChild(img);

  // Checkbox for bulk select
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'select-box absolute top-2 left-2 scale-125';
  photo.style.position = 'relative';
  checkbox.addEventListener('change', toggleActionBarVisibility);

  const menu = document.createElement('div');
  menu.className = 'photo-menu flex justify-center gap-4 mt-2 text-xl text-zinc-700 dark:text-zinc-100';

  const isFavorite = container.id === 'favorites';
  const favBtn = document.createElement('button');
  favBtn.textContent = isFavorite ? '❤️' : '🤍';
  favBtn.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
  favBtn.onclick = () => {
    if (isFavorite) {
      favoriteImages = favoriteImages.filter(i => i !== src);
      allImages.unshift(src);
      updateLocalStorage();
      photo.remove();
      createPhotoCard(src, gallery);
    } else {
      allImages = allImages.filter(i => i !== src);
      favoriteImages.unshift(src);
      updateLocalStorage();
      photo.remove();
      createPhotoCard(src, favorites);
    }
  };

  const btnSave = document.createElement('button');
  btnSave.innerHTML = '📥';
  btnSave.title = 'Download this photo';
  btnSave.onclick = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = 'photo';
    link.click();

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Download started',
      showConfirmButton: false,
      timer: 1200,
    });
  };

  const btnDel = document.createElement('button');
  btnDel.innerHTML = '🗑️';
  btnDel.title = 'Delete this photo';
  btnDel.onclick = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This photo will be deleted permanently.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        photo.remove();
        removeImage(src);
        toggleActionBarVisibility();

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Photo deleted',
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  };

  menu.append(favBtn, btnSave, btnDel);

  photo.append(checkbox, thumb, menu);
  container.prepend(photo);
}


function createMenuBtn(text, onClick) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.onclick = onClick;
  return btn;
}

function moveToFavorites(photo, src) {
  if (favoriteImages.includes(src)) return;
  allImages = allImages.filter(i => i !== src);
  favoriteImages.push(src);
  updateLocalStorage();
  photo.remove();
  createPhotoCard(src, favorites);
}

function removeImage(src) {
  allImages = allImages.filter(i => i !== src);
  favoriteImages = favoriteImages.filter(i => i !== src);
  updateLocalStorage();
}

function saveImage(src) {
  const link = document.createElement('a');
  link.href = src;
  link.download = 'photo';
  link.click();
}
function bulkDownload() {
  const selected = document.querySelectorAll('.select-box:checked');
  if (selected.length === 0) return;

  selected.forEach(box => {
    const photo = box.closest('.photo');
    const src = photo.querySelector('img').src;
    const link = document.createElement('a');
    link.href = src;
    link.download = 'photo';
    link.click();
  });

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'Download started',
    showConfirmButton: false,
    timer: 1500,
  });
}

function bulkDelete() {
  const selected = document.querySelectorAll('.select-box:checked');
  if (selected.length === 0) return;

  Swal.fire({
    title: `Delete ${selected.length} photo(s)?`,
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete them',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
  }).then((result) => {
    if (result.isConfirmed) {
      selected.forEach(box => {
        const photo = box.closest('.photo');
        const src = photo.querySelector('img').src;
        photo.remove();
        removeImage(src);
      });

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Photos deleted',
        showConfirmButton: false,
        timer: 1500,
      });

      toggleActionBarVisibility(); 
    }
  });
}


function bulkFavorite() {
  document.querySelectorAll('.select-box:checked').forEach(box => {
    const photo = box.closest('.photo');
    const src = photo.querySelector('img').src;
    if (!favoriteImages.includes(src)) {
      allImages = allImages.filter(i => i !== src);
      favoriteImages.push(src);
      updateLocalStorage();
      photo.remove();
      createPhotoCard(src, favorites);
    }
  });
  toggleActionBarVisibility();
}

function toggleActionBarVisibility() {
  const selected = document.querySelectorAll('.select-box:checked');
  const bulkBar = document.getElementById('bulk-actions');
  if (bulkBar) {
    bulkBar.classList.toggle('hidden', selected.length === 0);
  }
}

function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: `Switched to ${isDark ? 'Dark' : 'Light'} Mode`,
    showConfirmButton: false,
    timer: 1200,
  });
}

function openViewer(src) {
  currentIndex = [...document.querySelectorAll('#gallery img, #favorites img')]
    .map(img => img.src)
    .indexOf(src);
  viewerImg.src = src;
  viewer.classList.remove('hidden');
}

function showPreviousPhoto() {
  const imgs = [...document.querySelectorAll('#gallery img, #favorites img')];
  if (currentIndex > 0) currentIndex--;
  viewerImg.src = imgs[currentIndex].src;
}

function showNextPhoto() {
  const imgs = [...document.querySelectorAll('#gallery img, #favorites img')];
  if (currentIndex < imgs.length - 1) currentIndex++;
  viewerImg.src = imgs[currentIndex].src;
}

function closeViewer() {
  viewer.classList.add('hidden');
}

function updateLocalStorage() {
  localStorage.setItem('allImages', JSON.stringify(allImages));
  localStorage.setItem('favoriteImages', JSON.stringify(favoriteImages));
}
