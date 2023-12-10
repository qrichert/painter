/** Below this value, we consider the motion rounding error noise. */
const MOTION_THRESHOLD = 0.0001;

class AbstractCharacter extends AbstractGameCollidable {
  constructor() {
    super();

    this.jump_force = 715;
    this.jump_counter = 0;
    this.max_jumps = 2;

    this.max_lives = 1;
    this.nb_lives = this.max_lives;

    this.is_hit = false;
    this._hit_timeout = 0;

    this._previous_phase = undefined;

    this.particle_handler = new ParticleHandler();
    this.particle_emission_frequency = 0.2;
  }

  get is_dead() {
    return this.nb_lives === 0;
  }

  hit() {
    if (this.is_hit || this.is_dead) return;
    --this.nb_lives;
    this.is_hit = true;
    this._hit_timeout = this.fps * this.animation_phases.HitRight.nb_frames;
  }

  kill() {
    if (this.is_hit || this.is_dead) return;
    // Force take its last life.
    this.nb_lives = 1;
    this.hit();
  }

  _update_hit_state(delta_time) {
    if (!this.is_hit) return;
    this._hit_timeout -= delta_time;
    if (this._hit_timeout <= 0) {
      this.is_hit = false;
      this._hit_timeout = 0;
    }
  }

  _update_death_state() {
    // While "is_hit" is true, the hit animation is still going on.
    // True death (as rendered), comes just after the hit animation
    // ends (i.e., to render death, the character must be dead and no
    // longer in hit state).
    if (!this.is_dead || this.is_hit) return;
    // The animation of "is_dead" is the frozen last frame of "is_hit".
    this.current_frame = this.animation_phase.nb_frames - 1;
  }

  _is_on_the_ground() {
    return Math.abs(this.vy) <= MOTION_THRESHOLD && this.jump_counter === 0;
  }

  emit_particle() {
    if (!this._do_emit_particle()) return;

    const speed = (this._is_going_right() ? -this.speed : this.speed) * 0.1;
    const origin =
      this.hitbox.abs_cx +
      (this._is_going_right() ? -this.hitbox.w / 5 : this.hitbox.w / 5);
    this.particle_handler.add(
      new DustParticle(this.ctx, origin, this.rect.yh, speed),
    );
  }

  _do_emit_particle() {
    if (this.is_hit || this.is_dead) return false;
    if (!this._is_on_the_ground()) return false;
    if (!this._is_going_right() && !this._is_going_left()) return false;
    return Math.random() < this.particle_emission_frequency;
  }

  _determine_ground_phase() {
    if (this._is_not_going_left_or_right()) {
      if (this._was_going_right_just_before()) {
        this.animation_phase = this.animation_phases.IdleRight;
      } else {
        this.animation_phase = this.animation_phases.IdleLeft;
      }
    } else if (this._is_going_right()) {
      this.animation_phase = this.animation_phases.RunRight;
    } else if (this._is_going_left()) {
      this.animation_phase = this.animation_phases.RunLeft;
    }
  }

  _determine_hit_phase() {
    if (this._was_going_right_just_before()) {
      this.animation_phase = this.animation_phases.HitRight;
    } else {
      this.animation_phase = this.animation_phases.HitLeft;
    }
  }

  _determine_death_phase() {
    if (this._was_going_right_just_before()) {
      this.animation_phase = this.animation_phases.HitRight;
    } else {
      this.animation_phase = this.animation_phases.HitLeft;
    }
  }

  _remember_previous_animation_phase() {
    this._previous_phase = this.animation_phase;
  }

  /*
   * Still phases have no direction per se, but the sprite is looking
   * left or looking right regardless. This method looks at the previous
   * phase to determine the direction of the current still phase. If the
   * character was "falling left", we want "idle left". If it was
   * "falling right", we want "idle right".
   */
  _was_going_right_just_before() {
    return this._previous_phase.direction === SpriteDirection.Right;
  }

  _is_not_going_left_or_right() {
    return Math.abs(this.vx) <= MOTION_THRESHOLD;
  }

  _is_going_right() {
    return this.vx > MOTION_THRESHOLD;
  }

  _is_going_left() {
    return this.vx < -MOTION_THRESHOLD;
  }

