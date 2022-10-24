const A_LONG_TIME_AGO = `
A long time ago in a galaxy far,
far away....
`;

const STAR_WARS = `
STAR
WARS
`;

let OPENING_CRAWL = `
Episode IV
A NEW HOPE


It is a period of civil war.
Rebel spaceships, striking
from a hidden base, have won
their first victory against
the evil Galactic Empire.


During the battle, Rebel
spies managed to steal secret
plans to the Empire's
ultimate weapon, the DEATH
STAR, an armored space
station with enough power to
destroy an entire planet.


Pursued by the Empire's
sinister agents, Princess
Leia races home aboard her
starship, custodian of the
stolen plans that can save
her people and restore
freedom to the galaxy....
`;

const OPENING_CRAWL_77 = `
It is a period of civil war.
Rebel spaceships, striking
from a hidden base, have
won their first victory
against the evil Galactic
Empire.


During the battle, rebel
spies managed to steal
secret plans to the Empire's
ultimate weapon, the
DEATH STAR, an armored
space station with enough
power to destroy an entire
planet.


Pursued by the Empire's
sinister agents, Princess
Leia races home aboard her
starship, custodian of the
stolen plans that can save
her people and restore
freedom to the galaxy....
`;

const rlerp = (a, b, t) => (t - a) / (b - a);

class StarWars extends Painter {
  setup() {
    this.is_paused = false;
    this.do_draw_wireframe = false;
    this.text_size = 70;
    this.text_vertical_spacing = this.text_size / 2.8;
    this.accumulated_time = 0;
    this.anim = {
      a_long_time_ago: { start: 1, stop: 7, fade: 0.5 },
      star_wars: { start: 8, stop: 18, fade: 3 },
      opening_crawl: { start: 16, stop: 90, fade: 3 },
      tilt: { start: 97, stop: 107 },
    };
    this.color = {
      orange: "#ffbb00",
      blue: "#07e4fe",
      blue77: "#0066ff",
    };
    this.#init_scene();
  }

