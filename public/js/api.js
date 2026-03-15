// API Helper
const API = {
  baseURL: '/api',

  getToken() {
    return localStorage.getItem('cilt_token');
  },

  setToken(token) {
    localStorage.setItem('cilt_token', token);
  },

  removeToken() {
    localStorage.removeItem('cilt_token');
    localStorage.removeItem('cilt_member');
  },

  getMember() {
    const m = localStorage.getItem('cilt_member');
    return m ? JSON.parse(m) : null;
  },

  setMember(member) {
    localStorage.setItem('cilt_member', JSON.stringify(member));
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  isAdmin() {
    const m = this.getMember();
    return m && m.role === 'admin';
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const resp = await fetch(url, { ...options, headers });
      const data = await resp.json();
      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          this.removeToken();
          if (!window.location.pathname.includes('login')) {
            window.location.href = '/login.html';
          }
        }
        throw new Error(data.error || '請求失敗');
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  get(endpoint, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${endpoint}?${qs}` : endpoint;
    return this.request(url);
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  async uploadFile(endpoint, formData) {
    const token = this.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resp = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || '上傳失敗');
    return data;
  }
};

// Toast notification
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Format helpers
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const rocYear = d.getFullYear() - 1911;
  return `${rocYear}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const rocYear = d.getFullYear() - 1911;
  return `${rocYear}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatMoney(amount) {
  return 'NT$ ' + Number(amount).toLocaleString();
}

function formatFileSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Category labels
const NEWS_CATEGORIES = {
  course_info: '課程資訊',
  announcement: '協會公告',
  activity: '活動'
};

const ACTIVITY_CATEGORIES = {
  seminar: '研討會',
  course: '課程',
  visit: '參訪',
  forum: '論壇',
  exhibition: '展覽',
  lecture: '講座',
  meeting: '會員大會'
};

const COURSE_TYPES = {
  seminar: '研討會',
  general: '一般課程',
  certification: '認證課程'
};

const CILT_LEVELS = {
  0: '無',
  1: 'Level 1',
  2: 'Level 2',
  3: 'Level 3',
  4: 'Level 4'
};

// Pagination component
function renderPagination(container, { page, totalPages, onChange }) {
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '<div class="pagination">';
  if (page > 1) html += `<button class="pagination-btn" data-page="${page - 1}">&laquo; 上一頁</button>`;

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  if (start > 1) html += '<span class="pagination-dots">...</span>';
  for (let i = start; i <= end; i++) {
    html += `<button class="pagination-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  if (end < totalPages) html += '<span class="pagination-dots">...</span>';

  if (page < totalPages) html += `<button class="pagination-btn" data-page="${page + 1}">下一頁 &raquo;</button>`;
  html += '</div>';

  container.innerHTML = html;
  container.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => onChange(parseInt(btn.dataset.page)));
  });
}
