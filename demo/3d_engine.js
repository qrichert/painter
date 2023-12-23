// Conventions used (left-handed/y-up coordinate system/clockwise):
//
// -x = left, +x = right
// -y = down, +y = up
// -z = back, +z = front
// ar = w/h
//
//
//
//      +y  +z
//       │/
// -x ───┼─── +x
//     / │
//  -z  -y
//
//        +1
//     ┌───┼───┐
// -1 ─┼───┼───┼─ +1
//     └───┼───┘
//        -1
//
// -1 ─────┬───── +1  1000  (zf = zfar)
//    \    │    /
//     \   │   /
//   -1 \──┼──/ +1    0.03  (zn = znear)
//       \/θ\/        63.5° (theta = Field of View, FoV)
//        \│/
//
// Why tan(θ) ? The bigger θ, the bigger tan on [0; 90]
//  - θ = 0°/2 = 0° -> tan(θ) = 0
//  - θ = 180°/2 = 90° -> tan(θ) = +Infinity
// So the less you see (in terms of FoV°), the smaller tan, and the more
// you see (more FoV° degrees), the bigger tan.
// This models reality well, since at 180° you see everything in front
// of you (+Inf), and at 0°, you see nothing (0).
// We use θ/2 because this way, the cone (frustrum) is cut in half,
// forming two identical right triangles (good for trig).
// The bigger the tan, the smaller a same value of X or Y (for example,
// X = 2 will be closer to the edge with FoV 10, thant with FoV 100,
// where it will be closer to the middle. So we want to divide X/Y by
// tan (bigger FoV = bigger tan = smaller X/Y (closer to middle).
// (Smaller FoV = smaller tan = bigger X/Y (closer to edge or outside
// of bounds)). So we need to divide X/Y by tan. But with matrices we
// can only multiply, so we need to multiply by the inverse,
// *1/tan(theta) instead of /tan(theta).
// This gives us an arbitrary ratio. <= 1 if X/Y <= tan(t), and > 1 if
// X/Y > tan(t). So values <= 1 are visible by the camera and >1 are not
// visible.
// This has nothing to do with depth. We only consider X/Y here,
// regardless of how far they are. Depth is taken into account at the
// next step, where we divide X/Y/Z by W. This division will shrink or
// X/Y the further away from the camera. So effectivery, A value W/Y
// greater than 1 (FoV) may effectively become visible if close enough
// (i.e., the divisor is big enough to bring the value >1 to <=1).
//
// -1 ─────┬─────
//    \    │    /
//     \   │   /
//   -1 \──┼──/
//       \/θ\/
//        \│/__________ (tan(t) [0;+inf] depending on FoV)
//
// meshes use triangles exclusively
// triangle vertexes are in clockwise order (for normals to point out?)
// Cube in front, "Bouh" behind
// 1 unit = 1 meter
// Add depth with floating particles
// Add random terrain with Y=(sin(x)+sin(z))/2
//
// Note: Standard matrices are used everywhere, then points are flipped
// AFTER the transform to accomodate our axis conventions.
//
// See also:
// - http://www.songho.ca/opengl/gl_transform.html#projection
// - https://github.com/OneLoneCoder/Javidx9/blob/master/PixelGameEngine/SmallerProjects/OneLoneCoder_PGE_olcEngine3D.cpp

/**
 * MATHS
 * -----
 */

class VecMat {
  static vector_x_matrix(vector, matrix) {
    const product = [];
    const dimension = vector.length;
    for (let col = 0; col < dimension; ++col) {
      let sum = 0;
      for (let row = 0; row < dimension; ++row) {
        sum += vector[row] * matrix[row][col];
      }
      product.push(sum);
    }
    return product;
  }

