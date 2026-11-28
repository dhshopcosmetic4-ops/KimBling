// FILE RIÊNG QUẢN LÝ 10 MẪU CỐ ĐỊNH + BỘ VẼ CHỮ ĐA NĂNG AI TỰ HỌC (UNIVERSAL DNA)
function drawRoundBox(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y); ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad); ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h); ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad); ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y); ctx.closePath();
}

function fitFont(ctx, text, tpl, maxW, startSize, minSize = 18) {
  let s = startSize;
  while (s > minSize) {
    ctx.font = tpl.replace('{S}', s);
    if (ctx.measureText(text).width <= maxW) break;
    s -= 2;
  }
  return s;
}

function wrapCenterText(ctx, text, x, y, maxW, lineH) {
  const words = (text || '').split(/\s+/);
  const lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  const startY = y - ((lines.length - 1) * lineH) / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, x, startY + i * lineH));
  return lines;
}

function mapFontFamily(type) {
  if (type === 'script') return '"Dancing Script", cursive';
  if (type === 'serif') return '"Playfair Display", Georgia, serif';
  if (type === 'cute') return '"Baloo 2", cursive';
  if (type === 'condensed') return '"Oswald", sans-serif';
  if (type === 'tech') return '"Chakra Petch", sans-serif';
  return '"Be Vietnam Pro", sans-serif';
}

// BỘ VẼ CHỮ ĐA NĂNG TỪ JSON DNA DO AI HỌC TỪ ẢNH MẪU
window.renderDynamicHookDNA = function (ctx, t, W, H, dna, hookTotal) {
  if (!dna || !Array.isArray(dna.rows) || !dna.rows.length) return;
  const showUntil = Math.max(0.2, hookTotal);
  if (t > showUntil) return;
  const sc = W / 720;
  const fade = t < 0.16 ? t / 0.16 : (t > showUntil - 0.22 ? Math.max(0, (showUntil - t) / 0.22) : 1);
  const pop = t < 0.2 ? 0.92 + (t / 0.2) * 0.08 : 1.0;

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.textBaseline = 'middle';

  const baseCenterY = H * Math.max(0.18, Math.min(0.82, dna.yPercent || 0.45));
  const rowMetrics = [];
  let totalHeight = 0;

  for (const row of dna.rows) {
    const spans = Array.isArray(row.spans) ? row.spans : [];
    const gap = (row.gapPx || 12) * sc;
    let rawW = 0, maxSize = 24;
    const measured = spans.map(sp => {
      const sz = Math.max(20, Math.min(140, sp.size || 46)) * sc;
      maxSize = Math.max(maxSize, sz);
      const ff = mapFontFamily(sp.font || 'bold');
      const weight = sp.font === 'script' ? '700' : '900';
      ctx.font = `${weight} ${Math.round(sz)}px ${ff}`;
      const tw = ctx.measureText(sp.text || '').width;
      const padX = sp.bg ? 28 * sc : 0;
      rawW += tw + padX;
      return { sp, sz, ff, weight, tw, padX };
    });
    if (spans.length > 1) rawW += gap * (spans.length - 1);

    const maxAllowedW = W - 48 * sc;
    const fitScale = rawW > maxAllowedW ? (maxAllowedW / rawW) : 1.0;
    const rowH = maxSize * fitScale * 1.24;
    totalHeight += rowH;
    rowMetrics.push({ measured, rawW: rawW * fitScale, fitScale, rowH, gap: gap * fitScale });
  }

  let curY = baseCenterY - totalHeight / 2;
  ctx.translate(W / 2, baseCenterY);
  ctx.scale(pop, pop);
  ctx.translate(-W / 2, -baseCenterY);

  for (const rm of rowMetrics) {
    const yMid = curY + rm.rowH / 2;
    let curX = (W - rm.rawW) / 2;

    for (const m of rm.measured) {
      const sz = m.sz * rm.fitScale;
      const tw = m.tw * rm.fitScale;
      const padX = m.padX * rm.fitScale;
      const boxW = tw + padX;
      const boxH = sz * 1.28;

      if (m.sp.bg) {
        ctx.save();
        ctx.fillStyle = m.sp.bg;
        ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 12 * sc;
        drawRoundBox(ctx, curX, yMid - boxH / 2, boxW, boxH, 12 * sc * rm.fitScale);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.font = `${m.weight} ${Math.round(sz)}px ${m.ff}`;
      ctx.textAlign = 'left';
      ctx.lineJoin = 'round';
      const tx = curX + padX / 2;

      if (m.sp.stroke && (m.sp.strokeW || 0) > 0) {
        ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 12 * sc;
        ctx.lineWidth = (m.sp.strokeW * sc) * rm.fitScale;
        ctx.strokeStyle = m.sp.stroke;
        ctx.strokeText(m.sp.text || '', tx, yMid);
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.78)'; ctx.shadowBlur = 14 * sc; ctx.shadowOffsetY = 3 * sc;
      }

      ctx.shadowBlur = m.sp.bg ? 0 : 8 * sc;
      ctx.fillStyle = m.sp.color || '#FFFFFF';
      ctx.fillText(m.sp.text || '', tx, yMid);
      ctx.restore();

      curX += boxW + rm.gap;
    }
    curY += rm.rowH + 6 * sc;
  }

  ctx.restore();
};

