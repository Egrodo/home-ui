import { HALO_WAVES } from './config';

export const VERTEX_SHADER = `#version 300 es
layout(location=0) in vec2 a;
void main(){gl_Position=vec4(a,0.,1.);}`;

export const COLOR_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uInterior, uFrame;
uniform vec2 uRes, uDitherSeed;
uniform float uVisible, uCurve, uPhase, uDither;
uniform float uCornerSharpness, uCornerSize, uMaxDistance, uReach, uDensity;
uniform float uUnevenness, uColorWander;
uniform vec3 uWave[${HALO_WAVES.length}]; // x and y frequency, then phase
out vec4 outColor;

const float FRAME_ROWS=5.;

vec3 oklabToLinear(vec3 c){
  float l=c.x+.3963377774*c.y+.2158037573*c.z;
  float m=c.x-.1055613458*c.y-.0638541728*c.z;
  float s=c.x-.0894841775*c.y-1.291485548*c.z;
  l=l*l*l; m=m*m*m; s=s*s*s;
  return vec3(4.0767416621*l-3.3077115913*m+.2309699292*s,
              -1.2684380046*l+2.6097574011*m-.3413193965*s,
              -.0041960863*l-.7034186147*m+1.707614701*s);
}

vec3 linearToSrgb(vec3 c){
  c=clamp(c,0.,1.);
  return mix(12.92*c,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));
}

// Sine-free, so it stays uniform on GPUs with weak precision in sin().
vec3 hash(vec2 p){
  vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));
  q+=dot(q,q.yxz+33.33);
  return fract((q.xxy+q.yzz)*q.zyx);
}

// A p-norm of the distances to the nearest edges. Unlike a rounded box's distance field,
// it has no crease running in from the corners, which would show in a soft gradient.
float edgeDistance(vec2 edge){
  return pow(pow(edge.x,-uCornerSharpness)+pow(edge.y,-uCornerSharpness),-1./uCornerSharpness);
}

// Picks between the top, side and bottom ramps. Eased, so the blend has no kink at the side row.
float frameRow(float down){
  float s=down*2.;
  float row=min(floor(s),1.);
  float f=s-row;
  return (row+f*f*(3.-2.*f)+.5)/FRAME_ROWS;
}

// Picks between the top and bottom corner ramps, the last two rows.
float cornerRow(float down){
  return (3.+smoothstep(.3,.7,down)+.5)/FRAME_ROWS;
}

// Two versions of the same broad waves, offset so width and color don't move in lockstep.
vec2 waves(vec2 p){
  vec2 sum=vec2(0.);
  for(int i=0;i<${HALO_WAVES.length};i++){
    float angle=dot(uWave[i].xy,p)+uWave[i].z;
    sum+=vec2(sin(angle),cos(angle));
  }
  return sum/${HALO_WAVES.length}.;
}

void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  float down=1.-uv.y;
  float across=uv.x*2.-1.;
  float position=(down+uCurve*across*across)*uVisible+uPhase;
  vec3 interior=texture(uInterior,vec2(position,.5)).xyz;

  float shortEdge=min(uRes.x,uRes.y);
  vec2 edge=min(gl_FragCoord.xy,uRes-gl_FragCoord.xy)/shortEdge;
  vec2 wave=waves(gl_FragCoord.xy/shortEdge);
  float reach=edgeDistance(edge)/(uReach*(1.+uUnevenness*wave.x))/uMaxDistance;
  float rowDown=clamp(down+uColorWander*wave.y,0.,1.);
  vec4 frame=texture(uFrame,vec2(reach,frameRow(rowDown)));

  // A soft patch around each corner. Weighting by angle instead shows as a diagonal wedge.
  vec2 nearCorner=1.-smoothstep(0.,uCornerSize,edge);
  float corner=nearCorner.x*nearCorner.y;
  frame=mix(frame,texture(uFrame,vec2(reach,cornerRow(rowDown))),corner);

  // A power, so the rim and the far edge of the halo stay put while the middle thickens.
  float opacity=pow(max(frame.a,0.),uDensity);
  vec3 color=linearToSrgb(oklabToLinear(mix(interior,frame.xyz,opacity)));

  // Two uniform noises subtract to a triangular one, whose grain doesn't vary with brightness.
  vec2 p=gl_FragCoord.xy+uDitherSeed;
  vec3 noise=hash(p)-hash(p+vec2(47.,113.));
  outColor=vec4(color+noise*uDither/255.,1.);
}`;
