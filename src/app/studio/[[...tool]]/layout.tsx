import { preloadModule } from "react-dom";

export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

const dashboardBridge = "https://core.sanity-cdn.com/bridge.js";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  preloadModule(dashboardBridge, { as: "script" });
  return (
    <>
      <script src={dashboardBridge} async type="module" />
      {children}
    </>
  );
}
