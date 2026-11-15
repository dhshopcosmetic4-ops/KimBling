
/************************************************************
 * KIM BLING AI SERVER - VERSION 3.0
 * Groq + Google Sheets + POS_Data + Telegram
 *
 * Script Properties:
 * GROQ_API_KEY
 * TELEGRAM_BOT_TOKEN
 * TELEGRAM_CHAT_ID
 * AI_DATABASE_ID
 *
 * Google Sheet:
 * KIM BLING AI DATA
 ************************************************************/

const KB_CONFIG = {
  MODEL: "openai/gpt-oss-20b",
  GROQ_URL: "https://api.groq.com/openai/v1/chat/completions",
  DB_ID: "16fLq_kqhacLzdMR-ccSaOgeqBfMqvUYQDdpiIx7H4gc",
  SESSION_HOURS: 24,
  UPSIZE_FEE: 10000,
  MAX_TOKENS: 500,
  SHEETS: {
    SESSIONS: "AI_SESSIONS",
    MESSAGES: "AI_MESSAGES",
    ORDERS: "AI_ORDERS",
    DRAFTS: "AI_ORDER_DRAFTS",
    STAFF: "NhanVienTelegram",
    POS: "POS_Data"
  }
};

/* ==================== TIỆN ÍCH ==================== */

function kbJson_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function kbDb_() {
  const id = PropertiesService.getScriptProperties()
    .getProperty("AI_DATABASE_ID") || KB_CONFIG.DB_ID;
  return SpreadsheetApp.openById(id);
}

