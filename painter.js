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
