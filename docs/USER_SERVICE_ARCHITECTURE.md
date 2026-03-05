# User Service Architecture

현재 `apps/user` 서비스의 실제 구조를 기준으로 작성한 아키텍처 문서입니다.

## 1. Layer Structure

```mermaid
flowchart TB
    A["gRPC Transport<br/>domains/user/transport/grpc"] --> B["Application<br/>domains/user/application"]
    B --> C["Domain<br/>domains/user/domain"]
    B --> D["Infra Adapter<br/>domains/user/infra/repositories"]
    D --> E["Prisma Core Infra<br/>infra/persistence/prisma"]
    E --> F[("PostgreSQL")]
```

## 2. Request Flow (FindOne/Create)

```mermaid
sequenceDiagram
    participant GW as API Gateway
    participant GC as UserGrpcController
    participant US as UserService
    participant RP as UserRepositoryPort
    participant PR as PrismaUserRepository
    participant PS as PrismaService
    participant DB as PostgreSQL

    GW->>GC: gRPC UserService.FindOne/Create
    GC->>US: call use-case logic
    US->>RP: interface call
    RP-->>US: DI token USER_REPOSITORY
    US->>PR: runtime resolved implementation
    PR->>PS: prisma query
    PS->>DB: SQL
    DB-->>PS: row/result
    PS-->>PR: prisma model
    PR-->>US: UserEntity (mapper)
    US-->>GC: UserResponse
    GC-->>GW: gRPC response
```

## 3. Dependency Direction

```mermaid
flowchart LR
    T["Transport"] --> AP["Application Port/Service"]
    AP --> DP["Domain Entity"]
    AP --> P["Port (USER_REPOSITORY)"]
    P -.implemented by.-> AD["Infra Repository Adapter"]
    AD --> PI["Prisma Infra"]
```

## 4. Current Folder Map

```text
apps/user/src
├── domains/user
│   ├── application
│   │   ├── ports
│   │   └── services
│   ├── domain
│   │   └── entities
│   ├── infra
│   │   ├── mappers
│   │   └── repositories
│   └── transport
│       └── grpc
└── infra/persistence/prisma
    ├── prisma.module.ts
    ├── prisma.service.ts
    └── generated/*
```

