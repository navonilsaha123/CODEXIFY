// ===========================================
// TEAMMATE 3 — JavaScript Application Logic
// File: part3_app.js
// Responsibility: All interactivity including
// auth flows, API calls to TheMealDB, mood
// selection, search, history tracking,
// favourites, profile dashboard, and modal
// ===========================================

// ========================
// PAGE ROUTING
// ========================
let currentPage = 'loginPage';

function showPage(pageId) {
  ['loginPage', 'signupPage', 'forgotPage'].forEach(id => {
    const el = document.getElementById(id);
    if (id === pageId) {
      el.classList.remove('hidden', 'fade-out');
    } else {
      el.classList.add('hidden');
      el.classList.remove('fade-out');
    }
  });
  currentPage = pageId;
  clearMsgs();
}

function clearMsgs() {
  document.querySelectorAll('.error-msg, .success-msg').forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
}

function showSucc(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
}

// ========================
// UTILITY: Toggle password visibility
// ========================
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

// ========================
// PASSWORD STRENGTH CHECKER
// ========================
function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8)           score++;
  if (pw.length >= 12)          score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  return score;
}

function applyStrength(score, fillId, labelId) {
  const fill  = document.getElementById(fillId);
  const label = document.getElementById(labelId);
  const levels = [
    { pct: '0%',   color: '#333',    text: 'Enter a password'  },
    { pct: '20%',  color: '#f44336', text: 'Very weak'         },
    { pct: '40%',  color: '#ff9800', text: 'Weak'              },
    { pct: '60%',  color: '#ffc107', text: 'Fair'              },
    { pct: '80%',  color: '#8bc34a', text: 'Strong'            },
    { pct: '100%', color: '#4caf50', text: 'Very strong 💪'    },
  ];
  const lvl = levels[Math.min(score, 5)];
  fill.style.width      = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent     = lvl.text;
  label.style.color     = lvl.color === '#333' ? 'var(--muted)' : lvl.color;
}

function checkStrength(v)  { applyStrength(v ? getStrength(v) : 0, 'strengthFill',  'strengthLabel');  }
function checkStrength2(v) { applyStrength(v ? getStrength(v) : 0, 'strengthFill2', 'strengthLabel2'); }
function checkStrength3(v) { applyStrength(v ? getStrength(v) : 0, 'strengthFill3', 'strengthLabel3'); }

// ========================
// OTP INPUTS: auto-advance on input
// ========================
document.querySelectorAll('.otp-input').forEach((input, i, all) => {
  input.addEventListener('input', () => {
    if (input.value.length === 1 && i < all.length - 1) all[i + 1].focus();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !input.value && i > 0) all[i - 1].focus();
  });
});

// ========================
// CONTACT TYPE TABS (Sign Up)
// ========================
let signupContactType = 'email';

function switchContactTab(type) {
  signupContactType = type;
  const tabs = document.querySelectorAll('#signupContactTabs .contact-tab');
  tabs[0].classList.toggle('active', type === 'email');
  tabs[1].classList.toggle('active', type === 'phone');
  document.getElementById('signupEmailGroup').style.display = type === 'email' ? '' : 'none';
  document.getElementById('signupPhoneGroup').style.display = type === 'phone' ? '' : 'none';
}

// ========================
// CONTACT TYPE TABS (Forgot Password)
// ========================
let forgotContactType = 'email';

function switchForgotTab(type) {
  forgotContactType = type;
  const tabs = document.querySelectorAll('#forgotPage .contact-tabs .contact-tab');
  tabs[0].classList.toggle('active', type === 'email');
  tabs[1].classList.toggle('active', type === 'phone');
  document.getElementById('forgotEmailGroup').style.display = type === 'email' ? '' : 'none';
  document.getElementById('forgotPhoneGroup').style.display = type === 'phone' ? '' : 'none';
}

// ========================
// SIGN UP
// ========================
let registeredUsers = []; // In-memory user store (swap with backend POST /api/register)

document.getElementById('signupBtn').addEventListener('click', () => {
  const name    = document.getElementById('signupName').value.trim();
  const pw      = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupConfirm').value;
  const email   = document.getElementById('signupEmail').value.trim();
  const phone   = document.getElementById('signupPhone').value.trim();
  const cc      = document.getElementById('signupCountryCode').value;

  document.getElementById('signupError').classList.remove('show');
  document.getElementById('signupSuccess').classList.remove('show');

  if (!name) return showErr('signupError', 'Please enter your name.');
  if (signupContactType === 'email') {
    if (!email || !email.includes('@')) return showErr('signupError', 'Please enter a valid email address.');
  } else {
    if (!phone || !/^\d{7,15}$/.test(phone)) return showErr('signupError', 'Please enter a valid phone number.');
  }
  if (pw.length < 8) return showErr('signupError', 'Password must be at least 8 characters.');
  if (pw !== confirm) return showErr('signupError', 'Passwords do not match.');

  const contact = signupContactType === 'email' ? email : cc + phone;
  if (registeredUsers.find(u => u.contact === contact)) {
    return showErr('signupError', signupContactType === 'email'
      ? 'An account with this email already exists.'
      : 'An account with this phone number already exists.');
  }

  registeredUsers.push({ name, contact, contactType: signupContactType, password: pw });
  showSucc('signupSuccess', 'Account created! Signing you in…');
  setTimeout(() => enterApp(name, name[0], contact, false), 1000);
});

