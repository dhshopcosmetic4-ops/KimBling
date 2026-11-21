/* =========================================================
 * PUN.JS (v1.1 - Trợ lý AI Gemini Live chuyên PMU & điều khiển vepmu.html)
 * ========================================================= */
(function () {
  const PUN_AI_URL =
    "https://script.google.com/macros/s/AKfycby1yOLdWbamA0qmS_UkURyrHGBKO9JmYELP6FmMs-BfVgPdWhNr12nJjEVC3_Y_zgsgfA/exec";
  const IDLE_TIMEOUT_MS = 25000;

  let socket = null;
  let stream = null;
  let audioCtx = null;
  let processor = null;
  let micSource = null;
  let gainNode = null;
  let compressor = null;
  let liveAnalyser = null;
  let isActive = false;
  let isStarting = false;
  let nextPlayTime = 0;
  let playSources = [];
  let idleTimer = null;
  let sessionGen = 0;

  let autoShutdownPending = false;
  let autoShutdownTimer = null;
  let autoShutdownMessage = "👋 Tạm biệt! Pun đã ngưng hỗ trợ.";

  let activeKeyIndex = 0;
  let hasBackupKey = false;

  let punAnimStarted = false;
  let punAnimFrame = null;
  let punNextBlinkAt = 0;
  let punIsBlinking = false;
  let punMouthSmoothed = 0;

  function ensurePunUI() {
    if (!document.getElementById("punLiveStyles")) {
      const style = document.createElement("style");
      style.id = "punLiveStyles";
      style.textContent = `
        .pun-floating-btn {
          position: fixed;
          right: 12px;
          bottom: 76px;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          border: 2.5px solid #f43f5e;
          background: radial-gradient(circle at 30% 20%, #3f1d2e, #18181b);
          box-shadow: 0 6px 20px rgba(0,0,0,0.55);
          z-index: 45;
          cursor: pointer;
          padding: 0;
          overflow: visible;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: width 0.2s ease, height 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .pun-floating-btn.pun-connecting {
          border-color: #fbbf24;
          box-shadow: 0 0 0 6px rgba(251, 191, 36, 0.35);
        }
        .pun-floating-btn.pun-active {
          width: 60px;
          height: 60px;
          border-color: #10b981;
          box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.35), 0 6px 20px rgba(16, 185, 129, 0.55);
        }
        .pun-name-tag {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          background: #f43f5e;
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
          border: 1.5px solid #09090b;
          white-space: nowrap;
        }
        #punHeadGroup, #punLeftArm, #punRightArm, #punBodyGroup {
          transform-box: fill-box;
          transition: transform 0.08s linear;
        }
        #punHeadGroup { transform-origin: 50% 72%; }
        #punBodyGroup { transform-origin: 50% 90%; }
        #punLeftArm { transform-origin: 78% 18%; }
        #punRightArm { transform-origin: 22% 18%; }
        .pun-eye-lid { transform-origin: center; transform-box: fill-box; transition: transform 0.07s ease; }
        #punLiveToast {
          display: none;
          position: fixed;
          left: 50%;
          top: 64px;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.95);
          color: #ffffff;
          border: 1.5px solid #f43f5e;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          z-index: 99999;
          box-shadow: 0 6px 20px rgba(0,0,0,0.45);
          max-width: 90vw;
          text-align: center;
        }
        #punLiveBadge {
          display: none;
          position: fixed;
          right: 78px;
          bottom: 88px;
          background: #10b981;
          color: #ffffff;
          font-size: 11px;
          font-weight: bold;
          padding: 5px 10px;
          border-radius: 14px;
          z-index: 45;
          box-shadow: 0 2px 10px rgba(0,0,0,0.4);
          pointer-events: none;
          white-space: nowrap;
        }
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById("punFloatingBtn")) {
      const btn = document.createElement("button");
      btn.id = "punFloatingBtn";
      btn.className = "pun-floating-btn";
      btn.title = "Hỏi Trợ Lý AI Pun (Nói chuyện trực tiếp)";
      btn.onclick = togglePunLive;
      btn.innerHTML = `
        <svg viewBox="6 8 108 108" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:100%;height:100%;border-radius:50%;">
          <path d="M27 52 C22 76, 25 103, 35 112 L85 112 C95 103, 98 76, 93 52 C90 25, 76 14, 60 14 C44 14, 30 25, 27 52 Z" fill="#2c1d1b"/>
          <circle cx="91" cy="30" r="10" fill="#2c1d1b"/>
          <circle cx="85" cy="33" r="4" fill="#f43f5e"/>
          <g id="punBodyGroup">
            <g id="punLeftArm">
              <path d="M36 86 Q22 93 21 79" fill="none" stroke="#ffd4bc" stroke-width="9.5" stroke-linecap="round"/>
              <circle cx="20" cy="76" r="5.5" fill="#ffd4bc"/>
            </g>
            <g id="punRightArm">
              <path d="M84 86 Q98 93 99 79" fill="none" stroke="#ffd4bc" stroke-width="9.5" stroke-linecap="round"/>
              <circle cx="100" cy="76" r="5.5" fill="#ffd4bc"/>
            </g>
            <path d="M35 84 C36 74, 46 71, 60 71 C74 71, 84 74, 85 84 L88 123 L32 123 Z" fill="#f43f5e"/>
            <path d="M49 71 L60 83 L71 71 Z" fill="#ffffff"/>
            <path d="M41 87 L79 87 L82 123 L38 123 Z" fill="#18181b"/>
            <text x="60" y="102" text-anchor="middle" font-size="8.5" font-weight="800" fill="#fbbf24">PMU</text>
          </g>
          <rect x="53" y="62" width="14" height="14" rx="6" fill="#f7c4a7"/>
          <g id="punHeadGroup">
            <circle cx="33" cy="50" r="5" fill="#f7c4a7"/>
            <circle cx="87" cy="50" r="5" fill="#f7c4a7"/>
            <ellipse cx="60" cy="48" rx="25" ry="26" fill="#ffd9c2"/>
            <ellipse cx="42" cy="54" rx="5.5" ry="3.2" fill="#ff9e9e" opacity="0.55"/>
            <ellipse cx="78" cy="54" rx="5.5" ry="3.2" fill="#ff9e9e" opacity="0.55"/>
            <path d="M41 37 Q47 33.5 53 37" fill="none" stroke="#3b231e" stroke-width="2.3" stroke-linecap="round"/>
            <path d="M67 37 Q73 33.5 79 37" fill="none" stroke="#3b231e" stroke-width="2.3" stroke-linecap="round"/>
            <g class="pun-eye-lid" id="punEyeL"><ellipse cx="47" cy="45" rx="4.2" ry="4.6" fill="#231614"/><circle cx="48.5" cy="43.5" r="1.4" fill="#ffffff"/></g>
            <g class="pun-eye-lid" id="punEyeR"><ellipse cx="73" cy="45" rx="4.2" ry="4.6" fill="#231614"/><circle cx="74.5" cy="43.5" r="1.4" fill="#ffffff"/></g>
            <path d="M59 49 Q60.5 52 59 53" fill="none" stroke="#e2a588" stroke-width="1.6" stroke-linecap="round"/>
            <g>
              <ellipse id="punMouthCavity" cx="60" cy="59.5" rx="6.5" ry="1.8" fill="#8b1e24" opacity="0"/>
              <ellipse id="punTongue" cx="60" cy="61" rx="4.2" ry="1.2" fill="#ff7d8d" opacity="0"/>
              <path id="punMouthSmile" d="M53 58.5 Q60 63.5 67 58.5" fill="none" stroke="#b91c1c" stroke-width="2.2" stroke-linecap="round"/>
            </g>
            <path d="M33 43 C35 23, 49 16, 61 17 C76 17, 86 27, 87 43 C82 33, 73 27, 64 31 C56 26, 44 29, 33 43 Z" fill="#2c1d1b"/>
            <path d="M34 33 Q60 20 86 33" fill="none" stroke="#fbbf24" stroke-width="2.6" stroke-linecap="round"/>
          </g>
        </svg>
        <span class="pun-name-tag">Pun AI</span>
      `;
      document.body.appendChild(btn);
    }

    if (!document.getElementById("punLiveToast")) {
      const toast = document.createElement("div");
      toast.id = "punLiveToast";
      document.body.appendChild(toast);
    }
    if (!document.getElementById("punLiveBadge")) {
      const badge = document.createElement("div");
      badge.id = "punLiveBadge";
      document.body.appendChild(badge);
    }
    startPunAnimLoop();
  }

  function measureOutputLevel() {
    if (!liveAnalyser || !isActive || playSources.length === 0) return 0;
    const buf = new Uint8Array(liveAnalyser.frequencyBinCount);
    liveAnalyser.getByteTimeDomainData(buf);
    let sumSq = 0;
    for (let i = 0; i < buf.length; i++) {
      const norm = (buf[i] - 128) / 128;
      sumSq += norm * norm;
    }
    return Math.min(1, Math.sqrt(sumSq / buf.length) * 4.2);
  }

  function startPunAnimLoop() {
    if (punAnimStarted) return;
    punAnimStarted = true;
    punNextBlinkAt = performance.now() + 2200;

    function frame(now) {
      const head = document.getElementById("punHeadGroup");
      const body = document.getElementById("punBodyGroup");
      const leftArm = document.getElementById("punLeftArm");
      const rightArm = document.getElementById("punRightArm");
      const eyeL = document.getElementById("punEyeL");
      const eyeR = document.getElementById("punEyeR");
      const mouthCavity = document.getElementById("punMouthCavity");
      const tongue = document.getElementById("punTongue");
      const mouthSmile = document.getElementById("punMouthSmile");

      if (head && body && leftArm && rightArm) {
        const t = now / 1000;
        let state = "idle", rawLevel = 0;
        if (isActive && playSources.length > 0) {
          state = "speaking";
          rawLevel = liveAnalyser ? measureOutputLevel() : (0.25 + 0.55 * Math.abs(Math.sin(t * 11.2) * Math.cos(t * 4.7)));
        } else if (isStarting) state = "thinking";
        else if (isActive) state = "listening";

        punMouthSmoothed = punMouthSmoothed * 0.55 + rawLevel * 0.45;
        const mouthOpen = state === "speaking" ? Math.min(1, punMouthSmoothed) : 0;

        if (!punIsBlinking && now >= punNextBlinkAt) {
          punIsBlinking = true;
          setTimeout(() => { punIsBlinking = false; punNextBlinkAt = performance.now() + 2300 + Math.random() * 2600; }, 130);
        }
        const eyeScaleY = punIsBlinking ? 0.08 : 1;
        if (eyeL) eyeL.style.transform = `scaleY(${eyeScaleY})`;
        if (eyeR) eyeR.style.transform = `scaleY(${eyeScaleY})`;

        if (mouthCavity && tongue && mouthSmile) {
          if (mouthOpen > 0.06) {
            mouthCavity.setAttribute("ry", (1.6 + mouthOpen * 5.2).toFixed(2));
            mouthCavity.setAttribute("rx", (5.2 + mouthOpen * 2.2).toFixed(2));
            mouthCavity.style.opacity = "1";
            tongue.style.opacity = mouthOpen > 0.32 ? "0.95" : "0.35";
            mouthSmile.style.opacity = "0";
          } else {
            mouthCavity.style.opacity = "0"; tongue.style.opacity = "0"; mouthSmile.style.opacity = "1";
          }
        }

        if (state === "speaking") {
          head.style.transform = `translateY(${(Math.sin(t * 6.2) * (1.2 + mouthOpen * 2)).toFixed(1)}px) rotate(${(Math.sin(t * 3.8) * (3 + mouthOpen * 4)).toFixed(1)}deg)`;
          body.style.transform = `translateY(${(Math.sin(t * 3.1) * 1.1).toFixed(1)}px)`;
          leftArm.style.transform = `rotate(${(-14 + Math.sin(t * 5.4) * (12 + mouthOpen * 14)).toFixed(1)}deg)`;
          rightArm.style.transform = `rotate(${(14 + Math.cos(t * 4.9) * (12 + mouthOpen * 14)).toFixed(1)}deg)`;
        } else if (state === "listening") {
          head.style.transform = `rotate(${(4 + Math.sin(t * 2.0) * 2.2).toFixed(1)}deg)`;
          body.style.transform = `translateY(${(Math.sin(t * 2.2) * 0.8).toFixed(1)}px)`;
          leftArm.style.transform = `rotate(${(-8 + Math.sin(t * 2.1) * 4).toFixed(1)}deg)`;
          rightArm.style.transform = `rotate(${(16 + Math.cos(t * 2.3) * 5).toFixed(1)}deg)`;
        } else if (state === "thinking") {
          head.style.transform = `rotate(${(-5 + Math.sin(t * 2.6) * 2).toFixed(1)}deg)`;
          leftArm.style.transform = "rotate(-4deg)"; rightArm.style.transform = "rotate(26deg)";
        } else {
          const breathe = Math.sin(t * 2.1) * 0.9, wave = Math.sin(t * 2.4) * 6;
          head.style.transform = `translateY(${(breathe * 0.7).toFixed(1)}px) rotate(${(Math.sin(t * 1.3) * 2.2).toFixed(1)}deg)`;
          body.style.transform = `translateY(${breathe.toFixed(1)}px)`;
          leftArm.style.transform = `rotate(${(-4 + wave * 0.5).toFixed(1)}deg)`;
          rightArm.style.transform = `rotate(${(4 - wave).toFixed(1)}deg)`;
        }
      }
      punAnimFrame = requestAnimationFrame(frame);
    }
    punAnimFrame = requestAnimationFrame(frame);
  }

  function showPunToast(text, autoHideMs) {
    ensurePunUI();
    const el = document.getElementById("punLiveToast");
    if (!el) return;
    if (!text) { el.style.display = "none"; return; }
    el.textContent = text; el.style.display = "block";
    if (autoHideMs > 0) setTimeout(() => { if (el.textContent === text) el.style.display = "none"; }, autoHideMs);
  }

  function setVisualState(state, badgeText, badgeBg) {
    ensurePunUI();
    const btn = document.getElementById("punFloatingBtn"), badge = document.getElementById("punLiveBadge");
    if (btn) {
      btn.classList.remove("pun-connecting", "pun-active");
      if (state === "connecting") btn.classList.add("pun-connecting");
      if (state === "active") btn.classList.add("pun-active");
    }
    if (badge) {
      if (state === "active") { badge.textContent = badgeText || "🎙️ Pun đang nghe"; badge.style.background = badgeBg || "#10b981"; badge.style.display = "block"; }
      else badge.style.display = "none";
    }
  }

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    if (!isActive || autoShutdownPending) return;
    idleTimer = setTimeout(() => {
      if (isActive) { stopPunLive(); showPunToast("⏱️ Pun đã tạm nghỉ sau 25 giây im lặng", 3000); }
    }, IDLE_TIMEOUT_MS);
  }

  function finishAutoShutdown() {
    if (!autoShutdownPending || !isActive) return;
    setTimeout(() => {
      if (autoShutdownPending && isActive && playSources.length === 0) {
        const msg = autoShutdownMessage; stopPunLive(); if (msg) showPunToast(msg, 3000);
      }
    }, 500);
  }

  function isQuotaOrKeyError(msg) {
    return /quota|resource.?exhausted|rate.?limit|429|1008|exceeded|api.?key|permission/i.test(String(msg || ""));
  }

  function handleLiveQuotaFailure(errMsg) {
    if (hasBackupKey && activeKeyIndex < 5) {
      const nextIdx = activeKeyIndex + 1;
      stopPunLive();
      showPunToast("🔄 Đang đổi sang API key dự phòng #" + (nextIdx + 1) + "...", 2500);
      setTimeout(() => startPunLive(nextIdx), 300);
      return true;
    }
    stopPunLive();
    showPunToast("⚠️ Pun AI tạm hết lượt truy cập hôm nay.", 4000);
    return false;
  }

  async function togglePunLive() {
    if (isStarting) return;
    if (isActive) { stopPunLive(); return; }
    await startPunLive(0);
  }

  async function startPunLive(requestedKeyIndex) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Trình duyệt chưa hỗ trợ micro hoặc trang chưa chạy bằng HTTPS.");
      return;
    }
    const reqIdx = typeof requestedKeyIndex === "number" ? requestedKeyIndex : 0;
    hasBackupKey = false; activeKeyIndex = reqIdx; isStarting = true; autoShutdownPending = false;
    if (autoShutdownTimer) { clearTimeout(autoShutdownTimer); autoShutdownTimer = null; }
    const gen = ++sessionGen;
    setVisualState("connecting");
    showPunToast(reqIdx > 0 ? `🔄 Đang kết nối Pun bằng key #${reqIdx + 1}...` : "⏳ Đang gọi trợ lý PMU Pun...");

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx || audioCtx.state === "closed") audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") await audioCtx.resume();

      gainNode = audioCtx.createGain(); gainNode.gain.value = 1.45;
      compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -10; compressor.knee.value = 18; compressor.ratio.value = 6;
      liveAnalyser = audioCtx.createAnalyser(); liveAnalyser.fftSize = 256;
      gainNode.connect(compressor); compressor.connect(liveAnalyser); liveAnalyser.connect(audioCtx.destination);

      const [tokenRes, micStream] = await Promise.all([
        fetch(PUN_AI_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "create_live_token", mode: "pmu_pun", keyIndex: reqIdx })
        }).then((r) => r.json()),
        navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false })
      ]);

      if (gen !== sessionGen) { micStream.getTracks().forEach((t) => t.stop()); return; }
      if (!tokenRes || tokenRes.success === false || !tokenRes.token) {
        throw new Error((tokenRes && tokenRes.error) || "Không nhận được token Gemini Live.");
      }
      activeKeyIndex = typeof tokenRes.keyIndex === "number" ? tokenRes.keyIndex : reqIdx;
      hasBackupKey = !!tokenRes.hasBackupKey;
      stream = micStream;

      const wsUrl = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=" + encodeURIComponent(tokenRes.token);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (gen !== sessionGen) return;
        socket.send(JSON.stringify({ setup: { model: "models/" + (tokenRes.model || "gemini-3.8-live") } }));
      };

      socket.onmessage = async (event) => {
        if (gen !== sessionGen) return;
        let raw = "";
        if (typeof event.data === "string") raw = event.data;
        else if (event.data instanceof Blob) raw = await event.data.text();
        else if (event.data instanceof ArrayBuffer) raw = new TextDecoder().decode(event.data);
        if (!raw) return;

        let data;
        try { data = JSON.parse(raw); } catch (e) { return; }

        if (data.error) {
          const errMsg = data.error.message || JSON.stringify(data.error);
          if (isQuotaOrKeyError(errMsg) && handleLiveQuotaFailure(errMsg)) return;
          stopPunLive(); showPunToast("❌ Lỗi Pun Live: " + errMsg, 5000); return;
        }

        if (data.setupComplete) {
          isStarting = false; isActive = true; showPunToast("");
          setVisualState("active", "🎙️ Pun đang nghe", "#10b981");
          resetIdleTimer(); startMicStreaming(); return;
        }

        if (data.toolCall && Array.isArray(data.toolCall.functionCalls)) {
          resetIdleTimer();
          const functionResponses = [];
          for (const fc of data.toolCall.functionCalls) {
            showPunToast("✨ Pun đang thao tác...", 1200);
            let resultObj;
            try { resultObj = await handlePunToolCall(fc.name, fc.args || {}); }
            catch (err) { resultObj = { ok: false, error: err?.message || String(err) }; }
            functionResponses.push({ id: fc.id, name: fc.name, response: { result: resultObj } });
          }
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ toolResponse: { functionResponses } }));
          }
        }

        const sc = data.serverContent;
        if (sc) {
          if (sc.interrupted) stopPlayback();
          if (sc.inputTranscription && sc.inputTranscription.text) resetIdleTimer();
          const parts = sc.modelTurn && sc.modelTurn.parts ? sc.modelTurn.parts : [];
          parts.forEach((p) => { if (p.inlineData && p.inlineData.data) { resetIdleTimer(); queueAudioChunk(p.inlineData.data); } });
          if (sc.turnComplete && autoShutdownPending && playSources.length === 0) finishAutoShutdown();
        }
      };

      socket.onerror = () => { if (gen === sessionGen) { stopPunLive(); showPunToast("❌ Lỗi kết nối WebSocket Pun Live", 4500); } };
      socket.onclose = (ev) => {
        if (gen === sessionGen) {
          const code = ev?.code || 0, reason = ev?.reason || "";
          if ((code === 1008 || isQuotaOrKeyError(reason)) && handleLiveQuotaFailure(reason || String(code))) return;
          stopPunLive();
        }
      };
    } catch (err) {
      const errMsg = err?.message || String(err);
      if (isQuotaOrKeyError(errMsg) && handleLiveQuotaFailure(errMsg)) return;
      stopPunLive(); alert("Không gọi được Pun Live: " + errMsg);
    }
  }

  function stopPunLive() {
    sessionGen++; isStarting = false; isActive = false; autoShutdownPending = false;
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    if (autoShutdownTimer) { clearTimeout(autoShutdownTimer); autoShutdownTimer = null; }
    showPunToast(""); setVisualState("idle");
    if (processor) { try { processor.disconnect(); } catch (e) {} processor.onaudioprocess = null; processor = null; }
    if (micSource) { try { micSource.disconnect(); } catch (e) {} micSource = null; }
    if (stream) { stream.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} }); stream = null; }
    stopPlayback();
    if (gainNode) { try { gainNode.disconnect(); } catch (e) {} gainNode = null; }
    if (compressor) { try { compressor.disconnect(); } catch (e) {} compressor = null; }
    if (liveAnalyser) { try { liveAnalyser.disconnect(); } catch (e) {} liveAnalyser = null; }
    if (audioCtx) { try { audioCtx.close(); } catch (e) {} audioCtx = null; }
    if (socket) { try { socket.close(1000); } catch (e) {} socket = null; }
  }

  function startMicStreaming() {
    if (!stream || !audioCtx || !socket || socket.readyState !== WebSocket.OPEN) return;
    micSource = audioCtx.createMediaStreamSource(stream);
    processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      if (!isActive || autoShutdownPending || !socket || socket.readyState !== WebSocket.OPEN) return;
      const input = e.inputBuffer.getChannelData(0), ratio = audioCtx.sampleRate / 16000, newLen = Math.round(input.length / ratio), pcm = new Int16Array(newLen);
      for (let i = 0; i < newLen; i++) { const s = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)] || 0)); pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff; }
      const bytes = new Uint8Array(pcm.buffer); let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      socket.send(JSON.stringify({ realtimeInput: { audio: { data: btoa(bin), mimeType: "audio/pcm;rate=16000" } } }));
    };
    micSource.connect(processor);
    const silentMute = audioCtx.createGain(); silentMute.gain.value = 0; processor.connect(silentMute); silentMute.connect(audioCtx.destination);
  }

  function queueAudioChunk(b64) {
    if (!audioCtx) return;
    const bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const view = new DataView(bytes.buffer), count = Math.floor(bytes.byteLength / 2), buf = audioCtx.createBuffer(1, count, 24000), ch = buf.getChannelData(0);
    for (let i = 0; i < count; i++) ch[i] = view.getInt16(i * 2, true) / 32768;
    const now = audioCtx.currentTime; if (nextPlayTime < now) nextPlayTime = now + 0.04;
    const src = audioCtx.createBufferSource(); src.buffer = buf; src.connect(gainNode || audioCtx.destination); src.start(nextPlayTime);
    nextPlayTime += buf.duration; playSources.push(src);
    setVisualState("active", "🔊 Pun đang nói...", "#f43f5e");
    src.onended = () => {
      playSources = playSources.filter((s) => s !== src);
      if (isActive && playSources.length === 0) {
        if (autoShutdownPending) finishAutoShutdown();
        else { setVisualState("active", "🎙️ Pun đang nghe", "#10b981"); resetIdleTimer(); }
      }
    };
  }

  function stopPlayback() {
    playSources.forEach((s) => { try { s.stop(); } catch (e) {} });
    playSources = []; nextPlayTime = 0;
    if (isActive && !autoShutdownPending) setVisualState("active", "🎙️ Pun đang nghe", "#10b981");
  }

  async function handlePunToolCall(name, args) {
    const B = window.PunBridge;
    if (!B) return { ok: false, error: "Chưa sẵn sàng PunBridge trên app." };
    if (name === "end_pun_session") {
      autoShutdownPending = true;
      autoShutdownMessage = "👋 Tạm biệt! Pun đã ngưng hỗ trợ.";
      if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
      if (autoShutdownTimer) clearTimeout(autoShutdownTimer);
      autoShutdownTimer = setTimeout(() => { if (isActive) { stopPunLive(); showPunToast("👋 Tạm biệt! Pun đã ngưng hỗ trợ.", 3000); } }, 6000);
      return { ok: true, ending: true };
    }
    if (name === "get_app_state") return { ok: true, ...B.getStatus() };
    if (name === "open_app_section") return await B.openSection(args.section);
    if (name === "control_brush_and_tool") return B.controlTool(args);
    if (name === "manage_layers") return await B.manageLayers(args);
    if (name === "control_ai_pmu") return await B.controlAiPmu(args);
    if (name === "control_tutor_and_export") return await B.controlTutorAndExport(args);
    return { ok: false, error: "Lệnh không hợp lệ: " + name };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensurePunUI);
  else ensurePunUI();

  window.togglePunLive = togglePunLive;
  window.stopPunLive = stopPunLive;
  window.addEventListener("pagehide", stopPunLive);
})();