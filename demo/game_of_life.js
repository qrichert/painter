class GameOfLife extends Painter {
  setup() {
    this.pxctx.pixelSize = 8;
    this.is_paused = false;
    this.draw_mode = null;
    this.#init_game();
  }

  resize_event() {
    this.#init_game();
  }

  mouse_press_event(x, y) {
    if (!this.is_paused) return;
    this.#draw_mouse(x, y);
  }

  mouse_move_event(x, y) {
    if (!this.is_paused || this.draw_mode === null) return;
    this.#draw_mouse(x, y);
  }

  mouse_release_event(x, y) {
    this.draw_mode = null;
  }

  key_press_event(key) {
    switch (key.toUpperCase()) {
      case "C":
        if (!this.is_paused) return;
        this.#clear_screen();
        this.#buffer_to_screen();
        break;
      case " ":
        this.is_paused = !this.is_paused;
        this.draw_mode = null;
        // Enable get/put pixels for mouse drawing.
        if (this.is_paused) this.old_buffer = this.new_buffer;
        break;
    }
  }

  paste_text_event(text) {
    if (!this.is_paused) return;
    this.#draw_pattern(this.mouse.x, this.mouse.y, text);
  }

  #draw_mouse(x, y) {
    [x, y] = this.pxctx.screenToWorld(x, y);
    if (this.draw_mode === null) {
      this.draw_mode = !this.is_cell_alive(x, y);
    }
    this.set_cell_state(x, y, this.draw_mode);
    this.#buffer_to_screen();
  }

  #draw_pattern(x, y, pattern) {
    [x, y] = this.pxctx.screenToWorld(x, y);
    const { width, height } = this.pxctx;
    const original_x = x;
    for (const cell of pattern.trim()) {
      switch (cell) {
        case "\n":
          x = original_x;
          ++y;
          break;
        case ".":
          this.set_cell_dead(x, y);
          ++x;
          break;
        case "*":
          this.set_cell_alive(x, y);
          ++x;
          break;
      }
    }
    this.#buffer_to_screen();
  }

  #init_game() {
    this.#screen_to_buffer();
    this.#clear_screen();
    const { width, height } = this.pxctx;
    for (let x = 0; x < width; ++x) {
      for (let y = 0; y < height; ++y) {
        this.set_cell_state(x, y, Math.random() > 0.9);
      }
    }
    this.#buffer_to_screen();
  }

  #screen_to_buffer() {
    this.old_buffer = this.pxctx.getBuffer();
    this.new_buffer = this.pxctx.cloneBuffer(this.old_buffer);
  }

  #clear_screen() {
    this.pxctx.setBuffer(this.new_buffer);
    this.pxctx.fillBuffer([0, 0, 0, 255]);
  }

  #buffer_to_screen() {
    this.pxctx.setBuffer(this.new_buffer);
    this.pxctx.putBuffer();
  }

  render() {
    if (this.is_paused) return;
    this.#screen_to_buffer();
    const { width, height } = this.pxctx;
    for (let x = 0; x < width; ++x) {
      for (let y = 0; y < height; ++y) {
        this.update_cell(x, y);
      }
    }
    this.#buffer_to_screen();
  }

  update_cell(x, y) {
    const is_alive = this.is_cell_alive(x, y);
    const is_dead = !is_alive;
    const nb_neighbors = this.count_neighbors(x, y);

    if (is_alive && (nb_neighbors < 2 || nb_neighbors > 3)) {
      // Under/over-population.
      this.set_cell_dead(x, y);
    } else if (is_dead && nb_neighbors === 3) {
      // Reproduction.
      this.set_cell_alive(x, y);
    }
  }

  count_neighbors(x, y) {
    let nb_neighbors = 0;
    for (let i = x - 1; i <= x + 1; ++i) {
      for (let j = y - 1; j <= y + 1; ++j) {
        if (i === x && j === y) continue;
        if (this.is_cell_alive(i, j)) ++nb_neighbors;
      }
    }
    return nb_neighbors;
  }

  is_cell_alive(x, y) {
    this.pxctx.setBuffer(this.old_buffer);
    const { width, height } = this.pxctx;
    // Cells outside of bounds move to the other side (taurus space).
    // If you want them dead instead, remove the modulo. As out of bound
    // pixels return [0, 0, 0, 0].
    const xmod = x.mod(width);
    const ymod = y.mod(height);
    const color = this.pxctx.getPixel(xmod, ymod);
    return color[0] === 255;
  }

  set_cell_alive(x, y) {
    this.set_cell_state(x, y, true);
  }

  set_cell_dead(x, y) {
    this.set_cell_state(x, y, false);
  }

  set_cell_state(x, y, state) {
    this.pxctx.setBuffer(this.new_buffer);
    const { width, height } = this.pxctx;
    const xmod = x.mod(width);
    const ymod = y.mod(height);
    const color = state ? 255 : 0;
    this.pxctx.setPixel(xmod, ymod, [color, color, color]);
  }
}

function main() {
  // Press space to pause / enter edit mode.
  // In edit mode:
  // - Press C to clear screen
  // - Use mouse to draw.
  // - Paste a pattern from the clipboard.
  return new GameOfLife().exec();
}

main();

/*

Fun Patterns
============

Gliders
***.***
*.....*
.*...*.
.......
.*...*.
*.....*
***.***

Gosper Glider Gun
........................*...........
......................*.*...........
............**......**............**
...........*...*....**............**
**........*.....*...**..............
**........*...*.**....*.*...........
..........*.....*.......*...........
...........*...*....................
............**......................

Pulsar
..***...***..
.............
*....*.*....*
*....*.*....*
*....*.*....*
..***...***..
.............
..***...***..
*....*.*....*
*....*.*....*
*....*.*....*
.............
..***...***..

Infinite Growth
********.*****...***......*******.*****

Penta-decathlon
***
*.*
***
***
***
***
*.*
***

Light-Weight Spaceship (LWSS)
.****
*...*
....*
*..*.

R-pentonimo
.**
**.
.*.

Diehard
......*.
**......
.*...***

Weekender
.*............*.......*............*.
.*............*.......*............*.
*.*..........*.*.....*.*..........*.*
.*............*.......*............*.
.*............*.......*............*.
..*...****...*.........*...****...*..
......****........*........****......
..****....****..*****..****....****..
...............*.*.*.*...............
....*......*.............*......*....
.....**..**......*.*......**..**.....
..............*..*.*..*..............
..............*..*.*..*..............
..............*.*...*.*..............
.....................................
.....................................
..............**.....**..............
..............**.....**..............
.....................................
................**.**................
...............*.*.*.*...............
...............*.*.*.*...............
.................*.*.................
...............**...**...............

*/
