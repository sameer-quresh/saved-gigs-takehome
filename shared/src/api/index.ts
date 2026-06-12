import type { ListGigs } from "./gigs/interfaces";
import type {
  ListSavedGigs,
  SaveSavedGigResponse,
} from "./saved-gigs/interfaces";

const records = {
  "gigs/list": {} as ListGigs,
  "saved-gigs/list": {} as ListSavedGigs,
  "saved-gigs/save": {} as SaveSavedGigResponse,
} as const;

export type ResponseKey = keyof typeof records;

export type ResponseInterface<K extends ResponseKey> = (typeof records)[K];

export { records as responseRegistry };