function kbSheet_(name, headers) {
  const ss = kbDb_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  if (headers && sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sh;
}

function kbEnsureSheets_() {
  kbSheet_(KB_CONFIG.SHEETS.SESSIONS, [
    "SessionID", "CreatedAt", "UpdatedAt", "Status",
    "CustomerName", "Phone", "Address", "Payment",
    "CartJSON", "LastMessage", "ExpiresAt"
  ]);

  kbSheet_(KB_CONFIG.SHEETS.MESSAGES, [
    "SessionID", "Timestamp", "Role", "Content"
  ]);

  kbSheet_(KB_CONFIG.SHEETS.ORDERS, [
    "Timestamp", "OrderID", "SessionID", "CustomerName",
    "Phone", "Fulfillment", "Address", "ItemsJSON",
    "Subtotal", "Total", "Payment", "Status"
  ]);

  kbSheet_(KB_CONFIG.SHEETS.DRAFTS, [
    "CreatedAt", "DraftID", "SessionID", "DraftJSON",
    "Status", "ExpiresAt", "OrderID"
  ]);

  kbSheet_(KB_CONFIG.SHEETS.STAFF, [
    "Name", "Phone", "ChatID", "Active", "CreatedAt"
  ]);
}

function kbNow_() {
  return new Date();
}

function kbId_(prefix) {
  return prefix + Utilities.getUuid().replace(/-/g, "").substring(0, 16);
}

function kbText_(v) {
  return String(v == null ? "" : v).trim();
}

function kbMoney_(v) {
  const n = Number(String(v || 0).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function kbNorm_(s) {
  return kbText_(s).toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function kbParseJson_(value, fallback) {
  try {
    if (typeof value === "object" && value !== null) return value;
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

/* ==================== KHỞI TẠO DATABASE ==================== */

function setupKimBlingAIDatabase() {
  kbEnsureSheets_();
  Logger.log("DATABASE SẴN SÀNG");
  Logger.log(kbDb_().getUrl());
  return true;
}

function testKimBlingAIDatabase() {
  kbEnsureSheets_();
  Logger.log("Kết nối Sheet: " + kbDb_().getName());
  Logger.log("Các tab đã kiểm tra xong.");
}

/* ==================== ĐỌC MENU POS_DATA ==================== */

/*
 * POS_Data:
 * Cột A: menu / drinkToppings / snackToppings
 * Cột B: JSON
 * Cột C: thời gian cập nhật
 */

function getAIProductCatalog_() {
  const sh = kbDb_().getSheetByName(KB_CONFIG.SHEETS.POS);
  if (!sh) throw new Error("Không tìm thấy tab POS_Data.");

  const values = sh.getDataRange().getValues();
  const result = {
    menu: [],
    drinkToppings: [],
    snackToppings: []
  };

  values.forEach(function(row) {
    const key = kbText_(row[0]);
    if (!key || !Object.prototype.hasOwnProperty.call(result, key)) return;

    const parsed = kbParseJson_(row[1], []);
    result[key] = Array.isArray(parsed) ? parsed :
      (parsed && Array.isArray(parsed.data) ? parsed.data : []);
  });

  return result;
}

function kbItemName_(item) {
  return kbText_(item.name || item.title || item.ten || item.productName);
}

function kbItemPrice_(item) {
  return kbMoney_(item.price != null ? item.price :
    (item.gia != null ? item.gia : item.amount));
}

function kbFindMenuItems_(message, catalog) {
  const normalized = kbNorm_(message);
  const found = [];

  (catalog.menu || []).forEach(function(item) {
    const name = kbItemName_(item);
    const n = kbNorm_(name);
    if (!n || n.length < 2) return;

    if (normalized.includes(n)) {
      const qtyMatch = normalized.match(
        new RegExp("(\\d+)\\s*(ly|coc|phan|mon)?\\s*" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      );
      found.push({
        id: item.id || "",
        name: name,
        price: kbItemPrice_(item),
        quantity: qtyMatch ? Math.max(1, Number(qtyMatch[1])) : 1,
        toppings: [],
        note: ""
      });
    }
  });

  return found;
}

function kbCatalogText_(catalog) {
  return (catalog.menu || []).map(function(item) {
    return "- " + kbItemName_(item) + ": " +
      kbItemPrice_(item).toLocaleString("vi-VN") + "đ";
  }).join("\n");
}

function testAIProductCatalog() {
  const c = getAIProductCatalog_();
  Logger.log("Món: " + c.menu.length);
  Logger.log("Topping nước: " + c.drinkToppings.length);
  Logger.log("Topping ăn vặt: " + c.snackToppings.length);
  Logger.log(kbCatalogText_(c));
}

/* ==================== PHIÊN HỘI THOẠI ==================== */

function kbFindSessionRow_(sessionId) {
  const sh = kbSheet_(KB_CONFIG.SHEETS.SESSIONS);
  const data = sh.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(sessionId)) return i + 1;
  }
  return 0;
}

function createAISession() {
  kbEnsureSheets_();

  const sh = kbSheet_(KB_CONFIG.SHEETS.SESSIONS);
  const id = kbId_("KBSESSION_");
  const now = kbNow_();

  const state = {
    phase: "idle",
    items: [],
    customerName: "",
    phone: "",
    fulfillment: "",
    address: "",
    upsize: false,
    toppings: [],
    note: "",
    payment: "",
    draftId: ""
  };

  sh.appendRow([
    id, now, now, "active", "", "", "", "",
    JSON.stringify(state), "", new Date(now.getTime() + KB_CONFIG.SESSION_HOURS * 3600000)
  ]);

  return { success: true, sessionId: id };
}

function kbGetSession_(sessionId) {
  const sh = kbSheet_(KB_CONFIG.SHEETS.SESSIONS);
  const row = kbFindSessionRow_(sessionId);
  if (!row) return null;

  const v = sh.getRange(row, 1, 1, 11).getValues()[0];
  return {
    row: row,
    id: v[0],
    state: kbParseJson_(v[8], {}),
    status: v[3]
  };
}

function kbSaveSession_(session, lastMessage) {
  const sh = kbSheet_(KB_CONFIG.SHEETS.SESSIONS);
  const now = kbNow_();
  const state = session.state || {};

  sh.getRange(session.row, 3).setValue(now);
  sh.getRange(session.row, 5, 1, 4).setValues([[
    state.customerName || "",
    state.phone || "",
    state.address || "",
    state.payment || ""
  ]]);
  sh.getRange(session.row, 9).setValue(JSON.stringify(state));
  sh.getRange(session.row, 10).setValue(lastMessage || "");
  sh.getRange(session.row, 11).setValue(
    new Date(now.getTime() + KB_CONFIG.SESSION_HOURS * 3600000)
  );
}

function saveAIMessage(sessionId, role, content) {
  kbSheet_(KB_CONFIG.SHEETS.MESSAGES).appendRow([
    sessionId, kbNow_(), role, content
  ]);
}

function getAIConversation(sessionId, limit) {
  const sh = kbSheet_(KB_CONFIG.SHEETS.MESSAGES);
  const data = sh.getDataRange().getValues();
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(sessionId)) {
      rows.push({
        role: data[i][2],
        content: data[i][3]
      });
    }
  }
  return rows.slice(-(limit || 30));
}

function getAISession(sessionId) {
  const s = kbGetSession_(sessionId);
  if (!s) return null;
  return { success: true, sessionId: s.id, state: s.state };
}

function deleteAISession(sessionId) {
  const sh = kbSheet_(KB_CONFIG.SHEETS.SESSIONS);
  const row = kbFindSessionRow_(sessionId);
  if (row) sh.deleteRow(row);
  return true;
}

/* ==================== GROQ ==================== */

function getGroqApiKey_() {
  const key = PropertiesService.getScriptProperties()
    .getProperty("GROQ_API_KEY");
  if (!key) throw new Error("Thiếu GROQ_API_KEY trong Script Properties.");
  return key;
}

function callGroq_(messages) {
  const response = UrlFetchApp.fetch(KB_CONFIG.GROQ_URL, {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + getGroqApiKey_()
    },
    payload: JSON.stringify({
      model: KB_CONFIG.MODEL,
      messages: messages,
      max_completion_tokens: KB_CONFIG.MAX_TOKENS,
      temperature: 0.35
    }),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const body = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error("Groq HTTP " + code + ": " + body.substring(0, 500));
  }

  const data = JSON.parse(body);
  return data.choices && data.choices[0] &&
    data.choices[0].message
    ? kbText_(data.choices[0].message.content)
    : "";
}

function testGroqConnection() {
  const reply = callGroq_([
    { role: "user", content: "Hãy trả lời đúng một câu: Kết nối Groq thành công." }
  ]);
  Logger.log(reply);
  return reply;
}

/* ==================== TÍNH TIỀN VÀ BẢN NHÁP ==================== */

function kbCalculateOrder_(state) {
  let subtotal = 0;

  const items = (state.items || []).map(function(item) {
    const qty = Math.max(1, Number(item.quantity || 1));
    const toppingTotal = (item.toppings || []).reduce(function(sum, t) {
      return sum + kbMoney_(t.price);
    }, 0);

    const unit = kbMoney_(item.price) + toppingTotal;
    const lineTotal = unit * qty;
    subtotal += lineTotal;

    return Object.assign({}, item, {
      quantity: qty,
      toppingTotal: toppingTotal,
      lineTotal: lineTotal
    });
  });

  const upsizeFee = state.upsize ? KB_CONFIG.UPSIZE_FEE : 0;
  const total = subtotal + upsizeFee;

  return {
    customerName: state.customerName || "",
    phone: state.phone || "",
    fulfillment: state.fulfillment || "",
    address: state.address || (state.fulfillment === "pickup" ? "Tại quán" : ""),
    payment: state.payment || "",
    items: items,
    upsize: !!state.upsize,
    upsizeFee: upsizeFee,
    note: state.note || "",
    subtotal: subtotal,
    total: total
  };
}

function kbCreateDraft_(session) {
  const sh = kbSheet_(KB_CONFIG.SHEETS.DRAFTS);
  const order = kbCalculateOrder_(session.state);
  const draftId = kbId_("KBDRAFT_");
  const expires = new Date(Date.now() + 30 * 60000);

  sh.appendRow([
    kbNow_(), draftId, session.id, JSON.stringify(order),
    "PENDING", expires, ""
  ]);

  session.state.draftId = draftId;
  kbSaveSession_(session, "Bản nháp đơn hàng đã tạo");

  return {
    draftId: draftId,
    order: order
  };
}

function kbFindDraftRow_(draftId, sessionId) {
  const sh = kbSheet_(KB_CONFIG.SHEETS.DRAFTS);
  const data = sh.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(draftId) &&
        String(data[i][2]) === String(sessionId)) {
      return i + 1;
    }
  }
  return 0;
}

function cancelAIOrderDraft_(sessionId, draftId) {
  const row = kbFindDraftRow_(draftId, sessionId);
  if (row) {
    const sh = kbSheet_(KB_CONFIG.SHEETS.DRAFTS);
    const status = sh.getRange(row, 5).getValue();
    if (status === "PENDING") sh.getRange(row, 5).setValue("CANCELLED");
  }

  const session = kbGetSession_(sessionId);
  if (session) {
    session.state.draftId = "";
    session.state.phase = "edit";
    kbSaveSession_(session, "Khách muốn chỉnh sửa đơn");
  }

  return { success: true };
}

/* ==================== TELEGRAM ==================== */

function kbTelegramSend_(chatId, message) {
  const token = PropertiesService.getScriptProperties()
    .getProperty("TELEGRAM_BOT_TOKEN");
  if (!token || !chatId) {
    return { success: false, error: "Thiếu Telegram token hoặc Chat ID." };
  }

  const url = "https://api.telegram.org/bot" + token + "/sendMessage";
  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: String(chatId),
      text: message
    }),
    muteHttpExceptions: true
  });

  const data = kbParseJson_(res.getContentText(), {});
  return {
    success: res.getResponseCode() >= 200 &&
      res.getResponseCode() < 300 && data.ok === true,
    error: data.description || ""
  };
}

