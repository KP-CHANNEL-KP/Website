let products = [];
let cart = [];

// Fetch products from API
async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        products = await res.json();
        displayProducts(products);
    } catch(err) {
        console.error("Failed to load products", err);
    }
}

function displayProducts(items) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';
    items.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>Price: ${p.price} Ks</p>
            <button onclick="addToCart(${p.id})">Add to Cart</button>
        `;
        grid.appendChild(card);
    });
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if(!product) return;
    cart.push(product);
    updateCart();
}

// Update Cart Display
function updateCart() {
    const cartItems = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const pointsEl = document.getElementById('points-to-earn');

    cartItems.innerHTML = '';
    let total = 0;
    cart.forEach((p, index) => {
        const li = document.createElement('li');
        li.textContent = `${p.name} - ${p.price} Ks`;
        cartItems.appendChild(li);
        total += p.price;
    });

    totalEl.textContent = total;
    pointsEl.textContent = total; // 1 Ks = 1 point
}

// Checkout modal
const modal = document.getElementById('checkout-modal');
const checkoutBtn = document.getElementById('checkout-btn');
const closeBtn = modal.querySelector('.close');

checkoutBtn.addEventListener('click', () => modal.style.display = 'block');
closeBtn.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', e => {
    if(e.target == modal) modal.style.display = 'none';
});

// Checkout Form Submit
document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('screenshot');
    if(fileInput.files.length === 0) return alert("Upload screenshot first");

    const formData = new FormData();
    formData.append('screenshot', fileInput.files[0]);
    formData.append('cart', JSON.stringify(cart));
    formData.append('total', cart.reduce((sum, p) => sum + p.price, 0));

    try {
        const res = await fetch('/api/order/create', { method: 'POST', body: formData });
        const data = await res.json();
        if(data.success){
            alert("Order submitted successfully!");
            cart = [];
            updateCart();
            modal.style.display = 'none';
        } else {
            alert("Order failed. Try again.");
        }
    } catch(err) {
        console.error(err);
        alert("Error submitting order");
    }
});

// Initial load
loadProducts();
