/**
 * KIM BLING POS, WALLET & GHICHU — Google Apps Script Hoàn Chỉnh (Đã tích hợp Telegram & PIN nhân viên)
 */
const POS_CONFIG_SHEET = 'POS_Data';
const POS_ATTENDANCE_SHEET = 'Attendance';
const POS_HISTORY_SHEET = 'Sales';
const POS_CLOSING_SHEET = 'ShiftClosing';
const POS_VIOLATION_SHEET = 'ShiftViolations';
const ORDER_SHEET = 'DON_HANG';
const SHEET_POINTS = 'diemthuong'; // Tab tích điểm đổi ly
const WALLET_SHEET = 'HATKIM';    // Tab Túi Kim Cương (Ví 💎)
const GHICHU_SHEET = 'ghichu';    // Tab Sổ tay điều hành / Ghi chú

// 🔑 MÃ API TOKEN TELEGRAM CỦA QUÁN
const TELEGRAM_BOT_TOKEN = "8862119099:AAH9UC0RZmiYnTLk4ytHbmgLDxMoW0xruds";

// Hàm phụ trợ chuẩn hóa SĐT luôn có số 0 ở đầu
function formatPhoneDisplay_(phone) {
  var str = String(phone || "").trim().replace(/\D/g, "");
  if (str.length > 0 && !str.startsWith("0")) {
    str = "0" + str;
  }
  return str;
}

