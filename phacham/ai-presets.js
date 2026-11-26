// FILE RIÊNG CHỨA MẪU AI TỰ SOẠN TIÊU ĐỀ GÂY TÒ MÒ (0 ĐỒNG)
window.AI_PRESETS = {
  generateHookData: function (topic, templateId) {
    const clean = (topic || 'bán đồ ăn').trim();
    const UP = clean.toUpperCase();
    const age = [25, 28, 30, 32, 35, 43][Math.floor(Math.random() * 6)];

    if (templateId === 'remix-bw-flash') {
      const list = [
        { num: 'KHOAN LƯỚT!', main: `XEM PHA ${UP} ĐÚNG GIÂY THỨ 3`, end: 'Không ngờ lại cháy cỡ này!' },
        { num: '90% BẤT NGỜ', main: `BÍ MẬT CỦA ${UP}`, end: 'Đợi đúng 3 giây nhạc nổ...' }
      ];
      return list[Math.floor(Math.random() * list.length)];
    }

    const storyList = [
      { num: String(age), s1: 'Tuổi', lead: 'Khởi nghiệp', main: UP, end: 'Sẽ như thế nào ?' },
      { num: String(age), s1: 'Tuổi', lead: 'Quyết định bỏ phố', main: UP, end: 'Liệu có thành công ?' },
      { num: '100%', s1: 'Sự thật', lead: 'Một ngày đi làm', main: UP, end: 'Cực hay ít ai biết !' }
    ];
    return storyList[Math.floor(Math.random() * storyList.length)];
  }
};