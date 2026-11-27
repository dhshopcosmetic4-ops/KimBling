// FILE RIÊNG XỬ LÝ CHUYỂN ĐỘNG VIDEO: NHỊP THỞ BASS & TỰ ĐỘNG LƯỚT MÁY (LIA CAMERA)
window.MOTION_FX = {
  // Tính độ phóng to, trượt X/Y, độ nghiêng và ánh sáng cho từng khung hình
  compute: function (mode, seg, t, W, H, breath, hookTotal) {
    const dt = Math.max(0, t - seg.start);
    const dur = Math.max(0.15, seg.dur);
    const prog = Math.min(1, dt / dur);
    const hitPulse = dt < 0.18 ? (1 - dt / 0.18) : 0;

    let zoom = 1.0, tx = 0, ty = 0, rotRad = 0;
    let flashAlpha = 0, introDarkness = 0;

    // Hàm tạo đường lướt êm ở giữa, tăng tốc nhẹ ở 2 đầu chuyển cảnh (Whip-like ease)
    const easeInOut = prog < 0.5
      ? 2 * prog * prog
      : 1 - Math.pow(-2 * prog + 2, 2) / 2;

    if (mode === 'breath-all') {
      if (seg.isHook) {
        introDarkness = Math.max(0, (1 - Math.min(1, t / Math.max(0.5, hookTotal))) * 0.26);
        zoom = 1.0 + breath * 0.015;
      } else {
        zoom = 1.0 + breath * 0.058 + hitPulse * 0.02;
        flashAlpha = breath * 0.05 + hitPulse * 0.04;
      }
    }
    else if (mode === 'auto-pan' || mode === 'pan-breath') {
      // Zoom dư 18% để khi lia ngang/dọc không bao giờ bị hở viền đen!
      const baseZoom = 1.18;
      const panRangeX = W * 0.065;
      const panRangeY = H * 0.035;
      const pattern = (seg.idx - 1) % 4;

      if (pattern === 0) {
        // Lia từ trái sang phải + nghiêng rất nhẹ
        tx = (0.5 - easeInOut) * 2 * panRangeX;
        rotRad = (-0.8 + easeInOut * 1.6) * (Math.PI / 180);
      } else if (pattern === 1) {
        // Lia từ phải sang trái
        tx = (easeInOut - 0.5) * 2 * panRangeX;
        rotRad = (0.8 - easeInOut * 1.6) * (Math.PI / 180);
      } else if (pattern === 2) {
        // Đẩy vào cận + lướt nhẹ từ dưới lên
        ty = (0.5 - easeInOut) * 2 * panRangeY;
        zoom = baseZoom + prog * 0.06;
      } else {
        // Kéo nhẹ ra + lướt chéo
        tx = (0.5 - easeInOut) * 1.4 * panRangeX;
        ty = (easeInOut - 0.5) * 1.2 * panRangeY;
        zoom = baseZoom + (1 - prog) * 0.05;
      }

      if (zoom === 1.0) zoom = baseZoom;
      if (mode === 'pan-breath') {
        zoom += (seg.isHook ? breath * 0.015 : breath * 0.05 + hitPulse * 0.02);
        flashAlpha = seg.isHook ? 0 : (breath * 0.04 + hitPulse * 0.04);
      }
    }
    else if (mode === 'breath-drop') {
      if (!seg.isHook && seg.energy >= 1.02) {
        zoom = 1.0 + breath * 0.065 + hitPulse * 0.02;
        flashAlpha = breath * 0.06;
      } else {
        zoom = 1.0 + prog * 0.025;
      }
    }
    else if (mode === 'beat-hit') {
      zoom = 1.0 + hitPulse * 0.055;
      flashAlpha = hitPulse * 0.10;
    }
    else {
      zoom = 1.0 + prog * 0.03;
    }

    return { zoom, tx, ty, rotRad, flashAlpha, introDarkness };
  }
};