function getActiveTelegramStaff_() {
  const sh = kbSheet_(KB_CONFIG.SHEETS.STAFF);
  const data = sh.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const active = data[i][3];
    const enabled = active === true ||
      String(active).toLowerCase() === "true" ||
      String(active) === "1" ||
      String(active).toLowerCase() === "yes";

    if (enabled && data[i][2]) {
      result.push({
        name: data[i][0],
        chatId: data[i][2]
      });
    }
  }
  return result;
}

function saveStaffTelegram(data) {
  const sh = kbSheet_(KB_CONFIG.SHEETS.STAFF);
  const name = kbText_(data.name);
  const phone = kbText_(data.phone);
  const chatId = kbText_(data.chatId);

  if (!name || !chatId) throw new Error("Thiếu tên hoặc Chat ID.");

  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]) === chatId) {
      sh.getRange(i + 1, 1, 1, 5).setValues([[
        name, phone, chatId, data.active !== false, kbNow_()
      ]]);
      return { success: true, updated: true };
    }
  }

  sh.appendRow([name, phone, chatId, data.active !== false, kbNow_()]);
  return { success: true, created: true };
}

function sendAIOrderTelegram_(order, orderId) {
  const lines = [
    "🔔 ĐƠN HÀNG MỚI - KIM BLING",
    "Mã đơn: " + orderId,
    "Khách: " + order.customerName,
    "Điện thoại: " + order.phone,
    "Nhận hàng: " + (order.fulfillment === "pickup" ? "Tại quán" : "Giao hàng"),
    "Địa chỉ: " + order.address,
    "Thanh toán: " + order.payment,
    "",
    "CHI TIẾT ĐƠN:"
  ];

  (order.items || []).forEach(function(item) {
    lines.push(
      item.name + " x" + item.quantity + " - " +
      kbMoney_(item.lineTotal).toLocaleString("vi-VN") + "đ"
    );
    if (item.toppings && item.toppings.length) {
      lines.push("Topping: " + item.toppings.map(t => t.name).join(", "));
    }
  });

  if (order.upsize) lines.push("Upsize: +10.000đ");
  if (order.note) lines.push("Ghi chú: " + order.note);
  lines.push("TỔNG: " + kbMoney_(order.total).toLocaleString("vi-VN") + "đ");

  const message = lines.join("\n");
  const ownerChatId = PropertiesService.getScriptProperties()
    .getProperty("TELEGRAM_CHAT_ID");

  const results = [];
  if (ownerChatId) results.push(kbTelegramSend_(ownerChatId, message));

  getActiveTelegramStaff_().forEach(function(staff) {
    results.push(kbTelegramSend_(staff.chatId, message));
  });

  return {
    success: results.length > 0 && results.every(r => r.success),
    results: results
  };
}

