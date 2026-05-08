import { Button } from "@/components/ui/button";
import { getFromGoogleSheet } from "@/lib/apps-script";
import Link from "next/link";
import { PlusCircle, RefreshCw } from "lucide-react";
import { DashboardTable } from "@/components/dashboard-table";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Always fetch fresh data

export default async function Home() {
  let assessments = [];
  let error: string | null = null;
  
  try {
    const data = await getFromGoogleSheet();
    // Sanity filter: remove null, undefined, arrays, or non-object rows
    assessments = Array.isArray(data)
      ? data.filter((a: any) => a && typeof a === 'object' && !Array.isArray(a) && a.PatientName)
      : [];
  } catch (err) {
    console.error("Failed to fetch assessments:", err);
    error = err instanceof Error ? err.message : "Could not connect to Google Sheets";
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Patient Assessments</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Showing {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} • Data synced with Google Sheets
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <form>
            <Button type="submit" variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </form>
          <Button asChild size="sm" className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold shadow-md px-4">
            <Link href="/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden xs:inline">New Patient</span>
              <span className="xs:hidden">New</span>
            </Link>
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-3 mb-6">
          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <p className="text-sm font-medium">
            <span className="font-bold">Sync Error:</span> {error}. Please verify your deployment settings or try refreshing.
          </p>
        </div>
      )}

      <DashboardTable assessments={assessments} />
    </div>
  );
}
