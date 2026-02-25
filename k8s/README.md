# Kubernetes 배포 가이드

## gRPC 헬스체크 설정 방법

Kubernetes에서 gRPC 서비스의 헬스체크를 수행하는 방법은 3가지가 있습니다.

### 방법 1: Kubernetes 네이티브 gRPC Probe (권장) ⭐

**Kubernetes 1.23+ 버전에서 지원**

```yaml
livenessProbe:
  grpc:
    port: 5001
    service: user.UserService  # package.service 형식
  initialDelaySeconds: 10
  periodSeconds: 10
```

**장점:**
- 별도 도구 설치 불필요
- Kubernetes 네이티브 지원
- 간단한 설정

**단점:**
- Kubernetes 1.23+ 버전 필요
- gRPC Health Checking Protocol을 구현해야 함

### 방법 2: grpc-health-probe 사용

**모든 Kubernetes 버전에서 사용 가능**

#### 1. Dockerfile에 grpc-health-probe 추가

```dockerfile
# grpc-health-probe 설치
RUN GRPC_HEALTH_PROBE_VERSION=v0.4.24 && \
    wget -qO/bin/grpc-health-probe \
    https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc-health-probe-linux-amd64 && \
    chmod +x /bin/grpc-health-probe
```

#### 2. Kubernetes Deployment 설정

```yaml
livenessProbe:
  exec:
    command:
      - /bin/grpc-health-probe
      - -addr=:5001
      - -service=user.UserService
  initialDelaySeconds: 10
  periodSeconds: 10
```

**장점:**
- 모든 Kubernetes 버전에서 사용 가능
- 더 세밀한 제어 가능 (타임아웃, TLS 등)

**단점:**
- Dockerfile에 grpc-health-probe 추가 필요

### 방법 3: HTTP 헬스체크 (현재 방식)

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3001
  initialDelaySeconds: 10
```

**장점:**
- 구현이 간단
- 모든 Kubernetes 버전에서 사용 가능

**단점:**
- gRPC 서버 상태를 직접 확인하지 않음
- HTTP 서버가 다운되면 헬스체크 실패 (gRPC는 정상일 수 있음)

## 서비스 이름 형식

gRPC 헬스체크에서 사용하는 서비스 이름은 **`package.service`** 형식입니다:

- `user.UserService` - user 패키지의 UserService
- `order.OrderService` - order 패키지의 OrderService
- 빈 문자열 `""` - 전체 서비스 상태 확인

## gRPC Health Checking Protocol 구현 필요

Kubernetes에서 gRPC 헬스체크를 사용하려면, 서비스에 **gRPC Health Checking Protocol**을 구현해야 합니다:

1. `health.proto` 파일 생성 (이미 완료)
2. Health 서비스 구현 (NestJS에서)
3. gRPC 서버에 Health 서비스 등록

## 예제: User Service Deployment

```bash
# 배포
kubectl apply -f k8s/user-service-deployment.yaml

# 상태 확인
kubectl get pods -l app=user-service
kubectl describe pod <pod-name>

# 로그 확인
kubectl logs -f <pod-name>
```

## 헬스체크 테스트

```bash
# 파드 내부에서 직접 테스트
kubectl exec -it <pod-name> -- /bin/grpc-health-probe -addr=:5001 -service=user.UserService

# 또는 grpcurl 사용
grpcurl -plaintext localhost:5001 grpc.health.v1.Health/Check
```

## 참고 자료

- [Kubernetes gRPC Probe 문서](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#define-a-grpc-liveness-probe)
- [grpc-health-probe GitHub](https://github.com/grpc-ecosystem/grpc-health-probe)
- [gRPC Health Checking Protocol](https://github.com/grpc/grpc/blob/master/doc/health-checking.md)