// ========================
// FORGOT PASSWORD — OTP FLOW
// ========================
let generatedOTP = '';

function sendOTP(resend = false) {
  document.getElementById('forgotError').classList.remove('show');
  document.getElementById('forgotSuccess').classList.remove('show');

  let contact = '';
  if (forgotContactType === 'email') {
    const e = document.getElementById('forgotEmail').value.trim();
    if (!e || !e.includes('@')) return showErr('forgotError', 'Please enter a valid email address.');
    contact = e;
  } else {
    const p  = document.getElementById('forgotPhone').value.trim();
    const cc = document.getElementById('forgotCountryCode').value;
    if (!p || !/^\d{7,15}$/.test(p)) return showErr('forgotError', 'Please enter a valid phone number.');
    contact = cc + p;
  }

  // TODO: Replace with real OTP API call — POST /api/send-otp { contact }
  generatedOTP = String(Math.floor(100000 + Math.random() * 900000));

  document.getElementById('forgotStep1').style.display = 'none';
  document.getElementById('forgotStep2').style.display = '';
  document.getElementById('forgotStep3').style.display = 'none';
  document.getElementById('otpHintText').innerHTML =
    `Code sent to ${contact}. (Demo: <strong>${generatedOTP}</strong>)`;

  document.querySelectorAll('.otp-input').forEach(i => i.value = '');
  document.querySelectorAll('.otp-input')[0].focus();

  if (resend) showSucc('forgotSuccess', 'A new code has been sent!');
}

function verifyOTP() {
  const entered = [...document.querySelectorAll('.otp-input')].map(i => i.value).join('');
  document.getElementById('forgotError').classList.remove('show');
  if (entered.length < 6) return showErr('forgotError', 'Please enter all 6 digits.');
  if (entered !== generatedOTP) return showErr('forgotError', 'Incorrect code. Please try again.');
  document.getElementById('forgotStep2').style.display = 'none';
  document.getElementById('forgotStep3').style.display = '';
}

function resetPassword() {
  const pw1 = document.getElementById('newPw1').value;
  const pw2 = document.getElementById('newPw2').value;
  document.getElementById('forgotError').classList.remove('show');
  if (pw1.length < 8) return showErr('forgotError', 'Password must be at least 8 characters.');
  if (pw1 !== pw2)    return showErr('forgotError', 'Passwords do not match.');
  // TODO: Call backend — POST /api/reset-password { contact, newPassword }
  showSucc('forgotSuccess', 'Password reset successfully! Redirecting to sign in…');
  setTimeout(() => {
    showPage('loginPage');
    document.getElementById('forgotStep1').style.display = '';
    document.getElementById('forgotStep2').style.display = 'none';
    document.getElementById('forgotStep3').style.display = 'none';
  }, 1800);
}

// ========================
// LOGIN
// ========================
let currentUser = null;

function enterApp(name, initial, contact, isGuest) {
  currentUser = { name, initial, contact, isGuest };

  document.getElementById('userAvatar').textContent         = initial.toUpperCase();
  document.getElementById('userName').textContent           = name;
  document.getElementById('profilePanelAvatar').textContent = initial.toUpperCase();
  document.getElementById('profilePanelName').textContent   = name;
  document.getElementById('profilePanelEmail').textContent  = isGuest ? 'Browsing as guest' : contact;

  ['loginPage', 'signupPage', 'forgotPage'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.add('fade-out');
    setTimeout(() => el.classList.add('hidden'), 600);
  });

  setTimeout(() => {
    document.getElementById('appWrapper').style.display   = 'block';
    document.getElementById('appWrapper').style.animation = 'fadeUp .5s ease both';
  }, 600);
}

const loginBtn = document.getElementById('loginBtn');
const guestBtn = document.getElementById('guestBtn');

