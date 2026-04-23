import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

export function usePreservedResultsHeight(isEmptyState: boolean) {
  const resultsRegionRef = useRef<HTMLDivElement>(null);
  const [searchEmptyMinHeight, setSearchEmptyMinHeight] = useState<number | null>(null);

  const preserveResultsHeight = useCallback(() => {
    const currentHeight = resultsRegionRef.current?.offsetHeight;
    if (!currentHeight || currentHeight <= 0) return;
    setSearchEmptyMinHeight(currentHeight);
  }, []);

  const clearPreservedHeight = useCallback(() => {
    setSearchEmptyMinHeight(null);
  }, []);

  useEffect(() => {
    if (!isEmptyState) {
      setSearchEmptyMinHeight(null);
    }
  }, [isEmptyState]);

  const preservedHeightStyle: CSSProperties | undefined =
    isEmptyState && searchEmptyMinHeight
      ? { minHeight: `${searchEmptyMinHeight}px` }
      : undefined;

  return {
    resultsRegionRef,
    preserveResultsHeight,
    clearPreservedHeight,
    preservedHeightStyle,
  };
}
