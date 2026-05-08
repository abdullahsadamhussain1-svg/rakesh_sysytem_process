import { AssessmentForm } from "@/components/assessment-form";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Link from "next/link";

export default function NewAssessmentPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Assessment</h1>
                    <p className="text-muted-foreground mt-1">
                        Fill out the form below to create a new patient assessment.
                    </p>
                </div>
                <Button variant="outline" size="icon" asChild className="rounded-full shadow-sm hover:bg-destructive/10 hover:text-destructive border-slate-200 transition-colors">
                    <Link href="/">
                        <X className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
            <AssessmentForm />
        </div>
    );
}
