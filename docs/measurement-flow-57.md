# #57 측정 플로우 구현 및 검증

## 현재 기준

- 프론트: PR #82가 병합된 `develop` b3cc2d5를 PR #73에 반영했다.
- 백엔드: `attoungmeongdan/backend` develop 7383c01의 측정 흐름·세션 서비스를 2026-09-12 확인했다. 소스 확인이며 배포 서버 실행 검증은 아니다.
- #82는 가로 화면, 시작 자세의 영상 비율 보정, 완료 메시지 누락 복구, 새 세션/티켓 재시작을 담당한다. #73은 그 위에 종목 안내, 저장 검증, 재진입·처음부터 하기, 최종 완료 화면을 추가한다.

## 통합한 동작

`useMeasurementFlow`가 전체 안내 → 종목 안내 → 시작 자세 대기 → 측정 → 다음 종목 안내/최종 완료 상태를 관리한다. 공통 `useWorkoutSession`이 연결·결과 조회·오류 복구를 처리한다.

- 의자 → 팔굽 → 윗몸 → 플랭크 순서로 안내, 시작 자세, API 요청, 결과 카드를 통일한다.
- #82의 카메라 프레임 크기 전달과 가로 화면 CSS를 유지한다. 프론트에서 횟수·유효 시간을 판정하지 않는다.
- 완료 메시지 수신, 소켓 종료, 주기적 결과 조회 모두 세션/모드/종목/그룹 일치 및 `result.status === COMPLETED`를 확인한다. 이어서 `progress`에 해당 종목이 저장됐는지 확인한 후 다음 안내로 넘어간다.
- 측정 중 3초 간격으로 결과를 조회한다. 완료 메시지를 받지 못해도 저장된 결과를 복구한다. `remainingTimeMs === 0`만으로 완료 처리하지 않는다. 0초 이후 네 번의 조회에도 저장되지 않거나 조회가 세 번 연속 실패하면 상태 확인 재시도를 제공한다.
- EXPIRED/CANCELLED는 완료로 간주하지 않는다. 시작 자세를 다시 확인한 뒤 새 세션/티켓으로 같은 운동을 0회부터 재개한다. 이전 티켓으로 WebSocket을 다시 열지 않는다.
- 세션 생성 콜백은 재시도에도 `useMeasurementFlow`를 거친다. 공통 훅이 `/resume`을 직접 호출해서 그룹·종목 검증을 우회하지 않는다.
- 정상적으로 다음 운동을 시작할 때는 동일 그룹을 포함한 일반 세션 생성 API를 호출한다. 중단 후 재진입·만료 재시작에는 body 없는 `/measurement/resume`을 사용한다. 처음부터 하기는 `/measurement/restart`를 시작 자세 확인 후 한 번 호출한다.
- 생성 응답을 검증한 뒤 상태·캐시에 저장한다. 잘못된 그룹/종목 응답, 중복된 저장 종목, 그룹 ID 없는 홈 재시작을 거부한다. 무효화된 진행 조회는 저장 성공으로 처리하지 않는다.
- 저장된 종목이 0개면 전체 안내, 1/2/3개면 다음 종목 안내를 복원한다. 그룹이 있으면 첫 종목도 재개 대상이다. 진행 조회 실패를 새 측정으로 바꾸지 않는다.
- 의자 30초, 팔굽/윗몸 60초, 플랭크 무제한 안내를 표시한다. 실제 값은 서버 `remainingTimeMs`와 `validDurationMs`를 사용한다.
- 측정 로딩/연결/저장 확인은 최소 500ms 표시하며 느린 요청에 추가 지연을 붙이지 않는다. 자유 운동의 기본 0ms에는 타이머를 만들지 않는다.
- 중복 시작/완료/재시도를 막고 취소·언마운트 후 늦은 응답을 무시한다. 단계별 안내 중 카메라는 유지하고 최종 완료 시 해제한다.
- 최종 완료는 분석 경로로만 이동하며 홈·뒤로가기를 차단한다. 탭 종료나 외부 URL 이동까지 강제로 차단하지는 않는다.
- WORKOUT은 측정 그룹과 측정 진행/이력 캐시를 변경하지 않는다. 재시작에는 일반 세션 생성 API를 쓴다.

## 완료 메시지 누락과 백엔드 확인

[ExerciseSessionService.cleanupExpiredSessions](https://github.com/attoungmeongdan/backend/blob/7383c019f74964a9d3dcb9b19425b82d1b20d5fb/src/main/java/com/atmd/backend/domain/fitness/service/ExerciseSessionService.java#L273)는 만료된 런타임의 제한시간이 지났으면 COMPLETED로 저장한다. 이 정리 경로와 `completeRuntime`/`finalizeRuntimeAfterCommit`에는 WebSocket 완료 메시지 송신이 없다. 메시지만 기다리는 화면은 서버 저장 후에도 남을 수 있으므로 결과 조회 복구가 필요하다. 실제 신고 건이 이 경로에서 발생했는지는 서버 로그와 실운동 재현이 필요하다.

## 검증

- `npm run test:unit`: **84개 통과**. 기존 두 PR의 회귀 테스트와 결합 동작 검증을 포함한다.
- `PLAYWRIGHT_CHANNEL=chrome npx playwright test`: **22개 통과**. 가로/세로·회전·safe area, 완료 메시지 누락 후 4종목 안내와 최종 분석 이동, 첫 운동 재진입과 새 티켓 재시작을 확인했다.
- `npm run build`, `npm run lint`, `npm run stylelint`: 통과. 기존 500kB chunk 경고는 유지된다.
- 실제 저장을 확인하지 못하면 다음 종목으로 가지 않는지, 폴링도 progress 검증을 거치는지, 재시작도 생성 응답 검증을 거치는지 추가로 검증했다.
- API/WebSocket/카메라 입력을 대체한 자동화 검증이다. 인증된 배포 서버에서 실제 운동·MediaPipe 추론·저장 및 분석 조회까지 완료한 검증은 아니다.

## 남은 서버 계약과 실기기 확인

아래는 프론트 충돌과 구분되는 서버 계약의 제약이다.

1. [MeasurementFlowService.restart](https://github.com/attoungmeongdan/backend/blob/7383c019f74964a9d3dcb9b19425b82d1b20d5fb/src/main/java/com/atmd/backend/domain/fitness/service/MeasurementFlowService.java#L59)는 기존 기록 삭제와 첫 세션 생성을 결합한다. 따라서 초기화는 홈 선택 순간이 아니라 시작 자세를 확인한 시점에 일어난다. 또한 서버 restart 자체에는 오늘 완료 그룹 거부 검사가 없다. 프론트는 호출 직전 progress.completed를 확인한다.
2. [ExerciseSessionService.create](https://github.com/attoungmeongdan/backend/blob/7383c019f74964a9d3dcb9b19425b82d1b20d5fb/src/main/java/com/atmd/backend/domain/fitness/service/ExerciseSessionService.java#L68)는 모드와 관계없이 사용자의 활성 세션을 정리한다. WORKOUT 생성이 남은 측정 런타임을 완료/만료 처리할 가능성은 프론트 캐시 분리만으로 제거되지 않는다.
3. 생성 성공 응답 유실·소켓 연결 전 이탈은 별도 취소/멱등성 계약이 없어 즉시 재시작 시 활성 세션 409가 남을 수 있다. 열린 세션의 클라이언트 이탈은 close 4000으로 정리한다.
4. 인증된 실제 기기에서 측정 4종목 전체 완료와 실제 결과 조회를 확인해야 한다. 자동화 통과가 실서버 검증을 대신하지 않는다.
