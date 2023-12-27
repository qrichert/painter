class Vec2D {
  /**
   * @param {[number, number]} a
   * @param {[number, number]} b
   * @returns {[number, number]}
   */
  static add(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
  }

  /**
   * @param {[number, number]} a
   * @param {[number, number]} b
   * @returns {[number, number]}
   */
  static subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
  }

  /**
   * @param {[number, number]} a
   * @param {[number, number]} b
   * @returns {[number, number]}
   */
  static multiply(a, b) {
    return [a[0] * b[0], a[1] * b[1]];
  }

  /**
   * @param {[number, number]} a
   * @param {number} scalar
   * @returns {[number, number]}
   */
  static multiply_by_scalar(a, scalar) {
    return [a[0] * scalar, a[1] * scalar];
  }

  /**
   * @param {[number, number]} a
   * @param {[number, number]} b
   * @returns {[number, number]}
   */
  static divide(a, b) {
    return [a[0] / b[0], a[1] / b[1]];
  }

  /**
   * @param {[number, number]} a
   * @param {number} scalar
   * @returns {[number, number]}
   */
  static divide_by_scalar(a, scalar) {
    return [a[0] / scalar, a[1] / scalar];
  }

  /**
   * @param {[number, number][]} vectors
   * @returns {[number, number]}
   */
  static sum(...vectors) {
    return vectors.reduce((sum, v) => this.add(sum, v), [0, 0]);
  }

  /**
   * @param {[number, number][]} vectors
   * @returns {[number, number]}
   */
  static mean(...vectors) {
    const sum = this.sum(...vectors);
    return this.divide_by_scalar(sum, vectors.length);
  }

  /**
   * @param {[number, number]} a
   * @returns {number}
   */
  static magnitude(a) {
    return Math.sqrt(a[0] ** 2 + a[1] ** 2);
  }

  /**
   * @param {[number, number]} a
   * @returns {[number, number]}
   */
  static normalize(a) {
    const length = this.magnitude(a);
    return this.divide_by_scalar(a, length);
  }

  /**
   * @param {[number, number]} a
   * @returns {[number, number]}
   */
  static normal(a) {
    const [x, y] = a;
    return [y, -x];
  }

  /**
   * @param {[number, number]} a
   * @param {[number, number]} b
   * @returns number
   */
  static dot_product(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }

  /**
   * @param {[number, number]} a
   * @param {[number, number]} b
   * @returns {number}
   */
  static projection_of_a_onto_b(a, b) {
    // (a⋅b)/∥b∥^2
    const dot_product = this.dot_product(a, b);
    // magnitude(b) ** 2 involves a square root, canceled by "** 2".
    // It is more efficient to do it manually and avoid the sqrt().
    const squared_magnitude_of_b = b[0] ** 2 + b[1] ** 2;
    return dot_product / squared_magnitude_of_b;
  }

  /**
   * @param {{ x1: number, y1: number, x2: number, y2: number }} segment
   * @returns {[number, number]}
   */
  static segment_to_vector(segment) {
    const { x1, y1, x2, y2 } = segment;
    return [x2 - x1, y2 - y1];
  }
}

class Collisions2D {
  /**
   * @param {{ x: number, y: number, w: number, h: number }} a
   * @param {{ x: number, y: number, w: number, h: number }} b
   * @returns {boolean}
   */
  static aabb_vs_aabb(a, b) {
    return (
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    );
  }

  /**
   * @param {{ cx: number, cy: number, r: number }} a
   * @param {{ cx: number, cy: number, r: number }} b
   * @returns {boolean}
   */
  static circle_vs_circle(a, b) {
    const d = (a.cx - b.cx) ** 2 + (a.cy - b.cy) ** 2;
    return d < (a.r + b.r) ** 2;
  }

