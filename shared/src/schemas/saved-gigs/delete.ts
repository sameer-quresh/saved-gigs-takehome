import { Type } from "@sinclair/typebox";
import { createSchema, strictObject } from "../helpers";

export const remove = createSchema({
  params: strictObject({
    gigId: Type.Integer({ minimum: 1 }),
  }),
});
