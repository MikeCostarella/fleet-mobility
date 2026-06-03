import { useState } from "react";

// Form-draft state with a typed field setter. Replaces the identical
// `const set = <K extends keyof typeof f>(...)` helper that the vehicle,
// driver, and work-order forms each declared. Returns the current draft and
// a setter that updates one field while preserving the rest.
export function useDraft<T>(initial: T): [T, <K extends keyof T>(key: K, value: T[K]) => void] {
  const [draft, setDraft] = useState<T>(initial);
  const set = <K extends keyof T>(key: K, value: T[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  return [draft, set];
}
