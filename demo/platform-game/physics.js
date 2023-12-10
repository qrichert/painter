class AbstractPhysicalGameObject extends AbstractGameObject {
  constructor() {
    super();
    /** @type {Rect} */
    this.rect = undefined;
    this.vx = 0;
    this.vy = 0;
    this.speed = 100;
    this.gravity = 1337;
    this.friction = [0, 0];
  }
}

class Physics {
  /**
   * @param {AbstractPhysicalGameObject|AbstractPhysicalGameObject[]} objects
   * @param {number} delta_time
   */
  apply_physics_to(objects, delta_time) {
    if (!Array.isArray(objects)) objects = [objects];

    for (const object of objects) {
      this.#apply_gravity(object, delta_time);
    }
  }

  #apply_gravity(object, delta_time) {
    object.vy += object.gravity * delta_time;
  }

  /**
   * @param {AbstractPhysicalGameObject|AbstractPhysicalGameObject[]} objects
   */
  apply_friction_to(objects) {
    if (!Array.isArray(objects)) objects = [objects];

    for (const object of objects) {
      const friction = object.friction;
      object.vx *= 1 - friction[0];
      object.vy *= 1 - friction[1];
    }
  }

  /**
   * @param {AbstractPhysicalGameObject|AbstractPhysicalGameObject[]} objects
   * @param {number} delta_time
   */
  apply_movement_to(objects, delta_time) {
    if (!Array.isArray(objects)) objects = [objects];

    for (const object of objects) {
      object.rect.x += object.vx * delta_time;
      object.rect.y += object.vy * delta_time;
    }
  }
}
