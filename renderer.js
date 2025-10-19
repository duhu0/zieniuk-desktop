const { ipcRenderer } = require('electron');

const character = document.getElementById('character');
const characterImg = document.getElementById('character-img');
const clickSound = document.getElementById('click-sound');

let screenWidth, screenHeight;
let charX = Math.random() * (window.innerWidth - 100);
let charY = Math.random() * (window.innerHeight - 100);
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let isWalking = false;
let walkInterval;
let isHijackingMouse = false;

ipcRenderer.invoke('get-screen-size').then((size) => {
  screenWidth = size.width;
  screenHeight = size.height;
  updatePosition();
  startRandomWalking();
});

ipcRenderer.on('mouse-hijack-position', (event, mousePos) => {
  if (isHijackingMouse) {
    charX = mousePos.x - 50;
    charY = mousePos.y - 50;
    
    charX = Math.max(0, Math.min(charX, screenWidth - 100));
    charY = Math.max(0, Math.min(charY, screenHeight - 100));
    
    updatePosition();
  }
});

function updatePosition() {
  character.style.left = charX + 'px';
  character.style.top = charY + 'px';
}

function playSound() {
  clickSound.currentTime = 0;
  clickSound.play().catch(err => console.log('Sound play failed:', err));
}

character.addEventListener('mouseenter', () => {
  ipcRenderer.invoke('set-ignore-mouse', false);
});

character.addEventListener('mouseleave', () => {
  if (!isDragging && !isHijackingMouse) {
    ipcRenderer.invoke('set-ignore-mouse', true);
  }
});

character.addEventListener('click', async () => {
  if (isHijackingMouse) return;
  
  playSound();
  isHijackingMouse = true;
  
  character.style.transform = 'scale(1.2)';
  setTimeout(() => {
    character.style.transform = 'scale(1)';
  }, 100);
  
  await ipcRenderer.invoke('hijack-mouse');
  
  isHijackingMouse = false;
  ipcRenderer.invoke('set-ignore-mouse', true);
});

character.addEventListener('mousedown', (e) => {
  if (isHijackingMouse) return;
  
  isDragging = true;
  character.classList.add('dragging');
  dragOffsetX = e.clientX - charX;
  dragOffsetY = e.clientY - charY;
  stopWalking();
  ipcRenderer.invoke('set-ignore-mouse', false);
  e.stopPropagation();
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    charX = e.clientX - dragOffsetX;
    charY = e.clientY - dragOffsetY;
    
    charX = Math.max(0, Math.min(charX, screenWidth - 100));
    charY = Math.max(0, Math.min(charY, screenHeight - 100));
    
    updatePosition();
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    character.classList.remove('dragging');
    startRandomWalking();
    ipcRenderer.invoke('set-ignore-mouse', true);
  }
});

function startRandomWalking() {
  stopWalking();
  walkInterval = setInterval(() => {
    if (!isDragging && !isHijackingMouse) {
      randomWalk();
    }
  }, 3000);
}

function stopWalking() {
  if (walkInterval) {
    clearInterval(walkInterval);
    walkInterval = null;
  }
  character.classList.remove('walking');
}

function randomWalk() {
  const targetX = Math.random() * (screenWidth - 100);
  const targetY = Math.random() * (screenHeight - 100);
  
  if (targetX < charX) {
    characterImg.style.transform = 'scaleX(-1)';
  } else {
    characterImg.style.transform = 'scaleX(1)';
  }
  
  character.classList.add('walking');
  charX = targetX;
  charY = targetY;
  updatePosition();
  
  setTimeout(() => {
    character.classList.remove('walking');
  }, 500);
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
    window.close();
  }
});