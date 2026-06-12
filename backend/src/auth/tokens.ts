import type { Permission } from "shared";
import { PERMISSIONS } from "shared";

export interface AuthUser {
  id: number;
  permissions: Permission[];
}

export interface TokenMapping {
  token: string;
  user: AuthUser;
}

export const TOKEN_MAPPINGS: TokenMapping[] = [
  {
    token: "user-1-token",
    user: {
      id: 1,
      permissions: [
        PERMISSIONS.CREATE_SAVED_GIG,
        PERMISSIONS.READ_SAVED_GIG,
        PERMISSIONS.DELETE_SAVED_GIG,
      ],
    },
  },
  {
    token: "user-2-token",
    user: {
      id: 2,
      permissions: [
        PERMISSIONS.CREATE_SAVED_GIG,
        PERMISSIONS.READ_SAVED_GIG,
        PERMISSIONS.DELETE_SAVED_GIG,
      ],
    },
  },
  {
    token: "user-1-readonly-token",
    user: {
      id: 1,
      permissions: [
        PERMISSIONS.READ_SAVED_GIG,
        PERMISSIONS.DELETE_SAVED_GIG,
      ],
    },
  },
];

export function findUserByToken(token: string): AuthUser | undefined {
  return TOKEN_MAPPINGS.find((entry) => entry.token === token)?.user;
}