loginBtn.addEventListener('click', () => {
  const email = document.getElementById('emailInput').value.trim();
  const pass  = document.getElementById('passwordInput').value;
  document.getElementById('loginError').classList.remove('show');

  if (!email || !pass) return showErr('loginError', 'Please enter both email and password.');

  loginBtn.textContent = 'Signing in…';
  loginBtn.classList.add('loading-btn');

  // TODO: Replace with real API — POST /api/login { email, password }
  setTimeout(() => {
    if (pass.length >= 6) {
      const n = email.split('@')[0];
      enterApp(n.charAt(0).toUpperCase() + n.slice(1), n[0], email, false);
    } else {
      loginBtn.textContent = 'Sign in';
      loginBtn.classList.remove('loading-btn');
      showErr('loginError', 'Password must be at least 6 characters.');
    }
  }, 900);
});

document.getElementById('passwordInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') loginBtn.click();
});
guestBtn.addEventListener('click', () => enterApp('Guest', 'G', 'guest@moodfood.com', true));

// ========================
// CHANGE PASSWORD (in-app)
// ========================
document.getElementById('changePwBtn').addEventListener('click', () => {
  const cur     = document.getElementById('cpCurrentPw').value;
  const newPw   = document.getElementById('cpNewPw').value;
  const confirm = document.getElementById('cpConfirmPw').value;

  document.getElementById('changePwError').classList.remove('show');
  document.getElementById('changePwSuccess').classList.remove('show');

  if (!cur)              return showErr('changePwError', 'Please enter your current password.');
  if (cur.length < 6)    return showErr('changePwError', 'Current password is incorrect.');
  if (newPw.length < 8)  return showErr('changePwError', 'New password must be at least 8 characters.');
  if (newPw !== confirm)  return showErr('changePwError', 'Passwords do not match.');
  if (newPw === cur)      return showErr('changePwError', 'New password must be different from current.');

  const btn = document.getElementById('changePwBtn');
  btn.textContent = 'Updating…';
  btn.disabled = true;

  // TODO: Replace with real API — POST /api/change-password { currentPassword, newPassword }
  setTimeout(() => {
    btn.textContent = 'Update password';
    btn.disabled = false;
    document.getElementById('cpCurrentPw').value = '';
    document.getElementById('cpNewPw').value     = '';
    document.getElementById('cpConfirmPw').value = '';
    applyStrength(0, 'strengthFill3', 'strengthLabel3');
    showSucc('changePwSuccess', '✅ Password updated successfully!');
  }, 1000);
});

// ========================
// PROFILE PANEL
// ========================
const profileTrigger = document.getElementById('profileTrigger');
const profilePanel   = document.getElementById('profilePanel');
const profileOverlay = document.getElementById('profileOverlay');

function openProfile() {
  profilePanel.classList.add('open');
  profileOverlay.classList.add('open');
  renderDashboard();
  renderHistory('all');
  const isGuest = currentUser?.isGuest;
  document.getElementById('securityGuestNote').style.display   = isGuest ? '' : 'none';
  document.getElementById('securityUserSection').style.display = isGuest ? 'none' : '';
}

function closeProfile() {
  profilePanel.classList.remove('open');
  profileOverlay.classList.remove('open');
}

profileTrigger.addEventListener('click', openProfile);
profileOverlay.addEventListener('click', closeProfile);
document.getElementById('profilePanelClose').addEventListener('click', closeProfile);

document.querySelectorAll('.profile-subtab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.profile-subtab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.profile-subpanel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('subpanel-' + btn.dataset.subtab).classList.add('active');
    if (btn.dataset.subtab === 'history') renderHistory('all');
    if (btn.dataset.subtab === 'security') {
      const isGuest = currentUser?.isGuest;
      document.getElementById('securityGuestNote').style.display   = isGuest ? '' : 'none';
      document.getElementById('securityUserSection').style.display = isGuest ? 'none' : '';
    }
  });
});

function doLogout() {
  closeProfile();
  document.getElementById('appWrapper').style.display = 'none';
  showPage('loginPage');
  document.getElementById('emailInput').value    = '';
  document.getElementById('passwordInput').value = '';
  document.getElementById('loginBtn').textContent = 'Sign in';
  document.getElementById('loginBtn').classList.remove('loading-btn');
  // Reset all session state
  history_ = []; favourites = []; moodStats = {}; lastSession = null;
  currentMood = null; allLoadedMeals = [];
  filterInput.value = '';
  recipesGrid.innerHTML = '';
  currentUser = null;
  showHomePage();
  switchTab('mood');
}

document.getElementById('logoutBtn').addEventListener('click', doLogout);

// ========================
// TAB NAVIGATION
// ========================
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tabId));
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ========================
// PAGE NAVIGATION HELPERS
// ========================
const homePage       = document.getElementById('homePage');
const resultsSection = document.getElementById('resultsSection');

function showHomePage(tab) {
  homePage.style.display = 'block';
  resultsSection.classList.remove('visible');
  setTimeout(() => { resultsSection.style.display = 'none'; }, 500);
  if (tab) switchTab(tab);
}

function showResults() {
  homePage.style.display = 'none';
  resultsSection.style.display = 'block';
  setTimeout(() => resultsSection.classList.add('visible'), 20);
}

