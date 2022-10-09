class App extends Painter {
  render() {
    const { cx, cy } = this.rect;

    this.ctx.clear();

    this.ctx.fillStyle = "black";
    this.ctx.font = "12px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    this.ctx.fillText(Date.now().toString(), cx, cy);
  }
}

function main() {
  return new App().exec();
}

main();
