const BACKEND_URL = "https://script.google.com/macros/s/AKfycbx8alet0-xUoV1uEeU-uj-Ak_-171M-Lyd86YI3YiqoZ5ibbdgFWS0H8_wcY6JwB3Z89Q/exec";

const items = [
    // Salgados
    { name: "Caldo (Frango/Feijão)", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "caldo-frango.png", fichaLimit: 200, ownerGroup: "3º de Mineração" },
    { name: "Pastel", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "pastel.png", fichaLimit: 200, ownerGroup: "3º de Informática" },
    { name: "Cachorro Quente Tradicional", cashPrice: 8.00, cardPrice: 8.40, category: "salgados", image: "cachorro-quente.png", description: "Pão, molho de salsicha e batata palha.", fichaLimit: 140, ownerGroup: "2º de Mineração" },
    { name: "Cachorro Quente Completo", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "cachorro-quente-completo.png", description: "Pão, molho de salsicha, purê de batata, bacon e batata palha.", fichaLimit: 130, ownerGroup: "2º de Mineração" },
    { name: "Pipoca Doce/Salgada", cashPrice: 6.00, cardPrice: 6.30, category: "salgados", image: "pipoca-doce.png", fichaLimit: 150, ownerGroup: "2º de Informática" },
    { name: "Pipoca de Leite Ninho", cashPrice: 8.00, cardPrice: 8.40, category: "doces", image: "pipoca-leite-ninho.png", fichaLimit: 50, ownerGroup: "2º de Informática" },
    { name: "Milho Cozido", cashPrice: 6.00, cardPrice: 6.30, category: "salgados", image: "milho.png", fichaLimit: 70, ownerGroup: "2º de Informática" },

    // Doces
    { name: "Arroz Doce", cashPrice: 5.00, cardPrice: 5.25, category: "doces", image: "arroz-doce.png", fichaLimit: null, ownerGroup: "2º de Informática" },
    { name: "Maçã do Amor", cashPrice: 6.00, cardPrice: 6.30, category: "doces", image: "maca-amor.png", fichaLimit: 200, ownerGroup: "1º de Informática" },
    { name: "Canjica", cashPrice: 6.00, cardPrice: 6.30, category: "doces", image: "canjica.png", fichaLimit: 80, ownerGroup: "1º de Desenvolvimento de Sistemas" },

    // Bebidas
    { name: "Água Mineral", cashPrice: 2.00, cardPrice: 2.10, category: "bebidas", image: "agua-sem-gas.png", fichaLimit: 48, ownerGroup: "3º anos - compartilhado" },
    { name: "Água com Gás", cashPrice: 4.00, cardPrice: 4.20, category: "bebidas", image: "agua-gas.png", fichaLimit: 12, ownerGroup: "3º anos - compartilhado" },
    { name: "Refrigerante", cashPrice: 6.00, cardPrice: 6.30, category: "bebidas", image: "refrigerante.png", description: "Coca-Cola e Guaraná juntos.", fichaLimit: 200, ownerGroup: "3º anos - compartilhado" },
    { name: "Suco de Caixinha", cashPrice: 3.00, cardPrice: 3.15, category: "bebidas", image: "suco-de-caixinha.png", fichaLimit: 15, ownerGroup: "3º anos - compartilhado" }
];

const THIRD_YEAR_SHARED_ITEMS = ["Água Mineral", "Água com Gás", "Refrigerante", "Suco de Caixinha"];

