var TARGET_FILE_NAME = "Lamvideo";
var TARGET_TAB_NAME = "KhoCongThuc";

function getSpreadsheet(overrideId) {
  if (overrideId && String(overrideId).trim() !== "") {
    return SpreadsheetApp.openById(String(overrideId).trim());
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty("LAMVIDEO_SHEET_ID");
  if (savedId) {
    try {
      var fSaved = DriveApp.getFileById(savedId);
      if (!fSaved.isTrashed()) return SpreadsheetApp.openById(savedId);
    } catch (e) {}
  }

  var files = DriveApp.getFilesByName(TARGET_FILE_NAME);
  while (files.hasNext()) {
    var file = files.next();
    if (!file.isTrashed()) {
      props.setProperty("LAMVIDEO_SHEET_ID", file.getId());
      return SpreadsheetApp.openById(file.getId());
    }
  }

  var created = SpreadsheetApp.create(TARGET_FILE_NAME);
  props.setProperty("LAMVIDEO_SHEET_ID", created.getId());
  return created;
}

function getTargetSheet(overrideId) {
  var ss = getSpreadsheet(overrideId);
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
  return { ss: ss, sheet: sheet };
}

function testKetNoi() {
  var res = getTargetSheet("");
  Logger.log("File: " + res.ss.getName() + " | Tab: " + res.sheet.getName());
  Logger.log("URL: " + res.ss.getUrl());
}

function safeParseJson(str) {
  if (!str || typeof str !== "string") return null;
  try { return JSON.parse(str); } catch (err) { return null; }
}

function doGet(e) {
  try {
    var overrideId = (e && e.parameter && e.parameter.sheetId) ? e.parameter.sheetId : "";
    var ctx = getTargetSheet(overrideId);
    var rows = ctx.sheet.getDataRange().getValues();
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

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      fileName: ctx.ss.getName(),
      tabName: ctx.sheet.getName(),
      sheetUrl: ctx.ss.getUrl(),
      items: items
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: err.message,
      items: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var body = JSON.parse(raw);
    var overrideId = body.sheetId || "";
    var ctx = getTargetSheet(overrideId);
    var sheet = ctx.sheet;

    var existingRows = sheet.getDataRange().getValues();
    var existingIds = {};
    for (var i = 1; i < existingRows.length; i++) {
      if (existingRows[i][0]) existingIds[String(existingRows[i][0])] = true;
    }

    var incomingList = [];
    if (body.action === "syncBatch" && Array.isArray(body.items)) {
      incomingList = body.items;
    } else if (body.item) {
      incomingList = [body.item];
    }

    var addedCount = 0;
    for (var j = 0; j < incomingList.length; j++) {
      var item = incomingList[j] || {};
      var idStr = String(item.id || ("f_" + Date.now() + "_" + j));
      if (existingIds[idStr]) continue;
      existingIds[idStr] = true;

      sheet.appendRow([
        idStr,
        item.createdAt || new Date().toISOString(),
        item.type || "both",
        item.name || "Công thức AI",
        item.category || "Chung",
        item.hookDna ? JSON.stringify(item.hookDna) : "",
        item.scenePattern ? JSON.stringify(item.scenePattern) : "",
        item.notes || ""
      ]);
      addedCount++;
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      added: addedCount,
      fileName: ctx.ss.getName(),
      tabName: ctx.sheet.getName(),
      sheetUrl: ctx.ss.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}