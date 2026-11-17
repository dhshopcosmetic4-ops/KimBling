/************************************************************
 * KIM BLING AI SERVER - VERSION 5.0
 * Groq (openai/gpt-oss-20b tốc độ cao) + Gemini Live + Google Sheets + POS_Data + Telegram
 *
 * SCRIPT PROPERTIES:
 * GROQ_API_KEY
 * GEMINI_API_KEY
 * GEMINI_API_KEY_2 (tùy chọn dự phòng)
 * GEMINI_API_KEY_3 (tùy chọn dự phòng)
 * TELEGRAM_BOT_TOKEN
 * TELEGRAM_CHAT_ID
 * AI_DATABASE_ID
 *
 * GOOGLE SHEET:
 * KIM BLING AI DATA
 ************************************************************/

const KB_CONFIG = {
  VERSION: "5.0",

  MODEL: "openai/gpt-oss-20b",
  GROQ_FALLBACK_MODELS: ["openai/gpt-oss-20b", "openai/gpt-oss-120b"],
  GROQ_URL: "https://api.groq.com/openai/v1/chat/completions",

  TTS_MODEL: "gemini-3.8-flash-lite-tts",
  LIVE_MODEL: "gemini-3.8-live",
  GEMINI_TOKEN_URL:
    "https://generativelanguage.googleapis.com/v1alpha/auth_tokens",

  DB_ID: "16fLq_kqhacLzdMR-ccSaOgeqBfMqvUYQDdpiIx7H4gc",

  SESSION_HOURS: 24,
  UPSIZE_FEE: 10000,
  MAX_TOKENS: 900,

  SHEETS: {
    SESSIONS: "AI_SESSIONS",
    MESSAGES: "AI_MESSAGES",
    ORDERS: "AI_ORDERS",
    DRAFTS: "AI_ORDER_DRAFTS",
    STAFF: "NhanVienTelegram",
    POS: "POS_Data"
  }
};

/* =========================================================
   1. TIỆN ÍCH
========================================================= */

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
    sh.getRange(1, 1, 1, headers.length)
      .setValues([headers]);
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
  return prefix +
    Utilities.getUuid().replace(/-/g, "").substring(0, 16);
}

function kbText_(v) {
  return String(v == null ? "" : v).trim();
}

function kbMoney_(v) {
  const n = Number(
    String(v || 0).replace(/[^\d.-]/g, "")
  );

  return Number.isFinite(n) ? n : 0;
}

