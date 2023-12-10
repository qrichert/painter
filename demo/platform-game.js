/**
 * Platform Game.
 */

let IS_DEBUG = true;

class PlatformGame extends Painter {
  setup() {
    this.ctx.imageSmoothingEnabled = false; // Disable sprite anti-aliasing.

    this.delta_time = 0;

    this.hero = new Hero(this.ctx, 400, 0);
    this.obstacle_blocks = this.#generate_obstacles();
    this.ground_blocks = this.#generate_ground();
    this.fruits = this.#generate_fruits();
    this.enemies = this.#generate_enemies();
    this.particle_handler = new ParticleHandler();

    this.physics = new Physics();
    this.inputs = new Inputs(this.keyboard, this.hero);
    this.camera = new Camera(this.rect, this.ctx, this.hero);

    this.debug_monitor = new DebugMonitor(this);
    this.debug_monitor.text_color = "black";
    this.debug_monitor.background_alpha = 0.1;
  }

  get particles() {
    return this.particle_handler.particles;
  }

  get collidable_particles() {
    return this.particle_handler.collidable_particles;
  }

  #generate_obstacles() {
    const obstacle_blocks = [];
    for (let i = 0; i < 4; ++i) {
      const block = new ObstacleBlock(
        this.ctx,
        200,
        235 + i * sizes.Terrain.ObstacleBlock,
        sizes.Terrain.ObstacleBlock,
        sizes.Terrain.ObstacleBlock,
      );
      obstacle_blocks.push(block);
    }

