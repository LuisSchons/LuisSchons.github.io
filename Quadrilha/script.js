const items = [
    // Salgados
    { name: "Pastel", price: 10.00, category: "salgados" },
    { name: "Cachorro Quente", price: 5.00, category: "salgados" },
    { name: "Pratinho de Galinhada", price: 10.00, category: "salgados" },
    { name: "Copo de Caldo de Feijão", price: 10.00, category: "salgados" },
    { name: "Caldo de Frango", price: 10.00, category: "salgados" },
    { name: "Pipocas de sal", price: 4.00, category: "salgados" },
    { name: "Milho cozidos", price: 5.00, category: "salgados" },
    
    // Doces
    { name: "Maçã do Amor", price: 6.00, category: "doces" },
    { name: "Copo de Canjica", price: 5.00, category: "doces" },
    { name: "Mané Pelado", price: 5.00, category: "doces" },
    { name: "Pipocas doces", price: 4.00, category: "doces" },
    
    // Bebidas
    { name: "Refrigerante", price: 6.00, category: "bebidas" },
    { name: "Água e suco", price: 4.00, category: "bebidas" },
    { name: "Energético", price: 8.00, category: "bebidas" },
    
    // Outros
    { name: "Cartela do Bingo", price: 5.00, category: "outros" }
];

let quantities = {};
items.forEach(item => {
    quantities[item.name] = 0;
});

let currentCategory = 'all';
let searchTerm = '';

document.addEventListener('DOMContentLoaded', () => {
    renderItems();
    setupEventListeners();
});

function setupEventListeners() {
    // Filtros por categoria
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderItems();
        });
    });

    // Barra de pesquisa
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        renderItems();
    });
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
        const quantity = quantities[item.name] || 0;
        const itemTotal = quantity * item.price;
        total += itemTotal;
        itemsCount += quantity;
        
        const itemElement = document.createElement('div');
        itemElement.className = `item-card category-${item.category}`;
        itemElement.innerHTML = `
            <div class="item-header">
                <div class="item-name">${item.name}</div>
                <div class="item-price">R$ ${item.price.toFixed(2)}</div>
            </div>
            <div class="item-body">
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