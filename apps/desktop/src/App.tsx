import { useEffect, useState } from "react";
import { api, AppInfo } from "./lib/tauri-api";

function App() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    api.system
      .getAppInfo()
      .then((info) => {
        setAppInfo(info);
      })
      .catch((err) => {
        setError(`Failed to fetch app info: ${err}`);
        console.error("IPC error:", err);
      });
  }, []);

  return (
    <main
      style={{
        padding: "40px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "#e0e0e0",
        backgroundColor: "#1a1a2e",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>
        ProjectPulse Desktop
      </h1>
      {error && (
        <p style={{ color: "#ff6b6b", marginBottom: "16px" }}>{error}</p>
      )}
      {appInfo ? (
        <div style={{ marginTop: "16px" }}>
          <p>
            <strong>Version:</strong> {appInfo.version}
          </p>
          <p>
            <strong>Platform:</strong> {appInfo.platform}
          </p>
          <p>
            <strong>App:</strong> {appInfo.appName}
          </p>
        </div>
      ) : (
        !error && <p style={{ color: "#888" }}>Loading...</p>
      )}
    </main>
  );
}

export default App;
