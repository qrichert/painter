const State = {
  OnCable: "OnCable",
  InTheAir: "InTheAir",
};

class AnimatedObject {
  // Moving sprite
}

class Enemy {}

class GameScene {}

class ThrowGerard extends Painter {
  render() {
    const { cx, cy } = this.rect;
    this.ctx.clear();
    this.ctx.font = "24px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(":)", cx, cy);
  }
}

function main() {
  return new ThrowGerard().exec();
}

main();
