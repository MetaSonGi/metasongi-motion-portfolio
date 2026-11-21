
export const worldCatalog=[
 {id:'space',name:'Beyond Gravity',kind:'EXPLORE',label:'우주선을 조종하는 시네마틱 비행',icon:'◌',description:'우주선을 몰고 소행성 사이를 지나 프로젝트 행성으로.',interaction:'FLY · STEER · WARP',number:'01'},
 {id:'journey',name:'A Little Journey',kind:'PLAY',label:'캐릭터와 함께 걷는 3D 섬 월드',icon:'♧',description:'캐릭터를 직접 움직여 섬을 돌며 프로젝트를 만납니다.',interaction:'WALK · JUMP · EXPLORE',number:'02'},
 {id:'workspace',name:'Developer OS',kind:'BUILD',label:'코드를 치는 개발자의 라이브 코딩',icon:'⌘',description:'스크롤하면 코드가 타이핑되고, 빌드되고, 실행됩니다.',interaction:'TYPE · BUILD · RUN',number:'03'},
 {id:'gallery',name:'Object Room',kind:'CURATE',label:'그리스·로마 액자 속으로 들어가는 갤러리',icon:'◎',description:'금빛 액자 안으로 들어가 그 시대를 지나 다음 액자로.',interaction:'SCROLL · ENTER · PASS THROUGH',number:'04'},
 {id:'editorial',name:'The Build Journal',kind:'READ',label:'페이지를 넘기는 살아있는 매거진',icon:'▤',description:'표지를 열고 페이지를 넘기며 읽는 개발 매거진.',interaction:'OPEN · FLIP · READ',number:'05'},
 {id:'atlas',name:'Idea Atlas',kind:'CONNECT',label:'움직이는 기술 지도',icon:'⌖',description:'기술과 프로젝트의 관계를 연결한 노드 지도.',interaction:'PAN · ZOOM · CONNECT',number:'06'},
 {id:'assembly',name:'Assembly Study',kind:'ASSEMBLE',label:'카메라가 따라가는 3D 제품 쇼케이스',icon:'⬡',description:'하나의 제품을 따라가며 회전·분해·조립되는 스크롤 영상.',interaction:'FOLLOW · EXPLODE · ROTATE',number:'07'},
 {id:'bento',name:'Play / Build',kind:'EXPERIMENT',label:'던지고 쌓는 3D 장난감 상자',icon:'▦',description:'글자와 블록을 잡아 던지고, 캡슐 토이로 작업을 뽑습니다.',interaction:'GRAB · THROW · BUILD',number:'08'},
 {id:'noir',name:'The Developer Cut',kind:'WATCH',label:'자료를 모아 편집하는 영상 편집실',icon:'▶',description:'흩어진 클립을 모아 타임라인에서 자르고 렌더링합니다.',interaction:'IMPORT · CUT · RENDER',number:'09'},
 {id:'garden',name:'Digital Garden',kind:'GROW',label:'스크롤하면 자라는 3D 정원',icon:'❋',description:'씨앗이 자라 꽃이 피고, 계절이 바뀌는 정원.',interaction:'GROW · BLOOM · PLANT',number:'10'},
];
// Worlds folded into a similar survivor when the collection went from 20 to 10.
export const mergedWorlds={transit:'space',terminal:'workspace',cutroom:'gallery',splitlight:'gallery',typepress:'editorial',signal:'atlas',prism:'assembly',frequency:'assembly',chromagrid:'bento',afterimage:'noir'};
export const worldIds=worldCatalog.map(world=>world.id);
export function buildWorldMenu(){
 const host=document.querySelector('.world-options');host.innerHTML=worldCatalog.map(w=>`<button data-world-choice="${w.id}" class="world-choice"><div class="world-thumbnail ${w.id}-thumbnail"><div class="catalog-art" aria-hidden="true"><span>${w.icon}</span><i></i><i></i><i></i></div><span>${w.number} / ${w.kind}</span></div><div class="choice-copy"><h3>${w.name} <span>↗</span></h3><p>${w.description}</p><small>${w.interaction}</small></div></button>`).join('');
 const heading=document.querySelector('#world-menu-title');heading.textContent='한 명의 개발자, 열 개의 세계.';
 document.querySelector('.menu-footnote').innerHTML='<kbd>Alt</kbd> + <kbd>1</kbd>–<kbd>0</kbd> 으로 바로 열 수 있습니다.';
}
