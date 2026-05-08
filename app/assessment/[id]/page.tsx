import { getFromGoogleSheet } from "@/lib/apps-script";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Pencil, User, ClipboardList, Activity, Stethoscope, FileText, Camera, CalendarDays, Pill } from "lucide-react";
import { notFound } from "next/navigation";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { DownloadReportButton } from "@/components/download-report";
import { ClinicalMediaGallery } from "@/components/media-gallery";
import { DailyNoteSheet } from "@/components/daily-note-sheet";

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

const InfoRow = ({ label, value, fullWidth = false }: { label: string; value: string | number | undefined; fullWidth?: boolean }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-full' : ''}`}>
        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</p>
        <div className={`p-2.5 rounded-lg bg-slate-50 border border-slate-100 min-h-[42px] flex items-center`}>
            <p className="text-sm font-semibold text-slate-700 leading-snug">
                {value || <span className="text-slate-300 font-normal italic">Empty</span>}
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
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Actions - Fully Responsive Stacking */}
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
                        <DailyNoteSheet assessment={assessment}>
                            <Button variant="secondary" size="sm" className="w-full sm:w-auto rounded-xl shadow-md h-11 px-6 font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border-none transition-all active:scale-95">
                                <FileText className="mr-2 h-4 w-4" />
                                Session Note
                            </Button>
                        </DailyNoteSheet>
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
                                            <Activity className="h-3.5 w-3.5" /> 
                                            AGE: {assessment.Age || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 sm:p-5 rounded-2xl border border-slate-100 flex-shrink-0 shadow-sm text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-70">Assessment Date</p>
                                <p className="text-sm font-black text-slate-800 flex items-center justify-end gap-2">
                                    <CalendarDays className="h-4 w-4 text-primary" />
                                    {formatDate(assessment.Date)}
                                </p>
                                {assessment.Timestamp && (
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                                        System Sync: {formatDateTime(assessment.Timestamp).split(' at ')[1]}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Demographics and Core History */}
                    <div className="space-y-6">
                        <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                            <CardContent className="p-5">
                                <SectionHeader title="Patient Profile" icon={User} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    <InfoRow label="Gender" value={assessment.Sex} />
                                    <InfoRow label="Occupation" value={assessment.Occupation} />
                                    <InfoRow label="Phone" value={assessment.PhoneNumber} />
                                    <InfoRow label="Physique" value={`${assessment.Height || '-'} / ${assessment.Weight || '-'}`} />
                                    <InfoRow label="Vitals" value={assessment.BloodPressure} />
                                    <InfoRow label="Diabetes" value={assessment.DiabeticMellitus} />
                                    <InfoRow label="Habits" value={assessment.DietHabit} fullWidth />
                                    <InfoRow label="Sleep" value={assessment.SleepingHistory} />
                                    <InfoRow label="Cycle" value={assessment.MenstruationHistory} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                            <CardContent className="p-5">
                                <SectionHeader title="Clinical History" icon={ClipboardList} />
                                <div className="space-y-4">
                                    <InfoRow label="Chief Complaint" value={assessment.ChiefComplaint} fullWidth />
                                    <InfoRow label="History of Illness" value={assessment.PresentHistory} fullWidth />
                                    <InfoRow label="Past Medical" value={assessment.PastHistory} fullWidth />
                                    <InfoRow label="Findings" value={assessment.DiagnosticImaging} fullWidth />
                                    <InfoRow label="Red Flags" value={assessment.RedFlags} fullWidth />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Middle: Functional Assessment */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                            <CardContent className="p-5">
                                <SectionHeader title="Physical Examination" icon={Activity} />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <InfoRow label="Observation" value={assessment.Observation} fullWidth />
                                    <InfoRow label="Active ROM" value={assessment.ActiveROM} />
                                    <InfoRow label="Passive ROM" value={assessment.PassiveROM} />
                                    <InfoRow label="Muscle Power" value={assessment.MusclePower} />
                                    <InfoRow label="Palpation" value={assessment.Palpation} />
                                    <InfoRow label="Gait" value={assessment.Gait} />
                                    <InfoRow label="Functional" value={assessment.FunctionalTesting} />
                                    <InfoRow label="Add. Comments" value={assessment.Comments} fullWidth />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                                <CardContent className="p-5">
                                    <SectionHeader title="Neurological" icon={Stethoscope} />
                                    <div className="space-y-4">
                                        <InfoRow label="Neuro Mapping" value={assessment.NeurologicalTests} fullWidth />
                                        <InfoRow label="Sensory" value={assessment.Sensation} fullWidth />
                                        <InfoRow label="DTR Reflexes" value={assessment.Reflexes} fullWidth />
                                        <InfoRow label="Special Tests" value={assessment.SpecialTests} fullWidth />
                                        <InfoRow label="Clinical Comments" value={assessment.Comments} fullWidth />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                                <CardContent className="p-5">
                                    <SectionHeader title="Pain Profile" icon={Activity} />
                                    <div className="space-y-4">
                                        <InfoRow label="Pain History" value={assessment.PainHistory} fullWidth />
                                        <InfoRow label="VAS Index (0-10)" value={`${(Number(assessment.PainIntensity_VAS) || 0) / 10}/10`} fullWidth />
                                        <InfoRow label="Description" value={assessment.PainDescription} fullWidth />
                                        <div className="grid grid-cols-2 gap-4">
                                            <InfoRow label="Aggravating" value={assessment.AggravatingFactors} />
                                            <InfoRow label="Easing" value={assessment.EasingFactors} />
                                        </div>
                                        <InfoRow label="Location" value={assessment.SymptomsLocation} fullWidth />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Treatment Section */}
                        <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                            <CardContent className="p-5">
                                <SectionHeader title="Clinical Management" icon={Pill} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <InfoRow label="Problem List" value={assessment['Problem List']} fullWidth />
                                        <InfoRow label="Clinical Diagnosis" value={assessment.Diagnosis} fullWidth />
                                        <InfoRow label="Strategy" value={assessment.TreatmentPlan} fullWidth />
                                        <InfoRow label="Specific advise" value={assessment['Specific advice'] || assessment.WhatTreatment} fullWidth />
                                        <InfoRow label="Education" value={assessment.PatientEducation} fullWidth />
                                        <InfoRow label="Follow-ups" value={assessment.HomeFollowups} fullWidth />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 content-start">
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                                <span className="text-[10px] font-bold text-slate-400">Varmam</span>
                                                <span className="text-xs font-bold text-slate-700">{assessment.VarmamTherapy || '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                                <span className="text-[10px] font-bold text-slate-400">Herbal</span>
                                                <span className="text-xs font-bold text-slate-700">{assessment.HerbalRemedies || '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400">Exercise</span>
                                                <span className="text-xs font-bold text-slate-700">{assessment.ExercisePrescription || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                            <CardContent className="p-5">
                                <SectionHeader title="Clinical Media" icon={Camera} />
                                {(() => {
                                    const allMedia: string[] = [];
                                    const seen = new Set<string>();
                                    const mediaColumns = ['Media1', 'Media2', 'Media3', 'Media4'];
                                    
                                    mediaColumns.forEach(col => {
                                        const value = assessment[col];
                                        if (!value) return;
                                        const valStr = String(value).trim();
                                        if (!seen.has(valStr)) {
                                            allMedia.push(valStr);
                                            seen.add(valStr);
                                        }
                                    });

                                    if (allMedia.length === 0) {
                                        return <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl text-slate-300 text-[11px] font-black uppercase">No Media Files Found</div>;
                                    }

                                    return <ClinicalMediaGallery urls={allMedia} />;
                                })()}
                            </CardContent>
                        </Card>

                        {/* Summary & Daily Note Section */}
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                            <Card className="border-slate-200 shadow-sm rounded-2xl bg-white border-t-2 border-t-primary">
                                <CardContent className="p-5 space-y-6">
                                    <SectionHeader title="Session Notes & Summary" icon={FileText} />
                                    
                                    <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10">
                                        <p className="text-[9px] font-black text-primary tracking-widest mb-2 uppercase">Daily Progress Note</p>
                                        <p className="text-sm font-bold text-slate-800 leading-relaxed italic">
                                            "{assessment.DailyNote || 'No entry recorded for this session.'}"
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <InfoRow label="Review 1" value={assessment.Review1} />
                                        <InfoRow label="Review 2" value={assessment.Review2} />
                                        <InfoRow label="Review 3" value={assessment.Review3} />
                                    </div>
                                    <div className="flex justify-center text-[9px] font-black text-slate-400 pt-6 border-t border-slate-100 uppercase tracking-widest">
                                        <span>Medically Verified Record</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
