const BACKEND_URL = "https://script.google.com/macros/s/AKfycbx8alet0-xUoV1uEeU-uj-Ak_-171M-Lyd86YI3YiqoZ5ibbdgFWS0H8_wcY6JwB3Z89Q/exec"; // URL do Web App do Google Apps Script para registrar as vendas em TXT no Google Drive.

const items = [
    // Salgados
    { name: "Caldo (Frango/Feijão)", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "caldo-frango.png", ownerGroup: "3º de Mineração", fichaLimit: 200 },
    { name: "Pastel", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "pastel.png", ownerGroup: "3º de Informática", fichaLimit: 200 },
    { name: "Cachorro Quente Tradicional", cashPrice: 8.00, cardPrice: 8.40, category: "salgados", image: "cachorro-quente.png", description: "Pão, molho de salsicha e batata palha.", ownerGroup: "2º de Mineração", fichaLimit: 140 },
    { name: "Cachorro Quente Completo", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "cachorro-quente-completo.png", description: "Pão, molho de salsicha, purê de batata, bacon e batata palha.", ownerGroup: "2º de Mineração", fichaLimit: 130 },
    { name: "Pipoca Doce/Salgada", cashPrice: 6.00, cardPrice: 6.30, category: "salgados", image: "pipoca-doce.png", ownerGroup: "2º de Informática", fichaLimit: 150 },
    { name: "Pipoca de Leite Ninho", cashPrice: 8.00, cardPrice: 8.40, category: "doces", image: "pipoca-leite-ninho.png", ownerGroup: "2º de Informática", fichaLimit: 50 },
    { name: "Milho Cozido", cashPrice: 6.00, cardPrice: 6.30, category: "salgados", image: "milho.png", ownerGroup: "2º de Informática", fichaLimit: 70 },

    // Doces
    { name: "Arroz Doce", cashPrice: 5.00, cardPrice: 5.25, category: "doces", image: "arroz-doce.png", ownerGroup: "2º de Informática", fichaLimit: null },
    { name: "Maçã do Amor", cashPrice: 6.00, cardPrice: 6.30, category: "doces", image: "maca-amor.png", ownerGroup: "1º de Informática", fichaLimit: 200 },
    { name: "Canjica", cashPrice: 6.00, cardPrice: 6.30, category: "doces", image: "canjica.png", ownerGroup: "1º de Desenvolvimento de Sistemas", fichaLimit: 80 },

    // Bebidas
    { name: "Água Mineral", cashPrice: 2.00, cardPrice: 2.10, category: "bebidas", image: "agua-sem-gas.png", ownerGroup: "3º anos - compartilhado", fichaLimit: 48 },
    { name: "Água com Gás", cashPrice: 4.00, cardPrice: 4.20, category: "bebidas", image: "agua-gas.png", ownerGroup: "3º anos - compartilhado", fichaLimit: 12 },
    { name: "Refrigerante", cashPrice: 6.00, cardPrice: 6.30, category: "bebidas", image: "refrigerante.png", description: "Coca-Cola e Guaraná juntos.", ownerGroup: "3º anos - compartilhado", fichaLimit: 200 },
    { name: "Suco de Caixinha", cashPrice: 3.00, cardPrice: 3.15, category: "bebidas", image: "suco-de-caixinha.png", ownerGroup: "3º anos - compartilhado", fichaLimit: 15 },

    // Outros
    { name: "Cartela de Bingo", cashPrice: 5.00, cardPrice: 5.25, category: "outros", image: "bingo.png", ownerGroup: "Bingo", fichaLimit: null }
];

const THIRD_YEAR_SHARED_ITEMS = ["Água Mineral", "Água com Gás", "Refrigerante", "Suco de Caixinha"];

