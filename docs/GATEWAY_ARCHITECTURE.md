# API Gateway Architecture

## 1. 목적

이 문서는 `apps/api-gateway`의 역할과 내부 구조를 정의한다.

- 외부 클라이언트의 단일 진입점 제공
- 내부 마이크로서비스(gRPC) 호출 오케스트레이션
- 인증/인가, 요청 검증, 에러/로깅/트레이싱 표준화
- 클라이언트 친화적인 BFF 응답 조합

---

## 2. 아키텍처 원칙

1. Gateway는 **BFF 역할**을 수행한다.
2. Gateway -> 내부 서비스 호출은 **gRPC로 단일화**한다.
3. 비즈니스 상태 변경의 핵심 책임은 각 도메인 서비스가 가진다.
4. Gateway는 조합/집계/정책 적용에 집중한다.

---

## 3. 모듈 구조

```text
apps/api-gateway/src
├── main.ts
├── app.module.ts
├── common/
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── filters/      (global http exception filter 등록 지점)
│   ├── guards/
│   └── interceptors/
├── grpc/
│   ├── user.grpc.module.ts
│   └── user.grpc.service.ts
└── modules/
    └── user/
        ├── user.controller.ts
        ├── user.facade.ts
        └── user.module.ts
```

---

## 4. 요청 처리 흐름

1. HTTP 요청 수신
2. TraceInterceptor에서 `traceId` 생성/복원
3. Guard + ValidationPipe 수행
4. Controller -> Facade
5. Facade에서 1개 이상 gRPC 서비스 호출
6. 예외 발생 시 글로벌 필터에서 공통 에러 포맷 변환
7. 성공 시 BFF DTO 반환

---

## 5. 공통 모듈 사용 정책

### Config / Logger
- `@repo/config/env`, `@repo/logger`는 전역 사용 허용
- 앱 부트스트랩에서 Nest 기본 로거를 Winston으로 교체

### Health
- `@repo/config/health`는 **HealthService + Terminus 인프라 제공**
- 실제 컨트롤러 라우팅(`/health`)은 앱(`api-gateway`)에서 조합

### Errors
- 글로벌 HTTP Exception Filter로 응답 포맷 통일
- 표준 에러 응답 스키마 유지:
  - `success`
  - `timestamp`
  - `path`
  - `traceId`
  - `error { code, message, details }`

---

## 6. CORS 정책

- 개발: 필요한 Origin만 허용 (와일드카드 최소화)
- 운영: 환경변수 기반 화이트리스트
- `credentials: true` 사용 시 `origin: *` 금지

---

## 7. Health Check 정책

### `/health/live`
- 프로세스 생존성 확인 중심

### `/health/ready`
- Gateway 자체 상태 + 핵심 의존 서비스 연결성 확인

### `/health`
- 메모리/디스크/RSS + 주요 gRPC 종속 서비스 체크

---

## 8. 관측성(Observability)

모든 요청/에러 로그에 최소 필드 포함:

- `service`
- `traceId`
- `context`
- `error.code`(실패 시)
- `latency`(가능한 경로)

---

## 9. 구현 규칙

1. Controller에는 HTTP 계약만 둔다.
2. Facade에 조합 로직을 둔다.
3. gRPC 호출 세부 옵션(timeout/retry/circuit-breaker)은 공통 패키지 정책을 따른다.
4. DTO는 Gateway 계약 기준으로 버전 관리한다(`/v1`, `/v2`).

---

## 10. 체크리스트

- [ ] `main.ts`에서 `app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))` 적용
- [ ] 글로벌 HTTP 예외 필터 등록
- [ ] CORS 정책 환경별 분리
- [ ] health endpoint 3종(live/ready/default) 점검
- [ ] 주요 BFF 엔드포인트의 통합 테스트 구성

## 가정/기본값

- 문서 범위는 `api-gateway` 아키텍처 한정
- 현재 레포 구조(`@repo/config`, `@repo/logger`, `@repo/errors`)를 유지
- 문서는 구현 가이드(정책/원칙/체크리스트) 중심으로 작성
