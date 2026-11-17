// Fondo de piscina en WebGL puro (sin librerías): azulejos, línea de calle,
// cáusticas de luz animadas y ondas que deja el cursor o el dedo.

const MAX_RIPPLES = 10;

const vert = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const frag = `
precision highp float;
uniform vec2 uRes;          // px del lienzo
uniform float uScale;       // px CSS -> px del lienzo
uniform float uTime;
uniform vec4 uRip[${MAX_RIPPLES}];   // x, y (px CSS, y hacia abajo), t0, fuerza
uniform int uCount;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// cáusticas: bordes de celdas de Voronoi que se mueven (F2 - F1 pequeño = línea brillante)
float caustic(vec2 p, float t) {
  vec2 i = floor(p), f = fract(p);
  float f1 = 8.0, f2 = 8.0;
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = hash2(i + g);
    o = 0.5 + 0.42 * sin(t + 6.2831 * o);
    float d = length(g + o - f);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
  }
  return exp(-(f2 - f1) * 9.0);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash2(i).x, b = hash2(i + vec2(1, 0)).x, c = hash2(i + vec2(0, 1)).x, d = hash2(i + vec2(1, 1)).x;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 frag = gl_FragCoord.xy / uScale;                 // px CSS, y hacia arriba
  vec2 css = vec2(frag.x, uRes.y / uScale - frag.y);   // px CSS, y hacia abajo
  float t = uTime;

  // refracción de la superficie: ondulación lenta + ondas del cursor
  vec2 refr = vec2(noise(css * 0.006 + t * 0.15), noise(css * 0.006 - t * 0.12 + 7.0)) - 0.5;
  refr *= 22.0;
  float glint = 0.0;
  for (int k = 0; k < ${MAX_RIPPLES}; k++) {
    if (k >= uCount) break;
    vec4 r = uRip[k];
    float age = t - r.z;
    if (age < 0.0 || age > 3.5) continue;
    vec2 d = css - r.xy;
    float dist = length(d);
    float front = age * 240.0;
    float env = exp(-pow((dist - front) / 70.0, 2.0)) * exp(-age * 1.1) * r.w;
    float wave = sin((dist - front) * 0.09) * env;
    refr += normalize(d + 0.001) * wave * 16.0;
    glint += max(wave, 0.0) * 0.35;
  }
  vec2 q = css + refr;

  // azulejos de 34 px con junta clara
  vec2 tile = fract(q / 34.0);
  vec2 edge = min(tile, 1.0 - tile) * 34.0;
  float grout = 1.0 - smoothstep(0.6, 1.8, min(edge.x, edge.y));
  vec2 tid = floor(q / 34.0);
  float tvar = hash2(tid).x * 0.06 - 0.03;

  // profundidad: más oscuro arriba (zona honda) y hacia los bordes
  vec2 uv = frag / (uRes / uScale);
  vec3 deep = vec3(0.015, 0.16, 0.36);
  vec3 shallow = vec3(0.05, 0.42, 0.78);
  vec3 col = mix(deep, shallow, smoothstep(1.05, 0.0, uv.y) * 0.85 + 0.1);
  col += tvar;
  col = mix(col, col + vec3(0.18, 0.24, 0.26), grout * 0.55);

  // línea de calle: franja azul marino con su "T" al final
  float laneX = uRes.x / uScale * 0.74;
  float lane = 1.0 - smoothstep(26.0, 29.0, abs(q.x - laneX));
  float laneEnd = uRes.y / uScale * 0.16;
  lane *= smoothstep(laneEnd - 2.0, laneEnd + 2.0, q.y);
  float tbar = (1.0 - smoothstep(26.0, 29.0, abs(q.y - laneEnd))) * (1.0 - smoothstep(110.0, 113.0, abs(q.x - laneX)));
  lane = max(lane, tbar);
  col = mix(col, vec3(0.02, 0.07, 0.2), lane * 0.85);

  // cáusticas: dos capas a distinta escala y velocidad
  float c1 = caustic(q * 0.0105, t * 0.55);
  float c2 = caustic(q * 0.017 + 3.1, t * 0.8 + 1.3);
  float c = c1 * 0.75 + c2 * 0.5;
  c = pow(c, 1.6);
  col += vec3(0.55, 0.9, 1.0) * c * (0.55 + 0.45 * smoothstep(1.0, 0.2, uv.y));
  col += vec3(0.8, 0.95, 1.0) * glint;

  // viñeta suave
  float vig = smoothstep(1.25, 0.35, length((uv - vec2(0.5, 0.45)) * vec2(1.1, 1.0)));
  col *= 0.72 + 0.28 * vig;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

export class Water {
  constructor(canvas, { reduced = false } = {}) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('Sin WebGL');
    this.gl = gl;
    this.canvas = canvas;
    this.reduced = reduced;
    this.t0 = performance.now();
    this.ripples = [];
    this.visible = true;
    this.running = false;

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.u = {
      res: gl.getUniformLocation(prog, 'uRes'),
      scale: gl.getUniformLocation(prog, 'uScale'),
      time: gl.getUniformLocation(prog, 'uTime'),
      rip: gl.getUniformLocation(prog, 'uRip'),
      count: gl.getUniformLocation(prog, 'uCount'),
    };

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();

    new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible) this.start();
    }).observe(canvas);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.start(); });
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    // resolución interna reducida: la luz del agua es suave y así va fluido en cualquier móvil
    const scale = Math.min(window.devicePixelRatio || 1, 1) * 0.75;
    this.canvas.width = Math.round(w * scale);
    this.canvas.height = Math.round(h * scale);
    this.scale = scale;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.draw();
  }

  now() { return (performance.now() - this.t0) / 1000; }

  /** Onda en (x, y) px CSS relativos al lienzo. */
  ripple(x, y, strength = 1) {
    this.ripples.push([x, y, this.now(), strength]);
    if (this.ripples.length > MAX_RIPPLES) this.ripples.shift();
    if (this.reduced) this.start();
  }

  draw() {
    const gl = this.gl;
    const t = this.reduced ? 12.0 : this.now();
    gl.uniform2f(this.u.res, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.scale, this.scale);
    gl.uniform1f(this.u.time, t);
    const flat = new Float32Array(MAX_RIPPLES * 4);
    this.ripples.forEach((r, i) => flat.set(r, i * 4));
    gl.uniform4fv(this.u.rip, flat);
    gl.uniform1i(this.u.count, this.ripples.length);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.visible || document.hidden) { this.running = false; return; }
      this.draw();
      if (this.reduced) { this.running = false; return; }   // un solo fotograma estático
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
