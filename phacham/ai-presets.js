// FILE RIÊNG CHỨA KHO MẪU AI TỰ SOẠN TIÊU ĐỀ CHO CẢ 8 KIỂU CHỮ (0 ĐỒNG)
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
    const clean = (topic || 'sản phẩm này').trim();
    const UP = clean.toUpperCase();
    const Cap = clean.charAt(0).toUpperCase() + clean.slice(1);
    const age = [24, 27, 29, 32, 35, 43][Math.floor(Math.random() * 6)];

    // MẪU 8: OOTD / LOOKBOOK GÓC TRÁI
    if (templateId === 'ootd-lookbook-trai') {
      return this._pickNoRepeat(templateId, [
        {
          hookText: `🎙️ Dừng lại đây nếu nàng còn phân vân về độ ứng dụng của ${clean}...`,
          prefix: 'OOTD',
          label: 'LOOK',
          tags: 'Thu Đông 🍂, Tết 🧧, Đi học / Đi làm 👩🏻‍💼, Cuối tuần ☕'
        },
        {
          hookText: `✨ Gợi ý 4 cách biến hóa cực xinh với ${clean} mặc hoài không chán`,
          prefix: 'STYLE',
          label: 'SET',
          tags: 'Năng động ⚡, Thanh lịch 🤍, Dạo phố 🌿, Hẹn hò 💕'
        },
        {
          hookText: `👗 Tủ đồ chưa biết mặc gì? Xem ngay 3 kiểu phối cùng ${clean} này nhé!`,
          prefix: 'MIX',
          label: 'OUTFIT',
          tags: 'Đi làm 💼, Cà phê sáng ☕, Đi tiệc nhẹ ✨, Du lịch ✈️'
        }
      ]);
    }

    // MẪU 2: CUTE HỒNG KẸO NGỌT
    if (templateId === 'cute-pink-milk') {
      return this._pickNoRepeat(templateId, [
        { badge: '🌸 GÓC NHỎ SIÊU CUTE 🌸', main: UP, sub: `Dễ thương xỉu với ${clean} 💕` },
        { badge: '🍓 NGỌT NGÀO HẾT NẤC', main: UP, sub: `Thử một lần là ghiền ngay ✨` },
        { badge: '🎀 MUST TRY HÔM NAY', main: UP, sub: `Xinh yêu chuẩn gu của bạn 💖` },
        { badge: '🧋 HƯƠNG VỊ GÂY THƯƠNG NHỚ', main: UP, sub: `Cứ ghé là phải gọi ngay món này 😋` }
      ]);
    }

    // MẪU 3: XANH MATCHA TƯƠI MÁT
    if (templateId === 'mint-matcha-fresh') {
      return this._pickNoRepeat(templateId, [
        { badge: '🌿 TƯƠI MÁT MỖI NGÀY', main: UP, sub: `Sảng khoái tức thì cùng ${clean} ✨` },
        { badge: '🍃 CHILL CÙNG THIÊN NHIÊN', main: UP, sub: `Mát lạnh tan chảy ngày nắng ☀️` },
        { badge: '💚 XANH MÁT CHUẨN VỊ', main: UP, sub: `Nhẹ nhàng mà cuốn không tưởng 🌱` }
      ]);
    }

    // MẪU 4: REMIX NEON ĐỔI MÀU + 3S ĐEN TRẮNG
    if (templateId === 'remix-den-trang-chop') {
      return this._pickNoRepeat(templateId, [
        { num: 'KHOAN LƯỚT! 🔥', main: `ĐÚNG GIÂY THỨ 3 VỚI ${UP}`, end: 'Nhạc nổ lên là cuốn không rời mắt 🎧' },
        { num: 'LET\'S GO! ⚡', main: `BÙNG NỔ CÙNG ${UP}`, end: 'Xem tới cuối mới thấy độ cháy 🚀' },
        { num: '3... 2... 1... 💥', main: `BIẾN HÌNH CỰC GẮT: ${UP}`, end: 'Nghe nhịp bass là nhún theo liền!' }
      ]);
    }

    // MẪU 5: CAM RỰC REVIEW QUÁN
    if (templateId === 'cam-nang-nang-dong') {
      return this._pickNoRepeat(templateId, [
        { tag: '📍 REVIEW CHÂN THẬT', main: UP, sub: `Trải nghiệm ${clean} cực đã 😋` },
        { tag: '🔥 TỌA ĐỘ HOT HÔM NAY', main: UP, sub: `Giá bình dân mà chất lượng bất ngờ!` },
        { tag: '⭐ QUÁN RUỘT PHẢI THỬ', main: UP, sub: `Ăn một lần là nhớ mãi không quên 👌` }
      ]);
    }

    // MẪU 6: BĂNG ĐỎ TIN NÓNG GÂY SỐC
    if (templateId === 'tieu-de-do-tin-nong') {
      return this._pickNoRepeat(templateId, [
        { alert: '🚨 KHOAN ĐÃ! ĐỪNG LƯỚT QUA', main: `90% NGƯỜI XEM BẤT NGỜ VỚI ${UP}`, sub: 'Xem hết tới cuối mới thấy cái kết!' },
        { alert: '⚠️ CẢNH BÁO GÂY NGHIỆN', main: `SỰ THẬT ÍT AI BIẾT VỀ ${UP}`, sub: 'Thử xong coi chừng quay lại mỗi ngày!' },
        { alert: '📢 TIN HOT MỚI NHẤT', main: `ĐÂY LÀ LÝ DO ${UP} ĐÔNG NGHỊT KHÁCH`, sub: 'Nhìn thành phẩm ở giây cuối là hiểu liền!' }
      ]);
    }

    // MẪU 7: SANG CHẢNH VÀNG CHAMPAGNE
    if (templateId === 'sang-chanh-gold') {
      return this._pickNoRepeat(templateId, [
        { top: 'KHOẢNH KHẮC TUYỆT ĐẸP', main: Cap, sub: 'Lưu giữ kỷ niệm đáng nhớ ✨' },
        { top: 'GÓC NHỎ BÌNH YÊN', main: Cap, sub: 'Chậm lại một nhịp để tận hưởng 🥂' },
        { top: 'PHONG CÁCH TINH TẾ', main: Cap, sub: 'Đơn giản nhưng đầy cuốn hút ✨' }
      ]);
    }

    // MẪU 1 (MẶC ĐỊNH): 32 TUỔI KHỞI NGHIỆP
    return this._pickNoRepeat('khoi-nghiep-y-hinh', [
      { num: String(age), s1: 'Tuổi', lead: 'Khởi nghiệp', main: UP, end: 'Sẽ như thế nào ?' },
      { num: String(age), s1: 'Tuổi', lead: 'Quyết định bỏ phố', main: UP, end: 'Liệu có thành công ?' },
      { num: '100%', s1: 'Thật sự', lead: 'Một ngày tất bật', main: UP, end: 'Có cực như lời đồn ?' },
      { num: '0đ', s1: 'Từ đầu', lead: 'Hành trình xây dựng', main: UP, end: 'Và cái kết bất ngờ !' }
    ]);
  }
};