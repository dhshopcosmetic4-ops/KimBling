// FILE RIÊNG XỬ LÝ PHỔ SÓNG NHẠC (AUDIO SPECTRUM) NHẢY THEO TẦN SỐ BASS - MID - TREBLE
window.AUDIO_VIZ = {
  data: null, // { hopSec: 0.02, bands: Array<Float32Array> }

  // Phân tích 18 dải tần số (từ Bass trầm 47Hz -> Giọng hát -> Treble 10kHz) bằng FFT 1024 điểm
  analyze: function (audioBuffer) {
    if (!audioBuffer) return;
    const N = 1024;
    const sr = audioBuffer.sampleRate;
    const len = audioBuffer.length;
    const hop = Math.floor(sr * 0.02); // 50 khung/giây
    const numFrames = Math.max(1, Math.floor((len - N) / hop));
    const numBands = 18;

    // Gộp mono nhẹ
    const ch0 = audioBuffer.getChannelData(0);
    const ch1 = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null;

    // Cửa sổ Hann làm mượt phổ
    const hann = new Float32Array(N);
    for (let i = 0; i < N; i++) hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));

    // Bảng bit-reversal cho Radix-2 FFT
    const rev = new Uint16Array(N);
    for (let i = 0; i < N; i++) {
      let x = i, r = 0;
      for (let b = 0; b < 10; b++) { r = (r << 1) | (x & 1); x >>= 1; }
      rev[i] = r;
    }

    const re = new Float32Array(N), im = new Float32Array(N);
    const rawBands = Array.from({ length: numFrames }, () => new Float32Array(numBands));
    const allValues = [];

    for (let f = 0; f < numFrames; f++) {
      const offset = f * hop;
      for (let i = 0; i < N; i++) {
        const s = ch1 ? 0.5 * (ch0[offset + i] + ch1[offset + i]) : ch0[offset + i];
        re[rev[i]] = s * hann[i];
        im[rev[i]] = 0;
      }

      // Cooley-Tukey Iterative FFT
      for (let size = 2; size <= N; size <<= 1) {
        const half = size >> 1;
        const step = (-2 * Math.PI) / size;
        const wReStep = Math.cos(step), wImStep = Math.sin(step);
        for (let i = 0; i < N; i += size) {
          let wRe = 1, wIm = 0;
          for (let j = 0; j < half; j++) {
            const k = i + j, l = k + half;
            const tRe = wRe * re[l] - wIm * im[l];
            const tIm = wRe * im[l] + wIm * re[l];
            re[l] = re[k] - tRe; im[l] = im[k] - tIm;
            re[k] += tRe; im[k] += tIm;
            const nxtRe = wRe * wReStep - wIm * wImStep;
            wIm = wRe * wImStep + wIm * wReStep; wRe = nxtRe;
          }
        }
      }

      // Gom thành 18 dải logarit (cột trái = Bass sâu, cột phải = Treble)
      for (let b = 0; b < numBands; b++) {
        const bStart = Math.max(1, Math.floor(Math.pow(210, b / numBands)));
        const bEnd = Math.max(bStart + 1, Math.floor(Math.pow(210, (b + 1) / numBands)));
        let sum = 0;
        for (let k = bStart; k < bEnd; k++) sum += Math.hypot(re[k], im[k]) / N;
        const val = Math.pow(sum / (bEnd - bStart), 0.52);
        rawBands[f][b] = val;
        allValues.push(val);
      }
    }

    // Chuẩn hóa theo ngưỡng 96% để sóng nhảy đẹp với mọi bài to/nhỏ
    allValues.sort((a, b) => a - b);
    const p96 = allValues[Math.floor(allValues.length * 0.96)] || 0.05;

    const smoothed = Array.from({ length: numFrames }, () => new Float32Array(numBands));
    const prev = new Float32Array(numBands);
    for (let f = 0; f < numFrames; f++) {
      for (let b = 0; b < numBands; b++) {
        const target = Math.min(1, rawBands[f][b] / (p96 + 1e-6));
        prev[b] = target > prev[b]
          ? prev[b] + (target - prev[b]) * 0.68
          : prev[b] * 0.78 + target * 0.22;
        smoothed[f][b] = Math.max(0.05, Math.min(1, prev[b]));
      }
    }

    this.data = { hopSec: 0.02, numBands, frames: smoothed };
  },

  _getBandsAt: function (t, count) {
    const out = new Array(count).fill(0.08);
    if (!this.data || !this.data.frames.length) return out;
    const pos = Math.max(0, t / this.data.hopSec);
    const i0 = Math.min(this.data.frames.length - 1, Math.floor(pos));
    const i1 = Math.min(this.data.frames.length - 1, i0 + 1);
    const frac = pos - i0;
    const f0 = this.data.frames[i0], f1 = this.data.frames[i1];
    for (let i = 0; i < count; i++) {
      const srcIdx = Math.min(this.data.numBands - 1, Math.floor((i / count) * this.data.numBands));
      out[i] = f0[srcIdx] * (1 - frac) + f1[srcIdx] * frac;
    }
    return out;
  },

  _roundRect: function (ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y); ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad); ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h); ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad); ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y); ctx.closePath();
  },

  // Vẽ Sóng Nhạc tinh tế không che chủ thể
  draw: function (ctx, t, W, H, style, colorHex) {
    if (!style || style === 'none' || !this.data) return;
    const sc = W / 720;
    const color = colorHex || '#FFFFFF';

    ctx.save();

    // KIỂU 1: MINI GÓC TRÊN TRÁI (Giống thanh nhạc Dynamic Island - Không bao giờ che mặt/đồ)
    if (style === 'mini-top-left') {
      const bars = this._getBandsAt(t, 14);
      const boxX = 36 * sc, boxY = 44 * sc, boxW = 216 * sc, boxH = 44 * sc;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
      this._roundRect(ctx, boxX, boxY, boxW, boxH, 22 * sc);
      ctx.fill();
      ctx.lineWidth = 1.5 * sc;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.stroke();

      // Chấm nhịp bass bên trái
      const bassPulse = bars[0];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(boxX + 22 * sc, boxY + boxH / 2, (4.5 + bassPulse * 3) * sc, 0, Math.PI * 2);
      ctx.fill();

      // 14 thanh sóng nhỏ nhảy đối xứng giữa
      const startX = boxX + 40 * sc, bw = 5 * sc, gap = 6.5 * sc, maxH = 24 * sc;
      for (let i = 0; i < bars.length; i++) {
        const bh = Math.max(4 * sc, bars[i] * maxH);
        const bx = startX + i * (bw + gap);
        const by = boxY + (boxH - bh) / 2;
        this._roundRect(ctx, bx, by, bw, bh, 2.5 * sc);
        ctx.fill();
      }
    }

    // KIỂU 2: DẢI MẢNH TRÊN ĐỈNH (Thoáng 100% khung hình & tránh nút TikTok)
    else if (style === 'top-slim') {
      const bars = this._getBandsAt(t, 24);
      const bw = 7 * sc, gap = 8 * sc;
      const totalW = bars.length * bw + (bars.length - 1) * gap;
      const startX = (W - totalW) / 2, baseY = 78 * sc, maxH = 38 * sc;

      ctx.globalAlpha = 0.85;
      ctx.shadowColor = color; ctx.shadowBlur = 8 * sc;
      ctx.fillStyle = color;
      for (let i = 0; i < bars.length; i++) {
        const bh = Math.max(4 * sc, bars[i] * maxH);
        this._roundRect(ctx, startX + i * (bw + gap), baseY - bh, bw, bh, 3.5 * sc);
        ctx.fill();
      }
    }

    // KIỂU 3: DẢI ĐỐI XỨNG MẢNH GẦN ĐÁY (Mờ nhẹ tinh tế)
    else if (style === 'bottom-mirror') {
      const bars = this._getBandsAt(t, 26);
      const bw = 6 * sc, gap = 8 * sc;
      const totalW = bars.length * bw + (bars.length - 1) * gap;
      const startX = (W - totalW) / 2, centerY = H * 0.89, maxH = 36 * sc;

      ctx.globalAlpha = 0.72;
      ctx.shadowColor = color; ctx.shadowBlur = 10 * sc;
      ctx.fillStyle = color;
      for (let i = 0; i < bars.length; i++) {
        const bh = Math.max(4 * sc, bars[i] * maxH);
        this._roundRect(ctx, startX + i * (bw + gap), centerY - bh / 2, bw, bh, 3 * sc);
        ctx.fill();
      }
    }

    // KIỂU 4: SÁT MÉP TRÁI (Né nút Tim bên phải & chủ thể ở giữa)
    else if (style === 'left-edge') {
      const bars = this._getBandsAt(t, 18);
      const bh = 6 * sc, gap = 7 * sc;
      const totalH = bars.length * bh + (bars.length - 1) * gap;
      const startY = H * 0.72 - totalH / 2, baseX = 20 * sc, maxW = 34 * sc;

      ctx.globalAlpha = 0.78;
      ctx.shadowColor = color; ctx.shadowBlur = 8 * sc;
      ctx.fillStyle = color;
      for (let i = 0; i < bars.length; i++) {
        const bw = Math.max(4 * sc, bars[i] * maxW);
        this._roundRect(ctx, baseX, startY + i * (bh + gap), bw, bh, 3 * sc);
        ctx.fill();
      }
    }

    ctx.restore();
  }
};