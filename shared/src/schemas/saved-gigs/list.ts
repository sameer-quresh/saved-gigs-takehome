import { Type } from "@sinclair/typebox";
import { createSchema, strictObject, StringEnum } from "../helpers";
import { SAVED_LIST } from "../../models/saved-gig";

export const list = createSchema({
  query: strictObject({
    offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
    list: Type.Optional(StringEnum(SAVED_LIST)),
  }),
});
