/**
 * Single place to read mock vs live preference (localStorage + API key).
 * Avoids import cycles between matchService and apiFootball.
 */
export type DataSourcePreference = "mock" | "live";

export function getDataSourcePreference(): DataSourcePreference {
  const saved = localStorage.getItem("ff26_dataSource");
  const hasApiKey = !!import.meta.env.VITE_API_FOOTBALL_KEY;

  if (saved === "live" && !hasApiKey) {
    return "mock";
  }

  return (saved as DataSourcePreference) || "mock";
}
