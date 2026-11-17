/* =========================================================
 * BEKIM.JS (v4.9 - Bé Kim cử động mấp máy miệng/chớp mắt/vẫy tay trên menu.html)
 * - Tự nâng cấp nút .floating-ai-btn thành Bé Kim cử động theo giọng nói (lip-sync)
 * - Chuẩn hóa linh hoạt mọi cách nói Giao hàng tận nơi / Tự ra quán lấy
 * - Xem ảnh / chi tiết món -> mở popup TikTok (#tiktokModal)
 * - Bỏ / thêm vào giỏ hàng -> mở bảng tùy chọn (#optionsModal)
 * - Khách nói bye / tạm biệt -> ngưng hỗ trợ & tự đăng xuất Live
 * - Tự tắt sau chốt đơn & tự nghỉ sau 25s im lặng
 * - Dự phòng tối đa 3 key Gemini + chuyển sang Bé Kim AI (Groq) nếu hết lượt
 * ========================================================= */
(function () {
  const BEKIM_AI_URL =
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
  let autoShutdownMessage = "✅ Đã đặt đơn xong! Bé Kim đã tự nghỉ.";

  let voiceCustomerDraft = {};
  let pendingOptionQty = 1;

  let activeKeyIndex = 0;
  let hasBackupKey = false;

  let bekimAnimStarted = false;
  let bekimAnimFrame = null;
  let bekimNextBlinkAt = 0;
  let bekimIsBlinking = false;
  let bekimMouthSmoothed = 0;

  document.addEventListener("change", function (e) {
    if (!e || !e.target) return;
    if (e.target.name === "orderType") {
      voiceCustomerDraft.orderType = e.target.value;
    } else if (e.target.name === "payMethod") {
      voiceCustomerDraft.payMethod = e.target.value;
    }
  });

  function upgradeFloatingKimButton() {
    const btn = document.querySelector(".floating-ai-btn");
    if (!btn || btn.dataset.kimAnimated === "1") return;
    btn.dataset.kimAnimated = "1";
    btn.innerHTML = `
      <svg id="bekimMenuSvg" viewBox="6 8 108 108" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M27 52 C22 76, 25 103, 35 112 L85 112 C95 103, 98 76, 93 52 C90 25, 76 14, 60 14 C44 14, 30 25, 27 52 Z" fill="#2c1d1b"/>
        <circle cx="91" cy="30" r="11" fill="#2c1d1b"/>
        <circle cx="85" cy="33" r="4" fill="#d32f2f"/>

        <g id="bekimMenuBodyGroup">
          <g id="bekimMenuLeftArm">
            <path d="M36 86 Q22 93 21 79" fill="none" stroke="#ffd4bc" stroke-width="9.5" stroke-linecap="round"/>
            <circle cx="20" cy="76" r="5.5" fill="#ffd4bc"/>
          </g>
          <g id="bekimMenuRightArm">
            <path d="M84 86 Q98 93 99 79" fill="none" stroke="#ffd4bc" stroke-width="9.5" stroke-linecap="round"/>
            <circle cx="100" cy="76" r="5.5" fill="#ffd4bc"/>
          </g>
          <path d="M35 84 C36 74, 46 71, 60 71 C74 71, 84 74, 85 84 L88 123 L32 123 Z" fill="#d32f2f"/>
          <path d="M49 71 L60 83 L71 71 Z" fill="#ffffff"/>
          <path d="M41 87 L79 87 L82 123 L38 123 Z" fill="#fff8ef"/>
          <rect x="46" y="101" width="28" height="15" rx="4" fill="#ffe5d0" stroke="#f0b79d" stroke-width="1"/>
          <text x="60" y="96" text-anchor="middle" font-size="8" font-weight="800" fill="#b71c1c">KB</text>
        </g>

        <rect x="53" y="62" width="14" height="14" rx="6" fill="#f7c4a7"/>

        <g id="bekimMenuHeadGroup">
          <circle cx="33" cy="50" r="5" fill="#f7c4a7"/>
          <circle cx="87" cy="50" r="5" fill="#f7c4a7"/>
          <ellipse cx="60" cy="48" rx="25" ry="26" fill="#ffd9c2"/>
          <ellipse cx="42" cy="54" rx="5.5" ry="3.2" fill="#ff9e9e" opacity="0.55"/>
          <ellipse cx="78" cy="54" rx="5.5" ry="3.2" fill="#ff9e9e" opacity="0.55"/>
          <path d="M42 37 Q47 34 52 37" fill="none" stroke="#3b231e" stroke-width="2" stroke-linecap="round"/>
          <path d="M68 37 Q73 34 78 37" fill="none" stroke="#3b231e" stroke-width="2" stroke-linecap="round"/>
          <g class="bekim-eye-lid" id="bekimMenuEyeL">
            <ellipse cx="47" cy="45" rx="4.2" ry="4.6" fill="#231614"/>
            <circle cx="48.5" cy="43.5" r="1.4" fill="#ffffff"/>
          </g>
          <g class="bekim-eye-lid" id="bekimMenuEyeR">
            <ellipse cx="73" cy="45" rx="4.2" ry="4.6" fill="#231614"/>
            <circle cx="74.5" cy="43.5" r="1.4" fill="#ffffff"/>
          </g>
          <path d="M59 49 Q60.5 52 59 53" fill="none" stroke="#e2a588" stroke-width="1.6" stroke-linecap="round"/>
          <g id="bekimMenuMouthGroup">
            <ellipse id="bekimMenuMouthCavity" cx="60" cy="59.5" rx="6.5" ry="1.8" fill="#8b1e24" opacity="0"/>
            <ellipse id="bekimMenuTongue" cx="60" cy="61" rx="4.2" ry="1.2" fill="#ff7d8d" opacity="0"/>
            <path id="bekimMenuMouthSmile" d="M53 58.5 Q60 63.5 67 58.5" fill="none" stroke="#8b1e24" stroke-width="2.1" stroke-linecap="round"/>
          </g>
          <path d="M33 43 C35 23, 49 16, 61 17 C76 17, 86 27, 87 43 C82 33, 73 27, 64 31 C56 26, 44 29, 33 43 Z" fill="#2c1d1b"/>
          <path d="M34 33 Q60 20 86 33" fill="none" stroke="#e53935" stroke-width="3.2" stroke-linecap="round"/>
        </g>
      </svg>
    `;
  }

  function measureBekimOutputLevel() {
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

  function startBekimMenuAnimationLoop() {
    if (bekimAnimStarted) return;
    bekimAnimStarted = true;
    if (bekimAnimFrame) cancelAnimationFrame(bekimAnimFrame);

    bekimNextBlinkAt = performance.now() + 2400;

    function frame(now) {
      const head = document.getElementById("bekimMenuHeadGroup");
      const body = document.getElementById("bekimMenuBodyGroup");
      const leftArm = document.getElementById("bekimMenuLeftArm");
      const rightArm = document.getElementById("bekimMenuRightArm");
      const eyeL = document.getElementById("bekimMenuEyeL");
      const eyeR = document.getElementById("bekimMenuEyeR");
      const mouthCavity = document.getElementById("bekimMenuMouthCavity");
      const tongue = document.getElementById("bekimMenuTongue");
      const mouthSmile = document.getElementById("bekimMenuMouthSmile");

      if (head && body && leftArm && rightArm) {
        const t = now / 1000;
        let state = "idle";
        let rawLevel = 0;

        if (isActive && playSources.length > 0) {
          state = "speaking";
          rawLevel = liveAnalyser
            ? measureBekimOutputLevel()
            : (0.25 + 0.55 * Math.abs(Math.sin(t * 11.2) * Math.cos(t * 4.7)));
        } else if (isStarting) {
          state = "thinking";
        } else if (isActive) {
          state = "listening";
        }

        bekimMouthSmoothed = bekimMouthSmoothed * 0.55 + rawLevel * 0.45;
        const mouthOpen = state === "speaking" ? Math.min(1, bekimMouthSmoothed) : 0;

        if (!bekimIsBlinking && now >= bekimNextBlinkAt) {
          bekimIsBlinking = true;
          setTimeout(() => {
            bekimIsBlinking = false;
            bekimNextBlinkAt = performance.now() + 2300 + Math.random() * 2600;
          }, 130);
        }
        const eyeScaleY = bekimIsBlinking ? 0.08 : 1;
        if (eyeL) eyeL.style.transform = "scaleY(" + eyeScaleY + ")";
        if (eyeR) eyeR.style.transform = "scaleY(" + eyeScaleY + ")";

        if (mouthCavity && tongue && mouthSmile) {
          if (mouthOpen > 0.06) {
            const ry = (1.6 + mouthOpen * 5.2).toFixed(2);
            const rx = (5.2 + mouthOpen * 2.2).toFixed(2);
            mouthCavity.setAttribute("ry", ry);
            mouthCavity.setAttribute("rx", rx);
            mouthCavity.style.opacity = "1";
            tongue.style.opacity = mouthOpen > 0.32 ? "0.95" : "0.35";
            mouthSmile.style.opacity = "0";
          } else {
            mouthCavity.style.opacity = "0";
            tongue.style.opacity = "0";
            mouthSmile.style.opacity = "1";
          }
        }

        if (state === "speaking") {
          const headTilt = Math.sin(t * 3.8) * (3 + mouthOpen * 4);
          const headBob = Math.sin(t * 6.2) * (1.2 + mouthOpen * 2);
          const lArmAngle = -14 + Math.sin(t * 5.4) * (12 + mouthOpen * 14);
          const rArmAngle = 14 + Math.cos(t * 4.9) * (12 + mouthOpen * 14);
          head.style.transform = "translateY(" + headBob.toFixed(1) + "px) rotate(" + headTilt.toFixed(1) + "deg)";
          body.style.transform = "translateY(" + (Math.sin(t * 3.1) * 1.1).toFixed(1) + "px)";
          leftArm.style.transform = "rotate(" + lArmAngle.toFixed(1) + "deg)";
          rightArm.style.transform = "rotate(" + rArmAngle.toFixed(1) + "deg)";
        } else if (state === "listening") {
          const headTilt = 4 + Math.sin(t * 2.0) * 2.2;
          head.style.transform = "rotate(" + headTilt.toFixed(1) + "deg)";
          body.style.transform = "translateY(" + (Math.sin(t * 2.2) * 0.8).toFixed(1) + "px)";
          leftArm.style.transform = "rotate(" + (-8 + Math.sin(t * 2.1) * 4).toFixed(1) + "deg)";
          rightArm.style.transform = "rotate(" + (16 + Math.cos(t * 2.3) * 5).toFixed(1) + "deg)";
        } else if (state === "thinking") {
          head.style.transform = "rotate(" + (-5 + Math.sin(t * 2.6) * 2).toFixed(1) + "deg)";
          body.style.transform = "translateY(0px)";
          leftArm.style.transform = "rotate(-4deg)";
          rightArm.style.transform = "rotate(26deg)";
        } else {
          const breathe = Math.sin(t * 2.1) * 0.9;
          const headSway = Math.sin(t * 1.3) * 2.2;
          const wave = Math.sin(t * 2.4) * 6;
          head.style.transform = "translateY(" + (breathe * 0.7).toFixed(1) + "px) rotate(" + headSway.toFixed(1) + "deg)";
          body.style.transform = "translateY(" + breathe.toFixed(1) + "px)";
          leftArm.style.transform = "rotate(" + (-4 + wave * 0.5).toFixed(1) + "deg)";
          rightArm.style.transform = "rotate(" + (4 - wave).toFixed(1) + "deg)";
        }
      }

      bekimAnimFrame = requestAnimationFrame(frame);
    }

    bekimAnimFrame = requestAnimationFrame(frame);
  }

  function ensureBekimUI() {
    if (!document.getElementById("bekimLiveStyles")) {
      const style = document.createElement("style");
      style.id = "bekimLiveStyles";
      style.textContent = `
        .floating-ai-btn {
          transition: width 0.2s ease, height 0.2s ease, right 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important;
        }
        .floating-ai-btn.bekim-connecting {
          border-color: #ff9800 !important;
          box-shadow: 0 0 0 6px rgba(255, 152, 0, 0.35) !important;
        }
        .floating-ai-btn.bekim-active {
          width: 60px !important;
          height: 60px !important;
          right: 11px !important;
          border-color: #00c853 !important;
          box-shadow: 0 0 0 6px rgba(0, 200, 83, 0.35), 0 4px 18px rgba(0, 200, 83, 0.6) !important;
        }
        #bekimMenuHeadGroup, #bekimMenuLeftArm, #bekimMenuRightArm, #bekimMenuBodyGroup {
          transform-box: fill-box;
          transition: transform 0.08s linear;
        }
        #bekimMenuHeadGroup { transform-origin: 50% 72%; }
        #bekimMenuBodyGroup { transform-origin: 50% 90%; }
        #bekimMenuLeftArm { transform-origin: 78% 18%; }
        #bekimMenuRightArm { transform-origin: 22% 18%; }
        .bekim-eye-lid {
          transform-origin: center;
          transform-box: fill-box;
          transition: transform 0.07s ease;
        }
        #bekimLiveToast {
          display: none;
          position: fixed;
          left: 50%;
          top: 72px;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.94);
          color: #ffffff;
          border: 1.5px solid #ff9800;
          padding: 10px 16px;
          border-radius: 24px;
          font-size: 13px;
          font-weight: bold;
          z-index: 99999;
          box-shadow: 0 6px 20px rgba(0,0,0,0.35);
          max-width: 92vw;
          text-align: center;
        }
        #bekimLiveBadge {
          display: none;
          position: fixed;
          right: 76px;
          bottom: 162px;
          background: #00c853;
          color: #ffffff;
          font-size: 11px;
          font-weight: bold;
          padding: 5px 10px;
          border-radius: 14px;
          z-index: 9999;
          box-shadow: 0 2px 8px rgba(0,0,0,0.28);
          pointer-events: none;
          white-space: nowrap;
        }
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById("bekimLiveToast")) {
      const toast = document.createElement("div");
      toast.id = "bekimLiveToast";
      document.body.appendChild(toast);
    }

    if (!document.getElementById("bekimLiveBadge")) {
      const badge = document.createElement("div");
      badge.id = "bekimLiveBadge";
      document.body.appendChild(badge);
    }

    upgradeFloatingKimButton();
    startBekimMenuAnimationLoop();
  }

  function showToast(text, autoHideMs) {
    ensureBekimUI();
    const el = document.getElementById("bekimLiveToast");
    if (!el) return;
    if (!text) {
      el.style.display = "none";
      return;
    }
    el.textContent = text;
    el.style.display = "block";
    if (autoHideMs > 0) {
      setTimeout(() => {
        if (el.textContent === text) el.style.display = "none";
      }, autoHideMs);
    }
  }

  function setVisualState(state, badgeText, badgeBg) {
    ensureBekimUI();
    const btn = document.querySelector(".floating-ai-btn");
    const badge = document.getElementById("bekimLiveBadge");
    if (btn) {
      btn.classList.remove("bekim-connecting", "bekim-active");
      if (state === "connecting") btn.classList.add("bekim-connecting");
      if (state === "active") btn.classList.add("bekim-active");
    }
    if (badge) {
      if (state === "active") {
        badge.textContent = badgeText || "🎙️ Bé Kim đang nghe";
        badge.style.background = badgeBg || "#00c853";
        badge.style.display = "block";
      } else {
        badge.style.display = "none";
      }
    }
  }

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    if (!isActive || autoShutdownPending) return;
    idleTimer = setTimeout(() => {
      if (isActive) {
        stopBekimLive();
        showToast("⏱️ Bé Kim đã tạm nghỉ sau 25 giây im lặng", 3000);
      }
    }, IDLE_TIMEOUT_MS);
  }

  function finishAutoShutdown() {
    if (!autoShutdownPending || !isActive) return;
    setTimeout(() => {
      if (autoShutdownPending && isActive && playSources.length === 0) {
        const msg = autoShutdownMessage;
        stopBekimLive();
        if (msg) showToast(msg, 3000);
      }
    }, 500);
  }

  function isQuotaOrKeyError(msg) {
    return /quota|resource.?exhausted|rate.?limit|429|1008|exceeded|api.?key|permission/i.test(String(msg || ""));
  }

  function handleLiveQuotaFailure(errMsg) {
    if (hasBackupKey && activeKeyIndex < 5) {
      const nextIdx = activeKeyIndex + 1;
      stopBekimLive();
      showToast("🔄 Đang đổi sang API key dự phòng #" + (nextIdx + 1) + "...", 2500);
      setTimeout(() => {
        startBekimLive(nextIdx);
      }, 300);
      return true;
    }
    stopBekimLive();
    if (typeof openAiChotDonPopup === "function") {
      showToast("⚡ Bé Kim Live tạm hết lượt, chuyển sang Bé Kim AI...", 3000);
      setTimeout(() => {
        openAiChotDonPopup();
      }, 400);
      return true;
    }
    return false;
  }

  async function toggleBekimLive() {
    if (isStarting) return;
    if (isActive) {
      stopBekimLive();
      return;
    }
    await startBekimLive(0);
  }

  async function startBekimLive(requestedKeyIndex) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Trình duyệt chưa hỗ trợ micro hoặc trang chưa chạy bằng HTTPS.");
      return;
    }

    const reqIdx = typeof requestedKeyIndex === "number" ? requestedKeyIndex : 0;
    hasBackupKey = false;
    activeKeyIndex = reqIdx;

    isStarting = true;
    autoShutdownPending = false;
    autoShutdownMessage = "✅ Đã đặt đơn xong! Bé Kim đã tự nghỉ.";
    if (autoShutdownTimer) { clearTimeout(autoShutdownTimer); autoShutdownTimer = null; }
    const gen = ++sessionGen;
    setVisualState("connecting");
    showToast(reqIdx > 0 ? "🔄 Đang kết nối bằng key dự phòng #" + (reqIdx + 1) + "..." : "⏳ Đang kích hoạt Bé Kim cho menu đặt hàng...");

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx || audioCtx.state === "closed") audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") await audioCtx.resume();

      gainNode = audioCtx.createGain();
      gainNode.gain.value = 1.45;
      compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -10;
      compressor.knee.value = 18;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.12;
      liveAnalyser = audioCtx.createAnalyser();
      liveAnalyser.fftSize = 256;
      gainNode.connect(compressor);
      compressor.connect(liveAnalyser);
      liveAnalyser.connect(audioCtx.destination);

      const [tokenRes, micStream] = await Promise.all([
        fetch(BEKIM_AI_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "create_live_token", mode: "menu_control", keyIndex: reqIdx })
        }).then((r) => r.json()),
        navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        })
      ]);

      if (gen !== sessionGen) {
        micStream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!tokenRes || tokenRes.success === false || !tokenRes.token) {
        throw new Error((tokenRes && tokenRes.error) || "Không nhận được token Gemini Live.");
      }

      activeKeyIndex = typeof tokenRes.keyIndex === "number" ? tokenRes.keyIndex : reqIdx;
      hasBackupKey = !!tokenRes.hasBackupKey;

      stream = micStream;
      const wsUrl =
        "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained" +
        "?access_token=" + encodeURIComponent(tokenRes.token);

      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (gen !== sessionGen) return;
        socket.send(JSON.stringify({
          setup: { model: "models/" + (tokenRes.model || "gemini-3.8-live") }
        }));
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
          console.error("Gemini Live error:", data.error);
          if (isQuotaOrKeyError(errMsg) && handleLiveQuotaFailure(errMsg)) return;
          stopBekimLive();
          showToast("❌ Lỗi Gemini Live: " + errMsg, 6000);
          return;
        }

        if (data.setupComplete) {
          isStarting = false;
          isActive = true;
          showToast("");
          setVisualState("active", "🎙️ Bé Kim đang nghe", "#00c853");
          resetIdleTimer();
          startMicStreaming();
          return;
        }

        if (data.toolCall && Array.isArray(data.toolCall.functionCalls)) {
          resetIdleTimer();
          const functionResponses = [];
          for (const fc of data.toolCall.functionCalls) {
            console.log("[Bé Kim Tool]", fc.name, fc.args);
            showToast("⚡ Bé Kim đang thực hiện...", 1200);
            let resultObj;
            try {
              resultObj = await handleMenuToolCall(fc.name, fc.args || {});
            } catch (err) {
              console.error("[Bé Kim Tool Error]", fc.name, err);
              resultObj = { ok: false, error: err && err.message ? err.message : String(err) };
            }
            functionResponses.push({
              id: fc.id,
              name: fc.name,
              response: { result: resultObj }
            });
          }
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              toolResponse: { functionResponses: functionResponses }
            }));
          }
        }

        const sc = data.serverContent;
        if (sc) {
          if (sc.interrupted) stopPlayback();
          if (sc.inputTranscription && sc.inputTranscription.text) resetIdleTimer();
          const parts = sc.modelTurn && sc.modelTurn.parts ? sc.modelTurn.parts : [];
          parts.forEach((p) => {
            if (p.inlineData && p.inlineData.data) {
              resetIdleTimer();
              queueAudioChunk(p.inlineData.data);
            }
          });
          if (sc.turnComplete && autoShutdownPending && playSources.length === 0) {
            finishAutoShutdown();
          }
        }
      };

      socket.onerror = (ev) => {
        console.error("Gemini Live WebSocket error:", ev);
        if (gen === sessionGen) {
          stopBekimLive();
          showToast("❌ Lỗi kết nối WebSocket Bé Kim Live", 5000);
        }
      };

      socket.onclose = (ev) => {
        if (gen === sessionGen) {
          const code = ev && ev.code ? ev.code : 0;
          const reason = ev && ev.reason ? ev.reason : "";
          if ((code === 1008 || isQuotaOrKeyError(reason)) && handleLiveQuotaFailure(reason || String(code))) {
            return;
          }
          stopBekimLive();
          if (code && code !== 1000 && code !== 1005) {
            showToast("⚠️ Bé Kim ngắt kết nối (" + code + "): " + (reason || "Kiểm tra bản deploy .gs"), 6000);
          }
        }
      };
    } catch (err) {
      console.error("Lỗi kích hoạt Bé Kim Live:", err);
      const errMsg = err && err.message ? err.message : String(err);
      if (isQuotaOrKeyError(errMsg) && handleLiveQuotaFailure(errMsg)) return;
      stopBekimLive();
      alert("Không kích hoạt được Bé Kim Live: " + errMsg);
    }
  }

  function stopBekimLive() {
    sessionGen++;
    isStarting = false;
    isActive = false;
    autoShutdownPending = false;
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    if (autoShutdownTimer) { clearTimeout(autoShutdownTimer); autoShutdownTimer = null; }
    showToast("");
    setVisualState("idle");

    if (processor) {
      try { processor.disconnect(); } catch (e) {}
      processor.onaudioprocess = null;
      processor = null;
    }
    if (micSource) {
      try { micSource.disconnect(); } catch (e) {}
      micSource = null;
    }
    if (stream) {
      stream.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} });
      stream = null;
    }
    stopPlayback();
    if (gainNode) { try { gainNode.disconnect(); } catch (e) {} gainNode = null; }
    if (compressor) { try { compressor.disconnect(); } catch (e) {} compressor = null; }
    if (liveAnalyser) { try { liveAnalyser.disconnect(); } catch (e) {} liveAnalyser = null; }
    if (audioCtx) { try { audioCtx.close(); } catch (e) {} audioCtx = null; }
    if (socket) {
      try { socket.close(1000); } catch (e) {}
      socket = null;
    }
  }

  function startMicStreaming() {
    if (!stream || !audioCtx || !socket || socket.readyState !== WebSocket.OPEN) return;
    micSource = audioCtx.createMediaStreamSource(stream);
    processor = audioCtx.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (!isActive || autoShutdownPending || !socket || socket.readyState !== WebSocket.OPEN) return;
      const input = e.inputBuffer.getChannelData(0);
      const ratio = audioCtx.sampleRate / 16000;
      const newLen = Math.round(input.length / ratio);
      const pcm = new Int16Array(newLen);
      for (let i = 0; i < newLen; i++) {
        const s = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)] || 0));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      const bytes = new Uint8Array(pcm.buffer);
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      }
      socket.send(JSON.stringify({
        realtimeInput: { audio: { data: btoa(bin), mimeType: "audio/pcm;rate=16000" } }
      }));
    };

    micSource.connect(processor);
    const silentMute = audioCtx.createGain();
    silentMute.gain.value = 0;
    processor.connect(silentMute);
    silentMute.connect(audioCtx.destination);
  }

  function queueAudioChunk(b64) {
    if (!audioCtx) return;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const view = new DataView(bytes.buffer);
    const count = Math.floor(bytes.byteLength / 2);
    const buf = audioCtx.createBuffer(1, count, 24000);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < count; i++) ch[i] = view.getInt16(i * 2, true) / 32768;

    const now = audioCtx.currentTime;
    if (nextPlayTime < now) nextPlayTime = now + 0.04;

    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(gainNode || audioCtx.destination);
    src.start(nextPlayTime);
    nextPlayTime += buf.duration;
    playSources.push(src);

    setVisualState("active", "🔊 Bé Kim đang nói...", "#e53935");

    src.onended = () => {
      playSources = playSources.filter((s) => s !== src);
      if (isActive && playSources.length === 0) {
        if (autoShutdownPending) {
          finishAutoShutdown();
        } else {
          setVisualState("active", "🎙️ Bé Kim đang nghe", "#00c853");
          resetIdleTimer();
        }
      }
    };
  }

  function stopPlayback() {
    playSources.forEach((s) => { try { s.stop(); } catch (e) {} });
    playSources = [];
    nextPlayTime = 0;
    if (isActive && !autoShutdownPending) setVisualState("active", "🎙️ Bé Kim đang nghe", "#00c853");
  }

  /* =========================================================
     TIỆN ÍCH QUẢN LÝ MỌI NGÓC NGÁCH MENU.HTML
  ========================================================= */
  function isVisible(id) {
    const el = document.getElementById(id);
    if (!el) return false;
    return el.classList.contains("active") || (el.style.display && el.style.display !== "none");
  }

  function closeAllCustomerPopups() {
    if (typeof closeCommentsSheetDirect === "function") closeCommentsSheetDirect();
    if (typeof closeTiktokModal === "function") closeTiktokModal();
    if (typeof closeOptionsModal === "function") closeOptionsModal();
    if (typeof closeCheckoutModal === "function") closeCheckoutModal();
    if (typeof closeHistoryModal === "function") closeHistoryModal();
    if (typeof toggleKbOrderPopup === "function") toggleKbOrderPopup(false);
    if (typeof closeGamePopup === "function") closeGamePopup();
    if (typeof closeWheelPopup === "function") closeWheelPopup();
    if (typeof closeDinhViPopup === "function") closeDinhViPopup();
    if (typeof closeBannerPopup === "function") closeBannerPopup();
    if (typeof closeSuccessOrderPopup === "function") closeSuccessOrderPopup();

    const contactEl = document.getElementById("contactModal");
    if (contactEl) contactEl.style.display = "none";
    const orderDetailEl = document.getElementById("orderDetailReviewModal");
    if (orderDetailEl) orderDetailEl.remove();
    const statusCheckEl = document.getElementById("statusCheckResultModal");
    if (statusCheckEl) statusCheckEl.remove();
    document.body.classList.remove("no-scroll");
  }

  function findDish(query) {
    if (!Array.isArray(menu) || !menu.length) return null;
    const q = removeDiacritics(query || "").trim();
    const isCurrentRef = !q || /^(mon nay|nay|mon do|do|no|san pham nay|ly nay|phan nay|cai nay)$/.test(q);
    if (isCurrentRef) {
      if (isVisible("tiktokModal") && filteredMenu[currentTiktokIndex]) {
        return filteredMenu[currentTiktokIndex];
      }
      if (isVisible("optionsModal") && selectedProduct) {
        return selectedProduct;
      }
      if (!q) return null;
    }
    let found = menu.find((m) => removeDiacritics(m.name) === q);
    if (!found) found = menu.find((m) => removeDiacritics(m.name).includes(q));
    if (!found) found = menu.find((m) => smartMatch(query, m.name));
    return found || null;
  }

  function canDishUpsize(dish) {
    if (!dish) return false;
    const isFood = getCategoryType(dish.name, dish.category) === "Food";
    const nameLower = dish.name.toLowerCase();
    const forbidden = ["ly 1 lít", "1 lít", "ly khổng lồ", "khổng lồ", "ly nhỏ", "650ml"];
    return !isFood && !forbidden.some((k) => nameLower.includes(k));
  }

  function normalizeSugar(val) {
    const n = removeDiacritics(val || "");
    if (n.includes("khong")) return "Không đường";
    if (n.includes("it")) return "Ít đường";
    return "Đường bình thường";
  }

  function normalizeIce(val) {
    const n = removeDiacritics(val || "");
    if (n.includes("khong")) return "Không đá";
    if (n.includes("it")) return "Ít đá";
    return "Đá bình thường";
  }

  function normalizeOrderType(val) {
    const n = removeDiacritics(val || "").trim();
    if (!n) return "";
    if (
      n.includes("tu ra") ||
      n.includes("ra quan") ||
      n.includes("tai quan") ||
      n.includes("den quan") ||
      n.includes("den lay") ||
      n.includes("tu lay") ||
      n.includes("mang ve") ||
      n.includes("pickup")
    ) {
      return "Tự ra lấy";
    }
    if (
      n.includes("giao") ||
      n.includes("ship") ||
      n.includes("tan noi") ||
      n.includes("delivery")
    ) {
      return "Giao hàng";
    }
    return "";
  }

  function normalizePayMethod(val) {
    const n = removeDiacritics(val || "").trim();
    if (!n) return "";
    if (n.includes("kim cuong") || n.includes("diamond") || n.includes("tui")) return "Túi Kim Cương";
    if (n.includes("chuyen khoan") || n.includes("bank") || n.includes("qr")) return "Chuyển khoản";
    if (n.includes("tien mat") || n.includes("cash")) return "Tiền mặt";
    return "";
  }

  function parseToppingEntry(entry) {
    let topName = "";
    let topQty = 1;
    if (typeof entry === "string") {
      topName = entry.trim();
      const mEnd = topName.match(/^(.*?)\s*(?:x|\*)\s*(\d+)$/i);
      const mStart = topName.match(/^(\d+)\s*(?:phan|vien|x)?\s+(.+)$/i);
      if (mEnd) {
        topName = mEnd[1].trim();
        topQty = Math.max(0, parseInt(mEnd[2], 10) || 1);
      } else if (mStart) {
        topQty = Math.max(0, parseInt(mStart[1], 10) || 1);
        topName = mStart[2].trim();
      }
    } else if (entry && typeof entry === "object") {
      topName = String(entry.name || "").trim();
      topQty = entry.qty !== undefined ? Math.max(0, parseInt(entry.qty, 10) || 0) : 1;
    }
    return { topName, topQty };
  }

  function getOptionsModalSnapshot() {
    if (!selectedProduct) return null;
    const isFood = getCategoryType(selectedProduct.name, selectedProduct.category) === "Food";
    const sizeGroup = document.getElementById("sizeGroupContainer");
    const canUpsize = sizeGroup ? sizeGroup.style.display !== "none" : false;
    const sizeChecked = document.querySelector('input[name="sizeOption"]:checked');
    const sugarChecked = document.querySelector('input[name="sugarOption"]:checked');
    const iceChecked = document.querySelector('input[name="iceOption"]:checked');

    const size = (!isFood && canUpsize && sizeChecked) ? sizeChecked.value : "Mặc định";
    const sugar = (!isFood && sugarChecked) ? sugarChecked.value : "";
    const ice = (!isFood && iceChecked) ? iceChecked.value : "";

    const selectedToppings = [];
    for (const [tName, qty] of Object.entries(currentModalToppings || {})) {
      if (qty > 0) selectedToppings.push({ name: tName, qty: qty });
    }

    const priceEl = document.getElementById("modalDishPrice");
    const priceText = priceEl ? priceEl.innerText : formatDynamicPrice(selectedProduct.price);
    return {
      dishName: selectedProduct.name,
      isFood: isFood,
      canUpsize: canUpsize,
      size: size,
      sugar: sugar,
      ice: ice,
      selectedToppings: selectedToppings,
      quantity: pendingOptionQty,
      unitPriceText: priceText
    };
  }

  function applyOptionsSelectionToModal(args) {
    if (!selectedProduct) return { upsizeRejectedReason: "", unmatchedToppings: [] };
    const isFood = getCategoryType(selectedProduct.name, selectedProduct.category) === "Food";
    const sizeGroup = document.getElementById("sizeGroupContainer");
    const canUpsize = sizeGroup ? sizeGroup.style.display !== "none" : false;
    let upsizeRejectedReason = "";

    if (typeof args.upsize === "boolean") {
      if (args.upsize && !canUpsize) {
        upsizeRejectedReason = "Món này không hỗ trợ upsize lên ly 1 lít.";
      } else if (!isFood && canUpsize) {
        const val = args.upsize ? "Upsize 1 Lít" : "Bình thường";
        const radio = document.querySelector(`input[name="sizeOption"][value="${val}"]`);
        if (radio) radio.checked = true;
      }
    }

    if (!isFood && args.sugar) {
      const sVal = normalizeSugar(args.sugar);
      const sRadio = document.querySelector(`input[name="sugarOption"][value="${sVal}"]`);
      if (sRadio) sRadio.checked = true;
    }

    if (!isFood && args.ice) {
      const iVal = normalizeIce(args.ice);
      const iRadio = document.querySelector(`input[name="iceOption"][value="${iVal}"]`);
      if (iRadio) iRadio.checked = true;
    }

    const availableList = isFood ? snackToppings : drinkToppings;
    if (args.resetToppings) {
      availableList.forEach((t) => {
        currentModalToppings[t.name] = 0;
        const safeKey = t.name.replace(/[^a-zA-Z0-9]/g, "_");
        const qtyEl = document.getElementById(`top-qty-${safeKey}`);
        if (qtyEl) qtyEl.innerText = "0";
      });
    }

    const unmatchedToppings = [];
    if (Array.isArray(args.toppings)) {
      args.toppings.forEach((entry) => {
        const { topName, topQty } = parseToppingEntry(entry);
        if (!topName) return;

        const matched = availableList.find(
          (t) => removeDiacritics(t.name) === removeDiacritics(topName) ||
                 removeDiacritics(t.name).includes(removeDiacritics(topName)) ||
                 smartMatch(topName, t.name)
        );
        if (matched) {
          currentModalToppings[matched.name] = topQty;
          const safeKey = matched.name.replace(/[^a-zA-Z0-9]/g, "_");
          const qtyEl = document.getElementById(`top-qty-${safeKey}`);
          if (qtyEl) qtyEl.innerText = String(topQty);
        } else {
          unmatchedToppings.push(topName);
        }
      });
    }

    if (args.quantity !== undefined) {
      pendingOptionQty = Math.max(1, parseInt(args.quantity, 10) || 1);
    }

    updateModalTotal();
    return { upsizeRejectedReason, unmatchedToppings };
  }

  function syncPaymentRadiosWithPriceMode(payMethod) {
    const radioTienMat = document.querySelector('input[name="payMethod"][value="Tiền mặt"]');
    const radioCK = document.querySelector('input[name="payMethod"][value="Chuyển khoản"]');
    const radioDiamond = document.querySelector('input[name="payMethod"][value="Túi Kim Cương"]');
    const pTienMat = radioTienMat ? radioTienMat.closest("label") : null;
    const pCK = radioCK ? radioCK.closest("label") : null;
    const pDiamond = radioDiamond ? radioDiamond.closest("label") : null;

    if (payMethod === "Túi Kim Cương") {
      if (currentPriceMode !== "DIAMOND" && typeof setPriceDisplayMode === "function") {
        setPriceDisplayMode("DIAMOND");
      }
      if (pTienMat) pTienMat.style.display = "none";
      if (pCK) pCK.style.display = "none";
      if (pDiamond) pDiamond.style.display = "inline-block";
      if (radioDiamond) radioDiamond.checked = true;
    } else if (payMethod === "Tiền mặt" || payMethod === "Chuyển khoản") {
      if (currentPriceMode === "DIAMOND" && typeof setPriceDisplayMode === "function") {
        setPriceDisplayMode("K");
      }
      if (pTienMat) pTienMat.style.display = "inline-block";
      if (pCK) pCK.style.display = "inline-block";
      if (pDiamond) pDiamond.style.display = "none";
      const targetRadio = payMethod === "Chuyển khoản" ? radioCK : radioTienMat;
      if (targetRadio) targetRadio.checked = true;
    }
    if (typeof updateCartDisplay === "function") updateCartDisplay();
  }

  function applyVoiceCustomerDraftToInputs() {
    if (voiceCustomerDraft.orderType) {
      const r = document.querySelector(`input[name="orderType"][value="${voiceCustomerDraft.orderType}"]`);
      if (r) {
        r.checked = true;
        toggleOrderTypeUI();
      }
    }
    if (voiceCustomerDraft.name !== undefined) {
      document.getElementById("customerName").value = voiceCustomerDraft.name;
    }
    if (voiceCustomerDraft.phone !== undefined) {
      document.getElementById("customerPhone").value = voiceCustomerDraft.phone;
    }
    const curOrderRadio = document.querySelector('input[name="orderType"]:checked');
    const curOrderType = curOrderRadio ? curOrderRadio.value : "Giao hàng";
    if (curOrderType !== "Tự ra lấy") {
      const addrEl = document.getElementById("customerAddress");
      if (voiceCustomerDraft.address !== undefined) {
        addrEl.value = voiceCustomerDraft.address;
      }
      if (addrEl && addrEl.value.trim() && addrEl.value !== "Khách đến quán lấy") {
        autoCalculateShippingFromMenu();
      }
    }
    if (voiceCustomerDraft.note !== undefined) {
      document.getElementById("customerNote").value = voiceCustomerDraft.note;
    }
    if (voiceCustomerDraft.payMethod) {
      syncPaymentRadiosWithPriceMode(voiceCustomerDraft.payMethod);
    }
  }

  async function waitForShippingIfCalculating() {
    for (let i = 0; i < 12; i++) {
      const distEl = document.getElementById("bgDistanceText");
      if (!distEl || !distEl.innerText.includes("Đang tính")) break;
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  function getCheckoutSnapshot() {
    const foodTotal = calculateFoodSubtotal();
    const shipFee = getShippingFee();
    const discountCode = localStorage.getItem("kimbling_applied_discount_code") || "";
    const discountValK = parseInt(localStorage.getItem("kimbling_applied_discount_value") || "0", 10) || 0;
    const grandTotal = Math.max(0, foodTotal + shipFee - discountValK * 1000);

    const orderRadio = document.querySelector('input[name="orderType"]:checked');
    const payRadio = document.querySelector('input[name="payMethod"]:checked');
    const orderType = orderRadio ? orderRadio.value : "Giao hàng";
    const payMethod = payRadio ? payRadio.value : "Tiền mặt";

    const cName = (document.getElementById("customerName")?.value || "").trim();
    const cPhone = (document.getElementById("customerPhone")?.value || "").trim();
    const cAddr = (document.getElementById("customerAddress")?.value || "").trim();
    const cNote = (document.getElementById("customerNote")?.value || "").trim();
    const distText = document.getElementById("bgDistanceText")?.innerText || "";
    const storeClosed = !!document.getElementById("btnSubmitOrder")?.disabled;

    return {
      cartCount: cart.reduce((s, i) => s + i.qty, 0),
      items: cart.map((i) => ({
        name: i.name,
        qty: i.qty,
        options: i.options,
        lineTotalText: formatDynamicPrice(i.price * i.qty)
      })),
      priceMode: currentPriceMode,
      foodSubtotalText: formatDynamicPrice(foodTotal),
      shippingFeeText: shipFee === 0 ? "0đ (Freeship / Tự lấy)" : formatPrice(shipFee),
      distanceText: distText,
      discountCode: discountCode,
      discountValueK: discountValK,
      grandTotalText: (currentPriceMode === "DIAMOND" || payMethod === "Túi Kim Cương")
        ? formatDynamicPrice(grandTotal)
        : formatPrice(grandTotal),
      orderType: orderType,
      customerName: cName,
      customerPhone: cPhone,
      customerAddress: cAddr,
      customerNote: cNote,
      payMethod: payMethod,
      storeClosed: storeClosed,
      missingFields: [
        !cName ? "Tên người nhận" : "",
        !cPhone ? "Số điện thoại" : "",
        !cAddr ? "Địa chỉ giao hàng" : ""
      ].filter(Boolean)
    };
  }

  /* =========================================================
     XỬ LÝ CÁC TOOL TỪ GEMINI LIVE
  ========================================================= */
  async function handleMenuToolCall(name, args) {
    if (name === "filter_menu") {
      return await handleMenuToolCall("open_menu_section", {
        section: "home_menu",
        category: args.category,
        keyword: args.keyword
      });
    }
    if (name === "open_product_tiktok") {
      return await handleMenuToolCall("open_menu_section", {
        section: "tiktok",
        dishName: args.dishName
      });
    }
    if (name === "get_cart_summary") {
      return await handleMenuToolCall("manage_cart", { action: "view" });
    }
    if (name === "remove_from_cart") {
      return await handleMenuToolCall("manage_cart", { action: "remove", dishName: args.dishName });
    }
    if (name === "add_to_cart") {
      return await handleMenuToolCall("open_dish_options", args);
    }
    if (name === "submit_order") {
      return args.confirmSend
        ? await handleMenuToolCall("confirm_submit_order", { confirmed: true })
        : await handleMenuToolCall("open_checkout", {});
    }

    if (name === "end_bekim_session") {
      autoShutdownPending = true;
      autoShutdownMessage = "👋 Tạm biệt! Bé Kim đã ngưng hỗ trợ.";
      if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
      if (autoShutdownTimer) clearTimeout(autoShutdownTimer);
      autoShutdownTimer = setTimeout(() => {
        if (isActive) {
          stopBekimLive();
          showToast("👋 Tạm biệt! Bé Kim đã ngưng hỗ trợ.", 3000);
        }
      }, 6000);
      return {
        ok: true,
        ending: true,
        message: "Đã nhận lệnh ngưng hỗ trợ. Hãy chào tạm biệt khách ngắn gọn 1 câu."
      };
    }

    if (name === "close_popup") {
      closeAllCustomerPopups();
      return { ok: true };
    }

    if (name === "open_menu_section") {
      const sec = args.section || "home_menu";

      if (sec === "admin" || sec === "system") {
        return { ok: false, error: "Mục hệ thống không thuộc quyền thao tác của trợ lý." };
      }

      if (sec === "home_menu") {
        closeAllCustomerPopups();
        const searchInput = document.getElementById("searchInput");
        const clearBtn = document.getElementById("searchClearBtn");
        const kw = (args.keyword || "").trim();

        if (searchInput) {
          searchInput.value = kw;
          if (clearBtn) clearBtn.style.display = kw ? "flex" : "none";
        }

        if (!kw && args.category) {
          const catBtn = document.querySelector(`.cat-btn[onclick*="'${args.category}'"]`);
          if (catBtn) filterCategory(args.category, catBtn);
          else {
            currentCategory = args.category;
            renderMenu();
          }
        } else {
          renderMenu();
        }
        window.scrollTo({ top: 180, behavior: "smooth" });
        return {
          ok: true,
          section: "home_menu",
          category: currentCategory,
          keyword: kw,
          matchingDishes: filteredMenu.slice(0, 8).map((m) => `${m.name} (${formatDynamicPrice(m.price)}${m.isSoldOut ? ", HẾT" : ""})`)
        };
      }

      if (sec === "tiktok") {
        const dish = findDish(args.dishName);
        if (!dish) return { ok: false, error: "Không tìm thấy món " + (args.dishName || "") };
        closeAllCustomerPopups();

        let idx = filteredMenu.findIndex((m) => m.id === dish.id);
        if (idx === -1) {
          filteredMenu = [...menu];
          idx = filteredMenu.findIndex((m) => m.id === dish.id);
        }
        openTiktokModal(idx);
        return {
          ok: true,
          section: "tiktok",
          openedDish: dish.name,
          priceText: formatDynamicPrice(dish.price),
          canUpsize: canDishUpsize(dish),
          isSoldOut: !!dish.isSoldOut
        };
      }

      if (sec === "history") {
        closeAllCustomerPopups();
        openHistoryModal();
        let historyData = [];
        try { historyData = JSON.parse(localStorage.getItem("kimbling_order_history") || "[]"); } catch (e) {}
        return {
          ok: true,
          section: "history",
          recentOrdersCount: historyData.length,
          recentOrders: historyData.slice(0, 3).map((o) => ({
            time: o.time,
            total: o.totalStr,
            items: (o.items || []).map((i) => `${i.name} x${i.qty}`)
          }))
        };
      }

      if (sec === "order_lookup") {
        closeAllCustomerPopups();
        toggleKbOrderPopup(true);
        return { ok: true, section: "order_lookup" };
      }

      if (sec === "lucky_gift") {
        closeAllCustomerPopups();
        openLuckyGiftPopup();
        return { ok: true, section: "lucky_gift" };
      }

      if (sec === "lucky_wheel") {
        closeAllCustomerPopups();
        openWheelPopup();
        return { ok: true, section: "lucky_wheel" };
      }

      if (sec === "shipping_map") {
        closeAllCustomerPopups();
        openDinhViPopup();
        return { ok: true, section: "shipping_map" };
      }

      if (sec === "contact") {
        closeAllCustomerPopups();
        openContactModal();
        return { ok: true, section: "contact", phone: "086.269.5.269" };
      }

      if (sec === "banner") {
        closeAllCustomerPopups();
        const b = document.getElementById("bannerPopupModal");
        if (b) b.style.display = "flex";
        return { ok: true, section: "banner" };
      }

      if (sec === "install_app") {
        showInstallPrompt();
        return { ok: true, section: "install_app" };
      }

      if (sec === "share") {
        shareStoreWebsite();
        return { ok: true, section: "share" };
      }

      if (sec === "scroll_top") {
        scrollToTop();
        return { ok: true, section: "scroll_top" };
      }

      return { ok: false, error: "Không hỗ trợ mở mục: " + sec };
    }

    if (name === "control_tiktok") {
      if (!isVisible("tiktokModal")) {
        return { ok: false, error: "Popup TikTok chưa mở. Hãy mở một món trước." };
      }
      const act = args.action;
      if (act === "next") navigateTiktok(1);
      else if (act === "prev") navigateTiktok(-1);
      else if (act === "toggle_video") {
        const cur = filteredMenu[currentTiktokIndex];
        if (!cur || !cur.videoUrl) return { ok: false, error: "Món này không có video TikTok." };
        toggleMediaView(cur.id);
      } else if (act === "like") {
        const heartBtn = document.getElementById("btnTiktokHeart");
        if (heartBtn) toggleHeart(heartBtn);
      } else if (act === "open_comments") {
        openCommentsSheet();
      } else if (act === "close_comments") {
        closeCommentsSheetDirect();
      }
      const item = filteredMenu[currentTiktokIndex];
      return {
        ok: true,
        action: act,
        currentDish: item ? item.name : "",
        priceText: item ? formatDynamicPrice(item.price) : "",
        isSoldOut: item ? !!item.isSoldOut : false
      };
    }

    if (name === "open_dish_options") {
      const dish = findDish(args.dishName);
      if (!dish) return { ok: false, error: "Không tìm thấy món " + (args.dishName || "") };
      if (dish.isSoldOut) return { ok: false, error: dish.name + " hiện đang tạm hết hàng." };

      closeAllCustomerPopups();
      pendingOptionQty = Math.max(1, parseInt(args.quantity || 1, 10) || 1);
      openOptionsModal(dish.id);

      const { upsizeRejectedReason, unmatchedToppings } = applyOptionsSelectionToModal(args);

      const isFood = getCategoryType(dish.name, dish.category) === "Food";
      const avail = (isFood ? snackToppings : drinkToppings).map((t) => `${t.name} (+${formatDynamicPrice(t.price)})`);
      return {
        ok: true,
        openedOptionsModal: true,
        ...getOptionsModalSnapshot(),
        upsizeRejectedReason: upsizeRejectedReason,
        unmatchedToppings: unmatchedToppings,
        availableToppings: avail
      };
    }

    if (name === "update_dish_options") {
      if (!isVisible("optionsModal") || !selectedProduct) {
        if (args.dishName) {
          const dish = findDish(args.dishName);
          if (!dish) return { ok: false, error: "Không tìm thấy món " + args.dishName };
          if (dish.isSoldOut) return { ok: false, error: dish.name + " hiện đang tạm hết hàng." };
          closeAllCustomerPopups();
          pendingOptionQty = 1;
          openOptionsModal(dish.id);
        } else {
          return { ok: false, error: "Bảng tùy chọn món chưa mở. Hãy gọi open_dish_options trước." };
        }
      }

      const { upsizeRejectedReason, unmatchedToppings } = applyOptionsSelectionToModal(args);
      return {
        ok: true,
        ...getOptionsModalSnapshot(),
        upsizeRejectedReason: upsizeRejectedReason,
        unmatchedToppings: unmatchedToppings
      };
    }

    if (name === "confirm_add_options_to_cart") {
      if (!isVisible("optionsModal") || !selectedProduct) {
        return { ok: false, error: "Bảng tùy chọn món chưa mở. Hãy mở bảng tùy chọn món trước." };
      }

      const snap = getOptionsModalSnapshot();
      const qty = Math.max(1, parseInt(args.quantity || pendingOptionQty || 1, 10) || 1);

      confirmAddToCart();
      if (cart.length > 0) {
        cart[cart.length - 1].qty = qty;
        renderCartBar();
      }
      pendingOptionQty = 1;

      showToast(`🛒 Đã thêm ${qty} ${snap.dishName} vào giỏ`, 2500);

      return {
        ok: true,
        addedDish: snap.dishName,
        quantity: qty,
        size: snap.size,
        sugar: snap.sugar,
        ice: snap.ice,
        toppings: snap.selectedToppings,
        cartCount: cart.reduce((s, i) => s + i.qty, 0),
        foodSubtotalText: formatDynamicPrice(calculateFoodSubtotal())
      };
    }

    if (name === "manage_cart") {
      const act = args.action || "view";

      if (act === "view") {
        return { ok: true, ...getCheckoutSnapshot() };
      }

      if (act === "remove_discount") {
        removeDiscountCode();
        return { ok: true, ...getCheckoutSnapshot() };
      }

      if (act === "reorder_last") {
        let historyData = [];
        try { historyData = JSON.parse(localStorage.getItem("kimbling_order_history") || "[]"); } catch (e) {}
        if (!historyData.length || !historyData[0].items || !historyData[0].items.length) {
          return { ok: false, error: "Chưa có đơn hàng cũ nào trên máy để đặt lại." };
        }
        historyData[0].items.forEach((oldItem) => {
          cart.push({
            id: oldItem.id || 0,
            name: oldItem.name,
            imageUrl: oldItem.imageUrl || "",
            category: oldItem.category || "",
            price: oldItem.price,
            options: oldItem.options,
            qty: oldItem.qty
          });
        });
        renderCartBar();
        closeHistoryModal();
        showToast("🛒 Đã thêm lại món từ đơn gần nhất", 2500);
        return { ok: true, ...getCheckoutSnapshot() };
      }

      const q = removeDiacritics(args.dishName || "");
      const idx = cart.findIndex((i) => removeDiacritics(i.name).includes(q));
      if (idx === -1) return { ok: false, error: "Không tìm thấy món này trong giỏ hàng." };

      if (act === "remove") {
        const removed = cart.splice(idx, 1)[0];
        renderCartBar();
        if (isVisible("checkoutModal")) {
          updateCartDisplay();
          if (cart.length === 0) closeCheckoutModal();
        }
        return { ok: true, removed: removed.name, ...getCheckoutSnapshot() };
      }

      if (act === "set_qty") {
        const newQty = parseInt(args.quantity, 10);
        if (!Number.isFinite(newQty) || newQty <= 0) {
          cart.splice(idx, 1);
        } else {
          cart[idx].qty = newQty;
        }
        renderCartBar();
        if (isVisible("checkoutModal")) {
          updateCartDisplay();
          if (cart.length === 0) closeCheckoutModal();
        }
        return { ok: true, ...getCheckoutSnapshot() };
      }

      return { ok: false, error: "Thao tác giỏ hàng không hợp lệ." };
    }

    if (name === "set_price_and_diamond") {
      if (args.priceMode === "K" || args.priceMode === "DIAMOND") {
        setPriceDisplayMode(args.priceMode);
      }

      let balanceInfo = null;
      const phoneEl = document.getElementById("mainCustomerPhone");
      const phone = (args.phoneForDiamond || (phoneEl ? phoneEl.value : "") || "").trim();
      if (phone && phone.length >= 9) {
        if (phoneEl) phoneEl.value = phone;
        localStorage.setItem("kimbling_cust_phone", phone);
        localStorage.setItem("kb_customer_phone", phone);
        try {
          const data = await fetch(
            `${GOOGLE_SCRIPT_URL}?type=adminGetCustomerInfo&phone=${encodeURIComponent(phone)}`
          ).then((r) => r.json());
          const bal = data && data.hatKim ? parseInt(data.hatKim, 10) : 0;
          const dispEl = document.getElementById("mainDiamondDisplay");
          if (dispEl) dispEl.innerText = bal.toLocaleString("vi-VN") + " 💎";
          balanceInfo = { phone: phone, diamondBalance: bal };
        } catch (e) {
          balanceInfo = { phone: phone, error: "Không tra cứu được số dư lúc này." };
        }
      }

      return {
        ok: true,
        priceMode: currentPriceMode,
        diamondInfo: balanceInfo
      };
    }

    if (name === "open_checkout") {
      if (!cart.length) return { ok: false, error: "Giỏ hàng đang trống, chưa thể mở thanh toán." };
      closeAllCustomerPopups();
      openCheckoutModal();
      applyVoiceCustomerDraftToInputs();
      await waitForShippingIfCalculating();

      return {
        ok: true,
        openedCheckout: true,
        ...getCheckoutSnapshot()
      };
    }

    if (name === "set_customer_info") {
      if (args.orderType !== undefined) {
        const normType = normalizeOrderType(args.orderType);
        if (normType) voiceCustomerDraft.orderType = normType;
      }
      if (args.name !== undefined) {
        voiceCustomerDraft.name = args.name;
        localStorage.setItem("kimbling_cust_name", args.name);
      }
      if (args.phone !== undefined) {
        voiceCustomerDraft.phone = args.phone;
        localStorage.setItem("kimbling_cust_phone", args.phone);
      }
      if (args.address !== undefined && voiceCustomerDraft.orderType !== "Tự ra lấy") {
        const cleanAddr = String(args.address || "").trim();
        if (cleanAddr && !/^(tai quan|khach den quan lay|tu ra lay)$/i.test(removeDiacritics(cleanAddr))) {
          voiceCustomerDraft.address = cleanAddr;
          localStorage.setItem("kimbling_cust_addr", cleanAddr);
        }
      }
      if (args.note !== undefined) voiceCustomerDraft.note = args.note;
      if (args.payMethod !== undefined) {
        const normPay = normalizePayMethod(args.payMethod);
        if (normPay) voiceCustomerDraft.payMethod = normPay;
      }

      applyVoiceCustomerDraftToInputs();
      await waitForShippingIfCalculating();

      return { ok: true, ...getCheckoutSnapshot() };
    }

    if (name === "confirm_submit_order") {
      if (!cart.length) return { ok: false, error: "Giỏ hàng đang trống, chưa thể đặt hàng." };

      if (!isVisible("checkoutModal")) {
        closeAllCustomerPopups();
        openCheckoutModal();
        applyVoiceCustomerDraftToInputs();
        await waitForShippingIfCalculating();
        return {
          ok: false,
          openedCheckout: true,
          needReviewFirst: true,
          ...getCheckoutSnapshot(),
          message: "Đã mở mục thanh toán cho khách xem lại. Hãy đọc lại toàn bộ thông tin để khách xác nhận rồi mới gửi đơn."
        };
      }

      const snap = getCheckoutSnapshot();
      if (snap.storeClosed) {
        return { ok: false, error: "Quán hiện đang tạm ngưng nhận đơn online." };
      }

      if (snap.missingFields.length > 0) {
        return {
          ok: false,
          openedCheckout: true,
          missingFields: snap.missingFields,
          message: "Còn thiếu thông tin khách hàng, hãy hỏi khách đọc bổ sung."
        };
      }

      if (snap.payMethod === "Túi Kim Cương" && !isDiamondPinVerified) {
        return {
          ok: false,
          openedCheckout: true,
          needPin: true,
          message: "Khách cần tự nhập mã PIN 4 số của Túi Kim Cương trên màn hình."
        };
      }

      await waitForShippingIfCalculating();
      await processOrderSubmit();

      const successModal = document.getElementById("orderSuccessModalOverlay");
      if (successModal) {
        voiceCustomerDraft.note = "";
        autoShutdownMessage = "✅ Đã đặt đơn xong! Bé Kim đã tự nghỉ.";
        autoShutdownPending = true;
        autoShutdownTimer = setTimeout(() => {
          if (isActive) {
            stopBekimLive();
            showToast("✅ Đã đặt đơn xong! Bé Kim đã tự nghỉ.", 3000);
          }
        }, 8000);
      }

      return {
        ok: !!successModal,
        submitted: !!successModal,
        message: successModal
          ? "Đã gửi đặt hàng thành công lên quán! Hãy cảm ơn khách ngắn gọn 1 câu."
          : "Chưa gửi được đơn, vui lòng kiểm tra lại thông tin trên màn hình."
      };
    }

    return { ok: false, error: "Lệnh không hợp lệ: " + name };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureBekimUI);
  } else {
    ensureBekimUI();
  }

  window.toggleBekimLive = toggleBekimLive;
  window.stopBekimLive = stopBekimLive;
  window.addEventListener("pagehide", stopBekimLive);
})();