/**
 * @param {string} sprite_id
 * @returns {OffscreenCanvas}
 */
function load_sprite(sprite_id) {
  /** @type {HTMLImageElement} */
  const sprite = document.getElementById(sprite_id);
  const canvas = new OffscreenCanvas(sprite.width, sprite.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(sprite, 0, 0);
  return canvas;
}

/**
 * @param {OffscreenCanvas} sprite
 * @returns {OffscreenCanvas}
 */
function mirror_sprite(sprite) {
  const canvas = new OffscreenCanvas(sprite.width, sprite.height);
  const ctx = canvas.getContext("2d");
  ctx.scale(-1, 1);
  ctx.drawImage(sprite, -sprite.width, 0);
  return canvas;
}

/**
 * @readonly
 * @enum {SpriteDirection}
 */
const SpriteDirection = { None: "None", Left: "Left", Right: "Right" };

class SpriteAnimation {
  /**
   * @param {SpriteDirection} direction
   * @param {OffscreenCanvas} spritesheet
   * @param {number} nb_frames
   * @param {number} sprite_width
   * @param {number} sprite_height
   * @param {number} size_factor
   * @param {number} offset_x
   * @param {number} offset_y
   */
  constructor(
    direction,
    spritesheet,
    nb_frames,
    sprite_width,
    sprite_height,
    size_factor = 1,
    offset_x = 0,
    offset_y = 0,
  ) {
    this.direction = direction;
    this.spritesheet = spritesheet;
    this.nb_frames = nb_frames;
    this.sprite_width = sprite_width;
    this.sprite_height = sprite_height;
    this.size_factor = size_factor;
    // Position in spritesheet.
    this.offset_x = offset_x;
    this.offset_y = offset_y;
  }

  /*
   * Implementation detail : We only have right-facing sprites.
   * Left-facing sprites are the mirrored copy of the original images.
   * This means we must invert the order of the frames of left-facing
   * animations, or it will play backwards.
   */
  correct_current_frame(current_frame) {
    if (this._is_mirrored()) {
      current_frame = this.nb_frames - current_frame - 1;
    }
    return current_frame;
  }

  _is_mirrored() {
    return this.direction === SpriteDirection.Left;
  }
}

// We assume that the conventional way is the character looking to the
// right, but on some sprites it is looking to the left. So we need a
// way to differentiate these sprites in order to play the animation
// in the correct order on the mirrored version.
class LeftFacingSpriteAnimation extends SpriteAnimation {
  _is_mirrored() {
    return this.direction === SpriteDirection.Right;
  }
}

/** @type {{[key: string]: {[key: string]: SpriteAnimation}}} */
const AnimationPhases = {
  Terrain: {
    GroundBlock: {
      Idle: new SpriteAnimation(
        SpriteDirection.None,
        load_sprite("terrain"),
        1,
        48,
        48,
        1,
        96,
        0,
      ),
    },
    ObstacleBlock: {
      Idle: new SpriteAnimation(
        SpriteDirection.None,
        load_sprite("terrain"),
        1,
        32,
        32,
        1,
        208,
        16,
      ),
    },
  },
  Item: {
    Fruit: {
      Apple: new SpriteAnimation(
        SpriteDirection.None,
        load_sprite("fruit-apple"),
        17,
        32,
        32,
      ),
      Bananas: new SpriteAnimation(
        SpriteDirection.None,
        load_sprite("fruit-bananas"),
        17,
        32,
        32,
      ),
      Cherries: new SpriteAnimation(
        SpriteDirection.None,
        load_sprite("fruit-cherries"),
        17,
        32,
        32,
      ),
      Kiwi: new SpriteAnimation(
        SpriteDirection.None,
        load_sprite("fruit-kiwi"),
        17,
        32,
        32,
      ),
      Melon: new SpriteAnimation(
        SpriteDirection.None,
        load_sprite("fruit-melon"),
        17,
        32,
        32,
      ),
      Orange: new SpriteAnimation(
        SpriteDirection.None,
        load_sprite("fruit-orange"),
        17,
        32,
        32,
      ),
      Pineapple: new SpriteAnimation(
        SpriteDirection.None,
        load_sprite("fruit-pineapple"),
        17,
        32,
        32,
      ),
      Strawberry: new SpriteAnimation(
        SpriteDirection.None,
        load_sprite("fruit-strawberry"),
        17,
        32,
        32,
      ),
      Collected: new SpriteAnimation(
        SpriteDirection.None,
        load_sprite("fruit-collected"),
        6,
        32,
        32,
      ),
    },
  },
  Props: {
    DustParticle: new SpriteAnimation(
      SpriteDirection.None,
      load_sprite("props-dust-particle"),
      1,
      16,
      16,
    ),
  },
  Character: {
    Enemy: {
      Slime: {
        IdleRunRight: new LeftFacingSpriteAnimation(
          SpriteDirection.Right,
          mirror_sprite(load_sprite("enemy-slime-idle-run")),
          10,
          44,
          30,
        ),
        IdleRunLeft: new LeftFacingSpriteAnimation(
          SpriteDirection.Left,
          load_sprite("enemy-slime-idle-run"),
          10,
          44,
          30,
        ),
        HitRight: new LeftFacingSpriteAnimation(
          SpriteDirection.Right,
          mirror_sprite(load_sprite("enemy-slime-hit")),
          5,
          44,
          30,
        ),
        HitLeft: new LeftFacingSpriteAnimation(
          SpriteDirection.Left,
          load_sprite("enemy-slime-hit"),
          5,
          44,
          30,
        ),
        SlimeParticle: new SpriteAnimation(
          SpriteDirection.None,
          load_sprite("enemy-slime-particles"),
          4,
          16,
          16,
        ),
      },
    },
    Hero: {
      NinjaFrog: {
        AppearingRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-appearing"),
          7,
          96,
          96,
          3,
        ),
        AppearingLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-appearing")),
          7,
          96,
          96,
          3,
        ),
        IdleRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-ninja-frog-idle"),
          11,
          32,
          32,
        ),
        IdleLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-ninja-frog-idle")),
          11,
          32,
          32,
        ),
        RunRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-ninja-frog-run"),
          12,
          32,
          32,
        ),
        RunLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-ninja-frog-run")),
          12,
          32,
          32,
        ),
        JumpRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-ninja-frog-jump"),
          1,
          32,
          32,
        ),
        JumpLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-ninja-frog-jump")),
          1,
          32,
          32,
        ),
        DoubleJumpRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-ninja-frog-double-jump"),
          6,
          32,
          32,
        ),
        DoubleJumpLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-ninja-frog-double-jump")),
          6,
          32,
          32,
        ),
        WallSlideRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-ninja-frog-wall-jump"),
          5,
          32,
          32,
        ),
        WallSlideLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-ninja-frog-wall-jump")),
          5,
          32,
          32,
        ),
        FallRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-ninja-frog-fall"),
          1,
          32,
          32,
        ),
        FallLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-ninja-frog-fall")),
          1,
          32,
          32,
        ),
        HitRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-ninja-frog-hit"),
          7,
          32,
          32,
        ),
        HitLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-ninja-frog-hit")),
          7,
          32,
          32,
        ),
      },
      PinkMan: {
        AppearingRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-appearing"),
          7,
          96,
          96,
          3,
        ),
        AppearingLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-appearing")),
          7,
          96,
          96,
          3,
        ),
        IdleRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-pink-man-idle"),
          11,
          32,
          32,
        ),
        IdleLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-pink-man-idle")),
          11,
          32,
          32,
        ),
        RunRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-pink-man-run"),
          12,
          32,
          32,
        ),
        RunLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-pink-man-run")),
          12,
          32,
          32,
        ),
        JumpRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-pink-man-jump"),
          1,
          32,
          32,
        ),
        JumpLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-pink-man-jump")),
          1,
          32,
          32,
        ),
        DoubleJumpRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-pink-man-double-jump"),
          6,
          32,
          32,
        ),
        DoubleJumpLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-pink-man-double-jump")),
          6,
          32,
          32,
        ),
        WallSlideRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-pink-man-wall-jump"),
          5,
          32,
          32,
        ),
        WallSlideLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-pink-man-wall-jump")),
          5,
          32,
          32,
        ),
        FallRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-pink-man-fall"),
          1,
          32,
          32,
        ),
        FallLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-pink-man-fall")),
          1,
          32,
          32,
        ),
        HitRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-pink-man-hit"),
          7,
          32,
          32,
        ),
        HitLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-pink-man-hit")),
          7,
          32,
          32,
        ),
      },
      MaskDude: {
        AppearingRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-appearing"),
          7,
          96,
          96,
          3,
        ),
        AppearingLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-appearing")),
          7,
          96,
          96,
          3,
        ),
        IdleRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-mask-dude-idle"),
          11,
          32,
          32,
        ),
        IdleLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-mask-dude-idle")),
          11,
          32,
          32,
        ),
        RunRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-mask-dude-run"),
          12,
          32,
          32,
        ),
        RunLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-mask-dude-run")),
          12,
          32,
          32,
        ),
        JumpRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-mask-dude-jump"),
          1,
          32,
          32,
        ),
        JumpLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-mask-dude-jump")),
          1,
          32,
          32,
        ),
        DoubleJumpRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-mask-dude-double-jump"),
          6,
          32,
          32,
        ),
        DoubleJumpLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-mask-dude-double-jump")),
          6,
          32,
          32,
        ),
        WallSlideRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-mask-dude-wall-jump"),
          5,
          32,
          32,
        ),
        WallSlideLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-mask-dude-wall-jump")),
          5,
          32,
          32,
        ),
        FallRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-mask-dude-fall"),
          1,
          32,
          32,
        ),
        FallLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-mask-dude-fall")),
          1,
          32,
          32,
        ),
        HitRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-mask-dude-hit"),
          7,
          32,
          32,
        ),
        HitLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-mask-dude-hit")),
          7,
          32,
          32,
        ),
      },
      VirtualGuy: {
        AppearingRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-appearing"),
          7,
          96,
          96,
          3,
        ),
        AppearingLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-appearing")),
          7,
          96,
          96,
          3,
        ),
        IdleRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-virtual-guy-idle"),
          11,
          32,
          32,
        ),
        IdleLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-virtual-guy-idle")),
          11,
          32,
          32,
        ),
        RunRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-virtual-guy-run"),
          12,
          32,
          32,
        ),
        RunLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-virtual-guy-run")),
          12,
          32,
          32,
        ),
        JumpRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-virtual-guy-jump"),
          1,
          32,
          32,
        ),
        JumpLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-virtual-guy-jump")),
          1,
          32,
          32,
        ),
        DoubleJumpRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-virtual-guy-double-jump"),
          6,
          32,
          32,
        ),
        DoubleJumpLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-virtual-guy-double-jump")),
          6,
          32,
          32,
        ),
        WallSlideRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-virtual-guy-wall-jump"),
          5,
          32,
          32,
        ),
        WallSlideLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-virtual-guy-wall-jump")),
          5,
          32,
          32,
        ),
        FallRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-virtual-guy-fall"),
          1,
          32,
          32,
        ),
        FallLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-virtual-guy-fall")),
          1,
          32,
          32,
        ),
        HitRight: new SpriteAnimation(
          SpriteDirection.Right,
          load_sprite("hero-virtual-guy-hit"),
          7,
          32,
          32,
        ),
        HitLeft: new SpriteAnimation(
          SpriteDirection.Left,
          mirror_sprite(load_sprite("hero-virtual-guy-hit")),
          7,
          32,
          32,
        ),
      },
    },
  },
};

