/* =========================================================
 * BEKIM.JS - Trợ lý giọng nói Gemini Live tích hợp trực tiếp vào menu.html
 * - Không khung chat
 * - Tư vấn chuẩn như aichotdon.html
 * - Điều khiển mở TikTok, lọc menu, thêm giỏ hàng, điền thông tin & đặt hàng
 * - Dùng chung Apps Script của aichotdon.html
 * ========================================================= */
(function () {
  const BEKIM_AI_URL =
    "https://script.google.com/macros/s/AKfycby1yOLdWbamA0qmS_UkURyrHGBKO9JmYELP6FmMs-BfVgPdWhNr12nJjEVC3_Y_zgsgfA/exec";
  const IDLE_TIMEOUT_MS = 90000;

  let socket = null;
  let stream = null;
  let audioCtx = null;
  let processor = null;
  let micSource = null;
  let gainNode = null;
  let compressor = null;
  let isActive = false;
  let isStarting = false;
  let nextPlayTime = 0;
  let playSources = [];
  let idleTimer = null;
  let sessionGen = 0;

  // Lưu tạm thông tin khách đọc qua giọng nói để không bị localStorage ghi đè khi mở checkout
  let voiceCustomerDraft = {};

  function ensureBekimUI() {
    if (!document.getElementById("bekimLiveStyles")) {
      const style = document.createElement("style");
      style.id = "bekimLiveStyles";
      style.textContent = `
        .floating-ai-btn.bekim-connecting {
          border-color: #ff9800 !important;
          box-shadow: 0 0 0 6px rgba(255, 152, 0, 0.35) !important;
        }
        .floating-ai-btn.bekim-active {
          border-color: #00c853 !important;
          box-shadow: 0 0 0 6px rgba(0, 200, 83, 0.35), 0 4px 18px rgba(0, 200, 83, 0.6) !important;
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
          right: 12px;
          bottom: 205px;
          background: #00c853;
          color: #ffffff;
          font-size: 11px;
          font-weight: bold;
          padding: 4px 9px;
          border-radius: 12px;
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
    if (!isActive) return;
    idleTimer = setTimeout(() => {
      if (isActive) {
        stopBekimLive();
        showToast("⏱️ Bé Kim đã tạm nghỉ sau 90 giây im lặng", 3000);
      }
    }, IDLE_TIMEOUT_MS);
  }

  async function toggleBekimLive() {
    if (isStarting) return;
    if (isActive) {
      stopBekimLive();
      return;
    }
    await startBekimLive();
  }

  async function startBekimLive() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Trình duyệt chưa hỗ trợ micro hoặc trang chưa chạy bằng HTTPS.");
      return;
    }

    isStarting = true;
    const gen = ++sessionGen;
    setVisualState("connecting");
    showToast("⏳ Đang kích hoạt Bé Kim cho menu đặt hàng...");

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
      gainNode.connect(compressor);
      compressor.connect(audioCtx.destination);

      const [tokenRes, micStream] = await Promise.all([
        fetch(BEKIM_AI_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "create_live_token", mode: "menu_control" })
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
            let resultObj;
            try {
              resultObj = await handleMenuToolCall(fc.name, fc.args || {});
            } catch (err) {
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
        }
      };

      socket.onerror = () => {
        if (gen === sessionGen) stopBekimLive();
      };
      socket.onclose = () => {
        if (gen === sessionGen) stopBekimLive();
      };
    } catch (err) {
      console.error("Lỗi kích hoạt Bé Kim Live:", err);
      stopBekimLive();
      alert("Không kích hoạt được Bé Kim Live: " + (err && err.message ? err.message : err));
    }
  }

  function stopBekimLive() {
    sessionGen++;
    isStarting = false;
    isActive = false;
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
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
    if (audioCtx) { try { audioCtx.close(); } catch (e) {} audioCtx = null; }
    if (socket) {
      try { socket.close(); } catch (e) {}
      socket = null;
    }
  }

  function startMicStreaming() {
    if (!stream || !audioCtx || !socket || socket.readyState !== WebSocket.OPEN) return;
    micSource = audioCtx.createMediaStreamSource(stream);
    processor = audioCtx.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (!isActive || !socket || socket.readyState !== WebSocket.OPEN) return;
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
        setVisualState("active", "🎙️ Bé Kim đang nghe", "#00c853");
      }
    };
  }

  function stopPlayback() {
    playSources.forEach((s) => { try { s.stop(); } catch (e) {} });
    playSources = [];
    nextPlayTime = 0;
    if (isActive) setVisualState("active", "🎙️ Bé Kim đang nghe", "#00c853");
  }

  /* =========================================================
     BỘ CÔNG CỤ BÉ KIM ĐIỀU KHIỂN MENU.HTML
  ========================================================= */
  function findDish(query) {
    if (!Array.isArray(menu) || !menu.length) return null;
    const q = removeDiacritics(query || "").trim();
    if (!q) {
      const tk = document.getElementById("tiktokModal");
      if (tk && tk.style.display === "flex" && filteredMenu[currentTiktokIndex]) {
        return filteredMenu[currentTiktokIndex];
      }
      return null;
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

  function applyVoiceCustomerDraftToInputs() {
    if (voiceCustomerDraft.orderType) {
      const r = document.querySelector(`input[name="orderType"][value="${voiceCustomerDraft.orderType}"]`);
      if (r) { r.checked = true; toggleOrderTypeUI(); }
    }
    if (voiceCustomerDraft.name) document.getElementById("customerName").value = voiceCustomerDraft.name;
    if (voiceCustomerDraft.phone) document.getElementById("customerPhone").value = voiceCustomerDraft.phone;
    if (voiceCustomerDraft.address && voiceCustomerDraft.orderType !== "Tự ra lấy") {
      document.getElementById("customerAddress").value = voiceCustomerDraft.address;
      autoCalculateShippingFromMenu();
    }
    if (voiceCustomerDraft.payMethod) {
      const p = document.querySelector(`input[name="payMethod"][value="${voiceCustomerDraft.payMethod}"]`);
      if (p) { p.checked = true; updatePaymentUI(); }
    }
  }

  async function waitForShippingIfCalculating() {
    for (let i = 0; i < 12; i++) {
      const distEl = document.getElementById("bgDistanceText");
      if (!distEl || !distEl.innerText.includes("Đang tính")) break;
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  async function handleMenuToolCall(name, args) {
    if (name === "close_popup") {
      if (typeof closeTiktokModal === "function") closeTiktokModal();
      if (typeof closeOptionsModal === "function") closeOptionsModal();
      if (typeof closeCheckoutModal === "function") closeCheckoutModal();
      return { ok: true };
    }

    if (name === "filter_menu") {
      if (typeof closeTiktokModal === "function") closeTiktokModal();
      if (typeof closeOptionsModal === "function") closeOptionsModal();
      if (typeof closeCheckoutModal === "function") closeCheckoutModal();

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
        category: currentCategory,
        keyword: kw,
        matchingDishes: filteredMenu.slice(0, 8).map((m) => `${m.name} (${formatPrice(m.price)}${m.isSoldOut ? ", HẾT" : ""})`)
      };
    }

    if (name === "open_product_tiktok") {
      const dish = findDish(args.dishName);
      if (!dish) return { ok: false, error: "Không tìm thấy món " + (args.dishName || "") };
      if (typeof closeOptionsModal === "function") closeOptionsModal();
      if (typeof closeCheckoutModal === "function") closeCheckoutModal();

      let idx = filteredMenu.findIndex((m) => m.id === dish.id);
      if (idx === -1) {
        filteredMenu = [...menu];
        idx = filteredMenu.findIndex((m) => m.id === dish.id);
      }
      openTiktokModal(idx);
      return {
        ok: true,
        openedDish: dish.name,
        priceText: formatPrice(dish.price),
        canUpsize: canDishUpsize(dish),
        isSoldOut: !!dish.isSoldOut
      };
    }

    if (name === "add_to_cart") {
      const dish = findDish(args.dishName);
      if (!dish) return { ok: false, error: "Không tìm thấy món " + (args.dishName || "") };
      if (dish.isSoldOut) return { ok: false, error: dish.name + " hiện đang tạm hết hàng." };

      const isFood = getCategoryType(dish.name, dish.category) === "Food";
      const canUpsize = canDishUpsize(dish);
      const wantUpsize = !!(args.upsize && canUpsize);
      const qty = Math.max(1, parseInt(args.quantity || 1, 10) || 1);

      let unitPrice = dish.price + (wantUpsize ? 10000 : 0);
      const availableToppings = isFood ? snackToppings : drinkToppings;
      const addedToppings = [];

      if (Array.isArray(args.toppings)) {
        args.toppings.forEach((reqTop) => {
          const matched = availableToppings.find(
            (t) => removeDiacritics(t.name) === removeDiacritics(reqTop) || smartMatch(reqTop, t.name)
          );
          if (matched) {
            unitPrice += matched.price;
            addedToppings.push(matched.name);
          }
        });
      }

      let opts = isFood
        ? ""
        : `${wantUpsize ? "Upsize 1 Lít" : "Bình thường"} | ${normalizeSugar(args.sugar)}, ${normalizeIce(args.ice)}`;
      if (addedToppings.length) opts += (opts ? " | + " : "+ ") + addedToppings.join(", ");
      if (!opts) opts = "Mặc định";

      cart.push({
        id: dish.id,
        name: dish.name,
        imageUrl: dish.imageUrl || "",
        category: dish.category || "",
        price: unitPrice,
        options: opts,
        qty: qty
      });

      renderCartBar();
      const cm = document.getElementById("checkoutModal");
      if (cm && cm.style.display === "flex") updateCartDisplay();

      showToast(`🛒 Đã thêm ${qty} ${dish.name}`, 2500);

      return {
        ok: true,
        added: dish.name,
        quantity: qty,
        upsizeApplied: wantUpsize,
        upsizeRejectedReason: args.upsize && !canUpsize ? "Món này không hỗ trợ upsize 1 lít." : "",
        toppingsAdded: addedToppings,
        unitPriceText: formatPrice(unitPrice),
        cartCount: cart.reduce((s, i) => s + i.qty, 0),
        foodSubtotalText: formatPrice(calculateFoodSubtotal())
      };
    }

    if (name === "get_cart_summary") {
      return {
        ok: true,
        cartCount: cart.reduce((s, i) => s + i.qty, 0),
        items: cart.map((i) => ({
          name: i.name,
          qty: i.qty,
          options: i.options,
          lineTotalText: formatPrice(i.price * i.qty)
        })),
        foodSubtotalText: formatPrice(calculateFoodSubtotal()),
        shippingFeeText: formatPrice(getShippingFee())
      };
    }

    if (name === "remove_from_cart") {
      const q = removeDiacritics(args.dishName || "");
      const idx = cart.findIndex((i) => removeDiacritics(i.name).includes(q));
      if (idx === -1) return { ok: false, error: "Không thấy món này trong giỏ hàng." };
      const removed = cart.splice(idx, 1)[0];
      renderCartBar();
      const cm = document.getElementById("checkoutModal");
      if (cm && cm.style.display === "flex") {
        updateCartDisplay();
        if (cart.length === 0) closeCheckoutModal();
      }
      return { ok: true, removed: removed.name, cartCount: cart.reduce((s, i) => s + i.qty, 0) };
    }

    if (name === "set_customer_info") {
      if (args.orderType) voiceCustomerDraft.orderType = args.orderType;
      if (args.name) {
        voiceCustomerDraft.name = args.name;
        localStorage.setItem("kimbling_cust_name", args.name);
      }
      if (args.phone) {
        voiceCustomerDraft.phone = args.phone;
        localStorage.setItem("kimbling_cust_phone", args.phone);
      }
      if (args.address) {
        voiceCustomerDraft.address = args.address;
        localStorage.setItem("kimbling_cust_addr", args.address);
      }
      if (args.payMethod) voiceCustomerDraft.payMethod = args.payMethod;

      applyVoiceCustomerDraftToInputs();
      return { ok: true, saved: voiceCustomerDraft };
    }

    if (name === "submit_order") {
      if (!cart.length) return { ok: false, error: "Giỏ hàng đang trống, chưa thể đặt hàng." };
      if (typeof closeTiktokModal === "function") closeTiktokModal();

      const cm = document.getElementById("checkoutModal");
      if (!cm || cm.style.display !== "flex") {
        openCheckoutModal();
        applyVoiceCustomerDraftToInputs();
      }

      const btnSubmit = document.getElementById("btnSubmitOrder");
      if (btnSubmit && btnSubmit.disabled) {
        return { ok: false, error: "Quán hiện đang tạm ngưng nhận đơn online." };
      }

      const cName = document.getElementById("customerName").value.trim();
      const cPhone = document.getElementById("customerPhone").value.trim();
      const cAddr = document.getElementById("customerAddress").value.trim();
      const payMethod = document.querySelector('input[name="payMethod"]:checked')?.value || "Tiền mặt";

      if (!cName || !cPhone || !cAddr) {
        return {
          ok: false,
          openedCheckout: true,
          missingFields: [
            !cName ? "Tên người nhận" : "",
            !cPhone ? "Số điện thoại" : "",
            !cAddr ? "Địa chỉ giao hàng" : ""
          ].filter(Boolean),
          message: "Thiếu thông tin người nhận, hãy hỏi khách đọc bổ sung hoặc nhập trên màn hình."
        };
      }

      if (payMethod === "Túi Kim Cương" && !isDiamondPinVerified) {
        return {
          ok: false,
          openedCheckout: true,
          needPin: true,
          message: "Khách cần nhập mã PIN 4 số của Túi Kim Cương trực tiếp trên màn hình."
        };
      }

      await waitForShippingIfCalculating();

      if (args.confirmSend) {
        await processOrderSubmit();
        const successModal = document.getElementById("orderSuccessModalOverlay");
        return {
          ok: !!successModal,
          submitted: !!successModal,
          message: successModal
            ? "Đã gửi đơn hàng thành công lên quán!"
            : "Chưa gửi được đơn, vui lòng kiểm tra lại thông tin trên màn hình."
        };
      }

      return {
        ok: true,
        openedCheckout: true,
        readyToSubmit: true,
        customerName: cName,
        phone: cPhone,
        address: cAddr,
        foodSubtotalText: formatPrice(calculateFoodSubtotal()),
        shippingFeeText: formatPrice(getShippingFee())
      };
    }

    return { ok: false, error: "Lệnh không hợp lệ: " + name };
  }

  window.toggleBekimLive = toggleBekimLive;
  window.stopBekimLive = stopBekimLive;
  window.addEventListener("pagehide", stopBekimLive);
})();