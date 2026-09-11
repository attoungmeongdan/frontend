# #57 측정 플로우 구현 및 검증

## 기준

- 프론트 기준: `develop` 9708f32. PR #46은 d77fbf1로 병합된 상태에서 fast-forward pull 후 `fix/#57-measurement-flow` 생성.
- 프론트 작업 트리 변경 없음 확인 후 시작. 별도 `code/Base_BE` 저장소의 사용자 README 변경은 수정하지 않음.
- 백엔드 코드: `attoungmeongdan/backend` develop 8a8d1f8 (2026-09-11 확인).
- 배포 `https://api.atmd.cloud/v3/api-docs`의 progress/resume/restart 경로와 응답 설명 확인.

## 구현

`useMeasurementFlow`가 전체 안내 → 종목 안내 → 시작 자세 대기 → 측정 → 종목 안내/최종 완료 상태를 관리한다. 저장 중/저장 오류는 공통 `useWorkoutSession`의 상태를 재사용한다.

- `MEASURE_STEPS`의 의자 → 윗몸 → 팔굽 → 플랭크 순서 및 기존 mascot/readyBody, `MascotModal`, `CameraStage` 재사용.
- 카메라, MediaPipe full 모델, 시작 자세 3프레임 감지, 관절 송신은 기존 공통 훅을 사용한다. 프론트에는 횟수/유효 시간 판정기를 추가하지 않았다.
- 진행 조회와 저장 확인 오류를 신규 측정으로 바꾸지 않는다. 완료된 종목 집합과 서버의 다음 종목이 목표 순서에 맞는지 검증한다.
- 저장된 종목이 0개면 그룹이 존재해도 전체 안내부터 시작한다. 1/2/3개면 다음 종목 안내부터 복원한다.
- `SESSION_COMPLETED` 수신 후 result의 COMPLETED, 세션/모드/종목/그룹 일치, progress의 해당 종목 저장을 확인한 후에만 다음 모달로 이동한다.
- 처리 오류/열렸던 WebSocket 종료 시에도 먼저 저장 결과를 확인한다. EXPIRED/CANCELLED면 시작 자세를 다시 잡도록 한다. 이미 저장됐으면 정확한 다음 안내로 이동한다.
- 의자 30초, 윗몸/팔굽 60초 안내. 시간 표시는 서버 `remainingTimeMs`, 플랭크는 `validDurationMs`를 사용한다. 로컬 시간 경과로 완료 처리하지 않는다.
- 요청과 동시에 500ms 타이머를 시작한다. 로딩/연결/저장 확인 중 중복 동작과 앱 내 이동을 막고, 늦게 도착한 결과는 취소/언마운트 후 적용하지 않는다.
- 완성된 그룹은 완료 모달을 표시하고 뒤로가기를 비활성화한다. React Router 이동도 분석 경로만 허용한다. 확인 시 분석 경로로 replace 이동한다. 브라우저 탭 닫기/외부 URL 이동까지 강제로 막지는 않으며, 새로고침하면 서버 완료 상태로 복구한다.
- 단계가 변해도 카메라 스트림은 유지하고 전체 완료 시 해제한다.
- 홈 임시 `?state` override 제거. 버튼 클릭 시 서버를 다시 조회해 신규/재개/오늘 완료를 결정한다. 재시작·종목 저장 후 측정 진행 캐시를 갱신한다.
- WORKOUT 생성 요청에는 measurementGroupId를 넣지 않는다. WORKOUT 완료·취소는 측정 진행/이력 캐시를 변경하지 않는다.

## 백엔드 계약상 블로커

### 1. 목표 순서와 서버 순서 불일치

