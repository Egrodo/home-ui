import { NOISE_OCTAVES, PALETTE, SEED_SLOTS } from './config';

export const VERTEX_SHADER = `#version 300 es
layout(location=0) in vec2 a;
void main(){gl_Position=vec4(a,0.,1.);}`;

const HASH = 'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }';

/** The expensive pass: writes each pixel's distance to the nearest shape, at reduced resolution. */
export const FIELD_SHADER = `#version 300 es
precision highp float;
uniform vec2 uRes, uNoiseOff;
uniform float uWarp, uWScale, uSmooth;
uniform vec4 uSeed[${SEED_SLOTS}];   // xy pos, radius, n (points/sides)
uniform vec4 uSeedP[${SEED_SLOTS}];  // m (star sharpness) or flower amp, rotation, type, sink offset
out vec4 outDistance;

${HASH}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y);
}
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<${NOISE_OCTAVES};i++){ v+=a*noise(p); p=p*2.03+17.1; a*=.5; } return v; }

float smin(float a, float b, float k){
  if(k<=0.001) return min(a,b);
  float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h);
}

// exact SDFs (after Inigo Quilez). Star with m==n is a regular n-gon; m->2 is sharpest.
float sdStar(vec2 p, float r, float n, float m){
  float an=3.141593/n, en=3.141593/m;
  vec2 acs=vec2(cos(an),sin(an)), ecs=vec2(cos(en),sin(en));
  float bn=mod(atan(p.x,p.y),2.*an)-an;
  p=length(p)*vec2(cos(bn),abs(sin(bn)));
  p-=r*acs;
  p+=ecs*clamp(-dot(p,ecs),0.,r*acs.y/ecs.y);
  return length(p)*sign(p.x);
}
float sdSeed(vec2 p, vec4 a, vec4 b){
  float c=cos(b.y), s=sin(b.y);
  p=mat2(c,-s,s,c)*p;
  float d;
  if(b.z<.5) d=length(p)-a.z;                                   // circle
  else if(b.z<1.5) d=sdStar(p,a.z,a.w,b.x);                      // polygon / star
  else { float an=atan(p.y,p.x); d=length(p)-a.z*(1.+b.x*sin(an*a.w)); d*=.8; } // soft flower
  return d+b.w;
}

void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);
  vec2 q=uv*uWScale;
  vec2 w=vec2(fbm(q+uNoiseOff), fbm(q+vec2(5.2,1.3)+uNoiseOff.yx*vec2(-1.,1.)))-.5;
  vec2 p=uv+w*uWarp*2.;

  float d=1e3;
  for(int i=0;i<${SEED_SLOTS};i++){
    d=smin(d,sdSeed(p-uSeed[i].xy,uSeed[i],uSeedP[i]),uSmooth);
  }
  outDistance=vec4(d,0.,0.,1.);
}
`;

/** The cheap pass: turns the distances into bands, outlines and grain at full resolution. */
export const COLOR_SHADER = `#version 300 es
precision highp float;
uniform highp sampler2D uField;
uniform vec2 uRes;
uniform float uPhase, uBand, uLine, uGrain, uVignette;
uniform vec3 uLineColor;
uniform vec3 uPal[${PALETTE.length}];
out vec4 outColor;

${HASH}

void main(){
  float d=texture(uField,gl_FragCoord.xy/uRes).r;
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);

  float x=d/uBand - uPhase;
  vec3 col=uPal[int(mod(floor(x),${PALETTE.length}.)+.5)];

  float f=fract(x); float edge=min(f,1.-f);
  float fw=fwidth(x);
  float line=1.-smoothstep(uLine*.5*fw, uLine*.5*fw+fw, edge);
  col=mix(col, uLineColor, line*step(.01,uLine));

  col+=(hash(gl_FragCoord.xy)-.5)*uGrain;
  col*=1.-uVignette*dot(uv,uv);
  outColor=vec4(col,1.);
}
`;
