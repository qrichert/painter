class AbstractObject {
  constructor(parent, x, y, color, text) {
    this.rect = new Rect(x, y, 100, 100);
    this.ctx = parent.ctx;
    this.mouse = parent.mouse;
    this.color = color;
    this.text = text;
    this.did_initiate_drag = false;
    this.mouse_drag_offset = { x: 0, y: 0 };
    this.is_in_collision = false;
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

  is_mouse_over() {}

  render() {
    this.ctx.fillStyle = this.is_in_collision ? "red" : this.color;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 7]);
    this.ctx.strokeStyle = "red";
  }

  _draw_text() {
    this.ctx.fillStyle = "white";
    this.ctx.font = "15px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(this.text, this.rect.cx, this.rect.cy);
  }
}

class Square extends AbstractObject {
  is_mouse_over() {
    return Collisions2D.point_vs_aabb(
      { x: this.mouse.x, y: this.mouse.y },
      {
        x: this.rect.x,
        y: this.rect.y,
        w: this.rect.w,
        h: this.rect.h,
      },
    );
  }

  render() {
    super.render();
    const { x, y, w, h } = this.rect;

    this.ctx.save();
    this.ctx.globalAlpha = 0.8;
    this.ctx.fillRect(x, y, w, h);
    this.ctx.restore();

    if (this.is_mouse_over()) {
      this.ctx.strokeRect(x, y, w, h);
    }

    this._draw_text();
  }
}

class SweptSquare extends AbstractObject {
  constructor(...props) {
    super(...props);
    this.has_moved = false;
  }

  is_mouse_over() {
    return false;
  }

  render() {
    super.render();
    const { x, y, w, h } = this.rect;

    this.ctx.save();
    this.ctx.globalAlpha = 0.8;
    this.ctx.fillRect(x, y, w, h);
    this.ctx.restore();

    this._draw_text();

    if (!this.has_moved) {
      this.ctx.fillStyle = "black";
      this.ctx.font = "15px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText("[qdzs]", this.rect.cx, this.rect.y - 15);
    }
  }
}

class SweptObstacle extends AbstractObject {
  constructor(...props) {
    super(...props);
    this.rect.w = 170;
    this.rect.h = 30;
  }

  is_mouse_over() {
    return false;
  }

  render() {
    super.render();
    const { x, y, w, h } = this.rect;

    this.ctx.save();
    this.ctx.globalAlpha = 0.8;
    this.ctx.fillRect(x, y, w, h);
    this.ctx.restore();

    this._draw_text();
  }
}

class Circle extends AbstractObject {
  is_mouse_over() {
    return Collisions2D.point_vs_circle(
      { x: this.mouse.x, y: this.mouse.y },
      { cx: this.rect.cx, cy: this.rect.cy, r: this.rect.w / 2 },
    );
  }

  render() {
    super.render();
    const { w, cx, cy } = this.rect;

    this.ctx.save();
    this.ctx.globalAlpha = 0.8;
    this.ctx.fillCircle(cx, cy, w / 2);
    this.ctx.restore();

    if (this.is_mouse_over()) {
      this.ctx.strokeCircle(cx, cy, w / 2);
    }

    this._draw_text();
  }
}

class Point extends AbstractObject {
  constructor(parent, x, y, color, text) {
    super(parent, x, y, color, text);
    this.rect.w = 50;
    this.rect.h = 50;
  }

  is_mouse_over() {
    return Collisions2D.point_vs_circle(
      { x: this.mouse.x, y: this.mouse.y },
      { cx: this.rect.cx, cy: this.rect.cy, r: this.rect.w / 2 },
    );
  }

  render() {
    super.render();
    const { w, cx, cy } = this.rect;

    this.ctx.save();
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillCircle(cx, cy, w / 2);
    this.ctx.restore();

    if (this.is_mouse_over()) {
      this.ctx.strokeCircle(cx, cy, w / 2);
    }

    this._draw_text();

    this.ctx.fillStyle = "white";
    this.ctx.fillCircle(cx, cy, 5);
    this.ctx.fillStyle = "black";
    this.ctx.fillCircle(cx, cy, 3);
  }
}

