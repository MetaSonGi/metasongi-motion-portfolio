import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

export function createWorld(canvas, surface) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.35;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,100);
  camera.position.z=8.5;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.04); scene.environment=environment.texture; room.dispose(); pmrem.dispose();
  const group=new THREE.Group();scene.add(group);
  const material=new THREE.MeshPhysicalMaterial({color:0xcbd5fa,metalness:.94,roughness:.16,clearcoat:1,clearcoatRoughness:.12,iridescence:1,iridescenceIOR:1.45,envMapIntensity:1.8});
  const sculpture=new THREE.Mesh(new THREE.TorusKnotGeometry(1,.29,180,28,2,3),material); group.add(sculpture);
  const shellMaterial=new THREE.MeshPhysicalMaterial({color:0xc4c8ff,metalness:.6,roughness:.19,wireframe:true,transparent:true,opacity:0});
  const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(1.75,2),shellMaterial);group.add(shell);
  const ringMaterial=new THREE.MeshBasicMaterial({color:0xa9b7ff,transparent:true,opacity:.18});
  const rings=[];for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(2+i*.15,.006,4,180),ringMaterial);ring.rotation.set(.6+i*.8,.3+i*.55,i*.7);group.add(ring);rings.push(ring)}
  const count=1600,positions=new Float32Array(count*3),seeds=new Float32Array(count),targets=new Float32Array(count*3);
  for(let i=0;i<count;i++){const a=i*2.399963,b=Math.acos(1-2*(i+.5)/count),r=2.1;positions.set([Math.sin(b)*Math.cos(a)*r,Math.cos(b)*r,Math.sin(b)*Math.sin(a)*r],i*3);seeds[i]=Math.random();const row=i%80,col=Math.floor(i/80);targets.set([(row/79-.5)*5,(col/19-.5)*3,Math.sin(row*.2)*.4],i*3)}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('destination',new THREE.BufferAttribute(targets,3));geometry.setAttribute('seed',new THREE.BufferAttribute(seeds,1));
  const uniforms={time:{value:0},morph:{value:0},burst:{value:0},color:{value:new THREE.Color(0xb5c9ff)},opacity:{value:.8},pixelRatio:{value:Math.min(devicePixelRatio,1.7)}};
  const particles=new THREE.Points(geometry,new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`attribute vec3 destination;attribute float seed;uniform float time,morph,burst,pixelRatio;varying float vAlpha;void main(){vec3 p=mix(position,destination,morph);p+=normalize(position)*sin(seed*60.+time*.8)*.06;p*=1.+burst*(.5+seed);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(1.5+seed*2.)*pixelRatio*5./-mv.z;vAlpha=.3+seed*.7;}`,fragmentShader:`uniform vec3 color;uniform float opacity;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.03,d);gl_FragColor=vec4(color,a*vAlpha*opacity);}`}));group.add(particles);
  const starPositions=new Float32Array(360*3);for(let i=0;i<360;i++){starPositions[i*3]=(Math.random()-.5)*28;starPositions[i*3+1]=(Math.random()-.5)*18;starPositions[i*3+2]=-Math.random()*15-4}
  const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));const stars=new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0xb9f965,size:.018,transparent:true,opacity:.45}));scene.add(stars);
  const light=new THREE.PointLight(0xb9f965,35,30);light.position.set(3,4,4);scene.add(light);const fill=new THREE.PointLight(0x686cff,30,25);fill.position.set(-3,-2,3);scene.add(fill);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,255,255,.24)');gradient.addColorStop(.3,'rgba(255,255,255,.09)');gradient.addColorStop(1,'rgba(255,255,255,0)');gc.fillStyle=gradient;gc.fillRect(0,0,128,128);const glowTexture=new THREE.CanvasTexture(glowCanvas),glowMaterial=new THREE.SpriteMaterial({map:glowTexture,color:0xb9f965,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});const glow=new THREE.Sprite(glowMaterial);glow.scale.set(10,10,1);group.add(glow);
  let theme=0,blend=0,paused=false,rotation=.1,pitch=.25,targetRotation=.1,targetPitch=.25,burst=0,hold=false,down=false,px=0,py=0,swipeX=0,swipeY=0,moved=false,energy=0;
  let active=true,disposed=false,raf=0,scroll=0,scrollTarget=0,pointer=new THREE.Vector2(),last=performance.now(),time=0;
  const scheme=[{base:0xcbd5fa,accent:0xa9b7ff,fill:0x8a65dd},{base:0xadd5e6,accent:0x72dfe7,fill:0x5e79e3},{base:0xd6c8e9,accent:0xa99ad6,fill:0xb48dc1}];
  function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}resize();window.addEventListener('resize',resize);
  const onScroll=()=>{scrollTarget=scrollY/Math.max(1,innerHeight)};window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  const onPointer=e=>{pointer.set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5)};window.addEventListener('pointermove',onPointer,{passive:true});
  surface.addEventListener('pointerdown',e=>{if(e.target.closest('button,a,input'))return;down=true;moved=false;px=swipeX=e.clientX;py=swipeY=e.clientY;surface.setPointerCapture(e.pointerId);hold=true;document.body.classList.add('grabbing')});
  surface.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-px,dy=e.clientY-py;targetRotation+=dx*.013;targetPitch+=dy*.009;energy=Math.min(1,energy+Math.abs(dx)*.004);if(Math.abs(e.clientX-swipeX)>8)moved=true;px=e.clientX;py=e.clientY});
  surface.addEventListener('pointerup',e=>{if(!down)return;down=false;hold=false;document.body.classList.remove('grabbing');const dx=e.clientX-swipeX,dy=e.clientY-swipeY;if(Math.abs(dx)>110&&Math.abs(dx)>Math.abs(dy)*1.3)window.dispatchEvent(new CustomEvent('universe-swipe',{detail:dx<0?1:-1}));else if(!moved)burst=1});
  surface.addEventListener('pointercancel',()=>{down=false;hold=false;document.body.classList.remove('grabbing')});
  canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')targetRotation-=.35;if(e.key==='ArrowRight')targetRotation+=.35;if(e.key==='ArrowUp')targetPitch-=.2;if(e.key==='ArrowDown')targetPitch+=.2;if(e.key===' ')burst=1};
  document.addEventListener('visibilitychange',()=>{active=!document.hidden;last=performance.now()});
  function frame(now){if(disposed)return;raf=requestAnimationFrame(frame);const dt=Math.max(0,Math.min((now-last)/1000,.05));last=now;if(!active)return;if(!paused){time+=dt;if(!down)targetRotation+=dt*.18;burst=THREE.MathUtils.damp(burst,hold?.35:0,3,dt);energy=THREE.MathUtils.damp(energy,0,3,dt)}
    scroll=THREE.MathUtils.damp(scroll,scrollTarget,7,dt);rotation=THREE.MathUtils.damp(rotation,targetRotation,9,dt);pitch=THREE.MathUtils.damp(pitch,targetPitch,9,dt);blend=THREE.MathUtils.clamp(THREE.MathUtils.damp(blend,theme,4,dt),0,2);if(Math.abs(theme-blend)<.00001)blend=theme;
    const journey=document.querySelector('.journey'),r=journey.getBoundingClientRect(),journeyProgress=THREE.MathUtils.clamp(-r.top/(r.height-innerHeight),0,1);document.documentElement.style.setProperty('--journey',journeyProgress);document.documentElement.style.setProperty('--energy',energy);
    const inJourney=r.top<innerHeight*.5&&r.bottom>innerHeight*.5;const about=document.querySelector('#about').getBoundingClientRect();const end=document.querySelector('.contact').getBoundingClientRect();
    let targetX=innerWidth<700?0:1.5,targetY=innerWidth<700?-1.85:0,targetScale=1;
    if(scroll>.5){targetX=THREE.MathUtils.lerp(targetX,-1.9,Math.min(1,(scroll-.5)*1.8));targetScale=.8}
    if(inJourney){targetX=Math.sin(journeyProgress*Math.PI*2)*1.3;targetY=0;targetScale=1.05+Math.sin(journeyProgress*Math.PI)*.3}
    else if(about.top<innerHeight*.7&&about.bottom>0){targetX=innerWidth<700?.9:2.5;targetY=.1;targetScale=.8}
    else if(end.top<innerHeight){targetX=0;targetY=-.3;targetScale=1.4}
    if(innerWidth<700){targetScale*=.34;targetX*=.35;}
    group.position.x=THREE.MathUtils.damp(group.position.x,targetX,4,dt);group.position.y=THREE.MathUtils.damp(group.position.y,targetY,4,dt);group.scale.lerp(new THREE.Vector3(targetScale,targetScale,targetScale),1-Math.exp(-dt*4));
    group.rotation.set(pitch*.5+pointer.y*.1,rotation+scroll*.22,pointer.x*.09);sculpture.rotation.set(time*.09,time*.07,Math.sin(time*.1)*.3);sculpture.scale.setScalar(1+Math.sin(time*.7)*.025+burst*.13);shell.rotation.set(-time*.05,time*.1,scroll*.25);shell.scale.setScalar(1+burst*.5);
    const morph=THREE.MathUtils.clamp((blend<1?blend:2-blend)*.9+(inJourney?Math.sin(journeyProgress*Math.PI)*.6:0),0,1);uniforms.morph.value=morph;uniforms.time.value=time;uniforms.burst.value=burst;uniforms.opacity.value=theme===2?.55:.85;
    const a=scheme[Math.floor(blend)],b=scheme[Math.ceil(blend)],fraction=blend%1;const accent=new THREE.Color(a.accent).lerp(new THREE.Color(b.accent),fraction);material.color.set(a.base).lerp(new THREE.Color(b.base),fraction);material.roughness=THREE.MathUtils.lerp(.15,.4,Math.max(0,blend-1));uniforms.color.value.copy(accent);ringMaterial.color.copy(accent);shellMaterial.color.copy(accent);light.color.copy(accent);glowMaterial.color.copy(accent);fill.color.set(a.fill).lerp(new THREE.Color(b.fill),fraction);
    shellMaterial.opacity=(.025+.15*Math.max(0,1-Math.abs(blend-1)))*(1+burst);sculpture.material.transparent=true;sculpture.material.opacity=1-.7*Math.max(0,1-Math.abs(blend-1));glowMaterial.opacity=theme===2?.3:.75;stars.material.opacity=theme===2?.1:.4;for(let i=0;i<rings.length;i++)rings[i].rotation.z+=paused?0:dt*.04*(i+1);
    camera.position.x=THREE.MathUtils.damp(camera.position.x,pointer.x*.15,3,dt);camera.lookAt(0,0,0);renderer.render(scene,camera);
  }raf=requestAnimationFrame(frame);
  return {setMode(value){theme=value;burst=.55},setPaused(value){paused=value},burst(){burst=1.2},dispose(){disposed=true;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('scroll',onScroll);window.removeEventListener('pointermove',onPointer);scene.traverse(object=>{object.geometry?.dispose();if(object.material){for(const m of [].concat(object.material))m.dispose()}});glowTexture.dispose();environment.dispose();renderer.dispose()}};
}