function testTelegramBot() {
  const chatId = PropertiesService.getScriptProperties()
    .getProperty("TELEGRAM_CHAT_ID");
  const result = kbTelegramSend_(
    chatId,
    "✅ KIM BLING AI: Kiểm tra kết nối Telegram thành công."
  );
  Logger.log(JSON.stringify(result));
  return result;
}

/* ==================== XÁC NHẬN ĐƠN ==================== */

function confirmAIOrder_(sessionId, draftId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const draftRow = kbFindDraftRow_(draftId, sessionId);
    if (!draftRow) throw new Error("Không tìm thấy đơn chờ xác nhận.");

    const draftSheet = kbSheet_(KB_CONFIG.SHEETS.DRAFTS);
    const draftData = draftSheet.getRange(draftRow, 1, 1, 7).getValues()[0];

    if (draftData[4] === "CONFIRMED" && draftData[6]) {
      const orderId = draftData[6];
      const orderSheet = kbSheet_(KB_CONFIG.SHEETS.ORDERS);
      const rows = orderSheet.getDataRange().getValues();

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][1]) === String(orderId)) {
          return {
            success: true,
            saved: true,
            orderId: orderId,
            total: rows[i][9],
            duplicate: true
          };
        }
      }
    }

    if (draftData[4] !== "PENDING") {
      throw new Error("Đơn này không còn ở trạng thái chờ xác nhận.");
    }

    if (new Date(draftData[5]).getTime() < Date.now()) {
      throw new Error("Đơn chờ đã hết hạn. Vui lòng tạo lại đơn.");
    }

    const order = kbParseJson_(draftData[3], null);
    if (!order || !order.items || !order.items.length) {
      throw new Error("Đơn hàng không có món.");
    }

    const orderId = "KB" + Utilities.formatDate(
      kbNow_(), Session.getScriptTimeZone(), "yyyyMMddHHmmss"
    ) + Math.floor(Math.random() * 90 + 10);

    kbSheet_(KB_CONFIG.SHEETS.ORDERS).appendRow([
      kbNow_(), orderId, sessionId, order.customerName,
      order.phone, order.fulfillment, order.address,
      JSON.stringify(order.items), order.subtotal,
      order.total, order.payment, "Mới"
    ]);

    draftSheet.getRange(draftRow, 5).setValue("CONFIRMED");
    draftSheet.getRange(draftRow, 7).setValue(orderId);

    const telegram = sendAIOrderTelegram_(order, orderId);

    return {
      success: true,
      saved: true,
      orderId: orderId,
      total: order.total,
      telegram: telegram
    };

  } finally {
    lock.releaseLock();
  }
}

