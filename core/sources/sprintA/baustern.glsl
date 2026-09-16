// WebGL Color-Grade-Pass (Fragment): 3D-LUT als 2D-Textur (33×33 Kacheln, 1089×33) — tetra-freie trilineare Näherung
precision mediump float; uniform sampler2D uTex, uLut; uniform float uStrength; varying vec2 vUv;
vec3 lut(vec3 c){ float n=33.0; vec3 s=c*(n-1.0); float b0=floor(s.b), b1=min(b0+1.0,n-1.0), f=s.b-b0;
  vec2 uv0=vec2((b0*n+s.r+0.5)/(n*n),(s.g+0.5)/n), uv1=vec2((b1*n+s.r+0.5)/(n*n),(s.g+0.5)/n);
  return mix(texture2D(uLut,uv0).rgb, texture2D(uLut,uv1).rgb, f); }
void main(){ vec4 c=texture2D(uTex,vUv); gl_FragColor=vec4(mix(c.rgb,lut(clamp(c.rgb,0.0,1.0)),uStrength),c.a); }