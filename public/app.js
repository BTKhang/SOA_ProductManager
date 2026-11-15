const AUTH_SERVICE_URL = 'http://localhost:3000';
const PRODUCT_SERVICE_URL = 'http://localhost:3001';
const ORDER_SERVICE_URL = 'http://localhost:3002';

let currentToken = localStorage.getItem('auth_token') || '';
let currentUser = JSON.parse(localStorage.getItem('user_info') || 'null');
let temp2FAToken = '';
let pendingUserName = '';
let productList = [];
let orderList = [];
let currentCart = [];
let currentViewingOrderId = null;
let currentTab = 'products';

// DOM Auth
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const mainNavTabs = document.getElementById('mainNavTabs');
const navTabProducts = document.getElementById('navTabProducts');
const navTabOrders = document.getElementById('navTabOrders');
const navUserBox = document.getElementById('navUserBox');
const navUserName = document.getElementById('navUserName');
const btnLogout = document.getElementById('btnLogout');

const authTabs = document.getElementById('authTabs');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');

const loginForm = document.getElementById('loginForm');
const inputLoginUser = document.getElementById('inputLoginUser');
const inputLoginPass = document.getElementById('inputLoginPass');

const registerForm = document.getElementById('registerForm');
const inputRegUser = document.getElementById('inputRegUser');
const inputRegPass = document.getElementById('inputRegPass');
const inputRegPassConfirm = document.getElementById('inputRegPassConfirm');

const twoFactorForm = document.getElementById('twoFactorForm');
const inputOtp = document.getElementById('inputOtp');
const generatedOtpCode = document.getElementById('generatedOtpCode');
const btnBackToLogin = document.getElementById('btnBackToLogin');

// DOM Products View
const productsViewSection = document.getElementById('productsViewSection');
const productTableBody = document.getElementById('productTableBody');
const searchInput = document.getElementById('searchInput');
const btnReload = document.getElementById('btnReload');
const btnOpenCreateModal = document.getElementById('btnOpenCreateModal');
const productCountBadge = document.getElementById('productCountBadge');

// Summary Stats Products
const statTotalItems = document.getElementById('statTotalItems');
const statTotalQuantity = document.getElementById('statTotalQuantity');
const statTotalValue = document.getElementById('statTotalValue');

// Product Modals
const productModal = document.getElementById('productModal');
const modalTitle = document.getElementById('modalTitle');
const productForm = document.getElementById('productForm');
const formProductId = document.getElementById('formProductId');
const formName = document.getElementById('formName');
const formDescription = document.getElementById('formDescription');
const formImage = document.getElementById('formImage');
const formImagePreviewBox = document.getElementById('formImagePreviewBox');
const formPrice = document.getElementById('formPrice');
const formQuantity = document.getElementById('formQuantity');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelModal = document.getElementById('btnCancelModal');

// Product Detail Modal
const detailModal = document.getElementById('detailModal');
const detailContent = document.getElementById('detailContent');
const btnCloseDetailModal = document.getElementById('btnCloseDetailModal');
const btnCloseDetailBtn = document.getElementById('btnCloseDetailBtn');

// DOM Orders View
const ordersViewSection = document.getElementById('ordersViewSection');
const statTotalOrders = document.getElementById('statTotalOrders');
const statPendingOrders = document.getElementById('statPendingOrders');
const statCompletedRevenue = document.getElementById('statCompletedRevenue');
const orderCountBadge = document.getElementById('orderCountBadge');
const orderStatusFilter = document.getElementById('orderStatusFilter');
const btnReloadOrders = document.getElementById('btnReloadOrders');
const btnOpenCreateOrderModal = document.getElementById('btnOpenCreateOrderModal');
const orderTableBody = document.getElementById('orderTableBody');

// Order Create Modal
const orderCreateModal = document.getElementById('orderCreateModal');
const btnCloseOrderCreateModal = document.getElementById('btnCloseOrderCreateModal');
const btnCancelOrderCreate = document.getElementById('btnCancelOrderCreate');
const orderCreateForm = document.getElementById('orderCreateForm');
const orderCustomerName = document.getElementById('orderCustomerName');
const orderCustomerEmail = document.getElementById('orderCustomerEmail');
const selectOrderProduct = document.getElementById('selectOrderProduct');
const inputOrderProductQty = document.getElementById('inputOrderProductQty');
const btnAddItemToCart = document.getElementById('btnAddItemToCart');
const cartTableBody = document.getElementById('cartTableBody');
const cartTotalAmountDisplay = document.getElementById('cartTotalAmountDisplay');

