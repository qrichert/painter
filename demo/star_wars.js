// Justify text, render to offscreen canvas
// Context.setTransform() to skew ? Else project 3D & map
// https://stackoverflow.com/a/3631683
// http://www.senocular.com/flash/tutorials/transformmatrix/
// https://html.spec.whatwg.org/multipage/canvas.html#transformations
// https://www.w3resource.com/html5-canvas/html5-canvas-matrix-transforms.php

// 3D not a good idea. It's simple to use mx+c for text borders.
// First convert y=mx+c to x=y/m-c, because we iterate by row, start
// at the top then go down. so to find the left/right bound of a line
// x=y/m-c, and then bounnds are -x and +x (if we do 0 in the middle
// coordinates)
// Then we can iterate:
// for y in range(top, bottom):
//   for x in range(-boundx, +boundx)
//     sample_pixel(x, y)
//     put_pixel(x, y)
// Or better performance per line, by letting canvas resize the line
//     sample_line(0, %y_to_y, 1, %y_to_y)
//     draw_line/image(-boundx, y, +boundx_y)

const A_LONG_TIME_AGO = `
A long time ago in a galaxy far,
far away....
`;

const OPENING_CRAWL = `
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

class StarWars extends Painter {
  setup() {
    this.is_paused = false;
    this.do_draw_wireframe = false;
    this.text_size = 70;
    this.text_vertical_spacing = this.text_size / 2.8;
    this.accumulated_time = 0;
    this.pc_anim = -0.7; //TODO
    this.#init_scene();
  }

  #init_scene() {
    this.#pre_render_opening_craw_text_offscreen();
    // this.#show_offscreen_text(); // Debug (try reducing text_size).
    this.#pre_render_starry_night();
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
    ctx.fillStyle = "#ffbb00";
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
      this.html_root.firstElementChild
    );
  }

  resize_event() {
    this.#init_scene();
  }

  key_press_event(key) {
    if (key === " ") this.is_paused = !this.is_paused;
    if (key === "w") this.do_draw_wireframe = !this.do_draw_wireframe;
  }

  render(delta_time) {
    if (this.is_paused) return;
    this.accumulated_time += delta_time;
    this.ctx.clear();
    this.#draw_starry_night();
    this.#compute_opening_crawl_horizon();
    this.#draw_opening_crawl(delta_time);
    this.#draw_opening_crawl_horizon_gradient();
    if (this.do_draw_wireframe) {
      this.#draw_opening_crawl_bounds();
    }

    // TODO
    if (this.accumulated_time < 2) {
      this.ctx.fillStyle = "black";
      this.ctx.fillScreen();
      const { cx, cy } = this.rect;
      const fsize = 50;
      this.ctx.font = `lighter ${fsize}px sans-serif`;
      this.ctx.textAlign = "left";
      this.ctx.textBaseline = "top";
      this.ctx.fillStyle = "#0066ff";
      this.ctx.fillStyle = "#07e4fe";
      const txt = A_LONG_TIME_AGO.trim().split("\n");
      const txt_w = this.ctx.textWidth(txt[0]);
      this.ctx.fillText(txt[0], cx - txt_w / 2, cy - fsize * 1.17);
      this.ctx.fillText(txt[1], cx - txt_w / 2, cy + fsize * 0.17);
    }
  }

  #draw_starry_night() {
    // TODO
    const { w, h, yh } = this.rect;
    // const scroll = -this.pc_anim * 0.4 * h;
    const scroll = 0;
    this.ctx.drawImage(this.stars_ctx.canvas, 0, scroll, w, h);
    // Repeat it underneath for vpan.
    this.ctx.drawImage(this.stars_ctx.canvas, 0, yh + scroll, w, h);
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

  #draw_opening_crawl(delta_time) {
    this.pc_anim += 0.16 * delta_time; // TODO: this.accmulated_time
    const screen_text_bottom = this.#world_y_to_screen_y(0);
    const screen_text_top = this.#world_y_to_screen_y(this.pc_anim);
    const world_horizon = this.horizon.world.far;

    // --m = text more condensed vertically
    // c must be big enough so ds(1)>0 (ie c > m) and small enough to
    // compensate stretch
    // As text moves towards horizon (++world_y), it gets further away
    // from the viewer and seems smaller.
    // To achieve this effect, we artificially reduce the sampling step.
    // The further away, the more spread the sampling lines, and the
    // nearer, the nearer the sampled lines. Sampling lines more spread
    // = less of the text rendered = appears smaller/condensed
    const depth_scaling = (x) => -0.3 * x + 0.42;

    const nb_pixels_to_scan = screen_text_bottom - screen_text_top; //y inverted
    const scanline_height = 1 / this.rect.dpr;
    for (
      let scanline = 0;
      scanline < nb_pixels_to_scan;
      scanline += scanline_height
    ) {
      const world_row_y = this.#screen_y_to_world_y(
        screen_text_bottom - scanline
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
        scanline_height // dh
      );
    }
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
      this.horizon.world.far
    );
    const near_x_bounds = this.#screen_bounds_for_world_y(
      this.horizon.world.near
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
      this.horizon.screen.near
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

    // Slopes
    this.ctx.strokeLine(
      this.opening_crawl.screen.bottom.left.x,
      this.opening_crawl.screen.bottom.left.y,
      this.opening_crawl.screen.top.left.x,
      this.opening_crawl.screen.top.left.y
    );
    this.ctx.strokeLine(
      this.opening_crawl.screen.bottom.right.x,
      this.opening_crawl.screen.bottom.right.y,
      this.opening_crawl.screen.top.right.x,
      this.opening_crawl.screen.top.right.y
    );

    // Horizon
    this.ctx.strokeLine(
      0,
      this.horizon.screen.far,
      xw,
      this.horizon.screen.far
    );
    this.ctx.strokeLine(
      0,
      this.horizon.screen.near,
      xw,
      this.horizon.screen.near
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
