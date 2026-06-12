import { SAVED_LIST, SavedListLabel, type SavedList } from "shared";

export interface SaveFormField {
  name: "list" | "note";
  label: string;
  type: "select" | "textarea";
  options?: Array<{ value: SavedList; label: string }>;
  maxLength?: number;
}

export const saveFormConfig: SaveFormField[] = [
  {
    name: "list",
    label: "List",
    type: "select",
    options: SAVED_LIST.map((value) => ({
      value,
      label: SavedListLabel[value],
    })),
  },
  {
    name: "note",
    label: "Note",
    type: "textarea",
    maxLength: 280,
  },
];
