import z from 'zod';

// ----------------------------------------------------------------------------
// prettier-ignore

const CommonValidateSchema = {
  toNumber: z.coerce.number(),
  toString: z.coerce.string(),
  toBoolean: z.coerce.boolean(),
  toDate: z.coerce.date(),
  // toArray: z.coerce.array(),
  // toObject: z.coerce.object(),
  // toJson: z.coerce.json(),
  // toEnum: z.enum(['development', 'production', 'test']),
  // toUuid: z.string().uuid(),
};

// export const CommonValidateSchema = z.object({
//   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
// });

// ----------------------------------------------------------------------------

export function validate<T>(schema: z.ZodSchema<T>, data: unknown) {
  return schema.parse(data);
}