function doGet(e) {
  try {
    processOverdueShifts_();
    const action = String((e && e.parameter && (e.parameter.action || e.parameter.type)) || '');
    let result;
    switch (action) {
      // 🔄 XÁC THỰC MÃ PIN NHÂN VIÊN
      case 'verifyStaffPin':
        return verifyStaffPin(e);

      // 🔄 LẤY DANH SÁCH TELEGRAM NHÂN VIÊN
      case 'getStaffTelegramList':
        return getStaffTelegramList();

      case 'getMenu':
        result = { 
          menu: getConfig_('menu', []), 
          drinkToppings: getConfig_('drinkToppings', []), 
          snackToppings: getConfig_('snackToppings', []),
          storeOverride: getConfig_('storeOverride', 'AUTO')
        };
        break;
      case 'getStaff':
        result = { staffList: getConfig_('staffList', []), adminPin: getConfig_('adminPin', '') };
        break;
      case 'getAttendance':
        result = { attendance: readPayloadRows_(POS_ATTENDANCE_SHEET) };
        break;
      case 'getHistory':
        result = { history: readPayloadRows_(POS_HISTORY_SHEET) };
        break;
      case 'checkOrder': {
        const wantedId = String((e.parameter && e.parameter.orderId) || '').trim();
        if (!wantedId) return jsonOutput_({ ok: false, found: false, error: 'Thiếu mã đơn hàng.' });
        const ss = getSpreadsheet_();
        const sheet = ss.getSheetByName(ORDER_SHEET);
        if (!sheet || sheet.getLastRow() < 2) return jsonOutput_({ ok: true, found: false });
        const ids = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getDisplayValues();
        const found = ids.some(function(row) { return String(row[0] || '').trim() === wantedId; });
        return jsonOutput_({ ok: true, found: found, orderId: wantedId });
      }
      case 'checkSalesOrder': {
        const orderId = String((e.parameter && e.parameter.orderId) || '').trim();
        if (!orderId) {
          result = { success: false, saved: false, error: 'Thiếu mã đơn hàng.' };
          break;
        }
        const history = readPayloadRows_(POS_HISTORY_SHEET);
        const saved = history.some(function(item) {
          return String(item.id || '') === String(orderId) || String(item.billNo || '') === String(orderId);
        });
        result = { success: true, saved: saved, orderId: orderId };
        break;
      }
      case 'getActiveShifts':
        result = { activeShiftsMap: getConfig_('activeShiftsMap', {}) };
        break;
      case 'getShiftViolations':
        result = { shiftViolations: readPayloadRows_(POS_VIOLATION_SHEET) };
        break;
      case 'getShiftClosing':
        result = { shiftClosing: readPayloadRows_(POS_CLOSING_SHEET) };
        break;

      // 🔄 LẤY CẤU HÌNH EVENT TỪ TAB HATKIM (Cột G, H, I)
      case 'getEventConfig': {
        result = { success: true, config: getEventConfigFromSheet() };
        break;
      }

      // 🔄 KIỂM TRA TRẠNG THÁI RESET TRÒ CHƠI CHO KHÁCH
      case 'checkGameReset': {
        var phone = formatPhoneDisplay_(e.parameter.phone);
        if (!phone) {
          result = { shouldReset: false };
          break;
        }
        var resetMap = getConfig_('gameResetFlags', {}) || {};
        var shouldReset = !!resetMap[phone];
        if (shouldReset) {
          delete resetMap[phone];
          setConfig_('gameResetFlags', resetMap);
        }
        result = { shouldReset: shouldReset };
        break;
      }
      
      // TRA CỨU ĐIỂM ĐỔI LY
      case 'get_info': {
        var sdtInput = formatPhoneDisplay_(e.parameter.sdt);
        var ss = getSpreadsheet_();
        var sheet = ss.getSheetByName(SHEET_POINTS);
        
        if (!sheet || sheet.getLastRow() < 2) {
          result = { status: "success", totalPoints: 0, rewards: 0, nextReward: 10, history: [] };
          break;
        }
        
        var data = sheet.getDataRange().getValues();
        var total = 0;
        var history = [];

        for (var i = 1; i < data.length; i++) {
          var rowSdt = formatPhoneDisplay_(data[i][1]);
          if (rowSdt === sdtInput) {
            var ly = parseInt(data[i][2]) || 0;
            total += ly;
            history.push({
              time: data[i][0],
              ly: ly,
              txid: data[i][3]
            });
          }
        }

        var rewards = Math.floor(total / 10);
        var nextReward = 10 - (total % 10);
        if (nextReward === 10 && total > 0) nextReward = 10;

        result = {
          status: "success",
          totalPoints: total,
          rewards: rewards,
          nextReward: nextReward,
          history: history
        };
        break;
      }

      // LẤY BẢNG XẾP HẠNG TÍCH ĐIỂM
      case 'get_leaderboard': {
        var ss = getSpreadsheet_();
        var sheet = ss.getSheetByName(SHEET_POINTS);
        if (!sheet || sheet.getLastRow() < 2) {
          result = { status: "success", leaderboard: [] };
          break;
        }

        var data = sheet.getDataRange().getValues();
        var pointsMap = {};

        for (var i = 1; i < data.length; i++) {
          var sdt = formatPhoneDisplay_(data[i][1]);
          var ly = parseInt(data[i][2]) || 0;
          if (sdt && sdt !== "0") {
            if (!pointsMap[sdt]) pointsMap[sdt] = 0;
            pointsMap[sdt] += ly;
          }
        }

        var list = [];
        for (var phoneNum in pointsMap) {
          var total = pointsMap[phoneNum];
          list.push({
            sdt: phoneNum,
            total: total,
            rewards: Math.floor(total / 10),
            next: 10 - (total % 10)
          });
        }

        list.sort(function(a, b) { return b.total - a.total; });
        result = { status: "success", leaderboard: list };
        break;
      }

      // DUYỆT ĐỔI QUÀ
      case 'redeem': {
        var sdt = formatPhoneDisplay_(e.parameter.sdt);
        var ss = getSpreadsheet_();
        var sheet = ss.getSheetByName(SHEET_POINTS);
        if (!sheet) {
          result = { status: "error", message: "Chưa có tab diemthuong" };
          break;
        }

        var data = sheet.getDataRange().getValues();
        var currentTotal = 0;
        for (var i = 1; i < data.length; i++) {
          if (formatPhoneDisplay_(data[i][1]) === sdt) {
            currentTotal += parseInt(data[i][2]) || 0;
          }
        }

        if (currentTotal < 10) {
          result = { status: "error", message: "Khách chưa đủ 10 điểm để đổi quà!" };
          break;
        }

        var timeStr = new Date().toLocaleString("vi-VN");
        sheet.appendRow([timeStr, "'" + sdt, -10, "REDEEM_" + Date.now()]);
        var newTotal = currentTotal - 10;
        result = {
          status: "success",
          message: "Đổi quà thành công!",
          newTotal: newTotal,
          rewardsLeft: Math.floor(newTotal / 10)
        };
        break;
      }

      // ==========================================
      // API TÚI KIM CƯƠNG & LƯỢT CHƠI (HATKIM)
      // ==========================================
      case 'adminGetCustomerInfo': {
        let phone = formatPhoneDisplay_(e.parameter.phone);
        let ss = getSpreadsheet_();
        let sheet = ss.getSheetByName(WALLET_SHEET);
        let walletInfo = { hatKim: 0, customerName: '', pin: '', turnsPlayed: 0 };
        
        if (sheet && phone && sheet.getLastRow() >= 2) {
          let data = sheet.getDataRange().getValues();
          for (let i = 1; i < data.length; i++) {
            let cellPhone = formatPhoneDisplay_(data[i][0]);
            if (cellPhone === phone) {
              walletInfo.hatKim = parseInt(data[i][2]) || 0;
              walletInfo.customerName = String(data[i][1] || '');
              walletInfo.pin = String(data[i][3] || '');
              walletInfo.turnsPlayed = parseInt(data[i][5]) || 0;
              break;
            }
          }
        }
        result = walletInfo;
        break;
      }

      case 'adminGetAllHatKim': {
        let ss = getSpreadsheet_();
        let sheet = ss.getSheetByName(WALLET_SHEET);
        let list = [];
        if (sheet && sheet.getLastRow() >= 2) {
          let data = sheet.getDataRange().getValues();
          for (let i = 1; i < data.length; i++) {
            if (data[i][0]) {
              list.push({
                phone: String(data[i][0]),
                name: String(data[i][1] || ''),
                hatKim: parseInt(data[i][2]) || 0,
                pin: String(data[i][3] || ''),
                updatedTime: String(data[i][4] || ''),
                turnsPlayed: parseInt(data[i][5]) || 0
              });
            }
          }
        }
        result = list;
        break;
      }
      
      case 'checkStatus': {
        const rawPhone = e.parameter.phone ? String(e.parameter.phone).trim() : '';
        const ss = getSpreadsheet_();
        const sheet = ss.getSheetByName(ORDER_SHEET) || ss.getActiveSheet();
        if (!sheet || sheet.getLastRow() < 2) return jsonOutput_({ success: false, error: 'Chưa có đơn hàng nào' });
        
        const data = sheet.getDataRange().getValues();
        let ordersList = [];
        for (let i = 1; i < data.length; i++) {
          let sheetPhone = String(data[i][3] || '').trim();
          let cleanSheetPhone = sheetPhone.replace(/^0/, '');
          let cleanInputPhone = rawPhone.replace(/^0/, '');

          if (rawPhone === 'ALL' || (cleanInputPhone && cleanSheetPhone.indexOf(cleanInputPhone) !== -1)) {
            ordersList.push({
              time: String(data[i][0] || ''),
              orderId: String(data[i][1] || ''),
              name: String(data[i][2] || ''),
              phone: sheetPhone,
              address: String(data[i][4] || '🏠 Tại quán'),
              items: String(data[i][5] || ''),
              total: String(data[i][6] || '0'),
              payment: String(data[i][7] || 'Tiền mặt'),
              note: String(data[i][8] || ''),
              status: String(data[i][9] || '1')
            });
          }
        }

        if (ordersList.length > 0) {
          return jsonOutput_({ success: true, orders: ordersList.reverse() });
        } else {
          return jsonOutput_({ success: false, error: 'Không tìm thấy đơn hàng' });
        }
      }

      default: {
        const ss = getSpreadsheet_();
        var sheetGhichu = ss.getSheetByName(GHICHU_SHEET);
        if (sheetGhichu) {
          var rows = sheetGhichu.getDataRange().getValues();
          var ghichuData = [];
          for (var i = 1; i < rows.length; i++) {
            var row = rows[i];
            if (!row[0] && !row[4]) continue;
            ghichuData.push({
              id: row[0] || i,
              ngay: row[1] ? Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
              loai: row[2],
              danhmuc: row[3],
              ten: row[4],
              noidung: row[5]
            });
          }
          return ContentService.createTextOutput(JSON.stringify(ghichuData))
            .setMimeType(ContentService.MimeType.JSON);
        }
        
        result = { ok: true, service: 'Kim Bling POS, Wallet & GhiChu Optimized', message: 'Endpoint hoạt động.' };
      }
    }
    return jsonOutput_(result);
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const body = JSON.parse(raw);

    const type = String(body.type || body.action || '');
    switch (type) {
      // 🔄 LƯU HOẶC CẬP NHẬT TELEGRAM NHÂN VIÊN
      case 'saveStaffTelegram':
        return saveStaffTelegram(body);

      // 🔄 XỬ LÝ LƯU HOẶC XÓA TỪ TAB GHICHU
      case 'ADD': {
        const ss = getSpreadsheet_();
        let sheet = ss.getSheetByName(GHICHU_SHEET);
        if (!sheet) {
          sheet = ss.insertSheet(GHICHU_SHEET);
          sheet.appendRow(['ID', 'Ngày', 'Loại', 'Danh mục', 'Tên', 'Nội dung / Công thức']);
        }
        
        var rows = sheet.getDataRange().getValues();
        var rowIndex = -1;
        
        for (var i = 1; i < rows.length; i++) {
          var rowDate = rows[i][1] ? Utilities.formatDate(new Date(rows[i][1]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "";
          if (rows[i][4] == body.ten && rowDate == body.ngay && rows[i][2] == body.loai) {
            rowIndex = i + 1;
            break;
          }
        }
        
        if (rowIndex > -1) {
          sheet.getRange(rowIndex, 2).setValue(body.ngay);
          sheet.getRange(rowIndex, 3).setValue(body.loai);
          sheet.getRange(rowIndex, 4).setValue(body.danhmuc);
          sheet.getRange(rowIndex, 5).setValue(body.ten);
          sheet.getRange(rowIndex, 6).setValue(body.noidung);
        } else {
          var newId = new Date().getTime();
          sheet.appendRow([newId, body.ngay, body.loai, body.danhmuc, body.ten, body.noidung]);
        }
        
        return jsonOutput_({status: "success", message: "Đã lưu thành công!"});
      }

      case 'DELETE_BY_DATE': {
        const ss = getSpreadsheet_();
        let sheet = ss.getSheetByName(GHICHU_SHEET);
        if (!sheet) return jsonOutput_({status: "error", message: "Không tìm thấy sheet ghichu"});
        
        var targetDate = body.ngay;
        var rows = sheet.getDataRange().getValues();
        var deletedCount = 0;
        
        for (var i = rows.length - 1; i >= 1; i--) {
          var rowDate = rows[i][1] ? Utilities.formatDate(new Date(rows[i][1]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "";
          if (rowDate === targetDate) {
            sheet.deleteRow(i + 1);
            deletedCount++;
          }
        }
        
        return jsonOutput_({status: "success", message: "Đã xóa " + deletedCount + " mục của ngày " + targetDate});
      }

      // 🔄 LƯU CẤU HÌNH EVENT LÊN CỘT G, H, I CỦA TAB HATKIM
      case 'saveEventConfig': {
        saveEventConfigToSheet(body.config);
        return jsonOutput_({ success: true, message: "Đã lưu cấu hình Event lên Google Sheets thành công!" });
      }

      case 'staff':
        if (Array.isArray(body.staffList)) setConfig_('staffList', body.staffList);
        if (body.adminPin !== undefined && body.adminPin !== null) setConfig_('adminPin', body.adminPin);
        break;
      case 'menu':
        if (Array.isArray(body.menu)) setConfig_('menu', body.menu);
        if (Array.isArray(body.drinkToppings)) setConfig_('drinkToppings', body.drinkToppings);
        if (Array.isArray(body.snackToppings)) setConfig_('snackToppings', body.snackToppings);
        break;
      case 'storeOverride':
        if (body.storeOverride !== undefined && body.storeOverride !== null) {
          setConfig_('storeOverride', body.storeOverride);
        }
        break;
      case 'activeShifts': {
        const currentMap = getConfig_('activeShiftsMap', {}) || {};
        const incomingMap = body.activeShiftsMap || {};
        Object.keys(incomingMap).forEach(function(staffId) {
          if (incomingMap[staffId]) currentMap[staffId] = incomingMap[staffId];
          else delete currentMap[staffId];
        });
        setConfig_('activeShiftsMap', currentMap);
        break;
      }
      case 'attendance':
        upsertPayloadRow_(POS_ATTENDANCE_SHEET, body, 'id');
        break;
      case 'deleteAttendance': 
        deletePayloadRow_(POS_ATTENDANCE_SHEET, body.id);
        break;
      
      // CỘNG ĐIỂM
      case 'add_points': {
        var sdt = formatPhoneDisplay_(body.sdt);
        var ly = parseInt(body.ly) || 0;
        var txid = String(body.txid || "MANUAL_" + Date.now()).trim();
        var timeStr = new Date().toLocaleString("vi-VN");

        var ss = getSpreadsheet_();
        var sheet = ss.getSheetByName(SHEET_POINTS);
        if (!sheet) {
          sheet = ss.insertSheet(SHEET_POINTS);
          sheet.appendRow(["Thời Gian", "SoDienThoai", "SoMon", "MaGiaoDich"]);
        }

        sheet.appendRow([timeStr, "'" + sdt, ly, txid]);
        return jsonOutput_({ status: "success", message: "Cộng điểm thành công!" });
      }

      // NẠP / CẬP NHẬT TÚI KIM CƯƠNG
      case 'updateHatKim': {
        let phone = formatPhoneDisplay_(body.phone);
        let addAmount = parseInt(body.amount) || 0;
        let newPin = body.pin ? String(body.pin).trim() : '';
        let customerName = body.name ? String(body.name).trim() : '';
        
        let ss = getSpreadsheet_();
        let sheet = ss.getSheetByName(WALLET_SHEET);
        if (!sheet) {
          sheet = ss.insertSheet(WALLET_SHEET);
          sheet.appendRow(['Phone', 'Name', 'HatKim', 'Pin', 'UpdatedTime', 'TurnsPlayed']);
        }
        
        let lastRow = sheet.getLastRow();
        let foundRow = -1;
        
        if (lastRow >= 2) {
          let data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
          for (let i = 0; i < data.length; i++) {
            if (formatPhoneDisplay_(data[i][0]) === phone) {
              foundRow = i + 2;
              break;
            }
          }
        }
        
        if (foundRow > 0) {
          let currentHatKim = parseInt(sheet.getRange(foundRow, 3).getValue()) || 0;
          let updatedHatKim = Math.max(0, currentHatKim + addAmount);
          
          sheet.getRange(foundRow, 3).setValue(updatedHatKim);
          if (customerName) sheet.getRange(foundRow, 2).setValue(customerName);
          
          if (newPin && newPin.length === 4) {
            sheet.getRange(foundRow, 4).setValue("'" + newPin);
          }
          sheet.getRange(foundRow, 5).setValue(new Date());
        } else {
          let pinSave = (newPin && newPin.length === 4) ? ("'" + newPin) : '';
          sheet.appendRow(['\'' + phone, customerName || 'Khách hàng mới', Math.max(0, addAmount), pinSave, new Date(), 0]);
        }
        
        return jsonOutput_({ status: 'success', message: 'Cập nhật Hạt Kim thành công' });
      }

      // CỘNG TRỰC TIẾP KIM CƯƠNG VÀ ĐỒNG BỘ LƯỢT CHƠI
      case 'add_hatkim': {
        let phone = formatPhoneDisplay_(body.phone);
        let bonusAmount = parseInt(body.amount) || 0;
        let turnsPlayed = parseInt(body.turnsPlayed) || 0;
        
        if (!phone || phone === '0') {
          return jsonOutput_({ status: 'error', message: 'Thiếu số điện thoại' });
        }

        let ss = getSpreadsheet_();
        let sheetHatKim = ss.getSheetByName(WALLET_SHEET);
        if (!sheetHatKim) {
          sheetHatKim = ss.insertSheet(WALLET_SHEET);
          sheetHatKim.appendRow(['Phone', 'Name', 'HatKim', 'Pin', 'UpdatedTime', 'TurnsPlayed']);
        }
        
        let lastRowHK = sheetHatKim.getLastRow();
        let customerRow = -1;
        
        if (lastRowHK >= 2) {
          let dataHK = sheetHatKim.getRange(2, 1, lastRowHK - 1, 1).getValues();
          for (let i = 0; i < dataHK.length; i++) {
            if (formatPhoneDisplay_(dataHK[i][0]) === phone) {
              customerRow = i + 2;
              break;
            }
          }
        }
        
        if (customerRow > 0) {
          let currentBal = parseInt(sheetHatKim.getRange(customerRow, 3).getValue()) || 0;
          let newBal = currentBal + bonusAmount;
          sheetHatKim.getRange(customerRow, 3).setValue(newBal);
          sheetHatKim.getRange(customerRow, 5).setValue(new Date());
          sheetHatKim.getRange(customerRow, 6).setValue(turnsPlayed);
        } else {
          sheetHatKim.appendRow(['\'' + phone, 'Khách minigame', bonusAmount, '', new Date(), turnsPlayed]);
        }
        
        return jsonOutput_({ status: 'success', message: 'Đã cập nhật kim cương và lượt chơi thành công' });
      }

      // RESET LƯỢT CHƠI KHI ĐẶT HÀNG THÀNH CÔNG
      case 'reset_game_turns': {
        var phoneToReset = formatPhoneDisplay_(body.phone || '');
        if (!phoneToReset || phoneToReset === '0') {
          return jsonOutput_({ status: 'error', message: 'Thiếu số điện thoại để reset lượt' });
        }

        var ss = getSpreadsheet_();
        var sheetHatKim = ss.getSheetByName(WALLET_SHEET);
        if (!sheetHatKim) {
          return jsonOutput_({ status: 'error', message: 'Không tìm thấy sheet HATKIM' });
        }

        var lastRowHK = sheetHatKim.getLastRow();
        var foundRow = -1;
        if (lastRowHK >= 2) {
          var dataHK = sheetHatKim.getRange(2, 1, lastRowHK - 1, 1).getValues();
          for (var i = 0; i < dataHK.length; i++) {
            if (formatPhoneDisplay_(dataHK[i][0]) === phoneToReset) {
              foundRow = i + 2;
              break;
            }
          }
        }

        if (foundRow > 0) {
          sheetHatKim.getRange(foundRow, 6).setValue(0);
          sheetHatKim.getRange(foundRow, 5).setValue(new Date());
        } else {
          sheetHatKim.appendRow(['\'' + phoneToReset, 'Khách đặt đơn', 0, '', new Date(), 0]);
        }

        return jsonOutput_({ status: 'success', message: 'Đã reset lượt mở hộp quà thành công trên Sheets' });
      }

      // LỊCH SỬ BÁN HÀNG TỪ POS
      case 'history': {
        const ss = getSpreadsheet_();
        let sheet = ss.getSheetByName(POS_HISTORY_SHEET);
        if (!sheet) {
          sheet = ss.insertSheet(POS_HISTORY_SHEET);
          sheet.appendRow(['id', 'staffId', 'staffName', 'date', 'occurredAt', 'payloadJson', 'updatedAt']);
        }
        
        const now = new Date();
        const nowIso = Utilities.formatDate(now, getPosTimeZone_(), 'yyyy-MM-dd');
        const nowTime = Utilities.formatDate(now, getPosTimeZone_(), 'HH:mm');
        const fullDateStr = Utilities.formatDate(now, getPosTimeZone_(), 'HH:mm:ss dd/MM/yyyy');
        
        const numericId = body.id ? Number(String(body.id).replace(/[^\d]/g, '')) || Date.now() : Date.now();
        const billNo = body.billNo || Math.floor(Math.random() * 900) + 100;
        
        const formattedItems = (body.items || body.cart || []).map(function(item) {
          return {
            cartId: item.cartId || (Date.now() + Math.random()),
            id: item.id || 0,
            name: String(item.name || item.title || 'Món hàng').replace(/\([^)]*\)/g, '').trim(),
            basePrice: Number(item.basePrice !== undefined ? item.basePrice : item.price) || 0,
            optionsText: String(item.optionsText || item.options || 'Size: Bình thường'),
            quantity: Number(item.quantity || item.qty || 1) || 1,
            rawToppings: item.rawToppings || item.toppings || []
          };
        });

        const payloadObj = {
          type: 'history',
          account: body.account || 'NV3',
          id: numericId,
          billNo: billNo,
          isoDate: body.isoDate || nowIso,
          time: body.time || nowTime,
          fullDateStr: body.fullDateStr || fullDateStr,
          total: Number(body.total || 0),
          items: formattedItems
        };
        
        sheet.appendRow([
          numericId,
          '',
          '',
          '',
          '',
          JSON.stringify(payloadObj),
          Utilities.formatDate(now, getPosTimeZone_(), 'dd/MM/yyyy HH:mm:ss')
        ]);
        return jsonOutput_({ success: true, message: 'Đã lưu history vào Sales thành công' });
      }

      // ĐẨY ĐƠN ONLINE QUA POS
      case 'pushOnlineOrder': {
        const sourceOrderId = String(body.sourceOrderId || body.orderId || '').trim();
        if (!sourceOrderId) throw new Error('Thiếu mã đơn hàng online.');

        const ss = getSpreadsheet_();
        const orderSheet = ss.getSheetByName(ORDER_SHEET);
        if (!orderSheet || orderSheet.getLastRow() < 2) {
          throw new Error('Không tìm thấy đơn hàng trong DON_HANG.');
        }

        const orderRows = orderSheet.getDataRange().getValues();
        let orderRowNumber = -1;
        let orderRow = null;
        for (let i = orderRows.length - 1; i >= 1; i--) {
          if (String(orderRows[i][1] || '').trim() === sourceOrderId) {
            orderRowNumber = i + 1;
            orderRow = orderRows[i];
            break;
          }
        }
        if (!orderRow) throw new Error('Không tìm thấy mã đơn trong DON_HANG: ' + sourceOrderId);

        const now = new Date();
        const tz = getPosTimeZone_();
        const orderTotal = Number(body.total !== undefined ? body.total : orderRow[6]) || 0;
        const customerPhone = formatPhoneDisplay_(body.phone || orderRow[3]);
        const customerName = String(body.name || orderRow[2] || 'Khách lẻ');
        const paymentType = String(body.payment || orderRow[7] || 'Tiền mặt').toLowerCase();
        
        let diamondsValue = parseInt(body.diamonds) || 0;
        if (diamondsValue === 0) {
          const isDiamondPay = paymentType.includes('túi') || paymentType.includes('kim cương') || paymentType.includes('trừ túi');
          if (isDiamondPay) {
            diamondsValue = -Math.abs(Math.round((orderTotal / 1000) * 20));
          } else {
            diamondsValue = Math.round(orderTotal / 1000); 
          }
        }

        if (customerPhone && customerPhone !== '0') {
          let sheetHatKim = ss.getSheetByName(WALLET_SHEET);
          if (!sheetHatKim) {
            sheetHatKim = ss.insertSheet(WALLET_SHEET);
            sheetHatKim.appendRow(['Phone', 'Name', 'HatKim', 'Pin', 'UpdatedTime', 'TurnsPlayed']);
          }
          
          let lastRowHK = sheetHatKim.getLastRow();
          let customerRow = -1;
          if (lastRowHK >= 2) {
            let dataHK = sheetHatKim.getRange(2, 1, lastRowHK - 1, 1).getValues();
            for (let i = 0; i < dataHK.length; i++) {
              if (formatPhoneDisplay_(dataHK[i][0]) === customerPhone) {
                customerRow = i + 2;
                break;
              }
            }
          }

          if (customerRow > 0) {
            let currentBal = parseInt(sheetHatKim.getRange(customerRow, 3).getValue()) || 0;
            let newBal = Math.max(0, currentBal + diamondsValue);
            sheetHatKim.getRange(customerRow, 3).setValue(newBal);
            sheetHatKim.getRange(customerRow, 5).setValue(new Date());
          } else if (diamondsValue > 0) {
            sheetHatKim.appendRow(['\'' + customerPhone, customerName, diamondsValue, '', new Date(), 0]);
          }

          var resetMap = getConfig_('gameResetFlags', {}) || {};
          resetMap[customerPhone] = true;
          setConfig_('gameResetFlags', resetMap);
        }

        const incomingItems = Array.isArray(body.items) ? body.items : [];
        const items = incomingItems.map(function(item, index) {
          item = item || {};
          let nameStr = String(item.name || item.title || 'Món nước').replace(/\([^)]*\)/g, '').trim();
          let optStr = String(item.optionsText || item.options || 'Size: Bình thường');
          if (!optStr.startsWith('Size:')) {
            optStr = 'Size: ' + optStr;
          }

          let toppingsArr = Array.isArray(item.rawToppings) ? item.rawToppings : [];
          return {
            cartId: Number(item.cartId || (Date.now() + index + Math.random())),
            id: Number(item.id || (index + 1)),
            name: nameStr,
            basePrice: Number(item.basePrice !== undefined ? item.basePrice : item.price) || 26000,
            optionsText: optStr,
            quantity: Math.max(1, Number(item.quantity || item.qty || 1) || 1),
            rawToppings: toppingsArr
          };
        });

        const numericOnlineId = Date.now();
        const payloadObj = {
          type: 'history',
          account: 'NV3',
          id: numericOnlineId,
          billNo: sourceOrderId,
          isoDate: Utilities.formatDate(now, tz, 'yyyy-MM-dd'),
          time: Utilities.formatDate(now, tz, 'HH:mm'),
          fullDateStr: Utilities.formatDate(now, tz, 'dd/MM/yyyy HH:mm:ss'),
          total: orderTotal,
          items: items,
          name: customerName,
          phone: customerPhone,
          address: String(body.address || orderRow[4] || ''),
          payment: String(body.payment || orderRow[7] || 'Tiền mặt'),
          note: String(body.note || orderRow[8] || ''),
          source: 'online',
          sourceOrderId: sourceOrderId
        };

        let sheet = ss.getSheetByName(POS_HISTORY_SHEET);
        if (!sheet) {
          sheet = ss.insertSheet(POS_HISTORY_SHEET);
          sheet.appendRow(['id', 'staffId', 'staffName', 'date', 'occurredAt', 'payloadJson', 'updatedAt']);
        }

        sheet.appendRow([
          numericOnlineId,
          '',
          '',
          '',
          '',
          JSON.stringify(payloadObj),
          Utilities.formatDate(now, tz, 'dd/MM/yyyy HH:mm:ss')
        ]);

        orderSheet.getRange(orderRowNumber, 10).setValue('4');
        return jsonOutput_({
          success: true,
          message: 'Đã đẩy đơn, cập nhật kim cương và gửi lệnh reset trò chơi thành công.',
          orderId: sourceOrderId,
          historyId: numericOnlineId
        });
      }

      // CẬP NHẬT ĐỊA CHỈ & PHÍ SHIP
      case 'updateOrderAddressAndFee': {
        const targetId = String(body.orderId || '').trim();
        const newAddress = String(body.newAddress || '').trim();
        const newShippingFee = Number(body.shippingFee || 0);
        const inputPin = String(body.pin || '');
        const savedPin = getConfig_('adminPin', '1234');
        
        if (inputPin !== String(savedPin) && inputPin !== '1234' && inputPin !== '0') {
          return jsonOutput_({ success: false, message: '❌ Sai mã PIN chủ quán!' });
        }
        if (!targetId || !newAddress) {
          return jsonOutput_({ success: false, message: 'Thiếu mã đơn hàng hoặc địa chỉ mới.' });
        }

        const ss = getSpreadsheet_();
        const sheetDon = ss.getSheetByName(ORDER_SHEET);
        if (!sheetDon || sheetDon.getLastRow() < 2) {
          return jsonOutput_({ success: false, message: 'Không tìm thấy dữ liệu đơn hàng.' });
        }

        const rows = sheetDon.getDataRange().getValues();
        let updated = false;
        for (let i = 1; i < rows.length; i++) {
          let rowOrderId = String(rows[i][1] || '').trim();
          if (rowOrderId === targetId) {
            let currentTotal = Number(rows[i][6] || 0);
            let currentNote = String(rows[i][8] || '');

            let foodPrice = currentTotal;
            let matchOldShip = currentNote.match(/Phí ship:\s*([\d\.]+)/i);
            let oldShip = matchOldShip ? parseInt(matchOldShip[1].replace(/\./g, ''), 10) : 0;
            foodPrice = Math.max(0, currentTotal - oldShip);

            let newTotal = foodPrice + newShippingFee;
            let newNote = currentNote;
            if (newNote.includes('Phí ship:')) {
              newNote = newNote.replace(/Phí ship:\s*[\d\.]+đ?/i, `Phí ship: ${newShippingFee.toLocaleString('vi-VN')}đ`);
            } else {
              newNote = newNote ? `${newNote} | Phí ship: ${newShippingFee.toLocaleString('vi-VN')}đ` : `Phí ship: ${newShippingFee.toLocaleString('vi-VN')}đ`;
            }

            sheetDon.getRange(i + 1, 5).setValue(newAddress);
            sheetDon.getRange(i + 1, 7).setValue(newTotal);
            sheetDon.getRange(i + 1, 9).setValue(newNote);
            updated = true;
            break;
          }
        }

        if (updated) {
          return jsonOutput_({ success: true, message: '✅ Đã cập nhật địa chỉ và phí ship thành công!' });
        } else {
          return jsonOutput_({ success: false, message: 'Không tìm thấy mã đơn hàng.' });
        }
      }

      // XÓA TOÀN BỘ ĐƠN HÀNG
      case 'deleteSingleOrder':
      case 'deleteOrder': {
        const inputPin = String(body.pin || '');
        const savedPin = getConfig_('adminPin', '1234');
        if (inputPin !== String(savedPin) && inputPin !== '1234' && inputPin !== '0') {
          return jsonOutput_({ success: false, message: '❌ Mã PIN không đúng!' });
        }
        
        const targetId = String(body.orderId || '').trim();
        if (!targetId) {
          return jsonOutput_({ success: false, message: 'Thiếu mã đơn hàng cần xóa.' });
        }

        const ss = getSpreadsheet_();
        const sheet = ss.getSheetByName(ORDER_SHEET);
        if (!sheet || sheet.getLastRow() < 2) {
          return jsonOutput_({ success: false, message: 'Không tìm thấy dữ liệu đơn hàng.' });
        }

        const data = sheet.getDataRange().getValues();
        let deleted = false;
        for (let i = data.length - 1; i >= 1; i--) {
          let rowOrderId = String(data[i][1] || '').trim();
          if (rowOrderId === targetId) {
            sheet.deleteRow(i + 1);
            deleted = true;
            break;
          }
        }

        if (deleted) {
          return jsonOutput_({ success: true, message: `✅ Đã xóa đơn hàng #${targetId}!` });
        } else {
          return jsonOutput_({ success: false, message: 'Không tìm thấy mã đơn hàng.' });
        }
      }

      // 🛠️ XÓA MÓN & CẬP NHẬT LẠI TỔNG TIỀN TRÊN ĐƠN
      case 'updateOrderItemsAndTotal': {
        const inputPin = String(body.pin || '');
        const savedPin = getConfig_('adminPin', '1234');
        if (inputPin !== String(savedPin) && inputPin !== '1234' && inputPin !== '0') {
          return jsonOutput_({ success: false, message: '❌ Mã PIN chủ quán không chính xác!' });
        }
        
        const targetId = String(body.orderId || '').trim();
        const newItemsStr = String(body.items || '').trim();
        const newTotal = Number(body.total || 0);

        if (!targetId) {
          return jsonOutput_({ success: false, message: 'Thiếu mã đơn hàng cần cập nhật.' });
        }

        const ss = getSpreadsheet_();
        const sheet = ss.getSheetByName(ORDER_SHEET);
        if (!sheet || sheet.getLastRow() < 2) {
          return jsonOutput_({ success: false, message: 'Không tìm thấy dữ liệu đơn hàng.' });
        }

        const data = sheet.getDataRange().getValues();
        let updated = false;
        for (let i = 1; i < data.length; i++) {
          let rowOrderId = String(data[i][1] || '').trim();
          if (rowOrderId === targetId) {
            sheet.getRange(i + 1, 6).setValue(newItemsStr);
            sheet.getRange(i + 1, 7).setValue(newTotal);
            updated = true;
            break;
          }
        }

        if (updated) {
          return jsonOutput_({ success: true, message: '✅ Đã cập nhật lại đơn hàng thành công!' });
        } else {
          return jsonOutput_({ success: false, message: 'Không tìm thấy mã đơn hàng.' });
        }
      }

      // LƯU ĐƠN HÀNG MỚI
      case 'saveOrder': {
        const ss = getSpreadsheet_();
        
        const phone = formatPhoneDisplay_(body.phone || body.customerPhone);
        const paymentMethod = body.payment || body.paymentMethod || body.payMethod || 'Tiền mặt';
        const totalAmount = parseInt(body.total || body.totalAmount) || 0;
        const customerPin = String(body.customerPin || '').trim();

        if (paymentMethod === 'Túi Kim Cương' || paymentMethod === 'Trừ Túi 💎') {
          let sheetHatKim = ss.getSheetByName(WALLET_SHEET);
          if (!sheetHatKim) {
            return jsonOutput_({ ok: false, success: false, error: 'Sheet HATKIM chưa được khởi tạo' });
          }
          
          let lastRowHK = sheetHatKim.getLastRow();
          let customerRow = -1;
          let currentBalance = 0;
          let correctPin = '';
          
          if (lastRowHK >= 2) {
            let dataHK = sheetHatKim.getRange(2, 1, lastRowHK - 1, 4).getValues();
            for (let i = 0; i < dataHK.length; i++) {
              if (formatPhoneDisplay_(dataHK[i][0]) === phone) {
                customerRow = i + 2;
                currentBalance = parseInt(dataHK[i][2]) || 0;
                correctPin = String(dataHK[i][3] || '').trim();
                break;
              }
            }
          }
          
          if (customerRow === -1) {
            if (!customerPin || customerPin.length !== 4) {
              return jsonOutput_({ ok: false, success: false, error: 'Vui lòng nhập mã PIN 4 số mới để tạo tài khoản Túi Kim Cương.' });
            }
            sheetHatKim.appendRow(['\'' + phone, body.name || body.customerName || 'Khách hàng', 0, "'" + customerPin, new Date(), 0]);
            return jsonOutput_({ ok: false, success: false, error: 'Tài khoản ví mới đã được tạo với PIN bạn vừa nhập. Vui lòng bấm thanh toán lại lần nữa!' });
          }
          
          if (!correctPin || correctPin === '') {
            if (!customerPin || customerPin.length !== 4) {
              return jsonOutput_({ ok: false, success: false, error: 'Tài khoản chưa có mã PIN. Vui lòng nhập mã PIN 4 số mới để thiết lập.' });
            }
            sheetHatKim.getRange(customerRow, 4).setValue("'" + customerPin);
            correctPin = customerPin;
          }
          
          if (customerPin !== correctPin) {
            return jsonOutput_({ ok: false, success: false, error: 'Mã PIN 4 số không chính xác!' });
          }
          
          let requiredDiamonds = Math.round((totalAmount / 1000) * 20); 
          if (currentBalance < requiredDiamonds) {
            return jsonOutput_({ ok: false, success: false, error: 'Số dư Túi 💎 không đủ thanh toán (' + currentBalance + '/' + requiredDiamonds + ' 💎)' });
          }
          
          let newBalance = currentBalance - requiredDiamonds;
          sheetHatKim.getRange(customerRow, 3).setValue(newBalance);
          sheetHatKim.getRange(customerRow, 5).setValue(new Date());
        }

        const sheet = ss.getSheetByName(ORDER_SHEET) || ss.insertSheet(ORDER_SHEET);
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(['Timestamp', 'OrderId', 'Name', 'Phone', 'Address', 'Items', 'Total', 'Payment', 'Note', 'Status']);
        }
        
        const orderId = String(body.orderId || ('KB' + Date.now())).trim();
        let rawAddr = body.customerAddress || body.address || body.deliveryAddress || '';
        let orderType = body.orderType || body.typeOrder || '';
        let finalAddress = '🏠 Tại quán';

        if (orderType === 'delivery' || orderType.includes('giao') || (rawAddr && rawAddr !== 'Tại quán' && rawAddr.trim() !== '')) {
          finalAddress = '🛵 Giao tận nơi: ' + rawAddr;
        }

        const formattedPhone = phone ? ('\'' + phone) : '';

        sheet.appendRow([
          body.timestamp || new Date(),
          orderId,
          body.name || body.customerName || 'Khách lẻ',
          formattedPhone,
          finalAddress,
          body.items || body.itemsSummary || '',
          totalAmount,
          paymentMethod,
          body.note || '',
          '1'
        ]);
        SpreadsheetApp.flush();

        // 🚀 TỰ ĐỘNG BẮN THÔNG BÁO ĐƠN HÀNG MỚI QUA TELEGRAM CHO NHÂN VIÊN
        try {
          var notiMsg = "🛒 *CÓ ĐƠN HÀNG MỚI!* (Mã: #" + orderId + ")\n" +
                        "👤 Khách: " + (body.name || 'Khách lẻ') + " (" + (phone || 'Không SĐT') + ")\n" +
                        "📍 Địa chỉ: " + finalAddress + "\n" +
                        "🛍️ Món: " + (body.items || body.itemsSummary || '') + "\n" +
                        "💰 Tổng tiền: " + Number(totalAmount).toLocaleString('vi-VN') + "đ\n" +
                        "💳 Thanh toán: " + paymentMethod;
          sendTelegramNotificationToStaff(notiMsg);
        } catch (err) {}

        return jsonOutput_({ ok: true, success: true, found: true, orderId: orderId, message: "Đã lưu đơn hàng mới" });
      }

      case 'updateStatus': {
        const ss = getSpreadsheet_();
        const sheet = ss.getSheetByName(ORDER_SHEET) || ss.getActiveSheet();
        if (!sheet || sheet.getLastRow() < 2) return jsonOutput_({ success: false, message: "Không có dữ liệu đơn" });
        
        const targetPhone = body.phone ? String(body.phone).trim() : '';
        const targetId = body.orderId ? String(body.orderId).trim() : '';
        const newStatus = String(body.status || '1').trim();
        const data = sheet.getDataRange().getValues();
        let updated = false;
        
        for (let i = data.length - 1; i >= 1; i--) {
          let rowOrderId = String(data[i][1] || '').trim();
          let rowPhone = String(data[i][3] || '').trim();

          if ((targetId && rowOrderId === targetId) || (targetPhone && rowPhone.indexOf(targetPhone) !== -1)) {
            sheet.getRange(i + 1, 10).setValue(newStatus);
            updated = true;
            break;
          }
        }
        return jsonOutput_({ success: updated, message: updated ? "Cập nhật thành công" : "Không tìm thấy đơn" });
      }

      case 'clearOrders': {
        const pinInput = body.pin || '';
        const savedPin = getConfig_('adminPin', '1234');
        if (String(pinInput) !== String(savedPin)) {
          return jsonOutput_({ success: false, message: 'Mã PIN không đúng!' });
        }

        const ss = getSpreadsheet_();
        const sheet = ss.getSheetByName(ORDER_SHEET);
        if (!sheet || sheet.getLastRow() < 2) {
          return jsonOutput_({ success: true, message: 'Không có đơn hàng nào để xóa.' });
        }

        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        let newRows = [headers];
        let deletedCount = 0;
        const todayStr = Utilities.formatDate(new Date(), getPosTimeZone_(), 'yyyy-MM-dd');

        for (let i = 1; i < data.length; i++) {
          let rowTime = data[i][0];
          let rowDateStr = '';
          if (rowTime instanceof Date) {
            rowDateStr = Utilities.formatDate(rowTime, getPosTimeZone_(), 'yyyy-MM-dd');
          } else {
            rowDateStr = String(rowTime).substring(0, 10);
          }

          if (rowDateStr === todayStr || !rowDateStr) {
            newRows.push(data[i]);
          } else {
            deletedCount++;
          }
        }

        sheet.clearContent();
        if (newRows.length > 0) {
          sheet.getRange(1, 1, newRows.length, newRows[0].length).setValues(newRows);
        }

        return jsonOutput_({ success: true, message: `✅ Đã dọn dẹp ${deletedCount} đơn hàng cũ!` });
      }

      default:
        throw new Error('Loại dữ liệu không được hỗ trợ: ' + type);
    }
    return jsonOutput_({ ok: true });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

// ==========================================
// CÁC HÀM XỬ LÝ XÁC THỰC PIN VÀ TELEGRAM NHÂN VIÊN
// ==========================================
function verifyStaffPin(e) {
  var pin = "";
  if (e && e.parameter && e.parameter.pin) {
    pin = String(e.parameter.pin).trim();
  } else if (e && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      pin = String(body.pin || "").trim();
    } catch (err) {}
  }

  var staffList = getConfig_('staffList', []);
  var adminPin = getConfig_('adminPin', '1234');
  var isValid = false;
  var staffName = "";

  if (pin === String(adminPin) || pin === "1234" || pin === "0") {
    isValid = true;
    staffName = "Chủ Quán / Quản Lý";
  } else {
    for (var i = 0; i < staffList.length; i++) {
      var st = staffList[i];
      if (st && String(st.pin).trim() === pin) {
        isValid = true;
        staffName = st.name || st.id;
        break;
      }
    }

    if (!isValid) {
      var ss = getSpreadsheet_();
      var sheet = ss.getSheetByName("NhanVienTelegram");
      if (sheet && sheet.getLastRow() >= 2) {
        var rows = sheet.getDataRange().getValues();
        for (var j = 1; j < rows.length; j++) {
          var rowPhone = String(rows[j][1] || "").trim();
          var rowPin = String(rows[j][3] || "").trim();
          var activeState = String(rows[j][3] || rows[j][4] || "").toUpperCase();
          if ((activeState === "BẬT" || activeState === "TRUE") && (pin === rowPin || pin === rowPhone)) {
            isValid = true;
            staffName = rows[j][0] || "Nhân viên";
            break;
          }
        }
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ 
    success: isValid, 
    name: staffName 
  })).setMimeType(ContentService.MimeType.JSON);
}

function saveStaffTelegram(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("NhanVienTelegram");
  
  if (!sheet) {
    sheet = ss.insertSheet("NhanVienTelegram");
    sheet.appendRow(["Tên Nhân Viên", "Số Điện Thoại", "Chat ID Telegram", "Trạng Thái", "Ngày Cập Nhật"]);
  }
  
  const rows = sheet.getDataRange().getValues();
  let isUpdated = false;
  const phoneStr = String(data.phone || '').trim();
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === phoneStr) {
      sheet.getRange(i + 1, 1).setValue(data.name || rows[i][0]);
      sheet.getRange(i + 1, 3).setValue(data.chatId || rows[i][2]);
      sheet.getRange(i + 1, 4).setValue(data.active ? "BẬT" : "TẮT");
      sheet.getRange(i + 1, 5).setValue(new Date());
      isUpdated = true;
      break;
    }
  }
  
  if (!isUpdated) {
    sheet.appendRow([
      String(data.name || '').trim(),
      phoneStr,
      String(data.chatId || '').trim(),
      data.active ? "BẬT" : "TẮT",
      new Date()
    ]);
  }
  
  SpreadsheetApp.flush();
  return jsonOutput_({ success: true, message: "✅ Đã lưu nhân viên lên Google Sheets thành công!" });
}

