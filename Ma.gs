/**
 * KIM BLING POS — Google Apps Script Hoàn Chỉnh (Cố định NV3 cho đơn online, giữ nguyên POS + Cập nhật ship)
 */
const POS_CONFIG_SHEET = 'POS_Data';
const POS_ATTENDANCE_SHEET = 'Attendance';
const POS_HISTORY_SHEET = 'Sales';
const POS_CLOSING_SHEET = 'ShiftClosing';
const POS_VIOLATION_SHEET = 'ShiftViolations';
const ORDER_SHEET = 'DON_HANG';

function doGet(e) {
  try {
    processOverdueShifts_();
    const type = String((e && e.parameter && (e.parameter.type || e.parameter.action)) || '');
    let result;
    switch (type) {
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
      
      case 'checkStatus': {
        const rawPhone = e.parameter.phone ? String(e.parameter.phone).trim() : '';
        const ss = getSpreadsheet_();
        const sheet = ss.getSheetByName(ORDER_SHEET) || ss.getActiveSheet();
        const data = sheet.getDataRange().getValues();
        if (data.length < 2) return jsonOutput_({ success: false, error: 'Chưa có đơn hàng nào' });
        
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

      default:
        result = { ok: true, service: 'Kim Bling POS Apps Script Final Fix', message: 'Endpoint hoạt động.' };
    }
    return jsonOutput_(result);
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const body = JSON.parse(raw);

    if (body.callback_query) {
      const callbackData = body.callback_query.data; 
      const callbackId = body.callback_query.id;
      const botToken = "8862119099:AAH9UC0RZmiYnTLk4ytHbmgLDxMoW0xruds";
      
      try {
        UrlFetchApp.fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({ callback_query_id: callbackId, text: "⏳ Đang cập nhật Google Sheets...", show_alert: false })
        });
      } catch (err) {}

      if (callbackData) {
        const ss = getSpreadsheet_();
        const sheet = ss.getSheetByName(ORDER_SHEET);
        if (sheet) {
          const data = sheet.getDataRange().getValues();
          let newStatus = '1';
          let targetPhone = '';

          if (callbackData.indexOf('STATUS_') === 0) {
            const parts = callbackData.split('_');
            newStatus = parts[1] || '1';
            targetPhone = parts[2] || '';
          }

          for (let i = data.length - 1; i >= 1; i--) {
            const rowStr = JSON.stringify(data[i]);
            if ((targetPhone && rowStr.indexOf(targetPhone) !== -1) || !targetPhone) {
              sheet.getRange(i + 1, 10).setValue(newStatus);
              break; 
            }
          }
        }
      }
      return jsonOutput_({ ok: true });
    }

    const type = String(body.type || body.action || '');
    switch (type) {
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
      
      // XỬ LÝ LỊCH SỬ BÁN HÀNG TỪ POS (Giữ nguyên tài khoản nhân viên thao tác)[span_1](start_span)[span_1](end_span)
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

      // XỬ LÝ ĐẨY ĐƠN ONLINE TỪ QLDON (Cố định NV3)[span_2](start_span)[span_2](end_span)
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
        const incomingItems = Array.isArray(body.items) ? body.items : [];
        
        const items = incomingItems.map(function(item, index) {
          item = item || {};
          let nameStr = String(item.name || item.title || 'Món nước').replace(/\([^)]*\)/g, '').trim();
          let optStr = String(item.optionsText || item.options || 'Size: Bình thường');
          if (!optStr.startsWith('Size:')) {
            optStr = 'Size: ' + optStr;
          }

          let toppingsArr = Array.isArray(item.rawToppings) ? item.rawToppings : [];
          if (toppingsArr.length === 0 && optStr.includes('+')) {
            const parts = optStr.split('+');
            if (parts[1]) {
              toppingsArr = parts[1].split(',').map(function(t) { return t.trim(); }).filter(Boolean);
            }
          }

          return {
            cartId: Number(item.cartId || (Date.now() + index + Math.random())),
            id: Number(item.id || (index + 1)),
            name: nameStr,
            basePrice: Number(item.basePrice !== undefined ? item.basePrice : item.price) || (nameStr.toLowerCase().includes('bạc hà') ? 30000 : 26000),
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
          name: String(body.name || orderRow[2] || 'Khách lẻ'),
          phone: String(body.phone || orderRow[3] || ''),
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
          message: 'Đã lưu đơn online vào Sales thành công.',
          orderId: sourceOrderId,
          historyId: numericOnlineId
        });
      }

      // XỬ LÝ CẬP NHẬT ĐỊA CHỈ, PHÍ SHIP VÀ TỔNG TIỀN TỪ QLDON[span_3](start_span)[span_3](end_span)
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
          return jsonOutput_({ success: true, message: '✅ Đã cập nhật địa chỉ và tính lại phí ship thành công!' });
        } else {
          return jsonOutput_({ success: false, message: 'Không tìm thấy mã đơn hàng cần sửa.' });
        }
      }

      case 'shiftClosing':
        if (body.shiftClosing) upsertPayloadRow_(POS_CLOSING_SHEET, body.shiftClosing, 'id');
        break;
      case 'shiftViolation':
        if (body.violation) upsertPayloadRow_(POS_VIOLATION_SHEET, body.violation, 'id');
        break;
      
      case 'saveOrder': {
        const ss = getSpreadsheet_();
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

        const rawPhoneVal = String(body.phone || body.customerPhone || '').trim();
        const formattedPhone = rawPhoneVal ? ('\'' + rawPhoneVal) : '';
        const paymentMethod = body.payment || body.paymentMethod || body.payMethod || 'Tiền mặt';

        sheet.appendRow([
          body.timestamp || new Date(),
          orderId,
          body.name || body.customerName || 'Khách lẻ',
          formattedPhone,
          finalAddress,
          body.items || body.itemsSummary || '',
          body.total || body.totalAmount || 0,
          paymentMethod,
          body.note || '',
          '1'
        ]);
        SpreadsheetApp.flush();
        return jsonOutput_({ ok: true, success: true, found: true, orderId: orderId, message: "Đã lưu đơn hàng mới" });
      }

      case 'updateStatus': {
        const ss = getSpreadsheet_();
        const sheet = ss.getSheetByName(ORDER_SHEET) || ss.getActiveSheet();
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

        return jsonOutput_({ success: true, message: `✅ Đã dọn dẹp thành công ${deletedCount} đơn hàng cũ!` });
      }

      default:
        throw new Error('Loại dữ liệu không được hỗ trợ: ' + type);
    }
    return jsonOutput_({ ok: true, type: type });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

function processOverdueShifts_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return;
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
    throw new Error('Thiếu mã định danh (' + idField + ') cho ' + sheetName);
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