// ========================
// HISTORY & SESSION STATE
// ========================
let history_         = [];
let favourites       = [];
let moodStats        = {};
let currentModalMeal = null;
let lastSession      = null;

function logHistory(entry) {
  entry.time = Date.now();
  history_.unshift(entry);
  if (history_.length > 200) history_.pop();
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

// ========================
// RESUME SESSION BANNER
// ========================
function resumeSession() {
  closeProfile();
  if (!lastSession) return;
  if (lastSession.type === 'mood')       selectMood(lastSession.mood);
  else if (lastSession.type === 'category') {
    switchTab('search');
    setTimeout(() => runCategorySearch(lastSession.cat), 100);
  } else if (lastSession.type === 'search') {
    switchTab('search');
    setTimeout(() => {
      document.getElementById('globalSearchInput').value = lastSession.query;
      runNameSearch(lastSession.query);
    }, 100);
  }
}

function updateResumeBanner() {
  const banner = document.getElementById('resumeBanner');
  if (!lastSession) { banner.style.display = 'none'; return; }
  banner.style.display = 'flex';
  if (lastSession.type === 'mood') {
    document.getElementById('resumeIcon').textContent  = lastSession.mood.emoji;
    document.getElementById('resumeTitle').textContent = `Continue ${lastSession.mood.label} mood`;
    document.getElementById('resumeDesc').textContent  = 'Pick up from your last session';
  } else if (lastSession.type === 'search') {
    document.getElementById('resumeIcon').textContent  = '🔍';
    document.getElementById('resumeTitle').textContent = `Search: "${lastSession.query}"`;
    document.getElementById('resumeDesc').textContent  = 'Continue browsing your last search';
  } else if (lastSession.type === 'category') {
    document.getElementById('resumeIcon').textContent  = '🍽️';
    document.getElementById('resumeTitle').textContent = `Browse ${lastSession.cat}`;
    document.getElementById('resumeDesc').textContent  = 'Continue where you left off';
  }
}

// ========================
// DASHBOARD RENDERING
// ========================
function renderDashboard() {
  updateResumeBanner();
  const countries = [...new Set(history_.filter(h => h.area).map(h => h.area))].length;
  document.getElementById('statViewed').textContent    = history_.filter(h => h.type === 'recipe').length;
  document.getElementById('statFavs').textContent      = favourites.length;
  document.getElementById('statMoods').textContent     = history_.filter(h => h.type === 'mood').length;
  document.getElementById('statCountries').textContent = countries;
  renderMoodChart();
  renderFavGrid();
}

function renderMoodChart() {
  const chart = document.getElementById('moodChart');
  const max   = Math.max(1, ...MOODS.map(m => moodStats[m.id] || 0));
  chart.innerHTML = '';
  MOODS.forEach(mood => {
    const count = moodStats[mood.id] || 0;
    const h     = Math.max(4, Math.round((count / max) * 70));
    const wrap  = document.createElement('div');
    wrap.className = 'chart-bar-wrap';
    wrap.innerHTML = `
      <div class="chart-bar-count">${count || ''}</div>
      <div class="chart-bar" style="height:${h}px;background:${mood.color};opacity:${count ? 1 : 0.2}"></div>
      <div class="chart-bar-label">${mood.emoji}</div>
    `;
    chart.appendChild(wrap);
  });
}

function renderFavGrid() {
  const grid = document.getElementById('favGrid');
  if (!favourites.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="empty-icon">💔</span>No saved favourites yet.<br>Open a recipe and hit ♡ Save.</div>`;
    return;
  }
  grid.innerHTML = '';
  favourites.forEach((fav, i) => {
    const card = document.createElement('div');
    card.className = 'fav-card';
    card.style.animationDelay = `${i * 0.05}s`;
    card.innerHTML = `
      <img src="${fav.thumb}/preview" alt="${fav.name}" loading="lazy" onerror="this.src='${fav.thumb}'"/>
      <div class="fav-card-body">
        <h4>${fav.name}</h4>
        <div class="fav-cat">${fav.category || ''} ${fav.area ? '· 🌍 ' + fav.area : ''}</div>
      </div>
      <button class="fav-remove" title="Remove" onclick="event.stopPropagation();removeFav('${fav.id}')">✕</button>
    `;
    card.addEventListener('click', () => openRecipe(fav.id));
    grid.appendChild(card);
  });
}

function toggleFav(meal) {
  const idx = favourites.findIndex(f => f.id === meal.idMeal);
  if (idx > -1) favourites.splice(idx, 1);
  else favourites.unshift({
    id: meal.idMeal, name: meal.strMeal,
    thumb: meal.strMealThumb, category: meal.strCategory, area: meal.strArea
  });
  updateFavBtn(meal.idMeal);
}

function removeFav(id) {
  favourites = favourites.filter(f => f.id !== id);
  renderFavGrid();
  document.getElementById('statFavs').textContent = favourites.length;
}

function updateFavBtn(mealId) {
  const btn   = document.getElementById('modalFavBtn');
  const saved = favourites.some(f => f.id === mealId);
  btn.textContent = saved ? '♥ Saved' : '♡ Save';
  btn.classList.toggle('saved', saved);
}

// ========================
// HISTORY PANEL RENDERING
// ========================
function renderHistory(filter) {
  document.querySelectorAll('.hf-btn').forEach(b => b.classList.toggle('active', b.dataset.hf === filter));
  const list  = document.getElementById('historyList');
  const items = filter === 'all' ? history_ : history_.filter(h => h.type === filter);

  if (!items.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">🕐</span>No ${filter === 'all' ? '' : filter + ' '}history yet.</div>`;
    return;
  }

  list.innerHTML = '';
  items.slice(0, 100).forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.style.animationDelay = `${i * 0.03}s`;

    if (item.type === 'recipe') {
      el.innerHTML = `
        <img class="history-thumb" src="${item.thumb}/preview" alt="${item.name}" onerror="this.src='${item.thumb}'"/>
        <div class="history-info">
          <h4>${item.name}</h4>
          <div class="history-meta">
            <span class="history-type" style="color:var(--accent)">Recipe</span>
            ${item.category ? `<span>${item.category}</span>` : ''}
          </div>
        </div>
        <div class="history-right">
          <span class="history-time">${timeAgo(item.time)}</span>
          <span class="history-badge">Viewed</span>
        </div>`;
      el.addEventListener('click', () => openRecipe(item.id));

    } else if (item.type === 'mood') {
      const mood = MOODS.find(m => m.id === item.moodId);
      el.innerHTML = `
        <div class="history-mood-icon">${mood?.emoji || '🎭'}</div>
        <div class="history-info">
          <h4>${mood?.label || item.moodId} Mood Session</h4>
          <div class="history-meta">
            <span class="history-type" style="color:${mood?.color || 'var(--accent)'}">Mood</span>
            <span>${item.count} dishes</span>
          </div>
        </div>
        <div class="history-right">
          <span class="history-time">${timeAgo(item.time)}</span>
          <span class="history-badge">Session</span>
        </div>`;
      el.addEventListener('click', () => { if (mood) { closeProfile(); selectMood(mood); } });

    } else if (item.type === 'search') {
      el.innerHTML = `
        <div class="history-mood-icon">🔍</div>
        <div class="history-info">
          <h4>"${item.query}"</h4>
          <div class="history-meta">
            <span class="history-type" style="color:#7eb8f7">Search</span>
            <span>${item.results} results</span>
          </div>
        </div>
        <div class="history-right">
          <span class="history-time">${timeAgo(item.time)}</span>
          <span class="history-badge">Query</span>
        </div>`;
      el.addEventListener('click', () => {
        switchTab('search');
        setTimeout(() => {
          document.getElementById('globalSearchInput').value = item.query;
          runNameSearch(item.query);
        }, 100);
      });
    }
    list.appendChild(el);
  });
}

