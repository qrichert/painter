class CollisionResponse {
  /**
   * @param {AbstractCharacter} character
   * @param {NormalDirection} collision_normal
   */
  static character_vs_ground_block(character, collision_normal) {
    if (character instanceof Hero) {
      switch (collision_normal) {
        case NormalDirection.Up:
          character.ground();
          break;
      }
    }
  }

  /**
   * @param {AbstractCharacter} character
   * @param {NormalDirection} collision_normal
   */
  static character_vs_obstacle_block(character, collision_normal) {
    if (character instanceof Hero) {
      switch (collision_normal) {
        case NormalDirection.Up:
          character.ground();
          break;
        case NormalDirection.Down:
          character.bump();
          break;
        case NormalDirection.Left:
          character.wall_slide();
          break;
        case NormalDirection.Right:
          character.wall_slide();
          break;
      }
    } else if (character instanceof AbstractEnemy) {
      switch (collision_normal) {
        case NormalDirection.Left:
          character.go_opposite_way();
          break;
        case NormalDirection.Right:
          character.go_opposite_way();
          break;
      }
    }
  }

  /**
   * @param {Hero} hero
   * @param {AbstractParticle} particle
   */
  static hero_vs_particle(hero, particle) {
    hero.hit();
    particle.collide_with_hero();
  }

  /**
   * @param {Hero} hero
   * @param {AbstractCollectible} collectible
   */
  static hero_vs_collectible(hero, collectible) {
    // TODO: character/world points++;
    collectible.collect();
  }

  /**
   * @param {Hero} hero
   * @param {AbstractEnemy} enemy
   * @param {NormalDirection} collision_normal
   */
  static hero_vs_enemy(hero, enemy, collision_normal) {
    switch (collision_normal) {
      case NormalDirection.Up:
        enemy.hit();
        hero.force_jump();
        break;
      case NormalDirection.Down:
        hero.hit();
        hero.bump();
        break;
      default:
        hero.hit();
        break;
    }
  }

  /**
   * @param {AbstractEnemy} enemy
   * @param {NormalDirection} collision_normal
   */
  static hero_sandwiched_between_enemy_and_terrain(enemy, collision_normal) {
    switch (collision_normal) {
      case NormalDirection.Left:
        enemy.go_opposite_way();
        break;
      case NormalDirection.Right:
        enemy.go_opposite_way();
        break;
    }
  }
}

class CollisionHandler {
  constructor(delta_time) {
    this.resolver = new CollisionResolver(delta_time);
  }

