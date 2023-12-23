// https://github.com/Rezmason/matrix
// https://rezmason.github.io/matrix/?skipIntro=false
// https://buf.com/films/the-matrix-resurrections/

const COLOR = "#2dc56b";
const COLOR_BRIGHT = "#a3e09e";
const COLOR_LESS_BRIGHT = "#90dc90";
const COLOR_LESS_LESS_BRIGHT = "#77dd77";

const FONT_SIZE = 30;
const MATRIX_CHARS =
  "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

class Stream {
  constructor(parent, x, char_width) {
    this.parent = parent;
    this.ctx = parent.ctx;
    this.rect = new Rect(x, parent.rect.y, char_width, parent.rect.h);
    this.x = x + char_width / 2;

    this.stream_length = this.#get_how_many_chars_fit_in_the_screen();

    this.#init_stream(true);
  }

  get window_end() {
    return this.window_start + this.window_length;
  }

  #get_how_many_chars_fit_in_the_screen() {
    return Math.ceil(this.rect.h / FONT_SIZE);
  }

  #init_stream(is_initial = false) {
    this.stream = this.#random_chars_to_fill_stream();
    this.window_length = this.parent.is_debug
      ? 12
      : Math.ceil(Math.random() * 50 + 25);
    this.window_start = -this.window_length - 1;
    this.speed = is_initial ? 1 : this.#get_random_speed();
  }

  /**
   * Generate a full stream of chars.
   */
  #random_chars_to_fill_stream() {
    const chars_pool = this.parent.is_debug
      ? [..."0123456789"]
      : [...MATRIX_CHARS].shuffle();
    const chars = [];
    while (chars.length < this.stream_length) {
      const nb_missing_chars = this.stream_length - chars.length;
      chars.push(
        ...chars_pool.slice(0, Math.min(nb_missing_chars, chars_pool.length)),
      );
    }
    if (chars.length !== this.stream_length) {
      throw "AssertionError: this.chars.length !== this.stream_length";
    }
    return chars;
  }

  #get_random_speed() {
    const speed_pool = [
      ...Array(85).fill(1),
      ...Array(10).fill(2),
      ...Array(5).fill(3),
    ];
    return speed_pool[Math.floor(Math.random() * speed_pool.length)];
  }
  update() {
    if (this.#has_stream_ended()) {
      this.#init_stream();
    }

    this.window_start += this.speed;

    const index_of_glitch = this.#random_char_change_glitch();

    const [slice_start, slice_end] = this.#compute_chars_window();

    this.#debug_draw_blank_chars();

    for (let i = slice_start; i < slice_end; ++i) {
      this.ctx.fillStyle = COLOR;
      if (this.#is_first_char(i)) this.ctx.fillStyle = COLOR_BRIGHT;
      else if (this.#is_second_char(i)) this.ctx.fillStyle = COLOR_LESS_BRIGHT;
      else if (this.#is_third_char(i))
        this.ctx.fillStyle = COLOR_LESS_LESS_BRIGHT;

      this.#debug_color_special_chars(i);

      if (i === index_of_glitch) {
        this.ctx.fillStyle = this.parent.is_debug
          ? "red"
          : COLOR_LESS_LESS_BRIGHT;
      }

      this.ctx.save();
      this.ctx.globalAlpha = this.#get_fade_opacity(i);

      // "i * FONT_SIZE" works because stream = view height, no more,
      // no less. It is separate from the concept of "window" that
      // can be bigger than the view height.
      this.ctx.fillText(this.stream[i], this.x, i * FONT_SIZE);
      this.ctx.restore();
    }

    this.#debug_draw_extra_markers();
  }

  #has_stream_ended() {
    return this.window_start + 1 >= this.stream_length;
  }

  #random_char_change_glitch() {
    if (Math.random() <= 0.97) return -1;

    const i = Math.floor(Math.random() * (this.window_end - 3));
    this.stream[i] = this.#get_random_char();
    return i;
  }

  #get_random_char() {
    return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
  }

  /**
   * Return the window of chars to render.
   *
   * For a window length of 3:
   *
   * - When chars appear:
   *
   *     window [ a, b ]
   *     stream [ a, b, c, d, e, f, g ]
   *              ↑                 ↑
   *              0           stream_length
   *
   * - As the stream falls down:
   *
   *     window       [ c, d, e ]
   *     stream [ a, b, c, d, e, f, g ]
   *              ↑                 ↑
   *              0           stream_length
   *
   * - As it disappears:
   *
   *     window                [ f, g ]
   *     stream [ a, b, c, d, e, f, g ]
   *              ↑                 ↑
   *              0           stream_length
   */
  #compute_chars_window() {
    const start = Math.max(this.window_start, 0);
    const end = Math.min(this.window_end, this.stream_length);

    return [start, end];
  }

  #is_first_char(i) {
    return i === this.window_end - 1;
  }

  #is_second_char(i) {
    return i === this.window_end - 2;
  }

  #is_third_char(i) {
    return i === this.window_end - 3;
  }

  #get_fade_opacity(i) {
    return (i - this.window_start) / this.window_length;
  }

  #debug_draw_blank_chars() {
    if (!this.parent.is_debug) return;

    this.ctx.fillStyle = "lightgrey";
    for (let i = 0; i < this.window_start; ++i) {
      this.ctx.fillText("•", this.x, i * FONT_SIZE + 3);
    }
  }

  #debug_color_special_chars(i) {
    if (!this.parent.is_debug) return;

    if (this.#is_first_char(i)) this.ctx.fillStyle = "red";
    else if (this.#is_second_char(i)) this.ctx.fillStyle = "yellow";
    if (i === 0) this.ctx.fillStyle = "blue";
  }

  #debug_draw_extra_markers() {
    if (!this.parent.is_debug) return;

    this.ctx.save();

    this.ctx.strokeStyle = "magenta";
    this.ctx.fillStyle = "magenta";
    this.ctx.font = "normal 10px monospace";
    this.ctx.textAlign = "left";

    for (let i = 1; i < this.stream_length; ++i) {
      // Line separators.
      this.ctx.strokeLine(
        this.rect.x,
        i * FONT_SIZE,
        this.rect.xw,
        i * FONT_SIZE,
      );

      // Char indices.
      this.ctx.fillText(
        i === 1 ? `${i}/${this.stream_length}` : `${i}`,
        this.rect.x + 2,
        (i - 1) * FONT_SIZE + 2,
      );
    }

    this.ctx.restore();
  }
}

