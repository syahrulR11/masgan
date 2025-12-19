// Shopping Cart Data
let cart = [];

// Captcha Data
let currentCaptcha = {
    question: '',
    answer: 0
};

const CUSTOMER_PROFILE_KEY = 'masganCustomerProfile';
const PAYMENT_METHODS = {
    cod: {
        value: 'cod',
        label: 'COD / Bayar di Tempat'
    },
    transfer: {
        value: 'transfer',
        label: 'Transfer Bank',
        account: '7087361688 (Bank Syariah Indonesia) - Risky Dwi Amalia'
    }
};

// Branch and delivery configuration
const masganConfig = {
    currency: 'Rp',
    defaultWhatsapp: '6285273598919',
    toleranceDistance: 1.5,
    branches: [
        {
            id: 'kalangnyar',
            name: 'MasGan Kalangnyar',
            shortName: 'MasGan Kalangnyar',
            address: 'Jln. Maulana Yusuf, Kp. Jembatan Keong\nRT 02, RW 02, Desa Aweh\nKec. Kalanganyar, Lebak, Banten\n42312',
            whatsapp: '6285273598919',
            location: { lat: -6.360131113971075, lng: 106.24152830386858 },
            deliveryRatePerKm: 2000,
            minDeliveryFee: 8000
        },
        {
            id: 'multatuli',
            name: 'MasGan Multatuli',
            shortName: 'MasGan Multatuli',
            address: 'Jl. Multatuli No. 35, Muara Ciujung Barat\nRT 02, RW 02\nKec. Rangkasbitung, Lebak, Banten\n42312',
            whatsapp: '6285273598919',
            location: { lat: -6.355380327992399, lng: 106.24700825386431 },
            deliveryRatePerKm: 2000,
            minDeliveryFee: 8000
        }
    ]
};

let customerLocation = null;
let currentShipping = {
    branch: null,
    distanceKm: 0,
    cost: 0
};

function formatCurrency(value) {
    return `Rp ${value.toLocaleString('id-ID')}`;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = deg => deg * (Math.PI / 180);
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c) * masganConfig.toleranceDistance;
}

function getNearestBranch(location) {
    if (!location) return null;
    return masganConfig.branches.reduce((nearest, branch) => {
        if (!branch.location) return nearest;
        const distanceKm = calculateDistance(
            location.lat,
            location.lng,
            branch.location.lat,
            branch.location.lng
        );
        if (!nearest || distanceKm < nearest.distanceKm) {
            return { branch, distanceKm };
        }
        return nearest;
    }, null);
}

function updateLocationStatus(text, isError = false) {
    const statusEl = document.getElementById('location-status');
    if (statusEl) {
        statusEl.textContent = text;
        statusEl.classList.toggle('text-red-600', isError);
        if (isError) {
            statusEl.classList.remove('text-gray-500');
        } else {
            statusEl.classList.add('text-gray-600');
        }
    }
}

function recalculateShipping() {
    if (!customerLocation) {
        currentShipping = { branch: null, distanceKm: 0, cost: 0 };
        updateCartDisplay();
        return;
    }

    const nearest = getNearestBranch(customerLocation);
    if (!nearest) {
        currentShipping = { branch: null, distanceKm: 0, cost: 0 };
        updateCartDisplay();
        return;
    }

    const rate = nearest.branch.deliveryRatePerKm || 0;
    const minFee = nearest.branch.minDeliveryFee || 0;
    const calculated = Math.max(nearest.distanceKm * rate, minFee);

    currentShipping = {
        branch: nearest.branch,
        distanceKm: nearest.distanceKm,
        cost: Math.ceil(calculated / 500) * 500
    };

    updateCartDisplay();
}

