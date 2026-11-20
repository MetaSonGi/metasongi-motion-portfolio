
export const worldCatalog=[
 {id:'space',name:'Beyond Gravity',kind:'EXPLORE',label:'시네마틱 우주 탐사',icon:'◌',description:'별과 행성 사이를 이동하는 3D 스크롤 여행.',interaction:'3D FLIGHT · SCROLL',number:'01'},
 {id:'journey',name:'A Little Journey',kind:'PLAY',label:'캐릭터와 걷는 세계',icon:'♧',description:'작은 탐험가와 걷고, 점프하며 만나는 프로젝트.',interaction:'WALK · JUMP · DISCOVER',number:'02'},
 {id:'workspace',name:'Developer OS',kind:'BUILD',label:'개발자의 데스크톱',icon:'⌘',description:'창을 열고 드래그하며 작업을 탐색하는 OS.',interaction:'WINDOWS · COMMANDS',number:'03'},
 {id:'gallery',name:'Object Room',kind:'CURATE',label:'그리스·로마 액자 속으로 들어가는 갤러리',icon:'◎',description:'금빛 액자 안으로 들어가 그 시대를 지나 다음 액자로.',interaction:'SCROLL · ENTER · PASS THROUGH',number:'04'},
 {id:'editorial',name:'The Build Journal',kind:'READ',label:'에디토리얼 개발 매거진',icon:'▤',description:'타이포그래피와 긴 글로 풀어내는 개발 노트.',interaction:'READ · RESIZE · EXPAND',number:'05'},
 {id:'atlas',name:'Idea Atlas',kind:'CONNECT',label:'움직이는 기술 지도',icon:'⌖',description:'기술과 프로젝트의 관계를 연결한 노드 지도.',interaction:'PAN · ZOOM · CONNECT',number:'06'},
 {id:'assembly',name:'Assembly Study',kind:'ASSEMBLE',label:'카메라가 따라가는 3D 제품 쇼케이스',icon:'⬡',description:'하나의 제품을 따라가며 회전·분해·조립되는 스크롤 영상.',interaction:'FOLLOW · EXPLODE · ROTATE',number:'07'},
 {id:'bento',name:'Play / Build',kind:'EXPERIMENT',label:'만지고 노는 벤토 실험실',icon:'▦',description:'코드, 입자와 기술 블록을 직접 만지는 놀이터.',interaction:'DRAW · SHUFFLE · SWITCH',number:'08'},
 {id:'noir',name:'The Developer Cut',kind:'WATCH',label:'자료를 모아 편집하는 영상 편집실',icon:'▶',description:'흩어진 클립을 모아 타임라인에서 자르고 렌더링합니다.',interaction:'IMPORT · CUT · RENDER',number:'09'},
 {id:'garden',name:'Digital Garden',kind:'GROW',label:'아이디어가 자라는 정원',icon:'❋',description:'스크롤을 따라 자라는 줄기와 개발 이야기.',interaction:'SCROLL · PLANT · BLOOM',number:'10'},
];
// Worlds folded into a similar survivor when the collection went from 20 to 10.
export const mergedWorlds={transit:'space',terminal:'workspace',cutroom:'gallery',splitlight:'gallery',typepress:'editorial',signal:'atlas',prism:'assembly',frequency:'assembly',chromagrid:'bento',afterimage:'noir'};
export const worldIds=worldCatalog.map(world=>world.id);
export function buildWorldMenu(){
 const host=document.querySelector('.world-options');host.innerHTML=worldCatalog.map(w=>`<button data-world-choice="${w.id}" class="world-choice"><div class="world-thumbnail ${w.id}-thumbnail"><div class="catalog-art" aria-hidden="true"><span>${w.icon}</span><i></i><i></i><i></i></div><span>${w.number} / ${w.kind}</span></div><div class="choice-copy"><h3>${w.name} <span>↗</span></h3><p>${w.description}</p><small>${w.interaction}</small></div></button>`).join('');
 const heading=document.querySelector('#world-menu-title');heading.textContent='한 명의 개발자, 열 개의 세계.';
 document.querySelector('.menu-footnote').innerHTML='<kbd>Alt</kbd> + <kbd>1</kbd>–<kbd>0</kbd> 으로 바로 열 수 있습니다.';
}