  static dot_product(a, b) {
    let sum = 0;
    const dimension = Math.min(a.length, b.length);
    for (let i = 0; i < dimension; ++i) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  static cross_product(a, b) {
    // Cross Product (= normal to two vectors ||= triangle)
    //
    //      p1                      ▲ .
    //      /\        A = p1-p0   N │/ A
    //     /  \       B = p2-p0     └───►
    // p0 /____\ p2                   B
    //
    // Nx = Ay * Bz - Az * By
    // Ny = Az * Bx - Ax * Bz
    // Nz = Ax * By - Ay * Bx
    const [ax, ay, az] = a;
    const [bx, by, bz] = b;

    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;

    return [nx, ny, nz];
  }

  static add(a, b) {
    const sum = [];
    const dimension = Math.min(a.length, b.length);
    for (let i = 0; i < dimension; ++i) {
      sum.push(a[i] + b[i]);
    }
    return sum;
  }

  static subtract(a, b) {
    const difference = [];
    const dimension = Math.min(a.length, b.length);
    for (let i = 0; i < dimension; ++i) {
      difference.push(a[i] - b[i]);
    }
    return difference;
  }

  static mean(...vectors) {
    const mean = [];
    const nb_vectors = vectors.length;
    const dimension = Math.min(...vectors.map((v) => v.length));
    for (let i = 0; i < dimension; ++i) {
      const sum = vectors.reduce((sum, v) => sum + v[i], 0);
      mean.push(sum / nb_vectors);
    }
    return mean;
  }

  static normalize(vector) {
    const length = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));
    return vector.map((x) => x / length);
  }

  // TODO: matrix_x_matrix
  // TODO: combine_matrices([m1, m2, ..., mn])
  //  m1*m2, (m1*m2)*m3, ...

  /**
   * Scaling Matrix
   *
   * ┌            ┐ ┌                  ┐
   * │ x  y  z  w │ │ sx   0    0    0 │
   * └            ┘ │ 0    sy   0    0 │
   *                │ 0    0    sz   0 │
   *                │ 0    0    0    1 │
   *                └                  ┘
   *
   * @param {Number} sx (factor)
   * @param {Number} sy (factor)
   * @param {Number} sz (factor)
   * @returns {Number[][]}
   */
  static scaling(sx, sy, sz) {
    return [
      [sx, 0, 0, 0],
      [0, sy, 0, 0],
      [0, 0, sz, 0],
      [0, 0, 0, 1],
    ];
  }

  /**
   * Rotation Matrix
   *
   * ┌         ┐ ┌                                                               ┐
   * │ x  y  z │ │ cosα*cosβ  cosα*sinβ*sinγ-sinα*cosγ  cosα*sinβ*cosγ+sinα*sinγ │
   * └         ┘ │ sinα*cosβ  sinα*sinβ*sinγ+cosα*cosγ  sinα*sinβ*cosγ-cosα*sinγ │
   *             │   -sinβ           cosβ*sinγ                  cosβ*cosγ        │
   *             └                                                               ┘
   *
   * @param {Number} gamma (degrees around X)
   * @param {Number} beta (degrees around Y)
   * @param {Number} alpha (degrees around Z)
   * @returns {Number[][]}
   */
  static rotation(gamma, beta, alpha) {
    const cosa = Math.cos(alpha);
    const sina = Math.sin(alpha);
    const cosb = Math.cos(beta);
    const sinb = Math.sin(beta);
    const cosg = Math.cos(gamma);
    const sing = Math.sin(gamma);

    return [
      [
        cosa * cosb,
        cosa * sinb * sing - sina * cosg,
        cosa * sinb * cosg + sina * sing,
      ],
      [
        sina * cosb,
        sina * sinb * sing + cosa * cosg,
        sina * sinb * cosg - cosa * sing,
      ],
      [-sinb, cosb * sing, cosb * cosg],
    ];
  }

  /**
   * TODO: Does not work (obviously, since we don't mult.)
   * Translation Matrix
   *
   * ┌            ┐ ┌                  ┐
   * │ x  y  z  w │ │ 1    0    0   tx │
   * └            ┘ │ 0    1    0   ty │
   *                │ 0    0    1   tz │
   *                │ 0    0    0    1 │
   *                └                  ┘
   *
   * @param {Number} tx (unit space)
   * @param {Number} ty (unit space)
   * @param {Number} tz (unit space)
   * @returns {Number[][]}
   */
  static translation(tx, ty, tz) {
    return [
      [1, 0, 0, tx],
      [0, 1, 0, ty],
      [0, 0, 1, tz],
      [0, 0, 0, 1],
    ];
  }

  /**
   * Perspective Projection Matrix
   *
   * theta = FoV in radians
   * a = 1/(w/h) (aspect ratio)
   * f = 1/tan(theta/2)
   * q = zf/(zf-zn)
   *
   * ┌            ┐ ┌                  ┐
   * │ x  y  z  w │ │ af   0    0    0 │
   * └            ┘ │ 0    f    0    0 │
   *                │ 0    0    q    1 │
   *                │ 0    0  -zn*q  0 │
   *                └                  ┘
   *
   * @param {Number} znear (unit space)
   * @param {Number} zfar (unit space)
   * @param {Number} fov (degrees)
   * @param {Number} ar (width / height)
   * @returns {Number[][]}
   */
  static perspective(znear, zfar, fov, ar) {
    const theta = (fov / 180) * Math.PI;
    const a = 1 / ar;
    const f = 1 / Math.tan(theta / 2);
    const q = zfar / (zfar - znear);

    return [
      [a * f, 0, 0, 0],
      [0, f, 0, 0],
      [0, 0, q, 1],
      [0, 0, -znear * q, 0],
    ];
  }

  /**
   * Orthographic Projection Matrix
   *
   * scale_x = 2.0 / (right - left)
   * scale_y = 2.0 / (top - bottom)
   * scale_z = 2.0 / (far - near)
   * mid_x = (right + left) / (right - left)
   * mid_y = (top + bottom) / (top - bottom)
   * mid_z = (far + near) / (far - near)
   *
   * ┌            ┐ ┌                                      ┐
   * │ x  y  z  w │ │ a*-scale_x   0         0      -mid_x │
   * └            ┘ │    0      -scale_y     0      -mid_y │
   *                │    0         0     -scale_z   -mid_z │
   *                │    0         0         0         1   │
   *                └                                      ┘
   *
   * @param {Number} znear (unit space)
   * @param {Number} zfar (unit space)
   * @param {Number} ar (width / height)
   * @returns {Number[][]}
   */
  static orthographic(znear, zfar, ar) {
    const [left, right] = [-1, 1];
    const [bottom, top] = [-1, 1];

    const a = 1 / ar;
    const scale_x = 2.0 / (right - left);
    const scale_y = 2.0 / (top - bottom);
    const scale_z = 2.0 / (zfar - znear);
    const mid_x = -(right + left) / (right - left);
    const mid_y = -(top + bottom) / (top - bottom);
    const mid_z = -(zfar + znear) / (zfar - znear);

    return [
      [a * -scale_x, 0, 0, mid_x],
      [0, -scale_y, 0, mid_y],
      [0, 0, -scale_z, mid_z],
      [0, 0, 0, 1],
    ];
  }
}

