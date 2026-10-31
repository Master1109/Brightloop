import { Suspense } from "react";
import Dashboard from "../Dashboard";

export default function RoutedPage() {
  return <Suspense fallback={<main className="route-loading" aria-label="Loading Brightloop" />}>
    <Dashboard />
  </Suspense>;
}
