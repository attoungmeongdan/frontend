# 자유 운동 가로 화면 수정 — #78

- 이슈: https://github.com/attoungmeongdan/frontend/issues/78
- 브랜치: `fix/#78-exercise-landscape`
- 기준: fetch한 `origin/develop`의 `38a8d43`

## 재현 및 원인 구분

실제 `/exercise/:type` 페이지를 Chrome에서 열고 카메라 입력, MediaPipe 반환값, 인증 API, 운동 API/WebSocket 상대편만 테스트 데이터로 대체했다. React 페이지와 카메라/시작 자세/운동 세션 훅, 비디오 재생, canvas, WebSocket 객체는 실제 구현을 실행한다. 합성 좌표를 사용한 재현이며 실제 사람에 대한 MediaPipe 추론 정확도 검증은 아니다.

1. **UI/오버레이:** 수정 전 667×375에서 중앙의 252px 경고 아이콘이 횟수·안내와 겹치고, 경고 문구가 종료 버튼 위에 나타났다. 절대 배치된 가이드 이미지 영역(y=29~~314)이 측정값(y=48~~128) 및 안내 영역과 중첩했다. 개발 진단 출력(y=323~~367)은 가이드 하단 문구(y=333~~359)를 덮었다. 같은 공통 컴포넌트를 쓰는 다른 종목에도 잠재된 문제였다.
2. **카메라/캔버스:** 두 요소의 원본 크기 및 미러링은 이미 같았고 별도 위치 불일치는 재현되지 않았다. 다만 `object-cover`는 화면과 영상의 비율이 다르면 원본을 잘라낸다. 둘 다 `contain`으로 바꿔 판정에 사용하는 전체 프레임을 사용자도 볼 수 있게 했다. 화면에 여백이 생길 수 있다.
3. **시작 가이드:** 종목별 별도 가로 화면 구현은 없었다. 공통 가이드가 화면 전체에 절대 배치되어 정보 공간을 침범했다. 공통 grid 안의 남은 공간에서 이미지 크기를 제한하고 안내 문구는 별도 행에 둔다.
4. **랜드마크/시작 판정:** 기존 코드는 x/영상 너비, y/영상 높이로 각각 정규화된 좌표에 그대로 각도·기울기 공식을 적용했다. 동일한 물리 자세도 영상 비율에 따라 다른 자세로 판정된다. 1280×720의 비스듬한 sit-up 및 굽힌 팔 plank 좌표로 자동 시작이 실패했고, chair-stand/push-up 비교 좌표는 통과했다. 원본 영상 크기로 x/y 단위를 맞추면 네 종목 모두 통과한다. 화면 방향으로 좌표를 회전하지 않으며 서버로 전송하는 정규화 좌표는 수정하지 않는다.
5. **회전/세션:** 방향에 의한 재마운트/재연결 경로는 발견되지 않았다. 별도 방향 상태나 key를 추가하지 않고 CSS만 재배치한다. 원본 영상 크기가 바뀌면 다음 추론 프레임에서 canvas 크기와 판정용 비율을 갱신한다. 검출이 없는 프레임도 시작 감지 훅에 전달해 연속 3프레임 조건이 끊기도록 한다.

## 변경 범위

- `CameraStage.tsx`, `CameraStage.css`, `StartPoseGuide.tsx`: 공통 정보/가이드/경고/종료 버튼 영역, 줄바꿈, safe area.
- `PoseCameraFeed.tsx`: 영상과 canvas의 동일한 전체 프레임 표시.
- `usePoseCamera.ts`, `useStartPoseDetection.ts`, `startPose.ts`, `types/exercise.ts`: 원본 영상 크기 전달 및 자세 판정 보정, 검출 공백 처리.
- `ExercisePage.tsx`, `MeasurePage.tsx`: 공통 훅의 새 프레임 크기 인자 연결. 개발 진단 출력은 `?debugCamera=1`에서만 표시.
- `AppLayout.tsx`: fullViewport 카메라는 자체 safe area를 적용하므로 상단 여백의 중복 적용 방지. 일반 화면의 여백은 유지.
- 테스트 설정/의존성, 테스트 파일: 단위·브라우저 회귀 테스트 추가.
- `.coderabbit.yaml`: 기존 develop의 Prettier 실패를 해결하는 들여쓰기만 정리.

