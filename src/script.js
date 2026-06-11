const BACKEND_URL = "https://script.google.com/macros/s/AKfycbx8alet0-xUoV1uEeU-uj-Ak_-171M-Lyd86YI3YiqoZ5ibbdgFWS0H8_wcY6JwB3Z89Q/exec"; // URL do Web App do Google Apps Script para registrar as vendas em TXT no Google Drive.

const items = [
    // Salgados
    { name: "Caldo (Frango/Feijão)", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "caldo-frango.png", ownerGroup: "3º de Mineração", fichaLimit: 200 },
    { name: "Pastel", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "pastel.png", ownerGroup: "3º de Informática", fichaLimit: 200 },
    { name: "Cachorro Quente Tradicional", cashPrice: 8.00, cardPrice: 8.40, category: "salgados", image: "cachorro-quente.png", description: "Pão, molho de salsicha e batata palha", ownerGroup: "2º de Mineração", fichaLimit: 140 },
    { name: "Cachorro Quente Completo", cashPrice: 10.00, cardPrice: 10.50, category: "salgados", image: "cachorro-quente-completo.png", description: "Tradicional com purê de batata e bacon", ownerGroup: "2º de Mineração", fichaLimit: 130 },
    { name: "Pipoca Salgada/Amanteigada", cashPrice: 6.00, cardPrice: 6.30, category: "salgados", image: "pipoca-sal.png", ownerGroup: "2º de Informática", fichaLimit: 150 },
    { name: "Pipoca de Leite Ninho", cashPrice: 8.00, cardPrice: 8.40, category: "doces", image: "pipoca-leite-ninho.png", ownerGroup: "2º de Informática", fichaLimit: 50 },
    { name: "Milho Cozido", cashPrice: 8.00, cardPrice: 8.40, category: "salgados", image: "milho.png", ownerGroup: "2º de Informática", fichaLimit: 70 },

    // Doces
    { name: "Arroz Doce", cashPrice: 8.00, cardPrice: 8.40, category: "doces", image: "arroz-doce.png", ownerGroup: "2º de Informática", fichaLimit: null },
    { name: "Maçã do Amor", cashPrice: 6.00, cardPrice: 6.30, category: "doces", image: "maca-amor.png", ownerGroup: "1º de Informática", fichaLimit: 200 },
    //{ name: "Canjica", cashPrice: 6.00, cardPrice: 6.30, category: "doces", image: "canjica.png", ownerGroup: "1º de Desenvolvimento de Sistemas", fichaLimit: 80 },

    // Bebidas
    { name: "Água Mineral", cashPrice: 2.00, cardPrice: 2.10, category: "bebidas", image: "agua-sem-gas.png", ownerGroup: "3º anos - compartilhado", fichaLimit: 48 },
    { name: "Água com Gás", cashPrice: 4.00, cardPrice: 4.20, category: "bebidas", image: "agua-gas.png", ownerGroup: "3º anos - compartilhado", fichaLimit: 12 },
    { name: "Refrigerante", cashPrice: 6.00, cardPrice: 6.30, category: "bebidas", image: "refrigerante.png", description: "Coca-Cola e Guaraná", ownerGroup: "3º anos - compartilhado", fichaLimit: 200 },
    { name: "Suco de Caixinha", cashPrice: 3.00, cardPrice: 3.15, category: "bebidas", image: "suco-de-caixinha.png",  description: "Morango, uva e maracujá", ownerGroup: "3º anos - compartilhado", fichaLimit: 15 },

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
        allowedItems:["Canjica"]
     } 
};
;

const THIRD_YEAR_GROUP_KEYS = ["terceiroMineracao", "terceiroInformatica"];
const THIRD_YEAR_SHARED_REVENUE_ITEMS = ["Água Mineral", "Água com Gás", "Refrigerante", "Suco de Caixinha"];

function getItemBasePrice(itemName) {
    const found = items.find(item => normalizeText(item.name) === normalizeText(itemName));
    return found ? Number(found.cashPrice) || 0 : 0;
}

