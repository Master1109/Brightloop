import { Suspense } from "react";
import Dashboard from "./Dashboard";

export default function Home() {
  return <Suspense fallback={<main className="route-loading" aria-label="Loading Brightloop" />}>
    <Dashboard />
  </Suspense>;
}
