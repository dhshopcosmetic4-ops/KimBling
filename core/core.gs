const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const TEMP_FOLDER_NAME = 'AutoPost_Temp';

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

    if (body.action === 'publish_test') {
      const bytes = Utilities.base64Decode(body.base64Data);
      const blob = Utilities.newBlob(bytes, body.mimeType, body.fileName);

      // 1. Cho vào thư mục tạm AutoPost_Temp để kiểm tra (không làm bừa bộn thư mục gốc)
      const folder = getOrCreateTempFolder();
      const tempFile = folder.createFile(blob);
      const savedSizeMB = (tempFile.getSize() / 1048576).toFixed(2);

      // (Giai đoạn 4: Ở đây ta sẽ truyền thẳng `blob` lên YouTube / Facebook / TikTok)

      // 2. Gửi/Kiểm tra xong -> Xóa ngay lập tức để không tốn dung lượng Drive
      const cleanupStatus = deleteFileCleanly(tempFile);

      return jsonOut({
        ok: true,
        message: `GAS đã nhận trọn vẹn file <b>${body.fileName}</b> (${savedSizeMB} MB) trong thư mục "${TEMP_FOLDER_NAME}" và <b>${cleanupStatus}</b>.`
      });
    }

    return jsonOut({ ok: false, error: 'Action không hợp lệ' });
  } catch (err) {
    return jsonOut({ ok: false, error: err.toString() });
  }
}

function getOrCreateTempFolder() {
  const folders = DriveApp.getFoldersByName(TEMP_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(TEMP_FOLDER_NAME);
}

function deleteFileCleanly(file) {
  try {
    // Nếu bạn có bật "Drive API" ở mục Dịch vụ (+) bên trái thì xóa vĩnh viễn luôn
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
  // Nếu chưa bật Drive API thì chuyển vào Thùng rác (Google tự dọn sau 30 ngày)
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  };

  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const json = JSON.parse(res.getContentText());
  if (json.error) throw new Error(json.error.message);

  return JSON.parse(json.candidates[0].content.parts[0].text);
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}