class Matrix extends Painter {
  setup() {
    this.pxctx.pixelSize = 1;

    this.is_paused = false;
    this.is_debug = false;

    // Only has effect in pixel mode.
    this.is_opacity_effect_active = true;

    this.#init_scene();
  }

  #init_scene() {
    this.ctx.font = `bold ${FONT_SIZE}px monospace`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";
    // For pixelated opacity effect.
    this.ctx.canvas.style.backgroundColor = "black";

    this.char_width = this.ctx.textWidth("ア");

    this.fix_delta_time = this.is_debug ? 0.7 : 0.09;
    this.accumulated_time = this.fix_delta_time; // Render immediately.

    this.streams = [];
    const nb_streams = Math.ceil(this.rect.w / this.char_width);
    for (let i = 0; i < nb_streams; ++i) {
      this.streams.push(new Stream(this, i * this.char_width, this.char_width));
    }
  }

  resize_event() {
    this.#init_scene();
  }

  key_press_event(key) {
    if (key === " ") this.is_paused = !this.is_paused;
    if (key === "1") this.pxctx.pixelSize = 1;
    if (key === "4") this.pxctx.pixelSize = 4;
    if (key === "8") this.pxctx.pixelSize = 8;
    if (key === "o")
      this.is_opacity_effect_active = !this.is_opacity_effect_active;

    if (key === "d") {
      this.is_debug = !this.is_debug;
      this.#init_scene();
    }
  }

  render(delta_time) {
    if (this.is_paused) return;
    if (!this.#can_render_this_frame(delta_time)) return;

    this.#clear_screen();

    this.#advance_stream();

    this.#pixels_effect();
  }

  #can_render_this_frame(delta_time) {
    this.accumulated_time += delta_time;
    if (this.accumulated_time < this.fix_delta_time) {
      return false;
    }
    this.accumulated_time %= this.fix_delta_time;
    return true;
  }

  #clear_screen() {
    this.ctx.fillStyle = "black";
    this.ctx.fillScreen();
  }

  #advance_stream() {
    this.streams.map((stream, i) => {
      if (this.is_debug) {
        const { x, y, w, h } = stream.rect;
        const hue = (i / this.streams.length) * 5 * 360;
        this.ctx.fillStyle = `hsl(${hue}deg 25% 20%)`;
        this.ctx.fillRect(x, y, w, h);
      }
      stream.update();
    });
  }

  #pixels_effect() {
    if (this.pxctx.pixelSize / this.rect.dpr === 1) return;
    this.pxctx.refreshBuffer();
    const { width, height } = this.pxctx;
    for (let x = 0; x < width; ++x) {
      for (let y = 0; y < height; ++y) {
        const px = this.pxctx.getPixel(x, y);
        if (this.is_opacity_effect_active) {
          px[3] = Math.random() * 255;
        }
        this.pxctx.setPixel(x, y, px);
      }
    }
    this.pxctx.putBuffer();
  }
}

function main() {
  return new Matrix().exec();
}

main();