const ZOOM = 2.5;
// The numeric values play no other role here but to keep relative
// sizes intact. It looks weird if one has small pixels and the other
// one big pixels.
const sizes = {
  Terrain: {
    GroundBlock: 48 * ZOOM,
    ObstacleBlock: 32 * ZOOM,
  },
  Item: {
    Fruit: 32 * ZOOM,
  },
  Props: {
    DustParticle: 16 * ZOOM,
  },
  Character: {
    Enemy: {
      Slime: [44 * ZOOM, 30 * ZOOM],
      SlimeParticle: 16 * ZOOM,
    },
    Hero: 32 * ZOOM,
  },
};

/**
 * Manage the sprite animations of a game object.
 *
 * A game object can have a single or multiple animation phases (e.g.,
 * idle, walk, jump, etc.). Each phase can have a single or multiple
 * frames (e.g., each frame of the walking motion).
 */
class AbstractGameDrawable extends AbstractPhysicalGameObject {
  constructor() {
    super();

    /** @type {CanvasRenderingContext2D} */
    this.ctx = undefined;

    /** @type {{[key: string]: SpriteAnimation}} */
    this.animation_phases = undefined;
    /** @type {SpriteAnimation} */
    this.animation_phase = undefined;

    this.current_frame = 0;
    this.fps = 1 / 20;
    this.accumulated_time = 0;
  }

