import { PortalLoadingState } from "@/components/portal/portal-loading-state";

export default function PortalLoading() {
  return (
    <div className="space-y-6">
      <PortalLoadingState label="Loading member portal page" blocks={4} />
    </div>
  );
}
