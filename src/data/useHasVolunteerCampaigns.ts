import { useQuery } from "@tanstack/react-query";
import { listPublicCampaigns } from "@/data/campaignsApi";

/** Is any volunteer campaign published in the dashboard? The footer link shows only then. */
export function useHasVolunteerCampaigns(): boolean {
  const { data } = useQuery({
    queryKey: ["has-volunteer-campaigns"],
    queryFn: async () => (await listPublicCampaigns()).length > 0,
    staleTime: 5 * 60_000,
  });
  return data ?? false;
}
