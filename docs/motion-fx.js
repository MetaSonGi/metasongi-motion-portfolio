import * as THREE from 'three';

export function createSpaceFX(scene,camera,texture,planets){
 const group=new THREE.Group();scene.add(group);let elapsed=0,warpAge=99,meteorAge=99,orbitAge=99,pulseAge=99,orbitIndex=0;
 const streaks=[];const streakMaterial=new THREE.MeshBasicMaterial({color:0xc1d8ff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
 for(let i=0;i<100;i++){const streak=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,1,3),streakMaterial);const angle=i*2.39996,radius=1.5+(i%13)*.45;streak.userData.origin=new THREE.Vector3(Math.cos(angle)*radius,Math.sin(angle)*radius,-3-(i%17)*1.1);streak.rotation.x=Math.PI/2;group.add(streak);streaks.push(streak)}
 const meteors=[];for(let i=0;i<15;i++){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-1.2,.6,.3],3));const material=new THREE.LineBasicMaterial({color:i%3?0xc1ceff:0x99e2dd,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});const line=new THREE.Line(geometry,material);group.add(line);meteors.push(line)}
 const ringMaterial=new THREE.MeshBasicMaterial({color:0xafc7ff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});const pulse=new THREE.Mesh(new THREE.RingGeometry(.93,1,120),ringMaterial);group.add(pulse);
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0xa7b7ff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));glow.scale.set(6,6,1);group.add(glow);
 function trigger(name,progress=0){if(name==='warp')warpAge=0;if(name==='meteor')meteorAge=0;if(name==='orbit'){orbitAge=0;orbitIndex=Math.min(3,Math.round(progress*3))}if(name==='pulse')pulseAge=0}
 function update(dt,progress,paused){if(paused){group.visible=false;camera.fov=innerWidth<700?58:47;camera.updateProjectionMatrix();return}group.visible=true;if(dt<=0)return;elapsed+=dt;warpAge+=dt;meteorAge+=dt;orbitAge+=dt;pulseAge+=dt;
  const strength=Math.sin(Math.min(1,warpAge/2.1)*Math.PI);const warp=warpAge<2.1?strength:0;const baseFov=innerWidth<700?58:47;camera.fov=baseFov+warp*22;camera.updateProjectionMatrix();group.position.copy(camera.position);group.quaternion.copy(camera.quaternion);streakMaterial.opacity=warp*.7;streaks.forEach((streak,i)=>{streak.position.copy(streak.userData.origin);streak.position.z+=((elapsed*22+i*.17)%17);streak.scale.y=.5+warp*9});
  for(let i=0;i<meteors.length;i++){const age=meteorAge-i*.11,line=meteors[i];line.material.opacity=age>=0&&age<1.4?Math.sin(age/1.4*Math.PI)*.9:0;line.position.set(-6+(i%5)*2.5+age*4,4+(i%3)*1.3-age*3.2,-8-(i%4)*2);line.scale.setScalar(1+(i%3)*.5)}
  if(orbitAge<5.8){const p=planets[orbitIndex].group.position;const radius=innerWidth<700?13:11;const angle=Math.sin(Math.min(1,orbitAge/5.8)*Math.PI)*.65;const target=new THREE.Vector3(p.x+Math.sin(angle)*radius,p.y+1.3,p.z+Math.cos(angle)*radius);const enter=Math.min(1,orbitAge/.7,(5.8-orbitAge)/.8);camera.position.lerp(target,Math.max(0,enter));camera.lookAt(p.x,p.y,p.z);group.position.copy(camera.position);group.quaternion.copy(camera.quaternion)}
  const life=pulseAge/1.5;pulse.visible=life<1;pulse.position.set(0,0,-5);pulse.scale.setScalar(.1+life*7);ringMaterial.opacity=Math.max(0,1-life)*.65;glow.position.set(0,0,-5);glow.material.opacity=Math.max(0,1-pulseAge/.7)*.23;
 }
 return {trigger,update,reset(){warpAge=meteorAge=orbitAge=pulseAge=99;camera.fov=innerWidth<700?58:47;camera.updateProjectionMatrix()}};
}

export function createLandingFX(scene){
 const material=new THREE.MeshBasicMaterial({color:0xb7a483,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});const ring=new THREE.Mesh(new THREE.RingGeometry(.85,1,48),material);ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);
 const dust=[];const dustMaterial=new THREE.MeshBasicMaterial({color:0xd7c9a9,transparent:true,opacity:0,depthWrite:false});const geometry=new THREE.SphereGeometry(.06,6,4);for(let i=0;i<18;i++){const particle=new THREE.Mesh(geometry,dustMaterial);particle.visible=false;scene.add(particle);dust.push(particle)}
 let age=99,origin=new THREE.Vector3();return {land(position){origin.copy(position);age=0},update(dt,paused){if(paused)return;age+=dt;const life=age/.7;ring.visible=life<1;ring.position.set(origin.x,.02,origin.z);ring.scale.setScalar(.4+life*1.9);material.opacity=Math.max(0,1-life)*.5;dustMaterial.opacity=Math.max(0,1-life)*.6;dust.forEach((particle,i)=>{const angle=i*2.39996,r=.15+life*(.7+i%4*.18);particle.visible=life<1;particle.position.set(origin.x+Math.cos(angle)*r,origin.y+.06+Math.sin(life*Math.PI)*(.12+i%3*.08),origin.z+Math.sin(angle)*r)})}};
}
