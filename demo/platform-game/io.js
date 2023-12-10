class Inputs {
  constructor(keyboard, hero) {
    this.keyboard = keyboard;
    this.hero = hero;
    this.html_root = document.getElementById("root");
  }

  key_press_event(key) {
    switch (key) {
      case "?":
        return (IS_DEBUG = !IS_DEBUG);
      case " ":
        return this.hero.jump();
    }

    switch (key) {
      case "1":
        this.hero.animation_phases = AnimationPhases.Character.Hero.NinjaFrog;
        break;
      case "2":
        this.hero.animation_phases = AnimationPhases.Character.Hero.PinkMan;
        break;
      case "3":
        this.hero.animation_phases = AnimationPhases.Character.Hero.MaskDude;
        break;
      case "4":
        this.hero.animation_phases = AnimationPhases.Character.Hero.VirtualGuy;
        break;
    }

    if (!IS_DEBUG) return;
    switch (key) {
      case "h":
        return this.hero.hit();
      case "k":
        return this.hero.kill();
      case "ArrowDown":
        return this.html_root.classList.add("upside-down");
    }
  }

  key_release_event(key) {
    if (!IS_DEBUG) return;
    switch (key) {
      case "ArrowDown":
        return this.html_root.classList.remove("upside-down");
    }
  }

  move_hero() {
    if (this.hero.is_dead) return;
    this.hero.vx = 0;
    if (this.keyboard.is_key_pressed("d")) this.hero.vx = this.hero.speed;
    if (this.keyboard.is_key_pressed("q")) this.hero.vx = -this.hero.speed;
  }
}

/**
 * The world uses screen coordinates. A world pixel = a screen pixel.
 * This makes drawing sprites etc. easier. But the world extends beyond
 * 0, 0, screen width, screen height. In fact, the canvas' origin (0, 0)
 * really doesn't mean much at all. The hero can go from -inf. to +inf.
 * in X. In Y the movement is capped only by the terrain, the hero
 * can neither go higher than the highest block, nor lower than the
 * floor, but this is not a limitation of the coordinates system, this
 * is just how the world is supposed to be.
 *
 * Implementation detail: We offset the world relative to the camera,
 * rather than the camera relative to the world. This inverts movement
 * (--x right, ++x left, --y up, ++y down), but we don't need to know
 * about this outside of the camera, and it simplifies rendering a lot
 * as it lets us take advantage of canvas' transform() function.
 * Basically, transform() handles most of the camera's behaviour for us.
 *
 * ┌───────────────────┐
 * │         ▲         │
 * │         │-y       │
 * │         ▼         │
 * │◄──────► ┌──────┐  │
 * │   -x    │Camera│  │
 * │         └──────┘  │
 * └───────────────────┘
 */
class Camera {
  constructor(rect, ctx, hero) {
    this.rect = rect;
    this.ctx = ctx;
    this.hero = hero;
  }

  get x() {
    const hero_world_x = this.hero.hitbox.abs_cx;
    const half_screen = this.rect.cx;
    const x = -hero_world_x + half_screen;
    return x;
  }

  get y() {
    const hero_world_y = this.hero.hitbox.abs_cy;
    const half_screen = this.rect.cy;
    const y = -hero_world_y + half_screen;

    // Clamp at bottom of world.
    const screen_height = this.rect.yh;
    const world_bottom = this.rect.yh;
    if (y + screen_height < world_bottom) {
      const overflow = world_bottom - (y + screen_height);
      return y + overflow;
    }

    return y;
  }

  render(delta_time, objects) {
    this.ctx.save();
    this.ctx.translate(this.x, this.y);

    for (const object of objects) {
      object.render(delta_time);
    }

    this.ctx.restore();
  }
}