document.querySelectorAll('.hf-btn').forEach(btn =>
  btn.addEventListener('click', () => renderHistory(btn.dataset.hf))
);
document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  if (confirm('Clear all history?')) { history_ = []; renderHistory('all'); renderDashboard(); }
});

// ========================
// MOOD DATA & CATEGORY MAP
// ========================
const MOOD_CATEGORY_MAP = {
  happy:       ['Dessert', 'Breakfast', 'Pasta', 'Pork', 'Chicken'],
  sad:         ['Pasta', 'Beef', 'Pork', 'Chicken', 'Miscellaneous', 'Dessert'],
  stressed:    ['Chicken', 'Seafood', 'Starter', 'Pasta', 'Vegan'],
  romantic:    ['Lamb', 'Seafood', 'Pork', 'Starter', 'Dessert'],
  adventurous: ['Miscellaneous', 'Goat', 'Lamb', 'Seafood', 'Vegan', 'Beef', 'Chicken'],
  lazy:        ['Starter', 'Vegan', 'Vegetarian', 'Miscellaneous', 'Pasta', 'Side'],
  hangry:      ['Beef', 'Chicken', 'Pork', 'Lamb', 'Miscellaneous'],
  healthy:     ['Vegetarian', 'Vegan', 'Seafood', 'Chicken', 'Side', 'Starter'],
};

