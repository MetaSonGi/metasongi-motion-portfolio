export const experimentCatalog = [
  { id: 'afterimage', name: 'Afterimage', icon: '◫', label: '탭을 돌아오면 흔적이 생기는 인쇄물', kind: 'TRACE' },
  { id: 'prism', name: 'Prism Drift', icon: '◇', label: '포인터에 반응하는 반투명 조형', kind: 'REFRACT' },
  { id: 'signal', name: 'Signal Field', icon: '⁙', label: '파동을 흩뿌리는 입자 지도', kind: 'PULSE' },
  { id: 'transit', name: 'Night Transit', icon: '◎', label: '스크롤로 통과하는 기하학 터널', kind: 'TRAVEL' },
  { id: 'typepress', name: 'Type Press', icon: 'Aa', label: '압축하고 늘리는 키네틱 타이포', kind: 'STRETCH' },
  { id: 'assembly', name: 'Assembly Study', icon: '⬡', label: '부품을 분해하고 조립하는 3D 제품 쇼케이스', kind: 'ASSEMBLE' },
  { id: 'cutroom', name: 'Cut Room', icon: '◩', label: '이미지를 겹쳐 넘기는 프로젝트 극장', kind: 'CUT' },
  { id: 'frequency', name: 'Frequency Form', icon: '∿', label: '주파수를 조절하는 실시간 파형 조각', kind: 'TUNE' },
  { id: 'chromagrid', name: 'Chroma Grid', icon: '▦', label: '색을 고르고 직접 칠하는 격자', kind: 'PAINT' },
  { id: 'splitlight', name: 'Split Light', icon: '◑', label: '두 작품 사이를 가르는 탐색 슬라이더', kind: 'COMPARE' },
].map((world, index) => ({
  ...world,
  description: world.label,
  interaction: world.kind,
  number: String(index + 11),
}));
