/* ==========================================================================
   KimBling Studio - shared-core.js v2 (Lõi dùng chung + Lưu Dự án + Giọng Thật)
   ========================================================================== */
(function (global) {
    'use strict';

    const GEMINI_KEY_STORAGE     = 'kimbling_gemini_api_key';
    const PAID_VOICE_KEY_STORAGE = 'kimbling_paid_voice_api_key';
    const CUSTOM_VOICES_STORAGE  = 'kimbling_custom_replicated_voices_v1';
    const STORAGE_RAW_SCRIPT     = 'kimbling_v4_raw_script';
    const STORAGE_PROJECT        = 'kimbling_v4_project';
    const STORAGE_NICHE          = 'kimbling_v4_niche';
    const IDB_NAME               = 'KimBlingModularDB';
    const IDB_STORE              = 'media';

    // Danh sách Model Gemini 2026 ổn định
    const TEXT_MODELS = [
        'gemini-3.8-flash',
        'gemini-3.6-flash',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash-lite',
        'gemini-3.5-flash-lite'
    ];
    const TTS_MODELS = [
        'gemini-3.8-flash-tts',
        'gemini-3.8-flash-lite-tts',
        'gemini-2.5-flash-tts',
        'gemini-2.5-flash-preview-tts'
    ];

    // Đầy đủ 30 giọng chính thức của Google Gemini TTS
    const TTS_VOICES = [
        { id: 'Leda',        name: 'Leda',        gender: 'F', group: '🌸 Nữ - Trẻ trung & Bắt trend', desc: 'Trẻ trung, dễ thương, hợp TikTok' },
        { id: 'Zephyr',      name: 'Zephyr',      gender: 'F', group: '🌸 Nữ - Trẻ trung & Bắt trend', desc: 'Tươi sáng, trong trẻo, năng lượng' },
        { id: 'Laomedeia',   name: 'Laomedeia',   gender: 'F', group: '🌸 Nữ - Trẻ trung & Bắt trend', desc: 'Sôi nổi, vui tươi, bắt trend nhanh' },
        { id: 'Autonoe',     name: 'Autonoe',     gender: 'F', group: '🌸 Nữ - Trẻ trung & Bắt trend', desc: 'Sáng sủa, tích cực, rạng rỡ' },
        { id: 'Aoede',       name: 'Aoede',       gender: 'F', group: '🍃 Nữ - Dịu nhẹ, Spa & Kể chuyện', desc: 'Nhẹ nhàng, bay bổng, Chill' },
        { id: 'Vindemiatrix',name: 'Vindemiatrix',gender: 'F', group: '🍃 Nữ - Dịu nhẹ, Spa & Kể chuyện', desc: 'Dịu ngọt, thư giãn kiểu Spa' },
        { id: 'Achernar',    name: 'Achernar',    gender: 'F', group: '🍃 Nữ - Dịu nhẹ, Spa & Kể chuyện', desc: 'Mềm mại, thủ thỉ tâm sự' },
        { id: 'Sulafat',     name: 'Sulafat',     gender: 'F', group: '🍃 Nữ - Dịu nhẹ, Spa & Kể chuyện', desc: 'Ấm áp, truyền cảm sâu lắng' },
        { id: 'Despina',     name: 'Despina',     gender: 'F', group: '🍃 Nữ - Dịu nhẹ, Spa & Kể chuyện', desc: 'Mượt mà, êm ái, dễ nghe' },
        { id: 'Kore',        name: 'Kore',        gender: 'F', group: '✨ Nữ - Rõ chữ, Review & Chốt đơn', desc: 'Tự tin, chắc nhịp, chốt đơn' },
        { id: 'Erinome',     name: 'Erinome',     gender: 'F', group: '✨ Nữ - Rõ chữ, Review & Chốt đơn', desc: 'Rõ chữ, hợp giảng dạy & review' },
        { id: 'Callirrhoe',  name: 'Callirrhoe',  gender: 'F', group: '✨ Nữ - Rõ chữ, Review & Chốt đơn', desc: 'Thoải mái, tự nhiên, gần gũi' },
        { id: 'Gacrux',      name: 'Gacrux',      gender: 'F', group: '✨ Nữ - Rõ chữ, Review & Chốt đơn', desc: 'Trưởng thành, sang trọng, uy tín' },
        { id: 'Pulcherrima', name: 'Pulcherrima', gender: 'F', group: '✨ Nữ - Rõ chữ, Review & Chốt đơn', desc: 'Thanh thoát, nổi bật, lôi cuốn' },
        { id: 'Puck',        name: 'Puck',        gender: 'M', group: '⚡ Nam - Sôi nổi & Vlog đời thường', desc: 'Sôi nổi, trẻ trung, lanh lợi' },
        { id: 'Fenrir',      name: 'Fenrir',      gender: 'M', group: '⚡ Nam - Sôi nổi & Vlog đời thường', desc: 'Nhiệt huyết, mạnh mẽ, cuốn hút' },
        { id: 'Sadachbia',   name: 'Sadachbia',   gender: 'M', group: '⚡ Nam - Sôi nổi & Vlog đời thường', desc: 'Hoạt bát, nhanh nhẹn, vui vẻ' },
        { id: 'Zubenelgenubi',name:'Zubenelgenubi',gender:'M', group: '⚡ Nam - Sôi nổi & Vlog đời thường', desc: 'Thoải mái, tự nhiên kiểu Vlog' },
        { id: 'Umbriel',     name: 'Umbriel',     gender: 'M', group: '⚡ Nam - Sôi nổi & Vlog đời thường', desc: 'Thân thiện, dễ mến, đời thường' },
        { id: 'Achird',      name: 'Achird',      gender: 'M', group: '⚡ Nam - Sôi nổi & Vlog đời thường', desc: 'Gần gũi, thân mật, trò chuyện' },
        { id: 'Charon',      name: 'Charon',      gender: 'M', group: '🎙️ Nam - Trầm ấm & Chuyên gia', desc: 'Điềm tĩnh, đáng tin, thuyết minh' },
        { id: 'Orus',        name: 'Orus',        gender: 'M', group: '🎙️ Nam - Trầm ấm & Chuyên gia', desc: 'Chững chạc, dứt khoát, rành mạch' },
        { id: 'Iapetus',     name: 'Iapetus',     gender: 'M', group: '🎙️ Nam - Trầm ấm & Chuyên gia', desc: 'Rõ từng chữ, hướng dẫn kỹ thuật' },
        { id: 'Algieba',     name: 'Algieba',     gender: 'M', group: '🎙️ Nam - Trầm ấm & Chuyên gia', desc: 'Trầm mượt, sang trọng, đẳng cấp' },
        { id: 'Algenib',     name: 'Algenib',     gender: 'M', group: '🎙️ Nam - Trầm ấm & Chuyên gia', desc: 'Khàn nam tính, quảng cáo ấn tượng' },
        { id: 'Enceladus',   name: 'Enceladus',   gender: 'M', group: '🎙️ Nam - Trầm ấm & Chuyên gia', desc: 'Trầm ấm, thủ thỉ nhẹ nhàng' },
        { id: 'Rasalgethi',  name: 'Rasalgethi',  gender: 'M', group: '🎙️ Nam - Trầm ấm & Chuyên gia', desc: 'Thuyết minh, review chuyên sâu' },
        { id: 'Alnilam',     name: 'Alnilam',     gender: 'M', group: '🎙️ Nam - Trầm ấm & Chuyên gia', desc: 'Mạnh mẽ, chắc khỏe, dứt điểm' },
        { id: 'Schedar',     name: 'Schedar',     gender: 'M', group: '🎙️ Nam - Trầm ấm & Chuyên gia', desc: 'Đều đặn, rõ ràng, chuyên nghiệp' },
        { id: 'Sadaltager',  name: 'Sadaltager',  gender: 'M', group: '🎙️ Nam - Trầm ấm & Chuyên gia', desc: 'Hiểu biết, chia sẻ kiến thức' }
    ];

    const SHOT_RECIPES = {
        shelf_pullback: {
            id: 'shelf_pullback', name: 'Kéo Lùi Cận Món (Tỳ Cạnh Bàn)',
            mode: 'Video', lens: '1x', resFps: '4K • 60fps', ev: '-1.0',
            angleDeg: 55, distance: '20 – 30cm', holdMode: 'normal', svgType: 'pullback',
            propTip: 'Tỳ cổ tay vào cạnh bàn/tủ kính để chống rung, chạm khóa nét vào món rồi kéo lùi chậm về sau.',
            capcutGuide: 'Tốc độ → Uốn cong (Tùy chỉnh): Đẩy nhanh 2x ở 0.5s đầu, hạ chậm 0.5x ở đoạn giữa.'
        },
        fg_reveal: {
            id: 'fg_reveal', name: 'Tiền Cảnh Hé Không Gian Quán',
            mode: 'Video', lens: '0.5x', resFps: '4K • 60fps', ev: '-0.7',
            angleDeg: 85, distance: '1 – 2m', holdMode: 'normal', svgType: 'reveal',
            propTip: 'Đứng sau mép tường hoặc cánh cửa cho tối 1/3 bên phải khung hình, xoay nhẹ máy hé dần ra toàn quán.',
            capcutGuide: 'Cắt mượt 3s đẹp nhất, thêm Chuyển cảnh Mờ dần (0.3s) hoặc Kéo vào sang cảnh tiếp.'
        },
        paper_rack_focus: {
            id: 'paper_rack_focus', name: 'Lướt Tờ Giấy + Chuyển Nét (Rack Focus)',
            mode: 'Video', lens: '1x', resFps: '4K • 60/120', ev: '-0.7',
            angleDeg: 75, distance: '25 – 40cm', holdMode: 'normal', svgType: 'rack_focus',
            propTip: 'Đặt đáy iPhone lên 1 tờ giấy hoặc khăn vải mềm trượt trên bàn. Chạm nét vật trang trí phía sau → bấm quay → đẩy lướt tới trước và chạm chuyển nét sang món chính.',
            capcutGuide: 'Giữ nguyên đoạn chuyển nét từ mờ sang rõ, tăng Độ sắc nét (+15) trong Điều chỉnh.'
        },
        upside_down_logo: {
            id: 'upside_down_logo', name: 'Lộn Ngược Máy Quay Bảng Hiệu / Đèn',
            mode: 'Video', lens: '0.5x', resFps: '4K • 60fps', ev: '-1.2',
            angleDeg: 45, distance: '30 – 50cm', holdMode: 'upside_down', svgType: 'upside_down',
            propTip: '🙃 Quay LỘN NGƯỢC iPhone (cụm camera xuống dưới). Đưa sát qua đèn trên cao rồi kéo thẳng xuống logo (giảm EV -1.2 đến -1.7 để không cháy đèn).',
            capcutGuide: 'Cắt đoạn lia qua đèn đẹp nhất, vào Điều chỉnh giảm Điểm nhấn (-25) cho chữ nổi.'
        },
        slomo_orbit_table: {
            id: 'slomo_orbit_table', name: 'Slo-mo Uốn Lượn Bàn Món (Lộn Ngược)',
            mode: 'Quay chậm (Slo-mo)', lens: '0.5x', resFps: 'HD • 120fps', ev: '-0.7',
            angleDeg: 40, distance: '20 – 60cm', holdMode: 'upside_down', svgType: 'slomo_orbit',
            propTip: '🙃 Bật Quay chậm 120fps + LỘN NGƯỢC máy. Đi từ trên cao lượn xuống sát từng đĩa món ăn, lia ngang sang ly nước rồi kéo trả về cảnh toàn bàn.',
            capcutGuide: 'Vào Tốc độ → Uốn cong: Tăng tốc 2.5x ở đoạn lia chuyển bàn, giữ chậm 0.4x ngay mặt món ăn!'
        },
        macro_detail: {
            id: 'macro_detail', name: 'Đặc Tả Cận Cảnh Sát Vật (Macro)',
            mode: 'Video', lens: '1x hoặc 2x', resFps: '4K • 60fps', ev: '-0.5',
            angleDeg: 45, distance: '15 – 20cm', holdMode: 'normal', svgType: 'macro',
            propTip: 'Đưa máy sát 15cm, chạm khóa nét đúng chi tiết (bọt kem/trân châu/sợi mày/môi). Chếch đèn 35° tránh bóng lóa trực tiếp.',
            capcutGuide: 'Giữ tiếng gốc ASMR (120%) nếu là rót nước/đá rơi; cắt ngắn 2.5–3.5s cho sắc nét.'
        },
        vlog_talking: {
            id: 'vlog_talking', name: 'Nói Thẳng Ống Kính / Mở Đầu Vlog',
            mode: 'Video', lens: '1x', resFps: '4K • 30/60', ev: '-0.3',
            angleDeg: 88, distance: '60 – 90cm', holdMode: 'normal', svgType: 'talking',
            propTip: 'Đặt máy cố định ngang tầm mắt (0°), không hếch từ dưới cằm. Bật lưới 3×3 đặt mắt ở vạch 1/3 trên.',
            capcutGuide: 'Giữ tiếng nói gốc hoặc ghép giọng AI + thêm chữ Tiêu đề ở 1/3 dưới khung hình.'
        },
        spa_before_after: {
            id: 'spa_before_after', name: 'Quay Thành Phẩm Spa / Trước – Sau',
            mode: 'Video', lens: '1x – 1.5x', resFps: '4K • 60fps', ev: '-0.5',
            angleDeg: 85, distance: '30 – 45cm', holdMode: 'normal', svgType: 'macro',
            propTip: 'Đèn đặt chếch 35° không chiếu thẳng gây lóa da/môi. Giữ cố định 1 góc quay Trước và Sau để ghép chuyển cảnh khớp 100%.',
            capcutGuide: 'Dùng chuyển cảnh Chớp sáng hoặc Mờ dần (0.3s) giữa clip Trước và clip Sau; không kéo mịn da quá tay.'
        }
    };

    function escHtml(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
        return new Promise((resolve, reject) => {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
            ta.remove();
        });
    }

    // Quản lý Key chính (Free) & Paid Key riêng cho Giọng Thật
    function getKey() { return (localStorage.getItem(GEMINI_KEY_STORAGE) || '').trim(); }
    function setKey(k) { const v = String(k || '').trim(); if (v) localStorage.setItem(GEMINI_KEY_STORAGE, v); }
    function clearKey() { localStorage.removeItem(GEMINI_KEY_STORAGE); }
    function hasKey() { return !!getKey(); }

    function getVoiceKey() { return (localStorage.getItem(PAID_VOICE_KEY_STORAGE) || '').trim(); }
    function setVoiceKey(k) { const v = String(k || '').trim(); if (v) localStorage.setItem(PAID_VOICE_KEY_STORAGE, v); }
    function clearVoiceKey() { localStorage.removeItem(PAID_VOICE_KEY_STORAGE); }
    function hasVoiceKey() { return !!getVoiceKey(); }
    function getEffectiveVoiceKey() { return getVoiceKey() || getKey(); }

    function getCustomVoices() {
        try { return JSON.parse(localStorage.getItem(CUSTOM_VOICES_STORAGE) || '[]'); } catch (e) { return []; }
    }
    function saveCustomVoice(v) {
        const list = getCustomVoices().filter(x => x.id !== v.id);
        list.unshift(v);
        localStorage.setItem(CUSTOM_VOICES_STORAGE, JSON.stringify(list.slice(0, 15)));
    }
    function deleteCustomVoice(id) {
        const list = getCustomVoices().filter(x => x.id !== id);
        localStorage.setItem(CUSTOM_VOICES_STORAGE, JSON.stringify(list));
    }

    // ====== INDEXEDDB DÙNG CHUNG + KHO DỰ ÁN LƯU TẠM ======
    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
    async function idbPut(key, val) {
        try {
            const db = await openDB();
            return new Promise((res, rej) => {
                const tx = db.transaction(IDB_STORE, 'readwrite');
                tx.objectStore(IDB_STORE).put(val, key);
                tx.oncomplete = () => res(true);
                tx.onerror = () => rej(tx.error);
            });
        } catch (e) { return false; }
    }
    async function idbGet(key) {
        try {
            const db = await openDB();
            return new Promise((res) => {
                const tx = db.transaction(IDB_STORE, 'readonly');
                const req = tx.objectStore(IDB_STORE).get(key);
                req.onsuccess = () => res(req.result || null);
                req.onerror = () => res(null);
            });
        } catch (e) { return null; }
    }
    async function idbDel(key) {
        try {
            const db = await openDB();
            return new Promise((res) => {
                const tx = db.transaction(IDB_STORE, 'readwrite');
                tx.objectStore(IDB_STORE).delete(key);
                tx.oncomplete = () => res(true);
                tx.onerror = () => res(false);
            });
        } catch (e) { return false; }
    }

    // Kho lưu nhiều dự án kịch bản + audio trên máy (tối đa 12 dự án gần nhất)
    async function listSavedProjects() {
        const list = await idbGet('saved_projects_index');
        return Array.isArray(list) ? list : [];
    }
    async function saveProjectToLibrary(project, rawScript, audioObj) {
        if (!project || !project.scenes || !project.scenes.length) return false;
        const projId = project.id || ('proj_' + Date.now());
        project.id = projId;
        const entry = {
            id: projId,
            title: project.title || 'Kịch bản quay',
            niche: project.niche || 'fb',
            sceneCount: project.scenes.length,
            doneCount: project.scenes.filter(s => s.done).length,
            hasAudio: !!(audioObj && audioObj.arrayBuffer),
            updatedAt: Date.now()
        };
        await idbPut('proj_data_' + projId, { project, rawScript: rawScript || '', audioObj: audioObj || null });
        let index = await listSavedProjects();
        index = index.filter(x => x.id !== projId);
        index.unshift(entry);
        if (index.length > 12) {
            const removed = index.splice(12);
            for (const r of removed) await idbDel('proj_data_' + r.id);
        }
        await idbPut('saved_projects_index', index);
        return projId;
    }
    async function loadProjectFromLibrary(projId) {
        return await idbGet('proj_data_' + projId);
    }
    async function deleteProjectFromLibrary(projId) {
        let index = await listSavedProjects();
        index = index.filter(x => x.id !== projId);
        await idbPut('saved_projects_index', index);
        await idbDel('proj_data_' + projId);
        return index;
    }

    // ====== GEMINI API ENGINE ======
    let lastError = '';
    async function fetchWithTimeout(url, options, timeoutMs = 20000) {
        const ctrl = new AbortController();
        const tm = setTimeout(() => ctrl.abort(), timeoutMs);
        try { return await fetch(url, { ...options, signal: ctrl.signal }); }
        finally { clearTimeout(tm); }
    }
    function safeParseJson(rawTxt) {
        if (!rawTxt) return null;
        if (typeof rawTxt === 'object') return rawTxt;
        const cleaned = String(rawTxt).replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        try { return JSON.parse(cleaned); }
        catch (e) {
            const m = cleaned.match(/\{[\s\S]*\}/);
            if (m) { try { return JSON.parse(m[0]); } catch (e2) {} }
        }
        return null;
    }
    async function callGemini(promptText, extraParts = [], opts = {}) {
        lastError = '';
        const apiKey = opts.apiKey || getKey();
        if (!apiKey) { lastError = 'Chưa nhập Gemini API Key'; return null; }
        const parts = [{ text: promptText }, ...extraParts];
        const models = opts.models || TEXT_MODELS;
        const genCfg = { temperature: opts.temp ?? 0.5, maxOutputTokens: opts.maxTokens ?? 2048 };
        if (opts.json) genCfg.responseMimeType = 'application/json';
        const errs = [];
        for (const model of models) {
            try {
                const resp = await fetchWithTimeout(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
                    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }], generationConfig: genCfg }) },
                    opts.timeoutMs || 22000
                );
                if (!resp.ok) {
                    let msg = `HTTP ${resp.status}`;
                    try { const ej = await resp.json(); if (ej?.error?.message) msg += `: ${ej.error.message.slice(0, 80)}`; } catch (e) {}
                    errs.push(`${model} (${msg})`);
                    if (resp.status === 400 || resp.status === 403) break;
                    continue;
                }
                const data = await resp.json();
                const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                if (txt) {
                    if (opts.json) {
                        const parsed = safeParseJson(txt);
                        if (parsed) return parsed;
                        errs.push(`${model} (Lỗi đọc JSON)`);
                        continue;
                    }
                    return txt;
                }
                errs.push(`${model} (Trả về rỗng)`);
            } catch (e) {
                errs.push(`${model} (${e.name === 'AbortError' ? 'Quá thời gian chờ' : (e.message || 'Lỗi mạng')})`);
            }
        }
        lastError = errs.join(' | ');
        return null;
    }
    async function testKey(customKey) {
        const k = String(customKey || getKey()).trim();
        if (!k) return { ok: false, message: 'Vui lòng dán API Key trước.' };
        const res = await callGemini('Trả lời đúng 2 chữ: OK', [], { apiKey: k, maxTokens: 24, timeoutMs: 12000 });
        return res ? { ok: true, message: `✅ Kết nối thành công! (${res})` } : { ok: false, message: `❌ ${lastError}` };
    }

    // ====== CHUYỂN ĐỔI ÂM THANH CHUẨN 24KHZ MONO 16-BIT WAV & VOICE REPLICATION ======
    async function convertTo24kMonoWavBase64(arrayBuffer) {
        const decoded = await decodeAudioBuffer(arrayBuffer);
        if (!decoded) throw new Error('Không giải mã được file âm thanh này.');
        const targetRate = 24000;
        const length = Math.max(2400, Math.ceil(decoded.duration * targetRate));
        const offCtx = new OfflineAudioContext(1, length, targetRate);
        const src = offCtx.createBufferSource();
        src.buffer = decoded;
        src.connect(offCtx.destination);
        src.start(0);
        const rendered = await offCtx.startRendering();
        const ch0 = rendered.getChannelData(0);
        const pcmLen = ch0.length * 2;
        const wavBuf = new ArrayBuffer(44 + pcmLen);
        const view = new DataView(wavBuf);
        const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
        writeStr(0, 'RIFF'); view.setUint32(4, 36 + pcmLen, true); writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
        view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
        view.setUint32(24, targetRate, true); view.setUint32(28, targetRate * 2, true);
        view.setUint16(32, 2, true); view.setUint16(34, 16, true);
        writeStr(36, 'data'); view.setUint32(40, pcmLen, true);
        let offset = 44;
        for (let i = 0; i < ch0.length; i++) {
            const s = Math.max(-1, Math.min(1, ch0[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }
        return { base64: arrayBufferToBase64(wavBuf), duration: decoded.duration };
    }

    async function replicateVoice({ displayName, sourceBuffer, consentBuffer, apiKey }) {
        const key = String(apiKey || getEffectiveVoiceKey()).trim();
        if (!key) return { ok: false, needPaidKey: true, message: 'Bạn chưa nhập API Key (cần Paid Key cho Giọng Thật).' };
        try {
            const srcConv = await convertTo24kMonoWavBase64(sourceBuffer);
            const conConv = await convertTo24kMonoWavBase64(consentBuffer);
            if (srcConv.duration < 8 || srcConv.duration > 32) {
                return { ok: false, needPaidKey: false, message: `Đoạn giọng mẫu dài ${srcConv.duration.toFixed(1)}s. Google yêu cầu chuẩn trong khoảng 10 – 30 giây nhé!` };
            }
            const resp = await fetchWithTimeout(
                `https://generativelanguage.googleapis.com/v1beta/voices?key=${encodeURIComponent(key)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        store: true,
                        voice: {
                            model: 'gemini-3.8-flash-tts',
                            type: 'replicated',
                            display_name: (displayName || 'GiongCuaToi').slice(0, 40),
                            replicated: {
                                source_audio: { mime_type: 'audio/wav', data: srcConv.base64 },
                                consent_audio: { mime_type: 'audio/wav', data: conConv.base64 }
                            }
                        }
                    })
                },
                38000
            );
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                const rawMsg = data?.error?.message || `HTTP ${resp.status}`;
                const isPaywall = resp.status === 403 || resp.status === 429 || /billing|paid|permission|tier|quota/i.test(rawMsg);
                if (isPaywall) {
                    return {
                        ok: false, needPaidKey: true,
                        message: `Key đang dùng chưa đủ quyền Nhân bản giọng thật (${resp.status}: ${rawMsg}). Hãy nhập Paid Key (đã gắn thẻ Billing) vào ô riêng để tạo nhé!`
                    };
                }
                return { ok: false, needPaidKey: false, message: `Google báo lỗi (${resp.status}): ${rawMsg}` };
            }
            const rawId = data?.voice?.name || data?.name || data?.id || data?.voiceKey || '';
            const voiceId = rawId.includes('/') ? rawId.split('/').pop() : rawId;
            if (!voiceId) return { ok: false, needPaidKey: false, message: 'Google không trả về mã giọng (voice_id).' };
            return { ok: true, voiceId, displayName: displayName || 'Giọng của tôi' };
        } catch (e) {
            return { ok: false, needPaidKey: false, message: e.name === 'AbortError' ? 'Hết thời gian chờ (38s), thử lại nhé.' : (e.message || 'Lỗi xử lý âm thanh') };
        }
    }

    // ====== GEMINI TTS ENGINE (HỖ TRỢ CẢ 30 GIỌNG HỆ THỐNG & GIỌNG THẬT VOICE_ID) ======
    function formatTranscriptForTts(text) {
        return String(text || '')
            .replace(/<whispers>/gi, '<whispering>')
            .replace(/<\/[a-z\s_-]+>/gi, '')
            .replace(/\s*\n+\s*/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }
    function extractPcmInfoFromBase64(b64, mimeType) {
        const bin = atob(b64), len = bin.length, bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
        const rateMatch = String(mimeType || '').match(/rate=(\d+)/i);
        let sampleRate = rateMatch ? Number(rateMatch[1]) : 24000, channels = 1, bitsPerSample = 16, pcmBytes = bytes;
        if (len > 44 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
            const view = new DataView(bytes.buffer);
            let pos = 12;
            while (pos + 8 <= len) {
                const id = String.fromCharCode(bytes[pos], bytes[pos+1], bytes[pos+2], bytes[pos+3]);
                const chunkSize = view.getUint32(pos + 4, true);
                if (id === 'fmt ' && pos + 24 <= len) {
                    channels = view.getUint16(pos + 10, true) || 1;
                    sampleRate = view.getUint32(pos + 12, true) || sampleRate;
                    bitsPerSample = view.getUint16(pos + 22, true) || 16;
                } else if (id === 'data') {
                    const endPos = (chunkSize > 0 && chunkSize < len) ? Math.min(len, pos + 8 + chunkSize) : len;
                    pcmBytes = bytes.subarray(pos + 8, endPos);
                    break;
                }
                pos += 8 + chunkSize + (chunkSize % 2);
            }
        }
        return { pcmBytes, sampleRate, channels, bitsPerSample };
    }
    function combineAudioPartsToWavBuffer(audioParts) {
        const parsed = audioParts.map(p => extractPcmInfoFromBase64(p.data, p.mimeType || p.mime_type));
        const sampleRate = parsed[0].sampleRate || 24000, channels = parsed[0].channels || 1, bitsPerSample = parsed[0].bitsPerSample || 16;
        const totalPcmLen = parsed.reduce((acc, p) => acc + p.pcmBytes.length, 0);
        const wavBuf = new ArrayBuffer(44 + totalPcmLen), view = new DataView(wavBuf), out = new Uint8Array(wavBuf);
        const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
        writeStr(0, 'RIFF'); view.setUint32(4, 36 + totalPcmLen, true); writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
        view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true);
        view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true);
        view.setUint16(32, channels * (bitsPerSample / 8), true); view.setUint16(34, bitsPerSample, true);
        writeStr(36, 'data'); view.setUint32(40, totalPcmLen, true);
        let offset = 44;
        for (const p of parsed) { out.set(p.pcmBytes, offset); offset += p.pcmBytes.length; }
        return wavBuf;
    }

    async function generateTTS({ text, voiceName = 'Leda', voiceStyle = '', preferredModel = 'gemini-3.8-flash-tts', timeoutMs = 32000, customApiKey = '' }) {
        lastError = '';
        const isCustomVoice = voiceName.startsWith('voice_') || voiceName.startsWith('voicekey_');
        const apiKey = String(customApiKey || (isCustomVoice ? getEffectiveVoiceKey() : getKey())).trim();
        if (!apiKey) { lastError = isCustomVoice ? 'NEED_PAID_KEY: Chưa nhập Key cho Giọng Thật.' : 'Chưa nhập Gemini API Key'; return null; }
        const prepped = formatTranscriptForTts(text);
        if (!prepped) { lastError = 'Lời thoại trống'; return null; }

        const queue = isCustomVoice
            ? [...new Set([preferredModel.includes('3.8') ? preferredModel : 'gemini-3.8-flash-tts', 'gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'])]
            : [...new Set([preferredModel, ...TTS_MODELS])];
        const errs = [];

        for (const modelId of queue) {
            const is38 = modelId.includes('3.8');
            const attempts = is38
                ? (voiceStyle ? [{ text: prepped, speech_metadata: { style: voiceStyle } }, { text: prepped }] : [{ text: prepped }])
                : [{ text: `${voiceStyle ? voiceStyle + ': ' : ''}${prepped.replace(/<long pause>/gi, '... ... ').replace(/<short pause>/gi, ', ').replace(/<breath>/gi, ', ')}` }];

            const voiceConfig = isCustomVoice ? { voice: voiceName } : { prebuiltVoiceConfig: { voiceName } };

            for (const partPayload of attempts) {
                try {
                    const resp = await fetchWithTimeout(
                        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`,
                        {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ role: 'user', parts: [partPayload] }],
                                generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig } }
                            })
                        },
                        timeoutMs
                    );
                    if (!resp.ok) {
                        let em = `HTTP ${resp.status}`;
                        try { const ej = await resp.json(); if (ej?.error?.message) em += `: ${ej.error.message.slice(0, 80)}`; } catch (e) {}
                        if (isCustomVoice && (resp.status === 403 || resp.status === 429)) {
                            lastError = `NEED_PAID_KEY: ${em}`;
                            return null;
                        }
                        errs.push(`${modelId} (${em})`);
                        if (resp.status === 400 && partPayload.speech_metadata) continue;
                        break;
                    }
                    const data = await resp.json();
                    const parts = (data?.candidates?.[0]?.content?.parts || []).map(p => p.inlineData || p.inline_data).filter(d => d && d.data);
                    if (parts.length > 0) {
                        const wavBuffer = combineAudioPartsToWavBuffer(parts);
                        return { wavBuffer, model: modelId };
                    }
                    errs.push(`${modelId} (Không có dữ liệu audio)`);
                } catch (e) {
                    errs.push(`${modelId} (${e.name === 'AbortError' ? 'Timeout' : e.message})`);
                    break;
                }
            }
        }
        lastError = errs.join(' | ');
        return null;
    }

    // ====== AUDIO DECODER, NHỊP NGẮT & XUẤT PHỤ ĐỀ .SRT ======
    let _sharedCtx = null;
    function getAudioCtx() {
        if (!_sharedCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) _sharedCtx = new AC(); }
        return _sharedCtx;
    }
    async function decodeAudioBuffer(arrayBuffer) {
        const ctx = getAudioCtx();
        if (!ctx || !arrayBuffer) return null;
        try { return await ctx.decodeAudioData(arrayBuffer.slice(0)); } catch (e) { return null; }
    }
    async function probeAudioDuration(arrayBuffer, mime) {
        const dec = await decodeAudioBuffer(arrayBuffer);
        if (dec && dec.duration > 0) return { duration: dec.duration, buffer: dec };
        return new Promise(res => {
            const url = URL.createObjectURL(new Blob([arrayBuffer], { type: mime || 'audio/wav' }));
            const a = new Audio(); a.preload = 'metadata';
            a.onloadedmetadata = () => { const d = Number.isFinite(a.duration) ? a.duration : 20; URL.revokeObjectURL(url); res({ duration: d, buffer: null }); };
            a.onerror = () => { URL.revokeObjectURL(url); res({ duration: 20, buffer: null }); };
            a.src = url;
        });
    }
    function detectAudioPauses(audioBuffer) {
        if (!audioBuffer) return [];
        const ch = audioBuffer.getChannelData(0), sr = audioBuffer.sampleRate, winSec = 0.04, winSamples = Math.max(1, Math.floor(sr * winSec));
        const rmsList = [], windows = [];
        for (let i = 0; i < ch.length; i += winSamples) {
            let sumSq = 0; const end = Math.min(ch.length, i + winSamples);
            for (let j = i; j < end; j++) sumSq += ch[j] * ch[j];
            const rms = Math.sqrt(sumSq / Math.max(1, end - i));
            rmsList.push(rms); windows.push({ t: (i + (end - i) / 2) / sr, rms });
        }
        const sorted = rmsList.slice().sort((a, b) => a - b);
        const p10 = sorted[Math.floor(sorted.length * 0.10)] || 0, p75 = sorted[Math.floor(sorted.length * 0.75)] || 0.05;
        const thresh = Math.max(0.006, Math.min(p75 * 0.25, p10 * 2.5 + 0.005));
        const runs = []; let runStart = -1;
        for (let k = 0; k < windows.length; k++) {
            if (windows[k].rms <= thresh) { if (runStart < 0) runStart = k; }
            else {
                if (runStart >= 0) {
                    const dur = (k - runStart) * winSec, midT = (windows[runStart].t + windows[k - 1].t) / 2;
                    if (dur >= 0.14 && midT > 0.5 && midT < audioBuffer.duration - 0.4) runs.push({ t: Number(midT.toFixed(2)), dur: Number(dur.toFixed(2)) });
                }
                runStart = -1;
            }
        }
        return runs;
    }
    function matchNaturalCuts(scenes, pauseRuns, totalDur) {
        if (!scenes.length || !totalDur) return;
        const weights = scenes.map(s => Math.max(10, (s.speech || s.visualDesc || '').length));
        const totalW = weights.reduce((a, b) => a + b, 0) || 1;
        let cumW = 0, prevEnd = 0;
        const maxWin = Math.max(2.5, totalDur * 0.22);
        scenes.forEach((sc, idx) => {
            sc.audioStartSec = Number(prevEnd.toFixed(1));
            if (idx === scenes.length - 1) sc.audioEndSec = Number(totalDur.toFixed(1));
            else {
                cumW += weights[idx];
                const expectedT = (cumW / totalW) * totalDur, minT = prevEnd + 0.9, maxT = totalDur - 0.8;
                let bestT = Math.max(minT, Math.min(maxT, expectedT)), bestScore = -999;
                for (const r of (pauseRuns || [])) {
                    if (r.t < minT || r.t > maxT || Math.abs(r.t - expectedT) > maxWin) continue;
                    const score = (r.dur >= 0.35 ? r.dur * 2.2 : r.dur) - Math.abs(r.t - expectedT) * 0.45;
                    if (score > bestScore) { bestScore = score; bestT = r.t; }
                }
                sc.audioEndSec = Number(bestT.toFixed(1));
            }
            prevEnd = sc.audioEndSec;
            sc.durationSec = Math.max(1.2, Number((sc.audioEndSec - sc.audioStartSec).toFixed(1)));
            sc.recSeconds = Math.max(3, Math.ceil(sc.durationSec + 2));
            sc.timeRange = `${sc.audioStartSec.toFixed(1)}s - ${sc.audioEndSec.toFixed(1)}s`;
        });
    }
    function formatSrtTime(sec) {
        const msTotal = Math.max(0, Math.round(sec * 1000));
        const h = Math.floor(msTotal / 3600000), m = Math.floor((msTotal % 3600000) / 60000);
        const s = Math.floor((msTotal % 60000) / 1000), ms = msTotal % 1000;
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
    }
    function buildSrtText(project) {
        if (!project || !Array.isArray(project.scenes)) return '';
        const sorted = project.scenes.slice().sort((a, b) => a.sceneNum - b.sceneNum);
        let idxCounter = 1, blocks = [], cursor = 0;
        for (const sc of sorted) {
            const sStart = typeof sc.audioStartSec === 'number' && sc.audioEndSec > sc.audioStartSec ? sc.audioStartSec : cursor;
            const sDur = Math.max(1.2, Number(sc.durationSec) || 3); cursor = sStart + sDur;
            const speech = String(sc.speech || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (!speech) continue;
            const rawParts = speech.split(/(?<=[,!?.…])\s+/).filter(Boolean), phrases = [];
            for (const p of rawParts) {
                const words = p.split(/\s+/);
                if (words.length <= 7) phrases.push(p);
                else for (let i = 0; i < words.length; i += 6) phrases.push(words.slice(i, i + 6).join(' '));
            }
            const totalW = phrases.reduce((a, p) => a + p.length, 0) || 1; let pCursor = sStart;
            phrases.forEach((ph, i) => {
                const slice = (ph.length / totalW) * sDur, pEnd = i === phrases.length - 1 ? (sStart + sDur) : (pCursor + slice);
                blocks.push(`${idxCounter++}\n${formatSrtTime(pCursor)} --> ${formatSrtTime(Math.max(pCursor + 0.3, pEnd))}\n${ph}\n`);
                pCursor = pEnd;
            });
        }
        return blocks.join('\n');
    }

    function notifyParent(type, payload) {
        if (window.parent && window.parent !== window) window.parent.postMessage({ source: 'KB_POPUP', type, payload }, '*');
    }
    async function saveOrShareBlob(blob, fileName, title = 'KimBling Studio') {
        if (!blob) return;
        if (window.parent && window.parent !== window) {
            try {
                const buf = await blob.arrayBuffer();
                window.parent.postMessage({ source: 'KB_POPUP', type: 'kb_download', payload: { buffer: buf, mime: blob.type, fileName, title } }, '*', [buf]);
                return;
            } catch (e) {}
        }
        const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try { await navigator.share({ files: [file], title }); return; } catch (e) {}
        }
        const url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 15000);
    }
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer); let binary = '';
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        return btoa(binary);
    }

    global.KBCore = {
        GEMINI_KEY_STORAGE, PAID_VOICE_KEY_STORAGE, CUSTOM_VOICES_STORAGE,
        STORAGE_RAW_SCRIPT, STORAGE_PROJECT, STORAGE_NICHE,
        TEXT_MODELS, TTS_MODELS, TTS_VOICES, SHOT_RECIPES,
        escHtml, copyText,
        getKey, setKey, clearKey, hasKey,
        getVoiceKey, setVoiceKey, clearVoiceKey, hasVoiceKey, getEffectiveVoiceKey,
        getCustomVoices, saveCustomVoice, deleteCustomVoice,
        idbPut, idbGet, idbDel,
        listSavedProjects, saveProjectToLibrary, loadProjectFromLibrary, deleteProjectFromLibrary,
        fetchWithTimeout, safeParseJson, callGemini, testKey,
        getLastError: () => lastError,
        convertTo24kMonoWavBase64, replicateVoice,
        generateTTS, formatTranscriptForTts,
        getAudioCtx, decodeAudioBuffer, probeAudioDuration, detectAudioPauses, matchNaturalCuts,
        buildSrtText, notifyParent, saveOrShareBlob, arrayBufferToBase64
    };
})(window);