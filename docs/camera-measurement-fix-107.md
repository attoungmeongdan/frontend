# 카메라·측정 플로우 수정 검증 (#107)

- 이슈: https://github.com/attoungmeongdan/frontend/issues/107
- 브랜치: `fix/#107-camera-measurement-flow`
- 기준: 최신 develop `2809153`에서 분기. 최초 FE 작업 트리는 clean. 이전 `fix/#95-calendar-result-hint` 브랜치와 별도 Base_BE 저장소의 사용자 README 변경은 보존.

## 증거와 원인

사용자가 제공한 이미지 1(기존 플랭크 정상 화면), 2(스쿼트 안내/상하 검은 띠), 3(윗몸일으키기 3/4 오류)를 직접 확인했다. 이미지 3은 8회, 남은 시간 00:40이므로 정상 시간 만료 화면이 아니다. 흰 카드의 설명이 보이지 않는 현상도 확인했다. 개인 카메라 사진 원본은 저장소에 추가하지 않았다.

### 스쿼트 콘텐츠

`7dd92a7`에서 `chair-stand`의 자유 운동 표시명만 스쿼트로 변경했고, `d446803`에서 준비 이미지도 스쿼트로 교체했다. `StartPoseGuide`의 의자 안내와 측정 콘텐츠는 별도로 남아 있어 이름·이미지·문구가 불일치했다.

`exerciseContent.ts`가 운동별 이름·이미지·준비 문구를 제공한다. 현재 계약을 유지하여 자유 운동의 `chair-stand`는 스쿼트 콘텐츠, 체력 측정은 실제 의자 운동 콘텐츠를 선택한다. 측정의 의자 이미지는 교체 이전 Git 이력에서 복원했다. API의 `CHAIR_STAND`와 저장 키는 변경하지 않았다. 측정에 SQUAT 종목은 존재하지 않으며, 향후 측정 운동 자체를 바꾸려면 서버 운동 계약도 함께 확인해야 한다.

시작 자세 검출은 두 운동 모두 서 있는 자세로 동일하다. 음성 코드는 숫자·시간·전신 인식 안내를 재생하며 운동별 의자 준비 음성을 공유하지 않는다. 음성 로직은 유지했다.

### 카메라 상하 여백

최근 헤더/PWA 수정(`90a969a`, `f795b46`, `13f713d`, `8e2cef8`)과 현재 라우트를 점검했다. 최신 develop은 카메라에서 공통 헤더·일반 페이지 상단 safe-area를 이미 제외하고 있다. 스크린샷 2의 검은 띠와 직접 대응하는 원인은 `PoseCameraFeed`의 `object-contain`: 화면과 영상 비율이 다르면 영상 안에 레터박스가 생긴다.

영상·캔버스를 모두 중앙 정렬 `object-cover`로 바꾸어 동일한 크롭과 반전을 적용했다. intrinsic canvas 크기는 계속 videoWidth/videoHeight를 사용하며 원본 관절 좌표는 변형 없이 서버로 보낸다. 카메라의 fullViewport 속성이 헤더/내비게이션/본문 패딩보다 우선하도록 AppLayout 계약도 명확히 했다.

`h-dvh`, `viewport-fit=cover`, `black-translucent` 메타, CameraStage의 safe-area는 유지했다. 여백을 음수 마진이나 임의의 top/bottom 차감으로 가리지 않았다. 일반 페이지의 헤더 높이와 safe-area는 유지했다.

### 측정 완료 확인에 멈추는 흐름

수정 전 `useWorkoutSession`은 `EXERCISE_PROCESSING_FAILED`를 받자마자 `completing`으로 전환한다. 이 상태는 포즈 전송을 차단하고 결과를 한 번 조회한다. 결과가 아직 `MEASURING`이면 `error`로 멈추므로, 남은 시간이 있어도 서버로 새 관절이 전달되지 않고 완료 확인 화면에 갇힌다. 결과 polling이 3번 실패해도 동일하게 전송이 중단됐다.