const FALLBACK_STUDENT_GROUPS = {
    terceiroMineracao: {
        label: "3º de Mineração",
        allowedItems: ["Caldo (Frango/Feijão)", ...THIRD_YEAR_SHARED_ITEMS]
    },
    terceiroInformatica: {
        label: "3º de Informática",
        allowedItems: ["Pastel", ...THIRD_YEAR_SHARED_ITEMS]
    },
    segundoMineracao: {
        label: "2º de Mineração",
        allowedItems: ["Cachorro Quente Tradicional", "Cachorro Quente Completo"]
    },
    segundoInformatica: {
        label: "2º de Informática",
        allowedItems: ["Pipoca Doce/Salgada", "Pipoca de Leite Ninho", "Milho Cozido", "Arroz Doce"]
    },
    primeiroInformatica: {
        label: "1º de Informática",
        allowedItems: ["Maçã do Amor"]
    },
    primeiroDs: {
        label: "1º de Desenvolvimento de Sistemas",
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
let studentActionInProgress = false;
let currentSession = null;

const STORAGE_KEYS = {
    sales: "festaJuninaSales",
    accessSession: "festaJuninaAccessSessionV2",
    deviceId: "festaJuninaDeviceId"
};

const COOKIE_KEYS = {
    seller: "festaJuninaSellerName"
};

const SELLER_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;
const ACCESS_DURATION_DAYS = 7;

document.addEventListener("DOMContentLoaded", () => {
    initializeDeviceCode();
    setupAccessGate();
    setupEventListeners();
    renderItems();
    updatePaymentMethodDisplay();
    updateOrderSummary();
    restoreSellerName();

    const savedSession = getSavedAccessSession();
    if (savedSession) {
        setAppAccess(savedSession);
    } else {
        setAppLocked();
    }
});

function setupAccessGate() {
    const form = document.getElementById("password-form");
    const passwordInput = document.getElementById("site-password");
    const errorBox = document.getElementById("password-error");
    const deviceBox = document.getElementById("device-code-box");

    if (deviceBox) {
        deviceBox.textContent = `Código do dispositivo: ${getDeviceId()}`;
    }

    if (!form || !passwordInput) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const accessKey = passwordInput.value.trim();

        if (!accessKey) {
            if (errorBox) errorBox.textContent = "Informe a chave de acesso.";
            return;
        }

        const submitButton = form.querySelector("button[type='submit']");
        if (submitButton) submitButton.disabled = true;
        if (errorBox) errorBox.textContent = "Validando chave...";

        try {
            const response = await jsonpRequest({
                action: "login",
                accessKey,
                deviceId: getDeviceId(),
                deviceInfo: JSON.stringify(getDeviceInfo())
            });

            if (!response.ok) {
                throw new Error(response.message || "Chave inválida.");
            }

            const session = {
                token: response.sessionToken,
                role: response.role,
                roleLabel: response.roleLabel,
                studentGroup: response.studentGroup || "",
                studentGroupLabel: response.studentGroupLabel || "",
                allowedItems: Array.isArray(response.allowedItems) ? response.allowedItems : [],
                deviceId: getDeviceId(),
                expiresAt: response.expiresAt || new Date(Date.now() + ACCESS_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString()
            };

            saveAccessSession(session);
            passwordInput.value = "";
            if (errorBox) errorBox.textContent = "";
            setAppAccess(session);
        } catch (error) {
            console.error(error);
            if (errorBox) errorBox.textContent = error.message || "Não foi possível validar a chave.";
            passwordInput.select();
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

function setAppLocked() {
    currentSession = null;
    document.body.classList.add("locked");
    document.getElementById("access-gate")?.classList.remove("hidden");
    document.getElementById("app-root")?.classList.add("app-hidden");
    setTimeout(() => document.getElementById("site-password")?.focus(), 50);
}

function setAppAccess(session) {
    currentSession = session;
    document.body.classList.remove("locked");
    document.getElementById("access-gate")?.classList.add("hidden");
    document.getElementById("app-root")?.classList.remove("app-hidden");

    const roleLabel = document.getElementById("session-role-label");
    if (roleLabel) roleLabel.textContent = getDisplayRoleLabel(session);

    const deviceLabel = document.getElementById("session-device-code");
    if (deviceLabel) deviceLabel.textContent = `Dispositivo: ${session.deviceId || getDeviceId()}`;

    const adminNav = document.getElementById("admin-nav");
    if (adminNav) adminNav.classList.toggle("hidden", session.role !== "admin");

    if (session.role === "aluno") {
        showOnlyScreen("student");
        loadStudentPanel();
        return;
    }

    showOnlyScreen("cash");
    document.getElementById("seller-name")?.focus();
}

function logoutAccess() {
    if (!confirm("Deseja sair deste dispositivo? Será necessário informar a chave novamente.")) return;
    localStorage.removeItem(STORAGE_KEYS.accessSession);
    setAppLocked();
}

function getDisplayRoleLabel(session) {
    if (!session) return "Perfil";
    if (session.role === "aluno") return `Alunos - ${session.studentGroupLabel || session.roleLabel || "Itens"}`;
    return session.roleLabel || session.role || "Perfil";
}

function getSavedAccessSession() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.accessSession);
        if (!raw) return null;

        const session = JSON.parse(raw);
        if (!session || !session.token || !session.role || !session.expiresAt) return null;

        if (new Date(session.expiresAt).getTime() <= Date.now()) {
            localStorage.removeItem(STORAGE_KEYS.accessSession);
            return null;
        }

        return session;
    } catch (error) {
        console.error(error);
        localStorage.removeItem(STORAGE_KEYS.accessSession);
        return null;
    }
}

function saveAccessSession(session) {
    localStorage.setItem(STORAGE_KEYS.accessSession, JSON.stringify(session));
}

function requireSession() {
    const session = currentSession || getSavedAccessSession();
    if (!session) {
        setAppLocked();
        throw new Error("Sessão expirada. Informe a chave novamente.");
    }
    currentSession = session;
    return session;
}

function authParams(extra = {}) {
    const session = requireSession();
    return {
        token: session.token,
        deviceId: getDeviceId(),
        ...extra
    };
}

function initializeDeviceCode() {
    getDeviceId();
}

function getDeviceId() {
    let deviceId = localStorage.getItem(STORAGE_KEYS.deviceId);
    if (!deviceId) {
        deviceId = createShortDeviceId();
        localStorage.setItem(STORAGE_KEYS.deviceId, deviceId);
    }
    return deviceId;
}

function createShortDeviceId() {
    const randomPart = window.crypto && crypto.randomUUID
        ? crypto.randomUUID().split("-")[0]
        : Math.random().toString(36).substring(2, 10);
    return `DEV-${randomPart.toUpperCase()}`;
}

function getDeviceInfo() {
    return {
        deviceId: getDeviceId(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        datetimeIso: new Date().toISOString()
    };
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

    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchTerm = e.target.value.toLowerCase();
            renderItems();
        });
    }

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

function switchAdminView(view) {
    if (!currentSession || currentSession.role !== "admin") return;
    showOnlyScreen(view);
    document.querySelectorAll(".admin-tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.view === view);
    });

    if (view === "student") loadStudentPanel();
    if (view === "charts") loadSalesDashboard();
}