/*
 * MESHES & MODELS
 * ---------------
 *
 * Mesh > Triangle > Vertex
 */

/**
 * Meshes (or wireframes), represent the raw structure of elements in
 * unit space, without transformations. They never change.
 *
 * The structure is represented by points [x, y, z], organized into
 * triangles. Triangles together form faces, and faces form the mesh.
 */
class AbstractMesh {
  constructor(mesh, to_origin = null) {
    this._mesh = mesh;
    this._triangles = [];
    this._vertices = [];
    this.#extract_mesh_components();
    this.#set_origin(to_origin);
  }

  static from_obj(obj) {
    const lines = obj.split("\n");
    const vertices = [];
    const triangles = [];
    for (const line of lines) {
      const components = line.split(" ");
      if (!components) continue;
      if (components[0] === "v") {
        const x = Number.parseFloat(components[1]);
        const y = Number.parseFloat(components[2]);
        const z = Number.parseFloat(components[3]);
        vertices.push([x, y, z]);
      } else if (components[0] === "f") {
        if (components[1].includes("/")) {
          // 61/1/1 65/2/2 49/3/3 format
          components[1] = components[1].split("/")[0];
          components[2] = components[2].split("/")[0];
          components[3] = components[3].split("/")[0];
        }
        const v1 = structuredClone(
          vertices[Number.parseInt(components[1]) - 1],
        );
        const v2 = structuredClone(
          vertices[Number.parseInt(components[2]) - 1],
        );
        const v3 = structuredClone(
          vertices[Number.parseInt(components[3]) - 1],
        );
        triangles.push([v1, v2, v3]);
      }
    }
    return triangles;
  }