const STUDENT_GROUPS = {
    terceiroMineracao: {
        label: "3º de Mineração",
        password: "3MIN-IF-6uR4pQ9v",
        allowedItems: ["Caldo (Frango/Feijão)", ...THIRD_YEAR_SHARED_ITEMS]
    },
    terceiroInformatica: {
        label: "3º de Informática",
        password: "3INFO-IF-P8xT2mKd",
        allowedItems: ["Pastel", ...THIRD_YEAR_SHARED_ITEMS]
    },
    segundoMineracao: {
        label: "2º de Mineração",
        password: "2MIN-IF-zW7nA5cL",
        allowedItems: ["Cachorro Quente Tradicional", "Cachorro Quente Completo"]
    },
    segundoInformatica: {
        label: "2º de Informática",
        password: "2INFO-IF-L9qR3sVy",
        allowedItems: ["Pipoca Doce/Salgada", "Pipoca de Leite Ninho", "Milho Cozido", "Arroz Doce"]
    },
    primeiroInformatica: {
        label: "1º de Informática",
        password: "1INFO-IF-B4hK8tNp",
        allowedItems: ["Maçã do Amor"]
    },
    primeiroDs: {
        label: "1º de Desenvolvimento de Sistemas",
        password: "1DS-IF-X6mV2jQa",
        allowedItems: ["Canjica"]
    }
};

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
let studentInProgress = false;
let studentWithdrawalDraft = {};
let currentAccessProfile = null;
let latestStudentStatusItems = [];

const STORAGE_KEYS = {
    sales: "festaJuninaSales",
    accessProfile: "festaJuninaAccessProfileV1"
};

const COOKIE_KEYS = {
    seller: "festaJuninaSellerName",
    access: "festaJuninaAccessOk"
};

const SITE_PASSWORD = "quadrilhaif2026";
const SELLER_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;
const ACCESS_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;

document.addEventListener("DOMContentLoaded", () => {
    setupAccessGate();
    renderItems();
    setupEventListeners();
    updatePaymentMethodDisplay();
    updateOrderSummary();
    restoreSellerName();

    const savedProfile = getSavedAccessProfile();
    if (savedProfile) {
        setAppAccess(true, savedProfile);
    } else if (hasValidAccessCookie()) {
        setAppAccess(true, { role: "cashier", label: "Professor / Caixa" });
    } else {
        setAppAccess(false);
    }
});

function setupAccessGate() {
    const form = document.getElementById("password-form");
    const passwordInput = document.getElementById("site-password");
    const errorBox = document.getElementById("password-error");

    if (!form || !passwordInput) return;

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const profile = resolveAccessPassword(passwordInput.value.trim());

        if (profile) {
            saveAccessProfile(profile);
            if (profile.role === "cashier") {
                setCookie(COOKIE_KEYS.access, "ok", ACCESS_COOKIE_MAX_AGE_SECONDS);
            }
            passwordInput.value = "";
            if (errorBox) errorBox.textContent = "";
            setAppAccess(true, profile);
        } else {
            if (errorBox) errorBox.textContent = "Senha incorreta. Tente novamente.";
            passwordInput.select();
        }
    });
}

function resolveAccessPassword(password) {
    if (password === SITE_PASSWORD) {
        return { role: "cashier", label: "Professor / Caixa" };
    }

    for (const [groupKey, group] of Object.entries(STUDENT_GROUPS)) {
        if (password === group.password) {
            return {
                role: "student",
                label: group.label,
                groupKey,
                allowedItems: group.allowedItems
            };
        }
    }

    return null;
}

function hasValidAccessCookie() {
    return getCookie(COOKIE_KEYS.access) === "ok";
}

function saveAccessProfile(profile) {
    const payload = {
        ...profile,
        expiresAt: Date.now() + ACCESS_COOKIE_MAX_AGE_SECONDS * 1000
    };
    localStorage.setItem(STORAGE_KEYS.accessProfile, JSON.stringify(payload));
}