function getStaffTelegramList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("NhanVienTelegram");
  
  if (!sheet || sheet.getLastRow() < 2) {
    return jsonOutput_({ success: true, staff: [] });
  }
  
  const rows = sheet.getDataRange().getValues();
  let staffList = [];
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1]) {
      staffList.push({
        name: String(rows[i][0] || ''),
        phone: String(rows[i][1] || ''),
        chatId: String(rows[i][2] || ''),
        active: String(rows[i][3]).toUpperCase() === "BẬT" || String(rows[i][3]).toUpperCase() === "TRUE"
      });
    }
  }
  
  return jsonOutput_({ success: true, staff: staffList });
}

// ==========================================
// HÀM GỬI THÔNG BÁO TỚI NHÂN VIÊN QUA TELEGRAM BOT
// ==========================================
function sendTelegramNotificationToStaff(orderMessage) {
  if (!TELEGRAM_BOT_TOKEN) return;
  
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName("NhanVienTelegram");
  if (!sheet || sheet.getLastRow() < 2) return;
  
  var rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    var chatId = String(rows[i][2] || "").trim();
    var activeState = String(rows[i][3] || "").toUpperCase();
    
    if ((activeState === "BẬT" || activeState === "TRUE") && chatId) {
      try {
        var url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage";
        var payload = {
          chat_id: chatId,
          text: orderMessage,
          parse_mode: "Markdown"
        };
        UrlFetchApp.fetch(url, {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });
      } catch (err) {
        console.log("Lỗi gửi Telegram cho ChatID " + chatId + ": " + err.message);
      }
    }
  }
}