function kbNorm_(s) {
  return kbText_(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function kbParseJson_(value, fallback) {
  try {
    if (typeof value === "object" && value !== null) {
      return value;
    }

    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

function kbGetProperty_(name) {
  return PropertiesService
    .getScriptProperties()
    .getProperty(name);
}

/* =========================================================
   2. KHỞI TẠO DATABASE
========================================================= */

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

/* =========================================================
   3. ĐỌC MENU POS_DATA
========================================================= */

function getAIProductCatalog_() {
  const sh = kbDb_().getSheetByName(KB_CONFIG.SHEETS.POS);

  if (!sh) {
    throw new Error("Không tìm thấy tab POS_Data.");
  }

  const values = sh.getDataRange().getValues();

  const result = {
    menu: [],
    drinkToppings: [],
    snackToppings: []
  };

  values.forEach(function(row) {
    const key = kbText_(row[0]);

    if (!key ||
        !Object.prototype.hasOwnProperty.call(result, key)) {
      return;
    }

    const parsed = kbParseJson_(row[1], []);

    result[key] = Array.isArray(parsed)
      ? parsed
      : (parsed && Array.isArray(parsed.data)
        ? parsed.data
        : []);
  });

  return result;
}

function getCachedCatalogForAdvisor_() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get("kb_ai_catalog_v1");
    if (cached) {
      const parsed = kbParseJson_(cached, null);
      if (parsed && Array.isArray(parsed.menu)) return parsed;
    }
    const fresh = getAIProductCatalog_();
    const raw = JSON.stringify(fresh);
    if (raw.length < 95000) {
      cache.put("kb_ai_catalog_v1", raw, 60);
    }
    return fresh;
  } catch (e) {
    return getAIProductCatalog_();
  }
}

function kbItemName_(item) {
  return kbText_(
    item.name ||
    item.title ||
    item.ten ||
    item.productName
  );
}

function kbItemPrice_(item) {
  return kbMoney_(
    item.price != null
      ? item.price
      : (item.gia != null ? item.gia : item.amount)
  );
}

function kbItemId_(item) {
  return kbText_(
    item.id ||
    item.productId ||
    item.ID ||
    item.ma ||
    ""
  );
}

function kbItemImage_(item) {
  return kbText_(
    item.imageUrl ||
    item.image ||
    item.img ||
    item.photo ||
    item.thumbnail ||
    ""
  );
}

function kbItemVideo_(item) {
  return kbText_(
    item.videoUrl ||
    item.video ||
    ""
  );
}

function kbItemCategory_(item, fallback) {
  return kbText_(
    item.category ||
    item.categoryName ||
    item.group ||
    item.type ||
    fallback
  );
}

function kbItemSoldOut_(item) {
  const v = item.isSoldOut != null
    ? item.isSoldOut
    : (item.soldOut != null
      ? item.soldOut
      : item.outOfStock);

  return v === true ||
    String(v).toLowerCase() === "true" ||
    String(v) === "1";
}

function kbIsFoodItem_(name, category) {
  const n = kbNorm_(name || "");
  const c = kbNorm_(category || "");
  if (c.includes("food") || c.includes("an vat") || c.includes("do an")) return true;
  if (n.includes("chan ga") || n.includes("lap xuong") || n.includes("sua sot") ||
      n.includes("ca vien") || n.includes("tokbokki") || n.includes("banh trang") ||
      n.includes("com chien") || n.includes("goi kho bo") || n.includes("mi ") ||
      n.includes("an vat") || n.includes("xuc xich") || n.includes("khoai tay") ||
      n.includes("pho mai que") || n.includes("nem chua")) {
    return true;
  }
  return false;
}

function kbCanUpsizeItem_(name, category) {
  if (kbIsFoodItem_(name, category)) return false;
  const n = kbNorm_(name || "");
  if (!n) return false;
  if (n.includes("ly 1 lit") || n.includes("1 lit") || n.includes("ly khong lo") ||
      n.includes("khong lo") || n.includes("ly nho") || n.includes("650ml") ||
      n.includes("650 ml")) {
    return false;
  }
  if (/\b\d+\s*(ml|l|lit)\b/.test(n)) return false;
  return true;
}

const KB_UPSIZE_RULE_TEXT =
  "QUY ĐỊNH UPSIZE LY 1 LÍT (+10.000đ):\n" +
  "- Đồ uống mà tên món KHÔNG ghi dung tích/trọng lượng là ly bình thường -> ĐƯỢC upsize lên ly 1 lít, cộng thêm 10.000đ.\n" +
  "- Món thức ăn / đồ ăn vặt -> KHÔNG có upsize.\n" +
  "- Thức uống mà tên món ghi \"ly 1 lít\" / \"1 lít\" hoặc \"ly 650ml\" / \"650ml\" (hoặc có ghi trọng lượng/dung tích) -> KHÔNG được upsize.\n" +
  "- Khi tư vấn ly bình thường được phép upsize, hãy gợi ý khách có thể nâng lên ly 1 lít thêm 10.000đ; tuyệt đối KHÔNG mời upsize cho đồ ăn hoặc món có ghi 1 lít / 650ml.";

function kbPublicProduct_(item, category) {
  return {
    id: kbItemId_(item),
    name: kbItemName_(item),
    price: kbItemPrice_(item),
    category: kbItemCategory_(item, category),
    imageUrl: kbItemImage_(item),
    videoUrl: kbItemVideo_(item),
    isSoldOut: kbItemSoldOut_(item)
  };
}

function kbFindMenuItems_(message, catalog) {
  const normalized = kbNorm_(message);
  const found = [];

  (catalog.menu || []).forEach(function(item) {
    const name = kbItemName_(item);
    const n = kbNorm_(name);

    if (!n || n.length < 2) return;

    if (normalized.includes(n)) {
      const escaped = n.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const qtyMatch = normalized.match(
        new RegExp(
          "(\\d+)\\s*(ly|coc|phan|mon)?\\s*" + escaped
        )
      );

      found.push({
        id: kbItemId_(item),
        name: name,
        category: kbItemCategory_(item, ""),
        price: kbItemPrice_(item),
        quantity: qtyMatch
          ? Math.max(1, Number(qtyMatch[1]))
          : 1,
        toppings: [],
        note: ""
      });
    }
  });

  return found;
}

function kbFormatCompactCatalog_(products, drinkToppings, snackToppings) {
  const menuLines = (products || []).map(function(item) {
    const name = kbItemName_(item);
    const price = kbItemPrice_(item).toLocaleString("vi-VN");
    const soldOut = kbItemSoldOut_(item);
    return name + " (" + price + "đ" + (soldOut ? ", HẾT" : "") + ")";
  });

  const dtLines = (drinkToppings || []).map(function(item) {
    return kbItemName_(item) + " (" + kbItemPrice_(item).toLocaleString("vi-VN") + "đ)";
  });

  const stLines = (snackToppings || []).map(function(item) {
    return kbItemName_(item) + " (" + kbItemPrice_(item).toLocaleString("vi-VN") + "đ)";
  });

  return "THỰC ĐƠN QUÁN:\n" + menuLines.join(", ") +
    (dtLines.length ? "\nTOPPING ĐỒ UỐNG: " + dtLines.join(", ") : "") +
    (stLines.length ? "\nGIA VỊ / TOPPING ĂN VẶT: " + stLines.join(", ") : "");
}

function kbFormatLivePriceK_(vnd) {
  const n = kbMoney_(vnd);
  if (n > 0 && n % 1000 === 0) return (n / 1000) + "k";
  return n.toLocaleString("vi-VN") + "đ";
}

function kbFormatLiveCompactCatalog_(products, drinkToppings, snackToppings) {
  const menuLines = (products || []).map(function(item) {
    return kbItemName_(item) + "(" + kbFormatLivePriceK_(kbItemPrice_(item)) + (kbItemSoldOut_(item) ? ",HẾT" : "") + ")";
  });
  const dtLines = (drinkToppings || []).map(function(item) {
    return kbItemName_(item) + "(" + kbFormatLivePriceK_(kbItemPrice_(item)) + ")";
  });
  const stLines = (snackToppings || []).map(function(item) {
    return kbItemName_(item) + "(" + kbFormatLivePriceK_(kbItemPrice_(item)) + ")";
  });
  return "MENU: " + menuLines.join(", ") +
    (dtLines.length ? "\nTOPPING NƯỚC: " + dtLines.join(", ") : "") +
    (stLines.length ? "\nTOPPING ĂN VẶT: " + stLines.join(", ") : "");
}

function kbCatalogText_(catalog) {
  return kbFormatCompactCatalog_(
    catalog.menu || [],
    catalog.drinkToppings || [],
    catalog.snackToppings || []
  );
}

function testAIProductCatalog() {
  const c = getAIProductCatalog_();

  Logger.log("Món: " + c.menu.length);
  Logger.log("Topping nước: " + c.drinkToppings.length);
  Logger.log("Topping ăn vặt: " + c.snackToppings.length);

  Logger.log(kbCatalogText_(c));
}

/* =========================================================
   4. API DANH MỤC SẢN PHẨM CHO GIAO DIỆN MỚI
========================================================= */

function kbGetCatalogAPI_() {
  const catalog = getAIProductCatalog_();

  const menu = (catalog.menu || []).map(function(item) {
    return kbPublicProduct_(item, "Đồ uống");
  });

  const drinkToppings = (catalog.drinkToppings || [])
    .map(function(item) {
      return kbPublicProduct_(item, "Topping nước");
    });

  const snackToppings = (catalog.snackToppings || [])
    .map(function(item) {
      return kbPublicProduct_(item, "Topping ăn vặt");
    });

  return {
    success: true,
    products: menu,
    menu: menu,
    drinkToppings: drinkToppings,
    snackToppings: snackToppings,
    total: menu.length
  };
}

/* =========================================================
   5. TÌM KIẾM SẢN PHẨM
========================================================= */

function kbSearchProducts_(query, catalog) {
  const q = kbNorm_(query);
  const results = [];

  if (!q) return results;

  (catalog.menu || []).forEach(function(item) {
    const name = kbItemName_(item);
    const normalizedName = kbNorm_(name);

    if (!normalizedName) return;

    const words = q.split(" ").filter(function(w) {
      return w.length >= 2;
    });

    let score = 0;

    if (q.includes(normalizedName)) score += 10;
    if (normalizedName.includes(q)) score += 8;

    words.forEach(function(word) {
      if (normalizedName.includes(word)) score += 2;
    });

    if (score > 0) {
      results.push({
        product: kbPublicProduct_(item, "Đồ uống"),
        score: score
      });
    }
  });

  results.sort(function(a, b) {
    return b.score - a.score;
  });

  return results.slice(0, 8).map(function(x) {
    return x.product;
  });
}

/* =========================================================
   6. PHIÊN HỘI THOẠI
========================================================= */

function kbFindSessionRow_(sessionId) {
  const sh = kbSheet_(KB_CONFIG.SHEETS.SESSIONS);
  const data = sh.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(sessionId)) {
      return i + 1;
    }
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
    JSON.stringify(state),
    "",
    new Date(
      now.getTime() +
      KB_CONFIG.SESSION_HOURS * 3600000
    )
  ]);

  return {
    success: true,
    sessionId: id
  };
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

  sh.getRange(session.row, 9)
    .setValue(JSON.stringify(state));

  sh.getRange(session.row, 10)
    .setValue(lastMessage || "");

  sh.getRange(session.row, 11).setValue(
    new Date(
      now.getTime() +
      KB_CONFIG.SESSION_HOURS * 3600000
    )
  );
}

