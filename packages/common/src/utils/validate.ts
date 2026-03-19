import z from 'zod';

// ----------------------------------------------------------------------------
// prettier-ignore

/** 기본 형식 스키마 */
export const CommonSchema = {
  // ! 기본 형식
  number     : z.coerce.number({ message: '숫자가 아닙니다.' }), // positive, negative, nonnegative, nonpositive
  string     : z.coerce.string({ message: '문자가 아닙니다.' }),
  boolean    : z.coerce.boolean({ message: '불리언이 아닙니다.' }),
  booleanSafe: z.preprocess(
    (val) => (val === 'true' || val === '1' ? true : val === 'false' || val === '0' ? false : val),
      z.boolean({ message: '불리언이 아닙니다.' })
    ).default(false),
  date       : z.coerce.date({ message: '날짜가 아닙니다.' }),
  dateStr    : z.string().datetime({ message: '날짜 문자열이 아닙니다.' }),
  uuid       : z.string().uuid({ message: '올바른 ID 형식이 아닙니다.' }),
  email      : z.string().email({ message: '이메일 형식이 올바르지 않습니다.' }).trim().min(1, { message: '이메일은 필수 입력 필드입니다.' }),
  
  // ! 패키지 내 공통 스키마
  port : createStringIntSchema(1, 65535),
  env  : z.enum(['development', 'production', 'test'], { message: '환경 변수가 아닙니다.' }).default('development'),
  dbUrl: z
    .string()
    .url({ message: 'DB URL이 아닙니다.' })
    .startsWith('postgresql://', { message: 'PostgreSQL DB URL이 아닙니다.' }),
  timeout  : z.coerce.number().int().positive().default(3000),
  expiresIn: z.string().regex(/^[0-9]+[smhd]$/, { message: '올바른 만료 시간 형식이 아닙니다.' }),
  secret   : z.string().min(32, { message: '시크릿 키는 최소 32자 이상이어야 합니다.' }),
  
  // ! 페이지네이션 스키마
  take       : createStringIntSchema(1, 200).default(10),
  page       : z.coerce.number().default(0),
  sortOrder  : z.enum(['asc', 'desc']).default('desc'),
  sortBy     : z.string().default('createdAt'),
  searchQuery: z.string().min(2, { message: '검색어는 2글자 이상이어야 합니다.' }).optional(),
  
  // ! 상품 스키마
  price   : z.coerce.number().nonnegative({ message: '금액은 0원 이상이어야 합니다.' }),
  stock   : z.coerce.number().nonnegative({ message: '재고는 0개 이상이어야 합니다.' }),
  quantity: z.coerce.number().int().positive({ message: '수량은 1개 이상이어야 합니다.' }),
};

// passthrough 나머지 필드 살리고 통과

export const calculateSkip = (page: number, take: number) => (page - 1) * take;

export const emptyToUndefined = (v: unknown) => (v ? v : undefined);

// ----------------------------------------------------------------------------

export function createStringIntSchema(min = 0, max = 100) {
  return z.coerce.number().int().min(min).max(max);
}

// ----------------------------------------------------------------------------

export function validate<T>(schema: z.ZodSchema<T>, data: unknown) {
  return schema.parse(data);
}

// ! grpc용 0 과 빈 문자열에 대해 undefined로 변환
// ! 없는 값에 대해 formating 필요