  _reset_animation_if_phase_has_changed() {
    if (this._previous_phase !== this.animation_phase) {
      this._reset_animation();
    }
  }
}

class AbstractEnemy extends AbstractCharacter {
  constructor() {
    super();
    this.vx = this.speed;
  }

  go_opposite_way() {
    const opposite_sign = Math.sign(this.vx) * -1;
    this.vx = this.speed * opposite_sign;
  }
}

class SlimeEnemy extends AbstractEnemy {
  constructor(ctx, x, y) {
    super();

    this.ctx = ctx;

    this.rect = new Rect(
      x,
      y,
      sizes.Character.Enemy.Slime[0],
      sizes.Character.Enemy.Slime[1],
    );
    // TODO: relative hitbox
    this.hitbox = new Hitbox(
      this.rect,
      17,
      25,
      sizes.Character.Enemy.Slime[0] - 34,
      sizes.Character.Enemy.Slime[1] - 25,
    );

    this.animation_phases = AnimationPhases.Character.Enemy.Slime;
    this.animation_phase = this.animation_phases.IdleRunRight;

    this.particle_emission_frequency = 0.1;
  }

  emit_particle() {
    if (!this._do_emit_particle()) return;
    this.particle_handler.add(
      new SlimeParticle(this.ctx, this.hitbox.abs_cx, this.rect.yh),
    );
  }

  render(delta_time) {
    this._prepare_render(delta_time);

    this._update_hit_state(delta_time);
    this._update_death_state(delta_time);
    // Behaviour

    this._remember_previous_animation_phase();
    this.#update_animation_phase();
    this._reset_animation_if_phase_has_changed();

    this._draw_object();
  }

  #update_animation_phase() {
    if (this._is_on_the_ground()) this._determine_ground_phase();

    if (this.is_hit) this._determine_hit_phase();
    if (this.is_dead) this._determine_death_phase();
  }

  _determine_ground_phase() {
    if (this._is_not_going_left_or_right()) {
      if (this._was_going_right_just_before()) {
        this.animation_phase = this.animation_phases.IdleRunRight;
      } else {
        this.animation_phase = this.animation_phases.IdleRunLeft;
      }
    } else if (this._is_going_right()) {
      this.animation_phase = this.animation_phases.IdleRunRight;
    } else if (this._is_going_left()) {
      this.animation_phase = this.animation_phases.IdleRunLeft;
    }
  }
}

class Hero extends AbstractCharacter {
  constructor(ctx, x, y) {
    super();

    this.ctx = ctx;

    this.rect = new Rect(x, y, sizes.Character.Hero, sizes.Character.Hero);
    // TODO: relative hitbox
    this.hitbox = new Hitbox(
      this.rect,
      18,
      20,
      sizes.Character.Hero - 36,
      sizes.Character.Hero - 20,
    );

    this.speed = 536;

    this.max_lives = Infinity;
    this.nb_lives = this.max_lives;

    this.animation_phases = AnimationPhases.Character.Hero.NinjaFrog;
    this.animation_phase = this.animation_phases.AppearingRight;

    this.total_time = 0;

    this.can_be_wall_sliding = false;
  }

  get friction() {
    if (this.#is_wall_sliding()) {
      return [0, 0.15];
    }
    return this._friction;
  }

  set friction(friction) {
    this._friction = friction;
  }

  ground() {
    // Can jump again.
    this.jump_counter = 0;
    this.can_be_wall_sliding = false;
  }

  bump() {
    // Prevent double jump.
    this.jump_counter = Infinity;
    this.can_be_wall_sliding = false;
  }

  jump() {
    if (this.is_dead) return;
    // allow double jump but not more.
    if (this.jump_counter < this.max_jumps) {
      // Jump
      this.vy = -this.jump_force;
      ++this.jump_counter;
    }
    this.can_be_wall_sliding = false;
  }

  force_jump() {
    if (this.is_hit || this.is_dead) return;
    this.jump_counter = 0;
    this.jump();
  }

  wall_slide() {
    this.jump_counter = 0;
    this.can_be_wall_sliding = true;
  }

  hit() {
    if (this.is_hit || this.is_dead) return;
    super.hit();
    this.can_be_wall_sliding = false;
  }