실제 backend develop `191e764`의 `ExercisePoseWebSocketHandler`는 프레임 처리 오류를 전송해도 소켓을 유지한다. 프론트는 프레임 오류를 경고로 표시·기록하면서 전송을 계속하고, 기존 polling으로 서버 저장 결과를 확인하도록 수정했다. 살아 있는 소켓의 결과 API 장애도 프레임 전송을 중단하지 않는다.

추가 원인과 수정:

- 완료 이벤트 뒤 결과/그룹 진행 상태의 일시적인 반영 지연을 즉시 실패로 처리했다. 일시 오류와 반영 대기는 GET만 최대 4회(재시도 간격 1초) 확인한다. 다른 세션/운동/그룹 결과는 성공으로 처리하지 않는다.
- 자유 운동의 완료 POST 응답과 후속 GET이 모두 유실되면 기존 재시도가 POST를 다시 보냈다. 현재 세션에서 완료 요청을 시도한 사실을 유지하여 이후 재시도는 GET으로만 확인한다. 측정 모드는 수동 완료 POST를 호출하지 않는다.
- 측정 오류 설명이 CameraStage의 흰 글자색을 상속했다. 흰 카드 안 설명에 명시적인 본문 글자색과 fallback 안내를 적용했다.
- 조회 재시도 예약은 취소·언마운트 시 중단한다. HTTP/WS 오류는 개발 환경에서 작업 종류·sessionId·상태/코드/메시지를 기록하고 인증 헤더·티켓·관절 payload는 기록하지 않는다.
- 카메라 재생/모델 초기화 실패 후 스트림이 남거나, 언마운트 뒤 video.play가 해결되면 모델을 뒤늦게 초기화하던 경로를 정리했다.

**실제 프론트 결함은 재현했다. 다만 이미지 3 당시 최초 서버 예외의 구체적인 원인은 당시 WS 로그/서버 로그 없이 확정할 수 없다.** 프론트 복구 결함과 서버 내부 오류의 원인을 구분한다.

## 수정 파일

| 파일                                                          | 핵심 변경                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| `src/constants/exerciseContent.ts`                            | 스쿼트/의자 및 나머지 운동 안내 매핑                                |
| `src/constants/exercises.ts`                                  | 자유 운동 이름을 공통 콘텐츠에서 선택                               |
| `src/constants/measure.ts`, `measurementOrder.ts`             | 측정 의자 이름 일치                                                 |
| `src/components/exercise/StartPoseGuide.tsx`                  | 모드에 따른 문구·이미지 선택                                        |
| `src/assets/exercises/guide-chair-stand-measurement.png`      | 실제 의자 운동 준비 이미지 복원                                     |
| `src/components/exercise/PoseCameraFeed.tsx`                  | video/canvas 동일한 cover 크롭                                      |
| `src/components/layout/AppLayout.tsx`                         | fullViewport가 공통 헤더/내비/본문 여백보다 우선                    |
| `src/hooks/useWorkoutSession.ts`                              | 프레임 오류 복구, 완료 요청 중복 방지, 결과 확인과 리소스 수명 관리 |
| `src/hooks/useMeasurementFlow.ts`                             | 저장 반영 지연과 잘못된 그룹 응답 구분                              |
| `src/utils/completionVerification.ts`                         | 취소 가능한 GET 재시도와 제한된 오류 진단                           |
| `src/hooks/usePoseCamera.ts`                                  | 재생·모델 실패 및 늦은 초기화 cleanup                               |
| `src/pages/MeasurePage.tsx`                                   | 측정 전용 콘텐츠, 프레임 오류 경고, 읽을 수 있는 오류 안내          |
| `tests/workout-session.test.tsx`, `measurement-flow.test.tsx` | 완료 경쟁/프레임 오류/4단계 전환/재시도 회귀                        |
| `tests/pose-camera-cleanup.test.tsx`                          | 늦은 응답·재생 실패·모델 실패 리소스 해제                           |
| `tests/e2e/camera-regressions.spec.ts`                        | 스쿼트/의자 안내, safe-area 전체화면, 일반 헤더 복원                |
| `tests/e2e/exercise-landscape.spec.ts`                        | video/canvas cover 정렬 검증                                        |
| `tests/e2e/measurement-session.spec.ts`                       | 3/4 프레임 오류, 503 복구·글자색, 수동 완료 POST 금지               |