function showOnlyScreen(screen) {
    const cash = document.getElementById("cash-screen");
    const student = document.getElementById("student-screen");
    const charts = document.getElementById("charts-screen");

    cash?.classList.toggle("hidden", screen !== "cash");
    student?.classList.toggle("hidden", screen !== "student");
    charts?.classList.toggle("hidden", screen !== "charts");
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
        case "cash": return "Dinheiro";
        case "pix": return "PIX";
        case "card": return "Cartão +5%";
        default: return "Dinheiro";
    }
}

function getCurrentPrice(item) {
    return paymentMethod === "card" ? item.cardPrice : item.cashPrice;
}

function renderItems() {
    const container = document.getElementById("items-container");
    if (!container) return;

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
        const imagePath = item.image ? `images/${item.image}` : "images/default.png";

        const itemElement = document.createElement("div");
        itemElement.className = `item-card category-${item.category}`;
        itemElement.innerHTML = `
            <div class="item-header">
                <div class="item-name-container">
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-price">R$ ${formatCurrency(price)}</div>
                </div>
                <img src="${imagePath}" alt="${escapeHtml(item.name)}" class="item-image" onerror="this.src='images/default.png'">
            </div>
            <div class="item-body">
                <div class="price-display">
                    <span class="cash-price">Dinheiro/PIX: R$ ${formatCurrency(item.cashPrice)}</span>
                    <span class="card-price">Cartão: R$ ${formatCurrency(item.cardPrice)}</span>
                </div>
                ${item.ownerGroup ? `<div class="item-owner">Responsável: ${escapeHtml(item.ownerGroup)}</div>` : ""}
                ${item.fichaLimit ? `<div class="item-fichas">Fichas: ${item.fichaLimit}</div>` : ""}
                ${item.description ? `<div class="item-description">${escapeHtml(item.description)}</div>` : ""}
                <div class="item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="changeQuantity(${itemIndex}, -1)" aria-label="Remover ${escapeHtml(item.name)}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <div class="quantity-value">${quantity}</div>
                        <button class="quantity-btn" onclick="changeQuantity(${itemIndex}, 1)" aria-label="Adicionar ${escapeHtml(item.name)}">
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
    if (!item) return;
    quantities[item.name] = Math.max((quantities[item.name] || 0) + change, 0);
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
    const totalValue = document.getElementById("total-value");
    const itemsCount = document.getElementById("items-count");
    if (totalValue) totalValue.textContent = formatCurrency(total);
    if (itemsCount) itemsCount.textContent = `${count} ${count === 1 ? "item" : "itens"}`;
}

function updateOrderSummary() {
    const orderItemsContainer = document.getElementById("order-items");
    if (!orderItemsContainer) return;

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
                    <span class="order-item-name">${escapeHtml(item.name)}</span>
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

    const orderTotalValue = document.getElementById("order-total-value");
    if (orderTotalValue) orderTotalValue.textContent = formatCurrency(orderTotal);

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
    const session = requireSession();
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
        items: getSelectedItems(),
        deviceId: getDeviceId(),
        deviceInfo: getDeviceInfo(),
        accessRole: session.role,
        accessRoleLabel: getDisplayRoleLabel(session)
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
        const response = await jsonpRequest(authParams({
            action: "launch",
            sale: JSON.stringify(sale)
        }));

        if (!response.ok) {
            throw new Error(response.message || "A venda não foi registrada no backend.");
        }

        saveSaleLocally(sale);
        alert(`Venda lançada no registro central.\nCódigo do dispositivo: ${getDeviceId()}`);
        clearCurrentSale();
    } catch (error) {
        console.error(error);
        alert(error.message || "Erro ao lançar a venda. Verifique internet, chave de acesso e Apps Script.");
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
        const response = await jsonpRequest(authParams({
            action: "undo",
            sellerName
        }));

        if (!response.ok) {
            alert(response.message || "Não encontrei venda ativa para esse professor.");
            return;
        }

        const sale = response.sale;
        removeLocalSaleById(sale.saleId);
        restoreSaleForEditing(sale);
        alert("Última venda recuperada para edição. Corrija o pedido e clique em Lançar Venda novamente.");
    } catch (error) {
        console.error(error);
        alert(error.message || "Não foi possível voltar a última venda. Verifique a internet e a URL do Apps Script.");
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

async function toggleChartsPanel() {
    const chartsScreen = document.getElementById("charts-screen");
    if (!chartsScreen) return;

    const willShow = chartsScreen.classList.contains("hidden");
    chartsScreen.classList.toggle("hidden");

    if (willShow) {
        await loadSalesDashboard();
        chartsScreen.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

async function loadSalesDashboard() {
    if (chartsInProgress) return;

    chartsInProgress = true;
    setChartsStatus("Carregando resumo das vendas...", "neutral");
    setChartsRefreshDisabled(true);

    try {
        const response = await jsonpRequest(authParams({ action: "summary" }));
        if (!response.ok) {
            throw new Error(response.message || "Não foi possível carregar o resumo.");
        }

        renderSalesDashboard(response.summary, "Dados carregados do TXT central no Google Drive.");
        setChartsStatus("Gráficos atualizados.", "success");
    } catch (error) {
        console.error(error);
        const fallbackSummary = buildDashboardSummaryFromSales(getLocalSales());
        renderSalesDashboard(fallbackSummary, "Não foi possível consultar o TXT central. Exibindo apenas o backup local deste aparelho.");
        setChartsStatus(error.message || "Erro ao consultar o registro central.", "danger");
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

async function loadStudentPanel() {
    if (studentActionInProgress) return;

    studentActionInProgress = true;
    setStudentStatus("Carregando fichas vendidas...", "neutral");
    setStudentButtonsDisabled(true);

    try {
        const response = await jsonpRequest(authParams({ action: "studentStatus" }));
        if (!response.ok) {
            throw new Error(response.message || "Não foi possível carregar os itens.");
        }

        renderStudentPanel(response);
        setStudentStatus("Fichas vendidas atualizadas.", "success");
    } catch (error) {
        console.error(error);
        setStudentStatus(error.message || "Erro ao carregar as fichas vendidas.", "danger");
    } finally {
        studentActionInProgress = false;
        setStudentButtonsDisabled(false);
    }
}

function renderStudentPanel(response) {
    const container = document.getElementById("student-items-container");
    const scopeText = document.getElementById("student-scope-text");
    if (!container) return;

    const session = requireSession();
    const panelItems = Array.isArray(response.items) ? response.items : [];
    const title = session.role === "admin"
        ? "Admin: visualização de todos os itens vendidos."
        : `Itens liberados para ${response.studentGroupLabel || session.studentGroupLabel || "este grupo"}.`;

    if (scopeText) scopeText.textContent = title;

    if (panelItems.length === 0) {
        container.innerHTML = '<div class="no-items">Nenhum item configurado para este grupo.</div>';
        return;
    }

    container.innerHTML = panelItems.map((item, index) => {
        const sold = Number(item.sold) || 0;
        const grossSold = Number(item.grossSold ?? sold) || 0;
        const adminRemoved = Number(item.adminRemoved) || 0;
        const fichaLimit = item.fichaLimit === null || item.fichaLimit === undefined ? null : Number(item.fichaLimit);
        const remainingFichas = fichaLimit === null ? null : Math.max(fichaLimit - sold, 0);

        const adminControls = session.role === "admin" ? `
            <div class="student-action-row admin-only-action">
                <input id="admin-remove-qty-${index}" type="number" min="1" max="${Math.max(sold, 1)}" value="${sold > 0 ? 1 : 0}" inputmode="numeric" ${sold <= 0 ? "disabled" : ""}>
                <button type="button" class="admin-remove-item-btn" onclick="adminRemoveItem('${escapeJs(item.name)}', ${index})" ${sold <= 0 ? "disabled" : ""}>
                    <i class="fas fa-triangle-exclamation"></i> Remover quantidade
                </button>
            </div>
        ` : "";

        const adminInfo = session.role === "admin" && adminRemoved > 0 ? `
            <div><span>Vendas brutas</span><strong>${grossSold}</strong></div>
            <div><span>Ajustes admin</span><strong>${adminRemoved}</strong></div>
        ` : "";

        return `
            <article class="student-item-card">
                <div class="student-item-title">
                    <h3>${escapeHtml(item.name)}</h3>
                    <span>${escapeHtml(item.ownerGroup || item.category || "")}</span>
                </div>
                <div class="student-counters student-counters-readonly">
                    <div class="sold-counter"><span>Fichas vendidas</span><strong>${sold}</strong></div>
                    <div><span>Fichas totais</span><strong>${fichaLimit === null ? "—" : fichaLimit}</strong></div>
                    <div><span>Ainda não vendidas</span><strong>${remainingFichas === null ? "—" : remainingFichas}</strong></div>
                    ${adminInfo}
                </div>
                ${adminControls}
            </article>
        `;
    }).join("");
}
async function markItemFulfilled() {
    alert("A tela dos alunos agora é somente de consulta. Os alunos não registram retirada/produção no sistema.");
}
async function adminRemoveItem(itemName, index) {
    const session = requireSession();
    if (session.role !== "admin") return;

    const input = document.getElementById(`admin-remove-qty-${index}`) || document.getElementById(`fulfill-qty-${index}`);
    const quantity = Math.max(Number(input?.value) || 0, 0);

    if (quantity <= 0) {
        alert("Informe a quantidade a remover no campo ao lado.");
        return;
    }

    const reason = prompt(`Motivo para remover ${quantity} unidade(s) de ${itemName} do total vendido:`, "Ajuste manual do admin");
    if (reason === null) return;

    studentActionInProgress = true;
    setStudentButtonsDisabled(true);
    setStudentStatus("Registrando ajuste do admin...", "neutral");

    try {
        const response = await jsonpRequest(authParams({
            action: "adminRemoveItem",
            itemName,
            quantity: String(quantity),
            reason: reason || "Ajuste manual do admin"
        }));

        if (!response.ok) throw new Error(response.message || "Não foi possível registrar o ajuste.");
        await loadStudentPanel();
    } catch (error) {
        console.error(error);
        setStudentStatus(error.message || "Erro ao registrar ajuste do admin.", "danger");
    } finally {
        studentActionInProgress = false;
        setStudentButtonsDisabled(false);
    }
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
            sellerMap.set(sellerKey, { name: sellerName, sales: 0, revenue: 0 });
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
                itemMap.set(itemKey, { name: itemName, quantity: 0, revenue: 0 });
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

function setStudentStatus(message, type = "neutral") {
    const status = document.getElementById("student-status");
    if (!status) return;
    status.textContent = message;
    status.className = `charts-status ${type}`;
}

function setChartsRefreshDisabled(disabled) {
    document.querySelectorAll(".refresh-charts-btn, .charts-toggle-btn").forEach(btn => {
        btn.disabled = disabled;
    });
}

function setStudentButtonsDisabled(disabled) {
    document.querySelectorAll(".refresh-student-btn, .mark-done-btn, .admin-remove-item-btn").forEach(btn => {
        btn.disabled = disabled;
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
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return `venda-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeJs(value) {
    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\n/g, " ")
        .replace(/\r/g, " ");
}

function jsonpRequest(params) {
    return new Promise((resolve, reject) => {
        if (!BACKEND_URL || !BACKEND_URL.trim()) {
            reject(new Error("BACKEND_URL não está configurado."));
            return;
        }

        const callbackName = `festaJuninaCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        const url = new URL(BACKEND_URL);

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, value);
            }
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
        }, 15000);

        script.src = url.toString();
        document.body.appendChild(script);
    });
}
