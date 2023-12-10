class AbstractParticle extends AbstractGameCollidable {
  /**
   * @param {number} vx
   */
  constructor(vx = 0) {
    super();
    this.is_collidable = false;
    this.vx = vx;
    this.opacity = 1;
  }

  collide_with_hero() {
    // By default, particles can only be activated once.
    // Some implementations may require the particle to still be visible
    // after its effect (e.g., bullet breaking). Thus, "!is_collidable"
    // and "can_be_garbage_collected" are not necessarily synonymous.
    this.is_collidable = false;
    this.can_be_garbage_collected = true;
  }

  render(delta_time) {
    this._update_opacity(delta_time);
    if (this.can_be_garbage_collected) return;
    this.ctx.save();
    this.ctx.globalAlpha = this.opacity;
    this._draw_object();
    this.ctx.restore();
  }

  _update_opacity(delta_time) {
    this.opacity -= 2 * delta_time;
    if (this.opacity < 0) {
      this.opacity = 0;
      this.can_be_garbage_collected = true;
    }
  }
}

class DustParticle extends AbstractParticle {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} vx
   */
  constructor(ctx, x, y, vx) {
    super(vx);

    this.ctx = ctx;
    const base_size = sizes.Props.DustParticle * 0.9;
    const size = rand(base_size * (Math.PHI - 1), base_size);
    this.rect = new Rect(x - size / 2, y - size / 2, size, size);
    this.hitbox = new Hitbox(this.rect);

    this.gravity = rand(-100, -30);
    this.opacity = rand(0.9, 1.1);

    this.animation_phase = AnimationPhases.Props.DustParticle;
  }
}

class SlimeParticle extends AbstractParticle {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   */
  constructor(ctx, x, y) {
    super();

    this.is_collidable = true;

    this.ctx = ctx;
    const size = sizes.Character.Enemy.SlimeParticle;
    this.rect = new Rect(
      x,
      y - size * 0.39 - (size - size * 0.385 * 2),
      size,
      size,
    );
    this.hitbox = new Hitbox(
      this.rect,
      size * 0.35,
      size * 0.39,
      this.rect.w - size * 0.33 * 2,
      this.rect.h - size * 0.385 * 2,
    );

    this.gravity = 0;
    this.opacity = rand(3, 4.5);

    this.animation_phase = AnimationPhases.Character.Enemy.Slime.SlimeParticle;

    this.current_frame = Math.floor(
      Math.random() * this.animation_phase.nb_frames,
    );
  }
}

// TODO: maybe generic (AbstractObjectHandler, with common add/garbage_collect)
class ParticleHandler {
  constructor() {
    if (ParticleHandler._instance) {
      return ParticleHandler._instance;
    }
    ParticleHandler._instance = this;

    /** @type {AbstractParticle[]} */
    this.particles = [];
  }

  /** @type {AbstractParticle[]} */
  get collidable_particles() {
    return this.particles.filter(
      (particle) =>
        particle.is_collidable && !particle.can_be_garbage_collected,
    );
  }

  /**
   * @param {AbstractParticle} particle
   */
  add(particle) {
    this.particles.push(particle);
  }

  garbage_collect() {
    this.particles.filter((particle) => !particle.can_be_garbage_collected);
  }
}