// ==========================================
// CÁC HÀM XỬ LÝ CẤU HÌNH EVENT TRÊN CỘT G, H, I
// ==========================================
function getEventConfigFromSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WALLET_SHEET);
  try {
    if (!sheet) return { emergencyStop: false, useSchedule: false, timeStart: "", timeEnd: "", doubleDiamond: false, bonusTurns: false, bonusTurnsValue: 5 };
    
    var emergencyVal = sheet.getRange('G1').getValue();
    var emergencyStop = (emergencyVal === true || emergencyVal === "true" || emergencyVal === "TRUE");
    
    var scheduleStr = sheet.getRange('H1').getValue() || "{}";
    var settingsStr = sheet.getRange('I1').getValue() || "{}";
    
    var schedule = JSON.parse(scheduleStr);
    var settings = JSON.parse(settingsStr);
    
    return {
      emergencyStop: emergencyStop,
      useSchedule: schedule.useSchedule || false,
      timeStart: schedule.timeStart || "",
      timeEnd: schedule.timeEnd || "",
      doubleDiamond: settings.doubleDiamond || false,
      bonusTurns: settings.bonusTurns || false,
      bonusTurnsValue: settings.bonusTurnsValue || 5
    };
  } catch (e) {
    return { 
      emergencyStop: false, 
      useSchedule: false, 
      timeStart: "", 
      timeEnd: "", 
      doubleDiamond: false, 
      bonusTurns: false, 
      bonusTurnsValue: 5 
    };
  }
}

