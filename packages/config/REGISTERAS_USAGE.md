# registerAs 설정 사용 가이드

`registerAs`로 만든 설정을 타입 안전하게 사용하는 방법입니다.

## 1. 기본 사용법

### ConfigModule 등록

```typescript
// app.module.ts
import { ConfigModule } from '@repo/config/config';

@Module({
  imports: [
    ConfigModule.forRoot(), // 모든 설정 자동 로드
  ],
})
export class AppModule {}
```

### ConfigService 주입

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '@repo/config/config';

@Injectable()
export class MyService {
  constructor(private readonly configService: ConfigService) {}
}
```

## 2. 타입 안전한 접근 방법

### 방법 1: 전체 설정 객체 가져오기 (권장) ⭐

```typescript
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '@repo/config/config';

@Injectable()
export class PrismaService {
  constructor(private readonly configService: ConfigService) {
    // 타입 안전한 접근
    const dbConfig = this.configService.get<DatabaseConfig>('database');

    // 사용
    const databaseUrl = dbConfig.url;
    const host = dbConfig.host;
    const port = dbConfig.port;
  }
}
```

### 방법 2: 개별 속성 접근

```typescript
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyService {
  constructor(private readonly configService: ConfigService) {
    // 개별 속성 접근 (타입 추론 가능)
    const databaseUrl = this.configService.get<string>('database.url');
    const redisHost = this.configService.get<string>('redis.host');
    const redisPort = this.configService.get<number>('redis.port');
  }
}
```

### 방법 3: 기본값과 함께 사용

```typescript
@Injectable()
export class MyService {
  constructor(private readonly configService: ConfigService) {
    // 기본값 제공
    const port = this.configService.get<number>('app.port', 3000);
    const redisHost = this.configService.get<string>('redis.host', 'localhost');
  }
}
```

## 3. 실제 사용 예시

### Database 설정 사용

```typescript
// prisma.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '@repo/config/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService {
  constructor(private readonly configService: ConfigService) {
    // 타입 안전한 접근
    const dbConfig = this.configService.get<DatabaseConfig>('database');

    if (!dbConfig) {
      throw new Error('Database configuration is missing');
    }

    const pool = new Pool({
      connectionString: dbConfig.url,
      max: 20,
    });

    const adapter = new PrismaPg(pool);
    // ...
  }
}
```

### Redis 설정 사용

```typescript
// redis.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisConfig } from '@repo/config/config';
import Redis from 'ioredis';

@Module({})
export class RedisModule {
  static forRootAsync(): DynamicModule {
    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'REDIS_CLIENT',
          useFactory: (configService: ConfigService) => {
            // 타입 안전한 접근
            const redisConfig = configService.get<RedisConfig>('redis');

            if (!redisConfig) {
              throw new Error('Redis configuration is missing');
            }

            return new Redis({
              host: redisConfig.host,
              port: redisConfig.port,
              password: redisConfig.password,
              db: redisConfig.db,
              connectTimeout: redisConfig.connectTimeout,
            });
          },
          inject: [ConfigService],
        },
      ],
    };
  }
}
```

### JWT 설정 사용

```typescript
// auth.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtConfig } from '@repo/config/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  generateToken(userId: string) {
    const jwtConfig = this.configService.get<JwtConfig>('jwt');

    return this.jwtService.sign(
      { userId },
      {
        secret: jwtConfig.secret,
        expiresIn: jwtConfig.expiresIn,
      },
    );
  }
}
```

### gRPC 설정 사용

```typescript
// grpc.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GrpcConfig } from '@repo/config/config';

@Injectable()
export class GrpcService {
  constructor(private readonly configService: ConfigService) {}

  getUserServiceUrl() {
    const grpcConfig = this.configService.get<GrpcConfig>('grpc');

    // 옵셔널 체이닝으로 안전하게 접근
    return grpcConfig?.userService?.url;
  }

  getOrderServiceUrl() {
    const grpcConfig = this.configService.get<GrpcConfig>('grpc');
    return grpcConfig?.orderService?.url;
  }
}
```

### App 설정 사용

```typescript
// app.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@repo/config/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getAppInfo() {
    const appConfig = this.configService.get<AppConfig>('app');

    return {
      name: appConfig.name,
      version: appConfig.version,
      env: appConfig.env,
      port: appConfig.port,
    };
  }
}
```

## 4. 타입 가져오기

각 설정 파일에서 타입을 export하므로 import해서 사용:

```typescript
// 설정 타입 import
import { DatabaseConfig, RedisConfig, JwtConfig, GrpcConfig, AppConfig } from '@repo/config/config';
```

## 5. 주의사항

### ❌ 잘못된 사용

```typescript
// 타입 없이 사용 (타입 안전성 없음)
const dbConfig = this.configService.get('database');
const url = dbConfig.url; // 타입 체크 안 됨
```

### ✅ 올바른 사용

```typescript
// 타입 명시
const dbConfig = this.configService.get<DatabaseConfig>('database');
const url = dbConfig.url; // 타입 체크됨
```

### ✅ 옵셔널 체이닝 (안전한 접근)

```typescript
// 설정이 없을 수 있는 경우
const grpcConfig = this.configService.get<GrpcConfig>('grpc');
const userServiceUrl = grpcConfig?.userService?.url || 'localhost:5001';
```

## 6. 요약

1. **ConfigModule 등록**: `ConfigModule.forRoot()`
2. **ConfigService 주입**: `constructor(private configService: ConfigService)`
3. **타입 안전한 접근**: `configService.get<ConfigType>('namespace')`
4. **타입 import**: 설정 파일에서 export한 타입 사용

```typescript
// 패턴
const config = this.configService.get<ConfigType>('namespace');
const value = config.property;
```
