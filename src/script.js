const BACKEND_URL = "https://script.google.com/macros/s/AKfycbx8alet0-xUoV1uEeU-uj-Ak_-171M-Lyd86YI3YiqoZ5ibbdgFWS0H8_wcY6JwB3Z89Q/exec";

const items = [
    // Salgados
    { name: "Pastel", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "pastel.png" },
    { name: "Caldo (Frango/Feijão)", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "caldo-frango.png" },
    { name: "Cachorro Quente Tradicional", cashPrice: 8.00, cardPrice: 8.40, category: "salgados", image: "cachorro-quente.png" },
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
    { name: "Suco de Caixinha", cashPrice: 3.00, cardPrice: 3.15, category: "bebidas", image: "suco-de-caixinha.png" }
];

let quantities = {};
items.forEach(item => {
    quantities[item.name] = 0;
});

let currentCategory = "all";
let searchTerm = "";
let paymentMethod = "cash";
let amountPaid = 0;
let saleInProgress = false;
let undoInProgress = false;
let chartsInProgress = false;

const STORAGE_KEYS = {
    seller: "festaJuninaSellerName",
    sales: "festaJuninaSales"
};

document.addEventListener("DOMContentLoaded", () => {
    renderItems();
    setupEventListeners();
    updatePaymentMethodDisplay();
    updateOrderSummary();
    restoreSellerName();
});

function setupEventListeners() {
    document.querySelectorAll(".category-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentCategory = btn.dataset.category;
            renderItems();
        });
    });

    document.getElementById("search-input").addEventListener("input", (e) => {
        searchTerm = e.target.value.toLowerCase();
        renderItems();
    });

    const sellerInput = document.getElementById("seller-name");
    if (sellerInput) {
        sellerInput.addEventListener("input", () => {
            localStorage.setItem(STORAGE_KEYS.seller, sellerInput.value.trim());
        });
    }

    const amountPaidInput = document.getElementById("amount-paid");
    if (amountPaidInput) {
        amountPaidInput.addEventListener("input", (e) => {
            amountPaid = parseCurrencyInput(e.target.value);
            updateChange();
        });
    }
}

function restoreSellerName() {
    const sellerInput = document.getElementById("seller-name");
    if (!sellerInput) return;

    sellerInput.value = localStorage.getItem(STORAGE_KEYS.seller) || "";
}

function setPaymentMethod(method) {
    paymentMethod = method;

    if (paymentMethod !== "cash") {
        amountPaid = 0;
        const amountPaidInput = document.getElementById("amount-paid");
        if (amountPaidInput) amountPaidInput.value = "";
    }

    renderItems();
    updatePaymentMethodDisplay();
    updateOrderSummary();
    updateChange();
}

function updatePaymentMethodDisplay() {
    document.querySelectorAll(".payment-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.method === paymentMethod);
    });

    const display = document.getElementById("payment-method-display");
    if (display) display.textContent = `(${getPaymentMethodLabel(paymentMethod)})`;

    const cashBox = document.getElementById("cash-payment-box");
    if (cashBox) cashBox.classList.toggle("hidden", paymentMethod !== "cash");
}

function getPaymentMethodLabel(method) {
    switch (method) {
        case "cash":
            return "Dinheiro";
        case "pix":
            return "PIX";
        case "card":
            return "Cartão +5%";
        default:
            return "Dinheiro";
    }
}

function getCurrentPrice(item) {
    return paymentMethod === "card" ? item.cardPrice : item.cashPrice;
}

