javascript
// KHO CÂU HOOK GIẬT GÂN & TÒ MÒ THU HÚT KHÁCH (0 ĐỒNG)
window.AI_PRESETS = {
  _lastIndex: {},

  _pickNoRepeat: function (templateId, list) {
    if (!list || !list.length) return {};
    if (list.length === 1) return list[0];
    const prev = this._lastIndex[templateId];
    let idx = Math.floor(Math.random() * list.length);
    if (idx === prev) idx = (idx + 1) % list.length;
    this._lastIndex[templateId] = idx;
    return list[idx];
  },

  generateHookData: function (topic, templateId) {
    const clean = (topic || 'món này').trim();
    const UP = clean.toUpperCase();
    const Cap = clean.charAt(0).toUpperCase() + clean.slice(1);
    const age = [25, 28, 30, 32, 36, 43][Math.floor(Math.random() * 6)];

    if (templateId === 'ootd-lookbook-trai') {
      return this._pickNoRepeat(templateId, [
        {
          hookText: `🚨 Dừng lại 3 giây nếu nàng chưa tin ${clean} có thể biến hóa cực đỉnh cỡ này...`,
          prefix: 'OOTD', label: 'LOOK',
          tags: 'Thu Đông 🍂, Tết 🧧, Đi học / Đi làm 👩🏻‍💼, Hẹn hò ✨'
        },
        {
          hookText: `🔥 Tưởng không hợp mà đẹp không tưởng! Xem ngay 3 cách phối ${clean} gây nghiện`,
          prefix: 'STYLE', label: 'SET',
          tags: 'Che khuyết điểm ✓, Tôn dáng 💃, Dạo phố ☕, Tiệc tối 🥂'
        },
        {
          hookText: `⚠️ Cảnh báo cháy hàng! Chỉ với ${clean} mà cân hết mọi kèo đi chơi`,
          prefix: 'MIX', label: 'OUTFIT',
          tags: 'Năng động ⚡, Sang chảnh ✨, Thanh lịch 🤍, Cuối tuần 🌿'
        }
      ]);
    }

    if (templateId === 'cute-pink-milk') {
      return this._pickNoRepeat(templateId, [
        { badge: '🚨 CẢNH BÁO GÂY NGHIỆN!', main: UP, sub: `Thử 1 lần là quay lại cả tuần 💕` },
        { badge: '🔥 99% KHÁCH ĐỀU MÊ!', main: UP, sub: `Ngọt ngào tan chảy không nỡ rời ✨` },
        { badge: '💖 BÍ MẬT ĐẰNG SAU', main: UP, sub: `Xinh xỉu từ cái nhìn đầu tiên 🌸` }
      ]);
    }

    if (templateId === 'mint-matcha-fresh') {
      return this._pickNoRepeat(templateId, [
        { badge: '⚠️ CHỈ SỢ BẠN GHIỀN!', main: UP, sub: `Tỉnh táo sảng khoái ngay lập tức ⚡` },
        { badge: '🌿 BÍ QUYẾT HÚT KHÁCH', main: UP, sub: `Đậm vị mát lạnh chuẩn gu ☀️` },
        { badge: '💚 ĐỪNG BỎ LỠ HÔM NAY', main: UP, sub: `Thử là ghiền, càng uống càng mê 🌱` }
      ]);
    }

    if (templateId === 'remix-den-trang-chop') {
      return this._pickNoRepeat(templateId, [
        { num: '🚨 KHOAN LƯỚT!', main: `ĐÚNG GIÂY THỨ 3 ${UP} LẬT KÈO!`, end: 'Không xem tới cuối là tiếc hùi hụi 🔥' },
        { num: '3... 2... 1... 💥', main: `BIẾN HÌNH CỰC SỐC: ${UP}`, end: '90% người xem phải tua lại lần 2!' }
      ]);
    }

    if (templateId === 'cam-nang-nang-dong') {
      return this._pickNoRepeat(templateId, [
        { tag: '🚨 QUÁN ĐÔNG NGHỊT KHÁCH', main: UP, sub: `Lý do khiến ai ăn xong cũng khen nức nở! 😋` },
        { tag: '🔥 BÓC PHỐT SỰ THẬT', main: UP, sub: `Rẻ giật mình mà chất lượng quá đỉnh 👌` },
        { tag: '📍 TỌA ĐỘ GÂY SỐT', main: UP, sub: `Chậm chân là hết phần ngay hôm nay!` }
      ]);
    }

    if (templateId === 'tieu-de-do-tin-nong') {
      return this._pickNoRepeat(templateId, [
        { alert: '🚨 CẢNH BÁO: ĐỪNG LƯỚT QUA!', main: `99% KHÁCH KHÔNG NGỜ VỀ ${UP}`, sub: 'Xem hết 5 giây cuối mới thấy cái kết sốc!' },
        { alert: '⚠️ SỰ THẬT CHẤN ĐỘNG', main: `TẠI SAO ${UP} LẠI HOT ĐẾN VẬY?`, sub: 'Thử xong coi chừng ghiền không dứt được!' }
      ]);
    }

    if (templateId === 'sang-chanh-gold') {
      return this._pickNoRepeat(templateId, [
        { top: 'BÍ MẬT CỦA SỰ CUỐN HÚT', main: Cap, sub: 'Đẹp đến mức khiến ai cũng phải ngoái nhìn ✨' },
        { top: 'TUYỆT TÁC KHÔNG THỂ BỎ LỠ', main: Cap, sub: 'Trải nghiệm đẳng cấp ngay từ giây đầu tiên 🥂' }
      ]);
    }

    // MẪU 1: KHỞI NGHIỆP GIẬT GÂN
    return this._pickNoRepeat('khoi-nghiep-y-hinh', [
      { num: String(age), s1: 'Tuổi', lead: 'Đánh cược tất cả để', main: UP, end: 'Và cái kết không ngờ !' },
      { num: String(age), s1: 'Tuổi', lead: 'Bỏ việc lương cao đi', main: UP, end: 'Lỗ sấp mặt hay thắng lớn ?' },
      { num: '100%', s1: 'Sự thật', lead: 'Đằng sau 1 ngày', main: UP, end: 'Ít ai dám kể cho bạn !' },
      { num: '0đ', s1: 'Từ tay trắng', lead: 'Liều mình khởi nghiệp', main: UP, end: 'Sẽ ra sao sau 1 tháng ?' }
    ]);
  }
};