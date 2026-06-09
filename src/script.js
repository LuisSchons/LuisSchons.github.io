const items = [
    // Salgados
    { name: "Pastel", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "pastel.png" },
    { name: "Caldo (Frango/Feijão)", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "caldo-frango.png" },
    { name: "Cachorro Quente Tradicional", cashPrice: 8.00, cardPrice: 8.40, category: "salgados", image: "cachorro-quente-tradicional.png" },
    { name: "Cachorro Quente Completo", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "cachorro-quente-completo.png" },
    { name: "Milho", cashPrice: 8.00, cardPrice: 8.40, category: "salgados", image: "milho.png" },
    { name: "Pipoca Salgada", cashPrice: 6.00, cardPrice: 6.30, category: "salgados", image: "pipoca-sal.png" },

    // Doces
    { name: "Pipoca Doce", cashPrice: 6.00, cardPrice: 6.30, category: "doces", image: "pipoca-doce.png" },
    { name: "Pipoca de Leite Ninho", cashPrice: 8.00, cardPrice: 8.40, category: "doces", image: "pipoca-leite-ninho.png" },
    { name: "Arroz Doce", cashPrice: 8.00, cardPrice: 8.40, category: "doces", image: "arroz-doce.png" },
    { name: "Maçã do Amor", cashPrice: 6.00, cardPrice: 6.30, category: "doces", image: "maca-amor.png" },
    { name: "Canjica", cashPrice: 5.00, cardPrice: 5.25, category: "doces", image: "canjica.png" },

    // Bebidas
    { name: "Água Mineral", cashPrice: 2.00, cardPrice: 2.10, category: "bebidas", image: "agua-sem-gas.png" },
    { name: "Água com Gás", cashPrice: 4.00, cardPrice: 4.20, category: "bebidas", image: "agua-gas.png" },
    { name: "Refrigerante", cashPrice: 6.00, cardPrice: 6.30, category: "bebidas", image: "refrigerante.png" },
    { name: "Suco de Caixinha", cashPrice: 3.00, cardPrice: 3.15, category: "bebidas", image: "suco-caixinha.png" }
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
    
    let generalTotal = 0;
    let itemsCount = 0;
    
    // Calcula o total geral independente dos filtros
    items.forEach(item => {
        const price = paymentMethod === 'cash' ? item.cashPrice : item.cardPrice;
        const quantity = quantities[item.name] || 0;
        generalTotal += quantity * price;
        itemsCount += quantity;
    });
    
    const filteredItems = items.filter(item => {
        const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });
    
    if (filteredItems.length === 0) {
        container.innerHTML = '<div class="no-items">Nenhum item encontrado</div>';
        updateSummary(generalTotal, itemsCount);
        return;
    }
    
    filteredItems.forEach(item => {
        const price = paymentMethod === 'cash' ? item.cashPrice : item.cardPrice;
        const quantity = quantities[item.name] || 0;
        const itemTotal = quantity * price;
        
        const itemElement = document.createElement('div');
        itemElement.className = `item-card category-${item.category}`;
        
        const imagePath = item.image ? `../images/${item.image}` : '../images/default.png';
        
        itemElement.innerHTML = `
            <div class="item-header">
                <div class="item-name-container">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">R$ ${price.toFixed(2)}</div>
                </div>
                <img src="${imagePath}" alt="${item.name}" class="item-image" onerror="this.src='../images/default.png'">
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
    
    updateSummary(generalTotal, itemsCount);
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
    
    document.getElementById('order-total-value').textContent = orderTotal.toFixed(2);
    
    if (!hasItems) {
        orderItemsContainer.innerHTML = '<div class="no-items">Nenhum item adicionado</div>';
    }
}