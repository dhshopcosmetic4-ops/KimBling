// FILE RIÊNG QUẢN LÝ TẤT CẢ MẪU CHỮ & KIỂU DỰNG HOOK
// Muốn thêm mẫu mới, bạn chỉ cần copy thêm 1 khối { id: ..., ... } vào danh sách bên dưới!

window.HOOK_TEMPLATES = [
  {
    id: 'khoi-nghiep-y-hinh',
    name: 'Mẫu 1: 32 Tuổi Khởi Nghiệp (Giống 100% y hình)',
    hookDuration: 2.8, // Giữ chữ 2.8 giây đầu rồi tự ẩn sạch
    fields: [
      { key: 'num', label: 'Số to (Trắng)', default: '32' },
      { key: 's1', label: 'Chữ viết tay 1 (Vàng viền trắng)', default: 'Tuổi' },
      { key: 'lead', label: 'Dòng dẫn (Trắng đậm)', default: 'Khởi nghiệp' },
      { key: 'main', label: 'Từ khóa chính (Vàng có chân + gõ máy |)', default: 'BÁN BÁNH TRÁNG NƯỚNG' },
      { key: 'end', label: 'Câu hỏi chốt (Trắng kem bóng đỏ)', default: 'Sẽ như thế nào ?' }
    ],
    // Hàm vẽ mẫu chữ giống 100% ảnh tham chiếu
    render: function (ctx, t, W, H, data, hookTotal) {
      const showUntil = Math.max(hookTotal, this.hookDuration);
      if (t > showUntil) return;

      const fadeOut = t > showUntil - 0.25 ? Math.max(0, (showUntil - t) / 0.25) : 1;
      const num = (data.num || '').trim();
      const s1 = (data.s1 || '').trim();
      const lead = (data.lead || '').trim();
      const main = (data.main || '').trim();
      const end = (data.end || '').trim();

      const scale = W / 720; // Tự co giãn chuẩn cho cả 540p, 720p, 1080p
      ctx.save();
      ctx.globalAlpha = fadeOut;

      // --- TẦNG 1: "32" (Trắng cực dày) + "Tuổi" (Vàng kem viền trắng dày) ---
      const showNum = t >= 0.45;
      const numPop = showNum && t < 0.7 ? 1 + (1 - (t - 0.45) / 0.25) * 0.3 : 1;

      ctx.textBaseline = 'middle';
      const fontS1 = `700 ${Math.round(168 * scale)}px "Dancing Script", cursive`;
      const fontNum = `900 ${Math.round(138 * scale)}px "Playfair Display", Georgia, serif`;

      ctx.font = fontS1;
      const wS1 = ctx.measureText(s1).width;
      ctx.font = fontNum;
      const wNum = showNum ? ctx.measureText(num + ' ').width : 0;
      const startX = W / 2 - (wNum + wS1) / 2;
      const yRow1 = H * 0.43;

      if (showNum && num) {
        ctx.save();
        ctx.translate(startX + wNum / 2, yRow1 + 8 * scale);
        ctx.scale(numPop, numPop);
        ctx.font = fontNum;
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,0.65)';
        ctx.shadowBlur = 16 * scale;
        ctx.shadowOffsetY = 5 * scale;
        ctx.lineWidth = 5 * scale;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.strokeText(num, 0, 0);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(num, 0, 0);
        ctx.restore();
      }

      if (s1) {
        ctx.save();
        ctx.font = fontS1;
        ctx.textAlign = 'left';
        ctx.lineJoin = 'round';
        // Lớp viền trắng dày + bóng đổ bên ngoài
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 18 * scale;
        ctx.shadowOffsetY = 5 * scale;
        ctx.lineWidth = 14 * scale;
        ctx.strokeStyle = '#FFFFFF';
        ctx.strokeText(s1, startX + wNum, yRow1);
        // Lớp chữ vàng kem bên trong
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#FEF08A';
        ctx.fillText(s1, startX + wNum, yRow1);
        ctx.restore();
      }

      // --- TẦNG 2: "Khởi nghiệp" (Trắng đậm nét) ---
      if (lead) {
        ctx.save();
        ctx.textAlign = 'center';
        let sz = Math.round(44 * scale);
        ctx.font = `900 ${sz}px "Be Vietnam Pro", system-ui, sans-serif`;
        while (ctx.measureText(lead).width > W - 80 * scale && sz > 20) {
          sz -= 2; ctx.font = `900 ${sz}px "Be Vietnam Pro", system-ui, sans-serif`;
        }
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 12 * scale;
        ctx.shadowOffsetY = 3 * scale;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(lead, W / 2, H * 0.535);
        ctx.restore();
      }

      // --- TẦNG 3: "BÁN BÁNH TRÁNG NƯỚNG" (Có chân cực đậm, vàng kem, viền đen mảnh + gõ máy |) ---
      if (main) {
        ctx.save();
        ctx.textAlign = 'center';
        let sz = Math.round(48 * scale);
        ctx.font = `900 ${sz}px "Playfair Display", Georgia, serif`;
        while (ctx.measureText(main + '|').width > W - 50 * scale && sz > 18) {
          sz -= 2; ctx.font = `900 ${sz}px "Playfair Display", Georgia, serif`;
        }
        const prog = Math.min(1, t / 1.1);
        const chars = Math.max(1, Math.floor(main.length * prog));
        const cursor = (t < 1.3 && Math.floor(t * 6) % 2 === 0) ? '|' : '';
        const txt = main.slice(0, chars) + cursor;

        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(80,10,10,0.85)';
        ctx.shadowBlur = 14 * scale;
        ctx.lineWidth = 8 * scale;
        ctx.strokeStyle = 'rgba(20,10,10,0.9)';
        ctx.strokeText(txt, W / 2, H * 0.595);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FDE68A';
        ctx.fillText(txt, W / 2, H * 0.595);
        ctx.restore();
      }

      // --- TẦNG 4: "Sẽ như thế nào ?" (Viết tay trắng kem + tỏa bóng đỏ ấm) ---
      if (end && t >= 0.85) {
        const popEnd = t < 1.08 ? 1 + (1 - (t - 0.85) / 0.23) * 0.22 : 1;
        ctx.save();
        ctx.translate(W / 2, H * 0.67);
        ctx.scale(popEnd, popEnd);
        ctx.textAlign = 'center';
        let sz = Math.round(86 * scale);
        ctx.font = `700 ${sz}px "Dancing Script", cursive`;
        while (ctx.measureText(end).width > W - 60 * scale && sz > 28) {
          sz -= 3; ctx.font = `700 ${sz}px "Dancing Script", cursive`;
        }
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(135, 18, 18, 0.95)';
        ctx.shadowBlur = 22 * scale;
        ctx.lineWidth = 4 * scale;
        ctx.strokeStyle = 'rgba(90, 12, 12, 0.75)';
        ctx.strokeText(end, 0, 0);

        ctx.shadowBlur = 10 * scale;
        ctx.fillStyle = '#FFFBEB';
        ctx.fillText(end, 0, 0);
        ctx.restore();
      }

      ctx.restore();
    }
  },
  {
    id: 'remix-den-trang-chop',
    name: 'Mẫu 2: Quẩy Remix (3s Đen Trắng Chớp ➔ Bùng Màu)',
    hookDuration: 3.0,
    bwFirst3s: true, // Bật hiệu ứng 3s đầu đen trắng chớp sáng
    fields: [
      { key: 'num', label: 'Nhãn trên (Đỏ/Vàng)', default: 'CẢNH BÁO' },
      { key: 'main', label: 'Tiêu đề gây sốc', default: 'ĐÚNG GIÂY THỨ 3 SẼ BẤT NGỜ!' },
      { key: 'end', label: 'Dòng phụ bên dưới', default: 'Nhạc lên là quẩy hết mình 🔥' }
    ],
    render: function (ctx, t, W, H, data, hookTotal) {
      if (t > hookTotal) return;
      const scale = W / 720;
      const pulse = (t % 0.5) < 0.15 ? 1.12 : 1.0;
      ctx.save();
      ctx.translate(W / 2, H * 0.48);
      ctx.scale(pulse, pulse);
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 16 * scale;

      ctx.font = `900 ${Math.round(36 * scale)}px "Be Vietnam Pro", sans-serif`;
      ctx.fillStyle = '#EF4444';
      ctx.fillText(data.num || '', 0, -60 * scale);

      ctx.font = `900 ${Math.round(48 * scale)}px "Be Vietnam Pro", sans-serif`;
      ctx.fillStyle = '#FDE047';
      ctx.fillText((data.main || '').slice(0, 32), 0, 0);

      ctx.font = `700 ${Math.round(32 * scale)}px "Be Vietnam Pro", sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(data.end || '', 0, 56 * scale);
      ctx.restore();
    }
  }
];