const MOODS = [
  { id: 'happy',       emoji: '😄', label: 'Happy',       desc: 'Feeling great!',    color: '#f5c842' },
  { id: 'sad',         emoji: '😢', label: 'Sad',         desc: 'Need comfort',      color: '#7eb8f7' },
  { id: 'stressed',    emoji: '😤', label: 'Stressed',    desc: 'Overwhelmed',       color: '#f47c6b' },
  { id: 'romantic',    emoji: '🥰', label: 'Romantic',    desc: 'Date night',        color: '#e87bb0' },
  { id: 'adventurous', emoji: '🌍', label: 'Adventurous', desc: 'Try something new', color: '#7ed8a0' },
  { id: 'lazy',        emoji: '😴', label: 'Lazy',        desc: 'Low effort',        color: '#b39ddb' },
  { id: 'hangry',      emoji: '😡', label: 'Hangry',      desc: 'Feed me NOW',       color: '#ff7043' },
  { id: 'healthy',     emoji: '🥗', label: 'Healthy',     desc: 'Feeling virtuous',  color: '#81c784' },
];

const ALL_CATEGORIES = [
  'Beef', 'Breakfast', 'Chicken', 'Dessert', 'Goat', 'Lamb',
  'Miscellaneous', 'Pasta', 'Pork', 'Seafood', 'Side', 'Starter', 'Vegan', 'Vegetarian'
];

// ========================
// MOOD GRID (render mood buttons)
// ========================
let currentMood    = null;
let allLoadedMeals = [];
let displayedCount = 0;
const PAGE_SIZE    = 16;

const moodsGrid     = document.getElementById('moodsGrid');
const recipesGrid   = document.getElementById('recipesGrid');
const changeMoodBtn = document.getElementById('changeMoodBtn');
const modal         = document.getElementById('modal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const mealCountEl   = document.getElementById('mealCount');
const filterInput   = document.getElementById('filterInput');
const resultsTitle  = document.getElementById('resultsTitle');

MOODS.forEach(mood => {
  const btn = document.createElement('button');
  btn.className = 'mood-btn';
  btn.style.setProperty('--mood-color', mood.color);
  btn.innerHTML = `
    <span class="mood-emoji">${mood.emoji}</span>
    <span class="mood-label">${mood.label}</span>
    <span class="mood-desc">${mood.desc}</span>
  `;
  btn.addEventListener('click', () => selectMood(mood));
  moodsGrid.appendChild(btn);
});

// ========================
// SEARCH TAB
// ========================
const categoryChips     = document.getElementById('categoryChips');
const globalSearchInput = document.getElementById('globalSearchInput');
const globalSearchBtn   = document.getElementById('globalSearchBtn');
const searchResultsWrap = document.getElementById('searchResultsWrap');

const TRENDING = ['Spaghetti', 'Chicken Curry', 'Beef Stew', 'Sushi', 'Tacos', 'Pad Thai', 'Biryani', 'Moussaka'];

ALL_CATEGORIES.forEach(cat => {
  const chip = document.createElement('button');
  chip.className = 'cat-chip';
  chip.textContent = cat;
  chip.addEventListener('click', () => {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    globalSearchInput.value = '';
    runCategorySearch(cat);
  });
  categoryChips.appendChild(chip);
});

function showTrending() {
  searchResultsWrap.innerHTML = `
    <p class="trending-label">✨ Trending searches</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px;">
      ${TRENDING.map(t => `<button class="cat-chip trend-chip" onclick="globalSearchInput.value='${t}';runNameSearch('${t}')">${t}</button>`).join('')}
    </div>
  `;
}
showTrending();

// Search by name — calls TheMealDB search API
async function runNameSearch(query) {
  if (!query.trim()) { showTrending(); return; }
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
  lastSession = { type: 'search', query };
  logHistory({ type: 'search', query, results: 0 });
  searchResultsWrap.innerHTML = `<div class="recipes-grid"><div class="loading">Searching for "${query}"…</div></div>`;

  try {
    // TODO (backend): proxy through /api/search?q= to add caching or auth
    const res   = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const data  = await res.json();
    const meals = data.meals || [];
    const h = history_.find(x => x.type === 'search' && x.query === query);
    if (h) h.results = meals.length;
    renderSearchResults(meals, `Results for "${query}"`);
  } catch {
    searchResultsWrap.innerHTML = `<div class="recipes-grid"><div class="no-results">Search failed. Check your connection.</div></div>`;
  }
}

// Search by category
async function runCategorySearch(cat) {
  lastSession = { type: 'category', cat };
  searchResultsWrap.innerHTML = `<div class="recipes-grid"><div class="loading">Loading ${cat} dishes…</div></div>`;

  try {
    // TODO (backend): proxy through /api/category?c= for server-side caching
    const res   = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(cat)}`);
    const data  = await res.json();
    const meals = (data.meals || []).map(m => ({ ...m, _category: cat }));
    renderSearchResults(meals, `All ${cat} dishes`);
  } catch {
    searchResultsWrap.innerHTML = `<div class="recipes-grid"><div class="no-results">Could not load category.</div></div>`;
  }
}

function renderSearchResults(meals, title) {
  if (!meals.length) {
    searchResultsWrap.innerHTML = `<div class="recipes-grid"><div class="no-results">No dishes found — try another search.</div></div>`;
    return;
  }
  searchResultsWrap.innerHTML = `
    <div class="search-results-header">
      <h3>${title}</h3>
      <span id="searchCount">${meals.length} dish${meals.length !== 1 ? 'es' : ''}</span>
    </div>
    <div class="recipes-grid" id="searchGrid"></div>
  `;
  const grid = document.getElementById('searchGrid');
  meals.forEach((meal, i) => {
    const card   = document.createElement('div');
    card.className = 'recipe-card';
    card.style.animationDelay = `${i * 0.04}s`;
    const mealId = meal.idMeal;
    const cat    = meal._category || meal.strCategory || '';
    const area   = meal.strArea || '';
    card.innerHTML = `
      <img src="${meal.strMealThumb}/preview" alt="${meal.strMeal}" loading="lazy" onerror="this.src='${meal.strMealThumb}'"/>
      <div class="recipe-card-body">
        <h3>${meal.strMeal}</h3>
        <div class="recipe-meta">
          ${cat ? `<span>${cat}</span>` : ''}
          ${area ? `<span>🌍 ${area}</span>` : ''}
        </div>
        <button class="view-btn">See Recipe →</button>
      </div>
    `;
    const btn = card.querySelector('.view-btn');
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'var(--accent)'; btn.style.borderColor = 'var(--accent)';
      btn.style.color = '#111'; btn.style.fontWeight = '600';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'none'; btn.style.borderColor = 'var(--border)';
      btn.style.color = 'var(--text)'; btn.style.fontWeight = 'normal';
    });
    btn.addEventListener('click', e => { e.stopPropagation(); openRecipe(mealId); });
    grid.appendChild(card);
  });
}

globalSearchBtn.addEventListener('click', () => runNameSearch(globalSearchInput.value.trim()));
globalSearchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') runNameSearch(globalSearchInput.value.trim());
});
globalSearchInput.addEventListener('input', () => {
  if (!globalSearchInput.value.trim()) showTrending();
});

// ========================
// MOOD SELECTION & API FETCH
// ========================
async function fetchCategory(cat) {
  try {
    const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(cat)}`);
    const data = await res.json();
    return (data.meals || []).map(m => ({ ...m, _category: cat }));
  } catch { return []; }
}