/* ==================== QUY TRÌNH HỎI ĐÁP TỪNG BƯỚC ==================== */

function kbQuestionForPhase_(state, catalog) {
  switch (state.phase) {
    case "name": return "Dạ em xin tên anh/chị để lên đơn ạ?";
    case "phone": return "Dạ cho em xin số điện thoại liên hệ ạ?";
    case "fulfillment": return "Anh/chị muốn nhận tại quán hay giao hàng ạ?";
    case "address": return "Dạ anh/chị cho em xin địa chỉ giao hàng nhé?";
    case "upsize": return "Anh/chị có muốn nâng size ly lớn hơn không ạ? Phụ thu 10.000đ.";
    case "toppings":
      return "Anh/chị có muốn thêm topping không ạ? Nếu có, anh/chị cho em biết tên topping nhé. Nếu không, mình chọn Không ạ.";
    case "note": return "Anh/chị có ghi chú gì thêm cho món hoặc đơn hàng không ạ? Nếu không, mình chọn Không ạ.";
    case "payment": return "Anh/chị muốn thanh toán bằng tiền mặt hay chuyển khoản ạ?";
    default: return "";
  }
}

function kbIsNo_(text) {
  return /^(khong|khong can|khong a|bo qua|thoi|khong them|khong co)$/i.test(kbNorm_(text));
}

function kbIsYes_(text) {
  return /^(co|co a|dong y|ok|oke|duoc|muon)$/i.test(kbNorm_(text));
}

function kbParsePhone_(text) {
  const m = String(text).match(/(?:\+?84|0)(?:[\s.-]?\d){8,10}/);
  return m ? m[0].replace(/[\s.-]/g, "") : "";
}

function kbParseQuantity_(text) {
  const m = String(text).match(/(?:x|sl|so luong)?\s*(\d+)\s*(?:ly|coc|phan|mon)?/i);
  return m ? Math.max(1, Math.min(30, Number(m[1]))) : 1;
}

function kbFindToppings_(text, catalog) {
  const n = kbNorm_(text);
  const all = (catalog.drinkToppings || []).concat(catalog.snackToppings || []);
  const found = [];

  all.forEach(function(t) {
    const name = kbItemName_(t) || kbText_(t.name);
    if (name && n.includes(kbNorm_(name))) {
      if (!found.some(x => kbNorm_(x.name) === kbNorm_(name))) {
        found.push({ name: name, price: kbItemPrice_(t) });
      }
    }
  });
  return found;
}

