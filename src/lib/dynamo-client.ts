// a mock dynamo db client
import { z } from 'zod';
const metaObject = z.object({
  description: z.string().optional(),
});

export type Meta = z.infer<typeof metaObject>;
export const meta = <T extends z.ZodTypeAny>(obj: T, _m: Meta) => { return obj };