function renderItems() {
    const container = document.getElementById("items-container");
    container.innerHTML = "";

    const generalTotal = getOrderTotal();
    const itemsCount = getItemsCount();

    const filteredItems = items.filter(item => {
        const matchesCategory = currentCategory === "all" || item.category === currentCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });

    if (filteredItems.length === 0) {
        container.innerHTML = '<div class="no-items">Nenhum item encontrado</div>';
        updateSummary(generalTotal, itemsCount);
        updateOrderSummary();
        updateChange();
        return;
    }

    filteredItems.forEach(item => {
        const itemIndex = items.indexOf(item);
        const price = getCurrentPrice(item);
        const quantity = quantities[item.name] || 0;
        const itemTotal = quantity * price;

        const itemElement = document.createElement("div");
        itemElement.className = `item-card category-${item.category}`;

        const imagePath = item.image ? `images/${item.image}` : "images/default.png";

        itemElement.innerHTML = `
            <div class="item-header">
                <div class="item-name-container">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">R$ ${formatCurrency(price)}</div>
                </div>
                <img src="${imagePath}" alt="${item.name}" class="item-image" onerror="this.src='images/default.png'">
            </div>
            <div class="item-body">
                <div class="price-display">
                    <span class="cash-price">Dinheiro/PIX: R$ ${formatCurrency(item.cashPrice)}</span>
                    <span class="card-price">Cartão: R$ ${formatCurrency(item.cardPrice)}</span>
                </div>
                <div class="item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="changeQuantity(${itemIndex}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <div class="quantity-value">${quantity}</div>
                        <button class="quantity-btn" onclick="changeQuantity(${itemIndex}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="item-total">R$ ${formatCurrency(itemTotal)}</div>
                </div>
            </div>
        `;

        container.appendChild(itemElement);
    });

    updateSummary(generalTotal, itemsCount);
    updateOrderSummary();
    updateChange();
}

function changeQuantity(itemIndex, change) {
    const item = items[itemIndex];
    quantities[item.name] += change;
    if (quantities[item.name] < 0) quantities[item.name] = 0;
    renderItems();
}

function resetAll() {
    if (confirm("Tem certeza que deseja zerar todos os itens?")) {
        clearCurrentSale();
    }
}

function clearCurrentSale() {
    items.forEach(item => {
        quantities[item.name] = 0;
    });

    amountPaid = 0;
    const amountPaidInput = document.getElementById("amount-paid");
    if (amountPaidInput) amountPaidInput.value = "";

    renderItems();
    updateOrderSummary();
    updateChange();
}

function updateSummary(total, count) {
    document.getElementById("total-value").textContent = formatCurrency(total);
    document.getElementById("items-count").textContent = `${count} ${count === 1 ? "item" : "itens"}`;
}

function updateOrderSummary() {
    const orderItemsContainer = document.getElementById("order-items");
    orderItemsContainer.innerHTML = "";

    let orderTotal = 0;
    let hasItems = false;

    items.forEach(item => {
        const quantity = quantities[item.name] || 0;
        if (quantity > 0) {
            hasItems = true;
            const price = getCurrentPrice(item);
            const itemTotal = quantity * price;
            orderTotal += itemTotal;

            const itemElement = document.createElement("div");
            itemElement.className = "order-item";
            itemElement.innerHTML = `
                <div>
                    <span class="order-item-name">${item.name}</span>
                    <span class="order-item-quantity">${quantity}x</span>
                </div>
                <div class="order-item-price">R$ ${formatCurrency(itemTotal)}</div>
            `;

            orderItemsContainer.appendChild(itemElement);
        }
    });

    document.getElementById("order-total-value").textContent = formatCurrency(orderTotal);

    if (!hasItems) {
        orderItemsContainer.innerHTML = '<div class="no-items">Nenhum item adicionado</div>';
    }
}

function updateChange() {
    const changeValue = document.getElementById("change-value");
    const changeWarning = document.getElementById("change-warning");
    if (!changeValue || !changeWarning) return;

    const total = getOrderTotal();

    if (paymentMethod !== "cash") {
        changeValue.textContent = "0,00";
        changeWarning.textContent = "";
        changeWarning.className = "change-warning";
        return;
    }

    const change = amountPaid - total;
    changeValue.textContent = formatCurrency(Math.max(change, 0));

    if (total === 0) {
        changeWarning.textContent = "Adicione itens para calcular o troco.";
        changeWarning.className = "change-warning neutral";
    } else if (amountPaid === 0) {
        changeWarning.textContent = "Informe o valor recebido em dinheiro.";
        changeWarning.className = "change-warning neutral";
    } else if (change < 0) {
        changeWarning.textContent = `Falta R$ ${formatCurrency(Math.abs(change))}.`;
        changeWarning.className = "change-warning danger";
    } else {
        changeWarning.textContent = "Valor recebido suficiente.";
        changeWarning.className = "change-warning success";
    }
}

