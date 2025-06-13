const items = [
    // Salgados
    { name: "Pastel", cashPrice: 10.00, cardPrice: 10.50, category: "salgados" },
    { name: "Cachorro Quente", cashPrice: 5.00, cardPrice: 5.25, category: "salgados" },
    { name: "Maçã do Amor", cashPrice: 6.00, cardPrice: 6.30, category: "doces" },
    { name: "Pratinho de Galinhada", cashPrice: 10.00, cardPrice: 10.50, category: "salgados" },
    { name: "Copo de Caldo de Feijão", cashPrice: 10.00, cardPrice: 10.50, category: "salgados" },
    { name: "Caldo de Frango", cashPrice: 10.00, cardPrice: 10.50, category: "salgados" },
    { name: "Copo de Canjica", cashPrice: 5.00, cardPrice: 5.25, category: "doces" },
    { name: "Mané Pelado", cashPrice: 5.00, cardPrice: 5.25, category: "doces" },
    { name: "Pipocas doces", cashPrice: 4.00, cardPrice: 4.20, category: "doces" },
    { name: "Pipocas de sal", cashPrice: 4.00, cardPrice: 4.20, category: "salgados" },
    { name: "Milho cozidos", cashPrice: 5.00, cardPrice: 5.25, category: "salgados" },
    { name: "Refrigerante", cashPrice: 6.00, cardPrice: 6.30, category: "bebidas" },
    { name: "Água e suco", cashPrice: 4.00, cardPrice: 4.20, category: "bebidas" },
    { name: "Energético", cashPrice: 8.00, cardPrice: 8.40, category: "bebidas" },
    { name: "Cartela do Bingo", cashPrice: 5.00, cardPrice: 5.25, category: "outros" }
];

let quantities = {};
items.forEach(item => {
    quantities[item.name] = 0;
});

let currentCategory = 'all';
let searchTerm = '';
let paymentMethod = 'cash';

document.addEventListener('DOMContentLoaded', () => {
    renderItems();
    setupEventListeners();
    updateOrderSummary();
});

function setupEventListeners() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderItems();
        });
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        renderItems();
    });
}

function setPaymentMethod(method) {
    paymentMethod = method;
    renderItems();
    updatePaymentMethodDisplay();
    updateOrderSummary();
}

function updatePaymentMethodDisplay() {
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.method === paymentMethod) {
            btn.classList.add('active');
        }
    });
    
    document.getElementById('payment-method-display').textContent = 
        paymentMethod === 'cash' ? '(Dinheiro/PIX)' : '(Cartão +5%)';
}

function renderItems() {
    const container = document.getElementById('items-container');
    container.innerHTML = '';
    
    let total = 0;
    let itemsCount = 0;
    
    const filteredItems = items.filter(item => {
        const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });
    
    if (filteredItems.length === 0) {
        container.innerHTML = '<div class="no-items">Nenhum item encontrado</div>';
        updateSummary(total, itemsCount);
        return;
    }
    
    filteredItems.forEach(item => {
        const price = paymentMethod === 'cash' ? item.cashPrice : item.cardPrice;
        const quantity = quantities[item.name] || 0;
        const itemTotal = quantity * price;
        total += itemTotal;
        itemsCount += quantity;
        
        const itemElement = document.createElement('div');
        itemElement.className = `item-card category-${item.category}`;
        itemElement.innerHTML = `
            <div class="item-header">
                <div class="item-name">${item.name}</div>
                <div class="item-price">R$ ${price.toFixed(2)}</div>
            </div>
            <div class="item-body">
                <div class="price-display">
                    <span class="cash-price">Dinheiro/PIX: R$ ${item.cashPrice.toFixed(2)}</span>
                    <span class="card-price">Cartão: R$ ${item.cardPrice.toFixed(2)}</span>
                </div>
                <div class="item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="changeQuantity('${item.name}', -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <div class="quantity-value">${quantity}</div>
                        <button class="quantity-btn" onclick="changeQuantity('${item.name}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="item-total">R$ ${itemTotal.toFixed(2)}</div>
                </div>
            </div>
        `;
        
        container.appendChild(itemElement);
    });
    
    updateSummary(total, itemsCount);
    updateOrderSummary();
}

function changeQuantity(itemName, change) {
    quantities[itemName] += change;
    if (quantities[itemName] < 0) quantities[itemName] = 0;
    renderItems();
}

function resetAll() {
    if (confirm('Tem certeza que deseja zerar todos os itens?')) {
        items.forEach(item => {
            quantities[item.name] = 0;
        });
        renderItems();
    }
}

function updateSummary(total, count) {
    document.getElementById('total-value').textContent = total.toFixed(2);
    document.getElementById('items-count').textContent = `${count} ${count === 1 ? 'item' : 'itens'}`;
}

function updateOrderSummary() {
    const orderItemsContainer = document.getElementById('order-items');
    orderItemsContainer.innerHTML = '';
    
    let orderTotal = 0;
    let hasItems = false;
    
    items.forEach(item => {
        const quantity = quantities[item.name] || 0;
        if (quantity > 0) {
            hasItems = true;
            const price = paymentMethod === 'cash' ? item.cashPrice : item.cardPrice;
            const itemTotal = quantity * price;
            orderTotal += itemTotal;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            itemElement.innerHTML = `
                <div>
                    <span class="order-item-name">${item.name}</span>
                    <span class="order-item-quantity">${quantity}x</span>
                </div>
                <div class="order-item-price">R$ ${itemTotal.toFixed(2)}</div>
            `;
            
            orderItemsContainer.appendChild(itemElement);
        }
    });
    
    if (!hasItems) {
        orderItemsContainer.innerHTML = '<div class="no-items">Nenhum item adicionado</div>';
    }
    
    document.getElementById('order-total-value').textContent = orderTotal.toFixed(2);
}