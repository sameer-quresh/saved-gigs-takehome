export const GIG_MODE = ["online", "offline"] as const;
export type GigMode = (typeof GIG_MODE)[number];
export const GigModeLabel: Record<GigMode, string> = {
  online: "Online",
  offline: "Offline",
};

export const GIG_STATUS = ["open", "closed"] as const;
export type GigStatus = (typeof GIG_STATUS)[number];
export const GigStatusLabel: Record<GigStatus, string> = {
  open: "Open",
  closed: "Closed",
};