## 자동 검증

```sh
npm ci
npx playwright install chromium
npm test
npm run lint
npm run build
npm run format:check
npm run stylelint
```

설치된 Chrome을 사용하는 경우 `PLAYWRIGHT_CHANNEL=chrome npm test`로 실행한다. `npm test`는 Vitest 후 Playwright를 실행하며, 브라우저 테스트는 로컬 Vite 서버를 자동 실행한다. 외부 운동 서버나 로그인 계정은 필요 없다. 단위 테스트만 실행하려면 `npm run test:unit`, 브라우저만 실행하려면 `npm run test:e2e`를 사용한다.

- 36개 단위 테스트: 네 종목 × 6개 영상 비율, 좌우 미러링, 한쪽 가림, 낮은 신뢰도, 누락/비정상 좌표, 잘못된 자세, 입력 좌표 보존, 연속 프레임 및 일회 시작.
- 20개 브라우저 테스트: 네 종목 × 844×390 / 667×375 / 390×844 / 375×667, 두 가로 해상도에서 sit-up/plank의 노치 여백.
- 가이드/운동 중/경고/몸 미검출 상태에서 주요 요소의 화면 경계·겹침·가로 넘침 및 종료 버튼 hit testing을 확인한다.
- 세로→가로→세로 및 가로→세로→가로에서 카메라 획득/트랙 정지/모델 생성·해제 횟수, stream/track ID가 변하지 않는지 확인한다. 영상 원본 비율 유지와 변경을 모두 검증한다.
- WebSocket 연결 1회, 세션 생성 1회, 연결 종료 0회, 동일 세션 ID 및 연속 전송 sequence, 횟수 7→8 / 플랭크 01:05→01:06 진행을 확인한다.
- safe area는 Chrome DevTools의 [setSafeAreaInsetsOverride](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setSafeAreaInsetsOverride)로 실제 CSS env 값을 설정한다. 가로 좌우 44px/하단 21px, 세로 상단 47px/하단 34px를 확인한다.
- 실행 시 `test-results/`에 가이드/경고 스크린샷, 실패 시 trace가 생성된다.

## 최종 실행 결과 (2026-09-12)

| 명령                                 | 결과                                        |
| ------------------------------------ | ------------------------------------------- |
| `PLAYWRIGHT_CHANNEL=chrome npm test` | 통과: 단위 36개, 브라우저 20개              |
| `npm run lint`                       | 통과                                        |
| `npm run build`                      | 통과: 500kB 초과 번들 안내 경고는 남아 있음 |
| `npm run format:check`               | 통과                                        |
| `npm run stylelint`                  | 통과                                        |
| `git diff --check`                   | 통과                                        |

브라우저 스크린샷에서 가로 sit-up 가이드/경고와 세로 plank 경고 화면을 직접 검토했다.

## 실기기에서 남은 확인

Chrome 모바일 에뮬레이션과 합성 카메라/랜드마크/서버 응답으로 검증했다. 실제 모바일 기기, iOS Safari/PWA, 실제 MediaPipe 추론 및 운영 서버 운동 판정은 이번 환경에서 확인하지 않았다.

실기기에서는 네 종목별로 카메라를 허용하고 시작 자세를 취한 다음, 운동 중 양방향 회전하여 영상·관절·횟수/시간·세션 ID를 확인한다. 특히 바닥 자세의 가림/카메라 각도/조명에 따른 랜드마크 품질과 회전 시 OS가 트랙을 강제로 종료하는 경우는 추가 확인이 필요하다. 기존 판정의 관절 임계값은 유지했다.
