export const profileURL='https://github.com/MetaSonGi';
export const projects=[
 {id:'vrm',name:'Virtual Human Studio',category:'REALTIME WEB',icon:'◉',description:'목소리에 반응하는 브라우저 속 가상 인물.',stack:['TypeScript','Three.js','VRM','Web Audio'],body:'VRM 0.x/1.0 모델 로딩, 음량 기반 립싱크, 표정과 카메라 제어, 영상·마이크 음성 WebM 녹화를 지원합니다. 마이크와 모델 리소스 정리까지 다루었습니다.',note:'입 모양은 음소 인식이 아닌 음량 기반입니다.',url:'https://github.com/MetaSonGi/web-virtual-human-studio'},
 {id:'pixelle',name:'AI Character Pipeline',category:'AI VIDEO INTEGRATION',icon:'✧',description:'가상 캐릭터를 AI 영상 파이프라인으로.',stack:['Python','FastAPI','Pixelle-Video'],body:'VRM 캔버스를 PNG로 캡처하고 대본과 한국어 음성을 선택해 Pixelle-Video 디지털 휴먼 서버에 요청합니다. 작업 상태, 취소, 생성 MP4 표시와 다운로드 흐름을 연결했습니다.',note:'연결 코드가 구현되어 있으며 실제 영상 생성은 별도 모델·서비스 설정이 필요합니다.',url:'https://github.com/MetaSonGi/web-virtual-human-studio/tree/main/bridge'},
 {id:'motion',name:'Three Different Worlds',category:'CREATIVE INTERACTION',icon:'◈',description:'동일한 작업을 세 가지 전혀 다른 방식으로.',stack:['Three.js','JavaScript','CSS','Interaction'],body:'우주 탐사, 캐릭터 여정, 데스크톱 작업실을 각각 다른 화면 구조와 조작 방식으로 구현한 현재 포트폴리오입니다. 세계를 바꾸면 3D 장면과 화면 상태를 정리하고 새 경험을 불러옵니다.',note:'스크롤·키보드·터치와 모션 감소 설정을 지원합니다.',url:null}
];
export const about='코드로 동작을 만들고, 인터랙션으로 경험을 만듭니다. MetaSonGi는 웹 기술과 가상 인물, 실시간 오디오, AI 영상 연결을 실험합니다.';
export function tags(stack){return stack.map(tag=>`<span>${tag}</span>`).join('')}
