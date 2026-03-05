export interface StatusType {
  code: string;
  label?: string;
}

export function isValidStatus<T extends Record<string, string>>(value: string, enumType: T): boolean {
  return Object.values(enumType).includes(value);
}

export function statusFromString<T extends Record<string, string>>(value: string, enumType: T): string | undefined {
  const entries = Object.entries(enumType);
  const found = entries.find(([, v]) => v === value);
  return found ? found[1] : undefined;
}
