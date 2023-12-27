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

    const vec2d_x_scalar = (v, scalar) => [v[0] * scalar, v[1] * scalar];
    const vec2d_add = (v1, v2) => [v1[0] + v2[0], v1[1] + v2[1]];

    const A1 = vec2d_add(
      vec2d_x_scalar(p0, (t1 - t) / (t1 - t0)),
      vec2d_x_scalar(p1, (t - t0) / (t1 - t0)),
    );
    const A2 = vec2d_add(
      vec2d_x_scalar(p1, (t2 - t) / (t2 - t1)),
      vec2d_x_scalar(p2, (t - t1) / (t2 - t1)),
    );
    const A3 = vec2d_add(
      vec2d_x_scalar(p2, (t3 - t) / (t3 - t2)),
      vec2d_x_scalar(p3, (t - t2) / (t3 - t2)),
    );
    const B1 = vec2d_add(
      vec2d_x_scalar(A1, (t2 - t) / (t2 - t0)),
      vec2d_x_scalar(A2, (t - t0) / (t2 - t0)),
    );
    const B2 = vec2d_add(
      vec2d_x_scalar(A2, (t3 - t) / (t3 - t1)),
      vec2d_x_scalar(A3, (t - t1) / (t3 - t1)),
    );
    const C = vec2d_add(
      vec2d_x_scalar(B1, (t2 - t) / (t2 - t1)),
      vec2d_x_scalar(B2, (t - t1) / (t2 - t1)),
    );
    return C;
  }
}
