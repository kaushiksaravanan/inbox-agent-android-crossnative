import { TasksClient } from "./tasks-client";

// Local-first: tasks live in IndexedDB and Gmail tokens in localStorage,
// both browser-only. The dashboard is rendered entirely by the client
// component; we keep this server file as a thin shell so the route still
// works under the (dashboard) layout.
//
// `force-dynamic` prevents Next from caching an empty SSR payload that the
// hydrated client would only briefly disagree with.

export const dynamic = "force-dynamic";

export default function TasksPage() {
  return <TasksClient />;
}
