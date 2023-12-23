if (!Number.prototype.mod) {
  // Modulo.
  Number.prototype.mod = function (n) {
    "use strict";
    return ((this % n) + n) % n;
  };
}

if (!Math.PHI) {
  // Golden ratio.
  Math.PHI = (1 + Math.sqrt(5)) / 2;
}

if (!Array.prototype.shuffle) {
  Array.prototype.shuffle = function () {
    return this.sort(() => Math.random() - 0.5);
  };
}

/**
 * @startuml
 * class Rect {
 *   + x : Number
 *   + y : Number
 *   + w : Number
 *   + h : Number
 *   + xw : Number
 *   + yh : Number
 *   + cx : Number
 *   + cy : Number
 *   + ar : Number
 *   + dpr : Number
 *   + equals(other_rect) : Boolean
 *   + contains_point(x, y, offset?) : Boolean
 * }
 * @enduml
 */
class Rect {
  constructor(x = 0, y = 0, w = 0, h = 0) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get x() {
    return this._x;
  }

  set x(x) {
    this._x = x;
    this.#update_values();
  }

  get y() {
    return this._y;
  }

  set y(y) {
    this._y = y;
    this.#update_values();
  }

  get w() {
    return this._w;
  }

  set w(w) {
    this._w = w;
    this.#update_values();
  }

  get h() {
    return this._h;
  }

  set h(h) {
    this._h = h;
    this.#update_values();
  }

  get xw() {
    return this._xw;
  }

  get yh() {
    return this._yh;
  }

  get cx() {
    return this._cx;
  }

  get cy() {
    return this._cy;
  }

  get ar() {
    return this._ar;
  }

  get dpr() {
    return window.devicePixelRatio || 1;
  }

  #update_values() {
    this._xw = this._x + this._w;
    this._yh = this._y + this._h;
    this._cx = this._x + this._w / 2;
    this._cy = this._y + this._h / 2;
    this._ar = this._w / this._h;
  }

  equals(other_rect) {
    return (
      this.x === other_rect.x &&
      this.y === other_rect.y &&
      this.w === other_rect.w &&
      this.h === other_rect.h
    );
  }

  contains_point(x, y, offset = 0) {
    return this.#contains_x(x, offset) && this.#contains_y(y, offset);
  }

  #contains_x(x, offset = 0) {
    const left = this.x;
    const right = this.xw;
    return x - offset >= left && x + offset <= right;
  }

  #contains_y(y, offset = 0) {
    const top = this.y;
    const bottom = this.yh;
    return y - offset >= top && y + offset <= bottom;
  }
}

/**
 * @startuml
 * class _Mouse {
 *   + x : Number
 *   + y : Number
 *   + is_pressed : Boolean
 *   + is_dragging : Boolean
 * }
 * @enduml
 */
class _Mouse {
  /**
   * @param {HTMLElement} parent
   */
  constructor(parent) {
    if (_Mouse._instance) {
      return _Mouse._instance;
    }
    _Mouse._instance = this;

    this.parent = parent;

    this._x = -1;
    this._y = -1;
    this._is_pressed = false;
    this._is_dragging = false;

    this.#set_up_event_handlers();
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  get is_pressed() {
    return this._is_pressed;
  }

  get is_dragging() {
    return this._is_dragging;
  }

  #set_up_event_handlers() {
    this.parent.addEventListener("mousedown", () => {
      this.#mouse_down_event_handler();
    });
    window.addEventListener("mouseup", () => {
      this.#mouse_up_event_handler();
    });
    window.addEventListener("mousemove", (e) => {
      this.#mouse_move_event_handler(e.offsetX, e.offsetY);
    });
  }

  #mouse_down_event_handler() {
    this._is_pressed = true;
    this._is_dragging = false;
  }

  #mouse_up_event_handler() {
    this._is_pressed = false;
    this._is_dragging = false;
  }

  #mouse_move_event_handler(x, y) {
    this._is_dragging = this._is_pressed;
    this._x = x;
    this._y = y;
  }
}

/**
 * @startuml
 * class _Keyboard {
 *   + keys_pressed : String[]
 *   + is_key_pressed(key) : Boolean
 * }
 * @enduml
 */
class _Keyboard {
  /**
   * @param {HTMLElement} parent
   */
  constructor(parent) {
    if (_Keyboard._instance) {
      return _Keyboard._instance;
    }
    _Keyboard._instance = this;

    this.parent = parent;
    this.keys_pressed = [];

    this.#set_up_event_handlers();
  }

  is_key_pressed(key) {
    key = this.#convert_special_key_to_standard_key(key);
    return this.keys_pressed.indexOf(key) > -1;
  }