  /**
   * @param {{ x: number, y: number, w: number, h: number }} aabb
   * @param {{ cx: number, cy: number, r: number }} circle
   * @returns {boolean}
   */
  static aabb_vs_circle(aabb, circle) {
    const nearest_x = Math.max(aabb.x, Math.min(circle.cx, aabb.x + aabb.w));
    const nearest_y = Math.max(aabb.y, Math.min(circle.cy, aabb.y + aabb.h));
    return this.point_vs_circle({ x: nearest_x, y: nearest_y }, circle);
  }

  /**
   * @param {{ x: number, y: number }} point
   * @param {{ x: number, y: number, w: number, h: number }} aabb
   * @returns {boolean}
   */
  static point_vs_aabb(point, aabb) {
    return (
      point.x > aabb.x &&
      point.x < aabb.x + aabb.w &&
      point.y > aabb.y &&
      point.y < aabb.y + aabb.h
    );
  }

  /**
   * @param {{ x: number, y: number }} point
   * @param {{ cx: number, cy: number, r: number }} circle
   * @returns {boolean}
   */
  static point_vs_circle(point, circle) {
    const d = (point.x - circle.cx) ** 2 + (point.y - circle.cy) ** 2;
    return d < circle.r ** 2;
  }

  /**
   * @param {{ x1: number, y1: number, x2: number, y2: number }} ray
   * @param {{ x: number, y: number, w: number, h: number }} aabb
   * @param {{ time?: number, normal?: number[] }} info
   * @returns {boolean}
   */
  static ray_vs_aabb(ray, aabb, info = {}) {
    info.time = undefined;
    info.normal = undefined;

    const d = Vec2D.segment_to_vector(ray);
    let near_time_x = (aabb.x - ray.x1) / d[0];
    let far_time_x = (aabb.x + aabb.w - ray.x1) / d[0];

    let near_time_y = (aabb.y - ray.y1) / d[1];
    let far_time_y = (aabb.y + aabb.h - ray.y1) / d[1];

    if (near_time_x > far_time_x) {
      [near_time_x, far_time_x] = [far_time_x, near_time_x];
    }
    if (near_time_y > far_time_y) {
      [near_time_y, far_time_y] = [far_time_y, near_time_y];
    }

    if (near_time_x > far_time_y || near_time_y > far_time_x) {
      return false;
    }

    const time_hit_near = Math.max(near_time_x, near_time_y);
    const time_hit_far = Math.min(far_time_x, far_time_y);

    if (time_hit_far < 0) {
      return false;
    }

    let contact_normal = [0, 0];
    if (near_time_x > near_time_y) {
      if (d[0] < 0) {
        contact_normal = [1, 0];
      } else {
        contact_normal = [-1, 0];
      }
    } else if (near_time_x < near_time_y) {
      if (d[1] < 0) {
        contact_normal = [0, 1];
      } else {
        contact_normal = [0, -1];
      }
    }

    info.time = time_hit_near;
    info.normal = contact_normal;

    return true;
  }

  /**
   * @param {{ x1: number, y1: number, x2: number, y2: number }} segment
   * @param {{ x: number, y: number, w: number, h: number }} aabb
   * @param {{ time?: number, normal?: number[] }} info
   * @returns {boolean}
   */
  static segment_vs_aabb(segment, aabb, info = {}) {
    const are_colliding = this.ray_vs_aabb(segment, aabb, info);
    // Ray extends into infinity, segment does not.
    return are_colliding && info.time < 1;
  }