function kbBeginOrder_(state, message, catalog) {
  const items = kbFindMenuItems_(message, catalog);
  if (!items.length) return false;

  state.items = items;
  state.phase = "name";
  return true;
}

function kbHandleOrderMessage_(session, message, catalog) {
  const state = session.state;
  const n = kbNorm_(message);

  if (state.phase === "idle" || state.phase === "edit") {
    if (kbBeginOrder_(state, message, catalog)) {
      return {
        reply: "Dạ em đã ghi nhận " +
          state.items.map(i => i.name + " x" + i.quantity).join(", ") +
          ". " + kbQuestionForPhase_(state, catalog)
      };
    }
    return null;
  }

  if (state.phase === "name") {
    state.customerName = message.trim();
    state.phase = "phone";
  } else if (state.phase === "phone") {
    const phone = kbParsePhone_(message);
    if (!phone) return { reply: "Dạ số điện thoại chưa đúng định dạng. Anh/chị gửi lại giúp em nhé?" };
    state.phone = phone;
    state.phase = "fulfillment";
  } else if (state.phase === "fulfillment") {
    if (n.includes("tai quan") || n.includes("den lay") || n.includes("mang ve") || n.includes("pickup")) {
      state.fulfillment = "pickup";
      state.address = "Tại quán";
      state.phase = "upsize";
    } else if (n.includes("giao") || n.includes("ship") || n.includes("dia chi")) {
      state.fulfillment = "delivery";
      state.phase = "address";
    } else {
      return { reply: "Dạ anh/chị chọn nhận tại quán hay giao hàng ạ?" };
    }
  } else if (state.phase === "address") {
    if (message.trim().length < 5) {
      return { reply: "Dạ anh/chị gửi địa chỉ cụ thể hơn giúp em nhé?" };
    }
    state.address = message.trim();
    state.phase = "upsize";
  } else if (state.phase === "upsize") {
    if (kbIsYes_(message)) state.upsize = true;
    else if (!kbIsNo_(message)) {
      return { reply: "Dạ anh/chị có muốn upsize thêm 10.000đ không ạ? Mình chọn Có hoặc Không nhé." };
    }
    state.phase = "toppings";
  } else if (state.phase === "toppings") {
    if (!kbIsNo_(message)) {
      const toppings = kbFindToppings_(message, catalog);
      if (!toppings.length) {
        return {
          reply: "Dạ em chưa tìm thấy topping đó trong danh sách hiện tại. Anh/chị thử ghi đúng tên topping hoặc chọn Không nhé."
        };
      }
      state.toppings = toppings;
      if (state.items.length) {
        state.items[0].toppings = toppings;
      }
    }
    state.phase = "note";
  } else if (state.phase === "note") {
    state.note = kbIsNo_(message) ? "" : message.trim();
    state.phase = "payment";
  } else if (state.phase === "payment") {
    if (n.includes("tien mat") || n.includes("cash")) {
      state.payment = "Tiền mặt";
    } else if (n.includes("chuyen khoan") || n.includes("bank") || n.includes("qr")) {
      state.payment = "Chuyển khoản";
    } else {
      return { reply: "Dạ anh/chị chọn thanh toán tiền mặt hay chuyển khoản ạ?" };
    }

    state.phase = "confirm";
    const draft = kbCreateDraft_(session);
    return {
      reply: "Dạ em đã lên đơn. Anh/chị kiểm tra thông tin và bấm Xác nhận đặt hàng nếu chính xác nhé ạ.",
      orderDraft: draft
    };
  }

  kbSaveSession_(session, message);
  return { reply: kbQuestionForPhase_(state, catalog) };
}

/* ==================== TƯ VẤN GROQ ==================== */