[MeasurementSequence](https://github.com/attoungmeongdan/backend/blob/8a8d1f8/src/main/java/com/atmd/backend/domain/fitness/service/MeasurementSequence.java)의 순서는 CHAIR_STAND → PUSH_UP → SIT_UP → PLANK다. `ExerciseSessionService.resolveMeasurementGroupId`가 이 순서를 강제하며 위반 시 FITNESS_409_7을 반환한다.

#57은 CHAIR_STAND → SIT_UP → PUSH_UP → PLANK를 요구한다. 이 PR은 요청한 순서를 바꾸거나 서버를 속여 다른 운동 좌표를 전송하지 않는다. 현재 백엔드에서는 의자 저장 후 순서 오류를 안내하며, 목표 순서 전체 완료는 백엔드 순서 변경/배포가 필요하다. 배포 OpenAPI에는 실제 ORDER 값이 없어 배포 서비스의 순서는 인증 후 별도 확인이 필요하다.

### 2. 초기화와 첫 세션 생성이 결합됨

[MeasurementFlowService.resume/restart](https://github.com/attoungmeongdan/backend/blob/8a8d1f8/src/main/java/com/atmd/backend/domain/fitness/service/MeasurementFlowService.java)는 모두 `ExerciseSessionService.create`를 호출한다. restart는 기존 종목을 soft-delete하고 새 그룹/의자 세션/티켓까지 생성한다. 그룹만 초기화하는 API는 없다.

따라서 홈에서 재시작 선택 시 해당 그룹 ID를 history state에 의도로 보관하고 1단계부터 표시하되, 실제 restart POST는 시작 자세 확인 시점에 호출한다. 같은 화면 새로고침에는 의도가 유지되며, 새 그룹으로 변경됐거나 오늘 완료됐으면 과거 의도를 적용하지 않는다. 성공 후 재시도/다음 종목에서는 restart를 다시 호출하지 않는다.

**한계:** 재시작을 선택한 직후 1·2단계에서 나가면 서버의 이전 저장 기록이 아직 남는다. “선택 즉시 초기화”와 “자세 확인 전 세션 생성 금지”를 동시에 충족하려면 초기화 전용 API 또는 지연 세션 생성 계약이 필요하다. `restart` 자체에는 완료된 그룹 거부 검사도 없으므로 서버에서 트랜잭션 내 일일 완료 검사도 추가해야 한다. 프론트는 POST 직전 progress.completed를 확인한다.

### 3. 자유 운동과 측정 런타임 정리의 서버 결합

[ExerciseSessionService.create](https://github.com/attoungmeongdan/backend/blob/8a8d1f8/src/main/java/com/atmd/backend/domain/fitness/service/ExerciseSessionService.java)는 모드와 관계없이 사용자의 CREATED/MEASURING 세션 전체를 정리한다. 남아 있는 측정 런타임의 제한시간이 경과했다면 WORKOUT 생성 요청에서도 측정 세션을 COMPLETED로 저장할 수 있다. 프론트의 측정 API/캐시 분리만으로 서버 측 불변성까지 보장할 수 없다. 모드별 정리 정책과 취소 계약을 백엔드에서 보완해야 한다.

### 4. 통신 중단/응답 유실의 한계

[WebSocket handler](https://github.com/attoungmeongdan/backend/blob/8a8d1f8/src/main/java/com/atmd/backend/global/websocket/ExercisePoseWebSocketHandler.java)는 정상 close(1000)에는 만료 처리를 하지 않는다. 클라이언트 취소 시 4000으로 닫아 열린 세션을 EXPIRED로 정리하도록 했다. 완료 이벤트는 서버 트랜잭션 커밋 이후 전송되므로 완료 후 닫기에서 저장 결과를 되돌리지 않는다.

REST 성공 응답이 유실되거나 소켓 연결 전에 탭이 닫힌 경우에는 해당 세션을 취소할 REST 계약이 없다. 생성 티켓 유효시간은 60초이며, 백엔드의 활성 세션 검사로 즉시 재시도가 409가 될 수 있다. POST 멱등성 키/생성 전 취소 API 없이 네트워크 유실 상황까지 세션 생성의 exactly-once를 보장하지 않는다. 다음 시도에서는 진행 상태를 다시 조회하므로 성공한 restart를 무조건 반복하지 않는다.

## 검증 결과

자동 검증은 `npm test`의 API/WebSocket/카메라 입력을 대체한 회귀 테스트다. 실제 MediaPipe/사용자 신체 동작이나 배포 서버 저장 성공을 의미하지 않는다.

| 시나리오                     | 확인 결과                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| 신규 1→11 전체 완료          | 목표 순서 mock 계약에서 확인, 실서버는 순서 블로커                                              |
| 3단계 이탈 → 신규 1단계      | 저장 0개 그룹/이탈/재마운트 확인                                                                |
| 5/7/9단계 이탈 → 4/6/8단계   | 각 상태 진입·이탈·재마운트 확인                                                                 |
| 각 재개 상태에서 처음부터    | 자세 감지 전 POST 없음, 감지 후 restart 1회 및 다음 종목 resume 확인; 선택 즉시 초기화는 블로커 |
| 새로고침/뒤로가기/홈 재진입  | 메모리 라우터 재마운트·서버 재조회 및 완료 단계 뒤로가기 차단 확인                              |
| 자유 운동 시작/완료/취소     | 프론트 측정 캐시/진행 조회/재개/재시작 호출 불변 확인; 서버 정리 정책은 블로커                  |
| 빠른/느린 로딩               | 20/500/1300ms 요청, 실패, 1200ms 저장 확인. 500ms 최소 및 느린 요청 추가 지연 없음              |
| 중복 이벤트/클릭, StrictMode | 세션 1회 생성·종목 저장 확인 1회·언마운트 후 늦은 응답 무시                                     |
| 서버 시간/플랭크             | remainingTimeMs 표시, 로컬 90/180초 경과만으로 완료되지 않음, 서버 완료 이벤트 후 이동          |
| 세로/가로                    | 테스트 데이터 브라우저: 390×844, 844×390, 667×375에서 안내·카메라 픽토그램·완료 모달 확인       |
| 최종 완료 → 분석             | 비활성 뒤로가기, 모달 닫기 없음, 분석 경로 replace 이동 확인                                    |

### 코드 검사

- `npm ci` 후 원본 develop 별도 복사본: build/ESLint/Stylelint 통과. 빌드의 500kB chunk 경고는 기존에도 발생.
- 원본 develop 전체 Prettier: `.coderabbit.yaml` 실패. 이번 범위에서 수정하지 않음.
- 변경 후 build/ESLint/Stylelint 및 변경 파일 Prettier, 테스트 결과는 PR 체크리스트 참조.
- 초기 로컬 node_modules에 vite-plugin-pwa가 없어 빌드가 실패했으나 최신 lockfile로 npm ci 후 해소. develop 소스 오류로 분류하지 않음.

### 실서버/실기기 미검증

배포 OpenAPI 조회 성공 및 로컬 앱의 로그인 화면은 확인했다. 인증된 브라우저 세션이 없어 배포 서버의 실제 progress/resume/restart/result 응답, WebSocket 저장 완료, 실제 카메라/MediaPipe 추론 및 물리적 화면 회전은 검증하지 못했다. 테스트용 데이터 화면에서는 실제 카메라/REST 저장을 수행하지 않았다. 분석 페이지 도착 후 실제 종합 분석 조회 역시 미검증이다.

블로커 수정과 인증된 실기기 검증 전까지 드래프트로 유지한다.
