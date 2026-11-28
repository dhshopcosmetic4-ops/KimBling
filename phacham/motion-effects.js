
// FILE RIÊNG XỬ LÝ CHUYỂN ĐỘNG & CHUYỂN CẢNH GIỮA CÁC PHÁCH
window.MOTION_FX = {
  compute: function (mode, seg, t, W, H, breath, hookTotal) {
    const dt = Math.max(0, t - seg.start);
    const dur = Math.max(0.15, seg.dur);
    const prog = Math.min(1, dt / dur);
    const hitPulse = dt < 0.18 ? (1 - dt / 0.18) : 0;

    let zoom = 1.0, tx = 0, ty = 0, rotRad = 0;
    let flashAlpha = 0, introDarkness = 0;

    const easeInOut = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2;

    // MỚI: GIẢ LẬP GIMBAL TIẾN LÙI + ĐUNG ĐƯA HÌNH SỐ 8 + NHỊP THỞ BASS (CHO VIDEO QUAY CỐ ĐỊNH)
    if (mode === 'gimbal-sway') {
      // Chu kỳ tiến vào (1.08 -> 1.24) rồi lùi ra (1.24 -> 1.08) liền mạch xuyên suốt cả bài!
      const dollyWave = (1 - Math.cos(t * 0.55)) * 0.5;
      zoom = 1.08 + dollyWave * 0.16 + (seg.isHook ? breath * 0.015 : breath * 0.038 + hitPulse * 0.015);
      // Đung đưa hình số 8 êm như người cầm Gimbal đi theo nhân vật
      tx = Math.sin(t * 1.1) * (W * 0.024);
      ty = Math.sin(t * 2.2) * (H * 0.012);
      rotRad = Math.sin(t * 0.9) * 1.05 * (Math.PI / 180);
      if (seg.isHook) {
        introDarkness = Math.max(0, (1 - Math.min(1, t / Math.max(0.5, hookTotal))) * 0.20);
      } else {
        flashAlpha = breath * 0.04 + hitPulse * 0.03;
      }
    }
    else if (mode === 'breath-all') {
      if (seg.isHook) {
        introDarkness = Math.max(0, (1 - Math.min(1, t / Math.max(0.5, hookTotal))) * 0.24);
        zoom = 1.0 + breath * 0.015;
      } else {
        zoom = 1.0 + breath * 0.058 + hitPulse * 0.02;
        flashAlpha = breath * 0.05 + hitPulse * 0.04;
      }
    } else if (mode === 'auto-pan' || mode === 'pan-breath') {
      const baseZoom = 1.18, panRangeX = W * 0.065, panRangeY = H * 0.035;
      const pattern = (seg.idx - 1) % 4;
      if (pattern === 0) {
        tx = (0.5 - easeInOut) * 2 * panRangeX;
        rotRad = (-0.8 + easeInOut * 1.6) * (Math.PI / 180);
      } else if (pattern === 1) {
        tx = (easeInOut - 0.5) * 2 * panRangeX;
        rotRad = (0.8 - easeInOut * 1.6) * (Math.PI / 180);
      } else if (pattern === 2) {
        ty = (0.5 - easeInOut) * 2 * panRangeY;
        zoom = baseZoom + prog * 0.06;
      } else {
        tx = (0.5 - easeInOut) * 1.4 * panRangeX;
        ty = (easeInOut - 0.5) * 1.2 * panRangeY;
        zoom = baseZoom + (1 - prog) * 0.05;
      }
      if (zoom === 1.0) zoom = baseZoom;
      if (mode === 'pan-breath') {
        zoom += (seg.isHook ? breath * 0.015 : breath * 0.05 + hitPulse * 0.02);
        flashAlpha = seg.isHook ? 0 : (breath * 0.04 + hitPulse * 0.04);
      }
    } else if (mode === 'breath-drop') {
      if (!seg.isHook && seg.energy >= 1.02) {
        zoom = 1.0 + breath * 0.065 + hitPulse * 0.02;
        flashAlpha = breath * 0.06;
      } else zoom = 1.0 + prog * 0.025;
    } else if (mode === 'beat-hit') {
      zoom = 1.0 + hitPulse * 0.055;
      flashAlpha = hitPulse * 0.10;
    } else {
      zoom = 1.0 + prog * 0.03;
    }

    return { zoom, tx, ty, rotRad, flashAlpha, introDarkness };
  },

  drawTransition: function (ctx, transMode, dt, transDur, W, H, prevCanvas, currCanvas) {
    if (!prevCanvas || dt >= transDur || transMode === 'cut') {
      ctx.drawImage(currCanvas, 0, 0, W, H);
      return;
    }
    const rawP = Math.max(0, Math.min(1, dt / transDur));
    if (transMode === 'fade') {
      ctx.drawImage(currCanvas, 0, 0, W, H);
      ctx.save(); ctx.globalAlpha = 1 - rawP; ctx.drawImage(prevCanvas, 0, 0, W, H); ctx.restore();
    } else if (transMode === 'slide') {
      const p = 1 - Math.pow(1 - rawP, 3);
      ctx.drawImage(prevCanvas, -p * W, 0, W, H);
      ctx.drawImage(currCanvas, (1 - p) * W, 0, W, H);
    } else {
      ctx.drawImage(currCanvas, 0, 0, W, H);
    }
  }
};