  /**
   * @param {AbstractCharacter|AbstractCharacter[]} characters
   * @param {AbstractTerrainBlock[]} terrain_blocks
   */
  characters_vs_terrain(characters, terrain_blocks) {
    if (!Array.isArray(characters)) characters = [characters];
    for (const character of characters) {
      const blocks_sorted_by_time =
        this.resolver.detect_potential_collisions_sorted_by_time_moving_vs_static(
          character,
          terrain_blocks,
        );
      for (const terrain_block of blocks_sorted_by_time) {
        if (terrain_block instanceof GroundBlock) {
          // If we are here, a collision WAS detected (time >0 && <1), the objets
          // ARE in contact, but the contact doesn't always need to be resolved
          // (character jumping on a platform is OK).
          const was_a_real_collision = this.#resolve_character_vs_ground_block(
            character,
            terrain_block,
          );
          if (!was_a_real_collision) {
            continue;
          }
        } else if (terrain_block instanceof ObstacleBlock) {
          this.#resolve_character_vs_obstacle_block(character, terrain_block);
        }
        character.is_in_collision = true;
        terrain_block.is_in_collision = true;
      }
    }
  }

  #resolve_character_vs_ground_block(character, block) {
    // Only resolve the collision if the character comes from above.
    // If he comes from above, he stands on the ground block, but from
    // any other direction, he passes through it (e.g, jump up).
    if (character.hitbox.abs_yh > block.hitbox.abs_y) {
      return false;
    }

    const collision_normal = this.#resolve_character_vs_generic_block(
      character,
      block,
    );

    CollisionResponse.character_vs_ground_block(character, collision_normal);

    return true;
  }

  #resolve_character_vs_obstacle_block(character, block) {
    const collision_normal = this.#resolve_character_vs_generic_block(
      character,
      block,
    );

    CollisionResponse.character_vs_obstacle_block(character, collision_normal);
  }

  #resolve_character_vs_generic_block(character, block) {
    const { resolution_vector, normal } =
      this.resolver.resolve_collision_moving_vs_static(character, block);

    if (resolution_vector === undefined) {
      return NormalDirection.Undefined;
    }

    character.vx += resolution_vector[0];
    character.vy += resolution_vector[1];

    return normal;
  }

  /**
   * @param {Hero} hero
   * @param {AbstractEnemy[]} enemies
   * @param {AbstractTerrainBlock[]} terrain_blocks
   */
  hero_vs_enemies(hero, enemies, terrain_blocks) {
    const enemies_sorted_by_time =
      this.resolver.detect_potential_collisions_sorted_by_time_moving_vs_moving(
        hero,
        enemies,
      );
    for (const enemy of enemies_sorted_by_time) {
      this.#resolve_hero_vs_enemy(hero, enemy, terrain_blocks);
      hero.is_in_collision = true;
      enemy.is_in_collision = true;
    }
  }

  #resolve_hero_vs_enemy(hero, enemy, terrain_blocks) {
    const { resolution_vector, normal } =
      this.resolver.resolve_collision_moving_vs_moving(hero, enemy);

    if (resolution_vector === undefined) {
      return;
    }

    hero.vx += resolution_vector[0];
    hero.vy += resolution_vector[1];

    this.#hero_vs_enemy_vs_terrain(hero, enemy, terrain_blocks);

    CollisionResponse.hero_vs_enemy(hero, enemy, normal);
  }

  #hero_vs_enemy_vs_terrain(hero, enemy, terrain_blocks) {
    const blocks_sorted_by_time =
      this.resolver.detect_potential_collisions_sorted_by_time_moving_vs_static(
        hero,
        terrain_blocks,
      );
    for (const terrain_block of blocks_sorted_by_time) {
      if (terrain_block instanceof GroundBlock) {
        this.#resolve_hero_vs_enemy_vs_ground_block(hero, enemy, terrain_block);
      } else if (terrain_block instanceof ObstacleBlock) {
        this.#resolve_hero_vs_enemy_vs_obstacle_block(
          hero,
          enemy,
          terrain_block,
        );
      }
    }
  }

  #resolve_hero_vs_enemy_vs_ground_block(hero, enemy, block) {
    if (hero.hitbox.abs_yh > block.hitbox.abs_y) {
      return;
    }
    this.#resolve_hero_vs_enemy_vs_generic_block(hero, enemy, block);
  }

  #resolve_hero_vs_enemy_vs_obstacle_block(hero, enemy, block) {
    this.#resolve_hero_vs_enemy_vs_generic_block(hero, enemy, block);
  }

  #resolve_hero_vs_enemy_vs_generic_block(hero, enemy, block) {
    const { resolution_vector, normal } =
      this.resolver.resolve_collision_moving_vs_static(hero, block);

    if (resolution_vector === undefined) {
      return NormalDirection.Undefined;
    }

    hero.vx += resolution_vector[0];
    hero.vy += resolution_vector[1];

    enemy.vx += resolution_vector[0];
    enemy.vy += resolution_vector[1];

    CollisionResponse.hero_sandwiched_between_enemy_and_terrain(enemy, normal);
  }

  /**
   * @param {Hero} hero
   * @param {AbstractParticle[]} particles
   */
  hero_vs_particles(hero, particles) {
    const particles_sorted_by_time =
      this.resolver.detect_potential_collisions_sorted_by_time_moving_vs_moving(
        hero,
        particles,
      );
    for (const particle of particles_sorted_by_time) {
      this.#resolve_hero_vs_particle(hero, particle);
      hero.is_in_collision = true;
      particles.is_in_collision = true;
    }
  }

  #resolve_hero_vs_particle(hero, particle) {
    CollisionResponse.hero_vs_particle(hero, particle);
  }

  /**
   * @param {Hero} hero
   * @param {AbstractCollectible[]} collectibles
   */
  hero_vs_collectibles(hero, collectibles) {
    const collectibles_sorted_by_time =
      this.resolver.detect_potential_collisions_sorted_by_time_moving_vs_static(
        hero,
        collectibles,
      );
    for (const collectible of collectibles_sorted_by_time) {
      this.#resolve_hero_vs_collectible(hero, collectible);
      hero.is_in_collision = true;
      collectible.is_in_collision = true;
    }
  }

  #resolve_hero_vs_collectible(hero, collectible) {
    CollisionResponse.hero_vs_collectible(hero, collectible);
  }
}