function getOrderTotal() {
    return items.reduce((total, item) => {
        const quantity = quantities[item.name] || 0;
        return total + quantity * getCurrentPrice(item);
    }, 0);
}

function getItemsCount() {
    return items.reduce((total, item) => total + (quantities[item.name] || 0), 0);
}

function getSelectedItems() {
    return items
        .filter(item => (quantities[item.name] || 0) > 0)
        .map(item => {
            const quantity = quantities[item.name];
            const unitPrice = getCurrentPrice(item);
            return {
                name: item.name,
                category: item.category,
                quantity,
                unitPrice,
                total: quantity * unitPrice
            };
        });
}

function getSellerName() {
    const sellerInput = document.getElementById("seller-name");
    return sellerInput ? sellerInput.value.trim() : "";
}

function buildSaleRecord() {
    const total = getOrderTotal();
    const paid = paymentMethod === "cash" ? amountPaid : total;
    const change = paymentMethod === "cash" ? Math.max(paid - total, 0) : 0;

    return {
        saleId: createSaleId(),
        datetimeIso: new Date().toISOString(),
        datetimeLocal: new Date().toLocaleString("pt-BR"),
        sellerName: getSellerName(),
        paymentMethod,
        paymentLabel: getPaymentMethodLabel(paymentMethod),
        total,
        amountPaid: paid,
        change,
        items: getSelectedItems()
    };
}

async function launchSale() {
    if (saleInProgress) return;

    const selectedItems = getSelectedItems();
    const sellerName = getSellerName();
    const total = getOrderTotal();

    if (!sellerName) {
        alert("Informe o nome do professor responsável pelo caixa antes de lançar a venda.");
        document.getElementById("seller-name")?.focus();
        return;
    }

    if (selectedItems.length === 0) {
        alert("Adicione pelo menos um item antes de lançar a venda.");
        return;
    }

    if (paymentMethod === "cash" && amountPaid < total) {
        alert(`O valor recebido é menor que o total. Falta R$ ${formatCurrency(total - amountPaid)}.`);
        document.getElementById("amount-paid")?.focus();
        return;
    }

    const sale = buildSaleRecord();
    saleInProgress = true;
    setSaleButtonsDisabled(true);

    try {
        saveSaleLocally(sale);

        if (isBackendConfigured()) {
            await sendSaleToBackend(sale);
            alert("Venda lançada. O registro foi enviado para o TXT central e também ficou salvo como backup local neste aparelho.");
        } else {
            alert("Venda lançada apenas no backup local deste aparelho. Para gravar no TXT central, configure BACKEND_URL no arquivo src/script.js.");
        }

        clearCurrentSale();
    } catch (error) {
        console.error(error);
        alert("A venda ficou salva no backup local, mas ocorreu erro ao enviar para o registro central. Verifique internet e configuração do Apps Script.");
    } finally {
        saleInProgress = false;
        setSaleButtonsDisabled(false);
    }
}

async function undoLastSale() {
    if (undoInProgress) return;

    const sellerName = getSellerName();
    if (!sellerName) {
        alert("Informe o nome do professor para localizar a última venda dele.");
        document.getElementById("seller-name")?.focus();
        return;
    }

    if (!confirm(`Deseja voltar a última venda lançada por ${sellerName}? A venda anterior será marcada como cancelada no registro central e voltará para edição na tela.`)) {
        return;
    }

    undoInProgress = true;
    setSaleButtonsDisabled(true);

    try {
        let sale = null;

        if (isBackendConfigured()) {
            const response = await requestUndoFromBackend(sellerName);
            if (!response.ok) {
                alert(response.message || "Não encontrei venda ativa para esse professor.");
                return;
            }
            sale = response.sale;
            removeLocalSaleById(sale.saleId);
        } else {
            sale = removeLastLocalSaleBySeller(sellerName);
            if (!sale) {
                alert("Não encontrei venda local para esse professor neste aparelho.");
                return;
            }
        }

        restoreSaleForEditing(sale);
        alert("Última venda recuperada para edição. Corrija o pedido e clique em Lançar Venda novamente.");
    } catch (error) {
        console.error(error);
        alert("Não foi possível voltar a última venda. Verifique a internet e a URL do Apps Script.");
    } finally {
        undoInProgress = false;
        setSaleButtonsDisabled(false);
    }
}

