class AbstractCollectible extends AbstractGameCollidable {
  /** @override */
  collect() {}
}

/**
 * @readonly
 * @enum {FruitType}
 */
const FruitType = {
  Apple: "Apple",
  Bananas: "Bananas",
  Cherries: "Cherries",
  Kiwi: "Kiwi",
  Melon: "Melon",
  Orange: "Orange",
  Pineapple: "Pineapple",
  Strawberry: "Strawberry",
};

class FruitCollectible extends AbstractCollectible {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {?FruitType} type
   */
  constructor(ctx, x, y, type = undefined) {
    super();
    this.ctx = ctx;
    this.rect = new Rect(x, y, sizes.Item.Fruit, sizes.Item.Fruit);
    // TODO: relative hitbox
    this.hitbox = new Hitbox(
      this.rect,
      24,
      25,
      this.rect.w - 48,
      this.rect.h - 50,
    );

    this.animation_phases = AnimationPhases.Item.Fruit;

    if (type === undefined) {
      const fruits = Object.keys(FruitType);
      type = FruitType[fruits[Math.floor(Math.random() * fruits.length)]];
    }
    this.animation_phase = this.animation_phases[type];

    this.is_collected = false;
    this.disappearing_timeout = 0;
  }

  collect() {
    if (this.is_collected) return;
    this.is_collected = true;
    this.animation_phase = this.animation_phases.Collected;
    this.disappearing_timeout =
      this.fps * this.animation_phases.Collected.nb_frames;
  }

  render(delta_time) {
    if (this.can_be_garbage_collected) return;
    this.#update_disappearing_state(delta_time);
    super.render(delta_time);
  }

  #update_disappearing_state(delta_time) {
    if (!this.is_collected) return;
    this.disappearing_timeout -= delta_time;
    if (this.disappearing_timeout <= 0) {
      this.can_be_garbage_collected = true;
    }
  }
}