// Order Detail Modal
const orderDetailModal = document.getElementById('orderDetailModal');
const btnCloseOrderDetailModal = document.getElementById('btnCloseOrderDetailModal');
const btnCloseOrderDetailBtn = document.getElementById('btnCloseOrderDetailBtn');
const orderDetailSummary = document.getElementById('orderDetailSummary');
const orderDetailItemsBody = document.getElementById('orderDetailItemsBody');

// Toast
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toastIcon');
const toastMessage = document.getElementById('toastMessage');

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    if (type === 'success') {
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-400"></i>';
    } else if (type === 'error') {
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-xmark text-rose-400"></i>';
    } else {
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-info text-blue-400"></i>';
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

function updateAppView() {
    if (currentToken) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        if (mainNavTabs) mainNavTabs.classList.remove('hidden');
        navUserBox.classList.remove('hidden');
        navUserName.textContent = currentUser ? (currentUser.UserName || currentUser.username) : 'Người dùng';
        switchTab(currentTab);
    } else {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        if (mainNavTabs) mainNavTabs.classList.add('hidden');
        navUserBox.classList.add('hidden');
        showLoginForm();
    }
}

// Chuyển tab giữa Sản phẩm và Đơn hàng
function switchTab(tab) {
    currentTab = tab;
    if (tab === 'products') {
        productsViewSection.classList.remove('hidden');
        ordersViewSection.classList.add('hidden');
        navTabProducts.className = 'px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 transition';
        navTabOrders.className = 'px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition';
        loadProducts();
    } else {
        productsViewSection.classList.add('hidden');
        ordersViewSection.classList.remove('hidden');
        navTabOrders.className = 'px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 transition';
        navTabProducts.className = 'px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition';
        loadOrders();
    }
}

navTabProducts.addEventListener('click', () => switchTab('products'));
navTabOrders.addEventListener('click', () => switchTab('orders'));

function showLoginForm() {
    authTabs.classList.remove('hidden');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    twoFactorForm.classList.add('hidden');

    tabLoginBtn.className = 'flex-1 py-3 text-center border-b-2 border-blue-600 text-blue-600 bg-white transition';
    tabRegisterBtn.className = 'flex-1 py-3 text-center border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition';
}

function showRegisterForm() {
    authTabs.classList.remove('hidden');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    twoFactorForm.classList.add('hidden');

    tabRegisterBtn.className = 'flex-1 py-3 text-center border-b-2 border-blue-600 text-blue-600 bg-white transition';
    tabLoginBtn.className = 'flex-1 py-3 text-center border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition';
}

tabLoginBtn.addEventListener('click', showLoginForm);
tabRegisterBtn.addEventListener('click', showRegisterForm);

// Đăng ký tài khoản
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userName = inputRegUser.value.trim();
    const password = inputRegPass.value.trim();
    const confirmPass = inputRegPassConfirm.value.trim();

    if (password !== confirmPass) {
        showToast('Mật khẩu xác nhận không khớp', 'error');
        return;
    }

    try {
        const res = await fetch(`${AUTH_SERVICE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            showToast('Đăng ký tài khoản thành công');
            inputLoginUser.value = userName;
            inputLoginPass.value = password;
            registerForm.reset();
            showLoginForm();
        } else {
            showToast(data.message || 'Đăng ký không thành công', 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối máy chủ xác thực: ' + err.message, 'error');
    }
});

// Đăng nhập bước 1
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userName = inputLoginUser.value.trim();
    const password = inputLoginPass.value.trim();

    try {
        const res = await fetch(`${AUTH_SERVICE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName, password })
        });
        const data = await res.json();

        if (res.ok && data.requires2FA) {
            temp2FAToken = data.tempToken;
            pendingUserName = userName;
            generatedOtpCode.textContent = data.otpCode || '123456';

            authTabs.classList.add('hidden');
            loginForm.classList.add('hidden');
            registerForm.classList.add('hidden');
            twoFactorForm.classList.remove('hidden');

            inputOtp.value = '';
            inputOtp.focus();
            showToast('Vui lòng nhập mã xác thực 2FA');
        } else {
            showToast(data.message || 'Tài khoản hoặc mật khẩu không đúng', 'error');
        }
    } catch (err) {
        // Fallback dev token khi chạy độc lập
        try {
            const fbRes = await fetch(`${PRODUCT_SERVICE_URL}/dev/token`, { method: 'POST' });
            const fbData = await fbRes.json();
            if (fbData.token) {
                currentToken = fbData.token;
                currentUser = { UserName: userName };
                localStorage.setItem('auth_token', currentToken);
                localStorage.setItem('user_info', JSON.stringify(currentUser));
                showToast('Đăng nhập thành công');
                updateAppView();
                return;
            }
        } catch (e) {}
        showToast('Lỗi kết nối: ' + err.message, 'error');
    }
});

