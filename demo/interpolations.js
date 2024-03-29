class Point {
  constructor(parent, x, y, color, text) {
    this.rect = new Rect(x, y, 50, 50);
    this.ctx = parent.ctx;
    this.mouse = parent.mouse;
    this.color = color;
    this.text = text;
    this.did_initiate_drag = false;
    this.mouse_drag_offset = { x: 0, y: 0 };
  }

  get x() {
    return this.rect.cx;
  }

  get y() {
    return this.rect.cy;
  }

  mouse_press_event(x, y) {
    if (!this.is_mouse_over()) return;
    this.mouse_drag_offset = {
      x: x - this.rect.x,
      y: y - this.rect.y,
    };
    this.did_initiate_drag = true;
  }

  mouse_drag_event(x, y) {
    if (!this.did_initiate_drag) return;
    this.rect.x = x - this.mouse_drag_offset.x;
    this.rect.y = y - this.mouse_drag_offset.y;
  }

  mouse_release_event() {
    this.did_initiate_drag = false;
    this.mouse_drag_offset = { x: 0, y: 0 };
  }

  is_mouse_over() {
    // TODO: return Collisions2D.point_vs_circle(
    //    { x: this.mouse.x, y: this.mouse.y },
    //    { cx: this.rect.cx, cy: this.rect.cy, r: this.rect.w / 2 },
    //  );
    return (
      (this.rect.cx - this.mouse.x) ** 2 + (this.rect.cy - this.mouse.y) ** 2 <
      (this.rect.w / 2) ** 2
    );
  }

  render() {
    this.ctx.save();

    this.ctx.fillStyle = this.color;
    this.ctx.lineWidth = 2;

    this.#draw_interaction_area();
    if (this.is_mouse_over()) {
      this.#draw_outline();
    }
    this.#draw_text();
    this.#draw_point();

    this.ctx.restore();
  }

  #draw_interaction_area() {
    const { w, cx, cy } = this.rect;
    this.ctx.save();
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillCircle(cx, cy, w / 2);
    this.ctx.restore();
  }

  #draw_outline() {
    const { w, cx, cy } = this.rect;
    this.ctx.setLineDash([5, 7]);
    this.ctx.strokeStyle = "red";
    this.ctx.strokeCircle(cx, cy, w / 2);
  }

  #draw_text() {
    this.ctx.fillStyle = "white";
    this.ctx.font = "15px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(this.text, this.rect.cx + 14, this.rect.cy);
  }

  #draw_point() {
    const { cx, cy } = this.rect;
    this.ctx.fillStyle = "white";
    this.ctx.fillCircle(cx, cy, 5);
    this.ctx.fillStyle = "black";
    this.ctx.fillCircle(cx, cy, 3);
  }
}

const InterpolationMethod = {
  None: "None",
  Linear: "Linear",
  CatmullRomCentripetal: "CatmullRomCentripetal",
  CatmullRomUniform: "CatmullRomUniform",
  CatmullRomChordal: "CatmullRomChordal",
  EaseInQuad: "EaseInQuad",
  EaseOutQuad: "EaseOutQuad",
  EaseInOutQuad: "EaseInOutQuad",
  Smoothstep: "Smoothstep",
};

class Interpolations extends Painter {
  setup() {
    this.point_p0 = new Point(this, 320, 120, "red", "P0");
    this.point_a = new Point(this, 370, 470, "blue", "A");
    this.point_b = new Point(this, 770, 170, "blue", "B");
    this.point_p3 = new Point(this, 830, 500, "red", "P3");
    this.points = [this.point_a, this.point_b, this.point_p0, this.point_p3];

    this.interpolation = InterpolationMethod.CatmullRomCentripetal;
    this.nb_samples = 42;
    this.font_size = 12;
  }

  key_press_event(key) {
    switch (key) {
      case "n":
        this.interpolation = InterpolationMethod.None;
        break;
      case "l":
        this.interpolation = InterpolationMethod.Linear;
        break;
      case "c":
        this.interpolation = InterpolationMethod.CatmullRomCentripetal;
        break;
      case "u":
        this.interpolation = InterpolationMethod.CatmullRomUniform;
        break;
      case "h":
        this.interpolation = InterpolationMethod.CatmullRomChordal;
        break;
      case "i":
        this.interpolation = InterpolationMethod.EaseInQuad;
        break;
      case "o":
        this.interpolation = InterpolationMethod.EaseOutQuad;
        break;
      case "e":
        this.interpolation = InterpolationMethod.EaseInOutQuad;
        break;
      case "s":
        this.interpolation = InterpolationMethod.Smoothstep;
        break;
      case "ArrowUp":
        this.nb_samples += 10;
        break;
      case "ArrowDown":
        this.nb_samples = Math.max(this.nb_samples - 10, 10);
        break;
    }
  }

  mouse_press_event(x, y) {
    for (const point of this.points) {
      point.mouse_press_event(x, y);
    }
  }

  mouse_drag_event(x, y, dx, dy) {
    for (const point of this.points) {
      point.mouse_drag_event(x, y);
    }
  }

