class HotPoint {
  constructor(parent, x, y) {
    this.parent = parent;
    this.mouse = parent.mouse;
    this.rect = new Rect(x - 10, y - 10, 20, 20);
    this.did_initiate_drag = false;
    this.mouse_drag_offset = { x: 0, y: 0 };

    // Circular dependency not clean but way simpler.
    this.parent.register_hotpoint(this);
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
  }

  is_mouse_over() {
    return Collisions2D.point_vs_circle(
      { x: this.mouse.x, y: this.mouse.y },
      { cx: this.rect.cx, cy: this.rect.cy, r: this.rect.w / 2 },
    );
  }
}

class Segment {
  constructor(parent, x1, y1, x2, y2) {
    this.point_1 = new HotPoint(parent, x1, y1);
    this.point_2 = new HotPoint(parent, x2, y2);
  }

  get coordinates() {
    return [this.point_1.x, this.point_1.y, this.point_2.x, this.point_2.y];
  }

  as_vector() {
    const [x1, y1, x2, y2] = this.coordinates;
    return Vec2D.segment_to_vector({ x1, y1, x2, y2 });
  }
}

class Vectors extends Painter {
  setup() {
    this.hotpoints = [];

    this.add = [
      new Segment(this, 100, 100, 300, 130),
      new Segment(this, 300, 130, 200, 250),
    ];
    this.subtract = [
      new Segment(this, 400, 300, 600, 130),
      new Segment(this, 400, 300, 550, 250),
    ];
    this.dot_product = [
      new Segment(this, 50, 475, 250, 330),
      new Segment(this, 50, 475, 330, 400),
    ];
    this.normal = [new Segment(this, 300, 570, 500, 580)];
    this.mean = [
      new Segment(this, 600, 400, 800, 230),
      new Segment(this, 600, 400, 850, 350),
      new Segment(this, 600, 400, 820, 450),
    ];
  }

  register_hotpoint(hotpoint) {
    this.hotpoints.push(hotpoint);
  }

  mouse_press_event(x, y) {
    for (const hotpoint of this.hotpoints) {
      hotpoint.mouse_press_event(x, y);
    }
  }

  mouse_drag_event(x, y) {
    for (const hotpoint of this.hotpoints) {
      hotpoint.mouse_drag_event(x, y);
    }
  }

  mouse_release_event() {
    for (const hotpoint of this.hotpoints) {
      hotpoint.mouse_release_event();
    }
  }

  render() {
    this.ctx.clear();
    this.#draw_hotpoints();

    this.#addition();
    this.#subtraction();
    this.#dot_product();
    this.#normal();
    this.#mean();
  }

  #draw_hotpoints() {
    for (const hotpoint of this.hotpoints) {
      this.ctx.fillStyle = hotpoint.is_mouse_over() ? "darkgrey" : "lightgrey";
      this.ctx.fillCircle(hotpoint.x, hotpoint.y, hotpoint.rect.w / 2);
    }
  }

  #addition() {
    const a = this.add[0];
    const b = this.add[1];
    const c = Vec2D.add(a.as_vector(), b.as_vector());

    this.#draw_arrow(a.coordinates, "blue");
    this.#draw_arrow(b.coordinates, "red");
    this.#draw_arrow(
      [a.point_1.x, a.point_1.y, ...Vec2D.add([a.point_1.x, a.point_1.y], c)],
      "green",
    );
  }

  #subtraction() {
    const a = this.subtract[0];
    const b = this.subtract[1];
    const c = Vec2D.subtract(a.as_vector(), b.as_vector());

    this.#draw_arrow(a.coordinates, "blue");
    this.#draw_arrow(b.coordinates, "red");
    this.#draw_arrow(
      [b.point_2.x, b.point_2.y, ...Vec2D.add([b.point_2.x, b.point_2.y], c)],
      "green",
    );
  }

  #dot_product() {
    const a = this.dot_product[0];
    const b = this.dot_product[1];
    const projection = Vec2D.projection_of_a_onto_b(
      a.as_vector(),
      b.as_vector(),
    );
    const c = Vec2D.multiply_by_scalar(b.as_vector(), projection);

    this.#draw_line(
      [a.point_2.x, a.point_2.y, ...Vec2D.add([b.point_1.x, b.point_1.y], c)],
      "black",
    );
    this.#draw_arrow(a.coordinates, "blue");
    this.#draw_arrow(b.coordinates, "red");
    this.#draw_arrow(
      [b.point_1.x, b.point_1.y, ...Vec2D.add([b.point_1.x, b.point_1.y], c)],
      "green",
    );
  }

  #normal() {
    const a = this.normal[0];
    const n = Vec2D.normal(Vec2D.normalize(a.as_vector()));

    const half_a = Vec2D.divide_by_scalar(a.as_vector(), 2);
    const center_of_a = [a.point_1.x + half_a[0], a.point_1.y + half_a[1]];

    this.#draw_arrow(a.coordinates, "blue");
    this.#draw_arrow(
      [
        ...center_of_a,
        ...Vec2D.add(center_of_a, Vec2D.multiply_by_scalar(n, 70)),
      ],
      "green",
    );
  }

  #mean() {
    const a = this.mean[0];
    const b = this.mean[1];
    const c = this.mean[2];
    const d = Vec2D.mean(a.as_vector(), b.as_vector(), c.as_vector());

    this.#draw_arrow(a.coordinates, "blue");
    this.#draw_arrow(b.coordinates, "red");
    this.#draw_arrow(c.coordinates, "purple");
    this.#draw_arrow(
      [a.point_1.x, a.point_1.y, ...Vec2D.add([a.point_1.x, a.point_1.y], d)],
      "green",
    );
  }

  #draw_arrow(coordinates, color = "black") {
    this.#draw_line(coordinates, color);

    // Arrow Head
    const [x1, y1, x2, y2] = coordinates;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    this.ctx.save();
    this.ctx.translate(x2, y2);
    this.ctx.rotate(angle);
    this.ctx.translate(-x2, -y2);
    this.ctx.fillTriangle(x2 - 14, y2 - 7, x2, y2, x2 - 14, y2 + 7);
    this.ctx.restore();
  }

  #draw_line(coordinates, color = "black") {
    const [x1, y1, x2, y2] = coordinates;
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.strokeLine(x1, y1, x2, y2);
  }
}

function main() {
  return new Vectors().exec();
}

main();
