import clsx from "clsx";

export function cn(...classes: unknown[]): string {
  return clsx(classes);
}
