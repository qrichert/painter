if (!Number.prototype.mod) {
  Number.prototype.mod = function (n) {
    "use strict";
    return ((this % n) + n) % n;
  };
}

class _PixelContext {
  constructor(parent) {
    this._rect = parent.rect;
    this.ctx = parent.ctx;
    this.pixelSize = 1;
    this._buffer = undefined;
  }

  /**
   * Get number of screen pixels to use to represent one world pixel.
   *
   * @returns {Number}
   */
  get pixelSize() {
    return this._pixelSize;
  }

  /**
   * Set number of screen pixels to use to represent one world pixel.
   *
   * @param {Number} size
   */
  set pixelSize(size) {
    this._pixelSize = size * window.devicePixelRatio;
  }

  /**
   * Return number of world pixels on X axis.
   *
   * @returns {Number}
   */
  get width() {
    return this._buffer && Math.ceil(this._buffer.width / this.pixelSize);
  }

  /**
   * Return number of world pixels on Y axis.
   *
   * @returns {Number}
   */
  get height() {
    return this._buffer && Math.ceil(this._buffer.height / this.pixelSize);
  }

  /**
   * Return number of world pixels on X axis visible on screen.
   *
   * @returns {Number}
   */
  get true_width() {
    return this._buffer && this._buffer.width / this.pixelSize;
  }

  /**
   * Return number of world pixels on Y axis visible on screen.
   *
   * @returns {Number}
   */
  get true_height() {
    return this._buffer && this._buffer.height / this.pixelSize;
  }

  /**
   * Return current buffer (and refresh if first time).
   *
   * @returns {ImageData}
   */
  getBuffer() {
    if (this._buffer === undefined) this.refreshBuffer();
    return this._buffer;
  }

  /**
   * Update buffer with current screen state.
   */
  refreshBuffer() {
    const { w, h } = this._rect;
    const pxr = window.devicePixelRatio;
    this._buffer = this.ctx.getImageData(0, 0, w * pxr, h * pxr);
  }

  /**
   * Set buffer to draw to.
   *
   * @param {ImageData} buffer
   */
  setBuffer(buffer) {
    this._buffer = buffer;
  }

  /**
   * Draw buffer state on screen.
   */
  putBuffer() {
    this.ctx.putImageData(this._buffer, 0, 0);
  }

  /**
   * Deep copy a buffer.
   *
   * @param {ImageData} buffer
   * @returns {ImageData}
   */
  cloneBuffer(buffer) {
    return new ImageData(
      new Uint8ClampedArray(buffer.data),
      buffer.width,
      buffer.height
    );
  }

  /**
   * Return color components of single world pixel.
   *
   * @param {Number} x
   * @param {Number} y
   * @returns {Number[]}
   */
  getPixel(x, y) {
    const { data, width, height } = this._buffer;
    [x, y] = this.worldToScreen(x, y);
    if (x < 0 || x >= width || y < 0 || y >= height) return [0, 0, 0, 0];
    const i = (y * width + x) * 4;
    return [data[i + 0], data[i + 1], data[i + 2], data[i + 3]];
  }

  /**
   * Set color components of single world pixel.
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number[]} color
   */
  setPixel(x, y, color) {
    [x, y] = this.worldToScreen(x, y);
    for (let i = x; i < x + this.pixelSize; ++i) {
      for (let j = y; j < y + this.pixelSize; ++j) {
        this.#set_screen_pixel(i, j, color);
      }
    }
  }

  #set_screen_pixel(x, y, color) {
    const { data, width, height } = this._buffer;
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const i = (y * width + x) * 4;
    this.#set_screen_pixel_components(data, i, color);
  }

  #set_screen_pixel_components(array, index, color) {
    array[index + 0] = color[0];
    array[index + 1] = color[1];
    array[index + 2] = color[2];
    if (color.length > 3) {
      array[index + 3] = color[3];
    }
  }

  /**
   * Fill buffer with single color.
   *
   * @param {Number[]} color
   */
  fillBuffer(color) {
    const data = this._buffer.data;
    for (let i = 0; i < data.length; i += 4) {
      this.#set_screen_pixel_components(data, i, color);
    }
  }

  screenToWorld(x, y) {
    x = Math.floor((x / this._rect.w) * this.true_width);
    y = Math.floor((y / this._rect.h) * this.true_height);
    return [x, y];
  }

  worldToScreen(x, y) {
    x *= this.pixelSize;
    y *= this.pixelSize;
    return [x, y];
  }
}

class Painter {
  constructor() {
    this.html_root = document.getElementById("root");
    this.rect = {
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      xw: 0,
      yh: 0,
      ar: 0,
    };
    this.mouse = {
      x: 0,
      y: 0,
      is_pressed: false,
    };

    this.#set_up_canvas();
    this.#set_up_ctx_polyfills();
    this.#set_up_event_handlers();
  }