// Xác thực 2FA bước 2
twoFactorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otpCode = inputOtp.value.trim();

    try {
        const res = await fetch(`${AUTH_SERVICE_URL}/verify-2fa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tempToken: temp2FAToken,
                userName: pendingUserName,
                otpCode
            })
        });
        const data = await res.json();

        if (res.ok && data.token) {
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('auth_token', currentToken);
            localStorage.setItem('user_info', JSON.stringify(currentUser));
            showToast('Đăng nhập thành công');
            updateAppView();
        } else {
            showToast(data.message || 'Mã xác thực không hợp lệ', 'error');
        }
    } catch (err) {
        showToast('Lỗi xác thực: ' + err.message, 'error');
    }
});

btnBackToLogin.addEventListener('click', showLoginForm);

// Đăng xuất
btnLogout.addEventListener('click', () => {
    currentToken = '';
    currentUser = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    showToast('Đã đăng xuất', 'info');
    updateAppView();
});

// ================= TIỆN ÍCH DÙNG CHUNG =================

function getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }
    return headers;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', { hour12: false });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ================= QUẢN LÝ SẢN PHẨM =================

function updateFormImagePreview(url) {
    if (url && url.trim().startsWith('http')) {
        formImagePreviewBox.innerHTML = `<img src="${escapeHtml(url.trim())}" class="w-full h-full object-cover" onerror="this.onerror=null;this.parentElement.innerHTML='<i class=\\'fa-regular fa-image text-slate-400 text-xs\\'></i>';">`;
    } else {
        formImagePreviewBox.innerHTML = `<i class="fa-regular fa-image text-slate-400 text-xs"></i>`;
    }
}

formImage.addEventListener('input', (e) => {
    updateFormImagePreview(e.target.value);
});

async function loadProducts() {
    productTableBody.innerHTML = `
        <tr>
            <td colspan="8" class="py-12 text-center text-slate-400">
                <i class="fa-solid fa-spinner fa-spin text-xl text-blue-500 mb-2"></i>
                <p>Đang tải dữ liệu...</p>
            </td>
        </tr>
    `;

    try {
        const res = await fetch(`${PRODUCT_SERVICE_URL}/products`, {
            method: 'GET',
            headers: getHeaders()
        });

        const data = await res.json();

        if (res.status === 401) {
            currentToken = '';
            localStorage.removeItem('auth_token');
            updateAppView();
            showToast('Phiên làm việc hết hạn, vui lòng đăng nhập lại', 'error');
            return;
        }

        if (data.success && Array.isArray(data.data)) {
            productList = data.data;
            renderProductTable(productList);
            updateStats(productList);
        } else {
            showToast(data.message || 'Không thể tải danh sách sản phẩm', 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối máy chủ: ' + err.message, 'error');
        productTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="py-12 text-center text-rose-500">
                    <p class="font-medium">Không thể kết nối máy chủ dữ liệu</p>
                </td>
            </tr>
        `;
    }
}

