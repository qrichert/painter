class Hitbox extends Rect {
  /**
   * @param {Rect} parent
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  constructor(parent, x = 0, y = 0, w = 0, h = 0) {
    super(x, y, w, h);
    this.parent = parent;
  }

  get abs_x() {
    return this.parent.x + this.x;
  }

  get abs_y() {
    return this.parent.y + this.y;
  }

  get abs_xw() {
    return this.abs_x + this.w;
  }

  get abs_yh() {
    return this.abs_y + this.h;
  }

  get abs_cx() {
    return this.abs_x + this.w / 2;
  }

  get abs_cy() {
    return this.abs_y + this.h / 2;
  }

  clone() {
    const { x, y, w, h } = this;
    return new Hitbox(this.parent.clone(), x, y, w, h);
  }
}

/**
 * Enable collision detection of a game object.
 */
class AbstractGameCollidable extends AbstractGameDrawable {
  constructor() {
    super();
    /** @type {Hitbox} */
    this.hitbox = undefined;
    this.is_in_collision = false;
  }

  _draw_object() {
    super._draw_object();
    this.#debug_draw_hitbox();
  }

  #debug_draw_hitbox() {
    if (!IS_DEBUG) return;
    this.ctx.save();
    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = this.is_in_collision ? "lime" : "cyan";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      this.hitbox.abs_x,
      this.hitbox.abs_y,
      this.hitbox.w,
      this.hitbox.h,
    );
    this.ctx.restore();
  }
}

/**
 * @readonly
 * @enum {NormalDirection}
 */
const NormalDirection = {
  Undefined: "Undefined",
  Up: "Up",
  Down: "Down",
  Left: "Left",
  Right: "Right",
};

class CollisionResolver {
  constructor(delta_time) {
    this.delta_time = delta_time;
  }

  /**
   * @param {AbstractGameCollidable} source
   * @param {AbstractGameCollidable[]} targets
   * @returns {AbstractGameCollidable[]}
   */
  detect_potential_collisions_sorted_by_time_moving_vs_static(source, targets) {
    const potential_collisions = this.#find_potential_collisions(
      source,
      targets,
      false,
    );
    return this.#sort_potential_collisions_by_time(potential_collisions);
  }

  /**
   * @param {AbstractGameCollidable} source
   * @param {AbstractGameCollidable[]} targets
   * @returns {AbstractGameCollidable[]}
   */
  detect_potential_collisions_sorted_by_time_moving_vs_moving(source, targets) {
    const potential_collisions = this.#find_potential_collisions(
      source,
      targets,
      true,
    );
    return this.#sort_potential_collisions_by_time(potential_collisions);
  }

  #find_potential_collisions(source, targets, are_targets_moving) {
    const potential_collisions = [];
    for (const target of targets) {
      target.is_in_collision = false;
      const collision_time = !are_targets_moving
        ? this.#compute_collision_time_moving_vs_static(source, target)
        : this.#compute_collision_time_moving_vs_moving(source, target);
      if (collision_time !== undefined) {
        potential_collisions.push([target, collision_time]);
      }
    }
    return potential_collisions;
  }

  #compute_collision_time_moving_vs_static(source, target) {
    const source_aabb = this.#game_collidable_to_aabb(source);
    const other_aabb = this.#game_collidable_to_aabb(target);

    const info = { time: undefined };
    const are_colliding = Collisions2D.swept_aabb_vs_aabb_detect_only(
      source_aabb,
      [source.vx * this.delta_time, source.vy * this.delta_time],
      other_aabb,
      info,
    );
    return are_colliding ? info.time : undefined;
  }

  #compute_collision_time_moving_vs_moving(source, target) {
    const source_aabb = this.#game_collidable_to_aabb(source);
    const other_aabb = this.#game_collidable_to_aabb(target);

    const info = { time: undefined };
    const are_colliding = Collisions2D.swept_aabb_vs_moving_aabb_detect_only(
      source_aabb,
      [source.vx * this.delta_time, source.vy * this.delta_time],
      other_aabb,
      [target.vx * this.delta_time, target.vy * this.delta_time],
      info,
    );
    return are_colliding ? info.time : undefined;
  }

  #sort_potential_collisions_by_time(objects_x_time) {
    const sorted_objects = objects_x_time.toSorted((a, b) => a[1] - b[1]);
    // Get rid of time value.
    return sorted_objects.map((object) => object[0]);
  }

  /**
   * @param {AbstractGameCollidable} source
   * @param {AbstractGameCollidable} target
   * @returns {{ resolution_vector: number[], normal: NormalDirection }}
   */
  resolve_collision_moving_vs_static(source, target) {
    return this.#resolve_collision(source, target, false);
  }

  /**
   * @param {AbstractGameCollidable} source
   * @param {AbstractGameCollidable} target
   * @returns {{ resolution_vector: ?number[], normal: NormalDirection }}
   */
  resolve_collision_moving_vs_moving(source, target) {
    return this.#resolve_collision(source, target, true);
  }

  #resolve_collision(source, target, are_targets_moving) {
    const source_aabb = this.#game_collidable_to_aabb(source);
    const target_aabb = this.#game_collidable_to_aabb(target);

    const info = { resolution_vector: undefined, normal: undefined };

    const are_colliding = !are_targets_moving
      ? Collisions2D.swept_aabb_vs_aabb(
          source_aabb,
          [source.vx * this.delta_time, source.vy * this.delta_time],
          target_aabb,
          info,
        )
      : Collisions2D.swept_aabb_vs_moving_aabb(
          source_aabb,
          [source.vx * this.delta_time, source.vy * this.delta_time],
          target_aabb,
          [target.vx * this.delta_time, target.vy * this.delta_time],
          info,
        );

    if (!are_colliding) {
      return {
        resolution_vector: undefined,
        normal: NormalDirection.Undefined,
      };
    }

    const resolution_vector = info.resolution_vector;
    resolution_vector[0] /= this.delta_time;
    resolution_vector[1] /= this.delta_time;

    const normal = this.#get_normal_direction(info.normal);

    return { resolution_vector, normal };
  }

  #game_collidable_to_aabb(collidable) {
    return {
      x: collidable.hitbox.abs_x,
      y: collidable.hitbox.abs_y,
      w: collidable.hitbox.w,
      h: collidable.hitbox.h,
    };
  }

  #get_normal_direction(normal) {
    if (normal[0] === 0 && normal[1] === -1) return NormalDirection.Up;
    if (normal[0] === 0 && normal[1] === 1) return NormalDirection.Down;
    if (normal[0] === -1 && normal[1] === 0) return NormalDirection.Left;
    if (normal[0] === 1 && normal[1] === 0) return NormalDirection.Right;
    return NormalDirection.Undefined;
  }
}