  kill() {
    if (this.is_hit || this.is_dead) return;
    super.kill();
    this.can_be_wall_sliding = false;
    this.vx *= 0.3;
  }

  resurrect() {
    this.nb_lives = this.max_lives;
    this.is_hit = false;
    this._hit_timeout = 0;
    this.can_be_wall_sliding = false;
    this.rect.x = 400;
    this.rect.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.total_time = 0;
    this.animation_phase = this.animation_phases.AppearingRight;
  }

  render(delta_time) {
    this.total_time += delta_time;
    this._prepare_render(delta_time);

    this._update_hit_state(delta_time);
    this._update_death_state(delta_time);

    this._remember_previous_animation_phase();
    this.#update_animation_phase();
    this._reset_animation_if_phase_has_changed();

    this._draw_object();
  }

  #update_animation_phase() {
    // We could handle all these conditions in an absolute way with
    // booleans, instead of playing guessing games (as with is_hit and
    // is_dead). But this would require additional tangled logic. Doing
    // it like this works, and with a very low complexity footprint.
    if (this._is_on_the_ground()) this._determine_ground_phase();
    if (this.#is_jumping()) this.#determine_jumping_phase();
    if (this.#is_falling()) this.#determine_falling_phase();
    if (this.#is_wall_sliding()) this.#determine_wall_sliding_phase();

    if (this.#is_appearing()) this.#determine_appearing_phase();

    if (this.is_hit) this._determine_hit_phase();
    if (this.is_dead) this._determine_death_phase();
  }

  #is_jumping() {
    return this.vy < -MOTION_THRESHOLD;
  }

  #is_falling() {
    return this.vy > MOTION_THRESHOLD;
  }

  #is_wall_sliding() {
    return (
      this.can_be_wall_sliding &&
      this.is_in_collision &&
      Math.abs(this.vx) <= MOTION_THRESHOLD &&
      this.vy > MOTION_THRESHOLD &&
      this.jump_counter === 0
    );
  }

  #is_appearing() {
    return (
      this.total_time <
      this.animation_phases.AppearingRight.nb_frames * this.fps
    );
  }

  #determine_jumping_phase() {
    if (this._is_not_going_left_or_right()) {
      if (this._was_going_right_just_before()) {
        this.animation_phase = this.animation_phases.JumpRight;
      } else {
        this.animation_phase = this.animation_phases.JumpLeft;
      }
    } else if (this._is_going_right()) {
      this.animation_phase = this.animation_phases.JumpRight;
    } else if (this._is_going_left()) {
      this.animation_phase = this.animation_phases.JumpLeft;
    }

    if (this.#is_double_jumping()) this.#handle_double_jump();
  }

  #is_double_jumping() {
    return this.jump_counter === this.max_jumps;
  }

  #handle_double_jump() {
    if (this._was_going_right_just_before()) {
      this.animation_phase = this.animation_phases.DoubleJumpRight;
    } else {
      this.animation_phase = this.animation_phases.DoubleJumpLeft;
    }
  }

  #determine_falling_phase() {
    if (this._is_not_going_left_or_right()) {
      if (this._was_going_right_just_before()) {
        this.animation_phase = this.animation_phases.FallRight;
      } else {
        this.animation_phase = this.animation_phases.FallLeft;
      }
    } else if (this._is_going_right()) {
      this.animation_phase = this.animation_phases.FallRight;
    } else if (this._is_going_left()) {
      this.animation_phase = this.animation_phases.FallLeft;
    }
  }

  #determine_wall_sliding_phase() {
    if (this._was_going_right_just_before()) {
      this.animation_phase = this.animation_phases.WallSlideRight;
    } else {
      this.animation_phase = this.animation_phases.WallSlideLeft;
    }
  }

  #determine_appearing_phase() {
    if (this._is_not_going_left_or_right()) {
      if (this._was_going_right_just_before()) {
        this.animation_phase = this.animation_phases.AppearingRight;
      } else {
        this.animation_phase = this.animation_phases.AppearingLeft;
      }
    } else if (this._is_going_right()) {
      this.animation_phase = this.animation_phases.AppearingRight;
    } else if (this._is_going_left()) {
      this.animation_phase = this.animation_phases.AppearingLeft;
    }
  }
}