function renderProductTable(items) {
    if (items.length === 0) {
        productTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="py-12 text-center text-slate-400">
                    <i class="fa-regular fa-folder-open text-2xl mb-2"></i>
                    <p>Không có sản phẩm nào.</p>
                </td>
            </tr>
        `;
        productCountBadge.textContent = '0 sản phẩm';
        return;
    }

    productCountBadge.textContent = `${items.length} sản phẩm`;

    let html = '';
    items.forEach(sp => {
        const imgHtml = sp.image
            ? `<img src="${escapeHtml(sp.image)}" alt="${escapeHtml(sp.name)}" class="w-10 h-10 object-cover rounded-lg border border-slate-200 mx-auto" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 mx-auto\\'><i class=\\'fa-regular fa-image text-xs\\'></i></div>';">`
            : `<div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 mx-auto"><i class="fa-regular fa-image text-xs"></i></div>`;

        html += `
            <tr class="hover:bg-slate-50 transition">
                <td class="py-2.5 px-3 text-center font-mono text-slate-500">#${sp.id}</td>
                <td class="py-2.5 px-3 text-center">${imgHtml}</td>
                <td class="py-2.5 px-4 font-semibold text-slate-900">${escapeHtml(sp.name)}</td>
                <td class="py-2.5 px-4 text-slate-500 max-w-xs truncate">${escapeHtml(sp.description || '—')}</td>
                <td class="py-2.5 px-4 text-right font-semibold text-blue-700">${formatCurrency(sp.price)}</td>
                <td class="py-2.5 px-4 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sp.quantity > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">
                        ${sp.quantity}
                    </span>
                </td>
                <td class="py-2.5 px-4 text-center text-slate-400 text-[11px]">${formatDate(sp.updated_at || sp.created_at)}</td>
                <td class="py-2.5 px-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="viewProductDetail(${sp.id})" class="p-1.5 text-slate-400 hover:text-blue-600 rounded transition" title="Chi tiết">
                            <i class="fa-regular fa-eye"></i>
                        </button>
                        <button onclick="editProduct(${sp.id})" class="p-1.5 text-slate-400 hover:text-amber-600 rounded transition" title="Sửa">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button onclick="deleteProduct(${sp.id}, '${escapeHtml(sp.name)}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded transition" title="Xóa">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    productTableBody.innerHTML = html;
}

function updateStats(items) {
    statTotalItems.textContent = items.length;
    statTotalQuantity.textContent = items.reduce((sum, sp) => sum + Number(sp.quantity || 0), 0).toLocaleString('vi-VN');
    statTotalValue.textContent = formatCurrency(items.reduce((sum, sp) => sum + (Number(sp.price || 0) * Number(sp.quantity || 0)), 0));
}

window.viewProductDetail = async function(id) {
    try {
        const res = await fetch(`${PRODUCT_SERVICE_URL}/products/${id}`, {
            headers: getHeaders()
        });
        const data = await res.json();

        if (res.ok && data.success) {
            const sp = data.data;
            const imgBlock = sp.image
                ? `<div class="w-full h-44 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 mb-3"><img src="${escapeHtml(sp.image)}" class="w-full h-full object-cover"></div>`
                : '';

            detailContent.innerHTML = `
                ${imgBlock}
                <div class="bg-slate-50 p-3.5 rounded-lg space-y-2 border border-slate-200">
                    <div><span class="text-slate-400">Mã sản phẩm:</span> <span class="font-semibold text-slate-800">#${sp.id}</span></div>
                    <div><span class="text-slate-400">Tên sản phẩm:</span> <span class="font-bold text-slate-900">${escapeHtml(sp.name)}</span></div>
                    <div><span class="text-slate-400">Đơn giá:</span> <span class="font-bold text-blue-700">${formatCurrency(sp.price)}</span></div>
                    <div><span class="text-slate-400">Tồn kho:</span> <span class="font-semibold text-slate-800">${sp.quantity} chiếc</span></div>
                    <div><span class="text-slate-400">Mô tả:</span> <p class="text-slate-600 mt-0.5">${escapeHtml(sp.description || 'Chưa có mô tả')}</p></div>
                    <div class="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-400">
                        <span>Tạo lúc: ${formatDate(sp.created_at)}</span>
                        <span>Cập nhật: ${formatDate(sp.updated_at)}</span>
                    </div>
                </div>
            `;
            detailModal.classList.remove('hidden');
        } else {
            showToast(data.message || 'Không tìm thấy sản phẩm', 'error');
        }
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
    }
};

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = formProductId.value;
    const body = {
        name: formName.value.trim(),
        description: formDescription.value.trim(),
        image: formImage.value.trim(),
        price: Number(formPrice.value),
        quantity: Number(formQuantity.value)
    };

    const isEdit = Boolean(id);
    const url = isEdit ? `${PRODUCT_SERVICE_URL}/products/${id}` : `${PRODUCT_SERVICE_URL}/products`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast(isEdit ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công');
            closeModal();
            loadProducts();
        } else {
            showToast(data.message || 'Lỗi thao tác', 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối: ' + err.message, 'error');
    }
});

btnOpenCreateModal.addEventListener('click', () => {
    modalTitle.textContent = 'Thêm sản phẩm mới';
    productForm.reset();
    formProductId.value = '';
    updateFormImagePreview('');
    productModal.classList.remove('hidden');
    formName.focus();
});

window.editProduct = function(id) {
    const sp = productList.find(item => item.id === id);
    if (!sp) return;

    modalTitle.textContent = `Chỉnh sửa sản phẩm #${sp.id}`;
    formProductId.value = sp.id;
    formName.value = sp.name;
    formDescription.value = sp.description || '';
    formImage.value = sp.image || '';
    updateFormImagePreview(sp.image || '');
    formPrice.value = Number(sp.price);
    formQuantity.value = sp.quantity;

    productModal.classList.remove('hidden');
    formName.focus();
};

function closeModal() {
    productModal.classList.add('hidden');
    productForm.reset();
    updateFormImagePreview('');
}

btnCloseModal.addEventListener('click', closeModal);
btnCancelModal.addEventListener('click', closeModal);
btnCloseDetailModal.addEventListener('click', () => detailModal.classList.add('hidden'));
btnCloseDetailBtn.addEventListener('click', () => detailModal.classList.add('hidden'));

window.deleteProduct = async function(id, name) {
    const confirmDelete = confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"?`);
    if (!confirmDelete) return;

    try {
        const res = await fetch(`${PRODUCT_SERVICE_URL}/products/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('Đã xóa sản phẩm thành công');
            loadProducts();
        } else {
            showToast(data.message || 'Không thể xóa sản phẩm', 'error');
        }
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
    }
};

searchInput.addEventListener('input', (e) => {
    const kw = e.target.value.toLowerCase().trim();
    const filtered = productList.filter(sp => 
        sp.name.toLowerCase().includes(kw) || 
        (sp.description && sp.description.toLowerCase().includes(kw))
    );
    renderProductTable(filtered);
});

btnReload.addEventListener('click', () => {
    loadProducts();
    showToast('Đã làm mới dữ liệu');
});

// ================= QUẢN LÝ ĐƠN HÀNG (BÀI THỰC HÀNH 4) =================

async function loadOrders() {
    orderTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="py-12 text-center text-slate-400">
                <i class="fa-solid fa-spinner fa-spin text-xl text-blue-500 mb-2"></i>
                <p>Đang tải đơn hàng...</p>
            </td>
        </tr>
    `;

    try {
        const res = await fetch(`${ORDER_SERVICE_URL}/orders`, {
            method: 'GET',
            headers: getHeaders()
        });

        const data = await res.json();

        if (res.status === 401) {
            currentToken = '';
            localStorage.removeItem('auth_token');
            updateAppView();
            showToast('Phiên làm việc hết hạn, vui lòng đăng nhập lại', 'error');
            return;
        }

        if (data.success && Array.isArray(data.data)) {
            orderList = data.data;
            applyOrderFilter();
            updateOrderStats(orderList);
        } else {
            showToast(data.message || 'Không thể tải danh sách đơn hàng', 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối máy chủ đơn hàng: ' + err.message, 'error');
        orderTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-rose-500">
                    <p class="font-medium">Không thể kết nối dịch vụ đơn hàng (Port 3002)</p>
                </td>
            </tr>
        `;
    }
}

function updateOrderStats(items) {
    statTotalOrders.textContent = items.length;
    const pendingCount = items.filter(o => o.status === 'pending').length;
    statPendingOrders.textContent = pendingCount;

    const completedRev = items
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    statCompletedRevenue.textContent = formatCurrency(completedRev);
}

function applyOrderFilter() {
    const selected = orderStatusFilter.value;
    let filtered = orderList;
    if (selected !== 'all') {
        filtered = orderList.filter(o => o.status === selected);
    }
    renderOrderTable(filtered);
}

orderStatusFilter.addEventListener('change', applyOrderFilter);
btnReloadOrders.addEventListener('click', () => {
    loadOrders();
    showToast('Đã làm mới danh sách đơn hàng');
});

function getStatusBadge(status) {
    if (status === 'completed') {
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-check mr-1 text-[10px]"></i>Hoàn thành</span>`;
    } else if (status === 'cancelled') {
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><i class="fa-solid fa-xmark mr-1 text-[10px]"></i>Đã hủy</span>`;
    }
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><i class="fa-solid fa-clock mr-1 text-[10px]"></i>Chờ xử lý</span>`;
}

function renderOrderTable(items) {
    if (items.length === 0) {
        orderTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-slate-400">
                    <i class="fa-regular fa-folder-open text-2xl mb-2"></i>
                    <p>Không có đơn hàng nào.</p>
                </td>
            </tr>
        `;
        orderCountBadge.textContent = '0 đơn hàng';
        return;
    }

    orderCountBadge.textContent = `${items.length} đơn hàng`;

    let html = '';
    items.forEach(ord => {
        html += `
            <tr class="hover:bg-slate-50 transition">
                <td class="py-3 px-3 text-center font-mono font-medium text-slate-600">#${ord.id}</td>
                <td class="py-3 px-4 font-semibold text-slate-900">${escapeHtml(ord.customer_name)}</td>
                <td class="py-3 px-4 text-slate-500">${escapeHtml(ord.customer_email || '—')}</td>
                <td class="py-3 px-4 text-right font-bold text-indigo-700">${formatCurrency(ord.total_amount)}</td>
                <td class="py-3 px-4 text-center">${getStatusBadge(ord.status)}</td>
                <td class="py-3 px-4 text-center text-slate-400 text-[11px]">${formatDate(ord.created_at)}</td>
                <td class="py-3 px-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="viewOrderDetail(${ord.id})" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition" title="Xem chi tiết">
                            <i class="fa-regular fa-eye"></i>
                        </button>
                        <button onclick="deleteOrder(${ord.id})" class="p-1.5 text-slate-400 hover:text-rose-600 rounded transition" title="Xóa đơn">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    orderTableBody.innerHTML = html;
}

// ================= CHI TIẾT ĐƠN HÀNG =================

window.viewOrderDetail = async function(id) {
    try {
        const res = await fetch(`${ORDER_SERVICE_URL}/orders/${id}`, {
            headers: getHeaders()
        });
        const data = await res.json();

        if (res.ok && data.success) {
            const ord = data.data;
            currentViewingOrderId = ord.id;

            orderDetailSummary.innerHTML = `
                <div><span class="text-slate-400">Mã đơn:</span> <span class="font-mono font-bold text-slate-800">#${ord.id}</span></div>
                <div><span class="text-slate-400">Trạng thái:</span> ${getStatusBadge(ord.status)}</div>
                <div><span class="text-slate-400">Khách hàng:</span> <span class="font-semibold text-slate-800">${escapeHtml(ord.customer_name)}</span></div>
                <div><span class="text-slate-400">Email:</span> <span class="text-slate-700">${escapeHtml(ord.customer_email || '—')}</span></div>
                <div><span class="text-slate-400">Thời gian tạo:</span> <span class="text-slate-600">${formatDate(ord.created_at)}</span></div>
                <div><span class="text-slate-400">Tổng thanh toán:</span> <span class="font-bold text-indigo-700">${formatCurrency(ord.total_amount)}</span></div>
            `;

            let itemsHtml = '';
            if (Array.isArray(ord.items) && ord.items.length > 0) {
                ord.items.forEach(it => {
                    const subtotal = Number(it.price || 0) * Number(it.quantity || 1);
                    itemsHtml += `
                        <tr>
                            <td class="py-2.5 px-3 font-medium text-slate-800">${escapeHtml(it.product_name || `Sản phẩm #${it.product_id}`)}</td>
                            <td class="py-2.5 px-2 text-center font-semibold text-slate-700">${it.quantity}</td>
                            <td class="py-2.5 px-3 text-right text-slate-600">${formatCurrency(it.price)}</td>
                            <td class="py-2.5 px-3 text-right font-bold text-indigo-700">${formatCurrency(subtotal)}</td>
                        </tr>
                    `;
                });
            } else {
                itemsHtml = `<tr><td colspan="4" class="py-4 text-center text-slate-400">Không có dữ liệu mặt hàng</td></tr>`;
            }

            orderDetailItemsBody.innerHTML = itemsHtml;

            // Xử lý các nút thao tác trạng thái:
            // Khi đơn hàng đã thành công (completed) thì không được chọn hủy hoặc đang xử lý
            const statusActionBox = document.getElementById('orderStatusActionButtons');
            if (statusActionBox) {
                if (ord.status === 'completed') {
                    statusActionBox.innerHTML = `
                        <span class="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-flex items-center gap-1">
                            <i class="fa-solid fa-lock text-[10px]"></i> Đã hoàn tất (Khóa trạng thái)
                        </span>
                    `;
                } else if (ord.status === 'cancelled') {
                    statusActionBox.innerHTML = `
                        <span class="text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded border border-rose-200 inline-flex items-center gap-1">
                            <i class="fa-solid fa-ban text-[10px]"></i> Đơn đã bị hủy
                        </span>
                    `;
                } else {
                    statusActionBox.innerHTML = `
                        <button onclick="updateOrderStatusAction('completed')" class="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium border border-emerald-200 transition">
                            <i class="fa-solid fa-check mr-1 text-[10px]"></i>Hoàn thành
                        </button>
                        <button onclick="updateOrderStatusAction('cancelled')" class="px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium border border-rose-200 transition">
                            <i class="fa-solid fa-xmark mr-1 text-[10px]"></i>Hủy đơn
                        </button>
                    `;
                }
            }

            orderDetailModal.classList.remove('hidden');
        } else {
            showToast(data.message || 'Không thể xem chi tiết đơn hàng', 'error');
        }
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
    }
};

window.updateOrderStatusAction = async function(status) {
    if (!currentViewingOrderId) return;

    try {
        const res = await fetch(`${ORDER_SERVICE_URL}/orders/${currentViewingOrderId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            showToast(`Cập nhật trạng thái thành: ${status}`);
            loadOrders();
            viewOrderDetail(currentViewingOrderId);
        } else {
            showToast(data.message || 'Không thể cập nhật trạng thái', 'error');
        }
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
    }
};

window.deleteOrder = async function(id) {
    const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa đơn hàng #${id}?`);
    if (!confirmDelete) return;

    try {
        const res = await fetch(`${ORDER_SERVICE_URL}/orders/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        const data = await res.json();

        if (res.ok && data.success) {
            showToast('Đã xóa đơn hàng thành công');
            loadOrders();
        } else {
            showToast(data.message || 'Không thể xóa đơn hàng', 'error');
        }
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
    }
};

btnCloseOrderDetailModal.addEventListener('click', () => orderDetailModal.classList.add('hidden'));
btnCloseOrderDetailBtn.addEventListener('click', () => orderDetailModal.classList.add('hidden'));

// ================= TẠO ĐƠN HÀNG MỚI =================

function populateOrderProductSelect() {
    selectOrderProduct.innerHTML = '<option value="">-- Chọn sản phẩm --</option>';
    productList.forEach(p => {
        const disabled = p.quantity <= 0 ? 'disabled' : '';
        const stockLabel = p.quantity > 0 ? `(Tồn kho: ${p.quantity})` : '(Hết hàng)';
        selectOrderProduct.innerHTML += `
            <option value="${p.id}" ${disabled}>
                ${escapeHtml(p.name)} - ${formatCurrency(p.price)} ${stockLabel}
            </option>
        `;
    });
}

btnOpenCreateOrderModal.addEventListener('click', async () => {
    // Tải danh sách sản phẩm mới nhất để kiểm tra tồn kho
    try {
        const res = await fetch(`${PRODUCT_SERVICE_URL}/products`, { headers: getHeaders() });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
            productList = data.data;
        }
    } catch (e) {}

    populateOrderProductSelect();
    currentCart = [];
    renderCartTable();
    orderCustomerName.value = '';
    orderCustomerEmail.value = '';
    orderCreateModal.classList.remove('hidden');
    orderCustomerName.focus();
});

function closeOrderCreateModal() {
    orderCreateModal.classList.add('hidden');
    currentCart = [];
    renderCartTable();
}

btnCloseOrderCreateModal.addEventListener('click', closeOrderCreateModal);
btnCancelOrderCreate.addEventListener('click', closeOrderCreateModal);

btnAddItemToCart.addEventListener('click', () => {
    const productId = Number(selectOrderProduct.value);
    const qty = parseInt(inputOrderProductQty.value, 10);

    if (!productId) {
        showToast('Vui lòng chọn sản phẩm', 'error');
        return;
    }

    if (!qty || qty <= 0) {
        showToast('Số lượng phải lớn hơn 0', 'error');
        return;
    }

    const product = productList.find(p => p.id === productId);
    if (!product) {
        showToast('Sản phẩm không hợp lệ', 'error');
        return;
    }

    const existingItem = currentCart.find(i => i.product_id === productId);
    const existingQty = existingItem ? existingItem.quantity : 0;
    const requestedTotalQty = existingQty + qty;

    if (requestedTotalQty > product.quantity) {
        showToast(`Không đủ số lượng trong kho (Còn lại: ${product.quantity})`, 'error');
        return;
    }

    if (existingItem) {
        existingItem.quantity = requestedTotalQty;
    } else {
        currentCart.push({
            product_id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: qty
        });
    }

    renderCartTable();
    inputOrderProductQty.value = '1';
    showToast(`Đã thêm "${product.name}" vào đơn`);
});

window.removeCartItem = function(index) {
    currentCart.splice(index, 1);
    renderCartTable();
};

function renderCartTable() {
    if (currentCart.length === 0) {
        cartTableBody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-400 text-xs">Chưa có sản phẩm nào được chọn</td></tr>`;
        cartTotalAmountDisplay.textContent = '0 ₫';
        return;
    }

    let total = 0;
    let html = '';

    currentCart.forEach((item, idx) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        html += `
            <tr>
                <td class="py-2 px-3 font-medium text-slate-800">${escapeHtml(item.name)}</td>
                <td class="py-2 px-2 text-center font-semibold text-slate-700">${item.quantity}</td>
                <td class="py-2 px-3 text-right text-slate-600">${formatCurrency(item.price)}</td>
                <td class="py-2 px-3 text-right font-bold text-indigo-700">${formatCurrency(subtotal)}</td>
                <td class="py-2 px-2 text-center">
                    <button type="button" onclick="removeCartItem(${idx})" class="text-rose-500 hover:text-rose-700">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    cartTableBody.innerHTML = html;
    cartTotalAmountDisplay.textContent = formatCurrency(total);
}

orderCreateForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (currentCart.length === 0) {
        showToast('Vui lòng chọn ít nhất 1 sản phẩm vào đơn hàng', 'error');
        return;
    }

    const payload = {
        customer_name: orderCustomerName.value.trim(),
        customer_email: orderCustomerEmail.value.trim(),
        items: currentCart.map(i => ({
            product_id: i.product_id,
            quantity: i.quantity
        }))
    };

    try {
        const res = await fetch(`${ORDER_SERVICE_URL}/orders`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('Tạo đơn hàng thành công!');
            closeOrderCreateModal();
            loadOrders();
            // Cập nhật lại sản phẩm vì số lượng tồn kho đã bị trừ
            loadProducts();
        } else {
            showToast(data.message || 'Không thể tạo đơn hàng', 'error');
        }
    } catch (err) {
        showToast('Lỗi gửi yêu cầu: ' + err.message, 'error');
    }
});

// Khởi chạy khi load trang
window.addEventListener('DOMContentLoaded', () => {
    updateAppView();
});
