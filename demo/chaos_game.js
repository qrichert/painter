const RatioValue = {
  Divisor: "Divisor",
  GoldenRatio: "GoldenRatio",
};

class ChaosGame extends Painter {
  setup() {
    this.n_sides = 3;
    this.ratio_divisor = 2;
    this.ratio = 1 / this.ratio_divisor;
    this.ratio_value = RatioValue.Divisor;
    this.point_radius = 0.5 / window.devicePixelRatio;
    this.speed = 0;
    this.was_reinitialized = false;
    this.current_point = null;
    this.last_vertex = null;
    this.never_same_vertex_twice = false;
    this.font_size = 12;
    this.ctx.canvas.style.backgroundColor = "black";
    this.#init_ngon();
    this.#set_up_event_handlers();
  }

  get scale() {
    return 0.45 * this.rect.h;
  }

  #set_up_event_handlers() {
    window.addEventListener("resize", () => {
      this.was_reinitialized = true;
    });
    window.addEventListener("keyup", (e) => {
      switch (e.key.toUpperCase()) {
        case " ":
          this.was_reinitialized = true;
          break;
        case "+":
          this.ratio_value = RatioValue.Divisor;
          ++this.ratio_divisor;
          this.#update_ratio();
          break;
        case "-":
          this.ratio_value = RatioValue.Divisor;
          this.ratio_divisor = Math.max(this.ratio_divisor - 1, 2);
          this.#update_ratio();
          break;
        case "G":
          this.ratio_value = RatioValue.GoldenRatio;
          this.#update_ratio();
          break;
        case ".":
          this.never_same_vertex_twice = !this.never_same_vertex_twice;
          break;
        case "ARROWUP":
          this.speed = Math.min(this.speed + 1, 4);
          break;
        case "ARROWDOWN":
          this.speed = Math.max(this.speed - 1, 0);
          break;
        case "ARROWRIGHT":
          ++this.n_sides;
          this.#init_ngon();
          this.#update_ratio();
          break;
        case "ARROWLEFT":
          if (this.n_sides - 1 < 3) break;
          --this.n_sides;
          this.#init_ngon();
          this.#update_ratio();
          break;
      }
    });
  }

  #init_ngon() {
    this.was_reinitialized = true;
    this.points = [];
    const angle = (2 * Math.PI) / this.n_sides;
    for (let i = 0; i < this.n_sides; ++i) {
      const theta = i * angle + Math.PI / 2;
      this.points.push({
        x: Math.cos(theta),
        y: -Math.sin(theta), // Screen Y coordinates are inverted.
      });
    }
    this.current_point = this.points[0];
  }

  #update_ratio() {
    switch (this.ratio_value) {
      case RatioValue.Divisor:
        this.ratio = 1 / this.ratio_divisor;
        break;
      case RatioValue.GoldenRatio:
        this.ratio = 1 / ((1 + Math.sqrt(5)) / 2);
        break;
    }
  }

  render(delta_time) {
    if (this.was_reinitialized) {
      this.ctx.clear();
      this.#draw_contour_shapes();
      this.was_reinitialized = false;
    }

    this.#choose_new_point();
    this.#draw_new_point();

    if (delta_time !== -1) {
      const nb_additional_iterations = Math.pow(10, this.speed) - 1;
      for (let i = 0; i < nb_additional_iterations; ++i) {
        this.render(-1); // Do not enter this loop on these.
      }
    }

    this.#draw_menu();
  }

  #draw_contour_shapes() {
    this.ctx.lineWidth = 1;
    this.#draw_circle();
    this.#draw_polygon();
  }

  #draw_circle() {
    const { cx, cy } = this.rect;
    this.ctx.strokeStyle = "grey";
    this.ctx.strokeCircle(cx, cy, this.scale);
  }

  #draw_polygon() {
    this.ctx.strokeStyle = "lightgrey";
    this.ctx.beginPath();
    for (const p of this.points) {
      const p_screen = this.#world_to_screen(p);
      this.ctx.lineTo(p_screen.x, p_screen.y);
    }
    this.ctx.closePath();
    this.ctx.stroke();
  }

  #world_to_screen(p) {
    const { cx, cy } = this.rect;
    return { x: cx + p.x * this.scale, y: cy + p.y * this.scale };
  }

  #choose_new_point() {
    const p_old = this.current_point;
    const target = this.never_same_vertex_twice
      ? this.#choose_random_vertex_ne_last()
      : this.#choose_random_vertex();
    const p_new = this.#compute_new_point(p_old, target);
    this.current_point = p_new;
    this.last_vertex = target;
  }

  #choose_random_vertex_ne_last() {
    if (this.last_vertex === null) {
      return this.#choose_random_vertex();
    }
    let new_vertex;
    do {
      new_vertex = this.#choose_random_vertex();
    } while (new_vertex === this.last_vertex);
    return new_vertex;
  }

  #choose_random_vertex() {
    const i = Math.floor(Math.random() * this.n_sides);
    return this.points[i];
  }

  #compute_new_point(p_old, p_new) {
    return {
      x: p_old.x + (p_new.x - p_old.x) * this.ratio,
      y: p_old.y + (p_new.y - p_old.y) * this.ratio,
    };
  }

  #draw_new_point() {
    const { cx, cy } = this.rect;
    this.ctx.fillStyle = "red";
    this.ctx.fillCircle(
      cx + this.current_point.x * this.scale,
      cy + this.current_point.y * this.scale,
      this.point_radius
    );
  }

  #draw_menu() {
    const text = [
      `n-gon: ${this.n_sides}`,
      `ratio: ${this.ratio.toFixed(3)} ${
        this.ratio_value === RatioValue.Divisor
          ? "(1/" + this.ratio_divisor + ")"
          : ""
      }`,
      `speed: 10^${this.speed}/f`,
      "",
      "ratio options:",
      "[+] 1/++n",
      "[-] 1/--n",
      "[g] golden ratio",
      "",
      `[.] never same vertex twice ${this.never_same_vertex_twice ? "*" : " "}`,
      "",
      "[space] restart",
    ];
    const max_text_width = text.reduce(
      (max, str) => Math.max(max, this.text_width(str)),
      0
    );
    const pos = (i) => [
      10,
      this.rect.y + this.font_size * i + ((i - 1) * this.font_size) / 4,
    ];

    this.ctx.fillStyle = "red";
    this.ctx.clearRect(
      0,
      0,
      max_text_width + 20,
      (text.length + 2) * this.font_size +
        ((text.length - 1) * this.font_size) / 4
    );

    this.ctx.fillStyle = "grey";
    this.ctx.font = `${this.font_size}px monospace`;
    this.ctx.textBaseline = "top";

    for (let i = 0; i < text.length; ++i) {
      this.ctx.fillText(text[i], ...pos(i + 1));
    }
  }
}

function main() {
  return new ChaosGame().exec();
}

main();
