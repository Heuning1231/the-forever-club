export const ribbonVertex = /* glsl */ `
  varying vec2 silkUv;
  void main() {
    silkUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`;

export const ribbonFragment = /* glsl */ `
  varying vec2 silkUv;
  uniform float time;
  uniform float phase;
  uniform float halo;
  void main() {
    float across = abs(silkUv.x * 2. - 1.);
    float seams = pow(.5 + .5 * sin(64. * silkUv.x + sin(silkUv.y * 18.) * 1.8), 7.);
    float drift = pow(.5 + .5 * cos(silkUv.y * 31. - time * 1.9 + phase), 7.);
    float ends = smoothstep(0., .10, silkUv.y) * (1. - smoothstep(.91, 1., silkUv.y));
    float edges = exp(-abs(across - .83) * 39.);
    float core = exp(-across * across * 22.);
    float fabric = (1. - smoothstep(.78, 1., across)) * (.13 + .17 * seams);
    float opacity = mix(fabric + .42 * core + .36 * edges, .13 * exp(-across * across * 7.), halo);
    vec3 gold = mix(vec3(.86, .49, .19), vec3(1., .86, .53), core + edges * .35);
    gl_FragColor = vec4(gold, opacity * (.54 + drift * .46) * ends);
  }
`;