## 실행 결과

| 검사                                         | 결과                           |
| -------------------------------------------- | ------------------------------ |
| `npm run test:unit`                          | 6 파일 / 103 테스트 통과       |
| `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e` | 27 테스트 통과                 |
| `npx tsc -b`                                 | 통과                           |
| `npm run lint`                               | 통과                           |
| `npm run stylelint`                          | 통과                           |
| 변경 파일 `prettier --check`                 | 통과                           |
| `npm run build`                              | 통과, PWA 서비스워커 생성 확인 |
| `git diff --check`                           | 통과                           |

Playwright 기본 번들 Chromium은 설치되어 있지 않아 최초 실행은 브라우저 시작 전에 실패했다. 프로젝트가 지원하는 `PLAYWRIGHT_CHANNEL=chrome`으로 설치된 Chrome 153.0.8010.36을 사용해 전체 테스트를 통과했다. 새 브라우저나 패키지는 설치하지 않았다. build에는 500 kB 초과 chunk 경고가 남는다.

원인 검증을 위해 기준 develop의 소스를 임시 디렉터리에 복원하고 새 회귀 테스트 6개를 실행했다. 프레임 오류, 조기 완료 이벤트, 완료 요청 재시도, 늦은 모델 초기화, 재생/모델 실패 후 스트림 잔류를 검사한 6개 모두 수정 전 코드에서는 실패하며 현재 코드에서는 통과한다. 기존 작업 트리를 되돌리며 검사하지 않았다.

테스트 환경: macOS / Chrome 모바일·터치 에뮬레이션. 뷰포트 375×667, 390×844, 393×852, 667×375, 844×390 및 회전 조합. Safe-area는 세로 top 47/59·bottom 34, 가로 left/right 44·bottom 21을 CDP로 주입했다.

검증한 시나리오:

- 자유 운동 스쿼트 준비 문구와 의자 표현 미노출, 측정 의자 안내/이미지 유지.
- 4종목 세로/가로 준비 화면·진행 화면·경고·회전, 영상/캔버스 크기·object-fit·반전 일치.
- fullViewport 전체 화면 크기, 중복 헤더/내비 부재, 홈 복귀 시 일반 헤더/내비/safe-area 복원.
- 측정 1→4 완료 및 그룹 분석 라우트, 유실된 완료 이벤트 polling 복구, 3/4 40초 시점 프레임 오류 뒤 다음 단계 진행.
- StrictMode에서 중복 이벤트/POST 방지, 잘못된 순서/그룹 검증, 만료 시 새 시작 자세·티켓, 재시도 연타와 늦은 응답 무시.
- 503 조회 실패 안내의 실제 글자색 및 GET만 재시도, 기존 성공 완료 POST 재전송 방지.
- 카메라/모델 실패와 이탈 시 해제, 완료 확인 재시도 타이머 취소.

## 직접 확인이 필요한 부분

- 실제 iPhone Safari 및 홈 화면 설치형 PWA의 상태바/홈 인디케이터/주소창 높이 변화. Chrome safe-area 에뮬레이션은 iOS 실기기 검증을 대체하지 않는다.
- 실제 카메라/MediaPipe 모델과 로그인된 운영 백엔드로 4종목 운동. E2E는 네트워크·카메라·모델 경계를 fixture로 대체하고 실제 React·라우터·video/canvas·WebSocket 처리를 실행한다.
- 이미지 3 발생 시점의 서버 예외 로그. 동일 오류가 지속되면 개발 진단의 sessionId/코드로 서버 원인을 추적해야 한다.
- cover는 여백 없이 표시하는 대신 원본 영상 일부를 자른다. 영상과 포즈는 같은 좌표로 잘리며, 극단적인 종횡비에서는 카메라 거리/배치 실기기 확인이 필요하다.
- 완료 POST가 서버에 도달했는지 불명확한 경우 재전송하지 않고 결과를 확인한다. 서버에 끝내 저장되지 않으면 완료로 위장하지 않고 복구 안내에 남는다.