function restoreSaleForEditing(sale) {
    items.forEach(item => {
        quantities[item.name] = 0;
    });

    (sale.items || []).forEach(soldItem => {
        if (Object.prototype.hasOwnProperty.call(quantities, soldItem.name)) {
            quantities[soldItem.name] = Number(soldItem.quantity) || 0;
        }
    });

    paymentMethod = sale.paymentMethod || "cash";
    amountPaid = paymentMethod === "cash" ? Number(sale.amountPaid || 0) : 0;

    const amountPaidInput = document.getElementById("amount-paid");
    if (amountPaidInput) {
        amountPaidInput.value = amountPaid > 0 ? formatCurrency(amountPaid) : "";
    }

    updatePaymentMethodDisplay();
    renderItems();
    updateOrderSummary();
    updateChange();
}

function saveSaleLocally(sale) {
    const sales = getLocalSales();
    sales.push(sale);
    localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(sales));
}

function getLocalSales() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.sales)) || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

function removeLocalSaleById(saleId) {
    const sales = getLocalSales();
    const filteredSales = sales.filter(sale => sale.saleId !== saleId);
    localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(filteredSales));
}

function removeLastLocalSaleBySeller(sellerName) {
    const sales = getLocalSales();
    const normalizedSeller = normalizeText(sellerName);

    for (let i = sales.length - 1; i >= 0; i--) {
        if (normalizeText(sales[i].sellerName) === normalizedSeller) {
            const [sale] = sales.splice(i, 1);
            localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(sales));
            return sale;
        }
    }

    return null;
}

async function sendSaleToBackend(sale) {
    await fetch(BACKEND_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
            action: "launch",
            sale
        })
    });
}

function requestUndoFromBackend(sellerName) {
    return jsonpRequest({
        action: "undo",
        sellerName
    });
}

function requestSalesSummaryFromBackend() {
    return jsonpRequest({
        action: "summary"
    });
}

async function toggleChartsPanel() {
    const panel = document.getElementById("charts-panel");
    if (!panel) return;

    const willShow = panel.classList.contains("hidden");
    panel.classList.toggle("hidden");

    if (willShow) {
        await loadSalesDashboard();
    }
}

async function loadSalesDashboard() {
    if (chartsInProgress) return;

    chartsInProgress = true;
    setChartsStatus("Carregando dados das vendas...", "neutral");
    setChartsRefreshDisabled(true);

    try {
        let summary = null;
        let sourceLabel = "";

        if (isBackendConfigured()) {
            const response = await requestSalesSummaryFromBackend();
            if (!response.ok) {
                throw new Error(response.message || "Não foi possível consultar o resumo central.");
            }
            summary = normalizeDashboardSummary(response.summary);
            sourceLabel = "Dados carregados do TXT central no Google Drive.";
        } else {
            summary = buildDashboardSummaryFromSales(getLocalSales());
            sourceLabel = "Dados carregados apenas do backup local deste aparelho. Configure BACKEND_URL para visualizar o caixa geral.";
        }

        renderSalesDashboard(summary, sourceLabel);
        setChartsStatus("Gráficos atualizados.", "success");
    } catch (error) {
        console.error(error);
        const fallbackSummary = buildDashboardSummaryFromSales(getLocalSales());
        renderSalesDashboard(fallbackSummary, "Não foi possível consultar o TXT central. Exibindo apenas o backup local deste aparelho.");
        setChartsStatus("Erro ao consultar o registro central. Verifique internet, URL do Apps Script e implantação do Web App.", "danger");
    } finally {
        chartsInProgress = false;
        setChartsRefreshDisabled(false);
    }
}

