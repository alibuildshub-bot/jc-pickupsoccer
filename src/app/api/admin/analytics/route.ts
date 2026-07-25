import {
  adminConfigError,
  createSupabaseAdminClient,
  isAdminRequest,
  unauthorizedError,
} from "@/lib/admin";

type VisitRow = {
  path: string;
  visitor_id: string;
  created_at: string;
};

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data, error } = await supabase
    .from("site_visits")
    .select("path,visitor_id,created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error && isMissingAnalyticsTable(error)) {
    return Response.json({
      setupNeeded: true,
      analytics: emptyAnalytics(),
    });
  }

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    setupNeeded: false,
    analytics: buildAnalytics((data || []) as VisitRow[]),
  }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function buildAnalytics(visits: VisitRow[]) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const uniqueVisitors = new Set(visits.map((visit) => visit.visitor_id));
  const todayVisits = visits.filter((visit) => visit.created_at.slice(0, 10) === todayKey);
  const todayVisitors = new Set(todayVisits.map((visit) => visit.visitor_id));
  const visitsByDay = new Map<string, { date: string; visits: number; visitors: Set<string> }>();
  const pageCounts = new Map<string, number>();

  for (const visit of visits) {
    const dayKey = visit.created_at.slice(0, 10);
    const day = visitsByDay.get(dayKey) || { date: dayKey, visits: 0, visitors: new Set<string>() };

    day.visits += 1;
    day.visitors.add(visit.visitor_id);
    visitsByDay.set(dayKey, day);
    pageCounts.set(visit.path, (pageCounts.get(visit.path) || 0) + 1);
  }

  return {
    totalVisits: visits.length,
    uniqueVisitors: uniqueVisitors.size,
    todayVisits: todayVisits.length,
    todayVisitors: todayVisitors.size,
    daily: Array.from(visitsByDay.values())
      .sort((first, second) => second.date.localeCompare(first.date))
      .slice(0, 14)
      .map((day) => ({
        date: formatDate(day.date),
        visits: day.visits,
        visitors: day.visitors.size,
      })),
    topPages: Array.from(pageCounts.entries())
      .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
      .slice(0, 5)
      .map(([path, visits]) => ({ path, visits })),
  };
}

function emptyAnalytics() {
  return {
    totalVisits: 0,
    uniqueVisitors: 0,
    todayVisits: 0,
    todayVisitors: 0,
    daily: [],
    topPages: [],
  };
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isMissingAnalyticsTable(error: { code?: string; message?: string }) {
  return error.code === "42P01" || error.message?.toLowerCase().includes("site_visits");
}
