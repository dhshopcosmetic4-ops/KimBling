// BỘ LỌC MÀU & LÀM NÉT 4K CHẠY TRÊN GPU WEBGL (KHÔNG LÀM CHẬM & KHÔNG GIẢM CHẤT LƯỢNG VIDEO)
window.FILTERS_WEBGL = {
  _canvas: null,
  _gl: null,
  _prog: null,
  _tex: null,
  _locs: null,

  _init: function (W, H) {
    if (!this._canvas) {
      this._canvas = document.createElement('canvas');
      this._gl = this._canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
    }
    if (!this._gl) return false;
    const gl = this._gl;

    if (this._canvas.width !== W || this._canvas.height !== H) {
      this._canvas.width = W;
      this._canvas.height = H;
      gl.viewport(0, 0, W, H);
    }

    if (!this._prog) {
      const vsSrc = `
        attribute vec2 a_pos;
        attribute vec2 a_uv;
        varying vec2 v_uv;
        void main() {
          v_uv = a_uv;
          gl_Position = vec4(a_pos, 0.0, 1.0);
        }
      `;
      const fsSrc = `
        precision mediump float;
        uniform sampler2D u_tex;
        uniform vec2 u_texel;
        uniform int u_mode;
        uniform float u_amt;
        varying vec2 v_uv;

        vec3 adjustSat(vec3 c, float s) {
          float l = dot(c, vec3(0.299, 0.587, 0.114));
          return mix(vec3(l), c, s);
        }

        void main() {
          vec3 col = texture2D(u_tex, v_uv).rgb;

          // Mode 1: 4K Sắc Nét (Unsharp Mask + Tăng độ trong khối Clarity)
          if (u_mode == 1) {
            vec3 n = texture2D(u_tex, v_uv + vec2(0.0, u_texel.y)).rgb;
            vec3 s = texture2D(u_tex, v_uv - vec2(0.0, u_texel.y)).rgb;
            vec3 e = texture2D(u_tex, v_uv + vec2(u_texel.x, 0.0)).rgb;
            vec3 w = texture2D(u_tex, v_uv - vec2(u_texel.x, 0.0)).rgb;
            vec3 blur = (n + s + e + w) * 0.25;
            float sharpAmt = 0.72 * u_amt;
            col = col + (col - blur) * sharpAmt;
            col = (col - 0.5) * (1.0 + 0.10 * u_amt) + 0.5;
            col = adjustSat(col, 1.0 + 0.08 * u_amt);
          }
          // Mode 2: Tươi Mới Trong Trẻo (Sáng sạch + Đẩy màu tươi)
          else if (u_mode == 2) {
            col = col + vec3(0.025, 0.03, 0.04) * u_amt;
            col = (col - 0.5) * (1.0 + 0.11 * u_amt) + 0.5;
            col = adjustSat(col, 1.0 + 0.26 * u_amt);
          }
          // Mode 3: Da Hồng Hào Sáng Mịn (Tông ấm nhẹ, sáng da)
          else if (u_mode == 3) {
            vec3 lifted = pow(clamp(col, 0.0, 1.0), vec3(1.0 - 0.12 * u_amt));
            lifted += vec3(0.035, 0.012, 0.018) * u_amt;
            col = adjustSat(lifted, 1.0 + 0.14 * u_amt);
          }
          // Mode 4: Film Điện Ảnh (Ấm vùng sáng, sâu vùng tối)
          else if (u_mode == 4) {
            col = (col - 0.5) * (1.0 + 0.16 * u_amt) + 0.5;
            float lum = dot(col, vec3(0.299, 0.587, 0.114));
            vec3 tint = mix(vec3(-0.02, 0.01, 0.035), vec3(0.04, 0.02, -0.02), lum);
            col += tint * u_amt;
            col = adjustSat(col, 1.0 - 0.08 * u_amt);
          }
          // Mode 5: Nâu Ấm Sang Chảnh (Tone Cafe / Thời trang)
          else if (u_mode == 5) {
            col = (col - 0.5) * (1.0 + 0.14 * u_amt) + 0.5;
            col = adjustSat(col, 1.0 - 0.20 * u_amt);
            col += vec3(0.045, 0.02, -0.03) * u_amt;
          }

          gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }
      `;

      const compile = (type, src) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        return sh;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSrc));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSrc));
      gl.linkProgram(prog);
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 0, 0,
         1, -1, 1, 0,
        -1,  1, 0, 1,
         1,  1, 1, 1
      ]), gl.STATIC_DRAW);

      const aPos = gl.getAttribLocation(prog, 'a_pos');
      const aUv = gl.getAttribLocation(prog, 'a_uv');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      this._prog = prog;
      this._tex = tex;
      this._locs = {
        texel: gl.getUniformLocation(prog, 'u_texel'),
        mode: gl.getUniformLocation(prog, 'u_mode'),
        amt: gl.getUniformLocation(prog, 'u_amt')
      };
    }
    return true;
  },

  applyToCanvas: function (sourceCanvas, targetCtx, W, H, filterId, intensityPct) {
    const modeMap = { '4k-sharp': 1, 'fresh-clear': 2, 'rosy-skin': 3, 'film-cinematic': 4, 'warm-coffee': 5 };
    const modeNum = modeMap[filterId] || 0;
    const amt = Math.max(0, Math.min(1, (intensityPct || 70) / 100));

    if (!modeNum || amt <= 0.01 || !this._init(W, H)) {
      targetCtx.drawImage(sourceCanvas, 0, 0, W, H);
      return;
    }

    const gl = this._gl;
    gl.useProgram(this._prog);
    gl.bindTexture(gl.TEXTURE_2D, this._tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
    gl.uniform2f(this._locs.texel, 1 / W, 1 / H);
    gl.uniform1i(this._locs.mode, modeNum);
    gl.uniform1f(this._locs.amt, amt);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    targetCtx.drawImage(this._canvas, 0, 0, W, H);
  }
};