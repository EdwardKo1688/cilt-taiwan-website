// App initialization
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initAuthUI();
  updateROCDate();
});

function initNavbar() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('active');
      toggle.classList.toggle('active');
    });
  }

  // Scroll effect
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }
  });

  // Active nav link
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (href !== '/' && currentPath.startsWith(href.replace('.html', '')))) {
      link.classList.add('active');
    }
  });
}

function initAuthUI() {
  const authArea = document.querySelector('.auth-area');
  if (!authArea) return;

  if (API.isLoggedIn()) {
    const member = API.getMember();
    authArea.innerHTML = `
      <div class="auth-user">
        <span class="user-name">${escapeHtml(member?.name || '會員')}</span>
        <div class="user-dropdown">
          <a href="/member/dashboard.html" class="dropdown-item">會員中心</a>
          ${member?.role === 'admin' ? '<a href="/admin/index.html" class="dropdown-item">管理後台</a>' : ''}
          <a href="#" class="dropdown-item" onclick="logout(); return false;">登出</a>
        </div>
      </div>
    `;
  } else {
    authArea.innerHTML = `
      <a href="/login.html" class="btn btn-sm btn-outline">登入</a>
      <a href="/signup.html" class="btn btn-sm btn-primary">註冊</a>
    `;
  }
}

function logout() {
  API.removeToken();
  window.location.href = '/';
}

function updateROCDate() {
  const el = document.querySelector('.roc-date');
  if (!el) return;
  const now = new Date();
  const rocYear = now.getFullYear() - 1911;
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  el.textContent = `${rocYear} 年 ${String(now.getMonth() + 1).padStart(2, '0')} 月 ${String(now.getDate()).padStart(2, '0')} 日 星期${days[now.getDay()]}`;
}

// Sidebar menu toggle
function toggleSidebarMenu(el) {
  el.parentElement.classList.toggle('open');
}

// Require login helper
function requireLogin() {
  if (!API.isLoggedIn()) {
    showToast('請先登入', 'error');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    }, 500);
    return false;
  }
  return true;
}