class Segment {
  constructor(parent, x1, y1, x2, y2, color, text) {
    this.ctx = parent.ctx;
    this.color = color;
    this.point_1 = new Point(parent, x1, y1, "darkgrey", text + "\u2009A");
    this.point_2 = new Point(parent, x2, y2, "darkgrey", text + "\u2009B");
    this.is_in_collision = false;
  }

  is_mouse_over() {
    return this.point_1.is_mouse_over() || this.point_2.is_mouse_over();
  }

  get is_in_collision() {
    return this._is_in_collision;
  }

  set is_in_collision(is_in_collision) {
    this._is_in_collision = is_in_collision;
    this.point_1.is_in_collision = is_in_collision;
    this.point_2.is_in_collision = is_in_collision;
  }

  mouse_press_event(x, y) {
    this.point_1.mouse_press_event(x, y);
    this.point_2.mouse_press_event(x, y);
  }

  mouse_drag_event(x, y) {
    this.point_1.mouse_drag_event(x, y);
    this.point_2.mouse_drag_event(x, y);
  }

  mouse_release_event() {
    this.point_1.mouse_release_event();
    this.point_2.mouse_release_event();
  }

  render() {
    this.ctx.strokeStyle = this.is_in_collision ? "red" : this.color;
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([]);
    this.ctx.strokeLine(
      this.point_1.rect.cx,
      this.point_1.rect.cy,
      this.point_2.rect.cx,
      this.point_2.rect.cy,
    );
    this.point_1.render();
    this.point_2.render();
  }
}

class Collisions extends Painter {
  setup() {
    this.objects = [
      new SweptSquare(this, 350, 150, "teal", "Swept Square"),
      new SweptObstacle(this, 500, 300, "teal", "Swept Obstacle"),
      new Square(this, 10, 10, "black", "Square A"),
      new Square(this, 10, 120, "green", "Square B"),
      new Circle(this, 10, 230, "blue", "Circle A"),
      new Circle(this, 10, 340, "orange", "Circle B"),
      new Point(this, 35, 450, "darkgrey", "Point"),
      new Segment(this, 150, 10, 275, 150, "tomato", "Sgmt"),
    ];
  }

  mouse_press_event(x, y) {
    for (const obj of this.objects) {
      obj.mouse_press_event(x, y);
    }
  }

  mouse_drag_event(x, y) {
    for (const obj of this.objects) {
      obj.mouse_drag_event(x, y);
    }
  }

  mouse_release_event() {
    for (const obj of this.objects) {
      obj.mouse_release_event();
    }
  }

  render(delta_time) {
    this.ctx.clear();

    this.delta_time = delta_time;

    this.#clear_collision_status();
    this.#check_collisions();
    this.#render_objects();
  }