  #convert_special_key_to_standard_key(key) {
    switch (key) {
      case "Cmd":
      case "Ctrl":
      case "Meta":
        return "Control";
      default:
        return key;
    }
  }

  #set_up_event_handlers() {
    window.addEventListener("keydown", (e) => {
      this.#key_down_event_handler(e.key);
    });
    window.addEventListener("keyup", (e) => {
      this.#key_up_event_handler(e.key);
    });
    window.addEventListener("blur", () => {
      this.#blur_event_handler();
    });
  }

  #key_down_event_handler(key) {
    key = this.#convert_special_key_to_standard_key(key);
    if (this.keys_pressed.indexOf(key) > -1) {
      return;
    }
    this.keys_pressed.push(key);
    this.parent.dispatchEvent(
      new CustomEvent("_keypress", { detail: { key } }),
    );
  }

  #key_up_event_handler(key) {
    key = this.#convert_special_key_to_standard_key(key);
    this.keys_pressed = this.keys_pressed.filter((x) => x !== key);
    this.parent.dispatchEvent(
      new CustomEvent("_keyrelease", { detail: { key } }),
    );
  }

  #blur_event_handler() {
    for (const key of [...this.keys_pressed]) {
      this.#key_up_event_handler(key);
    }
    this.keys_pressed = [];
  }
}

/**
 * @startuml
 * class _PixelContext {
 *   + parent : Painter
 *   + ctx : CanvasContext
 *   + pixelSize : Number
 *   + width : Number
 *   + height : Number
 *   + trueWidth : Number
 *   + trueHeight : Number
 *   + setContext(ctx) : void
 *   + getBuffer() : ImageData
 *   + refreshBuffer() : void
 *   + setBuffer(buffer) : void
 *   + putBuffer() : void
 *   + cloneBuffer(buffer) : ImageData
 *   + getPixel(x, y) : Number[]
 *   + setPixel(x, y, color) : void
 *   + fillBuffer(color) : void
 *   + screenToWorld(x, y) : Number[]
 *   + worldToScreen(x, y) : Number[]
 * }
 * @enduml
 */
