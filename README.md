# MetaSonGi — Three Different Worlds

공개 사이트: [metasongi.github.io/metasongi-motion-portfolio](https://metasongi.github.io/metasongi-motion-portfolio/)
GitHub Pages는 main 브랜치의 docs 폴더에서 배포합니다. 로그인 없이 접속할 수 있는 정적 포트폴리오입니다.

색상만 바꾸는 테마가 아니라, 페이지 구조·3D 장면·내비게이션·조작 방식이 다른 세 가지 포트폴리오입니다.

## 01 / Beyond Gravity (`?world=space`)

스크롤로 카메라가 우주 공간을 따라 이동합니다. 구름 무늬 셰이더, 행성 대기와 고리, 별과 이동 궤적을 Three.js로 구성했습니다. 가상 인물 행성 → AI 영상 성운 → 다음 연결로 이어집니다. 경로 슬라이더를 끌거나 좌표 버튼을 눌러 바로 이동할 수 있으며 배경 드래그로 시선을 조절할 수 있습니다.

## 02 / A Little Journey (`?world=journey`)

밝은 풍경 속 작은 탐험가가 길을 걸으며 아바타 연구실과 아이디어 공장 표지판을 지납니다. 스크롤·슬라이더·방향키로 이동하고, Space 또는 점프 버튼으로 점프하며 인사 버튼으로 손을 흔듭니다. 캐릭터·길·나무·건물 표지판은 코드로 만든 원본 3D 도형이며 외부 캐릭터 모델을 포함하지 않습니다.

## 03 / Developer OS (`?world=workspace`)

스크롤 페이지 대신 프로젝트 탐색기와 이동 가능한 창을 가진 데스크톱입니다. 프로젝트 검색, 상세 창, 창 드래그·최소화·최대화·닫기, 소개·README·터미널을 제공합니다. 좁은 화면에서는 창을 한 화면에 맞추고 하단 앱 버튼으로 전환합니다.

터미널 명령: `help`, `projects`, `open vrm`, `open pixelle`, `open motion`, `about`, `theme space`, `theme journey`, `clear`. 한국어 주제로도 현재 포트폴리오 내용을 검색합니다. 외부 LLM을 호출하지 않습니다.

## 공통

- 상단 `세계 바꾸기` 또는 Alt + 1 / 2 / 3으로 전환합니다. URL에 각 세계를 직접 지정할 수 있습니다.
- 세계 전환 시 RAF·이벤트·타이머·WebGL 지오메트리·재질·텍스처·컨텍스트를 정리합니다.
- 모션 일시정지, reduced-motion, 키보드 조작, 모달 포커스와 스크린리더 안내를 지원합니다.
- 프로젝트 정보는 확인한 내용만 사용합니다. Pixelle 실제 영상 생성에는 별도 모델·서비스 설정이 필요함을 명시합니다.

## Motion Lab / 10

화면 아래 `MOTION LAB 10`에서 효과 목록을 열고 직접 실행할 수 있습니다. 다른 세계의 효과를 누르면 해당 세계로 전환한 뒤 실행합니다.

1. Hyperspace warp — 우주 워프, 시야각과 별빛 터널
2. Meteor shower — 유성우
3. Orbital focus — 현재 행성의 카메라 궤도 탐색
4. Cosmic ripple — 빛의 고리와 우주 파동
5. Character dash — 경로를 따라 빠르게 이동하는 대시
6. Flip jump — 공중에서 회전하는 점프
7. Landing particles — 점프 착지 먼지와 지면 파동
8. World portal — 세계 전환을 연결하는 포털 와이프
9. Magnetic dock — 포인터 거리와 실행 버튼에 반응하는 앱 독
10. Spring windows — 창 열기·복원·최소화·최대화 모션

모션 감소 설정에서는 큰 동작을 생략합니다. 3D 모션 일시정지 중에는 모션을 멈추고 본문·경로 탐색을 유지합니다.

`docs/`를 정적 서버로 제공하면 실행됩니다. 외부 빌드 과정은 없습니다. Three.js와 MIT 라이선스는 `docs/vendor/`에 포함했습니다. Google Fonts 로드가 실패하면 시스템 글꼴을 사용합니다. WebGL이 없는 환경에서도 경로를 통한 프로젝트 설명과 OS 작업실은 탐색할 수 있습니다. 이전 디자인 소스는 참고를 위해 남겨두었으며 현재 진입점은 `experience.js`입니다.