function saveAIMessage(sessionId, role, content) {
  kbSheet_(KB_CONFIG.SHEETS.MESSAGES).appendRow([
    sessionId,
    kbNow_(),
    role,
    content
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

  return {
    success: true,
    sessionId: s.id,
    state: s.state
  };
}

function deleteAISession(sessionId) {
  const sh = kbSheet_(KB_CONFIG.SHEETS.SESSIONS);
  const row = kbFindSessionRow_(sessionId);

  if (row) sh.deleteRow(row);

  return true;
}

/* =========================================================
   7. GROQ (openai/gpt-oss-20b / 120b với reasoning_effort: low)
========================================================= */

function getGroqApiKey_() {
  const key = kbGetProperty_("GROQ_API_KEY");

  if (!key) {
    throw new Error(
      "Thiếu GROQ_API_KEY trong Script Properties."
    );
  }

  return key;
}

function callGroq_(messages) {
  const apiKey = getGroqApiKey_();
  const models = Array.isArray(KB_CONFIG.GROQ_FALLBACK_MODELS) && KB_CONFIG.GROQ_FALLBACK_MODELS.length
    ? KB_CONFIG.GROQ_FALLBACK_MODELS
    : [KB_CONFIG.MODEL];

  let lastErr = "Không gọi được Groq";

  for (let i = 0; i < models.length; i++) {
    const modelName = models[i];
    const reqBody = {
      model: modelName,
      messages: messages,
      max_completion_tokens: KB_CONFIG.MAX_TOKENS,
      temperature: 0.35
    };

    if (modelName.indexOf("openai/gpt-oss") === 0) {
      reqBody.reasoning_effort = "low";
      reqBody.include_reasoning = false;
    }

    const response = UrlFetchApp.fetch(
      KB_CONFIG.GROQ_URL,
      {
        method: "post",
        contentType: "application/json",
        headers: {
          Authorization: "Bearer " + apiKey
        },
        payload: JSON.stringify(reqBody),
        muteHttpExceptions: true
      }
    );

    const code = response.getResponseCode();
    const body = response.getContentText();

    if (code >= 200 && code < 300) {
      const data = kbParseJson_(body, {});
      const content = data.choices &&
        data.choices[0] &&
        data.choices[0].message
        ? kbText_(data.choices[0].message.content)
        : "";
      if (content) return content;
      lastErr = "Groq (" + modelName + ") trả về nội dung rỗng";
    } else {
      lastErr = "Groq (" + modelName + ") HTTP " + code + ": " + body.substring(0, 300);
      if (code === 401 || code === 403) break;
    }
  }

  throw new Error(lastErr);
}

function testGroqConnection() {
  const t0 = Date.now();
  const reply = callGroq_([
    {
      role: "user",
      content:
        "Hãy trả lời đúng một câu: Kết nối Groq thành công."
    }
  ]);

  Logger.log("Thời gian: " + (Date.now() - t0) + "ms | Trả lời: " + reply);
  return reply;
}

/* =========================================================
   8. TƯ VẤN SẢN PHẨM MỚI - GROQ NHANH + DỰ PHÒNG GEMINI (3 KEY) + GEMINI TTS
========================================================= */

function kbCallGeminiFallback_(systemPrompt, userMessage) {
  const keys = getGeminiApiKeys_();
  const models = ["gemini-3.8-flash", "gemini-2.5-flash"];
  let lastErr = "Không gọi được Gemini dự phòng";

  for (let k = 0; k < keys.length; k++) {
    let keyExhausted = false;
    for (let i = 0; i < models.length; i++) {
      const modelId = models[i];
      const url = "https://generativelanguage.googleapis.com/v1beta/models/" +
        modelId + ":generateContent?key=" + encodeURIComponent(keys[k]);

      const genCfg = {
        temperature: 0.5,
        maxOutputTokens: modelId.indexOf("gemini-3.8") === 0 ? 1024 : 700,
        thinkingConfig: modelId.indexOf("gemini-3.8") === 0
          ? { thinkingLevel: "low" }
          : { thinkingBudget: 0 }
      };

      const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: genCfg
      };

      const res = UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      const code = res.getResponseCode();
      const json = kbParseJson_(res.getContentText(), {});

      if (code >= 200 && code < 300 && json.candidates && json.candidates[0] &&
          json.candidates[0].content && json.candidates[0].content.parts) {
        const parts = json.candidates[0].content.parts;
        let txt = "";
        for (let p = 0; p < parts.length; p++) {
          if (parts[p].text && !parts[p].thought) {
            txt += parts[p].text;
          }
        }
        txt = kbText_(txt);
        if (txt) return txt;
      }

      lastErr = (json.error && json.error.message) ? json.error.message : ("Gemini (" + modelId + ") HTTP " + code);
      if (code === 429 || code === 403) {
        keyExhausted = true;
        break;
      }
    }
    if (!keyExhausted) break;
  }

  throw new Error(lastErr);
}

function kbCleanTextForTTS_(text) {
  let clean = kbText_(text).replace(/https?:\/\/\S+/g, "");
  clean = clean.replace(/(\d{1,3}(?:\.\d{3})+|\d{4,})\s*(?:đồng|đ)(?!\w)/gi, function(m, num) {
    const val = Number(String(num).replace(/\./g, ""));
    return Number.isFinite(val) ? (val / 1000) + " nghìn" : m;
  });
  return clean.replace(/\s+/g, " ").trim();
}

function kbTextToSpeech_(text, voiceName) {
  const cleanText = kbCleanTextForTTS_(text);
  if (!cleanText) {
    return { success: false, error: "Không có nội dung để đọc." };
  }

  const keys = getGeminiApiKeys_();
  const allowedVoices = ["Charon", "Puck", "Fenrir", "Kore", "Zephyr"];
  const selectedVoice = allowedVoices.indexOf(voiceName) !== -1 ? voiceName : "Charon";
  const isFemale = selectedVoice === "Kore" || selectedVoice === "Zephyr";

  const styleInstruction = isFemale
    ? "Giọng nữ miền Nam Việt Nam ngọt ngào, thân thiện, tự nhiên như nhân viên quán cà phê đang tư vấn khách."
    : "Giọng nam miền Nam Việt Nam ấm áp, tự nhiên, rõ ràng, thân thiện như nhân viên quán cà phê đang tư vấn khách.";

  const payload = {
    contents: [{
      role: "user",
      parts: [{
        text: cleanText,
        speechMetadata: { style: styleInstruction }
      }]
    }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: selectedVoice }
        }
      }
    }
  };

  let lastErr = "Gemini TTS lỗi";
  for (let k = 0; k < keys.length; k++) {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" +
      KB_CONFIG.TTS_MODEL + ":generateContent?key=" + encodeURIComponent(keys[k]);

    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    const body = response.getContentText();
    const json = kbParseJson_(body, {});

    if (code >= 200 && code < 300) {
      const part = json.candidates && json.candidates[0] &&
        json.candidates[0].content && json.candidates[0].content.parts &&
        json.candidates[0].content.parts[0];

      const inline = part && part.inlineData ? part.inlineData : null;
      if (inline && inline.data) {
        return {
          success: true,
          audioBase64: inline.data,
          mimeType: inline.mimeType || "audio/wav",
          voiceName: selectedVoice
        };
      }
      lastErr = "Gemini TTS không trả về dữ liệu âm thanh.";
      break;
    }

    lastErr = "Gemini TTS HTTP " + code + ": " + body.substring(0, 400);
    if (code !== 429 && code !== 403) break;
  }

  throw new Error(lastErr);
}

function testGeminiTTS() {
  const res = kbTextToSpeech_(
    "Dạ em chào anh chị, quán em có hồng trà mít giá 22 nghìn và nhiều loại topping ngon lắm ạ!",
    "Charon"
  );
  Logger.log("TTS thành công: " + res.success + " | mimeType: " + res.mimeType + " | length: " + (res.audioBase64 || "").length);
  return { success: res.success, mimeType: res.mimeType };
}

