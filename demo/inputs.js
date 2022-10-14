class Square {
  constructor(parent, x, y, color, text) {
    this.rect = new Rect(x, y, 100, 100);
    this.ctx = parent.ctx;
    this.keyboard = parent.keyboard;
    this.color = color;
    this.text = text;
    this.did_initiate_drag = false;
    this.mouse_drag_offset = { x: 0, y: 0 };
    this.keyboard_speed = 700;
  }

  mouse_press_event(x, y) {
    if (this.rect.contains_point(x, y)) {
      this.mouse_drag_offset = {
        x: x - this.rect.x,
        y: y - this.rect.y,
      };
      this.did_initiate_drag = true;
    }
  }

  mouse_drag_event(x, y) {
    if (this.did_initiate_drag) {
      this.rect.x = x - this.mouse_drag_offset.x;
      this.rect.y = y - this.mouse_drag_offset.y;
    }
  }

  mouse_release_event() {
    this.did_initiate_drag = false;
  }

  handle_keyboard_presses(delta_time) {
    if (this.keyboard.is_key_pressed("q"))
      this.rect.x -= this.keyboard_speed * delta_time;
    if (this.keyboard.is_key_pressed("d"))
      this.rect.x += this.keyboard_speed * delta_time;
    if (this.keyboard.is_key_pressed("z"))
      this.rect.y -= this.keyboard_speed * delta_time;
    if (this.keyboard.is_key_pressed("s"))
      this.rect.y += this.keyboard_speed * delta_time;
  }

  wheel_event(dx, dy) {
    this.rect.x -= dx;
    this.rect.y -= dy;
  }

  render() {
    const { x, y, w, h, cx, cy } = this.rect;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(x, y, w, h);
    this.ctx.fillStyle = "white";
    this.ctx.font = "14px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(this.text, cx, cy);
  }
}

class Inputs extends Painter {
  setup() {
    this.mouse_square = new Square(this, 10, 10, "black", "Mouse");
    this.wheel_square = new Square(this, 10, 120, "green", "Wheel");
    this.keyboard_square = new Square(this, 10, 230, "red", "Keyboard");
  }

  mouse_press_event(x, y) {
    this.mouse_square.mouse_press_event(x, y);
  }

  mouse_drag_event(x, y) {
    this.mouse_square.mouse_drag_event(x, y);
  }

  mouse_release_event() {
    this.mouse_square.mouse_release_event();
  }

  key_press_event(key) {
    if (key !== " ") return;
    this.keyboard_square.initial_text = this.keyboard_square.text;
    this.keyboard_square.text = ":)";
  }

  key_release_event(key) {
    if (key !== " " || !this.keyboard_square.initial_text) return;
    this.keyboard_square.text = this.keyboard_square.initial_text;
  }

  wheel_event(x, y, dx, dy) {
    this.wheel_square.wheel_event(dx, dy);
  }

  render(delta_time) {
    this.keyboard_square.handle_keyboard_presses(delta_time);
    this.ctx.clear();
    this.mouse_square.render();
    this.wheel_square.render();
    this.keyboard_square.render();
  }
}

function main() {
  return new Inputs().exec();
}

main();
