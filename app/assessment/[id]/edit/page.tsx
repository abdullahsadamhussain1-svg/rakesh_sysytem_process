import { getFromGoogleSheet } from "@/lib/apps-script";
import { EditAssessmentForm } from "@/components/edit-assessment-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// Caching enabled for instant load times

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditAssessmentPage(props: PageProps) {
    const params = await props.params;
    let assessments = [];
    
    try {
        const data = await getFromGoogleSheet();
        assessments = data; // use the raw array with preserved indices
    } catch (error) {
        console.error("Failed to fetch assessment for editing:", error);
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-muted/20 rounded-xl border-2 border-dashed">
                <h2 className="text-xl font-bold text-destructive mb-2">Connection Error</h2>
                <p className="text-muted-foreground mb-6">Could not retrieve data from Google Sheets.</p>
                <Link href="/" className="text-primary hover:underline font-medium">Return to Dashboard</Link>
            </div>
        );
    }

    const assessmentIndex = Number(params.id);

    if (isNaN(assessmentIndex) || assessmentIndex < 0 || assessmentIndex >= assessments.length) {
        notFound();
    }

    const assessment = assessments[assessmentIndex];

    return (
        <div className="max-w-4xl mx-auto py-2">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Assessment</h1>
                    <p className="text-muted-foreground mt-1">
                        Modify the details for {assessment.PatientName || 'this patient'}.
                    </p>
                </div>
                <Button variant="outline" size="icon" asChild className="rounded-full shadow-sm hover:bg-destructive/10 hover:text-destructive border-slate-200 transition-colors">
                    <Link href={`/assessment/${assessmentIndex}`}>
                        <X className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
            <EditAssessmentForm assessment={assessment} assessmentIndex={assessmentIndex} />
        </div>
    );
}
