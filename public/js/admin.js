// Admin helper functions

// Auth guard - redirect non-admin users
function requireAdmin() {
  if (!API.isLoggedIn() || !API.isAdmin()) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}

// Modal helpers
function openModal(title, bodyHtml) {
  let overlay = document.getElementById('admin-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'admin-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 id="admin-modal-title"></h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body" id="admin-modal-body"></div>
      </div>
    `;
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
  }
  document.getElementById('admin-modal-title').textContent = title;
  document.getElementById('admin-modal-body').innerHTML = bodyHtml;
  overlay.classList.add('show');
}

function closeModal() {
  const overlay = document.getElementById('admin-modal-overlay');
  if (overlay) overlay.classList.remove('show');
}

// Confirm action helper - returns a promise
function confirmAction(message) {
  return new Promise(function (resolve) {
    const html = `
      <p style="margin-bottom: 24px; font-size: 15px;">${escapeHtml(message)}</p>
      <div class="modal-footer" style="padding: 0; border: none;">
        <button class="btn btn-outline-teal" onclick="closeModal(); window._confirmResolve(false);">取消</button>
        <button class="btn btn-danger" onclick="closeModal(); window._confirmResolve(true);">確認</button>
      </div>
    `;
    window._confirmResolve = resolve;
    openModal('確認操作', html);
  });
}

// Active sidebar link highlighting
function initAdminSidebar() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.admin-sidebar a').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
    }
  });
}

// Status tag helpers
function statusTag(status, labelMap) {
  const colorMap = {
    active: 'green', inactive: 'gray', suspended: 'red',
    pending: 'yellow', confirmed: 'green', cancelled: 'red',
    paid: 'green', unpaid: 'yellow', refunded: 'red',
    published: 'green', draft: 'gray'
  };
  const color = colorMap[status] || 'gray';
  const label = (labelMap && labelMap[status]) || status;
  return '<span class="tag tag-' + color + '">' + escapeHtml(label) + '</span>';
}

const STATUS_LABELS = {
  active: '啟用', inactive: '停用', suspended: '停權'
};

const ROLE_LABELS = {
  member: '一般會員', admin: '管理員'
};

const REG_STATUS_LABELS = {
  pending: '待確認', confirmed: '已確認', cancelled: '已取消'
};

const PAY_STATUS_LABELS = {
  unpaid: '未繳費', paid: '已繳費', refunded: '已退費'
};

// Init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
  if (!requireAdmin()) return;
  initAdminSidebar();
});
