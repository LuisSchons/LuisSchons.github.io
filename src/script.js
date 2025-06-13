const items = [
  { name: 'Pastel', category: 'comida', cashPrice: 6.00, cardPrice: 7.00 },
  { name: 'Refrigerante', category: 'bebida', cashPrice: 4.00, cardPrice: 4.50 },
  { name: 'Água', category: 'bebida', cashPrice: 2.00, cardPrice: 2.50 },
  { name: 'Energético', category: 'bebida', cashPrice: 8.00, cardPrice: 9.00 }
];

const quantities = {};
items.forEach(item => quantities[item.name] = 0);

function changeQuantity(itemName, change) {
  quantities[itemName] += change;
  if (quantities[itemName] < 0) quantities[itemName] = 0;
  renderItems();
  updateOrderSummary();
}

function renderItems() {
  const itemList = document.getElementById('item-list');
  itemList.innerHTML = '';

  items.forEach(item => {
    const quantity = quantities[item.name];
    const price = item.cashPrice;
    const itemTotal = quantity * price;

    const itemElement = document.createElement('div');
    itemElement.className = `item-card category-${item.category}`;
    itemElement.innerHTML = `
      <div class="item-header">
        <div class="item-name-image">
          <div class="item-name">${item.name}</div>
          <img src="${item.name}.png" alt="${item.name}" class="item-image">
        </div>
        <div class="item-price">R$ ${price.toFixed(2)}</div>
      </div>
      <div class="item-body">
        <div class="price-display">
          <span class="cash-price">Dinheiro/PIX: R$ ${item.cashPrice.toFixed(2)}</span><br/>
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

    itemList.appendChild(itemElement);
  });
}

function updateOrderSummary() {
  let totalItems = 0;
  let totalCash = 0;
  let totalCard = 0;

  items.forEach(item => {
    const qty = quantities[item.name];
    totalItems += qty;
    totalCash += qty * item.cashPrice;
    totalCard += qty * item.cardPrice;
  });

  document.getElementById('total-items').textContent = `Total de Itens: ${totalItems}`;
  document.getElementById('total-cash').textContent = `Total à Vista/PIX: R$ ${totalCash.toFixed(2)}`;
  document.getElementById('total-card').textContent = `Total no Cartão: R$ ${totalCard.toFixed(2)}`;
}

// Inicializa
renderItems();
updateOrderSummary();