function getSavedAccessProfile() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.accessProfile);
        if (!raw) return null;
        const profile = JSON.parse(raw);
        if (!profile || !profile.role || !profile.expiresAt || profile.expiresAt <= Date.now()) {
            localStorage.removeItem(STORAGE_KEYS.accessProfile);
            return null;
        }
        return profile;
    } catch (error) {
        localStorage.removeItem(STORAGE_KEYS.accessProfile);
        return null;
    }
}

function logoutAccess() {
    localStorage.removeItem(STORAGE_KEYS.accessProfile);
    setCookie(COOKIE_KEYS.access, "", 0);
    currentAccessProfile = null;
    setAppAccess(false);
}

function setAppAccess(isAllowed, profile = null) {
    const gate = document.getElementById("access-gate");
    const appRoot = document.getElementById("app-root");

    document.body.classList.toggle("locked", !isAllowed);

    if (gate) {
        gate.classList.toggle("hidden", isAllowed);
        gate.setAttribute("aria-hidden", String(isAllowed));
    }

    if (appRoot) {
        appRoot.setAttribute("aria-hidden", String(!isAllowed));
    }

    if (!isAllowed) {
        showCashierView(false);
        showStudentView(false);
        setTimeout(() => document.getElementById("site-password")?.focus(), 50);
        return;
    }

    currentAccessProfile = profile || { role: "cashier", label: "Professor / Caixa" };

    if (currentAccessProfile.role === "student") {
        showCashierView(false);
        showStudentView(true);
        loadStudentView();
    } else {
        showStudentView(false);
        showCashierView(true);
        document.getElementById("seller-name")?.focus();
    }
}

function showCashierView(show) {
    document.getElementById("cashier-view")?.classList.toggle("hidden", !show);
    const title = document.getElementById("app-title");
    if (show && title) title.textContent = "Caixa - Festa Junina 2025";
}

