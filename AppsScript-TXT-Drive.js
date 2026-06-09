const FOLDER_NAME = 'dados-vendas';
const FILE_NAME = 'vendas.txt';

function doGet(e) {
  const action = e.parameter.action || '';
  const callback = e.parameter.callback || '';

  let result = {
    ok: true,
    message: 'Web App de lançamentos da Festa Junina ativo.'
  };

  if (action === 'undo') {
    result = undoLastSale(e.parameter.sellerName || '');
  }

  if (action === 'summary') {
    result = getSalesSummary();
  }

  return output(result, callback);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');

    if (payload.action !== 'launch' || !payload.sale) {
      return output({ ok: false, message: 'Ação inválida.' });
    }

    const sale = payload.sale;
    const record = {
      tipo: 'VENDA',
      saleId: sale.saleId,
      datetimeIso: sale.datetimeIso,
      datetimeLocal: sale.datetimeLocal,
      sellerName: sale.sellerName,
      paymentMethod: sale.paymentMethod,
      paymentLabel: sale.paymentLabel,
      total: Number(sale.total) || 0,
      amountPaid: Number(sale.amountPaid) || 0,
      change: Number(sale.change) || 0,
      items: sale.items || []
    };

    appendRecord(record);
    return output({ ok: true, message: 'Venda registrada.' });
  } catch (error) {
    return output({ ok: false, message: String(error) });
  }
}

function undoLastSale(sellerName) {
  sellerName = String(sellerName || '').trim();

  if (!sellerName) {
    return { ok: false, message: 'Professor não informado.' };
  }

  const records = readRecords();
  const canceledSaleIds = getCanceledSaleIds(records);
  const normalizedSellerName = normalizeText(sellerName);

  for (let i = records.length - 1; i >= 0; i--) {
    const record = records[i];

    if (
      record.tipo === 'VENDA' &&
      normalizeText(record.sellerName) === normalizedSellerName &&
      !canceledSaleIds.has(record.saleId)
    ) {
      const cancellation = {
        tipo: 'CANCELAMENTO',
        cancelledSaleId: record.saleId,
        datetimeIso: new Date().toISOString(),
        datetimeLocal: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'),
        sellerName: sellerName,
        motivo: 'Voltar última venda para edição'
      };

      appendRecord(cancellation);

      return {
        ok: true,
        message: 'Última venda recuperada para edição.',
        sale: record
      };
    }
  }

  return { ok: false, message: 'Nenhuma venda ativa encontrada para esse professor.' };
}

function getSalesSummary() {
  const records = readRecords();
  const activeSales = getActiveSales(records);
  const summary = buildSalesSummary(activeSales);

  return {
    ok: true,
    message: 'Resumo gerado com sucesso.',
    summary: summary
  };
}

function buildSalesSummary(activeSales) {
  const summary = createEmptySummary();
  const itemMap = {};
  const sellerMap = {};

  activeSales.forEach(function(sale) {
    const paymentMethod = normalizePaymentMethod(sale.paymentMethod);
    const total = Number(sale.total) || 0;
    const sellerName = String(sale.sellerName || 'Professor não informado').trim() || 'Professor não informado';
    const sellerKey = normalizeText(sellerName);

    summary.totalSales += 1;
    summary.totalRevenue += total;
    summary.payments[paymentMethod].sales += 1;
    summary.payments[paymentMethod].revenue += total;

    if (!sellerMap[sellerKey]) {
      sellerMap[sellerKey] = {
        name: sellerName,
        sales: 0,
        revenue: 0
      };
    }

    sellerMap[sellerKey].sales += 1;
    sellerMap[sellerKey].revenue += total;

    (sale.items || []).forEach(function(item) {
      const itemName = String(item.name || 'Item sem nome').trim() || 'Item sem nome';
      const itemKey = normalizeText(itemName);
      const quantity = Number(item.quantity) || 0;
      const itemTotal = Number(item.total) || quantity * (Number(item.unitPrice) || 0);

      summary.totalItems += quantity;

      if (!itemMap[itemKey]) {
        itemMap[itemKey] = {
          name: itemName,
          quantity: 0,
          revenue: 0
        };
      }

      itemMap[itemKey].quantity += quantity;
      itemMap[itemKey].revenue += itemTotal;
    });
  });

  summary.items = Object.keys(itemMap).map(function(key) {
    return itemMap[key];
  });

  summary.sellers = Object.keys(sellerMap).map(function(key) {
    return sellerMap[key];
  });

  return summary;
}

function createEmptySummary() {
  return {
    totalSales: 0,
    totalRevenue: 0,
    totalItems: 0,
    payments: {
      cash: { label: 'Dinheiro', sales: 0, revenue: 0 },
      pix: { label: 'PIX', sales: 0, revenue: 0 },
      card: { label: 'Cartão', sales: 0, revenue: 0 }
    },
    items: [],
    sellers: []
  };
}

function getActiveSales(records) {
  const canceledSaleIds = getCanceledSaleIds(records);

  return records.filter(function(record) {
    return record.tipo === 'VENDA' && record.saleId && !canceledSaleIds.has(record.saleId);
  });
}

function getCanceledSaleIds(records) {
  return new Set(
    records
      .filter(function(record) {
        return record.tipo === 'CANCELAMENTO' && record.cancelledSaleId;
      })
      .map(function(record) {
        return record.cancelledSaleId;
      })
  );
}

function appendRecord(record) {
  const file = getOrCreateFile();
  const currentContent = file.getBlob().getDataAsString('UTF-8');
  const line = JSON.stringify(record);
  const newContent = currentContent ? currentContent.replace(/\s*$/, '\n') + line + '\n' : line + '\n';
  file.setContent(newContent);
}

function readRecords() {
  const file = getOrCreateFile();
  const content = file.getBlob().getDataAsString('UTF-8');

  if (!content.trim()) {
    return [];
  }

  return content
    .split(/\r?\n/)
    .map(function(line) {
      const cleanedLine = line.trim();
      if (!cleanedLine) return null;

      try {
        return JSON.parse(cleanedLine);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);
}

function getOrCreateFile() {
  const folder = getOrCreateFolder(FOLDER_NAME);
  const files = folder.getFilesByName(FILE_NAME);

  if (files.hasNext()) {
    return files.next();
  }

  return folder.createFile(FILE_NAME, '', MimeType.PLAIN_TEXT);
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.createFolder(folderName);
}

function output(data, callback) {
  const json = JSON.stringify(data);

  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizePaymentMethod(method) {
  if (method === 'pix') return 'pix';
  if (method === 'card') return 'card';
  return 'cash';
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