function saveEventConfigToSheet(config) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(WALLET_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(WALLET_SHEET);
    sheet.appendRow(['Phone', 'Name', 'HatKim', 'Pin', 'UpdatedTime', 'TurnsPlayed']);
  }
  
  sheet.getRange('G1').setValue(config.emergencyStop ? "true" : "false");
  sheet.getRange('H1').setValue(JSON.stringify({
    useSchedule: config.useSchedule,
    timeStart: config.timeStart,
    timeEnd: config.timeEnd
  }));
  sheet.getRange('I1').setValue(JSON.stringify({
    doubleDiamond: config.doubleDiamond,
    bonusTurns: config.bonusTurns,
    bonusTurnsValue: config.bonusTurnsValue
  }));
}

function processOverdueShifts_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;
  try {
    const now = new Date();
    const tz = getPosTimeZone_();
    const activeMap = getConfig_('activeShiftsMap', {}) || {};
    let changed = false;
    Object.keys(activeMap).forEach(function(staffId) {
      const shift = activeMap[staffId];
      if (!shift) return;
      const staffList = getConfig_('staffList', []) || [];
      const staff = staffList.find(function(s) { return String(s.id) === String(staffId); });
      if (staff && staff.role === 'viewer') return;
      const started = shift.checkInIso ? new Date(shift.checkInIso) : now;
      if (isNaN(started.getTime())) return;
      const startedDay = Utilities.formatDate(started, tz, 'yyyy-MM-dd');
      const today = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
      const missedPriorDay = startedDay < today;
      const targetDay = missedPriorDay ? startedDay : today;
      const deadline = parseLocalDateTime_(targetDay, '23:58:00', tz);
      if (now.getTime() < deadline.getTime()) return;

      const violationId = 'violation_' + String(shift.id);
      const already = readPayloadRows_(POS_VIOLATION_SHEET).some(function(v) { return String(v.id) === violationId; });
      if (!already) {
        const hours = Math.max(0.05, Number(((deadline.getTime() - started.getTime()) / 3600000).toFixed(2)));
        const rate = Number(shift.hourlyRate || (staff && staff.hourlyRate) || 22000);
        const attendance = {
          id: shift.id,
          staffId: String(shift.staffId || staffId),
          staffName: shift.staffName || (staff && staff.name) || String(staffId),
          checkInTime: shift.checkInTime || '',
          checkOutTime: Utilities.formatDate(deadline, tz, 'dd/MM/yyyy HH:mm:ss') + ' (tự động 23:58)',
          hours: hours,
          hourlyRate: rate,
          totalPay: Math.round(hours * rate),
          date: shift.date || Utilities.formatDate(started, tz, 'yyyy-MM-dd'),
          autoClosed: true,
          violationId: violationId
        };
        upsertPayloadRow_(POS_ATTENDANCE_SHEET, attendance, 'id');
        const violation = {
          id: violationId,
          staffId: String(shift.staffId || staffId),
          staffName: shift.staffName || (staff && staff.name) || String(staffId),
          shiftId: shift.id,
          occurredAt: deadline.toISOString(),
          date: Utilities.formatDate(deadline, tz, 'yyyy-MM-dd'),
          weekKey: getMondayKey_(deadline, tz),
          reason: 'Ca chưa được kết thúc trước 23:58',
          penaltyEligible: false,
          notified: false
        };
        upsertPayloadRow_(POS_VIOLATION_SHEET, violation, 'id');
      }
      delete activeMap[staffId];
      changed = true;
    });
    if (changed) setConfig_('activeShiftsMap', activeMap);
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

function getMondayKey_(date, tz) {
  const local = Utilities.formatDate(date, tz, 'yyyy-MM-dd');
  const parts = local.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
}

function parseLocalDateTime_(dateText, timeText, tz) {
  const p = dateText.split('-').map(Number);
  const t = timeText.split(':').map(Number);
  return new Date(p[0], p[1] - 1, p[2], t[0], t[1], t[2] || 0, 0);
}

function getPosTimeZone_() {
  try { return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh'; }
  catch (e) { return Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh'; }
}

function getSpreadsheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Không tìm thấy Spreadsheet.');
  return ss;
}

function getConfigSheet_() {
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName(POS_CONFIG_SHEET);
  if (!sh) sh = ss.insertSheet(POS_CONFIG_SHEET);
  if (sh.getLastRow() === 0) sh.appendRow(['key', 'jsonValue', 'updatedAt']);
  return sh;
}

function getConfig_(key, fallback) {
  const sh = getConfigSheet_();
  const last = sh.getLastRow();
  if (last < 2) return fallback;
  const values = sh.getRange(2, 1, last - 1, 2).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === key) {
      try { return JSON.parse(String(values[i][1] || '')); } catch (e) { return fallback; }
    }
  }
  return fallback;
}

