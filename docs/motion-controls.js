export const motions=[
 {id:'warp',world:'space',name:'Hyperspace warp',ko:'하이퍼스페이스 워프',key:'01',copy:'카메라 시야가 넓어지며 별빛 터널을 통과합니다.'},
 {id:'meteor',world:'space',name:'Meteor shower',ko:'유성우',key:'02',copy:'여러 개의 유성이 밤하늘을 가로지릅니다.'},
 {id:'orbit',world:'space',name:'Orbital focus',ko:'행성 궤도 보기',key:'03',copy:'현재 정거장의 행성 주위를 카메라가 탐색합니다.'},
 {id:'pulse',world:'space',name:'Cosmic ripple',ko:'우주 파동',key:'04',copy:'빛의 고리가 공간을 따라 퍼져나갑니다.'},
 {id:'dash',world:'journey',name:'Character dash',ko:'캐릭터 대시',key:'05',copy:'탐험가가 다음 길을 향해 빠르게 달려갑니다.'},
 {id:'flip',world:'journey',name:'Flip jump',ko:'공중 회전 점프',key:'06',copy:'캐릭터가 점프하며 한 바퀴 회전합니다.'},
 {id:'landing',world:'journey',name:'Landing particles',ko:'착지 파티클',key:'07',copy:'점프 후 착지할 때 먼지와 파동이 퍼집니다.'},
 {id:'portal',world:'all',name:'World portal',ko:'세계 포털 전환',key:'08',copy:'다음 세계로 전환할 때 포털이 화면을 연결합니다.'},
 {id:'dock',world:'workspace',name:'Magnetic dock',ko:'반응형 앱 독',key:'09',copy:'마우스가 가까워지면 앱 아이콘이 커지고 반응합니다.'},
 {id:'spring',world:'workspace',name:'Spring windows',ko:'스프링 창 모션',key:'10',copy:'창이 부드럽게 나타나고 독으로 접히듯 최소화됩니다.'}
];

export function mountMotionControls(root,world,{trigger,navigate,openMenu}){
 const controller=new AbortController(),signal=controller.signal;const launcher=document.createElement('button');launcher.className='motion-launcher';launcher.innerHTML='<span>✦</span> MOTION LAB <b>10</b>';launcher.setAttribute('aria-label','10가지 모션 효과 보기');document.body.append(launcher);
 const dialog=document.createElement('dialog');dialog.className='motion-dialog';dialog.setAttribute('aria-label','모션 실험실');dialog.innerHTML=`<div class="motion-heading"><div><span>INTERACTION COLLECTION / 10</span><h2>움직임을 눌러보세요.</h2></div><button class="close-motion" aria-label="모션 실험실 닫기">×</button></div><p class="motion-description">세 세계에서 만나는 열 가지 모션. 다른 세계의 효과는 해당 화면으로 이동합니다.</p><div class="motion-grid">${motions.map(m=>`<button data-motion="${m.id}" class="motion-item ${m.world===world?'in-this-world':''}"><span>${m.key} / ${m.world==='all'?'ALL WORLDS':m.world.toUpperCase()}</span><h3>${m.name} ↗</h3><strong>${m.ko}</strong><p>${m.copy}</p></button>`).join('')}</div><p class="motion-reduced-note">모션 감소 설정이나 일시정지가 켜져 있으면 큰 움직임을 줄입니다. 본문 탐색은 그대로 사용할 수 있습니다.</p>`;document.body.append(dialog);let origin;
 function close(){dialog.close()}launcher.onclick=()=>{origin=document.activeElement;dialog.showModal();document.body.style.overflow='hidden'};dialog.querySelector('.close-motion').onclick=close;dialog.addEventListener('close',()=>{document.body.style.overflow=document.querySelector('#world-menu')?.open?'hidden':'';if(origin?.isConnected)origin.focus()},{signal});dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()},{signal});
 dialog.querySelectorAll('[data-motion]').forEach(button=>button.onclick=()=>{const effect=motions.find(m=>m.id===button.dataset.motion);dialog.close();if(effect.id==='portal'){openMenu();return}if(effect.world!==world){navigate(effect.world,true,effect.id);return}trigger(effect.id)});
 return ()=>{controller.abort();dialog.close();dialog.remove();launcher.remove()};
}
