"use client";

import { useCallback, useState } from "react";
import type { SortDir } from "@/lib/table-sort";

export function useTableSort<K extends string>(
  defaultKey: K,
  defaultDir: SortDir = "desc"
) {
  const [sortKey, setSortKey] = useState<K>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  const toggle = useCallback(
    (key: K, opts?: { text?: boolean }) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return;
      }
      setSortKey(key);
      setSortDir(opts?.text ? "asc" : "desc");
    },
    [sortKey]
  );

  return { sortKey, sortDir, toggle, setSortKey, setSortDir };
}