window.HOOK_TEMPLATES = [
  // MẪU 9 (TỪ ẢNH 1 BẠN GỬI): THÍCH NHƯNG [NGẠI GIÁ ??]
  {
    id: 'ngai-gia-hai-mau',
    name: '💎 Mẫu 9: THÍCH NHƯNG [NGẠI GIÁ ??] (Hộp Vàng Nổi Bật)',
    hookDuration: 2.8,
    fields: [
      { key: 'left', label: 'Cụm trái (Trắng viền đen)', default: 'THÍCH NHƯNG' },
      { key: 'right', label: 'Cụm phải (Chữ đen nền vàng)', default: 'NGẠI GIÁ ??' }
    ],
    render: function (ctx, t, W, H, data, hookTotal) {
      const showUntil = Math.max(0.2, hookTotal); if (t > showUntil) return;
      const sc = W / 720, fade = t > showUntil - 0.22 ? Math.max(0, (showUntil - t) / 0.22) : 1;
      const pop = t < 0.16 ? 0.85 + (t / 0.16) * 0.15 : 1.0;
      const left = (data.left || '').trim(), right = (data.right || '').trim();

      ctx.save(); ctx.globalAlpha = fade; ctx.textBaseline = 'middle';
      let sz = Math.round(52 * sc);
      const getWidths = (s) => {
        ctx.font = `700 ${s}px "Oswald", sans-serif`;
        const wL = left ? ctx.measureText(left).width : 0;
        const wR = right ? ctx.measureText(right).width : 0;
        const boxPad = right ? 28 * sc : 0;
        const gap = (left && right) ? 14 * sc : 0;
        return { wL, wR, boxPad, gap, total: wL + wR + boxPad + gap };
      };
      let m = getWidths(sz);
      while (m.total > W - 44 * sc && sz > 22) { sz -= 2; m = getWidths(sz); }

      const y = H * 0.65;
      const startX = (W - m.total) / 2;
      ctx.translate(W / 2, y); ctx.scale(pop, pop); ctx.translate(-W / 2, -y);
      ctx.font = `700 ${sz}px "Oswald", sans-serif`;

      if (left) {
        ctx.textAlign = 'left'; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 12 * sc;
        ctx.lineWidth = 11 * sc; ctx.strokeStyle = '#000000'; ctx.strokeText(left, startX, y);
        ctx.shadowBlur = 0; ctx.fillStyle = '#FFFFFF'; ctx.fillText(left, startX, y);
      }
      if (right) {
        const bx = startX + m.wL + m.gap;
        const bw = m.wR + m.boxPad, bh = sz * 1.32;
        ctx.fillStyle = '#FDE047';
        ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 12 * sc;
        drawRoundBox(ctx, bx, y - bh / 2, bw, bh, 12 * sc); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#09090B'; ctx.textAlign = 'center';
        ctx.fillText(right, bx + bw / 2, y + 1 * sc);
      }
      ctx.restore();
    }
  },

  // MẪU 10 (TỪ ẢNH 2 BẠN GỬI): Đầu tư 5 TỶ / làm Spa đến khi nào / thu hồi Vốn ?
  {
    id: 'dau-tu-5-ty',
    name: '🏢 Mẫu 10: Đầu Tư 5 TỶ / Viết Tay / Hồng Phấn (Y Hình 2)',
    hookDuration: 3.0,
    fields: [
      { key: 'topLead', label: 'Cụm trái dòng 1 (Trắng)', default: 'Đầu tư' },
      { key: 'topBig', label: 'Số to dòng 1 (Vàng)', default: '5 TỶ' },
      { key: 'midScript', label: 'Dòng 2 viết tay (Vàng nhạt)', default: 'bán trà sữa đến khi nào' },
      { key: 'botBold', label: 'Dòng 3 siêu đậm (Hồng phấn)', default: 'thu hồi Vốn ?' }
    ],
    render: function (ctx, t, W, H, data, hookTotal) {
      const showUntil = Math.max(0.2, hookTotal); if (t > showUntil) return;
      const sc = W / 720, fade = t > showUntil - 0.22 ? Math.max(0, (showUntil - t) / 0.22) : 1;
      const lead = (data.topLead || '').trim(), big = (data.topBig || '').trim();
      const mid = (data.midScript || '').trim(), bot = (data.botBold || '').trim();

      ctx.save(); ctx.globalAlpha = fade; ctx.textBaseline = 'middle';

      // Hàng 1: Đầu tư (46px trắng) + 5 TỶ (96px vàng)
      let szLead = Math.round(46 * sc), szBig = Math.round(96 * sc);
      const measureR1 = () => {
        ctx.font = `900 ${szLead}px "Be Vietnam Pro", sans-serif`; const w1 = lead ? ctx.measureText(lead + ' ').width : 0;
        ctx.font = `900 ${szBig}px "Be Vietnam Pro", sans-serif`; const w2 = big ? ctx.measureText(big).width : 0;
        return { w1, w2, tot: w1 + w2 };
      };
      let r1 = measureR1();
      while (r1.tot > W - 50 * sc && szBig > 40) { szLead = Math.round(szLead * 0.9); szBig = Math.round(szBig * 0.9); r1 = measureR1(); }
      const x1 = (W - r1.tot) / 2, y1 = H * 0.20;
      if (lead) {
        ctx.font = `900 ${szLead}px "Be Vietnam Pro", sans-serif`; ctx.textAlign = 'left';
        ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 16 * sc; ctx.fillStyle = '#FFFFFF';
        ctx.fillText(lead, x1, y1 + 8 * sc);
      }
      if (big) {
        ctx.font = `900 ${szBig}px "Be Vietnam Pro", sans-serif`; ctx.textAlign = 'left';
        ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 18 * sc; ctx.fillStyle = '#FDE047';
        ctx.fillText(big, x1 + r1.w1, y1);
      }

      // Hàng 2: Viết tay vàng nhạt viền đen
      if (mid) {
        ctx.textAlign = 'center';
        const msz = fitFont(ctx, mid, '700 {S}px "Dancing Script", cursive', W - 50 * sc, Math.round(64 * sc), 26);
        ctx.font = `700 ${msz}px "Dancing Script", cursive`; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 12 * sc;
        ctx.lineWidth = 6 * sc; ctx.strokeStyle = '#000000'; ctx.strokeText(mid, W / 2, H * 0.28);
        ctx.shadowBlur = 0; ctx.fillStyle = '#FEF08A'; ctx.fillText(mid, W / 2, H * 0.28);
      }

      // Hàng 3: Siêu đậm màu hồng phấn nhạt
      if (bot) {
        ctx.textAlign = 'center';
        const bsz = fitFont(ctx, bot, '900 {S}px "Be Vietnam Pro", sans-serif', W - 50 * sc, Math.round(62 * sc), 26);
        ctx.font = `900 ${bsz}px "Be Vietnam Pro", sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 14 * sc; ctx.shadowOffsetY = 4 * sc;
        ctx.fillStyle = '#FCE7F3'; ctx.fillText(bot, W / 2, H * 0.355);
      }
      ctx.restore();
    }
  },

  // MẪU 11: BỘ VẼ TỰ HỌC TỪ ẢNH MẪU (AI JSON DNA)
  {
    id: 'dynamic-ai-dna',
    name: '🧠 Mẫu AI Tự Học Từ Ảnh Mẫu (Dynamic DNA)',
    hookDuration: 2.8,
    fields: [
      { key: 'note', label: 'Ghi chú mẫu AI vừa học (chỉnh trực tiếp bằng AI)', default: 'Đang dùng cấu trúc mẫu học từ ảnh' }
    ],
    render: function (ctx, t, W, H, data, hookTotal) {
      if (window.ACTIVE_HOOK_DNA) window.renderDynamicHookDNA(ctx, t, W, H, window.ACTIVE_HOOK_DNA, hookTotal);
    }
  },

  // MẪU 1: KHỞI NGHIỆP (VÀNG - TRẮNG)
  {
    id: 'khoi-nghiep-y-hinh',
    name: '🥇 Mẫu 1: Khởi Nghiệp / Câu Chuyện (Vàng - Trắng)',
    hookDuration: 2.8,
    fields: [
      { key: 'num', label: 'Số / Từ nhấn (Trắng)', default: '32' },
      { key: 's1', label: 'Chữ viết tay (Vàng viền trắng)', default: 'Tuổi' },
      { key: 'lead', label: 'Dòng dẫn (Trắng đậm)', default: 'Khởi nghiệp' },
      { key: 'main', label: 'Từ khóa chính (Gõ máy |)', default: 'BÁN TRÀ SỮA' },
      { key: 'end', label: 'Câu hỏi chốt (Bóng đỏ)', default: 'Và cái kết bất ngờ !' }
    ],
    render: function (ctx, t, W, H, data, hookTotal) {
      const showUntil = Math.max(0.2, hookTotal); if (t > showUntil) return;
      const fadeOut = t > showUntil - 0.22 ? Math.max(0, (showUntil - t) / 0.22) : 1;
      const p = Math.min(1, t / Math.min(showUntil, 2.8));
      const num = (data.num || '').trim(), s1 = (data.s1 || '').trim(), lead = (data.lead || '').trim();
      const main = (data.main || '').trim(), end = (data.end || '').trim();
      const sc = W / 720;

      ctx.save(); ctx.globalAlpha = fadeOut;
      const showNum = p >= 0.14;
      const numPop = showNum && p < 0.26 ? 1 + (1 - (p - 0.14) / 0.12) * 0.3 : 1;
      ctx.textBaseline = 'middle';
      const fontS1 = `700 ${Math.round(160 * sc)}px "Dancing Script", cursive`;
      const fontNum = `900 ${Math.round(132 * sc)}px "Playfair Display", Georgia, serif`;
      ctx.font = fontS1; const wS1 = ctx.measureText(s1).width;
      ctx.font = fontNum; const wNum = showNum ? ctx.measureText(num + ' ').width : 0;
      const startX = W / 2 - (wNum + wS1) / 2, yRow1 = H * 0.43;

      if (showNum && num) {
        ctx.save(); ctx.translate(startX + wNum / 2, yRow1 + 8 * sc); ctx.scale(numPop, numPop);
        ctx.font = fontNum; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 16 * sc; ctx.shadowOffsetY = 5 * sc;
        ctx.lineWidth = 5 * sc; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.strokeText(num, 0, 0);
        ctx.shadowBlur = 0; ctx.fillStyle = '#FFFFFF'; ctx.fillText(num, 0, 0); ctx.restore();
      }
      if (s1) {
        ctx.save(); ctx.font = fontS1; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 18 * sc; ctx.shadowOffsetY = 5 * sc;
        ctx.lineWidth = 14 * sc; ctx.strokeStyle = '#FFFFFF'; ctx.strokeText(s1, startX + wNum, yRow1);
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.fillStyle = '#FEF08A'; ctx.fillText(s1, startX + wNum, yRow1); ctx.restore();
      }
      if (lead) {
        ctx.save(); ctx.textAlign = 'center';
        fitFont(ctx, lead, '900 {S}px "Be Vietnam Pro", sans-serif', W - 80 * sc, Math.round(44 * sc));
        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 12 * sc; ctx.fillStyle = '#FFFFFF';
        ctx.fillText(lead, W / 2, H * 0.535); ctx.restore();
      }
      if (main) {
        ctx.save(); ctx.textAlign = 'center';
        fitFont(ctx, main + '|', '900 {S}px "Playfair Display", Georgia, serif', W - 50 * sc, Math.round(48 * sc));
        const chars = Math.max(1, Math.floor(main.length * Math.min(1, p / 0.45)));
        const cursor = (p < 0.52 && Math.floor(t * 6) % 2 === 0) ? '|' : '';
        const txt = main.slice(0, chars) + cursor;
        ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(80,10,10,0.85)'; ctx.shadowBlur = 14 * sc;
        ctx.lineWidth = 8 * sc; ctx.strokeStyle = 'rgba(20,10,10,0.9)'; ctx.strokeText(txt, W / 2, H * 0.595);
        ctx.shadowBlur = 0; ctx.fillStyle = '#FDE68A'; ctx.fillText(txt, W / 2, H * 0.595); ctx.restore();
      }
      if (end && p >= 0.30) {
        const popEnd = p < 0.42 ? 1 + (1 - (p - 0.30) / 0.12) * 0.22 : 1;
        ctx.save(); ctx.translate(W / 2, H * 0.67); ctx.scale(popEnd, popEnd); ctx.textAlign = 'center';
        fitFont(ctx, end, '700 {S}px "Dancing Script", cursive', W - 60 * sc, Math.round(82 * sc));
        ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(135,18,18,0.95)'; ctx.shadowBlur = 22 * sc;
        ctx.lineWidth = 4 * sc; ctx.strokeStyle = 'rgba(90,12,12,0.75)'; ctx.strokeText(end, 0, 0);
        ctx.shadowBlur = 10 * sc; ctx.fillStyle = '#FFFBEB'; ctx.fillText(end, 0, 0); ctx.restore();
      }
      ctx.restore();
    }
  },

  // MẪU 8: OOTD GÓC TRÁI
  {
    id: 'ootd-lookbook-trai',
    name: '👗 Mẫu 8: OOTD / Lookbook Góc Trái (LOOK 1, 2, 3...)',
    hookDuration: 2.5,
    renderOnNonHook: true,
    fadeIntro: true,
    fields: [
      { key: 'hookText', label: 'Chữ dẫn ở các cảnh Hook', default: '🎙️ Dừng lại đây nếu nàng đang tìm công thức chuẩn gu...' },
      { key: 'prefix', label: 'Tiêu đề góc trái (VD: OOTD)', default: 'OOTD' },
      { key: 'label', label: 'Nhãn đếm số (VD: LOOK)', default: 'LOOK' },
      { key: 'tags', label: 'Nhãn nhỏ đổi theo cảnh (cách bằng dấu phẩy)', default: 'Thu Đông 🍂, Tết 🧧, Đi học / Đi làm 👩🏻‍💼, Cuối tuần ☕' }
    ],
    render: function (ctx, t, W, H, data, hookTotal, segInfo) {
      const sc = W / 720, isHookBeat = segInfo ? !!segInfo.seg.isHook : (t <= hookTotal);
      if (isHookBeat) {
        const txt = (data.hookText || '').trim(); if (!txt) return;
        const dur = Math.max(0.2, hookTotal);
        const alpha = t < 0.2 ? t / 0.2 : (t > dur - 0.2 ? Math.max(0, (dur - t) / 0.2) : 1);
        ctx.save(); ctx.globalAlpha = alpha; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `700 ${Math.round(28 * sc)}px "Be Vietnam Pro", sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 10 * sc; ctx.lineWidth = 4 * sc; ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        const words = txt.split(/\s+/), lines = []; let cur = '';
        for (const w of words) {
          const test = cur ? cur + ' ' + w : w;
          if (ctx.measureText(test).width > W - 110 * sc && cur) { lines.push(cur); cur = w; } else cur = test;
        }
        if (cur) lines.push(cur);
        lines.forEach((ln, i) => { ctx.strokeText(ln, W / 2, H * 0.16 + i * 38 * sc); ctx.fillStyle = '#F8FAFC'; ctx.fillText(ln, W / 2, H * 0.16 + i * 38 * sc); });
        ctx.restore(); return;
      }
      const bodyIdx = segInfo ? Math.max(0, segInfo.bodyBeatIdx) : 0, dt = segInfo ? segInfo.dt : 0.5;
      const popAlpha = Math.min(1, dt / 0.16), slideX = dt < 0.18 ? (1 - dt / 0.18) * (-16 * sc) : 0;
      const tags = (data.tags || '').split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      const customNote = segInfo?.seg?.beatNote ? segInfo.seg.beatNote.trim() : '';
      const topTag = customNote || tags[bodyIdx % Math.max(1, tags.length)] || '';
      const prefix = (data.prefix || 'OOTD').trim(), label = (data.label || 'LOOK').trim();

      ctx.save(); ctx.globalAlpha = popAlpha; ctx.translate(slideX, 0); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 10 * sc;
      if (topTag) {
        ctx.font = `700 ${Math.round(28 * sc)}px "Be Vietnam Pro", sans-serif`;
        ctx.lineWidth = 4 * sc; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.strokeText(topTag, W * 0.08, H * 0.25);
        ctx.fillStyle = '#FFFFFF'; ctx.fillText(topTag, W * 0.08, H * 0.25);
      }
      if (prefix) {
        ctx.font = `900 ${Math.round(44 * sc)}px "Be Vietnam Pro", sans-serif`;
        ctx.lineWidth = 5 * sc; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeText(prefix, W * 0.08, H * 0.45);
        ctx.fillStyle = '#FFFFFF'; ctx.fillText(prefix, W * 0.08, H * 0.45);
      }
      const lookText = `${label} ${bodyIdx + 1}`.trim();
      ctx.font = `700 ${Math.round(28 * sc)}px "Be Vietnam Pro", sans-serif`;
      ctx.lineWidth = 4 * sc; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.strokeText(lookText, W * 0.11, H * 0.495);
      ctx.fillStyle = '#F1F5F9'; ctx.fillText(lookText, W * 0.11, H * 0.495);
      ctx.restore();
    }
  },

  // MẪU 2: CUTE HỒNG
  {
    id: 'cute-pink-milk',
    name: '🌸 Mẫu 2: Cute Hồng Kẹo Ngọt',
    hookDuration: 3.0,
    fields: [
      { key: 'badge', label: 'Nhãn nhỏ phía trên', default: '🔥 CẢNH BÁO GÂY NGHIỆN' },
      { key: 'main', label: 'Chữ chính Hồng Tròn', default: 'TRÀ SỮA NHÀ LÀM' },
      { key: 'sub', label: 'Dòng dễ thương bên dưới', default: 'Thử 1 lần là mê cả tuần 💕' }
    ],
    render: function (ctx, t, W, H, data, hookTotal) {
      const showUntil = Math.max(0.2, hookTotal); if (t > showUntil) return;
      const sc = W / 720, fade = t > showUntil - 0.22 ? Math.max(0, (showUntil - t) / 0.22) : 1;
      const bounce = 1 + Math.abs(Math.sin(t * 5.5)) * 0.06;
      ctx.save(); ctx.globalAlpha = fade; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const badge = (data.badge || '').trim();
      if (badge) {
        const bsz = fitFont(ctx, badge, '800 {S}px "Baloo 2", cursive', W - 110 * sc, Math.round(28 * sc), 18);
        ctx.font = `800 ${bsz}px "Baloo 2", cursive`;
        const bw = Math.min(W - 60 * sc, ctx.measureText(badge).width + 56 * sc), bh = 52 * sc;
        ctx.fillStyle = '#F472B6'; ctx.shadowColor = 'rgba(219,39,119,0.5)'; ctx.shadowBlur = 14 * sc;
        drawRoundBox(ctx, W / 2 - bw / 2, H * 0.37 - bh / 2, bw, bh, 26 * sc); ctx.fill();
        ctx.lineWidth = 4 * sc; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
        ctx.shadowBlur = 0; ctx.fillStyle = '#FFFFFF'; ctx.fillText(badge, W / 2, H * 0.37 + 2 * sc);
      }
      const main = (data.main || '').trim();
      if (main) {
        ctx.save(); ctx.translate(W / 2, H * 0.48); ctx.scale(bounce, bounce);
        const sz = fitFont(ctx, main, '800 {S}px "Baloo 2", cursive', W - 70 * sc, Math.round(72 * sc), 30);
        ctx.font = `800 ${sz}px "Baloo 2", cursive`; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(190,24,93,0.75)'; ctx.shadowBlur = 18 * sc; ctx.shadowOffsetY = 6 * sc;
        ctx.lineWidth = 16 * sc; ctx.strokeStyle = '#FFFFFF'; wrapCenterText(ctx, main, 0, 0, W - 70 * sc, sz * 1.08);
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.fillStyle = '#FB7185'; wrapCenterText(ctx, main, 0, 0, W - 70 * sc, sz * 1.08);
        ctx.restore();
      }
      const sub = (data.sub || '').trim();
      if (sub && (t / showUntil) >= 0.12) {
        const ssz = fitFont(ctx, sub, '800 {S}px "Baloo 2", cursive', W - 90 * sc, Math.round(30 * sc), 18);
        ctx.font = `800 ${ssz}px "Baloo 2", cursive`;
        const sw = Math.min(W - 50 * sc, ctx.measureText(sub).width + 48 * sc), sh = 54 * sc;
        ctx.fillStyle = 'rgba(255,241,242,0.95)'; ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12 * sc;
        drawRoundBox(ctx, W / 2 - sw / 2, H * 0.60 - sh / 2, sw, sh, 27 * sc); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#DB2777'; ctx.fillText(sub, W / 2, H * 0.60 + 2 * sc);
      }
      ctx.restore();
    }
  },

  // MẪU 3: XANH MATCHA
  {
    id: 'mint-matcha-fresh',
    name: '🍵 Mẫu 3: Xanh Matcha Tươi Mát',
    hookDuration: 3.0,
    fields: [
      { key: 'badge', label: 'Nhãn nhỏ', default: '🌿 CHỈ SỢ BẠN GHIỀN' },
      { key: 'main', label: 'Chữ chính', default: 'TRÀ ĐẶC BIỆT' },
      { key: 'sub', label: 'Dòng mô tả', default: 'Mát lạnh tan chảy ngày nắng ☀️' }
    ],
    render: function (ctx, t, W, H, data, hookTotal) {
      const showUntil = Math.max(0.2, hookTotal); if (t > showUntil) return;
      const sc = W / 720, fade = t > showUntil - 0.22 ? Math.max(0, (showUntil - t) / 0.22) : 1;
      ctx.save(); ctx.globalAlpha = fade; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const badge = (data.badge || '').trim();
      if (badge) {
        const bsz = fitFont(ctx, badge, '800 {S}px "Baloo 2", cursive', W - 100 * sc, Math.round(28 * sc), 18);
        ctx.font = `800 ${bsz}px "Baloo 2", cursive`;
        const bw = Math.min(W - 70 * sc, ctx.measureText(badge).width + 54 * sc);
        ctx.fillStyle = '#10B981'; drawRoundBox(ctx, W / 2 - bw / 2, H * 0.38 - 24 * sc, bw, 48 * sc, 24 * sc); ctx.fill();
        ctx.fillStyle = '#ECFDF5'; ctx.fillText(badge, W / 2, H * 0.38 + 2 * sc);
      }
      const main = (data.main || '').trim();
      if (main) {
        const sz = fitFont(ctx, main, '800 {S}px "Baloo 2", cursive', W - 70 * sc, Math.round(68 * sc), 30);
        ctx.font = `800 ${sz}px "Baloo 2", cursive`; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(6,78,59,0.8)'; ctx.shadowBlur = 16 * sc;
        ctx.lineWidth = 14 * sc; ctx.strokeStyle = '#FFFFFF'; wrapCenterText(ctx, main, W / 2, H * 0.49, W - 70 * sc, sz * 1.08);
        ctx.shadowBlur = 0; ctx.fillStyle = '#34D399'; wrapCenterText(ctx, main, W / 2, H * 0.49, W - 70 * sc, sz * 1.08);
      }
      const sub = (data.sub || '').trim();
      if (sub) {
        const ssz = fitFont(ctx, sub, '700 {S}px "Dancing Script", cursive', W - 70 * sc, Math.round(38 * sc), 20);
        ctx.font = `700 ${ssz}px "Dancing Script", cursive`;
        ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 12 * sc;
        ctx.fillStyle = '#ECFDF5'; ctx.fillText(sub, W / 2, H * 0.60);
      }
      ctx.restore();
    }
  },

  // MẪU 4: REMIX NEON
  {
    id: 'remix-den-trang-chop',
    name: '⚡ Mẫu 4: Remix Đèn Neon Đổi Màu',
    hookDuration: 3.0,
    bwFirst3s: true,
    fields: [
      { key: 'num', label: 'Nhãn trên', default: 'KHOAN LƯỚT! 🔥' },
      { key: 'main', label: 'Tiêu đề chính', default: 'CÁI KẾT KHÔNG NGỜ!' },
      { key: 'end', label: 'Dòng phụ', default: 'Xem hết tới cuối mới thấy độ cháy 🎧' }
    ],
    render: function (ctx, t, W, H, data, hookTotal) {
      const showUntil = Math.max(0.2, hookTotal); if (t > showUntil) return;
      const sc = W / 720, neonList = ['#22D3EE', '#F472B6', '#A855F7', '#FDE047'];
      const color = neonList[Math.floor(t * 3) % neonList.length];
      const pulse = (t % 0.45) < 0.14 ? 1.15 : 1.0;
      ctx.save(); ctx.translate(W / 2, H * 0.48); ctx.scale(pulse, pulse);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = color; ctx.shadowBlur = 24 * sc;
      const nsz = fitFont(ctx, data.num || '', '700 {S}px "Chakra Petch", sans-serif', W - 80 * sc, Math.round(36 * sc), 20);
      ctx.font = `700 ${nsz}px "Chakra Petch", sans-serif`; ctx.fillStyle = '#FFFFFF'; ctx.fillText(data.num || '', 0, -75 * sc);
      const sz = fitFont(ctx, data.main || '', '700 {S}px "Chakra Petch", sans-serif', W - 70 * sc, Math.round(54 * sc), 26);
      ctx.font = `700 ${sz}px "Chakra Petch", sans-serif`; ctx.lineWidth = 6 * sc; ctx.strokeStyle = '#000000';
      wrapCenterText(ctx, data.main || '', 0, 0, W - 70 * sc, sz * 1.12);
      ctx.fillStyle = color; wrapCenterText(ctx, data.main || '', 0, 0, W - 70 * sc, sz * 1.12);
      ctx.shadowBlur = 10 * sc;
      const esz = fitFont(ctx, data.end || '', '700 {S}px "Be Vietnam Pro", sans-serif', W - 80 * sc, Math.round(28 * sc), 18);
      ctx.font = `700 ${esz}px "Be Vietnam Pro", sans-serif`;
      ctx.fillStyle = '#E2E8F0'; ctx.fillText(data.end || '', 0, 82 * sc);
      ctx.restore();
    }
  },

  // MẪU 5: CAM RỰC
  {
    id: 'cam-nang-nang-dong',
    name: '🍊 Mẫu 5: Cam Vàng Review Quán Ăn',
    hookDuration: 3.0,
    fields: [
      { key: 'tag', label: 'Ruy-băng nghiêng', default: '🔥 QUÁN ĐÔNG NGHỊT KHÁCH' },
      { key: 'main', label: 'Món / Chủ đề chính', default: 'TRÀ SEN VÀNG' },
      { key: 'sub', label: 'Chốt tò mò bên dưới', default: 'Bí quyết khiến khách quay lại mỗi ngày 😋' }
    ],
    render: function (ctx, t, W, H, data, hookTotal) {
      const showUntil = Math.max(0.2, hookTotal); if (t > showUntil) return;
      const sc = W / 720, fade = t > showUntil - 0.22 ? Math.max(0, (showUntil - t) / 0.22) : 1;
      ctx.save(); ctx.globalAlpha = fade; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.save(); ctx.translate(W / 2, H * 0.39); ctx.rotate(-0.04);
      const tsz = fitFont(ctx, data.tag || '', '900 {S}px "Be Vietnam Pro", sans-serif', W - 120 * sc, Math.round(28 * sc), 18);
      ctx.font = `900 ${tsz}px "Be Vietnam Pro", sans-serif`;
      const tw = Math.min(W - 70 * sc, ctx.measureText(data.tag || '').width + 52 * sc);
      ctx.fillStyle = '#F97316'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12 * sc;
      drawRoundBox(ctx, -tw / 2, -26 * sc, tw, 52 * sc, 12 * sc); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#FFFFFF'; ctx.fillText(data.tag || '', 0, 1 * sc); ctx.restore();
      const sz = fitFont(ctx, data.main || '', '700 {S}px "Oswald", sans-serif', W - 70 * sc, Math.round(74 * sc), 32);
      ctx.font = `700 ${sz}px "Oswald", sans-serif`; ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 14 * sc; ctx.lineWidth = 10 * sc; ctx.strokeStyle = '#7C2D12';
      wrapCenterText(ctx, data.main || '', W / 2, H * 0.50, W - 70 * sc, sz * 1.1);
      ctx.shadowBlur = 0; ctx.fillStyle = '#FACC15'; wrapCenterText(ctx, data.main || '', W / 2, H * 0.50, W - 70 * sc, sz * 1.1);
      const ssz = fitFont(ctx, data.sub || '', '800 {S}px "Be Vietnam Pro", sans-serif', W - 70 * sc, Math.round(30 * sc), 18);
      ctx.font = `800 ${ssz}px "Be Vietnam Pro", sans-serif`; ctx.shadowColor = '#000'; ctx.shadowBlur = 10 * sc;
      ctx.lineWidth = 5 * sc; ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      wrapCenterText(ctx, data.sub || '', W / 2, H * 0.61, W - 70 * sc, ssz * 1.25);
      ctx.fillStyle = '#FFFFFF'; wrapCenterText(ctx, data.sub || '', W / 2, H * 0.61, W - 70 * sc, ssz * 1.25);
      ctx.restore();
    }
  },

  // MẪU 6: BĂNG ĐỎ TIN NÓNG
  {
    id: 'tieu-de-do-tin-nong',
    name: '🚨 Mẫu 6: Băng Đỏ Tin Nóng',
    hookDuration: 3.0,
    fields: [
      { key: 'alert', label: 'Băng Đỏ Cảnh Báo', default: '🚨 KHOAN ĐÃ! ĐỪNG LƯỚT QUA' },
      { key: 'main', label: 'Tiêu đề gây sốc', default: 'SỰ THẬT ÍT AI BIẾT VỀ QUÁN NÀY' },
      { key: 'sub', label: 'Dòng phụ bên dưới', default: 'Xem hết tới cuối mới thấy cái kết!' }
    ],
    render: function (ctx, t, W, H, data, hookTotal) {
      const showUntil = Math.max(0.2, hookTotal); if (t > showUntil) return;
      const sc = W / 720, shakeX = t < 0.45 ? Math.sin(t * 50) * 6 * sc : 0;
      ctx.save(); ctx.translate(shakeX, 0); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#DC2626'; ctx.fillRect(0, H * 0.36 - 30 * sc, W, 60 * sc);
      const asz = fitFont(ctx, data.alert || '', '900 {S}px "Be Vietnam Pro", sans-serif', W - 50 * sc, Math.round(28 * sc), 18);
      ctx.font = `900 ${asz}px "Be Vietnam Pro", sans-serif`; ctx.fillStyle = '#FFFFFF'; ctx.fillText(data.alert || '', W / 2, H * 0.36);
      const sz = fitFont(ctx, data.main || '', '900 {S}px "Be Vietnam Pro", sans-serif', W - 60 * sc, Math.round(54 * sc), 26);
      ctx.font = `900 ${sz}px "Be Vietnam Pro", sans-serif`; ctx.lineJoin = 'round'; ctx.lineWidth = 10 * sc; ctx.strokeStyle = '#000000';
      wrapCenterText(ctx, data.main || '', W / 2, H * 0.49, W - 60 * sc, sz * 1.15);
      ctx.fillStyle = '#FDE047'; wrapCenterText(ctx, data.main || '', W / 2, H * 0.49, W - 60 * sc, sz * 1.15);
      const ssz = fitFont(ctx, data.sub || '', '800 {S}px "Be Vietnam Pro", sans-serif', W - 70 * sc, Math.round(28 * sc), 18);
      ctx.font = `800 ${ssz}px "Be Vietnam Pro", sans-serif`; ctx.shadowColor = '#000'; ctx.shadowBlur = 10 * sc;
      ctx.fillStyle = '#FFFFFF'; wrapCenterText(ctx, data.sub || '', W / 2, H * 0.61, W - 70 * sc, ssz * 1.25);
      ctx.restore();
    }
  },

  // MẪU 7: SANG CHẢNH
  {
    id: 'sang-chanh-gold',
    name: '✨ Mẫu 7: Sang Chảnh Vàng Champagne',
    hookDuration: 3.0,
    fields: [
      { key: 'top', label: 'Chữ nhỏ viết hoa', default: 'BÍ MẬT ĐẰNG SAU' },
      { key: 'main', label: 'Tiêu đề chính có chân', default: 'Chút Bình Yên Cuối Ngày' },
      { key: 'sub', label: 'Chữ ký bên dưới', default: 'Lưu giữ khoảnh khắc đáng nhớ ✨' }
    ],
    render: function (ctx, t, W, H, data, hookTotal) {
      const showUntil = Math.max(0.2, hookTotal); if (t > showUntil) return;
      const sc = W / 720, fade = t > showUntil - 0.25 ? Math.max(0, (showUntil - t) / 0.25) : Math.min(1, t / 0.3);
      ctx.save(); ctx.globalAlpha = fade; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(24 * sc)}px "Be Vietnam Pro", sans-serif`; ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 10 * sc;
      ctx.fillStyle = '#FDE68A'; ctx.fillText(data.top || '', W / 2, H * 0.41);
      ctx.fillRect(W / 2 - 90 * sc, H * 0.44, 180 * sc, 2 * sc);
      const sz = fitFont(ctx, data.main || '', '900 {S}px "Playfair Display", Georgia, serif', W - 70 * sc, Math.round(62 * sc), 28);
      ctx.font = `900 ${sz}px "Playfair Display", Georgia, serif`; ctx.fillStyle = '#FFFFFF';
      wrapCenterText(ctx, data.main || '', W / 2, H * 0.51, W - 70 * sc, sz * 1.15);
      const ssz = fitFont(ctx, data.sub || '', '700 {S}px "Dancing Script", cursive', W - 70 * sc, Math.round(44 * sc), 22);
      ctx.font = `700 ${ssz}px "Dancing Script", cursive`; ctx.fillStyle = '#FDE68A'; ctx.fillText(data.sub || '', W / 2, H * 0.61);
      ctx.restore();
    }
  }
];