async function selectMood(mood) {
  currentMood    = mood;
  allLoadedMeals = [];
  displayedCount = 0;
  moodStats[mood.id] = (moodStats[mood.id] || 0) + 1;
  lastSession    = { type: 'mood', mood };

  resultsTitle.innerHTML = `<em style="color:${mood.color};font-style:normal;font-weight:700">${mood.emoji} ${mood.label}</em> — dishes from around the world`;
  recipesGrid.innerHTML  = `<div class="loading">Fetching dishes from around the world…</div>`;
  mealCountEl.textContent = '';
  filterInput.value = '';
  showResults();

  const cats    = MOOD_CATEGORY_MAP[mood.id] || ['Miscellaneous'];
  const results = await Promise.all(cats.map(fetchCategory));
  const seen    = new Set();
  allLoadedMeals = results.flat().filter(m => {
    if (seen.has(m.idMeal)) return false;
    seen.add(m.idMeal);
    return true;
  }).sort(() => Math.random() - 0.5);

  logHistory({ type: 'mood', moodId: mood.id, count: allLoadedMeals.length });
  mealCountEl.textContent = `${allLoadedMeals.length} dishes found`;
  recipesGrid.innerHTML   = '';
  displayedCount          = 0;
  renderMoodPage(allLoadedMeals);
}

// Paginated mood results rendering
function renderMoodPage(pool) {
  const old = document.getElementById('loadMoreBtn');
  if (old) old.remove();

  const chunk    = pool.slice(displayedCount, displayedCount + PAGE_SIZE);
  displayedCount += chunk.length;

  chunk.forEach((meal, i) => {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.style.animationDelay = `${i * 0.04}s`;
    const mealId = meal.idMeal;
    const cat    = meal._category || '';
    card.innerHTML = `
      <img src="${meal.strMealThumb}/preview" alt="${meal.strMeal}" loading="lazy" onerror="this.src='${meal.strMealThumb}'"/>
      <div class="recipe-card-body">
        <h3>${meal.strMeal}</h3>
        <div class="recipe-meta"><span>${cat}</span></div>
        <button class="view-btn">See Recipe →</button>
      </div>
    `;
    const btn = card.querySelector('.view-btn');
    btn.addEventListener('mouseenter', () => {
      btn.style.background = currentMood.color; btn.style.borderColor = currentMood.color;
      btn.style.color = '#111'; btn.style.fontWeight = '600';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'none'; btn.style.borderColor = 'var(--border)';
      btn.style.color = 'var(--text)'; btn.style.fontWeight = 'normal';
    });
    btn.addEventListener('click', e => { e.stopPropagation(); openRecipe(mealId); });
    recipesGrid.appendChild(card);
  });

  if (displayedCount < pool.length) {
    const lm = document.createElement('button');
    lm.id = 'loadMoreBtn';
    lm.className = 'load-more-btn';
    lm.textContent = `Load more — ${pool.length - displayedCount} more dishes`;
    lm.addEventListener('click', () => { lm.remove(); renderMoodPage(pool); });
    recipesGrid.appendChild(lm);
  }
}