  #extract_mesh_components() {
    for (const triangle of this._mesh) {
      this._triangles.push(triangle);
      for (const vertex of triangle) {
        this._vertices.push(vertex);
      }
    }
  }

  #set_origin(to_origin) {
    if (to_origin === null) return;
    const [tx, ty, tz] = to_origin;
    for (const vertex of this.vertices) {
      vertex[0] += tx;
      vertex[1] += ty;
      vertex[2] += tz;
    }
  }

  get triangles() {
    return this._triangles;
  }

  get vertices() {
    return this._vertices;
  }

  clone() {
    const mesh = structuredClone(this._mesh);
    return new AbstractMesh(mesh);
  }

  /**
   * Adds additional data point to triangle.
   * Before: [x, y, z]
   * After: [x, y, z, surface mean, unit normal, render normal]
   *
   * Render normal, when combined with surface mean, is used to display
   * the normal on screen, nicely put in the middle (mean) of the
   * triangle and a nice size.
   */
  compute_normals() {
    for (const triangle of this.triangles) {
      const [p0, p1, p2] = triangle;
      const a = VecMat.subtract(p1, p0);
      const b = VecMat.subtract(p2, p0);
      const n = VecMat.cross_product(a, b);
      const n_unit = VecMat.normalize(n);
      const mean = VecMat.mean(p0, p1, p2);

      const n_render = VecMat.add(
        mean,
        n_unit.map((x) => x * 0.1),
      );

      // [n_unit] -> dirty trick so we know not to project/transform it.
      triangle.push(mean, [n_unit], n_render);
    }
  }

  cull_triangles_facing_away() {
    this._triangles = this._triangles.filter((triangle) => {
      const similarity = triangle[6][0];
      return similarity < 0.5;
    });
  }

  sort_triangles_by_depth() {
    // We don't use a pixel depth buffer, too complex for this
    // simple demo, just sort by mean depth.
    this._triangles = this._triangles.sort((a, b) => {
      const a_mean_depth = a[3][2];
      const b_mean_depth = b[3][2];
      if (a_mean_depth > b_mean_depth) return -1;
      if (a_mean_depth === b_mean_depth) return 0;
      if (a_mean_depth < b_mean_depth) return 1;
    });
  }
}

class CubeMesh extends AbstractMesh {
  constructor() {
    // prettier-ignore
    super([
      // Top.
      [[0, 1, 0], [0, 1, 1], [1, 1, 1]],
      [[0, 1, 0], [1, 1, 1], [1, 1, 0]],
      // Bottom.
      [[1, 0, 1], [0, 0, 1], [0, 0, 0]],
      [[1, 0, 0], [1, 0, 1], [0, 0, 0]],
      // // North.
      [[1, 1, 1], [0, 1, 1], [0, 0, 1]],
      [[1, 0, 1], [1, 1, 1], [0, 0, 1]],
      // // South.
      [[0, 0, 0], [0, 1, 0], [1, 1, 0]],
      [[0, 0, 0], [1, 1, 0], [1, 0, 0]],
      // // East.
      [[1, 0, 0], [1, 1, 0], [1, 1, 1]],
      [[1, 0, 0], [1, 1, 1], [1, 0, 1]],
      // // West.
      [[0, 1, 1], [0, 1, 0], [0, 0, 0]],
      [[0, 0, 1], [0, 1, 1], [0, 0, 0]],
    ], [-0.5, -0.5, -0.5]);
  }
}