function kbAdvisorChat_(data) {
  const message = kbText_(data.message);
  if (!message) {
    throw new Error("Anh/chị chưa nhập nội dung cần tư vấn.");
  }

  const catalog = getCachedCatalogForAdvisor_();
  const selected = data.selectedProduct || null;

  let selectedText = "";
  if (selected) {
    const canUpsizeSel = kbCanUpsizeItem_(selected.name, selected.category);
    selectedText = [
      "SẢN PHẨM KHÁCH ĐANG XEM:",
      "Tên: " + kbText_(selected.name) + " | Giá: " + kbMoney_(selected.price) + "đ | Danh mục: " + kbText_(selected.category) +
      " | Hết hàng: " + (selected.isSoldOut ? "Có" : "Không") +
      " | Upsize lên ly 1 lít (+10.000đ): " + (canUpsizeSel ? "Được phép" : "Không được upsize (món ăn hoặc đã ghi dung tích/ly 1 lít/650ml)")
    ].join("\n");
  }

  const matched = kbSearchProducts_(message, catalog);
  const matchedText = matched.map(function(p) {
    return "- " + p.name + " (" + p.price.toLocaleString("vi-VN") + "đ" + (p.isSoldOut ? ", HẾT" : "") + ")";
  }).join("\n");

  const system = [
    "Bạn là Kim, nhân viên tư vấn đồ uống và ăn vặt của KIM BLING COFFEE & TEA.",
    "Luôn xưng \"em\" và gọi khách là \"anh chị\". Trả lời tiếng Việt tự nhiên, thân thiện, lễ phép.",
    "CHỈ tư vấn đúng món, giá, topping nước và topping ăn vặt có trong danh sách thực đơn bên dưới.",
    "Tuyệt đối KHÔNG bịa tên món, giá, khuyến mãi ngoài thực đơn.",
    "Nếu sản phẩm hết hàng phải báo rõ.",
    "Không tự tạo đơn, không xin SĐT/địa chỉ, không hướng dẫn thanh toán.",
    "Nếu khách hỏi 1 món: tư vấn 2 đến 4 câu đầy đủ hương vị, giá và gợi ý 1-2 topping hợp. Nếu khách hỏi cả nhóm món: liệt kê gọn các món nổi bật kèm giá.",
    KB_UPSIZE_RULE_TEXT,
    "",
    kbFormatLiveCompactCatalog_(catalog.menu || [], catalog.drinkToppings || [], catalog.snackToppings || []),
    "",
    matchedText ? ("CÁC MÓN KHỚP VỚI CÂU HỎI:\n" + matchedText) : "",
    selectedText
  ].filter(Boolean).join("\n");

  let reply = "";
  let usedProvider = "groq";

  try {
    reply = callGroq_([
      { role: "system", content: system },
      { role: "user", content: message }
    ]);
    if (!reply) throw new Error("Groq trả về rỗng");
  } catch (groqErr) {
    usedProvider = "gemini_fallback";
    try {
      reply = kbCallGeminiFallback_(system, message);
    } catch (geminiErr) {
      throw new Error(
        "Groq lỗi: " + (groqErr && groqErr.message ? groqErr.message : groqErr) +
        " | Gemini lỗi: " + (geminiErr && geminiErr.message ? geminiErr.message : geminiErr)
      );
    }
  }

  let ttsAudioBase64 = "";
  let ttsMimeType = "audio/wav";
  const ttsAttempted = !!data.withAudio;

  if (ttsAttempted) {
    try {
      const tts = kbTextToSpeech_(reply, kbText_(data.voiceName || "Charon"));
      if (tts && tts.success && tts.audioBase64) {
        ttsAudioBase64 = tts.audioBase64;
        ttsMimeType = tts.mimeType || "audio/wav";
      }
    } catch (ttsErr) {
      console.warn("TTS lỗi nhẹ, chuyển sang fallback trình duyệt:", ttsErr);
    }
  }

  return {
    success: true,
    reply: reply,
    provider: usedProvider,
    ttsAttempted: ttsAttempted,
    ttsAudioBase64: ttsAudioBase64,
    ttsMimeType: ttsMimeType,
    products: matched,
    productIds: matched.map(function(p) { return p.id; })
  };
}

/* =========================================================
   9. GEMINI LIVE - CẤP EPHEMERAL TOKEN (DỰ PHÒNG 3 KEY)
   API KEY THẬT CHỈ ĐƯỢC DÙNG TRÊN SERVER.
========================================================= */