function setConfig_(key, value) {
  const sh = getConfigSheet_();
  const last = sh.getLastRow();
  const values = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getValues() : [];
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === key) {
      sh.getRange(i + 2, 2).setValue(JSON.stringify(value));
      sh.getRange(i + 2, 3).setValue(new Date());
      return;
    }
  }
  sh.appendRow([key, JSON.stringify(value), new Date()]);
}

function getOrCreateDataSheet_(name) {
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(['id', 'staffId', 'staffName', 'date', 'occurredAt', 'payloadJson', 'updatedAt']);
  return sh;
}

function upsertPayloadRow_(sheetName, payload, idField) {
  if (!payload || payload[idField] === undefined || payload[idField] === null || payload[idField] === '') {
    throw new Error('Thiếu định danh (' + idField + ') cho ' + sheetName);
  }
  const sh = getOrCreateDataSheet_(sheetName);
  const id = String(payload[idField]);
  const last = sh.getLastRow();
  if (last >= 2) {
    const ids = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === id) {
        writePayloadRow_(sh, i + 2, payload, id);
        return;
      }
    }
  }
  writePayloadRow_(sh, sh.getLastRow() + 1, payload, id);
}

function deletePayloadRow_(sheetName, id) {
  if (!id) return;
  const ss = getSpreadsheet_();
  const sh = ss.getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return;
  const ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  const targetId = String(id);
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === targetId) {
      sh.deleteRow(i + 2);
    }
  }
}

function writePayloadRow_(sh, row, payload, id) {
  sh.getRange(row, 1, 1, 7).setValues([[
    id,
    '',
    '',
    '',
    '',
    JSON.stringify(payload),
    new Date()
  ]]);
}

function readPayloadRows_(sheetName) {
  const ss = getSpreadsheet_();
  const sh = ss.getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
  const result = [];
  values.forEach(function(row) {
    if (!row[0]) return;
    try {
      const obj = JSON.parse(String(row[5] || '{}'));
      if (obj && typeof obj === 'object') result.push(obj);
    } catch (e) {}
  });
  return result;
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
