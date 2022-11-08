import { z } from 'zod';
import {
  meta,
} from './dynamo-client';

export enum Status {
  Confirmed = 'confirmed',
  Pending = 'pending',
  Delivered = 'delivered',
}

export const OrderTable = meta(
  z
    .object({
      id: z.string(),
      createdAt: meta(z.number().optional(), {
        description: 'Creation date of the order as javascript timestamp',
      }),

      isTest: meta(z.boolean().optional(), {
        description: 'Indicates whether the order was marked as a test',
      }),
      status: z.nativeEnum(Status).optional(),
    }, {})
    .passthrough(), {
      description: 'table'
    }
);

export type OrderTable = z.infer<typeof OrderTable>;
