export const skyVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`;

export const skyFragment = /* glsl */ `
  varying vec2 vUv;
  uniform vec2 offset;
  uniform float aspect;
  uniform float time;

  float hash(vec2 p) {
    vec3 t = fract(vec3(p.xyx) * .1031);
    t += dot(t, t.yzx + 33.33);
    return fract((t.x + t.y) * t.z);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x),
               mix(hash(i + vec2(0., 1.)), hash(i + 1.), u.x), u.y);
  }

  float cloud(vec2 p) {
    mat2 twist = mat2(.8, -.6, .6, .8);
    float sum = 0.;
    float weight = .52;
    for (int i = 0; i < 5; ++i) {
      sum += weight * noise(p);
      p = twist * p * 2.1 + vec2(4.5, 1.6);
      weight *= .48;
    }
    return sum;
  }

  void main() {
    vec2 p = (vUv - .5) * vec2(max(aspect, .66), 1.);
    p += offset * .032;
    p.x -= max(0., aspect - .8) * .105;
    vec2 q = p * vec2(3.8, 2.4);
    float drift = time * .021;
    vec2 folded = vec2(cloud(q + vec2(drift, 1.)), cloud(q + vec2(7.1, -drift)));
    float vapor = cloud(q + 2.8 * folded);
    float spine = p.x + .14 * sin(p.y * 7. + 1.6) + p.y * .43;
    float envelope = exp(-abs(spine) * 4.8);
    float fine = cloud(q * 2.4 + 3.0 * folded);
    float silk = pow(clamp(vapor * 1.28, 0., 1.), 2.3) * envelope;
    float rim = exp(-abs(spine + .13 + (fine - .5) * .36) * 12.) * smoothstep(.31, .74, fine);
    vec3 deep = vec3(.015, .006, .035);
    vec3 c = deep + silk * vec3(.27, .122, .44);
    c += (rim * .8 + silk * fine * .62) * vec3(.47, .28, .69);
    c += smoothstep(.33, .83, vapor) * exp(-abs(spine - .14) * 6.) * vec3(.20, .07, .19);
    c += .056 * envelope * vec3(.95, .48, .51);
    float grain = hash(gl_FragCoord.xy);
    c += (grain - .5) * .008;
    gl_FragColor = vec4(max(c, 0.), 1.);
  }
`;

export const ribbonVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const ribbonFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float time;
  uniform float phase;
  uniform float glow;

  void main() {
    float edge = abs(vUv.x * 2. - 1.);
    float center = exp(-edge * edge * 17.);
    float filaments = pow(.5 + .5 * sin(vUv.x * 55. + sin(vUv.y * 36.) * 1.9), 4.);
    float train = .48 + .52 * pow(.5 + .5 * cos(vUv.y * 31. + time * 1.35 + phase), 5.);
    float borders = exp(-abs(edge - .6) * 18.) * .4;
    float fade = smoothstep(0., .09, vUv.y) * (1. - smoothstep(.92, 1., vUv.y));
    vec3 tint = mix(vec3(1.05, .40, .105), vec3(1.72, .96, .48), center);
    float intensity = (center * .82 + borders + filaments * .23) * train * fade;
    gl_FragColor = vec4(tint * glow, intensity * .66);
  }
`;

export const dustVertex = /* glsl */ `
  attribute float seed;
  uniform float time;
  uniform float pixelRatio;
  varying float twinkle;
  varying float warmth;

  void main() {
    vec3 p = position;
    p.y = mod(p.y + 12. - time * (.15 + seed * .42), 24.) - 12.;
    p.x += sin(time * .28 + seed * 35. + p.y * .47) * .38;
    vec4 view = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp((11. + pow(seed, 7.) * 48.) / max(1., -view.z), .7, 8.) * pixelRatio;
    twinkle = .43 + .57 * pow(.5 + .5 * sin(time * 1.6 + seed * 113.), 2.);
    warmth = seed;
  }
`;

export const dustFragment = /* glsl */ `
  varying float twinkle;
  varying float warmth;
  void main() {
    vec2 p = gl_PointCoord - .5;
    float r = length(p);
    float sparkle = exp(-r * r * 17.) * (1. - smoothstep(.38, .5, r));
    vec3 tone = mix(vec3(.55,.31,.93), vec3(1.47,.91,.43), smoothstep(.35, .9, warmth));
    gl_FragColor = vec4(tone, sparkle * twinkle * .75);
  }
`;
