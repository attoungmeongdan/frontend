/** Encode the group UUID as one path segment; never substitute a session ID or date. */
export function measurementAnalysisPath(measurementGroupId: string) {
  return `/measurements/${encodeURIComponent(measurementGroupId)}/analysis`;
}
