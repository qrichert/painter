class AbstractTerrainBlock extends AbstractGameCollidable {
  render(delta_time) {
    this._draw_object();
  }
}

class GroundBlock extends AbstractTerrainBlock {
  constructor(ctx, x, y) {
    super();
    this.ctx = ctx;
    this.rect = new Rect(
      x,
      y,
      sizes.Terrain.GroundBlock,
      sizes.Terrain.GroundBlock,
    );
    // TODO: relative hitbox
    this.hitbox = new Hitbox(this.rect, 10, 0, this.rect.w - 20, 0);
    this.animation_phases = AnimationPhases.Terrain.GroundBlock;
    this.animation_phase = this.animation_phases.Idle;
  }
}

class ObstacleBlock extends AbstractTerrainBlock {
  constructor(ctx, x, y) {
    super();
    this.ctx = ctx;
    this.rect = new Rect(
      x,
      y,
      sizes.Terrain.ObstacleBlock,
      sizes.Terrain.ObstacleBlock,
    );
    // TODO: relative hitbox
    this.hitbox = new Hitbox(this.rect, 0, 0, this.rect.w, this.rect.h);
    this.animation_phases = AnimationPhases.Terrain.ObstacleBlock;
    this.animation_phase = this.animation_phases.Idle;
  }
}
