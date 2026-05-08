import { getFromGoogleSheet } from "@/lib/apps-script";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Pencil, User, ClipboardList, Activity, Stethoscope, FileText, Camera, CalendarDays, Banknote } from "lucide-react";
import { notFound } from "next/navigation";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { DownloadReportButton } from "@/components/download-report";
import { ClinicalMediaGallery } from "@/components/media-gallery";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
    </div>
);

const InfoRow = ({ label, value, fullWidth = false, highlight = false, isCurrency = false }: { label: string; value: string | number | undefined; fullWidth?: boolean, highlight?: boolean, isCurrency?: boolean }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-full' : ''}`}>
        <p className={`text-[10px] uppercase tracking-wider font-bold ${highlight ? 'text-red-500' : 'text-slate-400'}`}>{label}</p>
        <div className={`p-2.5 rounded-lg border min-h-[42px] flex items-center ${highlight ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
            <p className={`text-sm font-semibold leading-snug ${highlight ? 'text-red-700' : 'text-slate-700'}`}>
                {value ? (isCurrency ? `₹${value}` : value) : <span className="text-slate-300 font-normal italic">Empty</span>}
            </p>
        </div>
    </div>
);

export default async function AssessmentDetailPage(props: PageProps) {
    const params = await props.params;
    let assessments = [];
    
    try {
        assessments = await getFromGoogleSheet();
    } catch (error) {
        console.error("Failed to fetch assessment details:", error);
        return (
            <div className="p-4 sm:p-8 space-y-6">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <Card className="border-destructive bg-destructive/5">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center text-center py-10">
                            <h2 className="text-xl font-bold text-destructive mb-2">Synchronisation Error</h2>
                            <p className="text-muted-foreground mb-6">Could not connect to the clinical database. Verify APPS_SCRIPT_URL.</p>
                            <Button asChild variant="outline">
                                <Link href="/">Return to Dashboard</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const assessmentIndex = Number(params.id);
    if (isNaN(assessmentIndex) || assessmentIndex < 0 || assessmentIndex >= assessments.length) {
        notFound();
    }

    const assessment = assessments[assessmentIndex];

    return (
        <div className="min-h-screen bg-[#fafafa] p-4 sm:p-6 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Button asChild variant="outline" size="sm" className="w-full sm:w-auto rounded-xl border-slate-200 bg-white hover:bg-slate-50 h-11 px-4 font-bold shadow-sm">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                        <div className="flex-1 xs:flex-initial">
                            <DownloadReportButton assessment={assessment} className="w-full" />
                        </div>
                        <Button asChild size="sm" className="w-full sm:w-auto rounded-xl shadow-lg h-11 px-6 font-bold bg-primary hover:bg-primary/90 transition-all active:scale-95">
                            <Link href={`/assessment/${assessmentIndex}/edit`} className="flex items-center justify-center">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Record
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Patient Header */}
                <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                                <div className="h-12 w-12 sm:h-20 sm:w-20 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                                    <User className="h-6 w-6 sm:h-10 sm:w-10" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight break-words uppercase">
                                        {assessment.PatientName || 'Unnamed Patient'}
                                    </h1>
                                    <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-[12px] font-black text-primary/60 mt-2 uppercase tracking-widest">
                                        <span className="flex items-center gap-2 bg-primary/5 px-2 py-1 rounded-md">
                                            <CalendarDays className="h-3.5 w-3.5" /> 
                                            DATE: {formatDate(assessment.Date)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 sm:p-5 rounded-2xl border border-slate-100 flex-shrink-0 shadow-sm text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-70">Total Fee</p>
                                <p className="text-xl font-black text-primary flex items-center justify-end gap-1">
                                    ₹{assessment.FeesCollected || '0'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Clinical Details */}
                    <div className="space-y-6">
                        <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                            <CardContent className="p-5">
                                <SectionHeader title="Patient Details" icon={User} />
                                <div className="grid grid-cols-1 gap-4">
                                    <InfoRow label="Phone Number" value={assessment.PhoneNumber} />
                                    <InfoRow label="Medical History" value={assessment.MedicalHistory} fullWidth />
                                    <InfoRow label="BP / Sugar" value={assessment.BPSugar} fullWidth />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                            <CardContent className="p-5">
                                <SectionHeader title="Financial Summary" icon={Banknote} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InfoRow label="Total Fees" value={assessment.FeesCollected} isCurrency />
                                    <InfoRow label="Paid Amount" value={assessment.PaidAmount} isCurrency />
                                    <InfoRow 
                                        label="Pending Amount" 
                                        value={assessment.PendingAmount} 
                                        isCurrency 
                                        fullWidth 
                                        highlight={Boolean(assessment.PendingAmount && Number(assessment.PendingAmount) > 0)} 
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                            <CardContent className="p-5">
                                <SectionHeader title="Clinical Documentation" icon={FileText} />
                                <div className="grid grid-cols-1 gap-4">
                                    <InfoRow label="Chief Complaint" value={assessment.ChiefComplaint} fullWidth />
                                    <InfoRow label="Diagnosis" value={assessment.Diagnosis} fullWidth />
                                    <InfoRow label="Treatment Done" value={assessment.TreatmentDone} fullWidth />
                                    <InfoRow label="Advice Given" value={assessment.AdviceGiven} fullWidth />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Media Gallery */}
                <ClinicalMediaGallery urls={[assessment.Media1, assessment.Media2, assessment.Media3, assessment.Media4].filter(Boolean)} />
            </div>
        </div>
    );
}
