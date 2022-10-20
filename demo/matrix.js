// https://github.com/Rezmason/matrix
// https://buf.com/films/the-matrix-resurrections/

class App extends Painter {
  setup() {
    this.glyphs = "ABC123()@!";
    this.#init_scene();
  }

  #init_scene() {
    const font_size = 20;
    const ctx = this.create_ctx(font_size * this.glyphs.length, font_size);

    ctx.font = `bold ${font_size}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#03ca37";
    ctx.fillText(this.glyphs, 0, 0);

    this.ctx.imageSmoothingEnabled = false; // For pixelated effect.
    this.ctx.drawImage(
      ctx.canvas,
      0,
      0,
      ctx.canvas.width * 10,
      ctx.canvas.height * 10
    );

    const charsize = [5, 7]; // 5 pixels * 7 pixels
  }

  resize_event() {
    this.#init_scene();
  }

  render() {
    //this.ctx.clear();
    //this.#fill_background();

    return;

    this.ctx.fillStyle = "black";
    this.ctx.font = "12px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
  }

  #fill_background() {
    const { x, y, w, h } = this.rect;
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(x, y, w, h);
  }
}

function main() {
  return new App().exec();
}

main();