  /**
   * @param {{ x: number, y: number, w: number, h: number }} source
   * @param { number[] } source_velocity
   * @param {{ x: number, y: number, w: number, h: number }} target
   * @param {{ time?: number, normal?: number[] }} info
   * @returns {boolean}
   */
  static swept_aabb_vs_aabb_detect_only(
    source,
    source_velocity,
    target,
    info = {},
  ) {
    info.time = undefined;
    info.normal = undefined;

    if (source_velocity[0] === 0 && source_velocity[1] === 0) {
      return false;
    }

    const origin = [source.x + source.w / 2, source.y + source.h / 2];
    const d = Vec2D.add(origin, source_velocity);
    const expanded_target = {
      x: target.x - source.w * 0.5,
      y: target.y - source.h * 0.5,
      w: target.w + source.w,
      h: target.h + source.h,
    };

    const are_colliding = this.segment_vs_aabb(
      { x1: origin[0], y1: origin[1], x2: d[0], y2: d[1] },
      expanded_target,
      info,
    );
    return are_colliding;
  }

  /**
   * @param {{ x: number, y: number, w: number, h: number }} source
   * @param { number[] } source_velocity
   * @param {{ x: number, y: number, w: number, h: number }} target
   * @param {{ time?: number, normal?: number[], resolution_vector?: number[] }} info
   * @returns {boolean}
   */
  static swept_aabb_vs_aabb(source, source_velocity, target, info = {}) {
    info.time = undefined;
    info.normal = undefined;
    info.resolution_vector = undefined;

    const are_colliding = this.swept_aabb_vs_aabb_detect_only(
      source,
      source_velocity,
      target,
      info,
    );

    if (!are_colliding) {
      return false;
    }

    // Axis-aligned direction of resolution (x, -x, y, -y).
    const collision_normal = info.normal;
    // Unsigned velocity (sign is given by collision_normal).
    const absolute_velocity = [
      Math.abs(source_velocity[0]),
      Math.abs(source_velocity[1]),
    ];
    // How much overlap to resolve = How much velocity to cancel.
    const resolution_normal = (1 - info.time).clamp(0, 1);

    // collision normal * absolute_velocity * resolution_normal
    const resolution_vector = Vec2D.multiply_by_scalar(
      Vec2D.multiply(collision_normal, absolute_velocity),
      resolution_normal,
    );

    // Due to rounding errors(?), the raw resolution vector can leave
    // objects in collision. So, we make it a bit bigger to compensate.
    const safe_resolution_vector = Vec2D.multiply_by_scalar(
      resolution_vector,
      1.0000001,
    );

    info.resolution_vector = safe_resolution_vector;

    return true;
  }

  /**
   * @param {{ x1: number, y1: number, x2: number, y2: number }} segment
   * @param {{ cx: number, cy: number, r: number }} circle
   * @returns {boolean}
   */
  static segment_vs_circle(segment, circle) {
    const a = Vec2D.segment_to_vector({
      x1: segment.x1,
      y1: segment.y1,
      x2: circle.cx,
      y2: circle.cy,
    });
    const b = Vec2D.segment_to_vector(segment);

    const time = Vec2D.projection_of_a_onto_b(a, b);
    const clamped_time = time.clamp(0, 1);

    const nearest_point = Vec2D.multiply_by_scalar(b, clamped_time);
    const segment_to_circle = Vec2D.subtract(a, nearest_point);

    // Square radius instead of sqrt(distance_to_circle).
    const distance_to_circle =
      segment_to_circle[0] ** 2 + segment_to_circle[1] ** 2;
    return distance_to_circle < circle.r ** 2;
  }
}

class Interpolation {
  /**
   * Linear.
   *
   * Find value given time:
   *
   *   lerp(10, 20, 0.5) // 15
   *
   * @param {number} a Start
   * @param {number} b End
   * @param {number} t Time [0; 1]
   * @returns {number}
   */
  static lerp(a, b, t) {
    return (1 - t) * a + t * b;
  }

  /**
   * Reverse Linear.
   *
   * Find time given value:
   *
   *   lerp(10, 20, 15) // 0.5
   *
   * @param {number} a Start
   * @param {number} b End
   * @param {number} v Value [start; end]
   * @returns {number}
   */
  static rlerp(a, b, v) {
    return (v - a) / (b - a);
  }

