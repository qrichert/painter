// https://codepen.io/Mamboleoo/pen/GRJKoBw
// https://www.youtube.com/watch?v=RCVxXgJ8xSk

const PARTICLE_SIZE = 2.7;

/**
 * Return random value between min and max boundaries.
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function rand(min = 0, max = 1) {
  return Math.random() * (max - min) + min;
}

/**
 * CSS-like cover effect for child element.
 *
 * @param {number} container_width
 * @param {number} container_height
 * @param {number} child_width
 * @param {number} child_height
 * @returns {[number,number]}
 */
function object_fit_cover(
  container_width,
  container_height,
  child_width,
  child_height,
) {
  const container_ar = container_width / container_height;
  const child_ar = child_width / child_height;

  let final_width, final_height;

  if (container_ar > child_ar) {
    /*
     *  ┌──┬───────┬──┐
     *  │  │       │  │
     *  │  │       │  │
     *  │  │       │  │
     *  └──┴───────┴──┘
     */
    final_width = container_width;
    final_height = container_width / child_ar;
  } else {
    /*
     *  ┌─────────────┐
     *  ├─────────────┤
     *  │             │
     *  ├─────────────┤
     *  └─────────────┘
     */
    final_width = container_height * child_ar;
    final_height = container_height;
  }

  return [final_width, final_height];
}

/**
 * Calculate perceived luminance of RGB color.
 *
 * The human eye doesn't perceive red, green and blue the same.
 * The weights (0.299, 0.587, 0.114) correspond to the perceived
 * brightness of each color channel (R, G, B).
 *
 * https://en.wikipedia.org/wiki/Luma_(video)
 *
 * @param {number} red
 * @param {number} green
 * @param {number} blue
 * @returns {number}
 */
function perceived_luminance(red, green, blue) {
  return red * 0.299 + green * 0.587 + blue * 0.114;
}

/**
 * Map value in range [A...B] to range [C...D] keeping proportions.
 *
 * @param {number} value
 * @param {number} source_min
 * @param {number} source_max
 * @param {number} target_min
 * @param {number} target_max
 * @returns {number}
 */
function linear_scale(value, source_min, source_max, target_min, target_max) {
  return (
    ((value - source_min) / (source_max - source_min)) *
      (target_max - target_min) +
    target_min
  );
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (rand(0.3, 0.7) / 3) * 9.5;
    this.vy = (rand(3, 7) / 3) * 9.5;
  }
}

class ParticleRain extends Painter {
  setup() {
    this.is_paused = false;
    this.is_grayscale = false;
    this.is_debug = false;

    this.#init_scene();
  }

  #init_scene() {
    this.#prepare_image_ctx();

    this.ctx.fillStyle = "black";
    this.ctx.fillScreen();

    const nb_particles = this.rect.w * 5;

    this.particles = [];
    for (let i = 0; i < nb_particles; ++i) {
      this.particles.push(
        new Particle(Math.random() * this.rect.w, Math.random() * this.rect.h),
      );
    }
  }

  #prepare_image_ctx() {
    const [width, height] = object_fit_cover(
      this.rect.w,
      this.rect.h,
      IMAGE.width,
      IMAGE.height,
    );

    this.image_ctx = this.create_ctx();
    this.image_ctx.drawImage(
      IMAGE,
      this.rect.cx - width / 2,
      this.rect.cy - height / 2,
      width,
      height,
    );

    this.pxctx.setContext(this.image_ctx);
    this.pxctx.refreshBuffer();
  }

  resize_event() {
    this.#init_scene();
  }

  key_press_event(key) {
    if (key === " ") this.is_paused = !this.is_paused;
    if (key === "g") this.is_grayscale = !this.is_grayscale;
    if (key === "d") this.is_debug = !this.is_debug;
  }

  render(delta_time) {
    if (this.is_paused) return;

    this.#debug_draw_image();

    this.#draw_fade();

    for (const particle of this.particles) {
      this.#render_particle(particle, delta_time);
    }
  }

  #draw_fade() {
    this.ctx.save();
    this.ctx.fillStyle = "black";
    this.ctx.globalAlpha = 0.05;
    this.ctx.fillScreen();
    this.ctx.restore();
  }

  #render_particle(particle, delta_time) {
    const px = this.#get_pixel(particle);

    const brightness = this.#compute_brightness(px);
    const speed_factor = this.#compute_speed_factor(brightness);
    const opacity_factor = this.#compute_opacity_factor(brightness);

    this.#move_particle(particle, speed_factor, delta_time);
    this.#reset_particle_if_it_fell_out(particle);

    // Do not draw very dark particles to improve performance on
    // black-dominant images.
    if (this.#is_very_dark_particle(brightness)) return;

    this.#convert_pixel_to_grayscale_if_needed(px, brightness);

    this.#draw_particle(px, opacity_factor, particle);
  }

  #get_pixel(particle) {
    const px = this.pxctx.getPixel(
      ...this.pxctx.screenToWorld(particle.x, particle.y),
    );
    return { red: px[0], green: px[1], blue: px[2] };
  }

  #compute_brightness(px) {
    return perceived_luminance(px.red, px.green, px.blue);
  }

  #compute_speed_factor(brightness) {
    return linear_scale(1 - brightness / 255, 0, 1, 0.2, 1);
  }

  #compute_opacity_factor(brightness) {
    return linear_scale(brightness / 255, 0, 1, 0.3, 1);
  }

  #move_particle(particle, speed_factor, delta_time) {
    const { dpr } = this.rect;
    particle.x += particle.vx * speed_factor * delta_time * dpr;
    particle.y += particle.vy * speed_factor * delta_time * dpr;
  }

  #reset_particle_if_it_fell_out(particle) {
    if (particle.x > this.rect.xw) {
      particle.x = -PARTICLE_SIZE;
    }
    if (particle.y > this.rect.yh) {
      particle.x = Math.random() * this.rect.w;
      particle.y = -PARTICLE_SIZE;
    }
  }

  #is_very_dark_particle(brightness) {
    return brightness < 5;
  }

  #convert_pixel_to_grayscale_if_needed(px, brightness) {
    if (!this.is_grayscale) return;
    px.red = brightness;
    px.green = brightness;
    px.blue = brightness;
  }

  #draw_particle(px, opacity_factor, particle) {
    this.ctx.fillStyle = `rgba(${px.red}, ${px.green}, ${px.blue}, ${opacity_factor})`;
    this.ctx.fillCircle(particle.x, particle.y, PARTICLE_SIZE);
  }

  #debug_draw_image() {
    if (!this.is_debug) return;
    this.ctx.drawImage(
      this.image_ctx.canvas,
      this.rect.x,
      this.rect.y,
      this.rect.w,
      this.rect.h,
    );
  }
}

function main() {
  return new ParticleRain().exec();
}

main();
