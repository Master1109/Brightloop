import type { OverviewData } from "./types";

const mockOverview: OverviewData = {
  revenue: [32, 41, 36, 52, 46, 64, 58, 73, 67, 81, 77, 92],
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  subscriptions: [
    { customer: "Acme Industries", plan: "Enterprise Annual", value: "₹2,40,000", status: "Active", renewal: "23 Oct 2026" },
    { customer: "Kite & Co.", plan: "Growth Monthly", value: "₹18,500", status: "Active", renewal: "21 Oct 2026" },
    { customer: "Northstar Labs", plan: "Starter Monthly", value: "₹8,900", status: "Quotation", renewal: "20 Oct 2026" },
    { customer: "Verve Retail", plan: "Enterprise Annual", value: "₹1,80,000", status: "Confirmed", renewal: "18 Oct 2026" },
    { customer: "Orbit Systems", plan: "Growth Monthly", value: "₹24,500", status: "Active", renewal: "16 Oct 2026" }
  ]
};

export async function getOverview(): Promise<OverviewData> {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "false") {
    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + "/dashboard", { credentials: "include" });
    if (!response.ok) throw new Error("Unable to load dashboard");
    return response.json() as Promise<OverviewData>;
  }
  await new Promise(resolve => setTimeout(resolve, 220));
  return mockOverview;
}

export function getMockOverview(): OverviewData {
  return mockOverview;
}
