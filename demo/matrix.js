// https://github.com/Rezmason/matrix
// https://buf.com/films/the-matrix-resurrections/

// TODO: vary speed of droplets
//  droplets can never overlap, to calculate speed accordingly
//  distortion effect

let COLOR = "#03ca37";
const FONT_SIZE = 18;

class Droplet {
  constructor(parent, x, offset, length) {
    this.ctx = parent.ctx;
    this.rect = parent.rect;
    this.x = x;
    // this.chars = shuffle("ABC123()@!").split("");
    this.chars_pool = [
      ..."アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ].shuffle();

    this.chars = this.#get_chars(length);

    this.offset = offset;
  }

  #get_chars(length) {
    if (false) {
      return [..."🌑🌒🌓🌔🌕🌖🌗🌘"];
    }
    return this.chars_pool.slice(0, Math.min(length, this.chars_pool.length));
  }

  /**
   *    —
   *  0 ▲ A <- from = (offset - nb_chars) + 1 = 0
   *  1 │ B
   *  2 │ C
   *  3 │ D <- to = offset = 3
   *  4 │
   *  5 │      B <- chars[offset % nb chars] = chars[1]
   *  6 │      C
   *  7 │      D
   *  8 │      A <- chars[offset % nb chars] = chars[0]
   *  9 ▼
   *    —
   */
  update() {
    const from = this.offset - this.chars.length + 1;
    const to = this.offset;
    if (from * FONT_SIZE > this.rect.yh) {
      // TODO: do this from stream, garbage collect droplet
      this.offset = 0;
      this.chars = this.#get_chars(Math.random() * 20 + 5);
      return;
    }
    for (let i = from; i <= to; ++i) {
      const y = i * FONT_SIZE;
      if (y < this.rect.y || y > this.rect.yh) continue;

      this.ctx.fillStyle = COLOR;
      if (i === to) this.ctx.fillStyle = "white";
      else if (i === to - 1) this.ctx.fillStyle = "lightgrey";
      else if (i === to - 2) this.ctx.fillStyle = "grey";

      this.ctx.fillText(this.chars[i % this.chars.length], this.x, y);
    }

    if (Math.random() > 0.9) {
      const randi = Math.floor(Math.random() * this.chars.length - 1) + 1;
      // this.chars[randi] = "🍆";
      this.chars[randi] = this.#get_random_char();
    }
    ++this.offset;
  }

  #get_random_char() {
    return this.chars_pool[Math.floor(Math.random() * this.chars_pool.length)];
  }
}

class Stream {
  constructor(parent, x) {
    this.ctx = parent.ctx;
    this.rect = parent.rect;
    this.x = x;
    this.droplets = [
      new Droplet(
        this,
        this.x,
        -Math.floor(Math.random() * 30 + 1), // TODO: offset depends on min/max(average?) length
        Math.floor(Math.random() * 20 + 5) // TODO: length depends on fontsize/rect.h
      ),
    ];
  }

  update() {
    this.droplets.map((droplet) => droplet.update());
  }
}

class Matrix extends Painter {
  setup() {
    this.pxctx.pixelSize = 1;
    this.ctx.font = `bold ${FONT_SIZE}px monospace`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";

    this.char_width = this.ctx.textWidth("ア");

    this.fix_delta_time = 0.1;
    this.accumulated_time = this.fix_delta_time; // Render immediately.

    this.ctx.canvas.style.backgroundColor = "black";
    this.ctx.canvas.style.cursor = "none";

    this.is_paused = false;

    this.#set_up_scene();
  }

  #set_up_scene() {
    this.streams = [];
    const nb_streams = this.rect.w / this.char_width;
    const offset =
      this.char_width / 2 -
      ((Math.ceil(nb_streams) * this.char_width) % this.rect.w) / 2;
    // + this.char_width / 2 because text is center, so offset half width
    for (let i = 0; i < nb_streams; ++i) {
      this.streams.push(new Stream(this, i * this.char_width + offset));
    }
  }

  resize_event() {
    this.#set_up_scene();
  }

  key_press_event(key) {
    if (key === " ") this.is_paused = !this.is_paused;
    if (key === "p") COLOR = "#4f3d63";
    if (key === "4") this.pxctx.pixelSize = 4;
    if (key === "8") this.pxctx.pixelSize = 8;
  }

  render(delta_time) {
    if (this.is_paused) return;
    if (!this.#can_render_this_frame(delta_time)) return;

    this.#fill_background();

    this.streams.map((stream) => stream.update());

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

  #fill_background() {
    const { x, y, w, h } = this.rect;
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(x, y, w, h);
  }

  #pixels_effect() {
    if (this.pxctx.pixelSize / window.devicePixelRatio === 1) return;
    this.pxctx.refreshBuffer();
    const { width, height } = this.pxctx;
    for (let x = 0; x < width; ++x) {
      for (let y = 0; y < height; ++y) {
        const px = this.pxctx.getPixel(x, y);
        px[3] = Math.random() * 255;
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
