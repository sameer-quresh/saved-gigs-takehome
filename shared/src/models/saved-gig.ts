export const SAVED_LIST = ["WATCHLIST", "APPLY_LATER", "SHORTLIST"] as const;
export type SavedList = (typeof SAVED_LIST)[number];
export const SavedListLabel: Record<SavedList, string> = {
  WATCHLIST: "Watchlist",
  APPLY_LATER: "Apply later",
  SHORTLIST: "Shortlist",
};

export const DEFAULT_SAVED_LIST: SavedList = "WATCHLIST";