function renderSalesDashboard(summary, sourceLabel) {
    const safeSummary = normalizeDashboardSummary(summary);

    document.getElementById("kpi-total-revenue").textContent = formatCurrency(safeSummary.totalRevenue);
    document.getElementById("kpi-total-sales").textContent = String(safeSummary.totalSales);
    document.getElementById("kpi-total-items").textContent = String(safeSummary.totalItems);

    const source = document.getElementById("charts-source");
    if (source) source.textContent = sourceLabel;

    const paymentOrder = ["cash", "pix", "card"];
    const paymentRevenueData = paymentOrder.map(method => ({
        label: safeSummary.payments[method].label,
        value: safeSummary.payments[method].revenue,
        extra: `${safeSummary.payments[method].sales} ${safeSummary.payments[method].sales === 1 ? "venda" : "vendas"}`
    }));

    const paymentCountData = paymentOrder.map(method => ({
        label: safeSummary.payments[method].label,
        value: safeSummary.payments[method].sales,
        extra: `R$ ${formatCurrency(safeSummary.payments[method].revenue)}`
    }));

    const itemQuantityData = safeSummary.items
        .slice()
        .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
        .map(item => ({
            label: item.name,
            value: item.quantity,
            extra: `R$ ${formatCurrency(item.revenue)}`
        }));

    const sellerSalesData = safeSummary.sellers
        .slice()
        .sort((a, b) => b.revenue - a.revenue || b.sales - a.sales)
        .map(seller => ({
            label: seller.name,
            value: seller.revenue,
            extra: `${seller.sales} ${seller.sales === 1 ? "venda" : "vendas"}`
        }));

    renderBarChart("payment-revenue-chart", paymentRevenueData, {
        valueFormatter: value => `R$ ${formatCurrency(value)}`,
        emptyText: "Nenhuma venda lançada ainda."
    });

    renderBarChart("payment-count-chart", paymentCountData, {
        valueFormatter: value => String(value),
        emptyText: "Nenhuma venda lançada ainda."
    });

    renderBarChart("item-quantity-chart", itemQuantityData, {
        valueFormatter: value => `${value} ${value === 1 ? "unidade" : "unidades"}`,
        emptyText: "Nenhum item vendido ainda."
    });

    renderBarChart("seller-sales-chart", sellerSalesData, {
        valueFormatter: value => `R$ ${formatCurrency(value)}`,
        emptyText: "Nenhuma venda por professor ainda."
    });
}

function renderBarChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const rows = Array.isArray(data) ? data.filter(row => Number(row.value) > 0) : [];
    const formatter = options.valueFormatter || (value => String(value));
    const maxValue = Math.max(...rows.map(row => Number(row.value) || 0), 0);

    if (rows.length === 0 || maxValue <= 0) {
        container.innerHTML = `<div class="chart-empty">${escapeHtml(options.emptyText || "Sem dados para exibir.")}</div>`;
        return;
    }

    container.innerHTML = rows.map(row => {
        const value = Number(row.value) || 0;
        const width = Math.max((value / maxValue) * 100, 4);
        const extra = row.extra ? `<span class="chart-extra">${escapeHtml(row.extra)}</span>` : "";

        return `
            <div class="chart-row">
                <div class="chart-row-top">
                    <span class="chart-label" title="${escapeHtml(row.label)}">${escapeHtml(row.label)}</span>
                    <span class="chart-value">${escapeHtml(formatter(value))}</span>
                </div>
                <div class="chart-track">
                    <div class="chart-fill" style="width: ${width.toFixed(2)}%"></div>
                </div>
                ${extra}
            </div>
        `;
    }).join("");
}

function buildDashboardSummaryFromSales(sales) {
    const summary = createEmptyDashboardSummary();
    const itemMap = new Map();
    const sellerMap = new Map();

    (Array.isArray(sales) ? sales : []).forEach(sale => {
        const paymentMethodKey = normalizePaymentMethod(sale.paymentMethod);
        const total = Number(sale.total) || 0;
        const sellerName = String(sale.sellerName || "Professor não informado").trim() || "Professor não informado";
        const sellerKey = normalizeText(sellerName);

        summary.totalSales += 1;
        summary.totalRevenue += total;
        summary.payments[paymentMethodKey].sales += 1;
        summary.payments[paymentMethodKey].revenue += total;

        if (!sellerMap.has(sellerKey)) {
            sellerMap.set(sellerKey, {
                name: sellerName,
                sales: 0,
                revenue: 0
            });
        }

        const sellerData = sellerMap.get(sellerKey);
        sellerData.sales += 1;
        sellerData.revenue += total;

        (sale.items || []).forEach(item => {
            const itemName = String(item.name || "Item sem nome").trim() || "Item sem nome";
            const itemKey = normalizeText(itemName);
            const quantity = Number(item.quantity) || 0;
            const itemTotal = Number(item.total) || quantity * (Number(item.unitPrice) || 0);

            summary.totalItems += quantity;

            if (!itemMap.has(itemKey)) {
                itemMap.set(itemKey, {
                    name: itemName,
                    quantity: 0,
                    revenue: 0
                });
            }

            const itemData = itemMap.get(itemKey);
            itemData.quantity += quantity;
            itemData.revenue += itemTotal;
        });
    });

    summary.items = Array.from(itemMap.values());
    summary.sellers = Array.from(sellerMap.values());

    return summary;
}

