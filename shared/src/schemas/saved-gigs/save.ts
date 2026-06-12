import { Type } from "@sinclair/typebox";
import { createSchema, strictObject, StringEnum } from "../helpers";
import { SAVED_LIST } from "../../models/saved-gig";

export const save = createSchema({
  params: strictObject({
    gigId: Type.Integer({ minimum: 1 }),
  }),
  body: strictObject({
    list: Type.Optional(StringEnum(SAVED_LIST)),
    note: Type.Optional(Type.String({ maxLength: 280 })),
  }),
});