  mouse_release_event(x, y) {
    for (const point of this.points) {
      point.mouse_release_event();
    }
  }

  render() {
    this.ctx.clear();
    this.#set_up_style();
    this.#draw_control_points();
    this.#draw_path();
    this.#draw_menu();
  }

  #set_up_style() {
    this.ctx.font = `${this.font_size}px monospace`;
    this.ctx.textBaseline = "top";
  }

  #draw_control_points() {
    for (const point of this.points) {
      if (
        !this.interpolation.startsWith("CatmullRom") &&
        point.text.startsWith("P")
      ) {
        continue;
      }
      point.render();
    }
  }

  #draw_path() {
    const step = 1 / (this.nb_samples + 1);
    for (let t = step; t < 1; t += step) {
      const [x, y] = this.#interpolate(t);
      this.ctx.fillCircle(x, y, 2);
    }
  }

  #interpolate(t) {
    const x = this.#linear_x(t);
    switch (this.interpolation) {
      case InterpolationMethod.Linear:
        return [x, this.#interpolate_linear(t)];
      case InterpolationMethod.CatmullRomCentripetal:
        return this.#interpolate_catmull_rom_centripetal(t);
      case InterpolationMethod.CatmullRomUniform:
        return this.#interpolate_catmull_rom_uniform(t);
      case InterpolationMethod.CatmullRomChordal:
        return this.#interpolate_catmull_rom_chordal(t);
      case InterpolationMethod.EaseInQuad:
        return [x, this.#interpolate_ease_in_quad(t)];
      case InterpolationMethod.EaseOutQuad:
        return [x, this.#interpolate_ease_out_quad(t)];
      case InterpolationMethod.EaseInOutQuad:
        return [x, this.#interpolate_ease_in_out_quad(t)];
      case InterpolationMethod.Smoothstep:
        return [x, this.#interpolate_smoothstep(t)];
    }
  }

  #linear_x(t) {
    return Interpolation.lerp(this.point_a.x, this.point_b.x, t);
  }

  #interpolate_linear(t) {
    return Interpolation.lerp(this.point_a.y, this.point_b.y, t);
  }

  #interpolate_catmull_rom_centripetal(t) {
    return Interpolation.catmull_rom(
      [this.point_p0.x, this.point_p0.y],
      [this.point_a.x, this.point_a.y],
      [this.point_b.x, this.point_b.y],
      [this.point_p3.x, this.point_p3.y],
      t,
      0.5,
    );
  }

  #interpolate_catmull_rom_uniform(t) {
    return Interpolation.catmull_rom(
      [this.point_p0.x, this.point_p0.y],
      [this.point_a.x, this.point_a.y],
      [this.point_b.x, this.point_b.y],
      [this.point_p3.x, this.point_p3.y],
      t,
      0,
    );
  }

  #interpolate_catmull_rom_chordal(t) {
    return Interpolation.catmull_rom(
      [this.point_p0.x, this.point_p0.y],
      [this.point_a.x, this.point_a.y],
      [this.point_b.x, this.point_b.y],
      [this.point_p3.x, this.point_p3.y],
      t,
      1,
    );
  }

  #interpolate_ease_in_quad(t) {
    return Interpolation.ease_in_quad(this.point_a.y, this.point_b.y, t);
  }

  #interpolate_ease_out_quad(t) {
    return Interpolation.ease_out_quad(this.point_a.y, this.point_b.y, t);
  }

  #interpolate_ease_in_out_quad(t) {
    return Interpolation.ease_in_out_quad(this.point_a.y, this.point_b.y, t);
  }

  #interpolate_smoothstep(t) {
    return Interpolation.smoothstep(this.point_a.y, this.point_b.y, t);
  }

  #draw_menu() {
    const pos = (i) => [
      10,
      this.rect.y + this.font_size * i + ((i - 1) * this.font_size) / 4,
    ];

    this.ctx.fillStyle = "black";
    let i = 0;
    this.ctx.fillText(`Interpolation: ${this.interpolation}`, ...pos(++i));
    for (const interpolation in InterpolationMethod) {
      ++i;
      this.ctx.fillText("* " + interpolation, ...pos(i));
      if (
        interpolation === "CatmullRomCentripetal" ||
        interpolation === "CatmullRomUniform"
      ) {
        this.ctx.fillText("*           _", ...pos(i));
      } else if (interpolation === "CatmullRomChordal") {
        this.ctx.fillText("*            _", ...pos(i));
      } else if (
        interpolation === "EaseInQuad" ||
        interpolation === "EaseOutQuad"
      ) {
        this.ctx.fillText("*     _", ...pos(i));
      } else {
        this.ctx.fillText("* _", ...pos(i));
      }
    }
    ++i;
    this.ctx.fillText(`Samples: ${this.nb_samples}`, ...pos(++i));
    this.ctx.fillText("* [↑↓]", ...pos(++i));
  }
}

function main() {
  return new Interpolations().exec();
}

main();
