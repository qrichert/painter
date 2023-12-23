const ScreenSaverInterpolation = {
  Fade: "Fade",
  Replace: "Clear",
  Add: "Add",
};

class ScreenSaver extends Painter {
  setup() {
    this.nb_lines = 3;
    this.#create_points();
    this.hue = 360 * this.#rand();
    this.fix_delta_time = 0.033; // Fix, so lines are spaced evenly.
    this.accumulated_time = this.fix_delta_time; // Render immediately.
    this.interpolation = ScreenSaverInterpolation.Fade;
    this.saturation = 70;
    this.ctx.canvas.style.backgroundColor = "black";
    this.ctx.canvas.style.cursor = "none";
  }

  #create_points() {
    this.points = [];
    for (let i = 0; i < this.nb_lines * 2; ++i) {
      this.points.push({
        x: this.#rand(),
        y: this.#rand(),
        vx: this.#rand(0.1, 0.3, true),
        vy: this.#rand(0.1, 0.3, true),
      });
    }
  }

  #rand(min = 0, max = 1, signed = false) {
    const sign = !signed ? 1 : Math.random() >= 0.5 ? 1 : -1;
    return (Math.random() * (max - min) + min) * sign;
  }

  key_press_event(key) {
    switch (key.toUpperCase()) {
      case " ":
        switch (this.interpolation) {
          case ScreenSaverInterpolation.Fade:
            this.interpolation = ScreenSaverInterpolation.Replace;
            break;
          case ScreenSaverInterpolation.Replace:
            this.interpolation = ScreenSaverInterpolation.Add;
            break;
          case ScreenSaverInterpolation.Add:
          default:
            this.interpolation = ScreenSaverInterpolation.Fade;
            break;
        }
        break;
      case "ARROWUP":
        this.saturation = Math.min(this.saturation + 10, 100);
        break;
      case "ARROWDOWN":
        this.saturation = Math.max(this.saturation - 10, 0);
        break;
    }
  }

  render(delta_time) {
    if (!this.#can_render_this_frame(delta_time)) return;

    this.#update_points_in_world_space();
    this.#update_points_in_screen_space();
    this.#detect_collisions_with_border();

    this.#draw_background();
    this.#draw_lines();
  }

  #can_render_this_frame(delta_time) {
    this.accumulated_time += delta_time;
    if (this.accumulated_time < this.fix_delta_time) {
      return false;
    }
    this.accumulated_time %= this.fix_delta_time;
    return true;
  }

  #update_points_in_world_space() {
    for (const p of this.points) {
      p.x += (p.vx / this.rect.ar) * this.fix_delta_time;
      p.y += p.vy * this.fix_delta_time;
    }
  }

  #update_points_in_screen_space() {
    this.screen_points = this.points.map((p) => this.#world_to_screen(p));
  }

  #world_to_screen(p) {
    const x = p.x * this.rect.w;
    const y = p.y * this.rect.h;
    return { x, y };
  }

  #detect_collisions_with_border() {
    for (const p of this.points) {
      if (p.x < 0) {
        p.x = 0;
        p.vx *= -1;
      } else if (p.x > 1) {
        p.x = 1;
        p.vx *= -1;
      }

      if (p.y < 0) {
        p.y = 0;
        p.vy *= -1;
      } else if (p.y > 1) {
        p.y = 1;
        p.vy *= -1;
      }
    }
  }

  #draw_background() {
    const opacity = this.#determine_background_opacity();
    this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    this.ctx.fillScreen();
  }

  #determine_background_opacity() {
    switch (this.interpolation) {
      case ScreenSaverInterpolation.Replace:
        return 1;
      case ScreenSaverInterpolation.Add:
        return 0;
      case ScreenSaverInterpolation.Fade:
      default:
        return 2 * this.fix_delta_time;
    }
  }

  #draw_lines() {
    const hue = this.hue++ % 360;
    const hue_step = 360 / this.nb_lines;
    this.ctx.lineWidth = 1;

    for (let i = 0; i < this.nb_lines; ++i) {
      this.#draw_line(i * 2, (hue + i * hue_step) % 360);
    }
  }

  #draw_line(i, hue) {
    this.ctx.save();
    this.ctx.strokeStyle = `hsl(${hue}, ${this.saturation}%, 50%)`;
    this.ctx.strokeLine(
      this.screen_points[i].x,
      this.screen_points[i].y,
      this.screen_points[i + 1].x,
      this.screen_points[i + 1].y,
    );
    this.ctx.restore();
  }
}

function main() {
  // Press space to change mode.
  // Up and Down arrows for saturation.
  return new ScreenSaver().exec();
}

main();