function getGeminiApiKeys_() {
  const p = PropertiesService.getScriptProperties();
  const names = ["GEMINI_API_KEY", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3"];
  const keys = [];

  names.forEach(function(n) {
    const val = kbText_(p.getProperty(n));
    if (val && keys.indexOf(val) === -1) {
      keys.push(val);
    }
  });

  if (!keys.length) {
    throw new Error(
      "Thiếu GEMINI_API_KEY trong Script Properties."
    );
  }

  return keys;
}

function getGeminiApiKey_() {
  return getGeminiApiKeys_()[0];
}

function kbCreateGeminiLiveToken_(data) {
  const keys = getGeminiApiKeys_();
  const startIdx = Math.max(0, Number(data && data.keyIndex) || 0);
  if (startIdx >= keys.length) {
    throw new Error("Đã hết API key dự phòng Gemini (quota exceeded).");
  }

  const catalog = getCachedCatalogForAdvisor_();
  const isMenuControl = data && data.mode === "menu_control";

  const compactMenu = isMenuControl
    ? kbFormatLiveCompactCatalog_(catalog.menu || [], catalog.drinkToppings || [], catalog.snackToppings || [])
    : kbFormatCompactCatalog_(catalog.menu || [], catalog.drinkToppings || [], catalog.snackToppings || []);

  const liveInstruction = isMenuControl
    ? [
        "Bạn là Bé Kim (22t), trợ lý giọng nói trực tiếp quản lý web đặt món KIM BLING COFFEE & TEA tại Sài Gòn.",
        "Giọng nữ miền Nam trẻ trung, dễ thương, xưng 'em' gọi 'anh chị', nói ngắn gọn súc tích 1-2 câu tự nhiên.",
        "1. TƯ VẤN & XEM ẢNH/CHI TIẾT MÓN: Chỉ nói đúng món, giá, topping trong MENU; báo rõ nếu HẾT. Khi khách yêu cầu xem ảnh món, xem hình, hoặc xem chi tiết món -> gọi ngay open_menu_section(section='tiktok', dishName=...) để mở popup TikTok sản phẩm lên màn hình. Hỏi nhóm món -> gọi open_menu_section(home_menu, category) rồi liệt kê 2-3 món. Không tự thêm giỏ khi khách mới hỏi hoặc mới xem chi tiết.",
        "2. BỎ VÀO GIỎ / CHỌN TÙY CHỌN: Khi khách yêu cầu bỏ vào giỏ hàng, thêm vào giỏ hàng, mua/đặt món -> LUÔN gọi ngay open_dish_options (truyền luôn upsize, sugar, ice, toppings, quantity nếu khách đã nói sẵn; nếu đang ở popup TikTok thì lấy đúng món đang xem) để mở bảng tùy chọn (Upsize, Đá, Đường, Topping) lên màn hình. Hỏi mục còn thiếu (upsize 1L nếu canUpsize=true, đường, đá, topping, số lượng; lưu ý đồ ăn không có đường/đá/upsize), tick thêm bằng update_dish_options. Đọc lại chốt giá, chỉ khi khách đồng ý chốt mới gọi confirm_add_options_to_cart. Xong hỏi chọn thêm hay qua thanh toán.",
        "3. THANH TOÁN & ĐẶT HÀNG: Khách kêu qua thanh toán/đặt hàng -> luôn gọi open_checkout trước cho khách xem lại (KHÔNG gửi đơn trước khi xem lại). Khi khách muốn chọn hoặc đổi giữa 'Giao hàng tận nơi' và 'Tự ra quán lấy', đổi thanh toán, hay sửa tên/SĐT/địa chỉ/ghi chú -> gọi ngay set_customer_info. Đọc đủ: món, số lượng, tùy chọn, tên, SĐT, địa chỉ, hình thức nhận hàng, ghi chú, tiền mặt/chuyển khoản/Túi Kim Cương, ship, tổng tiền. Chỉ khi khách xác nhận OK kêu đặt/thanh toán mới gọi confirm_submit_order(confirmed=true).",
        "4. QUẢN LÝ MỌI MỤC: Dùng open_menu_section, control_tiktok, manage_cart, set_price_and_diamond, close_popup cho mọi mục khách hàng. CẤM thao tác mục Admin/hệ thống.",
        "5. TẠM BIỆT / NGƯNG HỖ TRỢ: Khi khách nói 'bye', 'tạm biệt', 'thôi nghỉ', 'không cần nữa', 'ngưng hỗ trợ', 'tắt bé kim' -> gọi ngay end_bekim_session, sau đó chào tạm biệt ngắn gọn 1 câu.",
        "UPSIZE 1L (+10k): Đồ uống thường ĐƯỢC upsize; đồ ăn và món ghi 1 lít/650ml KHÔNG được upsize.",
        compactMenu
      ].join("\n")
    : [
        "Bạn là Kim, nhân viên nữ trẻ tuổi (22 tuổi), tính cách vui vẻ, hoạt bát, nhiệt tình và dễ thương của quán KIM BLING COFFEE & TEA tại Sài Gòn.",
        "PHONG CÁCH NÓI CHUYỆN: Luôn nói bằng giọng nữ miền Nam Việt Nam tự nhiên, trẻ trung, tươi tắn và gần gũi (như nhân viên quán cà phê đang trò chuyện trực tiếp với khách).",
        "Luôn xưng \"em\" và gọi khách là \"anh chị\", dùng tự nhiên các từ đệm miền Nam nhẹ nhàng như \"dạ\", \"nha\", \"hen\", \"ạ\". Trò chuyện lưu loát, hào hứng, ngắn gọn dễ nghe, không đọc như robot.",
        "QUY TẮC BẮT BUỘC: Chỉ giới thiệu đúng các món, giá tiền và topping có trong thực đơn bên dưới. Không tự bịa món ngoài danh sách.",
        KB_UPSIZE_RULE_TEXT,
        "",
        compactMenu
      ].join("\n");

  const now = Date.now();
  const expireTime = new Date(now + 30 * 60 * 1000).toISOString();
  const newSessionExpireTime = new Date(now + 60 * 1000).toISOString();

  const bidiSetup = {
    model: "models/" + KB_CONFIG.LIVE_MODEL,
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Zephyr"
          }
        }
      }
    },
    systemInstruction: {
      parts: [{ text: liveInstruction }]
    },
    inputAudioTranscription: {},
    outputAudioTranscription: {}
  };

  if (isMenuControl) {
    bidiSetup.tools = [{
      functionDeclarations: [
        {
          name: "open_menu_section",
          description: "Mở mục trên menu (trừ Admin). Dùng section='tiktok' khi khách yêu cầu xem ảnh món hoặc xem chi tiết món. Các mục: home_menu | tiktok | history | order_lookup | lucky_gift | lucky_wheel | shipping_map | contact | banner | install_app | share | scroll_top.",
          parameters: {
            type: "OBJECT",
            properties: {
              section: { type: "STRING", description: "home_menu|tiktok|history|order_lookup|lucky_gift|lucky_wheel|shipping_map|contact|banner|install_app|share|scroll_top" },
              dishName: { type: "STRING", description: "Tên món (khi section=tiktok)" },
              category: { type: "STRING", description: "All|Favorite|Coffee|Tea|MilkTea|Soda|Yogurt|Food|Topping" },
              keyword: { type: "STRING", description: "Từ khóa tìm kiếm" }
            },
            required: ["section"]
          }
        },
        {
          name: "control_tiktok",
          description: "Điều khiển popup TikTok đang mở.",
          parameters: {
            type: "OBJECT",
            properties: {
              action: { type: "STRING", description: "next|prev|toggle_video|like|open_comments|close_comments" }
            },
            required: ["action"]
          }
        },
        {
          name: "open_dish_options",
          description: "Mở bảng tùy chọn món (#optionsModal: upsize, đá, đường, topping) khi khách yêu cầu bỏ vào giỏ hàng / thêm vào giỏ hàng / mua món, và tick sẵn lựa chọn nếu khách đã nói trước.",
          parameters: {
            type: "OBJECT",
            properties: {
              dishName: { type: "STRING", description: "Tên món (bỏ trống nếu đang mở TikTok món đó)" },
              quantity: { type: "INTEGER", description: "Số lượng (mặc định 1)" },
              upsize: { type: "BOOLEAN", description: "True=Upsize 1L (+10k)" },
              sugar: { type: "STRING", description: "Đường bình thường|Ít đường|Không đường" },
              ice: { type: "STRING", description: "Đá bình thường|Ít đá|Không đá" },
              toppings: { type: "ARRAY", description: "Tên topping (vd: ['Trân châu trắng','Thủy tinh đào x2'])", items: { type: "STRING" } }
            }
          }
        },
        {
          name: "update_dish_options",
          description: "Cập nhật tick Size, Đường, Đá, Topping, Số lượng trên bảng tùy chọn đang mở.",
          parameters: {
            type: "OBJECT",
            properties: {
              dishName: { type: "STRING", description: "Tên món (nếu bảng chưa mở)" },
              upsize: { type: "BOOLEAN", description: "True=Upsize 1L (+10k)" },
              sugar: { type: "STRING", description: "Đường bình thường|Ít đường|Không đường" },
              ice: { type: "STRING", description: "Đá bình thường|Ít đá|Không đá" },
              resetToppings: { type: "BOOLEAN", description: "True nếu bỏ chọn hết topping cũ" },
              toppings: { type: "ARRAY", description: "Tên topping cần tick", items: { type: "STRING" } },
              quantity: { type: "INTEGER", description: "Số lượng" }
            }
          }
        },
        {
          name: "confirm_add_options_to_cart",
          description: "Bấm Thêm vào giỏ từ bảng tùy chọn sau khi khách đã chốt.",
          parameters: {
            type: "OBJECT",
            properties: {
              quantity: { type: "INTEGER", description: "Số lượng chốt thêm (mặc định 1)" }
            }
          }
        },
        {
          name: "manage_cart",
          description: "Thao tác giỏ hàng.",
          parameters: {
            type: "OBJECT",
            properties: {
              action: { type: "STRING", description: "view|remove|set_qty|reorder_last|remove_discount" },
              dishName: { type: "STRING", description: "Tên món" },
              quantity: { type: "INTEGER", description: "Số lượng mới" }
            },
            required: ["action"]
          }
        },
        {
          name: "set_price_and_diamond",
          description: "Đổi chế độ Tiền (K) / Túi Kim Cương (DIAMOND) hoặc xem số dư kim cương.",
          parameters: {
            type: "OBJECT",
            properties: {
              priceMode: { type: "STRING", description: "K hoặc DIAMOND" },
              phoneForDiamond: { type: "STRING", description: "SĐT kiểm tra số dư" }
            }
          }
        },
        {
          name: "open_checkout",
          description: "Mở bảng Giỏ hàng & Thanh toán để khách xem lại toàn bộ thông tin trước khi chốt.",
          parameters: {
            type: "OBJECT",
            properties: {
              reason: { type: "STRING", description: "Mặc định 'review'" }
            }
          }
        },
        {
          name: "set_customer_info",
          description: "Điền hoặc chuyển đổi hình thức nhận hàng ('Giao hàng' hoặc 'Tự ra lấy'), tên, SĐT, địa chỉ, ghi chú và hình thức thanh toán.",
          parameters: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", description: "Tên người nhận" },
              phone: { type: "STRING", description: "SĐT" },
              address: { type: "STRING", description: "Địa chỉ giao" },
              orderType: { type: "STRING", description: "Đúng 1 trong 2 giá trị: 'Giao hàng' hoặc 'Tự ra lấy'" },
              note: { type: "STRING", description: "Ghi chú cho quán" },
              payMethod: { type: "STRING", description: "Tiền mặt|Chuyển khoản|Túi Kim Cương" }
            }
          }
        },
        {
          name: "confirm_submit_order",
          description: "Gửi đơn chính thức CHỈ SAU KHI bảng thanh toán đã mở và khách xác nhận đồng ý hết.",
          parameters: {
            type: "OBJECT",
            properties: {
              confirmed: { type: "BOOLEAN", description: "True khi khách đã xem lại và chốt đặt hàng" }
            },
            required: ["confirmed"]
          }
        },
        {
          name: "close_popup",
          description: "Đóng tất cả popup quay về menu.",
          parameters: {
            type: "OBJECT",
            properties: {
              target: { type: "STRING", description: "Mặc định 'all'" }
            }
          }
        },
        {
          name: "end_bekim_session",
          description: "Đăng xuất, tắt micro và ngưng hỗ trợ Bé Kim Live ngay khi khách nói bye, tạm biệt, thôi nghỉ hoặc không cần hỗ trợ nữa.",
          parameters: {
            type: "OBJECT",
            properties: {
              reason: { type: "STRING", description: "Lý do kết thúc (vd: 'goodbye')" }
            }
          }
        }
      ]
    }];
  }

  const payload = {
    uses: 1,
    expireTime: expireTime,
    newSessionExpireTime: newSessionExpireTime,
    bidiGenerateContentSetup: bidiSetup
  };

  let lastErr = "Gemini cấp token thất bại";
  for (let k = startIdx; k < keys.length; k++) {
    const response = UrlFetchApp.fetch(
      KB_CONFIG.GEMINI_TOKEN_URL,
      {
        method: "post",
        contentType: "application/json",
        headers: {
          "x-goog-api-key": keys[k]
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

    const code = response.getResponseCode();
    const body = response.getContentText();
    const result = kbParseJson_(body, {});

    if (code >= 200 && code < 300 && result.name) {
      return {
        success: true,
        token: result.name,
        model: KB_CONFIG.LIVE_MODEL,
        keyIndex: k,
        hasBackupKey: k + 1 < keys.length,
        expiresAt: result.expireTime || expireTime,
        newSessionExpiresAt:
          result.newSessionExpireTime || newSessionExpireTime
      };
    }

    lastErr = "Gemini cấp token thất bại HTTP " + code + ": " + body.substring(0, 500);
    if (code !== 429 && code !== 403) {
      break;
    }
  }

  throw new Error(lastErr);
}

function testGeminiLiveToken() {
  Logger.log("========== KIỂM TRA GEMINI LIVE ==========");

  const result = kbCreateGeminiLiveToken_({ mode: "menu_control" });

  Logger.log("CẤP TOKEN: THÀNH CÔNG");
  Logger.log("Model: " + result.model);
  Logger.log("Key index đang dùng: " + result.keyIndex);
  Logger.log("Có key dự phòng tiếp: " + result.hasBackupKey);
  Logger.log("Token tồn tại: " + !!result.token);
  Logger.log("Hết hạn: " + result.expiresAt);
  Logger.log(
    "Hạn bắt đầu phiên: " + result.newSessionExpiresAt
  );

  Logger.log("========== HOÀN TẤT ==========");

  return {
    success: true,
    model: result.model,
    keyIndex: result.keyIndex,
    hasBackupKey: result.hasBackupKey,
    expiresAt: result.expiresAt
  };
}

/* =========================================================
   10. TÍNH TIỀN VÀ BẢN NHÁP ĐƠN HÀNG CŨ
========================================================= */

function kbCalculateOrder_(state) {
  let subtotal = 0;

  const items = (state.items || []).map(function(item) {
    const qty = Math.max(1, Number(item.quantity || 1));

    const toppingTotal = (item.toppings || [])
      .reduce(function(sum, t) {
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

  const upsizeFee = state.upsize
    ? KB_CONFIG.UPSIZE_FEE
    : 0;

  const total = subtotal + upsizeFee;

  return {
    customerName: state.customerName || "",
    phone: state.phone || "",
    fulfillment: state.fulfillment || "",
    address: state.address ||
      (state.fulfillment === "pickup" ? "Tại quán" : ""),
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
    kbNow_(),
    draftId,
    session.id,
    JSON.stringify(order),
    "PENDING",
    expires,
    ""
  ]);

  session.state.draftId = draftId;

  kbSaveSession_(
    session,
    "Bản nháp đơn hàng đã tạo"
  );

  return {
    draftId: draftId,
    order: order
  };
}

function kbFindDraftRow_(draftId, sessionId) {
  const sh = kbSheet_(KB_CONFIG.SHEETS.DRAFTS);
  const data = sh.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][1]) === String(draftId) &&
      String(data[i][2]) === String(sessionId)
    ) {
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

    if (status === "PENDING") {
      sh.getRange(row, 5).setValue("CANCELLED");
    }
  }

  const session = kbGetSession_(sessionId);

  if (session) {
    session.state.draftId = "";
    session.state.phase = "edit";

    kbSaveSession_(
      session,
      "Khách muốn chỉnh sửa đơn"
    );
  }

  return { success: true };
}

/* =========================================================
   11. TELEGRAM
========================================================= */

function kbTelegramSend_(chatId, message) {
  const token = kbGetProperty_("TELEGRAM_BOT_TOKEN");

  if (!token || !chatId) {
    return {
      success: false,
      error: "Thiếu Telegram token hoặc Chat ID."
    };
  }

  const url =
    "https://api.telegram.org/bot" +
    token +
    "/sendMessage";

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: String(chatId),
      text: message
    }),
    muteHttpExceptions: true
  });

  const data = kbParseJson_(
    res.getContentText(),
    {}
  );

  return {
    success:
      res.getResponseCode() >= 200 &&
      res.getResponseCode() < 300 &&
      data.ok === true,
    error: data.description || ""
  };
}

