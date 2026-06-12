import { Type } from "@sinclair/typebox";
import { createSchema, strictObject } from "../helpers";

export const list = createSchema({
  query: strictObject({
    offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  }),
});