function getNetRevenueForStudentItem(item, status) {
    const sold = Number(status?.sold) || 0;
    const basePrice = getItemBasePrice(item.name);
    const grossFallback = Number(status?.revenue) || 0;

    if (basePrice > 0) {
        return sold * basePrice;
    }

    return grossFallback;
}

function shouldSplitThirdYearItem(itemName) {
    return THIRD_YEAR_SHARED_REVENUE_ITEMS
        .map(normalizeText)
        .includes(normalizeText(itemName));
}

function getStudentAllocatedRevenue(itemName, netRevenue, scope) {
    /*
     * Regra:
     * - Nos cards dos itens: mostrar o valor líquido total do item, sem dividir.
     * - No card central da turma: dividir por 2 apenas as bebidas compartilhadas dos 3º anos.
     */
    if (
        scope &&
        THIRD_YEAR_GROUP_KEYS.includes(scope.groupKey) &&
        shouldSplitThirdYearItem(itemName)
    ) {
        return netRevenue / 2;
    }

    return netRevenue;
}

function calculateCurrentStudentTotals(statusItems) {
    const scope = getCurrentStudentScope();
    const allowedItems = scope.allowedItems || [];
    const allowedSet = new Set(allowedItems.map(normalizeText));
    const statusMap = new Map((statusItems || []).map(item => [normalizeText(item.name), item]));

    return items
        .filter(item => allowedSet.has(normalizeText(item.name)))
        .reduce((acc, item) => {
            const status = statusMap.get(normalizeText(item.name)) || {};
            const sold = Number(status.sold) || 0;
            const itemNetRevenue = getNetRevenueForStudentItem(item, status);
            const allocatedRevenue = getStudentAllocatedRevenue(item.name, itemNetRevenue, scope);

            acc.sold += sold;
            acc.revenue += allocatedRevenue;

            if (THIRD_YEAR_GROUP_KEYS.includes(scope.groupKey) && shouldSplitThirdYearItem(item.name)) {
                acc.sharedRevenueFull += itemNetRevenue;
                acc.sharedRevenueAllocated += allocatedRevenue;
            } else {
                acc.ownRevenue += allocatedRevenue;
            }

            return acc;
        }, {
            sold: 0,
            revenue: 0,
            ownRevenue: 0,
            sharedRevenueFull: 0,
            sharedRevenueAllocated: 0
        });
}

function renderStudentClassTotal(statusItems) {
    const panel = document.getElementById("student-class-total");
    if (!panel) return;

    const scope = getCurrentStudentScope();
    const totals = calculateCurrentStudentTotals(statusItems);
    const isThirdYear = THIRD_YEAR_GROUP_KEYS.includes(scope.groupKey);

    panel.innerHTML = `
        <div class="student-class-total-card">
            <div class="student-class-total-main">
                <span>Total da turma a receber</span>
                <strong>R$ ${formatCurrency(totals.revenue)}</strong>
            </div>
            <div>
                <span>Fichas vendidas nos itens visíveis</span>
                <strong>${totals.sold}</strong>
            </div>
            ${
                isThirdYear
                    ? `<small>
                        Cálculo do total da turma: item próprio da turma + 50% das bebidas compartilhadas
                        (Água Mineral, Água com Gás, Refrigerante e Suco de Caixinha).
                       </small>`
                    : `<small>
                        Cálculo do total da turma: soma dos itens da própria turma.
                       </small>`
            }
        </div>
    `;
}


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
let studentAutoRefreshTimer = null;
let adminSelectedGroupKey = null;

const STORAGE_KEYS = {
    sales: "festaJuninaSales",
    accessProfile: "festaJuninaAccessProfileV4",
    deviceId: "festaJuninaDeviceIdAlunoLockV1"
};

const COOKIE_KEYS = {
    seller: "festaJuninaSellerName",
    access: "festaJuninaAccessOkV4"
};

const CASHIER_PASSWORD = "CAIXA-LSk*[,LwxA1YD-ux8";
const ADMIN_PASSWORD = "ADMIN-IF2026-V7p#Qm4@Rz9!Tn2-Xc";
const ADMIN_DEFAULT_GROUP_KEY = "terceiroMineracao";
adminSelectedGroupKey = ADMIN_DEFAULT_GROUP_KEY;
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


