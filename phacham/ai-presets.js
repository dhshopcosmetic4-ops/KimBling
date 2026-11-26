// FILE RIÊNG CHỨA MẪU AI TỰ SOẠN TIÊU ĐỀ CHO TỪNG KIỂU CHỮ (0 ĐỒNG)
window.AI_PRESETS = {
  generateHookData: function (topic, templateId) {
    const clean = (topic || 'quán trà sữa').trim();
    const UP = clean.toUpperCase();
    const age = [25, 28, 30, 32, 35, 43][Math.floor(Math.random() * 6)];

    if (templateId === 'cute-pink-milk') {
      return {
        badge: '🌸 GÓC NHỎ SIÊU CUTE 🌸',
        main: UP,
        sub: `Dễ thương xỉu với ${clean} 💕`
      };
    }
    if (templateId === 'mint-matcha-fresh') {
      return {
        badge: '🌿 TƯƠI MÁT MỖI NGÀY',
        main: UP,
        sub: `Cảm giác sảng khoái cùng ${clean} ✨`
      };
    }
    if (templateId === 'remix-den-trang-chop') {
      return {
        num: 'KHOAN LƯỚT! 🔥',
        main: `ĐÚNG GIÂY THỨ 3 VỚI ${UP}`,
        end: 'Nhạc nổ lên là cuốn không rời mắt 🎧'
      };
    }
    if (templateId === 'cam-nang-nang-dong') {
      return {
        tag: '📍 CHECK-IN NGAY HÔM NAY',
        main: UP,
        sub: `Trải nghiệm ${clean} cực đã 😋`
      };
    }
    if (templateId === 'tieu-de-do-tin-nong') {
      return {
        alert: '🚨 ĐỪNG BỎ LỠ KHOẢNH KHẮC NÀY',
        main: `90% NGƯỜI XEM BẤT NGỜ VỚI ${UP}`,
        sub: 'Xem hết tới cuối mới thấy cái kết!'
      };
    }
    if (templateId === 'sang-chanh-gold') {
      return {
        top: 'KHOẢNH KHẮC TUYỆT ĐẸP',
        main: clean.charAt(0).toUpperCase() + clean.slice(1),
        sub: 'Lưu giữ kỷ niệm đáng nhớ ✨'
      };
    }
    // Mặc định Mẫu 1: 32 Tuổi Khởi Nghiệp
    const storyList = [
      { num: String(age), s1: 'Tuổi', lead: 'Khởi nghiệp', main: UP, end: 'Sẽ như thế nào ?' },
      { num: String(age), s1: 'Tuổi', lead: 'Quyết định bỏ phố', main: UP, end: 'Liệu có thành công ?' }
    ];
    return storyList[Math.floor(Math.random() * storyList.length)];
  }
};