class PyramidMesh extends AbstractMesh {
  constructor() {
    // prettier-ignore
    super([
      // Base.
      [[1, 0, 1], [0, 0, 1], [0, 0, 0]],
      [[1, 0, 0], [1, 0, 1], [0, 0, 0]],
      // North.
      [[1, 0, 1], [0.5, 1 / Math.PHI, 0.5], [0, 0, 1]],
      // South.
      [[0, 0, 0], [0.5, 1 / Math.PHI, 0.5], [1, 0, 0]],
      // East.
      [[1, 0, 0], [0.5, 1 / Math.PHI, 0.5], [1, 0, 1]],
      // West.
      [[0, 0, 1], [0.5, 1 / Math.PHI, 0.5], [0, 0, 0]],
    ], [-0.5, -(1 / Math.PHI / 2), -0.5]);
  }
}

class SuzanneMesh extends AbstractMesh {
  constructor() {
    super(AbstractMesh.from_obj(suzanne));
  }
}

/**
 * Models are meshes with transformations applied. They still live in
 * unit space.
 * Mesh + transformation (scale, rotate, translate) = Model
 */
class AbstractModel {
  constructor(mesh) {
    this.mesh = mesh;
    this._scaling = [1, 1, 1];
    this._rotation = [0, 0, 0];
    this._translation = [0, 0, 0];
  }

  scale(x, y, z) {
    this._scaling[0] += x;
    this._scaling[1] += y;
    this._scaling[2] += z;
  }

  rotate(x, y, z) {
    this._rotation[0] += x;
    this._rotation[1] += y;
    this._rotation[2] += z;
  }

  translate(x, y, z) {
    this._translation[0] += x;
    this._translation[1] += y;
    this._translation[2] += z;
  }

  get_transformed_model() {
    const mesh = this.mesh.clone();
    // 1. scaling, 2. rotation, 3. translation
    const scamat = VecMat.scaling(...this._scaling);
    const rotmat = VecMat.rotation(...this._rotation);
    const tramat = VecMat.translation(...this._translation);

    mesh.triangles.map((triangle) => {
      for (const vertex of triangle) {
        // Contains normal vertex.
        let [x, y, z] = vertex;
        let [tx, ty, tz] = this._translation;
        [x, y, z] = VecMat.vector_x_matrix([x, y, z], scamat);
        [x, y, z] = VecMat.vector_x_matrix([x, y, z], rotmat);
        vertex[0] = x + tx;
        vertex[1] = y + ty;
        vertex[2] = z + tz;
      }
    });

    return new AbstractModel(mesh);
  }
}

class CubeModel extends AbstractModel {
  constructor() {
    super(new CubeMesh());
  }
}

class PyramidModel extends AbstractModel {
  constructor() {
    super(new PyramidMesh());
  }
}

class SuzanneModel extends AbstractModel {
  constructor() {
    super(new SuzanneMesh());
  }
}

const Projection = {
  Perspective: "Perspective",
  Orthographic: "Orthographic",
};

/**
 * The camera converts Models il 3D world space, to points in
 * 2D screen space.
 */
class Camera {
  constructor(parent) {
    this.parent = parent;
    this.rect = parent.rect;
    this.znear = 0.003; // 30mm
    this.zfar = 1000; // 1000m
    this.fov = 63.4; //63.4deg ~ 35mm focal length
    this.projection = Projection.Perspective;
    this.direction = [0, 0, 0];
  }