function getActiveTelegramStaff_() {
  const sh = kbSheet_(KB_CONFIG.SHEETS.STAFF);
  const data = sh.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const active = data[i][3];

    const enabled =
      active === true ||
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

  if (!name || !chatId) {
    throw new Error("Thiếu tên hoặc Chat ID.");
  }

  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]) === chatId) {
      sh.getRange(i + 1, 1, 1, 5).setValues([[
        name,
        phone,
        chatId,
        data.active !== false,
        kbNow_()
      ]]);

      return {
        success: true,
        updated: true
      };
    }
  }

  sh.appendRow([
    name,
    phone,
    chatId,
    data.active !== false,
    kbNow_()
  ]);

  return {
    success: true,
    created: true
  };
}

function sendAIOrderTelegram_(order, orderId) {
  const lines = [
    "🔔 ĐƠN HÀNG MỚI - KIM BLING",
    "Mã đơn: " + orderId,
    "Khách: " + order.customerName,
    "Điện thoại: " + order.phone,
    "Nhận hàng: " +
      (order.fulfillment === "pickup"
        ? "Tại quán"
        : "Giao hàng"),
    "Địa chỉ: " + order.address,
    "Thanh toán: " + order.payment,
    "",
    "CHI TIẾT ĐƠN:"
  ];

  (order.items || []).forEach(function(item) {
    lines.push(
      item.name +
      " x" + item.quantity +
      " - " +
      kbMoney_(item.lineTotal)
        .toLocaleString("vi-VN") +
      "đ"
    );

    if (item.toppings && item.toppings.length) {
      lines.push(
        "Topping: " +
        item.toppings.map(function(t) {
          return t.name;
        }).join(", ")
      );
    }
  });

  if (order.upsize) {
    lines.push("Upsize: +10.000đ");
  }

  if (order.note) {
    lines.push("Ghi chú: " + order.note);
  }

  lines.push(
    "TỔNG: " +
    kbMoney_(order.total).toLocaleString("vi-VN") +
    "đ"
  );

  const message = lines.join("\n");

  const ownerChatId = kbGetProperty_("TELEGRAM_CHAT_ID");
  const results = [];

  if (ownerChatId) {
    results.push(
      kbTelegramSend_(ownerChatId, message)
    );
  }

  getActiveTelegramStaff_().forEach(function(staff) {
    results.push(
      kbTelegramSend_(staff.chatId, message)
    );
  });

  return {
    success:
      results.length > 0 &&
      results.every(function(r) {
        return r.success;
      }),
    results: results
  };
}

function testTelegramBot() {
  const chatId = kbGetProperty_("TELEGRAM_CHAT_ID");

  const result = kbTelegramSend_(
    chatId,
    "✅ KIM BLING AI: Kiểm tra kết nối Telegram thành công."
  );

  Logger.log(JSON.stringify(result));

  return result;
}

/* =========================================================
   12. XÁC NHẬN ĐƠN CŨ
========================================================= */