  #init_scene() {
    this.#pre_render_star_wars_logo_offscreen();
    // this.#show_offscreen_star_wars_logo(); // Debug.
    this.#pre_render_opening_craw_text_offscreen();
    // this.#show_offscreen_text(); // Debug (try reducing text_size).
    this.#pre_render_starry_night();
  }

  #pre_render_star_wars_logo_offscreen() {
    const { h, cx } = this.rect;
    this.#create_star_wars_offscreen_canvas();
    const txt = STAR_WARS.trim().split("\n");
    const font_size = (h * 0.92) / txt.length;
    const stroke_width = font_size * 0.07;
    this.star_wars_ctx.font = `bolder ${font_size * 1.17}px sans-serif`;
    this.star_wars_ctx.lineWidth = stroke_width;
    this.star_wars_ctx.textAlign = "center";
    this.star_wars_ctx.textBaseline = "top";
    this.star_wars_ctx.strokeStyle = this.color.orange;
    this.star_wars_ctx.fillStyle = "black";
    const increment = font_size - 0.05 * font_size;
    // First the orange stroke (may overlap).
    let y = 0;
    for (const text of txt) {
      this.star_wars_ctx.strokeText(text, cx, y);
      y += increment;
    }
    // Then the black fill on top (to make overlaps look seamless).
    y = 0;
    for (const text of txt) {
      this.star_wars_ctx.fillText(text, cx, y);
      y += increment;
    }
  }

  #create_star_wars_offscreen_canvas() {
    this.star_wars_ctx = this.create_ctx();
  }

  #show_offscreen_star_wars_logo() {
    this.html_root.replaceChild(
      this.star_wars_ctx.canvas,
      this.html_root.firstElementChild,
    );
  }

  #pre_render_opening_craw_text_offscreen() {
    this.#prepare_lines_of_text();
    this.#determine_text_width();
    this.#create_text_offscreen_canvas();
    this.#render_text_to_offscreen_canvas();
  }

  #prepare_lines_of_text() {
    this.text = OPENING_CRAWL.trim().split("\n");
  }

  #determine_text_width() {
    this.#apply_font_style_to_ctx(this.ctx);
    this.text_width = 0;
    for (const line of this.text) {
      this.text_width = Math.max(this.text_width, this.ctx.textWidth(line));
    }
  }

  #apply_font_style_to_ctx(ctx) {
    ctx.font = `bold ${this.text_size}px sans-serif`;
    ctx.fillStyle = this.color.orange;
    ctx.textBaseline = "top";
  }

  #create_text_offscreen_canvas() {
    const width = this.text_width;
    const height =
      this.text.length * this.text_size +
      this.text.length * this.text_vertical_spacing;
    this.text_ctx = this.create_ctx(width, height);
  }

  #render_text_to_offscreen_canvas() {
    this.#apply_font_style_to_ctx(this.text_ctx);
    for (let i = 0; i < this.text.length; ++i) {
      const line = this.text[i];
      const x = 0;
      const y = i * this.text_size + i * this.text_vertical_spacing;
      this.#draw_line_of_text(line, i, x, y);
    }
  }

  #draw_line_of_text(line, i, x, y) {
    if (this.#line_is_heading(i)) {
      this.#draw_line_of_text_centered(line, x, y);
    } else if (this.#line_is_last_line_of_paragraph(i)) {
      this.#draw_line_of_text_aligned_left(line, x, y);
    } else {
      this.#draw_line_of_text_justified(line, x, y);
    }
  }

  #line_is_heading(i) {
    const text_has_heading = this.text.length > 3 && this.text[2] === "";
    return text_has_heading && i < 2;
  }

  #line_is_last_line_of_paragraph(i) {
    return i === this.text.length - 1 || this.text[i + 1] === "";
  }

  #draw_line_of_text_centered(line, x, y) {
    const line_width = this.text_ctx.textWidth(line);
    const spacing = (this.text_width - line_width) / 2;
    this.text_ctx.fillText(line, x + spacing, y);
  }

  #draw_line_of_text_aligned_left(line, x, y) {
    this.text_ctx.fillText(line, x, y);
  }

  #draw_line_of_text_justified(line, x, y) {
    const words = line.split(" ");
    const spacing = this.#determine_spacing_between_words(words);
    let word_x = 0;
    for (const word of words) {
      this.text_ctx.fillText(word, word_x, y);
      word_x += this.text_ctx.textWidth(word) + spacing;
    }
  }

  #determine_spacing_between_words(words) {
    const line_width_without_spaces = this.text_ctx.textWidth(words.join(""));
    const spacing = this.text_width - line_width_without_spaces;
    return spacing / (words.length - 1);
  }

  #pre_render_starry_night() {
    this.#create_stars_offscreen_canvas();
    this.#fill_stars_background();
    this.#draw_random_stars();
  }

  #create_stars_offscreen_canvas() {
    this.stars_ctx = this.create_ctx();
  }

  #fill_stars_background() {
    this.stars_ctx.fillStyle = "black";
    this.stars_ctx.fillScreen();
  }

  #draw_random_stars() {
    const { w, h } = this.rect;
    const nb_stars = (w * h) / 700;
    for (let i = 0; i < nb_stars; ++i) {
      const { color, x, y, radius } = this.#create_star();
      this.stars_ctx.fillStyle = color;
      this.stars_ctx.fillCircle(x, y, radius);
    }
  }

  #create_star() {
    const { w, h, dpr } = this.rect;
    const brightness = Math.floor(Math.random() * 170) + 10;
    const color = `rgb(${brightness}, ${brightness}, ${brightness})`;
    const x = Math.floor(Math.random() * w);
    const y = Math.floor(Math.random() * h);
    const radius = Math.round(Math.random()) + 0.5 / dpr;
    return { color, x, y, radius };
  }

  #show_offscreen_text() {
    this.html_root.replaceChild(
      this.text_ctx.canvas,
      this.html_root.firstElementChild,
    );
  }

  resize_event() {
    this.#init_scene();
  }

  key_press_event(key) {
    if (key === " ") this.is_paused = !this.is_paused;
    if (key === "w") this.do_draw_wireframe = !this.do_draw_wireframe;
    if (key === "7") {
      OPENING_CRAWL = OPENING_CRAWL_77;
      this.color.blue = this.color.blue77;
      this.#init_scene();
      this.accumulated_time = 0;
    }
  }

  render(delta_time) {
    if (this.is_paused) return;
    this.accumulated_time += delta_time;
    this.#clear_screen();

    if (this.#is_animation_phase(this.anim.a_long_time_ago)) {
      this.#draw_a_long_time_ago();
    }

    if (this.accumulated_time >= this.anim.star_wars.start) {
      if (this.#is_animation_phase(this.anim.tilt)) {
        this.#draw_starry_night_tilting();
      } else {
        this.#draw_starry_night();
      }
    }

    if (this.#is_animation_phase(this.anim.opening_crawl)) {
      this.#draw_opening_crawl(delta_time);
      this.#draw_opening_crawl_horizon_gradient();
      if (this.do_draw_wireframe) {
        this.#draw_opening_crawl_bounds();
      }
    }

    // After opening crawl gradient
    if (this.#is_animation_phase(this.anim.star_wars)) {
      this.#draw_star_wars();
    }
  }

  #clear_screen() {
    this.ctx.fillStyle = "black";
    this.ctx.fillScreen();
  }

  #is_animation_phase(phase) {
    return (
      this.accumulated_time >= phase.start && this.accumulated_time < phase.stop
    );
  }

  #compute_animation_phase_progress(phase) {
    const { start, stop } = phase;
    const duration = stop - start;
    const t = this.accumulated_time - start;
    const progress = t / duration;

    return { duration, t, progress };
  }

  #draw_a_long_time_ago() {
    const { h, cx, cy } = this.rect;
    const text = A_LONG_TIME_AGO.trim().split("\n");
    const text_opacity = this.#compute_a_long_time_ago_text_opacity();

    const font_size = h * 0.08;
    this.ctx.font = `lighter ${font_size}px sans-serif`;
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";
    this.ctx.fillStyle = this.color.blue;

    const text_width = text.reduce(
      (max, str) => Math.max(this.ctx.textWidth(str), max),
      0,
    );
    const text_height =
      font_size * text.length + 0.35 * font_size * (text.length - 1);

    this.ctx.save();
    this.ctx.globalAlpha = text_opacity;
    const x = cx - text_width / 2;
    let y = cy - text_height / 2;
    for (let i = 0; i < text.length; ++i) {
      const str = text[i];
      this.ctx.fillText(str, x, y);
      y += font_size + 0.35 * font_size;
    }
    this.ctx.restore();
  }

  #compute_a_long_time_ago_text_opacity() {
    const { duration, progress } = this.#compute_animation_phase_progress(
      this.anim.a_long_time_ago,
    );
    const fade_duration_pc = this.anim.a_long_time_ago.fade / duration;

    let opacity = 0;
    if (progress > 0.5) {
      opacity =
        1 - Math.max(Math.min(rlerp(1 - fade_duration_pc, 1, progress), 1), 0);
    } else {
      opacity = Math.max(Math.min(rlerp(0, fade_duration_pc, progress), 1), 0);
    }
    return opacity;
  }

  #draw_starry_night() {
    const { w, h } = this.rect;
    this.ctx.drawImage(this.stars_ctx.canvas, 0, 0, w, h);
  }

  #draw_starry_night_tilting() {
    const { w, h, yh } = this.rect;
    const { progress } = this.#compute_animation_phase_progress(this.anim.tilt);

    const offset = -progress * h;
    this.ctx.drawImage(this.stars_ctx.canvas, 0, offset, w, h);
    // Stick same image underneath to compensate offset.
    this.ctx.drawImage(this.stars_ctx.canvas, 0, yh + offset, w, h);
  }

  #draw_star_wars() {
    const { cx, cy } = this.rect;
    const { w, h } = this.rect;
    const scale = this.#compute_star_wars_scale_factor();
    const opacity = this.#compute_star_wars_text_opacity();

    const width = w * scale;
    const height = h * scale;
    const x = cx - width / 2;
    const y = cy - height / 2;

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.drawImage(this.star_wars_ctx.canvas, x, y, width, height);
    this.ctx.restore();
  }

  #compute_star_wars_scale_factor() {
    const { progress } = this.#compute_animation_phase_progress(
      this.anim.star_wars,
    );

    // Points found by approximative measurement (1 per second),
    // interpolated linearly.
    const points = [
      [0, 1],
      [0.004, 0.99],
      [0.012, 0.88],
      [0.025, 0.8],
      [0.05, 0.7],
      [0.075, 0.63],
      [0.1, 0.57],
      [0.125, 0.51],
      [0.15, 0.46],
      [0.175, 0.42],
      [0.2, 0.39],
      [0.225, 0.35],
      [0.25, 0.33],
      [0.275, 0.3],
      [0.3, 0.28],
      [0.4, 0.21],
      [0.5, 0.17],
      [0.6, 0.14],
      [0.7, 0.12],
      [0.8, 0.1],
      [0.9, 0.083],
      [1, 0.07],
    ];

    let p0 = null;
    let p1 = null;
    let p2 = null;
    let p3 = null;
    for (let i = 0; i < points.length; ++i) {
      if (points[i][0] > progress || i === points.length - 1) {
        p0 = points[Math.max(i - 2, 0)];
        p1 = points[Math.max(i - 1, 0)];
        p2 = points[i];
        p3 = points[Math.min(i + 1, points.length - 1)];
        break;
      }
    }

    const lin_t = rlerp(p1[0], p2[0], progress);

    const factor = this.#catmull_rom(p0, p1, p2, p3, lin_t, 0.5)[1];
    return factor;
  }

  #catmull_rom(p0, p1, p2, p3, t, alpha = 0.5) {
    const get_t = (t, alpha, p0, p1) => {
      const d = [p1[0] - p0[0], p1[1] - p0[1]]; // p1 - p0
      const a = d[0] * d[0] + d[1] * d[1]; // d • d
      const b = Math.pow(a, alpha * 0.5);
      return b + t;
    };

    const lerp = (a, b, t) => (1 - t) * a + t * b;

    const t0 = 0.0;
    const t1 = get_t(t0, alpha, p0, p1);
    const t2 = get_t(t1, alpha, p1, p2);
    const t3 = get_t(t2, alpha, p2, p3);
    t = lerp(t1, t2, t);

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

  #compute_star_wars_text_opacity() {
    const { duration, progress } = this.#compute_animation_phase_progress(
      this.anim.star_wars,
    );
    const fade_duration_pc = this.anim.star_wars.fade / duration;
    const opacity =
      1 - Math.max(Math.min(rlerp(1 - fade_duration_pc, 1, progress), 1), 0);
    return opacity;
  }

  #draw_opening_crawl() {
    // As text moves towards horizon (++world_y), it gets further away
    // from the viewer and seems smaller (vertically speaking here).
    //
    // To make it look smaller, we reduce the sampling step. The further
    // away, the more spread the sampling lines, and the nearer, the
    // more condensed the sampled lines. Sampling lines more spread =
    // less of the text rendered = appears smaller/condensed.
    //
    // This is an affine function (mx+c):
    //
    //  y (thickness)
    //  │\
    //  │ \
    // 0└──\── x (world_y / z)
    //     1
    //
    // You must think of this graph rotated -90deg.
    //
    // - 0 is the bottom. So the higher the value at ds(0), the thicker
    //   the text at the bottom.
    // - 1 is the top. So the lower the value at ds(1), the thinner the
    //   text at the top.
    //
    // - Increasing m (--m, towards -inf.) increases the steepness of
    //   the curve, so the relative difference of thickness between the
    //   thickest part and the thinnest part.
    // - Increasing c (++c, towards +inf.) increases the Y of the curve,
    //   so the absolute "average" thickness of the text.
    //
    // c must be big enough so ds(1)>0 (i.e., c>abs(m), because we don't
    // want negative values) and small enough to compensate the stretch.
    const depth_scaling = (x) => {
      const m = -0.6 / this.rect.dpr;
      const c = 0.84 / this.rect.dpr;
      return m * x + c;
    };

    this.#compute_opening_crawl_horizon();

    const { duration, progress } = this.#compute_animation_phase_progress(
      this.anim.opening_crawl,
    );
    const fade_duration_pc = this.anim.opening_crawl.fade / duration;
    const opacity =
      1 - Math.max(Math.min(rlerp(1 - fade_duration_pc, 1, progress), 1), 0);
    this.ctx.save();
    this.ctx.globalAlpha = opacity;

    // `progress` is a value between 0 and 1, corresponding to bottom
    // and top in world space. But since the text gets more and more
    // condensed as it goes up, "1" which should represent the top, is
    // not the top anymore, because many rows of pixels have been
    // dropped (to make the text further away appear small). An increase
    // of 1 unit of progress, does not move the text 1 unit vertically,
    // but 1*ds units vertically.
    //
    // To compensate for the shrinkage, we divide by ds (depth scale
    // factor) (which increases the value really, since 0 < ds < 1). The
    // depth_scaling value is used to shrink the text, so we use the
    // same value for the shrinkage-compensation in pc_anim.
    //
    // The multiplier at the end is just there to fine-tune the speed
    // of the crawl. The higher the multiplier, the faster the text
    // moves. In the real intro, the fade out happens very late, when
    // the last paragraph is already gradient-ing out. Use this
    // multiplier to adjust the timing.
    const pc_anim = (progress / depth_scaling(1)) * 1.5;
    const screen_text_bottom = this.#world_y_to_screen_y(0);
    const screen_text_top = this.#world_y_to_screen_y(pc_anim);
    const world_horizon = this.horizon.world.far;

    const nb_pixels_to_scan = screen_text_bottom - screen_text_top; // y inverted
    const scanline_height = 1 / this.rect.dpr;
    for (
      let scanline = 0;
      scanline < nb_pixels_to_scan;
      scanline += scanline_height
    ) {
      const world_row_y = this.#screen_y_to_world_y(
        screen_text_bottom - scanline,
      );
      const world_z = world_row_y / world_horizon;
      if (world_z > 1) continue; // Beyond horizon.

      const z_scale = depth_scaling(world_z);

      const { x_left, x_right } =
        this.#compute_opening_crawl_screen_bounds_for_world_y(world_row_y);
      const x_width = x_right - x_left;
      const screen_y = this.#world_y_to_screen_y(world_row_y);

      this.ctx.drawImage(
        // Sample line of pixels from pre-rendered text.
        this.text_ctx.canvas,
        0, // sx
        nb_pixels_to_scan - scanline / z_scale, // sy
        this.text_ctx.canvas.width, // sw
        scanline_height, // sh
        // Draw sampled line onto canvas between bounds.
        x_left, // dx
        screen_y, // dy
        x_width, // dw
        scanline_height, // dh
      );
    }

    this.ctx.restore();
  }

  #compute_opening_crawl_horizon() {
    const horizon = 537 / 609;

    const world = {
      far: horizon,
      near: horizon - 0.07, // Bottom of gradient
    };

    const screen = {
      far: this.#world_y_to_screen_y(world.far),
      near: this.#world_y_to_screen_y(world.near),
    };

    this.horizon = { world, screen };
  }

  #compute_opening_crawl_screen_bounds_for_world_y(world_y) {
    const world_x_right = this.#world_y_to_world_x(world_y);
    const world_x_left = -world_x_right;
    return {
      x_left: this.#world_x_to_screen_x(world_x_left),
      x_right: this.#world_x_to_screen_x(world_x_right),
    };
  }

  #draw_opening_crawl_horizon_gradient() {
    const far_y = this.horizon.screen.far;
    const near_y = this.horizon.screen.near;
    const far_x_bounds = this.#screen_bounds_for_world_y(
      this.horizon.world.far,
    );
    const near_x_bounds = this.#screen_bounds_for_world_y(
      this.horizon.world.near,
    );
    const overflow = 1; // Prevent text pixels leaking out of gradient.

    this.ctx.fillStyle = this.#make_opening_crawl_horizon_gradient();
    this.ctx.beginPath();
    this.ctx.moveTo(far_x_bounds.left - overflow, far_y - overflow);
    this.ctx.lineTo(far_x_bounds.right + overflow, far_y - overflow);
    this.ctx.lineTo(near_x_bounds.right + overflow, near_y);
    this.ctx.lineTo(near_x_bounds.left - overflow, near_y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  #make_opening_crawl_horizon_gradient() {
    const gradient = this.ctx.createLinearGradient(
      0,
      this.horizon.screen.far,
      0,
      this.horizon.screen.near,
    );
    gradient.addColorStop(0.1, "black");
    gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.5)");
    gradient.addColorStop(1, "transparent");
    return gradient;
  }

  #draw_opening_crawl_bounds() {
    this.#compute_opening_crawl_bounds();

    const { xw } = this.rect;
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 1;

    // Slopes
    this.ctx.strokeLine(
      this.opening_crawl.screen.bottom.left.x,
      this.opening_crawl.screen.bottom.left.y,
      this.opening_crawl.screen.top.left.x,
      this.opening_crawl.screen.top.left.y,
    );
    this.ctx.strokeLine(
      this.opening_crawl.screen.bottom.right.x,
      this.opening_crawl.screen.bottom.right.y,
      this.opening_crawl.screen.top.right.x,
      this.opening_crawl.screen.top.right.y,
    );

    // Horizon
    this.ctx.strokeLine(
      0,
      this.horizon.screen.far,
      xw,
      this.horizon.screen.far,
    );
    this.ctx.strokeLine(
      0,
      this.horizon.screen.near,
      xw,
      this.horizon.screen.near,
    );
  }

  #compute_opening_crawl_bounds() {
    const world_bottom_y = 0;
    const world_bottom_x = this.#world_y_to_world_x(world_bottom_y);
    const world_top_y = 1;
    const world_top_x = this.#world_y_to_world_x(world_top_y);

    const world = {
      bottom: {
        left: { x: -world_bottom_x, y: world_bottom_y },
        right: { x: world_bottom_x, y: world_bottom_y },
      },
      top: {
        left: { x: -world_top_x, y: world_top_y },
        right: { x: world_top_x, y: world_top_y },
      },
    };

    const screen = {
      bottom: {
        left: this.#world_to_screen(world.bottom.left),
        right: this.#world_to_screen(world.bottom.right),
      },
      top: {
        left: this.#world_to_screen(world.top.left),
        right: this.#world_to_screen(world.top.right),
      },
    };

    this.opening_crawl = { world, screen };
  }

  /**
   * Given world Y, what is the world X of the opening crawl bound?
   *
   *       +1y
   *       /│\
   * -1x ─/─┼─\─ +1x
   *     /  │  \
   *       0y
   *
   * The right (+) opening crawl bound is defined by an affine function,
   * and the left (+) bound by its additive inverse:
   *
   *   Right bound: mx+c
   *   Left bound: -right
   *
   * The text is rendered from bottom to top (0y -> 1y). Thus, for every
   * point (pixel) on Y, we need to know how far the text spreads on X.
   *
   * This means finding the inverse image:
   *
   *       y = mx+c
   *   <=> x = (y-c)/m
   *
   * @param {Number} y
   * @returns {Number}
   */
  #world_y_to_world_x(y) {
    // World is 1:1, but the original movie (where the measurement comes
    // from) is 2.35:1. It must be converted to
    const movie_ar = 2.35;
    const m = -(545 / 519) / movie_ar;
    const c = 1.09;
    return (y - c) / m;
  }

  /**
   * World space:
   *
   *         1
   *     ┌───┼───┐
   * -1 ─┼───┼───┼─ +1
   *     └───┼───┘
   *         0
   *
   * @param {{x: Number, y: Number}} p
   * @returns {{x: Number, y: Number}}
   */

  #world_to_screen(p) {
    const x = this.#world_x_to_screen_x(p.x);
    const y = this.#world_y_to_screen_y(p.y);
    return { x, y };
  }

  #world_x_to_screen_x(x) {
    const { w, ar } = this.rect;
    return ((x / ar + 1) / 2) * w;
  }

  #world_y_to_screen_y(y) {
    const { h } = this.rect;
    return (1 - y) * h;
  }

  #screen_y_to_world_y(y) {
    const { h } = this.rect;
    return 1 - y / h;
  }

  #screen_bounds_for_world_y(y) {
    const world_x = this.#world_y_to_world_x(y);
    const left = this.#world_x_to_screen_x(-world_x);
    const right = this.#world_x_to_screen_x(world_x);
    return { left, right };
  }
}

function main() {
  return new StarWars().exec();
}

main();