// Filter mood results by name or category
filterInput.addEventListener('input', () => {
  const q = filterInput.value.trim().toLowerCase();
  Array.from(recipesGrid.querySelectorAll('.recipe-card,.load-more-btn,.no-results')).forEach(el => el.remove());
  displayedCount = 0;
  if (!q) {
    mealCountEl.textContent = `${allLoadedMeals.length} dishes found`;
    renderMoodPage(allLoadedMeals);
    return;
  }
  const filtered = allLoadedMeals.filter(m =>
    m.strMeal.toLowerCase().includes(q) || (m._category || '').toLowerCase().includes(q)
  );
  mealCountEl.textContent = `${filtered.length} of ${allLoadedMeals.length} dishes`;
  if (!filtered.length) {
    recipesGrid.innerHTML = `<div class="no-results">No dishes match "<strong>${filterInput.value}</strong>"</div>`;
  } else {
    renderMoodPage(filtered);
  }
});

changeMoodBtn.addEventListener('click', () => showHomePage('mood'));

// ========================
// RECIPE MODAL
// ========================
async function openRecipe(id) {
  // Reset modal content while loading
  document.getElementById('modalImg').src             = '';
  document.getElementById('modalName').textContent    = 'Loading…';
  document.getElementById('modalInstructions').textContent = '';
  document.getElementById('modalIngredients').innerHTML   = '';
  document.getElementById('modalTags').innerHTML           = '';
  document.getElementById('modalYt').style.display        = 'none';
  document.getElementById('modalFavBtn').textContent      = '♡ Save';
  document.getElementById('modalFavBtn').classList.remove('saved');
  modal.classList.add('open');
  currentModalMeal = null;

  try {
    // TODO (backend): proxy through /api/meal/:id for caching or premium key
    const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (!data.meals?.length) { document.getElementById('modalName').textContent = 'Recipe not found.'; return; }

    const meal = data.meals[0];
    currentModalMeal = meal;
    logHistory({ type: 'recipe', id: meal.idMeal, name: meal.strMeal, thumb: meal.strMealThumb, category: meal.strCategory, area: meal.strArea });

    // Build ingredients list from MealDB's indexed fields
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing  = meal[`strIngredient${i}`];
      const meas = meal[`strMeasure${i}`];
      if (ing && ing.trim()) ingredients.push(`${meas ? meas.trim() + ' ' : ''}${ing.trim()}`);
    }

    document.getElementById('modalImg').src             = meal.strMealThumb || '';
    document.getElementById('modalName').textContent    = meal.strMeal || 'Unknown';
    document.getElementById('modalIngredients').innerHTML = ingredients.map(i => `<li>${i}</li>`).join('');
    document.getElementById('modalInstructions').textContent = meal.strInstructions || 'No instructions available.';

    const tags = document.getElementById('modalTags');
    tags.innerHTML = '';
    if (meal.strArea)     tags.innerHTML += `<span>🌍 ${meal.strArea}</span>`;
    if (meal.strCategory) tags.innerHTML += `<span>🍽 ${meal.strCategory}</span>`;
    if (meal.strTags) {
      meal.strTags.split(',').slice(0, 4).forEach(t => {
        if (t.trim()) tags.innerHTML += `<span>${t.trim()}</span>`;
      });
    }

    const ytBtn = document.getElementById('modalYt');
    if (meal.strYoutube?.trim()) {
      ytBtn.href = meal.strYoutube;
      ytBtn.style.display = 'inline-flex';
    } else {
      ytBtn.style.display = 'none';
    }

    updateFavBtn(meal.idMeal);
  } catch {
    document.getElementById('modalName').textContent         = 'Failed to load recipe.';
    document.getElementById('modalInstructions').textContent = 'Please check your internet connection.';
  }
}

document.getElementById('modalFavBtn').addEventListener('click', () => {
  if (currentModalMeal) {
    toggleFav(currentModalMeal);
    document.getElementById('statFavs').textContent = favourites.length;
  }
});

modalCloseBtn.addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });