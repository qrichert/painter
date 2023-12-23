const PenInterpolation = {
  None: "None",
  Linear: "Linear",
  Quadratic: "Quadratic",
  Flow: "Flow",
};

class Pen extends Painter {
  setup() {
    this.points = [];
    this.interpolation = PenInterpolation.Linear;
    this.show_points = true;
    this.line_width = 2;
    this.font_size = 12;
  }

  mouse_press_event(x, y) {
    this.points = [];
  }

  mouse_move_event(x, y) {
    if (!this.mouse.is_pressed) return;
    this.points.push({ x, y });
  }

  key_press_event(key) {
    switch (key.toUpperCase()) {
      case "N":
        this.interpolation = PenInterpolation.None;
        break;
      case "L":
        this.interpolation = PenInterpolation.Linear;
        break;
      case "Q":
        this.interpolation = PenInterpolation.Quadratic;
        break;
      case "F":
        this.interpolation = PenInterpolation.Flow;
        break;
      case " ":
        this.show_points = !this.show_points;
        break;
      case "ARROWUP":
        this.line_width = Math.min(this.line_width + 1, 20);
        break;
      case "ARROWDOWN":
        this.line_width = Math.max(this.line_width - 1, 1);
        break;
    }
  }

  render() {
    this.ctx.clear();
    this.#set_up_style();

    this.#draw_path();
    this.#draw_mouse_points();
    this.#draw_menu();
  }

  #set_up_style() {
    this.ctx.font = `${this.font_size}px monospace`;
    this.ctx.textBaseline = "top";
    this.ctx.lineWidth = this.line_width;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
  }

  #draw_path() {
    switch (this.interpolation) {
      case PenInterpolation.Linear:
        return this.#draw_path_linear();
      case PenInterpolation.Quadratic:
        return this.#draw_path_quadratic();
      case PenInterpolation.Flow:
        return this.#draw_path_flow();
    }
  }

  #draw_path_linear() {
    this.ctx.strokeStyle = "black";
    this.ctx.beginPath();
    for (const p of this.points) {
      this.ctx.lineTo(p.x, p.y);
    }
    this.ctx.stroke();
  }

  #draw_path_quadratic() {
    this.interpolated_points = this.#interpolate_points_quadratic(this.points);
    this.ctx.strokeStyle = "black";
    this.ctx.beginPath();
    for (let i = 0; i < this.interpolated_points.length; ++i) {
      const p = this.interpolated_points[i];
      if (i === 0) {
        this.ctx.moveTo(p.x, p.y);
        continue;
      }
      this.ctx.quadraticCurveTo(p.cx, p.cy, p.x, p.y);
    }
    this.ctx.stroke();
    this.#draw_quadratic_control_points();
  }

  /**
   * Quadratic interpolation.
   *
   * Points are transformed this way :
   *  1) Replace points by the average of n and n + 1
   *  2) Use the original points as control points.
   */
  #interpolate_points_quadratic(points) {
    const interpolated_points = [];
    for (let i = 0; i < points.length - 1; ++i) {
      const p = points[i];
      const p_next = points[i + 1];

      const x = (p.x + p_next.x) / 2;
      const y = (p.y + p_next.y) / 2;
      const cx = p.x;
      const cy = p.y;

      interpolated_points.push({ x, y, cx, cy });
    }
    return interpolated_points;
  }

  #draw_quadratic_control_points() {
    const radius = Math.min(1.5 * this.line_width, 3);
    this.#draw_points(this.interpolated_points, "green", radius);
  }

  #draw_path_flow() {
    this.#compute_flow_normals();
    this.#simplify_dense_portions();
    this.#compute_flow_outline();

    this.#draw_simplified_portions();
    this.#draw_flow_path();
    this.#draw_flow_path_outline();
    this.#draw_segments();
    this.#draw_normals();
    this.#draw_flow_control_points();
  }

  #compute_flow_normals() {
    this.normals = [];
    for (let i = 0; i < this.points.length; ++i) {
      const p = this.points[i];
      if (i === 0 || i === this.points.length - 1) {
        this.normals.push({ x1: p.x, y1: p.y, x2: p.x, y2: p.y, d: 0 });
        continue;
      }

      const p_prev = this.points[i - 1];

      // Normal.
      let nx = -(p.y - p_prev.y);
      let ny = p.x - p_prev.x;

      // Resize to minmax(2, line_width).
      const min = Math.max(2, this.line_width / 2);
      const max = Math.max(min, this.line_width * 1.5);
      const d = Math.sqrt(nx ** 2 + ny ** 2);
      if (d < min) {
        const scale = min / d;
        nx *= scale;
        ny *= scale;
      } else if (d > max) {
        const scale = d / max;
        nx /= scale;
        ny /= scale;
      }

      // Center normal at point.
      const x1 = p.x - nx / 2;
      const y1 = p.y - ny / 2;
      const x2 = p.x + nx / 2;
      const y2 = p.y + ny / 2;

      this.normals.push({ x1, y1, x2, y2, d });
    }
  }

  /**
   * Slow portions look jagged if there are too many points.
   * Ensure there is a minimum distance between two points.
   * TODO: Use speed MA instead?
   */
  #simplify_dense_portions() {
    const minimum_distance = 7;
    const new_normals = [];
    let distance_accumulator = 0;
    this.points_dropped = [];
    for (let i = 0; i < this.normals.length; ++i) {
      const n = this.normals[i];
      if (i === 0 || i === this.normals.length - 1) {
        new_normals.push(n);
        continue;
      }
      distance_accumulator += n.d;
      if (distance_accumulator < minimum_distance) {
        // Drop point.
        this.points_dropped.push({
          x: (n.x1 + n.x2) / 2,
          y: (n.y1 + n.y2) / 2,
        });
        continue;
      }
      distance_accumulator = 0;
      new_normals.push(n);
    }
    this.normals = new_normals;
  }

  #compute_flow_outline() {
    this.upper_bound = this.#interpolate_points_quadratic(
      this.normals.map((n) => ({ x: n.x1, y: n.y1 })),
    );
    this.lower_bound = this.#interpolate_points_quadratic(
      this.normals.map((n) => ({ x: n.x2, y: n.y2 })).reverse(),
    );
  }

  #draw_simplified_portions() {
    if (!this.show_points) return;
    for (const p of this.points_dropped) {
      this.ctx.fillStyle = "yellow";
      this.ctx.fillCircle(p.x, p.y, Math.max(this.line_width, 7));
    }
  }

  #draw_flow_path() {
    this.ctx.fillStyle = "black";
    this.ctx.beginPath();
    this.#create_flow_path();
    this.ctx.fill();
  }

  #draw_flow_path_outline() {
    if (!this.show_points) return;
    this.ctx.strokeStyle = "magenta";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 7]);
    this.ctx.beginPath();
    this.#create_flow_path();
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  #create_flow_path() {
    if (this.normals.length < 2) return;
    const p_start = this.points.at(0);
    const p_end = this.points.at(-1);
    // Upper bound.
    for (let i = 0; i < this.upper_bound.length; ++i) {
      const p = this.upper_bound[i];
      if (i === 0) {
        this.ctx.moveTo(p.x, p.y);
        continue;
      }
      this.ctx.quadraticCurveTo(p.cx, p.cy, p.x, p.y);
    }
    // Lower bound.
    for (let i = 0; i < this.lower_bound.length; ++i) {
      const p = this.lower_bound[i];
      if (i === 0) {
        this.ctx.quadraticCurveTo(p_end.x, p_end.y, p.x, p.y);
        continue;
      }
      this.ctx.quadraticCurveTo(p.cx, p.cy, p.x, p.y);
    }
    this.ctx.quadraticCurveTo(
      p_start.x,
      p_start.y,
      this.upper_bound[0].x,
      this.upper_bound[0].y,
    );
  }

  #draw_segments() {
    if (!this.show_points) return;
    this.ctx.strokeStyle = "blue";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (const p of this.points) {
      this.ctx.lineTo(p.x, p.y);
    }
    this.ctx.stroke();
  }

  #draw_normals() {
    if (!this.show_points) return;
    this.ctx.strokeStyle = "cyan";
    this.ctx.lineWidth = 1;
    for (const n of this.normals) {
      this.ctx.strokeLine(n.x1, n.y1, n.x2, n.y2);
    }
  }

  #draw_flow_control_points() {
    const radius = Math.min(1.5 * this.line_width, 2);
    this.#draw_points(this.upper_bound, "green", radius);
    this.#draw_points(this.lower_bound, "green", radius);
  }

  #draw_mouse_points() {
    const radius = Math.min(2 * this.line_width, 4);
    this.#draw_points(this.points, "red", radius);
  }

  #draw_points(points, color, radius) {
    if (!this.show_points) return;
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    for (const p of points) {
      this.ctx.moveTo(p.x + radius, p.y);
      this.ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
    }
    this.ctx.fill();
  }

  #draw_menu() {
    const pos = (i) => [
      10,
      this.rect.y + this.font_size * i + ((i - 1) * this.font_size) / 4,
    ];

    this.ctx.fillStyle = "black";
    let i = 0;
    this.ctx.fillText(`Interpolation: ${this.interpolation}`, ...pos(++i));
    for (const interpolation in PenInterpolation) {
      ++i;
      this.ctx.fillText("* " + interpolation, ...pos(i));
      this.ctx.fillText("* _", ...pos(i));
    }
    ++i;
    this.ctx.fillText(
      `Points: ${this.show_points ? "On" : "Off"}`,
      ...pos(++i),
    );
    this.ctx.fillText("* [Space]", ...pos(++i));
    ++i;
    this.ctx.fillText(`Thickness: ${this.line_width}`, ...pos(++i));
    this.ctx.fillText("* [↑↓]", ...pos(++i));
  }
}

function main() {
  return new Pen().exec();
}

main();