function confirmAIOrder_(sessionId, draftId) {
  const lock = LockService.getScriptLock();

  lock.waitLock(20000);

  try {
    const draftRow = kbFindDraftRow_(
      draftId,
      sessionId
    );

    if (!draftRow) {
      throw new Error(
        "Không tìm thấy đơn chờ xác nhận."
      );
    }

    const draftSheet = kbSheet_(
      KB_CONFIG.SHEETS.DRAFTS
    );

    const draftData = draftSheet
      .getRange(draftRow, 1, 1, 7)
      .getValues()[0];

    if (
      draftData[4] === "CONFIRMED" &&
      draftData[6]
    ) {
      const orderId = draftData[6];

      const orderSheet = kbSheet_(
        KB_CONFIG.SHEETS.ORDERS
      );

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
      throw new Error(
        "Đơn này không còn ở trạng thái chờ xác nhận."
      );
    }

    if (
      new Date(draftData[5]).getTime() < Date.now()
    ) {
      throw new Error(
        "Đơn chờ đã hết hạn. Vui lòng tạo lại đơn."
      );
    }

    const order = kbParseJson_(
      draftData[3],
      null
    );

    if (
      !order ||
      !order.items ||
      !order.items.length
    ) {
      throw new Error("Đơn hàng không có món.");
    }

    const orderId = "KB" +
      Utilities.formatDate(
        kbNow_(),
        Session.getScriptTimeZone(),
        "yyyyMMddHHmmss"
      ) +
      Math.floor(Math.random() * 90 + 10);

    kbSheet_(KB_CONFIG.SHEETS.ORDERS).appendRow([
      kbNow_(),
      orderId,
      sessionId,
      order.customerName,
      order.phone,
      order.fulfillment,
      order.address,
      JSON.stringify(order.items),
      order.subtotal,
      order.total,
      order.payment,
      "Mới"
    ]);

    draftSheet.getRange(draftRow, 5)
      .setValue("CONFIRMED");

    draftSheet.getRange(draftRow, 7)
      .setValue(orderId);

    const telegram = sendAIOrderTelegram_(
      order,
      orderId
    );

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

/* =========================================================
   13. QUY TRÌNH HỎI ĐÁP ĐẶT HÀNG CŨ
========================================================= */

function kbQuestionForPhase_(state, catalog) {
  switch (state.phase) {
    case "name":
      return "Dạ em xin tên anh/chị để lên đơn ạ?";

    case "phone":
      return "Dạ cho em xin số điện thoại liên hệ ạ?";

    case "fulfillment":
      return "Anh/chị muốn nhận tại quán hay giao hàng ạ?";

    case "address":
      return "Dạ anh/chị cho em xin địa chỉ giao hàng nhé?";

    case "upsize":
      return "Anh/chị có muốn upsize ly bình thường lên ly 1 lít không ạ? Phụ thu 10.000đ.";

    case "toppings":
      return "Anh/chị có muốn thêm topping không ạ? Nếu có, anh/chị cho em biết tên topping nhé. Nếu không, mình chọn Không ạ.";

    case "note":
      return "Anh/chị có ghi chú gì thêm cho món hoặc đơn hàng không ạ? Nếu không, mình chọn Không ạ.";

    case "payment":
      return "Anh/chị muốn thanh toán bằng tiền mặt hay chuyển khoản ạ?";

    default:
      return "";
  }
}

function kbIsNo_(text) {
  return /^(khong|khong can|khong a|bo qua|thoi|khong them|khong co)$/i
    .test(kbNorm_(text));
}

function kbIsYes_(text) {
  return /^(co|co a|dong y|ok|oke|duoc|muon)$/i
    .test(kbNorm_(text));
}

function kbParsePhone_(text) {
  const m = String(text).match(
    /(?:\+?84|0)(?:[\s.-]?\d){8,10}/
  );

  return m
    ? m[0].replace(/[\s.-]/g, "")
    : "";
}

function kbParseQuantity_(text) {
  const m = String(text).match(
    /(?:x|sl|so luong)?\s*(\d+)\s*(?:ly|coc|phan|mon)?/i
  );

  return m
    ? Math.max(1, Math.min(30, Number(m[1])))
    : 1;
}

function kbFindToppings_(text, catalog) {
  const n = kbNorm_(text);

  const all = (catalog.drinkToppings || [])
    .concat(catalog.snackToppings || []);

  const found = [];

  all.forEach(function(t) {
    const name = kbItemName_(t) || kbText_(t.name);

    if (name && n.includes(kbNorm_(name))) {
      if (!found.some(function(x) {
        return kbNorm_(x.name) === kbNorm_(name);
      })) {
        found.push({
          name: name,
          price: kbItemPrice_(t)
        });
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

  if (
    state.phase === "idle" ||
    state.phase === "edit"
  ) {
    if (kbBeginOrder_(state, message, catalog)) {
      return {
        reply:
          "Dạ em đã ghi nhận " +
          state.items.map(function(i) {
            return i.name + " x" + i.quantity;
          }).join(", ") +
          ". " +
          kbQuestionForPhase_(state, catalog)
      };
    }

    return null;
  }

  if (state.phase === "name") {
    state.customerName = message.trim();
    state.phase = "phone";

  } else if (state.phase === "phone") {
    const phone = kbParsePhone_(message);

    if (!phone) {
      return {
        reply:
          "Dạ số điện thoại chưa đúng định dạng. Anh/chị gửi lại giúp em nhé?"
      };
    }

    state.phone = phone;
    state.phase = "fulfillment";

  } else if (state.phase === "fulfillment") {
    if (
      n.includes("tai quan") ||
      n.includes("den lay") ||
      n.includes("mang ve") ||
      n.includes("pickup")
    ) {
      state.fulfillment = "pickup";
      state.address = "Tại quán";
      const hasUpsizeItem = (state.items || []).some(function(it) {
        return kbCanUpsizeItem_(it.name, it.category);
      });
      if (!hasUpsizeItem) state.upsize = false;
      state.phase = hasUpsizeItem ? "upsize" : "toppings";

    } else if (
      n.includes("giao") ||
      n.includes("ship") ||
      n.includes("dia chi")
    ) {
      state.fulfillment = "delivery";
      state.phase = "address";

    } else {
      return {
        reply:
          "Dạ anh/chị chọn nhận tại quán hay giao hàng ạ?"
      };
    }

  } else if (state.phase === "address") {
    if (message.trim().length < 5) {
      return {
        reply:
          "Dạ anh/chị gửi địa chỉ cụ thể hơn giúp em nhé?"
      };
    }

    state.address = message.trim();
    const hasUpsizeItemAddr = (state.items || []).some(function(it) {
      return kbCanUpsizeItem_(it.name, it.category);
    });
    if (!hasUpsizeItemAddr) state.upsize = false;
    state.phase = hasUpsizeItemAddr ? "upsize" : "toppings";

  } else if (state.phase === "upsize") {
    if (kbIsYes_(message)) {
      state.upsize = true;

    } else if (!kbIsNo_(message)) {
      return {
        reply:
          "Dạ anh/chị có muốn upsize thêm 10.000đ không ạ? Mình chọn Có hoặc Không nhé."
      };
    }

    state.phase = "toppings";

  } else if (state.phase === "toppings") {
    if (!kbIsNo_(message)) {
      const toppings = kbFindToppings_(
        message,
        catalog
      );

      if (!toppings.length) {
        return {
          reply:
            "Dạ em chưa tìm thấy topping đó trong danh sách hiện tại. Anh/chị thử ghi đúng tên topping hoặc chọn Không nhé."
        };
      }

      state.toppings = toppings;

      if (state.items.length) {
        state.items[0].toppings = toppings;
      }
    }

    state.phase = "note";

  } else if (state.phase === "note") {
    state.note = kbIsNo_(message)
      ? ""
      : message.trim();

    state.phase = "payment";

  } else if (state.phase === "payment") {
    if (
      n.includes("tien mat") ||
      n.includes("cash")
    ) {
      state.payment = "Tiền mặt";

    } else if (
      n.includes("chuyen khoan") ||
      n.includes("bank") ||
      n.includes("qr")
    ) {
      state.payment = "Chuyển khoản";

    } else {
      return {
        reply:
          "Dạ anh/chị chọn thanh toán tiền mặt hay chuyển khoản ạ?"
      };
    }

    state.phase = "confirm";

    const draft = kbCreateDraft_(session);

    return {
      reply:
        "Dạ em đã lên đơn. Anh/chị kiểm tra thông tin và bấm Xác nhận đặt hàng nếu chính xác nhé ạ.",
      orderDraft: draft
    };
  }

  kbSaveSession_(session, message);

  return {
    reply: kbQuestionForPhase_(state, catalog)
  };
}

/* =========================================================
   14. TƯ VẤN GROQ CŨ
========================================================= */

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
    KB_UPSIZE_RULE_TEXT,
    "",
    "DANH MỤC ĐANG CÓ:",
    kbCatalogText_(catalog)
  ].join("\n");

  const messages = [{
    role: "system",
    content: system
  }];

  history.slice(-4).forEach(function(m) {
    if (
      m.role === "user" ||
      m.role === "assistant"
    ) {
      messages.push({
        role: m.role,
        content: String(m.content).substring(0, 1000)
      });
    }
  });

  messages.push({
    role: "user",
    content: message
  });

  return callGroq_(messages);
}

/* =========================================================
   15. API CHAT CŨ
========================================================= */

function kbChat_(data) {
  const sessionId = kbText_(data.sessionId);
  const message = kbText_(data.message);

  if (!sessionId || !message) {
    throw new Error(
      "Thiếu sessionId hoặc message."
    );
  }

  const session = kbGetSession_(sessionId);

  if (!session) {
    throw new Error(
      "Phiên hội thoại không tồn tại. Vui lòng tải lại trang."
    );
  }

  const catalog = getAIProductCatalog_();

  saveAIMessage(
    sessionId,
    "user",
    message
  );

  const handled = kbHandleOrderMessage_(
    session,
    message,
    catalog
  );

  let reply = "";
  let orderDraft = null;

  if (handled) {
    reply = handled.reply || "";
    orderDraft = handled.orderDraft || null;

    kbSaveSession_(session, message);

  } else {
    reply = kbGeneralAIReply_(
      sessionId,
      message,
      catalog
    );
  }

  saveAIMessage(
    sessionId,
    "assistant",
    reply
  );

  return {
    success: true,
    reply: reply,
    orderDraft: orderDraft,
    phase: session.state.phase
  };
}

/* =========================================================
   16. LỊCH SỬ
========================================================= */

function kbGetHistory_(sessionId) {
  const session = kbGetSession_(sessionId);

  if (!session) {
    throw new Error(
      "Không tìm thấy phiên hội thoại."
    );
  }

  return {
    success: true,
    sessionId: sessionId,
    messages: getAIConversation(sessionId, 50),
    state: session.state
  };
}

/* =========================================================
   17. doGet / doPost
========================================================= */

function doGet(e) {
  try {
    const action = e && e.parameter
      ? e.parameter.action
      : "";

    if (action === "ping") {
      return kbJson_({
        success: true,
        message: "KIM BLING AI SERVER ONLINE",
        version: KB_CONFIG.VERSION
      });
    }

    return kbJson_({
      success: true,
      server: "KIM BLING AI SERVER",
      version: KB_CONFIG.VERSION
    });

  } catch (err) {
    return kbJson_({
      success: false,
      error: err.message
    });
  }
}

function doPost(e) {
  try {
    const raw = e && e.postData
      ? e.postData.contents
      : "{}";

    const data = JSON.parse(raw || "{}");
    const action = kbText_(data.action);

    let result;

    switch (action) {

      case "get_catalog":
        result = kbGetCatalogAPI_();
        break;

      case "advisor_chat":
        result = kbAdvisorChat_(data);
        break;

      case "tts":
        result = kbTextToSpeech_(data.text, kbText_(data.voiceName || "Charon"));
        break;

      case "create_live_token":
      case "get_live_token":
        result = kbCreateGeminiLiveToken_(data);
        break;

      case "create_session":
        kbEnsureSheets_();
        result = createAISession();
        break;

      case "get_history":
        kbEnsureSheets_();
        result = kbGetHistory_(data.sessionId);
        break;

      case "chat":
        kbEnsureSheets_();
        result = kbChat_(data);
        break;

      case "confirm_order":
        kbEnsureSheets_();
        result = confirmAIOrder_(
          data.sessionId,
          data.draftId
        );
        break;

      case "cancel_order_draft":
        kbEnsureSheets_();
        result = cancelAIOrderDraft_(
          data.sessionId,
          data.draftId
        );
        break;

      case "saveStaffTelegram":
      case "save_staff_telegram":
        kbEnsureSheets_();
        result = saveStaffTelegram(data);
        break;

      default:
        throw new Error(
          "Action không hợp lệ: " + action
        );
    }

    return kbJson_(result);

  } catch (err) {
    console.error(err);

    return kbJson_({
      success: false,
      error: err && err.message
        ? err.message
        : String(err)
    });
  }
}

/* =========================================================
   18. KIỂM TRA CẤU HÌNH
========================================================= */

function checkKimBlingConfig() {
  const p = PropertiesService.getScriptProperties();

  const geminiKeysCount = ["GEMINI_API_KEY", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3"]
    .map(function(k) { return kbText_(p.getProperty(k)); })
    .filter(function(v, i, arr) { return v && arr.indexOf(v) === i; }).length;

  const result = {
    GROQ_API_KEY: !!p.getProperty("GROQ_API_KEY"),
    GEMINI_API_KEY: !!p.getProperty("GEMINI_API_KEY"),
    GEMINI_API_KEY_2: !!p.getProperty("GEMINI_API_KEY_2"),
    GEMINI_API_KEY_3: !!p.getProperty("GEMINI_API_KEY_3"),
    GEMINI_KEYS_COUNT: geminiKeysCount,
    TELEGRAM_BOT_TOKEN: !!p.getProperty("TELEGRAM_BOT_TOKEN"),
    TELEGRAM_CHAT_ID: !!p.getProperty("TELEGRAM_CHAT_ID"),
    AI_DATABASE_ID: !!(
      p.getProperty("AI_DATABASE_ID") ||
      KB_CONFIG.DB_ID
    )
  };

  Logger.log(
    JSON.stringify(result, null, 2)
  );

  return result;
}

function testAIChatAPI() {
  const session = createAISession();

  const result = kbChat_({
    sessionId: session.sessionId,
    message: "Tôi muốn đặt một món"
  });

  Logger.log(
    JSON.stringify(result, null, 2)
  );
}

function testExternalPost() {
  const url = ScriptApp.getService().getUrl();

  Logger.log("Web App URL: " + url);
}

/* =========================================================
   19. KIỂM TRA TỔNG HỢP PHIÊN BẢN 5.0
========================================================= */

function testKimBlingAI40() {
  Logger.log("========== KIM BLING AI 5.0 ==========");

  const config = checkKimBlingConfig();

  Logger.log("1. CẤU HÌNH:");
  Logger.log(JSON.stringify(config));

  Logger.log("2. DATABASE:");

  const ss = kbDb_();

  Logger.log("Google Sheet: " + ss.getName());

  const pos = ss.getSheetByName("POS_Data");

  if (!pos) {
    throw new Error("Không tìm thấy POS_Data.");
  }

  Logger.log("3. POS_DATA:");

  const catalog = getAIProductCatalog_();

  Logger.log("Số món: " + catalog.menu.length);
  Logger.log(
    "Topping nước: " + catalog.drinkToppings.length
  );
  Logger.log(
    "Topping ăn vặt: " + catalog.snackToppings.length
  );

  Logger.log("4. GROQ:");

  if (config.GROQ_API_KEY) {
    Logger.log("Đã có GROQ_API_KEY.");
  } else {
    Logger.log("Chưa có GROQ_API_KEY.");
  }

  Logger.log("5. GEMINI:");
  Logger.log("Tổng số GEMINI API KEY khả dụng: " + config.GEMINI_KEYS_COUNT);

  Logger.log("========== KIỂM TRA HOÀN TẤT ==========");

  return {
    success: true,
    version: KB_CONFIG.VERSION,
    products: catalog.menu.length,
    drinkToppings: catalog.drinkToppings.length,
    snackToppings: catalog.snackToppings.length,
    config: config
  };
}