  #clear_collision_status() {
    for (const obj of this.objects) {
      obj.is_in_collision = false;
    }
  }

  #check_collisions() {
    for (const a of this.objects) {
      for (const b of this.objects) {
        if (a === b) continue;
        if (
          this.#check_square_vs_square(a, b) ||
          this.#check_circle_vs_circle(a, b) ||
          this.#check_square_vs_circle(a, b) ||
          this.#check_point_vs_square(a, b) ||
          this.#check_point_vs_circle(a, b) ||
          this.#check_segment_vs_square(a, b) ||
          this.#check_segment_vs_circle(a, b) ||
          this.#check_swept_square_vs_obstacle(a, b)
        ) {
          a.is_in_collision = true;
          b.is_in_collision = true;
        }
      }
    }
  }

  #check_square_vs_square(a, b) {
    if (!(a instanceof Square && b instanceof Square)) {
      return false;
    }
    return Collisions2D.aabb_vs_aabb(
      { x: a.rect.x, y: a.rect.y, w: a.rect.w, h: a.rect.h },
      { x: b.rect.x, y: b.rect.y, w: b.rect.w, h: b.rect.h },
    );
  }

  #check_circle_vs_circle(a, b) {
    if (!(a instanceof Circle && b instanceof Circle)) {
      return false;
    }
    const circle1 = { cx: a.rect.cx, cy: a.rect.cy, r: a.rect.w / 2 };
    const circle2 = { cx: b.rect.cx, cy: b.rect.cy, r: b.rect.w / 2 };
    if (a.is_mouse_over() || b.is_mouse_over()) {
      this.#draw_distance_line(circle1.cx, circle1.cy, circle2.cx, circle2.cy);
    }

    return Collisions2D.circle_vs_circle(circle1, circle2);
  }

  #check_square_vs_circle(a, b) {
    if (!(a instanceof Square && b instanceof Circle)) {
      return false;
    }
    const aabb = { x: a.rect.x, y: a.rect.y, w: a.rect.w, h: a.rect.h };
    const circle = { cx: b.rect.cx, cy: b.rect.cy, r: b.rect.w / 2 };
    if (a.is_mouse_over() || b.is_mouse_over()) {
      this.#draw_line_to_nearest_point_square_vs_circle(aabb, circle);
    }
    return Collisions2D.aabb_vs_circle(aabb, circle);
  }

  #draw_line_to_nearest_point_square_vs_circle(aabb, circle) {
    const nearest_x = Math.max(aabb.x, Math.min(circle.cx, aabb.x + aabb.w));
    const nearest_y = Math.max(aabb.y, Math.min(circle.cy, aabb.y + aabb.h));
    this.#draw_distance_line(circle.cx, circle.cy, nearest_x, nearest_y);
  }

  #check_point_vs_square(a, b) {
    if (!(a instanceof Point && b instanceof Square)) {
      return false;
    }
    const point = { x: a.rect.cx, y: a.rect.cy };
    const aabb = { x: b.rect.x, y: b.rect.y, w: b.rect.w, h: b.rect.h };
    if (a.is_mouse_over() || b.is_mouse_over()) {
      this.#draw_line_to_nearest_point_point_vs_square(point, aabb);
    }
    return Collisions2D.point_vs_aabb(point, aabb);
  }

  #draw_line_to_nearest_point_point_vs_square(point, aabb) {
    const nearest_x = Math.max(aabb.x, Math.min(point.x, aabb.x + aabb.w));
    const nearest_y = Math.max(aabb.y, Math.min(point.y, aabb.y + aabb.h));
    this.#draw_distance_line(point.x, point.y, nearest_x, nearest_y);
  }

  #check_point_vs_circle(a, b) {
    if (!(a instanceof Point && b instanceof Circle)) {
      return false;
    }
    const point = { x: a.rect.cx, y: a.rect.cy };
    const circle = { cx: b.rect.cx, cy: b.rect.cy, r: b.rect.w / 2 };
    if (a.is_mouse_over() || b.is_mouse_over()) {
      this.#draw_distance_line(point.x, point.y, circle.cx, circle.cy);
    }
    return Collisions2D.point_vs_circle(point, circle);
  }

  #check_segment_vs_square(a, b) {
    if (!(a instanceof Segment && b instanceof Square)) {
      return false;
    }
    const segment = {
      x1: a.point_1.rect.cx,
      y1: a.point_1.rect.cy,
      x2: a.point_2.rect.cx,
      y2: a.point_2.rect.cy,
    };
    const aabb = { x: b.rect.x, y: b.rect.y, w: b.rect.w, h: b.rect.h };
    const info = { time: undefined, normal: undefined };
    const are_colliding = Collisions2D.segment_vs_aabb(segment, aabb, info);
    if (a.is_mouse_over() || b.is_mouse_over()) {
      if (info.time !== undefined && info.normal !== undefined) {
        this.#draw_contact_normal_segment_vs_square(
          segment,
          info.time,
          info.normal,
        );
        this.#draw_collision_point_segment_vs_square(segment, info.time);
      }
    }
    return are_colliding;
  }

  #draw_contact_normal_segment_vs_square(segment, time, normal) {
    const a = Vec2D.segment_to_vector(segment);
    const collision = Vec2D.multiply_by_scalar(a, time);
    this.#draw_contact_normal(
      ...Vec2D.add([segment.x1, segment.y1], collision),
      normal,
    );
  }

  #draw_collision_point_segment_vs_square(segment, time) {
    const a = Vec2D.segment_to_vector(segment);
    const collision = Vec2D.multiply_by_scalar(a, time);
    this.#draw_collision_point(
      ...Vec2D.add([segment.x1, segment.y1], collision),
    );
  }

  #check_segment_vs_circle(a, b) {
    if (!(a instanceof Segment && b instanceof Circle)) {
      return false;
    }
    const segment = {
      x1: a.point_1.rect.cx,
      y1: a.point_1.rect.cy,
      x2: a.point_2.rect.cx,
      y2: a.point_2.rect.cy,
    };
    const circle = { cx: b.rect.cx, cy: b.rect.cy, r: b.rect.w / 2 };
    if (a.is_mouse_over() || b.is_mouse_over()) {
      this.#draw_line_to_nearest_point_segment_vs_circle(segment, circle);
    }
    return Collisions2D.segment_vs_circle(segment, circle);
  }

  #draw_line_to_nearest_point_segment_vs_circle(segment, circle) {
    const a = Vec2D.segment_to_vector({
      x1: segment.x1,
      y1: segment.y1,
      x2: circle.cx,
      y2: circle.cy,
    });
    const b = Vec2D.segment_to_vector(segment);

    const clamped_time = Math.max(
      0,
      Math.min(Vec2D.projection_of_a_onto_b(a, b), 1),
    );

    const nearest_point = Vec2D.multiply_by_scalar(b, clamped_time);
    const segment_to_circle = Vec2D.subtract(a, nearest_point);

    this.#draw_distance_line(
      ...Vec2D.add([segment.x1, segment.y1], nearest_point),
      ...Vec2D.add(
        Vec2D.add([segment.x1, segment.y1], nearest_point),
        segment_to_circle,
      ),
    );
  }

  #check_swept_square_vs_obstacle(a, b) {
    if (!(a instanceof SweptSquare && b instanceof SweptObstacle)) {
      return false;
    }

    // Swept resolution happens BEFORE the objects have even collided.
    // It's more a collision "prevention" than it is a collision "resolution".
    // This doesn't work well with the fact that the mouse is asynchronous.
    // Thus, the more traditional controls for this one.
    const speed = 700 * this.delta_time;
    const velocity = [0, 0];
    if (this.keyboard.is_key_pressed("d")) {
      velocity[0] = speed;
      a.has_moved = true;
    }
    if (this.keyboard.is_key_pressed("q")) {
      velocity[0] = -speed;
      a.has_moved = true;
    }
    if (this.keyboard.is_key_pressed("s")) {
      velocity[1] = speed;
      a.has_moved = true;
    }
    if (this.keyboard.is_key_pressed("z")) {
      velocity[1] = -speed;
      a.has_moved = true;
    }

    const source = { x: a.rect.x, y: a.rect.y, w: a.rect.w, h: a.rect.h };
    const target = { x: b.rect.x, y: b.rect.y, w: b.rect.w, h: b.rect.h };
    const info = { resolution_vector: undefined };
    const are_colliding = Collisions2D.swept_aabb_vs_aabb(
      source,
      velocity,
      target,
      info,
    );

    if (are_colliding && info.resolution_vector !== undefined) {
      velocity[0] += info.resolution_vector[0];
      velocity[1] += info.resolution_vector[1];
    }

    a.rect.x += velocity[0];
    a.rect.y += velocity[1];

    return are_colliding;
  }

  #draw_distance_line(x1, y1, x2, y2) {
    this.ctx.save();
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([3, 1]);
    this.ctx.strokeStyle = "magenta";
    this.ctx.strokeLine(x1, y1, x2, y2);
    this.ctx.restore();
  }

  #draw_contact_normal(x, y, normal) {
    const normal_line = Vec2D.multiply_by_scalar(normal, 30);
    this.ctx.save();
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([]);
    this.ctx.strokeStyle = "magenta";
    this.ctx.strokeLine(x, y, ...Vec2D.add([x, y], normal_line));
    this.ctx.restore();
  }

  #draw_collision_point(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = "magenta";
    this.ctx.fillCircle(x, y, 7);
    this.ctx.restore();
  }

  #render_objects() {
    for (const obj of this.objects) {
      obj.render();
    }
  }
}

function main() {
  return new Collisions().exec();
}

main();
