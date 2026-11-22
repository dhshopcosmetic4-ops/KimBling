const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash'
];
const TEMP_FOLDER_NAME = 'AutoPost_Temp';

function doGet() {
  return jsonOut({ ok: true, msg: 'Google Apps Script Backend đang hoạt động!' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === 'ping') {
      return jsonOut({ ok: true, msg: 'Kết nối Google Apps Script thành công!' });
    }

    if (body.action === 'generate_copy') {
      if (!body.geminiKey) throw new Error('Thiếu Gemini API Key từ trình duyệt!');
      const data = callGeminiForCopy(body.geminiKey, body.productName, body.notes || '');
      return jsonOut({ ok: true, data });
    }

    if (body.action === 'publish_chunk') {
      return handleChunkUpload(body);
    }

    return jsonOut({ ok: false, error: 'Action không hợp lệ' });
  } catch (err) {
    return jsonOut({ ok: false, error: err.toString() });
  }
}

function handleChunkUpload(body) {
  const folder = getOrCreateTempFolder();
  const { uploadId, chunkIndex, totalChunks, isLast, chunkBase64, fileName, mimeType } = body;

  if (totalChunks === 1) {
    const bytes = Utilities.base64Decode(chunkBase64);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const tempFile = folder.createFile(blob);
    const savedMB = (tempFile.getSize() / 1048576).toFixed(2);
    const cleanup = deleteFileCleanly(tempFile);

    return jsonOut({
      ok: true,
      message: `GAS đã nhận đủ <b>${fileName}</b> (${savedMB} MB) trong "${TEMP_FOLDER_NAME}" và <b>${cleanup}</b>.`
    });
  }

  const partName = `${uploadId}_part_${String(chunkIndex).padStart(3, '0')}.txt`;
  folder.createFile(partName, chunkBase64, MimeType.PLAIN_TEXT);

  if (!isLast) {
    return jsonOut({ ok: true, receivedChunk: chunkIndex });
  }

  let fullBase64 = '';
  try {
    for (let i = 0; i < totalChunks; i++) {
      const pName = `${uploadId}_part_${String(i).padStart(3, '0')}.txt`;
      const it = folder.getFilesByName(pName);
      if (!it.hasNext()) throw new Error(`Thiếu mảnh dữ liệu số ${i + 1}`);
      const partFile = it.next();
      fullBase64 += partFile.getBlob().getDataAsString();
      deleteFileCleanly(partFile);
    }

    const bytes = Utilities.base64Decode(fullBase64);
    const finalBlob = Utilities.newBlob(bytes, mimeType, fileName);
    const tempFile = folder.createFile(finalBlob);
    const savedMB = (tempFile.getSize() / 1048576).toFixed(2);

    const cleanup = deleteFileCleanly(tempFile);
    return jsonOut({
      ok: true,
      message: `GAS đã ghép đủ ${totalChunks} phần của <b>${fileName}</b> (${savedMB} MB) trong "${TEMP_FOLDER_NAME}" và <b>${cleanup}</b>.`
    });
  } catch (err) {
    for (let i = 0; i < totalChunks; i++) {
      const pName = `${uploadId}_part_${String(i).padStart(3, '0')}.txt`;
      const it = folder.getFilesByName(pName);
      while (it.hasNext()) deleteFileCleanly(it.next());
    }
    throw err;
  }
}

function getOrCreateTempFolder() {
  const folders = DriveApp.getFoldersByName(TEMP_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(TEMP_FOLDER_NAME);
}

function deleteFileCleanly(file) {
  try {
    if (typeof Drive !== 'undefined' && Drive.Files) {
      if (typeof Drive.Files.delete === 'function') {
        Drive.Files.delete(file.getId());
        return 'đã xóa vĩnh viễn khỏi Drive';
      }
      if (typeof Drive.Files.remove === 'function') {
        Drive.Files.remove(file.getId());
        return 'đã xóa vĩnh viễn khỏi Drive';
      }
    }
  } catch (e) {}
  file.setTrashed(true);
  return 'đã xóa vào Thùng rác';
}

function callGeminiForCopy(apiKey, productName, notes) {
  const prompt = `Bạn là chuyên gia viết content bán hàng đa kênh bằng tiếng Việt.
Sản phẩm: "${productName}"
Ghi chú thêm: "${notes}"

Hãy tạo nội dung thu hút, tự nhiên, không sáo rỗng cho 3 nền tảng dưới đây. MỖI NỀN TẢNG ĐÚNG 5 HASHTAG liên quan nhất (bắt đầu bằng dấu #).
Trả về ĐÚNG định dạng JSON sau:
{
  "tiktok": {
    "caption": "Câu hook giật tít + mô tả cực ngắn gọn dưới 120 ký tự",
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
  },
  "facebook": {
    "title": "Dòng tiêu đề mở bài gây tò mò có emoji",
    "body": "Nội dung 3-4 dòng nêu lợi ích + lời kêu gọi bình luận/nhắn tin",
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
  },
  "youtube": {
    "title": "Tiêu đề chuẩn SEO hấp dẫn dưới 90 ký tự kèm #shorts",
    "description": "Mô tả chi tiết sản phẩm + từ khóa tìm kiếm",
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
  }
}`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  };

  let lastError = '';
  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const model = GEMINI_MODELS[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-goog-api-key': apiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const code = res.getResponseCode();
    const raw = res.getContentText();
    let json;
    try { json = JSON.parse(raw); } catch (e) { lastError = raw; continue; }

    if (code === 200 && json.candidates && json.candidates[0]?.content?.parts?.[0]?.text) {
      const parsed = JSON.parse(json.candidates[0].content.parts[0].text);
      parsed._usedModel = model;
      return parsed;
    }

    lastError = (json.error && json.error.message) ? json.error.message : `HTTP ${code}`;
    // Nếu lỗi do sai API Key thì báo ngay, không thử model khác
    if ((code === 400 || code === 401 || code === 403) &&
        (lastError.toLowerCase().includes('api key') || lastError.toLowerCase().includes('permission'))) {
      throw new Error(lastError);
    }
  }

  throw new Error(`Các máy chủ Gemini đều đang bận: ${lastError}`);
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}