  project_model(model) {
    const projected_model = model.get_transformed_model();
    projected_model.mesh.compute_normals(); // This adds 4th vertex to triangle representing normal.
    projected_model.mesh.triangles.map((triangle) => {
      const normal = triangle[4][0];
      const mean = triangle[3];
      // [-1, 1]
      const dot_product = VecMat.dot_product(
        normal,
        VecMat.subtract(VecMat.normalize(mean), this.direction),
      );
      const similarity = (dot_product + 1) / 2;
      const min = 0.42;
      const max = 0.9;

      // 1-  because we need inverse since face away = similar
      const lightness = (1 - similarity) * (max - min) + min;
      triangle.push([similarity], [lightness]);
    });
    projected_model.mesh.triangles.map((triangle) => {
      for (const vertex of triangle) {
        if (vertex.length === 1) {
          continue;
        } // Unit normal, don't transform
        // Contains normal vertex.
        const [x, y, z] = this.#project_vertex(vertex);
        vertex[0] = x;
        vertex[1] = y;
        vertex[2] = z;
      }
    });
    if (!this.parent.show_culled_triangles || this.parent.show_shading) {
      projected_model.mesh.cull_triangles_facing_away();
    }
    projected_model.mesh.sort_triangles_by_depth();
    return projected_model;
  }

  #project_vertex(vertex) {
    // [x, y, z, w]
    const vector = [...vertex, 1];
    const matrix = this.#get_projection_matrix();
    // [x', y', z', z]
    const [x, y, z, w] = VecMat.vector_x_matrix(vector, matrix);
    if (w === 0) return [x, y, z];
    return [x / w, y / w, z / w];
  }

  #get_projection_matrix() {
    const { znear, zfar, fov } = this;
    const ar = this.rect.ar;
    if (this.projection === Projection.Perspective) {
      return VecMat.perspective(znear, zfar, fov, ar);
    } else if (this.projection === Projection.Orthographic) {
      return VecMat.orthographic(znear, zfar, ar);
    }
  }
}

class App extends Painter {
  setup() {
    this.camera = new Camera(this);

    this.models = [];

    this.cube = new CubeModel();
    // TODO: Add function to center mesh at barycenter.
    this.cube.translate(-0.75, 0, 3.5);
    this.models.push(this.cube);

    this.pyramid = new PyramidModel();
    this.pyramid.translate(0.75, 0, 3.5);
    this.models.push(this.pyramid);

    this.suzanne = new SuzanneModel();
    this.suzanne.scale(-0.5, -0.5, -0.5);
    this.suzanne.rotate(0, Math.PI, 0); // TODO: 180deg
    this.suzanne.translate(0, 1.2, 3.5);
    this.models.push(this.suzanne);

    this.show_wireframe = true;
    this.show_normals = false;
    this.show_shading = true;
    this.show_culled_triangles = true;
  }

  key_press_event(key) {
    if (key === "5") {
      this.camera.projection = Projection.Orthographic;
    } else if (key === "0") {
      this.camera.projection = Projection.Perspective;
    } else if (key === "g") {
      this.show_wireframe = !this.show_wireframe;
    } else if (key === "h") {
      this.show_normals = !this.show_normals;
    } else if (key === "j") {
      this.show_shading = !this.show_shading;
    } else if (key === "k") {
      this.show_culled_triangles = !this.show_culled_triangles;
    }
  }

  render(delta_time) {
    this.ctx.clear();
    this.#handle_inputs(delta_time);

    for (const model of this.models) {
      const projected_model = this.camera.project_model(model);
      this.#draw_model(projected_model);
    }

    this.ctx.font = "12px monospace";
    this.ctx.fillStyle = "black";
    this.ctx.textBaseline = "top";
    this.ctx.fillText("[←→↑↓:=] rotate", 10, 10);
    this.ctx.fillText("[qdzsae] move", 10, 25);
    this.ctx.fillText("[cvoplmbn] scale", 10, 40);

    this.ctx.fillText(
      `[g] show wireframe ${this.show_wireframe ? "*" : ""}`,
      10,
      65,
    );
    this.ctx.fillText(
      `[h] show normals ${this.show_normals ? "*" : ""}`,
      10,
      80,
    );
    this.ctx.fillText(
      `[j] show shading ${this.show_shading ? "*" : ""}`,
      10,
      95,
    );
    this.ctx.fillText(
      `[k] show culled triangles ${
        this.show_culled_triangles && !this.show_shading ? "*" : ""
      }`,
      10,
      110,
    );
  }

