import * as gigs from "./gigs/list";
import * as savedGigsSave from "./saved-gigs/save";
import * as savedGigsDelete from "./saved-gigs/delete";
import * as savedGigsList from "./saved-gigs/list";

export const schema = {
  gigs: {
    list: gigs.list,
  },
  savedGigs: {
    save: savedGigsSave.save,
    delete: savedGigsDelete.remove,
    list: savedGigsList.list,
  },
};

export type { createSchema, strictObject, StringEnum } from "./helpers";
