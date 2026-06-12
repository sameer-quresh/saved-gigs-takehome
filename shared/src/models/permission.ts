export const PERMISSIONS = {
  CREATE_SAVED_GIG: "Create:SavedGig",
  READ_SAVED_GIG: "Read:SavedGig",
  DELETE_SAVED_GIG: "Delete:SavedGig",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_SAVED_GIG_PERMISSIONS: Permission[] = [
  PERMISSIONS.CREATE_SAVED_GIG,
  PERMISSIONS.READ_SAVED_GIG,
  PERMISSIONS.DELETE_SAVED_GIG,
];