function normalizeDashboardSummary(summary) {
    const normalized = createEmptyDashboardSummary();
    const source = summary || {};
    const sourcePayments = source.payments || {};

    normalized.totalSales = Number(source.totalSales) || 0;
    normalized.totalRevenue = Number(source.totalRevenue) || 0;
    normalized.totalItems = Number(source.totalItems) || 0;

    ["cash", "pix", "card"].forEach(method => {
        const payment = sourcePayments[method] || {};
        normalized.payments[method].sales = Number(payment.sales) || 0;
        normalized.payments[method].revenue = Number(payment.revenue) || 0;
    });

    normalized.items = Array.isArray(source.items) ? source.items.map(item => ({
        name: String(item.name || "Item sem nome"),
        quantity: Number(item.quantity) || 0,
        revenue: Number(item.revenue) || 0
    })) : [];

    normalized.sellers = Array.isArray(source.sellers) ? source.sellers.map(seller => ({
        name: String(seller.name || "Professor não informado"),
        sales: Number(seller.sales) || 0,
        revenue: Number(seller.revenue) || 0
    })) : [];

    return normalized;
}

function createEmptyDashboardSummary() {
    return {
        totalSales: 0,
        totalRevenue: 0,
        totalItems: 0,
        payments: {
            cash: { label: "Dinheiro", sales: 0, revenue: 0 },
            pix: { label: "PIX", sales: 0, revenue: 0 },
            card: { label: "Cartão", sales: 0, revenue: 0 }
        },
        items: [],
        sellers: []
    };
}

function normalizePaymentMethod(method) {
    if (method === "pix") return "pix";
    if (method === "card") return "card";
    return "cash";
}

function setChartsStatus(message, type = "neutral") {
    const status = document.getElementById("charts-status");
    if (!status) return;

    status.textContent = message;
    status.className = `charts-status ${type}`;
}

function setChartsRefreshDisabled(disabled) {
    document.querySelectorAll(".refresh-charts-btn, .charts-toggle-btn").forEach(btn => {
        btn.disabled = disabled;
    });
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function jsonpRequest(params) {
    return new Promise((resolve, reject) => {
        const callbackName = `festaJuninaCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        const url = new URL(BACKEND_URL);

        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        url.searchParams.set("callback", callbackName);

        const script = document.createElement("script");
        let timeoutId = null;

        function cleanup() {
            if (timeoutId) clearTimeout(timeoutId);
            delete window[callbackName];
            script.remove();
        }

        window[callbackName] = (data) => {
            cleanup();
            resolve(data);
        };

        script.onerror = () => {
            cleanup();
            reject(new Error("Erro ao consultar o Apps Script."));
        };

        timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error("Tempo esgotado ao consultar o Apps Script."));
        }, 12000);

        script.src = url.toString();
        document.body.appendChild(script);
    });
}

function setSaleButtonsDisabled(disabled) {
    document.querySelectorAll(".launch-btn, .undo-sale-btn").forEach(btn => {
        btn.disabled = disabled;
    });
}

function isBackendConfigured() {
    return BACKEND_URL.trim() !== "";
}

function parseCurrencyInput(value) {
    const normalized = String(value || "")
        .replace(/[^0-9,.]/g, "")
        .replace(",", ".");

    return Number(normalized) || 0;
}

function formatCurrency(value) {
    return Number(value || 0).toFixed(2).replace(".", ",");
}

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function createSaleId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `venda-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
