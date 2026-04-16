// ===== Screen Management =====
const screenOrder = [
  'screen-splash',
  'screen-intro',
  'screen-challenge',
  'screen-mis1',
  'screen-mis2',
  'screen-play',
  // Game screens inserted dynamically
  'hint-D', 'scan-D',
  'hint-E', 'scan-E',
  'hint-S', 'scan-S',
  'hint-I', 'scan-I',
  'hint-G', 'scan-G',
  'hint-N', 'scan-N',
  'hint-X', 'scan-X',
  'screen-complete'
];

const letters = ['D', 'E', 'S', 'I', 'G', 'N', 'X'];
const foundLetters = new Set();
let currentScreenIndex = 0;

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
  // Auto-advance splash after tap or 3s
  const splash = document.getElementById('screen-splash');
  splash.addEventListener('click', () => nextScreen());
  setTimeout(() => {
    if (currentScreenIndex === 0) nextScreen();
  }, 3000);

  // Swipe support
  let touchStartX = 0;
  document.getElementById('app').addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  document.getElementById('app').addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 60) {
      if (diff < 0) nextScreen();
      else prevScreen();
    }
  }, { passive: true });
});

// ===== Navigation =====
function goToScreen(screenId) {
  const targetIndex = screenOrder.indexOf(screenId);
  if (targetIndex === -1) return;

  const currentScreen = document.querySelector('.screen.active');
  const targetScreen = document.getElementById(screenId);

  if (!currentScreen || !targetScreen) return;

  const goingForward = targetIndex > currentScreenIndex;

  currentScreen.classList.remove('active');
  currentScreen.classList.add(goingForward ? 'exit-left' : '');
  setTimeout(() => {
    currentScreen.classList.remove('exit-left');
  }, 400);

  targetScreen.classList.add('active');
  currentScreenIndex = targetIndex;

  updateProgressBar();
}

function nextScreen() {
  if (currentScreenIndex >= screenOrder.length - 1) return;
  const nextId = screenOrder[currentScreenIndex + 1];
  goToScreen(nextId);
}

function prevScreen() {
  if (currentScreenIndex <= 0) return;
  const prevId = screenOrder[currentScreenIndex - 1];
  goToScreen(prevId);
}

// ===== Auth Handlers =====
function handleSignup() {
  const user = document.getElementById('signup-user').value;
  const pass = document.getElementById('signup-pass').value;
  const confirm = document.getElementById('signup-confirm').value;

  if (!user || !pass || !confirm) {
    shakeElement(document.querySelector('#screen-signup .btn-auth'));
    return;
  }

  if (pass !== confirm) {
    shakeElement(document.getElementById('signup-confirm').parentElement);
    return;
  }

  // Proceed to game after signup
  goToScreen('hint-D');
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🔒';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

// ===== Letter Finding Game =====
function findLetter(letter) {
  const btn = document.querySelector(`#scan-${letter} .btn-scan`);
  const reveal = document.getElementById(`reveal-${letter}`);
  const scanLine = document.querySelector(`#scan-${letter} .scan-line`);

  btn.classList.add('scanning');
  btn.textContent = 'Scanning...';

  // Simulate scan delay
  setTimeout(() => {
    scanLine.style.display = 'none';
    reveal.classList.add('found');
    foundLetters.add(letter);
    updateProgressBar();

    btn.textContent = 'Found!';
    btn.style.background = 'rgba(0, 230, 118, 0.3)';
    btn.style.borderColor = '#00E676';

    // Auto-advance to next letter or completion
    setTimeout(() => {
      const letterIndex = letters.indexOf(letter);
      if (letterIndex < letters.length - 1) {
        goToScreen(`hint-${letters[letterIndex + 1]}`);
      } else {
        goToScreen('screen-complete');
        launchConfetti();
      }
    }, 1500);
  }, 2000);
}

// ===== Progress Bar =====
function updateProgressBar() {
  const bar = document.getElementById('progress-bar');
  const currentId = screenOrder[currentScreenIndex];
  const isGameScreen = currentId.startsWith('hint-') || currentId.startsWith('scan-');

  if (isGameScreen) {
    bar.classList.add('visible');
  } else {
    bar.classList.remove('visible');
  }

  document.querySelectorAll('.progress-letter').forEach(el => {
    const letter = el.dataset.letter;
    el.classList.remove('found', 'current');

    if (foundLetters.has(letter)) {
      el.classList.add('found');
    }

    if (currentId.includes(`-${letter}`)) {
      el.classList.add('current');
    }
  });
}

// ===== Confetti Effect =====
function launchConfetti() {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F0D68A', '#C2185B'];
  const container = document.getElementById('screen-complete');

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: absolute;
      width: ${Math.random() * 10 + 5}px;
      height: ${Math.random() * 10 + 5}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation: confetti ${Math.random() * 2 + 1}s ease-out forwards;
      z-index: 0;
    `;
    container.appendChild(confetti);
  }
}

// ===== Utility =====
function shakeElement(el) {
  el.style.animation = 'none';
  el.offsetHeight; // trigger reflow
  el.style.animation = 'shake 0.4s ease';
  setTimeout(() => { el.style.animation = ''; }, 400);
}

function resetGame() {
  foundLetters.clear();

  // Reset all scan screens
  letters.forEach(letter => {
    const reveal = document.getElementById(`reveal-${letter}`);
    const btn = document.querySelector(`#scan-${letter} .btn-scan`);
    const scanLine = document.querySelector(`#scan-${letter} .scan-line`);

    if (reveal) reveal.classList.remove('found');
    if (btn) {
      btn.classList.remove('scanning');
      btn.textContent = 'Tap to Scan';
      btn.style.background = '';
      btn.style.borderColor = '';
    }
    if (scanLine) scanLine.style.display = '';
  });

  // Remove confetti
  document.querySelectorAll('#screen-complete div[style*="confetti"]').forEach(el => el.remove());

  // Reset form fields
  document.querySelectorAll('input').forEach(input => {
    if (input.type !== 'checkbox') input.value = '';
  });

  updateProgressBar();
  goToScreen('screen-splash');
}

// Add shake animation dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }
`;
document.head.appendChild(style);
