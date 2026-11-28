var TARGET_FILE_NAME = "Lamvideo";
var TARGET_TAB_NAME = "KhoCongThuc";

function getSpreadsheet() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty("LAMVIDEO_SHEET_ID");
  if (savedId) {
    try {
      return SpreadsheetApp.openById(savedId);
    } catch (e) {}
  }

  var files = DriveApp.getFilesByName(TARGET_FILE_NAME);
  if (files.hasNext()) {
    var file = files.next();
    props.setProperty("LAMVIDEO_SHEET_ID", file.getId());
    return SpreadsheetApp.openById(file.getId());
  }

  var created = SpreadsheetApp.create(TARGET_FILE_NAME);
  props.setProperty("LAMVIDEO_SHEET_ID", created.getId());
  return created;
}

function getTargetSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(TARGET_TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TARGET_TAB_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "id",
      "createdAt",
      "type",
      "name",
      "category",
      "hookDnaJson",
      "scenePatternJson",
      "notes"
    ]);
  }
  return sheet;
}

// Bấm "Chạy" hàm này 1 lần trong Apps Script để kiểm tra & cấp quyền
function testKetNoi() {
  var sheet = getTargetSheet();
  Logger.log("Đã kết nối file: " + sheet.getParent().getName() + " | Tab: " + sheet.getName());
  Logger.log("Link Sheet: " + sheet.getParent().getUrl());
}

function safeParseJson(str) {
  if (!str || typeof str !== "string") return null;
  try {
    return JSON.parse(str);
  } catch (err) {
    return null;
  }
}

function doGet(e) {
  try {
    var sheet = getTargetSheet();
    var rows = sheet.getDataRange().getValues();
    var items = [];

    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (!r[0]) continue;
      items.push({
        id: String(r[0]),
        createdAt: r[1] ? String(r[1]) : "",
        type: r[2] ? String(r[2]) : "both",
        name: r[3] ? String(r[3]) : "Công thức AI",
        category: r[4] ? String(r[4]) : "Chung",
        hookDna: safeParseJson(r[5]),
        scenePattern: safeParseJson(r[6]),
        notes: r[7] ? String(r[7]) : ""
      });
    }

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, file: TARGET_FILE_NAME, sheet: TARGET_TAB_NAME, items: items })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: err.message, items: [] })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var sheet = getTargetSheet();
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var body = JSON.parse(raw);
    var item = body.item || {};

    sheet.appendRow([
      item.id || ("f_" + Date.now()),
      item.createdAt || new Date().toISOString(),
      item.type || "both",
      item.name || "Công thức AI",
      item.category || "Chung",
      item.hookDna ? JSON.stringify(item.hookDna) : "",
      item.scenePattern ? JSON.stringify(item.scenePattern) : "",
      item.notes || ""
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, file: TARGET_FILE_NAME, sheet: TARGET_TAB_NAME })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}