  /**
   * @param {number} delta_time
   **/
  render(delta_time) {
    this._prepare_render(delta_time);
    this._draw_object();
  }

  _prepare_render(delta_time) {
    this._update_current_frame(delta_time);
  }

  _draw_object() {
    this.#draw_current_frame();

    this.#debug_draw_physical_object();
  }

  _update_current_frame(delta_time) {
    this.accumulated_time += delta_time;
    if (this.accumulated_time > this.fps) {
      this.accumulated_time = 0;
      ++this.current_frame;
      if (this.current_frame >= this.animation_phase.nb_frames) {
        this.current_frame = 0;
      }
    }
  }

  _reset_animation() {
    this.current_frame = 0;
    this.accumulated_time = 0;
  }

  #draw_current_frame() {
    const current_frame = this.animation_phase.correct_current_frame(
      this.current_frame,
    );

    let source = this.#compute_sprite_source_rect(current_frame);
    source = this.#apply_spritesheet_offset(source);
    const destination = this.#compute_sprite_destination_rect();

    this.ctx.drawImage(
      this.animation_phase.spritesheet,
      source.x,
      source.y,
      source.w,
      source.h,
      destination.x,
      destination.y,
      destination.w,
      destination.h,
    );
  }

  #compute_sprite_source_rect(current_frame) {
    const { sprite_width, sprite_height } = this.animation_phase;
    const sprite_offset_x = sprite_width * current_frame;
    return {
      x: sprite_offset_x,
      y: 0,
      w: sprite_width,
      h: sprite_height,
    };
  }

  #apply_spritesheet_offset(source_rect) {
    return {
      x: source_rect.x + this.animation_phase.offset_x,
      y: source_rect.y + this.animation_phase.offset_y,
      w: source_rect.w,
      h: source_rect.h,
    };
  }

  #compute_sprite_destination_rect() {
    const { size_factor } = this.animation_phase;

    // The sprite can be bigger or smaller than the actual object
    // depending on its size factor.
    const w = this.rect.w * size_factor;
    const h = this.rect.h * size_factor;

    const horizontal_size_difference = w - this.rect.w;
    const vertical_size_difference = h - this.rect.h;

    const x = this.rect.x - horizontal_size_difference / 2;
    const y = this.rect.y - vertical_size_difference / 2;

    return { x, y, w, h };
  }

  #debug_draw_physical_object() {
    if (!IS_DEBUG) return;
    this.ctx.save();
    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = "red";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
    this.ctx.restore();
  }
}
