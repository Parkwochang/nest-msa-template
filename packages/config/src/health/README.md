# Health Check 전략

## 개요

이 프로젝트는 두 가지 레벨의 헬스체크를 사용합니다:

1. **서비스 파드 레벨**: Kubernetes가 각 파드의 상태를 확인
2. **API Gateway 레벨**: API Gateway가 연결된 gRPC 서비스들의 연결 상태를 확인

## 1. 서비스 파드 헬스체크 (User Service, Order Service 등)

### 목적
- Kubernetes가 파드의 생존 상태를 확인
- 파드가 트래픽을 받을 준비가 되었는지 확인

### 방법
**gRPC Health Checking Protocol 사용** (권장)

```yaml
# k8s/user-service-deployment.yaml
livenessProbe:
  grpc:
    port: 5001
    service: user.UserService  # 또는 grpc.health.v1.Health
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  grpc:
    port: 5001
    service: user.UserService
  initialDelaySeconds: 5
  periodSeconds: 5
```

### 체크 항목
- gRPC 서버가 정상적으로 응답하는지
- 메모리 사용량 (힙 1.5GB, RSS 1.8GB 이하)
- 디스크 사용량 (90% 이하)

## 2. API Gateway 헬스체크

### 목적
- API Gateway 자체의 상태 확인
- **연결된 gRPC 서비스들이 정상적으로 연결되어 있는지 확인**

### 방법
**HTTP 헬스체크 + gRPC 서비스 연결 상태 확인**

```typescript
// API Gateway의 HealthController
@Get('ready')
@HealthCheck()
readiness() {
  return this.health.check([
    this.healthService.checkStorage,
    this.healthService.checkMemory,
    this.healthService.checkUserServiceConnection, // gRPC 서비스 연결 상태
    // this.healthService.checkOrderServiceConnection,
  ]);
}
```

### 체크 항목
- API Gateway 자체 상태 (메모리, 디스크)
- **연결된 gRPC 서비스들의 연결 상태** ⭐
  - User Service 연결 상태
  - Order Service 연결 상태
  - 기타 마이크로서비스 연결 상태

## 헬스체크 흐름

```
┌─────────────────┐
│  Kubernetes     │
│  (Kubelet)      │
└────────┬────────┘
         │
         │ gRPC Health Check
         │ (grpc.health.v1.Health)
         ▼
┌─────────────────┐
│  User Service   │
│  (gRPC Server)  │
└────────┬────────┘
         │
         │ gRPC Connection Check
         ▼
┌─────────────────┐
│  API Gateway    │
│  (HTTP Server)  │
└─────────────────┘
```

## 사용 예시

### 1. 서비스 파드 (User Service)

```typescript
// apps/user/src/main.ts
app.connectMicroservice(
  connectGrpcServer({
    url: appConfig.GRPC_URL,
    protoPath: [PROTO_PATHS.USER, PROTO_PATHS.HEALTH],
  }),
);
```

Kubernetes가 gRPC Health Check로 파드 상태 확인:
```bash
# Kubernetes가 자동으로 수행
grpc-health-probe -addr=:5001 -service=user.UserService
```

### 2. API Gateway

```typescript
// API Gateway의 HealthController
@Get('ready')
@HealthCheck()
readiness() {
  return this.health.check([
    this.healthService.checkStorage,
    this.healthService.checkMemory,
    this.healthService.checkUserServiceConnection, // User Service 연결 확인
  ]);
}
```

API Gateway가 연결된 서비스들의 상태 확인:
```bash
# API Gateway 헬스체크
curl http://api-gateway:3000/health/ready

# 응답 예시
{
  "status": "ok",
  "info": {
    "storage": { "status": "up" },
    "memory_heap": { "status": "up" },
    "user_service_connection": { "status": "up" }
  }
}
```

## 장점

### 서비스 파드 레벨
- ✅ gRPC 서버 상태를 직접 확인
- ✅ HTTP 서버와 독립적으로 동작
- ✅ Kubernetes 네이티브 지원 (1.23+)

### API Gateway 레벨
- ✅ 연결된 모든 서비스의 상태를 한 번에 확인
- ✅ 서비스 장애 시 API Gateway가 트래픽을 받지 않음
- ✅ 모니터링 및 알림에 유용

## 주의사항

1. **서비스 파드**: gRPC Health Checking Protocol을 구현해야 함
2. **API Gateway**: ConfigService와 GATEWAY_CONFIG가 필요함
3. **타임아웃**: gRPC 서비스 체크는 적절한 타임아웃 설정 필요 (기본 2초)

## 참고

- [Kubernetes gRPC Probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#define-a-grpc-liveness-probe)
- [gRPC Health Checking Protocol](https://github.com/grpc/grpc/blob/master/doc/health-checking.md)