function getDeviceId() {
    let deviceId = localStorage.getItem(STORAGE_KEYS.deviceId);

    if (!deviceId) {
        deviceId = createDeviceId();
        localStorage.setItem(STORAGE_KEYS.deviceId, deviceId);
    }

    return deviceId;
}

function createDeviceId() {
    const randomPart = window.crypto && crypto.randomUUID
        ? crypto.randomUUID().split("-")[0]
        : Math.random().toString(36).substring(2, 10);

    return `IF-${randomPart.toUpperCase()}`;
}

function requestStudentAccessLock(profile) {
    return jsonpRequest({
        action: "lockStudentAccess",
        groupKey: profile.groupKey,
        groupLabel: profile.label,
        deviceId: getDeviceId()
    });
}

function requestStudentAccessRelease(profile) {
    return jsonpRequest({
        action: "releaseStudentAccess",
        groupKey: profile.groupKey,
        deviceId: getDeviceId()
    });
}

function setupAccessGate() {
    const form = document.getElementById("password-form");
    const passwordInput = document.getElementById("site-password");
    const errorBox = document.getElementById("password-error");

    if (!form || !passwordInput) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const password = passwordInput.value.trim();
        const profile = resolveAccessPassword(password);

        if (!profile) {
            if (errorBox) errorBox.textContent = "Senha incorreta. Tente novamente.";
            passwordInput.select();
            return;
        }

        const submitButton = form.querySelector("button[type='submit']");
        if (submitButton) submitButton.disabled = true;
        if (errorBox) errorBox.textContent = "Validando acesso...";

        try {
            if (profile.role === "student") {
                if (!isBackendConfigured()) {
                    throw new Error("BACKEND_URL não configurado. A Visão Aluno precisa do Web App para controlar o acesso por turma.");
                }

                const lockResponse = await requestStudentAccessLock(profile);

                if (!lockResponse.ok) {
                    throw new Error(lockResponse.message || "Esta turma já está aberta em outro dispositivo.");
                }

                profile.deviceId = getDeviceId();
                profile.lockExpiresAt = lockResponse.expiresAt || "";
            }

            saveAccessProfile(profile);

            if (profile.role === "cashier") {
                setCookie(COOKIE_KEYS.access, "ok", ACCESS_COOKIE_MAX_AGE_SECONDS);
            }

            passwordInput.value = "";
            if (errorBox) errorBox.textContent = "";
            setAppAccess(true, profile);
        } catch (error) {
            console.error(error);
            if (errorBox) errorBox.textContent = error.message || "Não foi possível validar o acesso.";
            passwordInput.select();
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

function resolveAccessPassword(password) {
    if (password === CASHIER_PASSWORD) {
        return { role: "cashier", label: "Professor / Caixa" };
    }

    if (password === ADMIN_PASSWORD) {
        return {
            role: "admin",
            label: "Administrador",
            groupKey: ADMIN_DEFAULT_GROUP_KEY,
            allowedItems: items.map(item => item.name)
        };
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

async function logoutAccess() {
    const profile = currentAccessProfile || getSavedAccessProfile();

    try {
        if (profile && profile.role === "student" && profile.groupKey && isBackendConfigured()) {
            await requestStudentAccessRelease(profile);
        }
    } catch (error) {
        console.warn("Não foi possível liberar a trava da turma:", error);
    }

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

    document.getElementById("header-logout-btn")?.classList.toggle("hidden", !isAllowed);

    if (appRoot) {
        appRoot.setAttribute("aria-hidden", String(!isAllowed));
    }

    if (!isAllowed) {
        showAdminTabs(false);
        showCashierView(false);
        showStudentView(false);
        setTimeout(() => document.getElementById("site-password")?.focus(), 50);
        return;
    }

    currentAccessProfile = profile || { role: "cashier", label: "Professor / Caixa" };

    if (currentAccessProfile.role === "admin") {
        adminSelectedGroupKey = currentAccessProfile.groupKey || ADMIN_DEFAULT_GROUP_KEY;
        showAdminTabs(true);
        switchAdminView("cash");
        return;
    }

    showAdminTabs(false);

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

    if (show && title) {
        title.textContent = currentAccessProfile?.role === "admin"
            ? "Admin - Caixa - Festa Junina 2026"
            : "Caixa - Festa Junina 2026";
    }
}

function showStudentView(show) {
    document.getElementById("student-view")?.classList.toggle("hidden", !show);

    const title = document.getElementById("app-title");

    if (show && title) {
        const scope = getCurrentStudentScope();
        title.textContent = currentAccessProfile?.role === "admin"
            ? `Admin - ${scope.groupLabel}`
            : "Visão Aluno - Festa Junina 2026";
    }
}

function showAdminTabs(show) {
    document.getElementById("admin-tabs")?.classList.toggle("hidden", !show);
}

function switchAdminView(view) {
    if (!currentAccessProfile || currentAccessProfile.role !== "admin") return;

    setAdminTabActive(view);

    if (view === "cash") {
        showStudentView(false);
        showCashierView(true);
        document.getElementById("charts-panel")?.classList.add("hidden");
        document.getElementById("seller-name")?.focus();
        return;
    }

    if (view === "charts") {
        showStudentView(false);
        showCashierView(true);
        const chartsPanel = document.getElementById("charts-panel");
        if (chartsPanel) chartsPanel.classList.remove("hidden");
        loadSalesDashboard();
        return;
    }

    if (STUDENT_GROUPS[view]) {
        adminSelectedGroupKey = view;
        studentWithdrawalDraft = {};
        showCashierView(false);
        showStudentView(true);
        loadStudentView();
    }
}

function setAdminTabActive(view) {
    document.querySelectorAll(".admin-tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.adminView === view);
    });
}

function getCurrentStudentScope() {
    const profile = currentAccessProfile || getSavedAccessProfile();

    if (profile?.role === "admin") {
        const group = STUDENT_GROUPS[adminSelectedGroupKey] || STUDENT_GROUPS[ADMIN_DEFAULT_GROUP_KEY];
        return {
            role: "admin",
            groupKey: adminSelectedGroupKey,
            groupLabel: group.label,
            label: `Administrador visualizando ${group.label}`,
            allowedItems: group.allowedItems || []
        };
    }

    return {
        role: profile?.role || "student",
        groupKey: profile?.groupKey || "",
        groupLabel: profile?.label || "Turma",
        label: profile?.label || "Turma",
        allowedItems: profile?.allowedItems || []
    };
}

function getCurrentStudentGroupLabel() {
    return getCurrentStudentScope().groupLabel || "Aluno";
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

        // Se o administrador estiver usando o mesmo dispositivo para acompanhar alunos/gráficos,
        // garante que os painéis sejam recarregados a partir do registro central.
        latestStudentStatusItems = [];
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



function startStudentAutoRefresh() {
    // Atualização automática desativada.
    // A Visão Aluno atualiza somente ao clicar em Atualizar.
}

function stopStudentAutoRefresh() {
    // Atualização automática desativada.
}

function buildStudentStatusFromSummary(summary) {
    const safeSummary = normalizeDashboardSummary(summary);
    const itemMap = new Map();

    safeSummary.items.forEach(item => {
        itemMap.set(normalizeText(item.name), {
            name: item.name,
            sold: Number(item.quantity) || 0,
            revenue: (Number(item.quantity) || 0) * getItemBasePrice(item.name),
            withdrawn: 0,
            pending: Number(item.quantity) || 0
        });
    });

    return items.map(item => {
        const found = itemMap.get(normalizeText(item.name)) || {};
        const sold = Number(found.sold) || 0;
        const withdrawn = Number(found.withdrawn) || 0;

        return {
            name: item.name,
            category: item.category,
            fichaLimit: item.fichaLimit,
            ownerGroup: item.ownerGroup,
            cashPrice: item.cashPrice,
            sold,
            revenue: Number(found.revenue) || 0,
            withdrawn,
            pending: Math.max(sold - withdrawn, 0),
            fallbackFromSummary: true
        };
    });
}


async function requestStudentStatusFromBackend() {
    const response = await jsonpRequest({ action: "studentStatus", cacheBust: String(Date.now()) });

    if (response && response.ok && Array.isArray(response.items) && response.items.length > 0) {
        return response;
    }

    // Fallback: se o Web App ainda estiver respondendo somente ao "summary",
    // a Visão Aluno passa a usar os mesmos totais que alimentam os gráficos.
    const summaryResponse = await requestSalesSummaryFromBackend();

    if (summaryResponse && summaryResponse.ok && summaryResponse.summary) {
        return {
            ok: true,
            message: "Visão aluno carregada a partir do resumo central.",
            items: buildStudentStatusFromSummary(summaryResponse.summary),
            fallbackFromSummary: true
        };
    }

    return response || { ok: false, message: "Não foi possível carregar dados dos alunos." };
}

function requestStudentWithdrawalFromBackend(itemName, quantity) {
    return jsonpRequest({
        action: "registerWithdrawal",
        itemName,
        quantity: String(quantity),
        groupLabel: getCurrentStudentGroupLabel()
    });
}

async function loadStudentView(silent = false) {
    if (studentInProgress) return;

    const statusBox = document.getElementById("student-status");
    if (statusBox && !silent) {
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
            const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            statusBox.textContent = response.fallbackFromSummary
                ? `Visão aluno atualizada às ${now}. Dados carregados a partir dos gráficos.`
                : `Visão aluno atualizada às ${now}.`;
            statusBox.className = response.fallbackFromSummary ? "charts-status neutral" : "charts-status success";
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

    const scope = getCurrentStudentScope();
    const allowedItems = scope.allowedItems || [];
    const allowedSet = new Set(allowedItems.map(normalizeText));
    const statusMap = new Map((statusItems || []).map(item => [normalizeText(item.name), item]));

    if (scopeText) {
        scopeText.textContent = `${scope.label}: os cards mostram o total líquido de cada item; o card central mostra o total da turma a receber.`;
    }

    const visibleItems = items.filter(item => allowedSet.has(normalizeText(item.name)));

    if (visibleItems.length === 0) {
        renderStudentClassTotal([]);
        container.innerHTML = '<div class="no-items">Nenhum item configurado para esta senha.</div>';
        return;
    }

    renderStudentClassTotal(statusItems);

    container.innerHTML = visibleItems.map((item) => {
        const key = normalizeText(item.name);
        const status = statusMap.get(key) || {};
        const sold = Number(status.sold) || 0;
        const revenue = getNetRevenueForStudentItem(item, status);
        const imagePath = item.image ? `images/${item.image}` : "images/default.png";
        const fichaLimit = item.fichaLimit === null || item.fichaLimit === undefined ? null : Number(item.fichaLimit);
        const soldPercent = fichaLimit && fichaLimit > 0 ? Math.min((sold / fichaLimit) * 100, 100) : (sold > 0 ? 100 : 0);

        return `
            <div class="item-card student-card student-view-only-card category-${item.category}">
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
                        <div class="student-progress-label">
                            <span>Fichas vendidas</span>
                            <strong>${sold}${fichaLimit === null ? "" : ` / ${fichaLimit}`}</strong>
                        </div>
                        <div class="student-progress-track">
                            <div class="student-progress-fill sold-fill" style="width: ${soldPercent}%"></div>
                        </div>
                    </div>

                    <div class="student-stats-grid student-stats-grid-view-only">
                        <div>
                            <span>Fichas vendidas</span>
                            <strong>${sold}</strong>
                        </div>
                        <div>
                            <span>Total líquido do item</span>
                            <strong>R$ ${formatCurrency(revenue)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function changeStudentWithdrawal(itemName, change) {
    // Função mantida apenas por compatibilidade.
    // A Visão Aluno agora é somente consulta e não registra retiradas.
}

async function registerStudentWithdrawal(itemName) {
    alert("A Visão Aluno agora é somente consulta. Retiradas não são registradas por esta tela.");
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