class _PixelContext {
  /**
   * @param {Painter} parent
   */
  constructor(parent) {
    if (_PixelContext._instance) {
      return _PixelContext._instance;
    }
    _PixelContext._instance = this;

    this.parent = parent;
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
    this._pixelSize = size * this.parent.rect.dpr;
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
  get trueWidth() {
    return this._buffer && this._buffer.width / this.pixelSize;
  }

  /**
   * Return number of world pixels on Y axis visible on screen.
   *
   * @returns {Number}
   */
  get trueHeight() {
    return this._buffer && this._buffer.height / this.pixelSize;
  }

  /**
   * Set context to use.
   *
   * Works well with `Painter::create_ctx()`.
   *
   * This is the exact same as doing `this.pxctx.ctx = ctx`, but it
   * makes it clear this is a possibility.
   *
   * @param {CanvasRenderingContext2D} ctx
   */
  setContext(ctx) {
    this.ctx = ctx;
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
    const { w, h, dpr } = this.parent.rect;
    this._buffer = this.ctx.getImageData(0, 0, w * dpr, h * dpr);
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
      buffer.height,
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
    const { w, h } = this.parent.rect;
    x = Math.floor((x / w) * this.trueWidth);
    y = Math.floor((y / h) * this.trueHeight);
    return [x, y];
  }

  worldToScreen(x, y) {
    x *= this.pixelSize;
    y *= this.pixelSize;
    return [x, y];
  }
}

/**
 * enum ScrollDirection {
 *   + Undefined
 *   + Horizontal
 *   + Vertical
 * }
 */
const ScrollDirection = {
  Undefined: "Undefined",
  Horizontal: "Horizontal",
  Vertical: "Vertical",
};

/**
 * @startuml
 * class Painter {
 *   + html_root : HTMLDivElement
 *   + rect : Rect
 *   + mouse : _Mouse
 *   + keyboard : _Keyboard
 *   + ctx : CanvasRenderingContext2D
 *   + pxctx : _PixelContext
 *   + ctx.clear() : void
 *   + ctx.fillScreen() : void
 *   + ctx.strokeLine(from_x, from_y, to_x, to_y) : void
 *   + ctx.strokeCircle(x, y, r) : void
 *   + ctx.fillCircle(x, y, r) : void
 *   + ctx.strokeTriangle(x1, y1, x2, y2, x3, y3) : void
 *   + ctx.fillTriangle(x1, y1, x2, y2, x3, y3) : void
 *   + ctx.textWidth(text) : Number
 *   + resize_event() : void
 *   + mouse_press_event(x, y) : void
 *   + mouse_release_event(x, y) : void
 *   + mouse_click_event(x, y) : void
 *   + mouse_double_click_event(x, y) : void
 *   + mouse_move_event(x, y, dx, dy) : void
 *   + mouse_drag_event(dx, dy) : void
 *   + wheel_event(x, y, dx, dy) : void
 *   + horizontal_wheel_event(dx) : void
 *   + vertical_wheel_event(dy) : void
 *   + key_press_event(key) : void
 *   + key_release_event(key) : void
 *   + paste_event(data) : void
 *   + paste_text_event(text) : void
 *   + create_ctx(width, height): CanvasRenderingContext2D
 *   + exec() : void
 *   + setup() : void {abstract}
 *   + render(delta_time) : void {abstract}
 * }
 * @enduml
 */
class Painter {
  constructor() {
    this.html_root = document.getElementById("root");
    this.rect = new Rect();
    this.mouse = new _Mouse(this.html_root);
    this.keyboard = new _Keyboard(this.html_root);

    this._has_setup_been_called = false;

    this.#set_up_canvas();
    this.#set_up_ctx_polyfills(this.ctx);
    this.#set_up_pixel_ctx();
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

  #set_up_ctx_polyfills(ctx) {
    if (!ctx.clear) {
      ctx.clear = () => {
        this.#clear(ctx);
      };
    }
    if (!ctx.fillScreen) {
      ctx.fillScreen = () => {
        this.#fill_screen(ctx);
      };
    }
    if (!ctx.strokeLine) {
      ctx.strokeLine = (from_x, from_y, to_x, to_y) => {
        this.#stroke_line(ctx, from_x, from_y, to_x, to_y);
      };
    }
    if (!ctx.strokeCircle) {
      ctx.strokeCircle = (x, y, r) => {
        this.#stroke_circle(ctx, x, y, r);
      };
    }
    if (!ctx.fillCircle) {
      ctx.fillCircle = (x, y, r) => {
        this.#fill_circle(ctx, x, y, r);
      };
    }
    if (!this.ctx.strokeTriangle) {
      this.ctx.strokeTriangle = (x1, y1, x2, y2, x3, y3) => {
        this.#stroke_triangle(x1, y1, x2, y2, x3, y3);
      };
    }
    if (!this.ctx.fillTriangle) {
      this.ctx.fillTriangle = (x1, y1, x2, y2, x3, y3) => {
        this.#fill_triangle(x1, y1, x2, y2, x3, y3);
      };
    }
    if (!ctx.textWidth) {
      ctx.textWidth = (text) => this.#text_width(ctx, text);
    }
  }

  #set_up_pixel_ctx() {
    this.pxctx = new _PixelContext(this);
  }