    obstacle_blocks.push(
      new ObstacleBlock(
        this.ctx,
        750,
        375,
        sizes.Terrain.ObstacleBlock,
        sizes.Terrain.ObstacleBlock,
      ),
    );
    return obstacle_blocks;
  }

  #generate_ground() {
    const ground_blocks = [
      new GroundBlock(this.ctx, 335, 435),
      new GroundBlock(
        this.ctx,
        335 + sizes.Terrain.GroundBlock,
        435 - sizes.Terrain.GroundBlock,
      ),
      new GroundBlock(
        this.ctx,
        335 + sizes.Terrain.GroundBlock * 2,
        435 - sizes.Terrain.GroundBlock * 2,
      ),
      new GroundBlock(this.ctx, 335 + sizes.Terrain.GroundBlock, 435),
      new GroundBlock(this.ctx, 335 + sizes.Terrain.GroundBlock * 2, 435),
    ];

    const ground_height = sizes.Terrain.GroundBlock * 0.618;
    for (let i = -1.5; i < this.rect.w / sizes.Terrain.GroundBlock + 3; ++i) {
      ground_blocks.push(
        new GroundBlock(
          this.ctx,
          i * sizes.Terrain.GroundBlock,
          this.rect.yh - ground_height,
          sizes.Terrain.GroundBlock,
          sizes.Terrain.GroundBlock,
        ),
      );
    }

    return ground_blocks;
  }

  #generate_fruits() {
    return [
      new FruitCollectible(this.ctx, 300, 100),
      new FruitCollectible(this.ctx, 600, -100),
      new FruitCollectible(this.ctx, 900, 500),
    ];
  }

  #generate_enemies() {
    return [new SlimeEnemy(this.ctx, 450, 150)];
  }

  key_press_event(key) {
    this.inputs.key_press_event(key);
  }

  key_release_event(key) {
    this.inputs.key_release_event(key);
  }

  render(delta_time) {
    this.ctx.clear();
    this.delta_time = delta_time;

    this.#handle_physics();
    this.#handle_hero_movement();
    this.#handle_collisions();
    this.#handle_post_collision_physics();

    // First we compute and manipulate vx and vy. Only at the very end
    // we apply it, once all computations are done, and we have the
    // final values.
    this.#apply_movement();

    for (const enemy of this.enemies) {
      if (enemy.rect.y > this.rect.yh) {
        // enemy.can_be_garbage_collected = true;
        enemy.nb_lives = enemy.max_lives;
        enemy.rect.x = 450;
        enemy.rect.y = 0;
      }
    }
    // TODO: do collisions with camera, with [vx,vy] vector
    //  like the rest of the collisions, instead of doing it
    //  a-postriori
    // reset when falls out
    if (this.hero.is_dead) {
      // TODO: yh is not correct, but OK for now, in the future
      //   world will extend beyond yh
      if (this.hero.rect.y > this.rect.yh) {
        this.hero.resurrect();
      }
    } else {
      // out of screen
      if (this.hero.rect.y > this.rect.yh) {
        this.hero.kill();
      }
    }

    this.#garbage_collect();
    this.#render_scene();

    // TODO: there may be a better function name. Because maybe we wanna
    //  do something else than to generate particles, like "some
    //  recurring behaviour". Generating particle would be one of those
    //  behaviours, but the list of behaviours and frequency depends
    //  entirely on the character (e.g., become angry). So here we only
    //  trigger a function that "may activate recurring behaviours".
    //  also, those behaviours may be activated from someplace else
    //  (e.g., jump emits particles).
    this.#emit_particles();

    this.#debug_draw_perf_monitor();
  }

  #handle_physics() {
    this.physics.apply_physics_to(this.enemies, this.delta_time);
    this.physics.apply_physics_to(this.hero, this.delta_time);
    this.physics.apply_physics_to(this.particles, this.delta_time);
  }

  #handle_hero_movement() {
    if (!this.hero.is_dead) {
      this.inputs.move_hero();
    }
  }

  #handle_collisions() {
    for (const object of [
      ...this.ground_blocks,
      ...this.obstacle_blocks,
      ...this.enemies,
      ...this.collidable_particles,
      ...this.fruits,
      this.hero,
    ]) {
      object.is_in_collision = false;
    }

    // TODO: Like ParticleHandler.collidable_particles, create EnemyHandler.alive_enemies()
    //  alors remember that if enemy is_hit() should not give damage to hero.
    const enemies = this.enemies.filter((enemy) => !enemy.is_dead);

    const collision_handler = new CollisionHandler(this.delta_time);

    collision_handler.characters_vs_terrain(enemies, [
      ...this.ground_blocks,
      ...this.obstacle_blocks,
    ]);

    if (this.hero.is_dead) return;

    // TODO: Broad phase elimination first
    collision_handler.characters_vs_terrain(this.hero, [
      ...this.ground_blocks,
      ...this.obstacle_blocks,
    ]);

    collision_handler.hero_vs_enemies(this.hero, enemies, [
      ...this.ground_blocks,
      ...this.obstacle_blocks,
    ]);

    collision_handler.hero_vs_particles(this.hero, this.collidable_particles);

    collision_handler.hero_vs_collectibles(this.hero, [...this.fruits]);
  }

  #handle_post_collision_physics() {
    // This could cause problems as it can "shrink" the resolution vector and
    // leave objects in collision. But for our current use case (wall sliding),
    // this is fine.
    this.physics.apply_friction_to(this.hero);
  }

  #apply_movement() {
    this.physics.apply_movement_to(this.enemies, this.delta_time);
    this.physics.apply_movement_to(this.hero, this.delta_time);
    this.physics.apply_movement_to(this.particles, this.delta_time);
  }

  #garbage_collect() {
    this.fruits = this.fruits.filter(this.#garbage_filter);
    this.enemies = this.enemies.filter(this.#garbage_filter);
    this.particle_handler.garbage_collect();
  }

  #garbage_filter(object) {
    return !object.can_be_garbage_collected;
  }

  #render_scene() {
    this.camera.render(this.delta_time, [
      ...this.obstacle_blocks,
      ...this.ground_blocks,
      ...this.fruits,
      ...this.particles,
      ...this.enemies,
      this.hero,
    ]);
  }

  #emit_particles() {
    this.hero.emit_particle();
    this.enemies.map((enemy) => enemy.emit_particle());
  }

  #debug_draw_perf_monitor() {
    if (!IS_DEBUG) return;
    this.debug_monitor.render([
      `x: ${this.hero.rect.cx.toFixed(2)} y: ${this.hero.rect.cy.toFixed(2)}`,
      `nb_lives: ${this.hero.nb_lives}`,
    ]);
  }
}

function main() {
  return new PlatformGame().exec();
}

main();