function detectLocation() {
    if (!navigator.geolocation) {
        updateLocationStatus('Perangkat tidak mendukung pelacakan lokasi.', true);
        return;
    }

    updateLocationStatus('Mengambil lokasi... Mohon izinkan browser.');
    navigator.geolocation.getCurrentPosition(
        position => {
            customerLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            updateLocationStatus(`Lokasi tersimpan (${customerLocation.lat.toFixed(4)}, ${customerLocation.lng.toFixed(4)})`);
            recalculateShipping();
        },
        error => {
            const messages = {
                1: 'Izin lokasi ditolak. Mohon izinkan untuk menghitung ongkir.',
                2: 'Lokasi tidak tersedia. Coba lagi.',
                3: 'Permintaan lokasi kedaluwarsa. Coba lagi.'
            };
            updateLocationStatus(messages[error.code] || 'Gagal mengambil lokasi. Coba lagi.', true);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function getCustomerProfileInputs() {
    return {
        nameInput: document.getElementById('customer-name'),
        phoneInput: document.getElementById('customer-phone'),
        addressInput: document.getElementById('customer-address')
    };
}

function loadCustomerProfile() {
    try {
        const savedProfile = localStorage.getItem(CUSTOMER_PROFILE_KEY);
        if (!savedProfile) return;
        const profile = JSON.parse(savedProfile);
        const { nameInput, phoneInput, addressInput } = getCustomerProfileInputs();
        if (profile.name && nameInput) nameInput.value = profile.name;
        if (profile.phone && phoneInput) phoneInput.value = profile.phone;
        if (profile.address && addressInput) addressInput.value = profile.address;
    } catch (error) {
        console.warn('Gagal memuat profil pelanggan', error);
    }
}

function saveCustomerProfile() {
    const { nameInput, phoneInput, addressInput } = getCustomerProfileInputs();
    if (!nameInput || !phoneInput || !addressInput) return;

    const profile = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        address: addressInput.value.trim()
    };

    if (!profile.name && !profile.phone && !profile.address) {
        localStorage.removeItem(CUSTOMER_PROFILE_KEY);
        return;
    }

    try {
        localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
        console.warn('Gagal menyimpan profil pelanggan', error);
    }
}

function initCustomerProfilePersistence() {
    loadCustomerProfile();
    const { nameInput, phoneInput, addressInput } = getCustomerProfileInputs();
    [nameInput, phoneInput, addressInput].forEach(input => {
        if (input) {
            input.addEventListener('input', saveCustomerProfile);
            input.addEventListener('blur', saveCustomerProfile);
        }
    });
}

function initPaymentMethodSelection() {
    const radios = document.querySelectorAll('input[name="payment-method"]');
    const transferInfo = document.getElementById('transfer-info');
    if (!radios.length) return;

    const updateTransferVisibility = () => {
        const selected = document.querySelector('input[name="payment-method"]:checked');
        if (!transferInfo) return;
        if (selected && selected.value === PAYMENT_METHODS.transfer.value) {
            transferInfo.classList.remove('hidden');
        } else {
            transferInfo.classList.add('hidden');
        }
    };

    radios.forEach(radio => radio.addEventListener('change', updateTransferVisibility));
    updateTransferVisibility();
}

function getLocalDateInputValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getLocalTimeInputValue(date = new Date()) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function enforceScheduledTimeMinimum(dateInput, timeInput) {
    if (!dateInput || !timeInput) return;
    const todayValue = getLocalDateInputValue();
    if (dateInput.value === todayValue) {
        const minTime = getLocalTimeInputValue();
        timeInput.min = minTime;
        if (timeInput.value && timeInput.value < minTime) {
            timeInput.value = minTime;
        }
    } else {
        timeInput.min = '';
    }
}

function initDeliveryTimingControls() {
    const radios = document.querySelectorAll('input[name="delivery-time-option"]');
    const scheduleInputs = document.getElementById('scheduled-delivery-inputs');
    const dateInput = document.getElementById('delivery-date');
    const timeInput = document.getElementById('delivery-time');
    if (!radios.length || !scheduleInputs || !dateInput || !timeInput) return;

    dateInput.min = getLocalDateInputValue();

    const updateVisibility = () => {
        const selected = document.querySelector('input[name="delivery-time-option"]:checked');
        const showSchedule = selected && selected.value === 'later';
        scheduleInputs.classList.toggle('hidden', !showSchedule);
        if (!showSchedule) {
            dateInput.value = '';
            timeInput.value = '';
            timeInput.min = '';
        } else {
            enforceScheduledTimeMinimum(dateInput, timeInput);
        }
    };

    radios.forEach(radio => radio.addEventListener('change', updateVisibility));

    dateInput.addEventListener('change', () => enforceScheduledTimeMinimum(dateInput, timeInput));

    updateVisibility();
}

// Menu configuration
const menuItems = [
    { name: 'Coconut Original Big', price: 10000, image: 'images/menu/Coconut Original.webp' },
    { name: 'Coconut Original Small', price: 5000, image: 'images/menu/Coconut Original A Half.webp' },
    { name: 'Coconut Mix Fruit', price: 18000, image: 'images/menu/Coconut Mix.webp' },
    { name: 'Coconut Mix Durian', price: 18000, image: 'images/menu/Coconut Mix.webp' },
    { name: 'Coconut Jelly', price: 15000, image: 'images/menu/Coconut Jelly.webp' },
    { name: 'Coconut Jelly Mix Fruit', price: 23000, image: 'images/menu/Coconut Jelly Mix.webp' },
    { name: 'Coconut Copyor', price: 23000, image: 'images/menu/Coconut Kopyor.webp' },
    { name: 'Coconut Ice Cream Cone', price: 5000, image: 'images/menu/Coconut Ice Cream.webp' },
    { name: 'Coconut White Milk', price: 5000, image: 'images/menu/Coconut White Milk.webp' },
    { name: 'Coconut Chocolate Milk', price: 5000, image: 'images/menu/Coconut Chocolate Milk.webp' },
    { name: 'Coconut Guava', price: 5000, image: 'images/menu/Coconut Guava.webp' },
    { name: 'Coconut Soursop', price: 5000, image: 'images/menu/Coconut Soursop.webp' },
    { name: 'Coconut Mango', price: 5000, image: 'images/menu/Coconut Mango.webp' },
    { name: 'Coconut Vanilla', price: 5000, image: 'images/menu/Coconut Vanilla.webp' },
    { name: 'Coconut Melon', price: 5000, image: 'images/menu/Coconut Melon.webp' },
    { name: 'Coconut Mix Flavors', price: 5000, image: 'images/menu/Coconut Mix Flavors.webp' },
    { name: 'Coconut Lemon', price: 5000, image: 'images/menu/Coconut Lemon.webp' },
    { name: 'Coconut Pineapple', price: 5000, image: 'images/menu/Coconut Pineapple.webp' },
    { name: 'Coconut Coco Pandan', price: 5000, image: 'images/menu/Coco Pandan.webp' },
    { name: 'Coconut Strawberry', price: 5000, image: 'images/menu/Coconut Strawberry.webp' },
    { name: 'Coconut Lychee', price: 5000, image: 'images/menu/Coconut Lychee.webp' },
    { name: 'Coconut Roselle', price: 5000, image: 'images/menu/Coconut Rose.webp' },
    { name: 'Coconut Mocha', price: 5000, image: 'images/menu/Coconut Mocha.webp' },
    { name: 'Coconut Pomegranate', price: 5000, image: 'images/menu/Coconut Pomegranate.webp' },
    { name: 'Coconut Passion Fruit', price: 5000, image: 'images/menu/Coconut Passion Fruit.webp' },
    { name: 'Coconut Milk Banana', price: 5000, image: 'images/menu/Coconut Milk Banana.webp' }
];

// Render menu cards dynamically to keep ordering and pricing consistent
function renderMenu() {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;

    const cards = menuItems.map((item, index) => {
        const priceLabel = `Rp ${item.price.toLocaleString('id-ID')}`;
        const escapedName = item.name.replace(/'/g, "\\'");
        return `
            <div class="menu-card bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div class="relative overflow-hidden bg-masgan-dark-blue">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-48 object-contain relative z-10">
                    <div class="absolute top-0 right-0 bg-masgan-green text-white px-3 py-1 rounded-bl-lg font-bold z-20">
                        ${priceLabel}
                    </div>
                </div>
                <div class="p-4">
                    <h3 class="text-lg font-bold text-masgan-green mb-3">${item.name}</h3>
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-2">
                            <button onclick="decreaseQty(this)" class="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full font-bold">-</button>
                            <input type="number" value="1" min="1" class="w-16 text-center border-2 border-masgan-green rounded-lg qty-input" readonly>
                            <button onclick="increaseQty(this)" class="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full font-bold">+</button>
                        </div>
                    </div>
                    <button onclick="addToCart('${escapedName}', ${item.price}, this)" class="w-full bg-masgan-green hover:bg-green-600 text-white py-2 rounded-lg font-bold transition-all duration-300 shadow-md hover:shadow-lg">
                        Tambah ke Keranjang
                    </button>
                </div>
            </div>
        `;
    }).join('');

    menuGrid.innerHTML = cards;
}

function renderBranchList(elementId, options = {}) {
    const listElement = document.getElementById(elementId);
    if (!listElement) return;

    const branches = Array.isArray(masganConfig.branches) ? masganConfig.branches : [];
    const {
        itemClasses = '',
        nameClasses = '',
        addressClasses = '',
        linkClasses = '',
        emptyClasses = 'text-sm text-gray-600 italic col-span-full text-center',
        emptyText = 'Cabang baru akan segera hadir.'
    } = options;

    if (!branches.length) {
        listElement.innerHTML = `<li class="${emptyClasses}">${emptyText}</li>`;
        return;
    }

    listElement.innerHTML = branches.map(branch => {
        const shortName = branch.shortName || branch.name || 'Cabang MasGan';
        const formattedAddress = formatMultilineText(branch.address);
        const addressMarkup = formattedAddress
            ? `<p class="${addressClasses}">${formattedAddress}</p>`
            : '';
        const whatsappNumber = branch.whatsapp || masganConfig.defaultWhatsapp;
        const contactMarkup = whatsappNumber
            ? `<p class="mt-3"><a href="tel:${whatsappNumber}" target="_blank" rel="noopener" class="${linkClasses}">Hubungi Cabang</a></p>`
            : '';

        return `
            <li class="${itemClasses}">
                <p class="${nameClasses}">${shortName}</p>
                ${addressMarkup}
                ${contactMarkup}
            </li>
        `;
    }).join('');
}

function renderBranchCards() {
    const cardsContainer = document.getElementById('branch-card-list');
    if (!cardsContainer) return;

    const branches = Array.isArray(masganConfig.branches) ? masganConfig.branches : [];
    if (!branches.length) {
        cardsContainer.innerHTML = `
            <div class="w-full bg-white text-masgan-green rounded-2xl shadow-xl p-8 text-center text-masgan-dark-blue/70">
                Cabang baru akan segera hadir.
            </div>
        `;
        return;
    }

    cardsContainer.innerHTML = branches.map(branch => {
        const shortName = branch.shortName || branch.name || 'Cabang MasGan';
        const formattedAddress = formatMultilineText(branch.address);
        const addressMarkup = formattedAddress
            ? `<p class="text-gray-700 leading-relaxed">${formattedAddress}</p>`
            : '';
        const whatsappNumber = branch.whatsapp || masganConfig.defaultWhatsapp;
        const phoneMarkup = whatsappNumber
            ? `
                <div class="flex items-center mt-4">
                    <svg class="w-6 h-6 text-masgan-green mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                    </svg>
                    <a href="https://wa.me/${whatsappNumber}" target="_blank" rel="noopener" class="text-masgan-green font-bold hover:underline">
                        ${formatPhoneDisplay(whatsappNumber)}
                    </a>
                </div>
            `
            : '';

        return `
            <div class="w-full bg-white text-masgan-green rounded-2xl shadow-xl p-8">
                <div class="flex items-start space-x-4">
                    <svg class="w-8 h-8 text-masgan-green flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                    </svg>
                    <div>
                        <h3 class="font-bold text-xl mb-2 text-masgan-dark-blue">${shortName}</h3>
                        ${addressMarkup}
                        ${phoneMarkup}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatPhoneDisplay(phone) {
    if (!phone) return '';
    if (phone.startsWith('62')) {
        return `0${phone.slice(2)}`;
    }
    return phone;
}

function formatMultilineText(text = '') {
    if (typeof text !== 'string' || !text.trim()) return '';
    return text.replace(/\n/g, '<br>');
}

function renderAllBranchLists() {
    renderBranchCards();

    renderBranchList('footer-branch-list', {
        itemClasses: 'bg-white/5 border border-white/10 rounded-xl p-4',
        nameClasses: 'font-semibold text-white',
        addressClasses: 'text-sm text-white/80 leading-relaxed mt-1',
        linkClasses: 'inline-flex items-center text-sm font-semibold text-masgan-green hover:text-white transition-colors',
        emptyClasses: 'text-sm text-white/70 italic col-span-full text-center',
        emptyText: 'Cabang baru akan segera hadir.'
    });
}

// Load cart from localStorage on page load
window.addEventListener('DOMContentLoaded', function() {
    renderMenu();
    renderAllBranchLists();
    const savedCart = localStorage.getItem('masganCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
    initCustomerProfilePersistence();
    initPaymentMethodSelection();
    initDeliveryTimingControls();
    // Initialize captcha
    generateCaptcha();
});

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('masganCart', JSON.stringify(cart));
}

// Generate Captcha
function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    currentCaptcha.question = `${num1} + ${num2} = ?`;
    currentCaptcha.answer = num1 + num2;

    const captchaElement = document.getElementById('captcha-question');
    if (captchaElement) {
        captchaElement.textContent = currentCaptcha.question;
    }

    const captchaInput = document.getElementById('captcha-answer');
    if (captchaInput) {
        captchaInput.value = '';
    }
}

// Increase quantity
function increaseQty(button) {
    const input = button.parentElement.querySelector('.qty-input');
    input.value = parseInt(input.value) + 1;
}

// Decrease quantity
function decreaseQty(button) {
    const input = button.parentElement.querySelector('.qty-input');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

// Add to cart
function addToCart(name, price, button) {
    const qtyInput = button.parentElement.querySelector('.qty-input');
    const quantity = parseInt(qtyInput.value);

    // Check if item already exists in cart
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            name: name,
            price: price,
            quantity: quantity
        });
    }

    // Reset quantity to 1
    qtyInput.value = 1;

    // Save cart and update display
    saveCart();
    updateCartDisplay();

    // Show feedback animation
    const originalText = button.textContent;
    button.textContent = 'Ditambahkan!';
    const feedbackClass = 'bg-green-700';
    button.classList.add(feedbackClass);
    setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove(feedbackClass);
    }, 1000);
}

// Toggle cart modal
function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        updateCartDisplay();
    }
}

// Update cart display
function updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartShipping = document.getElementById('cart-shipping');
    const cartGrandTotal = document.getElementById('cart-grand-total');
    const branchInfo = document.getElementById('branch-info');
    const branchDistance = document.getElementById('branch-distance');

    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    let subtotal = 0;

    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-gray-500 text-center py-8">Keranjang masih kosong</p>';
    } else {
        let itemsHTML = '';
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            itemsHTML += `
                <div class="flex items-center justify-between py-4 border-b border-gray-200">
                    <div class="flex-1">
                        <h4 class="font-bold text-masgan-dark-blue">${item.name}</h4>
                        <p class="text-sm text-gray-600">Rp ${item.price.toLocaleString('id-ID')} x ${item.quantity}</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="font-bold text-masgan-green">Rp ${itemTotal.toLocaleString('id-ID')}</span>
                        <div class="flex items-center space-x-2">
                            <button onclick="updateCartQty(${index}, -1)" class="bg-gray-200 hover:bg-gray-300 text-gray-700 w-7 h-7 rounded-full text-sm font-bold">-</button>
                            <span class="w-8 text-center font-bold">${item.quantity}</span>
                            <button onclick="updateCartQty(${index}, 1)" class="bg-gray-200 hover:bg-gray-300 text-gray-700 w-7 h-7 rounded-full text-sm font-bold">+</button>
                        </div>
                        <button onclick="removeFromCart(${index})" class="text-red-500 hover:text-red-700 ml-2">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        });

        cartItems.innerHTML = itemsHTML;
    }

    const shippingCost = currentShipping.branch ? currentShipping.cost : 0;
    const shouldApplyShipping = cart.length > 0;
    const grandTotal = shouldApplyShipping ? subtotal + shippingCost : 0;

    if (cartSubtotal) cartSubtotal.textContent = formatCurrency(subtotal);
    if (cartShipping) {
        cartShipping.textContent = currentShipping.branch
            ? `${formatCurrency(shouldApplyShipping ? shippingCost : 0)} (${currentShipping.branch.shortName || currentShipping.branch.name})`
            : 'Bagikan lokasi untuk menghitung';
    }
    if (cartGrandTotal) cartGrandTotal.textContent = formatCurrency(grandTotal);

    if (branchInfo) {
        branchInfo.textContent = currentShipping.branch
            ? currentShipping.branch.shortName || currentShipping.branch.name
            : 'Menunggu lokasi';
    }
    if (branchDistance) {
        branchDistance.textContent = currentShipping.branch
            ? `${currentShipping.distanceKm.toFixed(1)} km`
            : '-';
    }
}

// Update cart quantity
function updateCartQty(index, change) {
    cart[index].quantity += change;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart();
    updateCartDisplay();
}

// Remove from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
}

// Checkout via WhatsApp
function checkout() {
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    const noteField = document.getElementById('customer-note');
    const customerNote = noteField ? noteField.value.trim() : '';
    const paymentMethodInput = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = paymentMethodInput ? paymentMethodInput.value : PAYMENT_METHODS.cod.value;
    const paymentConfig = PAYMENT_METHODS[paymentMethod] || PAYMENT_METHODS.cod;
    const deliveryOptionInput = document.querySelector('input[name="delivery-time-option"]:checked');
    const deliveryOption = deliveryOptionInput ? deliveryOptionInput.value : 'now';
    const deliveryDateInput = document.getElementById('delivery-date');
    const deliveryTimeInput = document.getElementById('delivery-time');
    let scheduledDeliveryDate = null;

    if (!name) {
        alert('Mohon isi nama Anda');
        document.getElementById('customer-name').focus();
        return;
    }

    if (!phone) {
        alert('Mohon isi nomor WhatsApp Anda');
        document.getElementById('customer-phone').focus();
        return;
    }

    if (!address) {
        alert('Mohon isi alamat pengiriman');
        document.getElementById('customer-address').focus();
        return;
    }

    if (cart.length === 0) {
        alert('Keranjang masih kosong');
        return;
    }

    if (!currentShipping.branch) {
        alert('Mohon bagikan lokasi untuk menentukan cabang terdekat dan ongkir.');
        return;
    }

    if (deliveryOption === 'later') {
        if (!deliveryDateInput || !deliveryTimeInput) {
            alert('Form jadwal pengiriman tidak tersedia. Segarkan halaman dan coba lagi.');
            return;
        }
        if (!deliveryDateInput.value) {
            alert('Mohon pilih tanggal pengiriman yang diinginkan.');
            deliveryDateInput.focus();
            return;
        }
        if (!deliveryTimeInput.value) {
            alert('Mohon pilih waktu pengiriman yang diinginkan.');
            deliveryTimeInput.focus();
            return;
        }
        scheduledDeliveryDate = new Date(`${deliveryDateInput.value}T${deliveryTimeInput.value}`);
        if (isNaN(scheduledDeliveryDate.getTime())) {
            alert('Tanggal atau waktu pengiriman tidak valid.');
            deliveryDateInput.focus();
            return;
        }
        if (scheduledDeliveryDate.getTime() < Date.now()) {
            alert('Jadwal pengiriman tidak boleh di waktu yang sudah lewat.');
            deliveryTimeInput.focus();
            return;
        }
    }

    // Validate captcha
    const captchaAnswer = parseInt(document.getElementById('captcha-answer').value);
    if (isNaN(captchaAnswer) || captchaAnswer !== currentCaptcha.answer) {
        alert('Captcha salah! Silakan coba lagi.');
        generateCaptcha(); // Regenerate new captcha
        document.getElementById('captcha-answer').focus();
        return;
    }

    // Build WhatsApp message
    let message = `Pesanan Baru *MasGan ${currentShipping.branch.shortName || currentShipping.branch.name}*:\n\n`;

    const orderDate = new Date();
    const dateFormatter = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const timeFormatter = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    const formattedTime = timeFormatter.format(orderDate).replace(':', '.');
    const deliveryScheduleText = scheduledDeliveryDate
        ? `${dateFormatter.format(scheduledDeliveryDate)}, ${timeFormatter.format(scheduledDeliveryDate).replace(':', '.')} WIB`
        : 'Secepatnya (kirim sekarang)';

    message += `Hari Tanggal/Jam: ${dateFormatter.format(orderDate)}, ${formattedTime} WIB\n`;
    message += `Jadwal Pengiriman: ${deliveryScheduleText}\n`;
    message += `Nama: *${name}*\n`;
    message += `Metode Pembayaran: *${paymentConfig.label}*\n`;
    if (paymentMethod === PAYMENT_METHODS.transfer.value) {
        message += `Rekening Transfer: ${PAYMENT_METHODS.transfer.account}\n`;
    }
    message += `HP: *${phone}*\n`;
    message += `Alamat: ${address}\n`;
    if (customerNote) {
        message += `Catatan: ${customerNote}\n`;
    }
    if (customerLocation) {
        message += `Pin Lokasi: https://www.google.com/maps?q=${customerLocation.lat},${customerLocation.lng}\n`;
    }
    message += `Jarak: *${currentShipping.distanceKm.toFixed(1)} km*\n\n`;

    message += `Detail Pesanan:\n`;

    let subtotal = 0;
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        message += `${index + 1}. ${item.name}\n`;
        message += `   Qty: ${item.quantity} x Rp ${item.price.toLocaleString('id-ID')} = Rp ${itemTotal.toLocaleString('id-ID')}\n`;
    });

    message += `\nSub Total: ${formatCurrency(subtotal)}\n`;
    message += `Ongkos Kirim: ${formatCurrency(currentShipping.cost)}\n`;
    message += `Total: ${formatCurrency(subtotal + currentShipping.cost)}\n\n`;
    message += `Terima kasih!\nSalam *Master Degan Indonesia*`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // WhatsApp number (without + or -)
    const whatsappNumber = currentShipping.branch.whatsapp || masganConfig.defaultWhatsapp;

    // Open WhatsApp
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');

    // Clear cart after successful order
    setTimeout(() => {
        cart = [];
        saveCart();
        updateCartDisplay();
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('customer-address').value = '';
        if (noteField) {
            noteField.value = '';
        }
        document.getElementById('captcha-answer').value = '';
        const deliveryNowRadio = document.querySelector('input[name="delivery-time-option"][value="now"]');
        if (deliveryNowRadio) {
            deliveryNowRadio.checked = true;
            deliveryNowRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }
        generateCaptcha();
        toggleCart();
    }, 1000);
}

// Smooth scroll for menu link
const menuLink = document.querySelector('a[href="#menu"]');
if (menuLink) {
    menuLink.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('menu').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
}

// Close cart modal when clicking outside
document.getElementById('cart-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        toggleCart();
    }
});