  #clear(ctx) {
    const { x, y, w, h } = this.rect;
    ctx.clearRect(x, y, w, h);
  }

  #fill_screen(ctx) {
    const { x, y, w, h } = this.rect;
    ctx.fillRect(x, y, w, h);
  }

  #stroke_line(ctx, from_x, from_y, to_x, to_y) {
    [from_x, from_y, to_x, to_y] = this.#correct_line_stroke_bleed(
      ctx,
      from_x,
      from_y,
      to_x,
      to_y,
    );

    ctx.beginPath();
    ctx.moveTo(from_x, from_y);
    ctx.lineTo(to_x, to_y);
    ctx.stroke();
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
  #correct_line_stroke_bleed(ctx, from_x, from_y, to_x, to_y) {
    const is_line_vertical = from_x === to_x;
    const is_line_horizontal = from_y === to_y;
    const correction = this.#compute_line_position_correction(ctx);
    if (is_line_vertical) {
      from_x += correction;
      to_x += correction;
    } else if (is_line_horizontal) {
      from_y += correction;
      to_y += correction;
    }
    return [from_x, from_y, to_x, to_y];
  }

  #compute_line_position_correction(ctx) {
    const is_low_res_device = this.rect.dpr < 2;
    const is_line_width_odd = ctx.lineWidth % 2 !== 0;
    return is_low_res_device && is_line_width_odd ? 0.5 : 0;
  }

  #stroke_circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.stroke();
  }

  #fill_circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
  }

  #text_width(ctx, text) {
    return ctx.measureText(text).width;
  }

  #stroke_triangle(x1, y1, x2, y2, x3, y3) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineTo(x3, y3);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  #fill_triangle(x1, y1, x2, y2, x3, y3) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineTo(x3, y3);
    this.ctx.closePath();
    this.ctx.fill();
  }

  #set_up_event_handlers() {
    document.addEventListener("DOMContentLoaded", () => {
      this.#root_resize_event();
    });
    window.addEventListener("resize", () => {
      this.#root_resize_event();
    });
    this.html_root.addEventListener("mousedown", (e) => {
      this.mouse_press_event(e.offsetX, e.offsetY);
    });
    // "window" to catch release events from everywhere.
    window.addEventListener("mouseup", (e) => {
      this.mouse_release_event(e.offsetX, e.offsetY);
    });
    this.html_root.addEventListener("click", (e) => {
      this.mouse_click_event(e.offsetX, e.offsetY);
    });
    this.html_root.addEventListener("dblclick", (e) => {
      this.mouse_double_click_event(e.offsetX, e.offsetY);
    });
    window.addEventListener("mousemove", (e) => {
      this.#mouse_move_event_handler(
        e.offsetX,
        e.offsetY,
        e.movementX,
        e.movementY,
      );
    });
    this.html_root.addEventListener(
      "wheel",
      (e) => {
        this.#wheel_event_handler(e.offsetX, e.offsetY, e.deltaX, e.deltaY);
      },
      { passive: true },
    );
    this.html_root.addEventListener("_keypress", (e) => {
      this.key_press_event(e.detail?.key || "");
    });
    this.html_root.addEventListener("_keyrelease", (e) => {
      this.key_release_event(e.detail?.key || "");
    });
    window.addEventListener("paste", (e) => {
      this.#paste_event_handler(e);
    });
  }

  #root_resize_event() {
    const scale_factor = this.rect.dpr;

    this.rect.w = this.html_root.offsetWidth;
    this.rect.h = this.html_root.offsetHeight;

    const scaled_width = Math.floor(this.rect.w * scale_factor);
    const scaled_height = Math.floor(this.rect.h * scale_factor);

    this.ctx.canvas.width = scaled_width;
    this.ctx.canvas.height = scaled_height;

    this.ctx.scale(scale_factor, scale_factor);

    this.pxctx.refreshBuffer();

    // Properties declared in setup() are not accessible before setup()
    // is called. Firing resize_event() thus cannot be triggered unless
    // the instance is fully initialized.
    if (this._has_setup_been_called) {
      this.resize_event();
    }
  }

  resize_event() {}

  mouse_press_event(x, y) {}

  mouse_release_event(x, y) {}

  mouse_click_event(x, y) {}

  mouse_double_click_event(x, y) {}

  #mouse_move_event_handler(x, y, dx, dy) {
    if (this.mouse.is_dragging) {
      this.mouse_drag_event(x, y, dx, dy);
    }
    this.mouse_move_event(x, y, dx, dy);
  }

  mouse_move_event(x, y, dx, dy) {}

  mouse_drag_event(dx, dy) {}

  #wheel_event_handler(x, y, dx, dy) {
    this.wheel_event(x, y, dx, dy);
    const scroll_direction = this.#determine_scroll_direction(dx, dy);
    switch (scroll_direction) {
      case ScrollDirection.Horizontal:
        this.horizontal_wheel_event(dx);
        break;
      case ScrollDirection.Vertical:
        this.vertical_wheel_event(dy);
        break;
    }
  }

  /**
   * Return direction of scroll with most magnitude.
   */
  #determine_scroll_direction(dx, dy) {
    dx = Math.abs(dx);
    dy = Math.abs(dy);
    if (dx > dy) return ScrollDirection.Horizontal;
    if (dy > dx) return ScrollDirection.Vertical;
    return ScrollDirection.Undefined;
  }

  wheel_event(x, y, dx, dy) {}

  horizontal_wheel_event(dx) {}

  vertical_wheel_event(dy) {}

  key_press_event(key) {}

  key_release_event(key) {}

  #paste_event_handler(e) {
    e.preventDefault();
    const data = e.clipboardData || window.clipboardData;
    this.paste_event(data);
    this.paste_text_event(data.getData("text"));
  }

  paste_event(data) {}

  paste_text_event(text) {}

  create_ctx(width = null, height = null) {
    width = width || this.rect.w;
    height = height || this.rect.h;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const scale_factor = this.rect.dpr;

    const scaled_width = Math.floor(width * scale_factor);
    const scaled_height = Math.floor(height * scale_factor);

    canvas.width = scaled_width;
    canvas.height = scaled_height;

    ctx.scale(scale_factor, scale_factor);

    this.#set_up_ctx_polyfills(ctx);

    return ctx;
  }

  /**
   * Start the engine.
   *
   * This should be called as `MyPainterOverride().exec()` to start the
   * animation.
   *
   * In the background, it will call the `setup()` method once, and then
   * the `render()` method in a loop forever.
   */
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
    this._has_setup_been_called = true;

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
}
