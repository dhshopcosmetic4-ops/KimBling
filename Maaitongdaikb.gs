
/************************************************************
 * KIM BLING AI SERVER - VERSION 4.1
 * Groq + Gemini Live + Google Sheets + POS_Data + Telegram
 *
 * SCRIPT PROPERTIES:
 * GROQ_API_KEY
 * GEMINI_API_KEY
 * TELEGRAM_BOT_TOKEN
 * TELEGRAM_CHAT_ID
 * AI_DATABASE_ID
 *
 * GOOGLE SHEET:
 * KIM BLING AI DATA
 ************************************************************/

const KB_CONFIG = {
  VERSION: "4.2",

  MODEL: "openai/gpt-oss-20b",
  GROQ_FALLBACK_MODELS: ["openai/gpt-oss-20b", "llama-3.1-8b-instant", "llama-3.3-70b-versatile"],
  GROQ_URL: "https://api.groq.com/openai/v1/chat/completions",

  TTS_MODEL: "gemini-3.8-flash-lite-tts",
  LIVE_MODEL: "gemini-3.8-live",
  GEMINI_TOKEN_URL:
    "https://generativelanguage.googleapis.com/v1alpha/auth_tokens",

  DB_ID: "16fLq_kqhacLzdMR-ccSaOgeqBfMqvUYQDdpiIx7H4gc",

  SESSION_HOURS: 24,
  UPSIZE_FEE: 10000,
  MAX_TOKENS: 350,

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
   7. GROQ
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
  const models = Array.isArray(KB_CONFIG.GROQ_FALLBACK_MODELS) && KB_CONFIG.GROQ_FALLBACK_MODELS.length
    ? KB_CONFIG.GROQ_FALLBACK_MODELS
    : [KB_CONFIG.MODEL];

  let lastErr = "Không gọi được Groq";

  for (let i = 0; i < models.length; i++) {
    const modelName = models[i];
    const response = UrlFetchApp.fetch(
      KB_CONFIG.GROQ_URL,
      {
        method: "post",
        contentType: "application/json",
        headers: {
          Authorization: "Bearer " + getGroqApiKey_()
        },
        payload: JSON.stringify({
          model: modelName,
          messages: messages,
          max_completion_tokens: KB_CONFIG.MAX_TOKENS,
          temperature: 0.35
        }),
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
    }
  }

  throw new Error(lastErr);
}

function testGroqConnection() {
  const reply = callGroq_([
    {
      role: "user",
      content:
        "Hãy trả lời đúng một câu: Kết nối Groq thành công."
    }
  ]);

  Logger.log(reply);
  return reply;
}

/* =========================================================
   8. TƯ VẤN SẢN PHẨM MỚI - GROQ + DỰ PHÒNG GEMINI + GEMINI TTS
   Không tạo đơn, không lưu đơn, không gọi Telegram.
========================================================= */

function kbCallGeminiFallback_(systemPrompt, userMessage) {
  const apiKey = getGeminiApiKey_();
  const models = ["gemini-3.8-flash", "gemini-4-hydrogen", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
  let lastErr = "Không gọi được Gemini dự phòng";

  for (let i = 0; i < models.length; i++) {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" +
      models[i] + ":generateContent?key=" + encodeURIComponent(apiKey);

    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: KB_CONFIG.MAX_TOKENS }
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
        json.candidates[0].content && json.candidates[0].content.parts &&
        json.candidates[0].content.parts[0]) {
      const txt = kbText_(json.candidates[0].content.parts[0].text);
      if (txt) return txt;
    }

    lastErr = (json.error && json.error.message) ? json.error.message : ("Gemini (" + models[i] + ") HTTP " + code);
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

  const apiKey = getGeminiApiKey_();
  const allowedVoices = ["Charon", "Puck", "Fenrir", "Kore", "Zephyr"];
  const selectedVoice = allowedVoices.indexOf(voiceName) !== -1 ? voiceName : "Charon";
  const isFemale = selectedVoice === "Kore" || selectedVoice === "Zephyr";

  const styleInstruction = isFemale
    ? "Giọng nữ miền Nam Việt Nam ngọt ngào, thân thiện, tự nhiên như nhân viên quán cà phê đang tư vấn khách."
    : "Giọng nam miền Nam Việt Nam ấm áp, tự nhiên, rõ ràng, thân thiện như nhân viên quán cà phê đang tư vấn khách.";

  const url = "https://generativelanguage.googleapis.com/v1beta/models/" +
    KB_CONFIG.TTS_MODEL + ":generateContent?key=" + encodeURIComponent(apiKey);

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

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const body = response.getContentText();
  const json = kbParseJson_(body, {});

  if (code < 200 || code >= 300) {
    throw new Error("Gemini TTS HTTP " + code + ": " + body.substring(0, 400));
  }

  const part = json.candidates && json.candidates[0] &&
    json.candidates[0].content && json.candidates[0].content.parts &&
    json.candidates[0].content.parts[0];

  const inline = part && part.inlineData ? part.inlineData : null;
  if (!inline || !inline.data) {
    throw new Error("Gemini TTS không trả về dữ liệu âm thanh.");
  }

  return {
    success: true,
    audioBase64: inline.data,
    mimeType: inline.mimeType || "audio/wav",
    voiceName: selectedVoice
  };
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

  const catalog = getAIProductCatalog_();
  const selected = data.selectedProduct || null;

  let selectedText = "";
  if (selected) {
    selectedText = [
      "SẢN PHẨM KHÁCH ĐANG XEM:",
      "Tên: " + kbText_(selected.name) + " | Giá: " + kbMoney_(selected.price) + "đ | Danh mục: " + kbText_(selected.category) +
      " | Hết hàng: " + (selected.isSoldOut ? "Có" : "Không")
    ].join("\n");
  }

  const matched = kbSearchProducts_(message, catalog);
  const matchedText = matched.map(function(p) {
    return "- " + p.name + " (" + p.price.toLocaleString("vi-VN") + "đ" + (p.isSoldOut ? ", Hết hàng" : "") + ")";
  }).join("\n");

  const system = [
    "Bạn là Kim, nhân viên tư vấn đồ uống và ăn vặt của KIM BLING COFFEE & TEA.",
    "Luôn xưng \"em\" và gọi khách là \"anh chị\". Trả lời tiếng Việt tự nhiên, thân thiện, lễ phép.",
    "CHỈ tư vấn đúng món, giá, topping nước và topping ăn vặt có trong danh sách thực đơn bên dưới.",
    "Tuyệt đối KHÔNG bịa tên món, giá, khuyến mãi ngoài thực đơn.",
    "Nếu sản phẩm hết hàng phải báo rõ.",
    "Không tự tạo đơn, không xin SĐT/địa chỉ, không hướng dẫn thanh toán.",
    "Nếu khách hỏi 1 món: tư vấn 2 đến 4 câu đầy đủ hương vị, giá và gợi ý 1-2 topping hợp. Nếu khách hỏi cả nhóm món: liệt kê gọn các món nổi bật kèm giá.",
    "",
    kbFormatCompactCatalog_(catalog.menu || [], catalog.drinkToppings || [], catalog.snackToppings || []),
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
   9. GEMINI LIVE - CẤP EPHEMERAL TOKEN
   API KEY THẬT CHỈ ĐƯỢC DÙNG TRÊN SERVER.
========================================================= */

function getGeminiApiKey_() {
  const key = kbGetProperty_("GEMINI_API_KEY");

  if (!key) {
    throw new Error(
      "Thiếu GEMINI_API_KEY trong Script Properties."
    );
  }

  return key;
}


function kbCreateGeminiLiveToken_() {
  const apiKey = getGeminiApiKey_();
  const catalog = getAIProductCatalog_();
  const compactMenu = kbFormatCompactCatalog_(
    catalog.menu || [],
    catalog.drinkToppings || [],
    catalog.snackToppings || []
  );

  const liveInstruction = [
    "Bạn là Kim, nhân viên nữ trẻ tuổi (22 tuổi), tính cách vui vẻ, hoạt bát, nhiệt tình và dễ thương của quán KIM BLING COFFEE & TEA tại Sài Gòn.",
    "PHONG CÁCH NÓI CHUYỆN: Luôn nói bằng giọng nữ miền Nam Việt Nam tự nhiên, trẻ trung, tươi tắn và gần gũi (như nhân viên quán cà phê đang trò chuyện trực tiếp với khách).",
    "Luôn xưng \"em\" và gọi khách là \"anh chị\", dùng tự nhiên các từ đệm miền Nam nhẹ nhàng như \"dạ\", \"nha\", \"hen\", \"ạ\". Trò chuyện lưu loát, hào hứng, ngắn gọn dễ nghe, không đọc như robot.",
    "QUY TẮC BẮT BUỘC: Chỉ giới thiệu đúng các món, giá tiền và topping có trong thực đơn bên dưới. Không tự bịa món ngoài danh sách.",
    "",
    compactMenu
  ].join("\n");

  const now = Date.now();
  const expireTime = new Date(now + 30 * 60 * 1000).toISOString();
  const newSessionExpireTime = new Date(now + 60 * 1000).toISOString();

  // Cấu trúc chuẩn Gemini Live Ephemeral Token (v1alpha/auth_tokens)
  const payload = {
    uses: 1,
    expireTime: expireTime,
    newSessionExpireTime: newSessionExpireTime,
    bidiGenerateContentSetup: {
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
    }
  };

  const response = UrlFetchApp.fetch(
    KB_CONFIG.GEMINI_TOKEN_URL,
    {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-goog-api-key": apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
  );

  const code = response.getResponseCode();
  const body = response.getContentText();
  const result = kbParseJson_(body, {});

  if (code < 200 || code >= 300) {
    throw new Error(
      "Gemini cấp token thất bại HTTP " +
      code + ": " + body.substring(0, 1000)
    );
  }

  if (!result.name) {
    throw new Error(
      "Gemini không trả về token hợp lệ: " +
      body.substring(0, 500)
    );
  }

  return {
    success: true,
    token: result.name,
    model: KB_CONFIG.LIVE_MODEL,
    expiresAt: result.expireTime || expireTime,
    newSessionExpiresAt:
      result.newSessionExpireTime || newSessionExpireTime
  };
}

function testGeminiLiveToken() {
  Logger.log("========== KIỂM TRA GEMINI LIVE ==========");

  const result = kbCreateGeminiLiveToken_();

  // Không ghi token bí mật vào Logger.
  Logger.log("CẤP TOKEN: THÀNH CÔNG");
  Logger.log("Model: " + result.model);
  Logger.log("Token tồn tại: " + !!result.token);
  Logger.log("Hết hạn: " + result.expiresAt);
  Logger.log(
    "Hạn bắt đầu phiên: " + result.newSessionExpiresAt
  );

  Logger.log("========== HOÀN TẤT ==========");

  return {
    success: true,
    model: result.model,
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
      return "Anh/chị có muốn nâng size ly lớn hơn không ạ? Phụ thu 10.000đ.";

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
      state.phase = "upsize";

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
    state.phase = "upsize";

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

      // API MỚI: LẤY DANH MỤC SẢN PHẨM
      case "get_catalog":
        result = kbGetCatalogAPI_();
        break;

      // API MỚI: TƯ VẤN BẰNG GROQ
      case "advisor_chat":
        result = kbAdvisorChat_(data);
        break;

      // API MỚI: ĐỌC GIỌNG NÓI GEMINI TTS
      case "tts":
        result = kbTextToSpeech_(data.text, kbText_(data.voiceName || "Charon"));
        break;

      // API MỚI: CẤP TOKEN GEMINI LIVE
      case "create_live_token":
      case "get_live_token":
        result = kbCreateGeminiLiveToken_();
        break;

      // CÁC ACTION CŨ
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

  const result = {
    GROQ_API_KEY: !!p.getProperty("GROQ_API_KEY"),
    GEMINI_API_KEY: !!p.getProperty("GEMINI_API_KEY"),
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
   19. KIỂM TRA TỔNG HỢP PHIÊN BẢN 4.1
========================================================= */

function testKimBlingAI40() {
  Logger.log("========== KIM BLING AI 4.1 ==========");

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

  if (config.GEMINI_API_KEY) {
    Logger.log("Đã có GEMINI_API_KEY.");
  } else {
    Logger.log("Chưa có GEMINI_API_KEY.");
  }

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