function kbGeneralAIReply_(sessionId, message, catalog) {
  const history = getAIConversation(sessionId, 6);
  const system = [
    "Bạn là nhân viên tư vấn của Kim Bling Coffee & Tea.",
    "Trả lời bằng tiếng Việt tự nhiên, lịch sự, ngắn gọn.",
    "Không tự bịa món, giá, topping hoặc chương trình khuyến mãi.",
    "Chỉ sử dụng danh mục bên dưới khi tư vấn.",
    "Nếu khách muốn đặt món, hướng dẫn họ nêu tên món và số lượng.",
    "Không tự tuyên bố đã tạo hoặc lưu đơn hàng.",
    "Mỗi câu trả lời nên ngắn, tối đa 2-3 câu.",
    "",
    "DANH MỤC ĐANG CÓ:",
    kbCatalogText_(catalog)
  ].join("\n");

  const messages = [{ role: "system", content: system }];

  history.slice(-4).forEach(function(m) {
    if (m.role === "user" || m.role === "assistant") {
      messages.push({ role: m.role, content: String(m.content).substring(0, 1000) });
    }
  });

  messages.push({ role: "user", content: message });
  return callGroq_(messages);
}

/* ==================== API CHAT ==================== */

function kbChat_(data) {
  const sessionId = kbText_(data.sessionId);
  const message = kbText_(data.message);
  if (!sessionId || !message) throw new Error("Thiếu sessionId hoặc message.");

  const session = kbGetSession_(sessionId);
  if (!session) throw new Error("Phiên hội thoại không tồn tại. Vui lòng tải lại trang.");

  const catalog = getAIProductCatalog_();

  saveAIMessage(sessionId, "user", message);

  let handled = kbHandleOrderMessage_(session, message, catalog);
  let reply = "";
  let orderDraft = null;

  if (handled) {
    reply = handled.reply || "";
    orderDraft = handled.orderDraft || null;
    kbSaveSession_(session, message);
  } else {
    reply = kbGeneralAIReply_(sessionId, message, catalog);
  }

  saveAIMessage(sessionId, "assistant", reply);

  return {
    success: true,
    reply: reply,
    orderDraft: orderDraft,
    phase: session.state.phase
  };
}

/* ==================== LỊCH SỬ ==================== */

function kbGetHistory_(sessionId) {
  const session = kbGetSession_(sessionId);
  if (!session) throw new Error("Không tìm thấy phiên hội thoại.");

  return {
    success: true,
    sessionId: sessionId,
    messages: getAIConversation(sessionId, 50),
    state: session.state
  };
}

/* ==================== doGet / doPost ==================== */

function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : "";

    if (action === "ping") {
      return kbJson_({ success: true, message: "KIM BLING AI SERVER ONLINE" });
    }

    return kbJson_({
      success: true,
      server: "KIM BLING AI SERVER",
      version: "3.0"
    });
  } catch (err) {
    return kbJson_({ success: false, error: err.message });
  }
}

function doPost(e) {
  try {
    kbEnsureSheets_();

    const raw = e && e.postData ? e.postData.contents : "{}";
    const data = JSON.parse(raw || "{}");
    const action = kbText_(data.action);

    let result;

    switch (action) {
      case "create_session":
        result = createAISession();
        break;

      case "get_history":
        result = kbGetHistory_(data.sessionId);
        break;

      case "chat":
        result = kbChat_(data);
        break;

      case "confirm_order":
        result = confirmAIOrder_(data.sessionId, data.draftId);
        break;

      case "cancel_order_draft":
        result = cancelAIOrderDraft_(data.sessionId, data.draftId);
        break;

      case "saveStaffTelegram":
      case "save_staff_telegram":
        result = saveStaffTelegram(data);
        break;

      default:
        throw new Error("Action không hợp lệ: " + action);
    }

    return kbJson_(result);

  } catch (err) {
    console.error(err);
    return kbJson_({
      success: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}

/* ==================== KIỂM TRA HỆ THỐNG ==================== */

function checkKimBlingConfig() {
  const p = PropertiesService.getScriptProperties();
  const result = {
    GROQ_API_KEY: !!p.getProperty("GROQ_API_KEY"),
    TELEGRAM_BOT_TOKEN: !!p.getProperty("TELEGRAM_BOT_TOKEN"),
    TELEGRAM_CHAT_ID: !!p.getProperty("TELEGRAM_CHAT_ID"),
    AI_DATABASE_ID: !!(p.getProperty("AI_DATABASE_ID") || KB_CONFIG.DB_ID)
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function testAIChatAPI() {
  const session = createAISession();
  const result = kbChat_({
    sessionId: session.sessionId,
    message: "Tôi muốn đặt một món"
  });
  Logger.log(JSON.stringify(result, null, 2));
}

function testExternalPost() {
  const url = ScriptApp.getService().getUrl();
  Logger.log("Web App URL: " + url);
}