function showStudentView(show) {
    document.getElementById("student-view")?.classList.toggle("hidden", !show);
    const title = document.getElementById("app-title");
    if (show && title) title.textContent = "Visão Aluno - Festa Junina 2025";
}

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
            saveSellerNameCookie(sellerInput.value.trim());
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

    sellerInput.value = getCookie(COOKIE_KEYS.seller) || "";
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
                ${item.description ? `<div class="item-description">${escapeHtml(item.description)}</div>` : ""}
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

    items.forEach((item, itemIndex) => {
        const quantity = quantities[item.name] || 0;
        if (quantity > 0) {
            hasItems = true;
            const price = getCurrentPrice(item);
            const itemTotal = quantity * price;
            orderTotal += itemTotal;

            const itemElement = document.createElement("div");
            itemElement.className = "order-item";
            itemElement.innerHTML = `
                <div class="order-item-main">
                    <span class="order-item-name">${item.name}</span>
                    <span class="order-item-quantity">${quantity}x</span>
                </div>
                <div class="order-item-actions">
                    <button class="summary-quantity-btn" onclick="changeQuantity(${itemIndex}, -1)" aria-label="Remover uma unidade de ${escapeHtml(item.name)}">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="summary-quantity-btn" onclick="changeQuantity(${itemIndex}, 1)" aria-label="Adicionar uma unidade de ${escapeHtml(item.name)}">
                        <i class="fas fa-plus"></i>
                    </button>
                    <div class="order-item-price">R$ ${formatCurrency(itemTotal)}</div>
                </div>
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

    saveSellerNameCookie(sellerName);

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

    saveSellerNameCookie(sellerName);

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


function requestStudentStatusFromBackend() {
    return jsonpRequest({ action: "studentStatus" });
}

function requestStudentWithdrawalFromBackend(itemName, quantity) {
    return jsonpRequest({
        action: "registerWithdrawal",
        itemName,
        quantity: String(quantity),
        groupLabel: currentAccessProfile?.label || "Aluno"
    });
}

async function loadStudentView() {
    if (studentInProgress) return;

    const statusBox = document.getElementById("student-status");
    if (statusBox) {
        statusBox.textContent = "Carregando fichas vendidas no TXT central...";
        statusBox.className = "charts-status neutral";
    }

    studentInProgress = true;
    setStudentButtonsDisabled(true);

    try {
        if (!isBackendConfigured()) {
            throw new Error("BACKEND_URL não configurado.");
        }

        const response = await requestStudentStatusFromBackend();
        if (!response.ok) {
            throw new Error(response.message || "Não foi possível consultar o painel dos alunos.");
        }

        latestStudentStatusItems = response.items || [];
        renderStudentView(latestStudentStatusItems);
        if (statusBox) {
            statusBox.textContent = "Visão aluno atualizada.";
            statusBox.className = "charts-status success";
        }
    } catch (error) {
        console.error(error);
        renderStudentView([]);
        if (statusBox) {
            statusBox.textContent = "Erro ao consultar o TXT central. Verifique internet e se o Apps Script desta versão foi implantado.";
            statusBox.className = "charts-status danger";
        }
    } finally {
        studentInProgress = false;
        setStudentButtonsDisabled(false);
    }
}

function renderStudentView(statusItems) {
    const container = document.getElementById("student-items-container");
    const scopeText = document.getElementById("student-scope-text");
    if (!container) return;

    const profile = currentAccessProfile || getSavedAccessProfile();
    const allowedItems = profile?.allowedItems || [];
    const allowedSet = new Set(allowedItems.map(normalizeText));
    const statusMap = new Map((statusItems || []).map(item => [normalizeText(item.name), item]));

    if (scopeText) {
        scopeText.textContent = `${profile?.label || "Turma"}: acompanhe fichas vendidas, arrecadação e fichas já retiradas.`;
    }

    const visibleItems = items.filter(item => allowedSet.has(normalizeText(item.name)));

    if (visibleItems.length === 0) {
        container.innerHTML = '<div class="no-items">Nenhum item configurado para esta senha.</div>';
        return;
    }

    container.innerHTML = visibleItems.map((item, index) => {
        const key = normalizeText(item.name);
        const status = statusMap.get(key) || {};
        const sold = Number(status.sold) || 0;
        const revenue = Number(status.revenue) || 0;
        const withdrawn = Number(status.withdrawn) || 0;
        const pending = Math.max(sold - withdrawn, 0);
        const draftQty = studentWithdrawalDraft[key] || 0;
        const imagePath = item.image ? `images/${item.image}` : "images/default.png";
        const fichaLimit = item.fichaLimit === null || item.fichaLimit === undefined ? null : Number(item.fichaLimit);
        const soldPercent = fichaLimit && fichaLimit > 0 ? Math.min((sold / fichaLimit) * 100, 100) : (sold > 0 ? 100 : 0);
        const withdrawnPercent = sold > 0 ? Math.min((withdrawn / sold) * 100, 100) : 0;

        return `
            <div class="item-card student-card category-${item.category}">
                <div class="item-header">
                    <div class="item-name-container">
                        <div class="item-name">${escapeHtml(item.name)}</div>
                        <div class="item-price">R$ ${formatCurrency(item.cashPrice)}</div>
                    </div>
                    <img src="${imagePath}" alt="${escapeHtml(item.name)}" class="item-image" onerror="this.src='images/default.png'">
                </div>
                <div class="item-body">
                    <div class="student-card-meta">
                        ${item.ownerGroup ? `<span>Responsável: ${escapeHtml(item.ownerGroup)}</span>` : ""}
                        ${fichaLimit === null ? "" : `<span>Fichas previstas: ${fichaLimit}</span>`}
                    </div>

                    <div class="student-progress-block">
                        <div class="student-progress-label"><span>Vendidas</span><strong>${sold}${fichaLimit === null ? "" : ` / ${fichaLimit}`}</strong></div>
                        <div class="student-progress-track"><div class="student-progress-fill sold-fill" style="width: ${soldPercent}%"></div></div>
                        <div class="student-progress-label"><span>Retiradas</span><strong>${withdrawn} / ${sold}</strong></div>
                        <div class="student-progress-track"><div class="student-progress-fill withdrawn-fill" style="width: ${withdrawnPercent}%"></div></div>
                    </div>

                    <div class="student-stats-grid">
                        <div><span>Vendidas</span><strong>${sold}</strong></div>
                        <div><span>Arrecadado</span><strong>R$ ${formatCurrency(revenue)}</strong></div>
                        <div><span>Retiradas</span><strong>${withdrawn}</strong></div>
                        <div><span>A retirar</span><strong>${pending}</strong></div>
                    </div>

                    <div class="student-withdraw-row">
                        <div class="quantity-control">
                            <button class="quantity-btn" onclick="changeStudentWithdrawal('${escapeJs(item.name)}', -1)" ${draftQty <= 0 ? "disabled" : ""}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <div class="quantity-value">${draftQty}</div>
                            <button class="quantity-btn" onclick="changeStudentWithdrawal('${escapeJs(item.name)}', 1)" ${pending <= 0 || draftQty >= pending ? "disabled" : ""}>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="student-register-btn" onclick="registerStudentWithdrawal('${escapeJs(item.name)}')" ${draftQty <= 0 ? "disabled" : ""}>
                            <i class="fas fa-check"></i> Registrar retirada
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function changeStudentWithdrawal(itemName, change) {
    const key = normalizeText(itemName);
    const current = studentWithdrawalDraft[key] || 0;
    studentWithdrawalDraft[key] = Math.max(current + change, 0);
    renderStudentView(latestStudentStatusItems);
}

async function registerStudentWithdrawal(itemName) {
    const key = normalizeText(itemName);
    const quantity = studentWithdrawalDraft[key] || 0;

    if (quantity <= 0) {
        alert("Use os botões + e - para informar quantas fichas foram retiradas.");
        return;
    }

    if (!confirm(`Registrar retirada de ${quantity} ficha(s) de ${itemName}?`)) {
        return;
    }

    studentInProgress = true;
    setStudentButtonsDisabled(true);

    const statusBox = document.getElementById("student-status");
    if (statusBox) {
        statusBox.textContent = "Registrando retirada no TXT central...";
        statusBox.className = "charts-status neutral";
    }

    try {
        const response = await requestStudentWithdrawalFromBackend(itemName, quantity);
        if (!response.ok) {
            throw new Error(response.message || "Não foi possível registrar a retirada.");
        }
        studentWithdrawalDraft[key] = 0;
        await loadStudentView();
    } catch (error) {
        console.error(error);
        alert(error.message || "Erro ao registrar a retirada.");
        if (statusBox) {
            statusBox.textContent = "Erro ao registrar retirada.";
            statusBox.className = "charts-status danger";
        }
    } finally {
        studentInProgress = false;
        setStudentButtonsDisabled(false);
    }
}

function setStudentButtonsDisabled(disabled) {
    document.querySelectorAll(".refresh-student-btn, .student-register-btn, .student-view .quantity-btn").forEach(btn => {
        if (disabled) {
            btn.disabled = true;
        } else if (btn.classList.contains("refresh-student-btn")) {
            btn.disabled = false;
        }
    });
}

function escapeJs(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
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

function saveSellerNameCookie(sellerName) {
    setCookie(COOKIE_KEYS.seller, sellerName, SELLER_COOKIE_MAX_AGE_SECONDS);
}

function setCookie(name, value, maxAgeSeconds) {
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
}

function getCookie(name) {
    const encodedName = `${encodeURIComponent(name)}=`;
    const cookies = document.cookie ? document.cookie.split(";") : [];

    for (const cookie of cookies) {
        const current = cookie.trim();
        if (current.startsWith(encodedName)) {
            return decodeURIComponent(current.substring(encodedName.length));
        }
    }

    return "";
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
