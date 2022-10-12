class Noise extends Painter {
  setup() {
    this.pxctx.pixelSize = 8;
  }

  render() {
    const { width, height } = this.pxctx;
    for (let x = 0; x < width; ++x) {
      for (let y = 0; y < height; ++y) {
        const color = [
          this.#random_256(),
          this.#random_256(),
          this.#random_256(),
          255,
        ];
        this.pxctx.setPixel(x, y, color);
      }
    }
    this.pxctx.putBuffer();
  }

  #random_256() {
    // random -> [0; 1) -> [0, 255]
    return Math.floor(Math.random() * 256);
  }
}

function main() {
  return new Noise().exec();
}

main();