  #set_up_canvas() {
    const canvas = document.createElement("canvas");
    this.ctx = canvas.getContext("2d");

    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    this.html_root.appendChild(canvas);
  }

  #set_up_ctx_polyfills() {
    if (!this.ctx.clear) {
      this.ctx.clear = () => {
        this.#clear();
      };
    }
    if (!this.ctx.strokeLine) {
      this.ctx.strokeLine = (from_x, from_y, to_x, to_y) => {
        this.#stroke_line(from_x, from_y, to_x, to_y);
      };
    }
    if (!this.ctx.fillCircle) {
      this.ctx.fillCircle = (x, y, r) => {
        this.#fill_circle(x, y, r);
      };
    }
    if (!this.ctx.strokeCircle) {
      this.ctx.strokeCircle = (x, y, r) => {
        this.#stroke_circle(x, y, r);
      };
    }
    this.pxctx = new _PixelContext(this);
  }

  #clear() {
    const { x, y, w, h } = this.rect;
    this.ctx.clearRect(x, y, w, h);
  }

  #stroke_line(from_x, from_y, to_x, to_y) {
    [from_x, from_y, to_x, to_y] = this.#correct_line_stroke_bleed(
      from_x,
      from_y,
      to_x,
      to_y
    );

    this.ctx.beginPath();
    this.ctx.moveTo(from_x, from_y);
    this.ctx.lineTo(to_x, to_y);
    this.ctx.stroke();
  }

  /**
   * Correct stroke bleed on lines with odd pixel width.
   *
   * The drawing reference is the midpoint of the line. So if the line's
   * width is odd, say 1px, and is drawn at x=100px, the theoretical
   * line should be drawn from x=99.5px to x=100.5px. This is obviously
   * not possible, and in reality the line will be drawn from x=99px to
   * x=101px, making for a line width of 2px.
   *
   * To correct this unwanted effect, and if the line width is odd, we
   * move the reference by half a pixel. So, building on the previous
   * example, the new theoretical line should be drawn at x=(100+0.5)px,
   * or x=100.5px. Now, the real line will be drawn from x=100px to
   * x=101px, making for a line width of 1px, as expected.
   */
  #correct_line_stroke_bleed(from_x, from_y, to_x, to_y) {
    const is_line_vertical = from_x === to_x;
    const is_line_horizontal = from_y === to_y;
    const correction = this.#compute_line_position_correction();
    if (is_line_vertical) {
      from_x += correction;
      to_x += correction;
    } else if (is_line_horizontal) {
      from_y += correction;
      to_y += correction;
    }
    return [from_x, from_y, to_x, to_y];
  }

  #compute_line_position_correction() {
    const is_low_res_device = window.devicePixelRatio < 2;
    const is_line_width_odd = this.ctx.lineWidth % 2 !== 0;
    return is_low_res_device && is_line_width_odd ? 0.5 : 0;
  }

  #fill_circle(x, y, r) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  #stroke_circle(x, y, r) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  #set_up_event_handlers() {
    document.addEventListener("DOMContentLoaded", (e) => {
      this.#root_resize_event();
    });
    window.addEventListener("resize", (e) => {
      this.#root_resize_event();
    });
    this.ctx.canvas.addEventListener("mousedown", () => {
      this.mouse.is_pressed = true;
    });
    this.ctx.canvas.addEventListener("mousemove", (e) => {
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;
    });
    window.addEventListener("mouseup", () => {
      this.mouse.is_pressed = false;
    });
  }

  #root_resize_event() {
    const scale_factor = window.devicePixelRatio || 1;

    this.rect.w = this.html_root.offsetWidth;
    this.rect.h = this.html_root.offsetHeight;
    this.rect.xw = this.rect.x + this.rect.w;
    this.rect.yh = this.rect.y + this.rect.h;
    this.rect.cx = this.rect.x + this.rect.w / 2;
    this.rect.cy = this.rect.y + this.rect.h / 2;
    this.rect.ar = this.rect.w / this.rect.h;

    const scaled_width = Math.floor(this.rect.w * scale_factor);
    const scaled_height = Math.floor(this.rect.h * scale_factor);

    this.ctx.canvas.width = scaled_width;
    this.ctx.canvas.height = scaled_height;

    this.ctx.scale(scale_factor, scale_factor);

    this.pxctx.refreshBuffer();
  }

  exec() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.#exec();
      });
    } else {
      this.#exec();
    }
  }

  #exec() {
    this.setup();

    let previous_now = performance.now();

    const render_loop = () => {
      const now = performance.now();
      const delta_time = (now - previous_now) / 1000; // In seconds.
      previous_now = now;

      this.render(delta_time);

      window.requestAnimationFrame(render_loop);
    };

    render_loop();
  }

  setup() {} // Override.

  render(delta_time) {} // Override.

  text_width(text) {
    return this.ctx.measureText(text).width;
  }
}
