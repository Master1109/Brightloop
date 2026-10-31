export type SubscriptionStatus = "Active" | "Confirmed" | "Quotation" | "Draft";

export type SubscriptionRow = {
  customer: string;
  plan: string;
  value: string;
  status: SubscriptionStatus;
  renewal: string;
};

export type OverviewData = {
  revenue: number[];
  months: string[];
  subscriptions: SubscriptionRow[];
};