  #handle_inputs(delta_time) {
    let tx = 0;
    let ty = 0;
    let tz = 0;
    let rx = 0;
    let ry = 0;
    let rz = 0;
    let sx = 0;
    let sy = 0;
    let sz = 0;
    if (this.keyboard.is_key_pressed("q")) tx -= 7 * delta_time;
    if (this.keyboard.is_key_pressed("d")) tx += 7 * delta_time;
    if (this.keyboard.is_key_pressed("z")) tz += 7 * delta_time;
    if (this.keyboard.is_key_pressed("s")) tz -= 7 * delta_time;
    if (this.keyboard.is_key_pressed("e")) ty += 7 * delta_time;
    if (this.keyboard.is_key_pressed("a")) ty -= 7 * delta_time;
    if (this.keyboard.is_key_pressed("ArrowUp")) rx -= 7 * delta_time;
    if (this.keyboard.is_key_pressed("ArrowDown")) rx += 7 * delta_time;
    if (this.keyboard.is_key_pressed("ArrowLeft")) ry -= 7 * delta_time;
    if (this.keyboard.is_key_pressed("ArrowRight")) ry += 7 * delta_time;
    if (this.keyboard.is_key_pressed("=")) rz -= 7 * delta_time;
    if (this.keyboard.is_key_pressed(":")) rz += 7 * delta_time;
    if (this.keyboard.is_key_pressed("o")) sx -= 7 * delta_time;
    if (this.keyboard.is_key_pressed("p")) sx += 7 * delta_time;
    if (this.keyboard.is_key_pressed("l")) sy -= 7 * delta_time;
    if (this.keyboard.is_key_pressed("m")) sy += 7 * delta_time;
    if (this.keyboard.is_key_pressed("b")) sz -= 7 * delta_time;
    if (this.keyboard.is_key_pressed("n")) sz += 7 * delta_time;
    if (this.keyboard.is_key_pressed("c")) sx -= 7 * delta_time;
    if (this.keyboard.is_key_pressed("v")) sx += 7 * delta_time;
    if (this.keyboard.is_key_pressed("c")) sy -= 7 * delta_time;
    if (this.keyboard.is_key_pressed("v")) sy += 7 * delta_time;
    if (this.keyboard.is_key_pressed("c")) sz -= 7 * delta_time;
    if (this.keyboard.is_key_pressed("v")) sz += 7 * delta_time;

    this.models.map((model) => model.scale(sx, sy, sz));
    this.models.map((model) => model.translate(tx, ty, tz));
    this.models.map((model) => model.rotate(rx, ry, rz));
  }

  #draw_model(model) {
    for (const triangle of model.mesh.triangles) {
      for (let i = 0; i < triangle.length; ++i) {
        const vertex = triangle[i];
        if (vertex.length === 1) {
          continue;
        } // Unit normal, don't transform
        const [x, y] = this.#world_to_screen(vertex); // z, w get ditched
        triangle[i] = [x, y];
      }
      const p1 = triangle[0];
      const p2 = triangle[1];
      const p3 = triangle[2];
      const mean = triangle[3];
      const n_render = triangle[5];
      const lightness = triangle[7][0];
      const color = 255 * lightness;
      this.ctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
      if (this.show_shading) {
        this.ctx.fillTriangle(...p1, ...p2, ...p3);
      }
      if (this.show_wireframe) {
        this.ctx.strokeTriangle(...p1, ...p2, ...p3);
      }
      if (this.show_normals) {
        this.ctx.save();
        this.ctx.strokeStyle = "cyan";
        this.ctx.lineWidth = 1;
        this.ctx.strokeLine(...mean, ...n_render);
        this.ctx.restore();
      }
    }
  }

  #world_to_screen(p) {
    // [-1, 1] + 1 -> [0, 2] / 2 -> [0, 1] * screen
    // Flip Y because screen coordinates are inverted.
    let [x, y] = p;
    const { w, h } = this.rect;
    x = ((x + 1) / 2) * w;
    y = h - ((y + 1) / 2) * h;
    return [x, y];
  }
}

function main() {
  return new App().exec();
}

main();
