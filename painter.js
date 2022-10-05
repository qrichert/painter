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
