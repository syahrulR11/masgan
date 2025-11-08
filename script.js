// Shopping Cart Data
let cart = [];

// Captcha Data
let currentCaptcha = {
    question: '',
    answer: 0
};

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

    const cards = menuItems.map(item => {
        const priceLabel = `Rp ${item.price.toLocaleString('id-ID')}`;
        const escapedName = item.name.replace(/'/g, "\\'");
        return `
            <div class="menu-card bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div class="relative overflow-hidden bg-gray-100">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-48 object-contain">
                    <div class="absolute top-0 right-0 bg-masgan-green text-white px-3 py-1 rounded-bl-lg font-bold">
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

// Load cart from localStorage on page load
window.addEventListener('DOMContentLoaded', function() {
    renderMenu();
    const savedCart = localStorage.getItem('masganCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
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
    const cartTotal = document.getElementById('cart-total');

    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-gray-500 text-center py-8">Keranjang masih kosong</p>';
        cartTotal.textContent = 'Rp 0';
    } else {
        let itemsHTML = '';
        let total = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

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
        cartTotal.textContent = `Rp ${total.toLocaleString('id-ID')}`;
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
    const address = document.getElementById('customer-address').value.trim();

    if (!name) {
        alert('Mohon isi nama Anda');
        document.getElementById('customer-name').focus();
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

    // Validate captcha
    const captchaAnswer = parseInt(document.getElementById('captcha-answer').value);
    if (isNaN(captchaAnswer) || captchaAnswer !== currentCaptcha.answer) {
        alert('Captcha salah! Silakan coba lagi.');
        generateCaptcha(); // Regenerate new captcha
        document.getElementById('captcha-answer').focus();
        return;
    }

    // Build WhatsApp message
    let message = `*Pesanan Baru dari ${name}*\n\n`;
    message += `*Alamat Pengiriman:*\n${address}\n\n`;
    message += `*Detail Pesanan:*\n`;

    let total = 0;
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        message += `${index + 1}. ${item.name}\n`;
        message += `   Qty: ${item.quantity} x Rp ${item.price.toLocaleString('id-ID')} = Rp ${itemTotal.toLocaleString('id-ID')}\n\n`;
    });

    message += `*Total: Rp ${total.toLocaleString('id-ID')}*\n\n`;
    message += `Terima kasih!`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // WhatsApp number (without + or -)
    const whatsappNumber = '6285273598919';

    // Open WhatsApp
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');

    // Clear cart after successful order
    setTimeout(() => {
        cart = [];
        saveCart();
        updateCartDisplay();
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-address').value = '';
        document.getElementById('captcha-answer').value = '';
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
