class App extends Painter {
  render() {
    const { x, y, w, h } = this.rect;
    this.ctx.clearRect(x, y, w, h);

    this.ctx.fillStyle = "black";
    this.ctx.font = "12px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    const time = Date.now().toString();
    const text_x = x + w / 2;
    const text_y = y + h / 2;

    this.ctx.fillText(time, text_x, text_y);
  }
}

function main() {
  return new App().exec();
}

main();