  /**
   * Ease In Quad (^2) - Start slow, accelerate.
   *
   * @param {number} a
   * @param {number} b
   * @param {number} t
   * @returns {number}
   */
  static ease_in_quad(a, b, t) {
    t = t * t;
    return this.lerp(a, b, t);
  }

  /**
   * Eease Out Quad (^2) - Start fast, decelerate.
   *
   * @param {number} a
   * @param {number} b
   * @param {number} t
   * @returns {number}
   */
  static ease_out_quad(a, b, t) {
    t = 1 - (1 - t) * (1 - t);
    return this.lerp(a, b, t);
  }

  /**
   * Ease In-Out Quad (^2) - Start slow, accelerate, end slow.
   *
   * @param {number} a
   * @param {number} b
   * @param {number} t
   * @returns {number}
   */
  static ease_in_out_quad(a, b, t) {
    if (t < 0.5) {
      t = 2 * t * t;
    } else {
      t = 1 - (-2 * t + 2) ** 2 / 2;
    }
    return this.lerp(a, b, t);
  }

  /**
   * Smoothstep (Smooth ease in-out).
   *
   * @param {number} a
   * @param {number} b
   * @param {number} t
   * @returns {number}
   */
  static smoothstep(a, b, t) {
    t = t * t * (3 - 2 * t);
    return this.lerp(a, b, t);
  }

  /**
   * Catmull-Rom.
   *
   *       P1              - P3
   *       -  *          -
   *     -      *      -
   * P0 -         *  *
   *                P2
   *
   * @param {number[]} p0 Control point 1
   * @param {number[]} p1 Spline start
   * @param {number[]} p2 Spline end
   * @param {number[]} p3 Control point 2
   * @param {number} t Time [0; 1]
   * @param {number} alpha 0.5 = centripetal, 0 = uniform, 1 = chordal
   * @returns {number[]} [x, y]
   */
  static catmull_rom(p0, p1, p2, p3, t, alpha = 0.5) {
    const get_t = (t, alpha, p0, p1) => {
      const d = [p1[0] - p0[0], p1[1] - p0[1]]; // p1 - p0
      const a = d[0] * d[0] + d[1] * d[1]; // d • d
      const b = a ** (alpha * 0.5); // a ^ (alpha/2)
      return b + t;
    };

    const t0 = 0.0;
    const t1 = get_t(t0, alpha, p0, p1);
    const t2 = get_t(t1, alpha, p1, p2);
    const t3 = get_t(t2, alpha, p2, p3);
    t = this.lerp(t1, t2, t);

    const A1 = Vec2D.add(
      Vec2D.multiply_by_scalar(p0, (t1 - t) / (t1 - t0)),
      Vec2D.multiply_by_scalar(p1, (t - t0) / (t1 - t0)),
    );
    const A2 = Vec2D.add(
      Vec2D.multiply_by_scalar(p1, (t2 - t) / (t2 - t1)),
      Vec2D.multiply_by_scalar(p2, (t - t1) / (t2 - t1)),
    );
    const A3 = Vec2D.add(
      Vec2D.multiply_by_scalar(p2, (t3 - t) / (t3 - t2)),
      Vec2D.multiply_by_scalar(p3, (t - t2) / (t3 - t2)),
    );
    const B1 = Vec2D.add(
      Vec2D.multiply_by_scalar(A1, (t2 - t) / (t2 - t0)),
      Vec2D.multiply_by_scalar(A2, (t - t0) / (t2 - t0)),
    );
    const B2 = Vec2D.add(
      Vec2D.multiply_by_scalar(A2, (t3 - t) / (t3 - t1)),
      Vec2D.multiply_by_scalar(A3, (t - t1) / (t3 - t1)),
    );
    const C = Vec2D.add(
      Vec2D.multiply_by_scalar(B1, (t2 - t) / (t2 - t1)),
      Vec2D.multiply_by_scalar(B2, (t - t1) / (t2 - t1)),
    );
    return C;
  }
}
