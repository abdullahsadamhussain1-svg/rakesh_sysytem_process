"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, Video, X, Upload, FileVideo, Plus, User, ClipboardList, Banknote, Activity } from "lucide-react";
import { getIndiaDateString } from "@/lib/format-date";
import { sanitizeFormData, validateFileSize, compressImage, convertDriveUrl, isVideoUrl, calculatePayloadSize, formatBytes, stripBase64Metadata } from "@/lib/utils-data";

const formSchema = z.object({
    date: z.string(),
    patientName: z.string().min(2, "Name is required"),
    phoneNumber: z.string().optional(),
    medicalHistory: z.string().optional(),
    bpSugar: z.string().optional(),
    chiefComplaint: z.string().optional(),
    diagnosis: z.string().optional(),
    treatmentDone: z.string().optional(),
    adviceGiven: z.string().optional(),
    feesCollected: z.string().optional(),
    paidAmount: z.string().optional(),
    pendingAmount: z.string().optional()
});

interface EditFormProps {
    assessment: any;
    assessmentIndex: number;
}

export function EditAssessmentForm({ assessment, assessmentIndex }: EditFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Media upload state
    const [mediaFiles, setMediaFiles] = useState<{ file: File; base64: string; type: 'image' | 'video' }[]>([]);
    const [existingMedia, setExistingMedia] = useState<string[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
    const [isInitializing, setIsInitializing] = useState(false);
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeStream && videoRef.current) {
            videoRef.current.srcObject = activeStream;
            videoRef.current.play().catch(e => console.error("Camera playback failed:", e));
        }
    }, [activeStream]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: getIndiaDateString(assessment.Date),
            patientName: String(assessment.PatientName || ""),
            phoneNumber: String(assessment.PhoneNumber || ""),
            medicalHistory: String(assessment.MedicalHistory || ""),
            bpSugar: String(assessment.BPSugar || ""),
            chiefComplaint: String(assessment.ChiefComplaint || ""),
            diagnosis: String(assessment.Diagnosis || ""),
            treatmentDone: String(assessment.TreatmentDone || ""),
            adviceGiven: String(assessment.AdviceGiven || ""),
            feesCollected: String(assessment.FeesCollected || ""),
            paidAmount: String(assessment.PaidAmount || ""),
            pendingAmount: String(assessment.PendingAmount || "")
        },
    });

    const dateValue = form.watch("date");
    useEffect(() => {
        if (dateValue && dateValue.includes('T')) {
            form.setValue("date", dateValue.split('T')[0]);
        }
    }, [dateValue, form]);

    useEffect(() => {
        const media: string[] = [];
        const mediaCols = ['Media1', 'Media2', 'Media3', 'Media4'];
        const seen = new Set<string>();
        
        mediaCols.forEach(col => {
            const val = assessment[col];
            if (val && !seen.has(val)) {
                media.push(val);
                seen.add(val);
            }
        });
        setExistingMedia(media);
    }, [assessment]);

    function onInvalid(errors: any) {
        alert("Please fill in the required Patient Name field.");
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const sanitizedValues = sanitizeFormData(values);
            
            const payload = {
                ...sanitizedValues,
                existingMedia,
                files: mediaFiles.map(m => ({
                    name: `clinical_media_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${m.type === 'video' ? 'webm' : 'jpg'}`,
                    type: m.type === 'video' ? 'video/webm' : 'image/jpeg',
                    data: stripBase64Metadata(m.base64)
                })),
                action: 'update',
                rowIndex: assessmentIndex + 2
            };

            const payloadSize = calculatePayloadSize(payload);
            const MAX_PAYLOAD_SIZE = 4 * 1024 * 1024; 
            
            if (payloadSize > MAX_PAYLOAD_SIZE) {
                alert(`Update failed: Total size ${formatBytes(payloadSize)} exceeds 4MB limit. Please remove some photos or record a shorter video.`);
                setIsSubmitting(false);
                return;
            }

            const response = await fetch(`/api/assessments/${assessmentIndex}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Sync update failed");
            }

            alert("Assessment updated successfully!");
            router.push(`/assessment/${assessmentIndex}`);
            router.refresh();
        } catch (error) {
            console.error('UPDATE FAILURE:', error);
            const msg = error instanceof Error ? error.message : "Sync failure (check internet)";
            alert(`UPDATE FAILED:\n${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    const startCamera = async () => {
        setIsInitializing(true);
        try {
            const constraints = { video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setActiveStream(stream);
            setIsStreaming(true);
        } catch (err) { 
            alert("Camera not detected or permission denied."); 
        } finally {
            setIsInitializing(false);
        }
    };

    const stopCamera = () => {
        if (activeStream) {
            activeStream.getTracks().forEach(t => t.stop());
            setActiveStream(null);
        }
        setIsStreaming(false);
    };

    const toggleCamera = () => {
        setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
        if (isStreaming) { stopCamera(); setTimeout(startCamera, 150); }
    };

    const takePhoto = () => {
        if (!videoRef.current || mediaFiles.length >= 4) return;
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL("image/jpeg", 0.6);
        setMediaFiles(prev => [...prev.slice(0, 3), { file: new File([], "cam.jpg"), base64, type: 'image' }]);
    };

    const startRecording = () => {
        if (!videoRef.current?.srcObject || mediaFiles.length >= 4) return;
        chunksRef.current = [];
        const recorder = new MediaRecorder(videoRef.current.srcObject as MediaStream, { mimeType: 'video/webm' });
        recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
        recorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaFiles(prev => [...prev.slice(0, 3), { file: new File([], "vid.webm"), base64: reader.result as string, type: 'video' }]);
            };
            reader.readAsDataURL(blob);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);

        setTimeout(() => {
            if (mediaRecorderRef.current?.state === "recording") {
                stopRecording();
            }
        }, 15000);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
            if (mediaFiles.length >= 4) break;
            const validation = validateFileSize(file);
            if (!validation.valid) {
                alert(validation.error);
                continue;
            }

            if (file.type.startsWith('image/')) {
                const { base64 } = await compressImage(file);
                setMediaFiles(prev => [...prev.slice(0, 3), { file, base64, type: 'image' }]);
            } else {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setMediaFiles(prev => [...prev.slice(0, 3), { file, base64: reader.result as string, type: 'video' }]);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const removeFile = (i: number) => setMediaFiles(prev => prev.filter((_, idx) => idx !== i));
    const removeExisting = (i: number) => setExistingMedia(prev => prev.filter((_, idx) => idx !== i));

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                
                <Card className="rounded-2xl shadow-lg border-primary/10 overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b py-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Patient Details</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField control={form.control} name="date" render={({ field }) => (
                                <FormItem><FormLabel>Visit Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="patientName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1">Patient Name/ID <span className="text-red-500 font-bold">*</span></FormLabel>
                                    <FormControl><Input placeholder="Name or ID" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                                <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input placeholder="Phone Number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-lg border-primary/10 overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b py-4">
                        <CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Clinical Assessment</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="medicalHistory" render={({ field }) => (
                                <FormItem><FormLabel>Medical History</FormLabel><FormControl><Textarea className="min-h-[80px]" placeholder="Past medical history..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="bpSugar" render={({ field }) => (
                                <FormItem><FormLabel>BP / Sugar</FormLabel><FormControl><Textarea className="min-h-[80px]" placeholder="e.g. BP 120/80, Sugar 110" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="chiefComplaint" render={({ field }) => (
                            <FormItem><FormLabel>Chief Complaint</FormLabel><FormControl><Textarea placeholder="Main issue..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="diagnosis" render={({ field }) => (
                            <FormItem><FormLabel>Diagnosis</FormLabel><FormControl><Textarea placeholder="Clinical diagnosis" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="treatmentDone" render={({ field }) => (
                            <FormItem><FormLabel>Treatment Done</FormLabel><FormControl><Textarea placeholder="Details of treatment provided today..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="adviceGiven" render={({ field }) => (
                            <FormItem><FormLabel>Advice Given</FormLabel><FormControl><Textarea placeholder="Home care or lifestyle advice" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-lg border-primary/10 overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b py-4">
                        <CardTitle className="text-lg flex items-center gap-2"><Banknote className="h-5 w-5 text-primary" /> Billing Information</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <FormField control={form.control} name="feesCollected" render={({ field }) => (
                                <FormItem><FormLabel>Total Fees Collected (₹)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="paidAmount" render={({ field }) => (
                                <FormItem><FormLabel>Paid Amount (₹)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="pendingAmount" render={({ field }) => (
                                <FormItem><FormLabel>Pending Amount (₹)</FormLabel><FormControl><Input type="number" placeholder="0" className="border-red-200 focus-visible:ring-red-500" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 border-primary/10 bg-muted/5 rounded-3xl">
                    <CardHeader className="bg-primary/5 flex flex-row items-center justify-between py-5 border-b">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-inner"><Camera className="h-5 w-5 text-primary" /></div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Clinical Evidence Capture</CardTitle>
                                <p className="text-xs text-muted-foreground font-medium">Add up to 4 clinical status captures</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs h-10 rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-slate-100 transition-all active:scale-[0.98] font-bold">
                                <Upload className="h-4 w-4 mr-2" /> Import Files
                            </Button>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" multiple onChange={handleFileChange} />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col lg:flex-row min-h-[500px]">
                            <div className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden min-h-[450px]">
                                {isInitializing && (
                                    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center gap-4">
                                        <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                        <p className="text-white text-[10px] font-black tracking-[0.2em] uppercase opacity-60">Initializing Optics...</p>
                                    </div>
                                )}
                                {isStreaming ? (
                                    <>
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                                        <div className="absolute top-6 left-6 flex gap-3">
                                            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-2xl">
                                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                                                <span className="text-[10px] text-white font-black tracking-widest uppercase">LIVE FEED</span>
                                            </div>
                                            {isRecording && (
                                                <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full border border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                                                    <div className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
                                                    <span className="text-[10px] text-white font-black tracking-widest uppercase">CAPTURING MOTION</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-6 right-6 flex gap-3">
                                            <Button type="button" variant="outline" size="icon" className="h-10 w-10 bg-black/60 backdrop-blur-md border-white/20 text-white hover:bg-white hover:text-black rounded-full transition-all active:scale-[0.98]" onClick={toggleCamera} title="Toggle Camera Side"><Plus className="h-5 w-5 rotate-45" /></Button>
                                            <Button type="button" variant="outline" size="icon" className="h-10 w-10 bg-black/60 backdrop-blur-md border-white/20 text-white hover:bg-white hover:text-black rounded-full transition-all active:scale-[0.98]" onClick={stopCamera} title="Close Camera Feed">
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                        <div className="absolute inset-x-0 bottom-8 flex justify-center items-center gap-8 px-4">
                                            <div className="flex flex-col items-center gap-2 group">
                                                <Button type="button" size="lg" className="h-20 w-20 rounded-full bg-white text-primary border-[6px] border-primary/10 shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center p-0" onClick={takePhoto} disabled={(mediaFiles.length + existingMedia.length) >= 4}><Camera className="h-8 w-8" /></Button>
                                                <span className="text-[10px] text-white font-black tracking-tighter drop-shadow-lg scale-90 group-hover:scale-100 transition-transform">STILL PHOTO</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 group">
                                                {!isRecording ? (
                                                    <Button type="button" size="lg" className="h-20 w-20 rounded-full bg-red-600 text-white border-[6px] border-red-200/20 shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center p-0" onClick={startRecording} disabled={(mediaFiles.length + existingMedia.length) >= 4}><Video className="h-8 w-8" /></Button>
                                                ) : (
                                                    <Button type="button" size="lg" className="h-20 w-20 rounded-full bg-red-600 animate-pulse text-white border-[6px] border-white shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center p-0" onClick={stopRecording}><div className="h-7 w-7 rounded-sm bg-white" /></Button>
                                                )}
                                                <span className="text-[10px] text-white font-black tracking-tighter drop-shadow-lg scale-90 group-hover:scale-100 transition-transform uppercase">{isRecording ? "Finish Motion" : "Motion Capture"}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-12 max-w-sm">
                                        <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8 shadow-inner border border-primary/5"><Camera className="h-10 w-10 text-primary/40" /></div>
                                        <h4 className="text-white text-xl font-black mb-3 tracking-tight">Ready for Evidence</h4>
                                        <p className="text-white/40 text-sm mb-10 font-medium leading-relaxed">Activate camera to document physical indicators or treatments.</p>
                                        <Button type="button" onClick={startCamera} className="w-full h-14 rounded-2xl text-sm font-black tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98]">INITIALIZE CLINICAL OPTICS</Button>
                                    </div>
                                )}
                            </div>
                            <div className="w-full lg:w-[350px] bg-white p-6 border-l shadow-2xl z-10">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3 mb-6">Database Evidence Storage <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-500" style={{ width: `${((mediaFiles.length + existingMedia.length) / 4) * 100}%` }}></div></div></h3>
                                <div className="space-y-6">
                                    {existingMedia.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400">STORED IN CLOUD ({existingMedia.length})</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {existingMedia.map((url, index) => (
                                                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border shadow-sm group bg-slate-100">
                                                        {isVideoUrl(url) ? (
                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-1"><FileVideo className="h-6 w-6 text-primary/40" /><span className="text-[8px] font-bold text-slate-400">VIDEO</span></div>
                                                        ) : (
                                                            <img src={convertDriveUrl(url)} className="w-full h-full object-cover" />
                                                        )}
                                                        <div className="absolute top-2 right-2 z-10"><Button type="button" variant="destructive" size="icon" onClick={() => removeExisting(index)} className="h-6 w-6 rounded-full shadow-lg"><X className="h-3 w-3" /></Button></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-primary">NEW TO BE UPLOADED ({mediaFiles.length})</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {mediaFiles.map((mf, index) => (
                                                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md group bg-black animate-in fade-in zoom-in duration-300">
                                                    {mf.type === 'image' ? ( <img src={mf.base64} className="w-full h-full object-cover" /> ) : ( <div className="w-full h-full flex flex-col items-center justify-center gap-2"><FileVideo className="h-8 w-8 text-primary" /><span className="text-[8px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded uppercase">NEW VIDEO</span></div> )}
                                                    <div className="absolute top-2 right-2 z-10"><Button type="button" variant="destructive" size="icon" onClick={() => removeFile(index)} className="h-6 w-6 rounded-full shadow-lg"><X className="h-3 w-3" /></Button></div>
                                                </div>
                                            ))}
                                            {[...Array(Math.max(0, 4 - mediaFiles.length - existingMedia.length))].map((_, i) => (
                                                <div key={i} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50/50 group hover:border-primary/30 transition-colors"><div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform"><Plus className="h-4 w-4 text-slate-300 group-hover:text-primary/50" /></div></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-10 p-5 bg-primary/5 rounded-3xl border border-primary/10 shadow-inner">
                                    <p className="text-[10px] leading-relaxed text-slate-500 font-bold uppercase tracking-tight"><span className="text-primary tracking-widest">Storage Protocol:</span> Clinically encrypted media is streamed directly to the practice's private Google Cloud Workspace. Legacy images are preserved unless manually purged from this view.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 sm:p-6 rounded-3xl shadow-xl border border-slate-100">
                    <Button type="button" variant="ghost" asChild className="w-full sm:w-auto rounded-xl h-12 px-6 font-bold text-slate-400 hover:text-slate-900 transition-all active:scale-[0.98] order-2 sm:order-1"><Link href={`/assessment/${assessmentIndex}`}><ArrowLeft className="h-4 w-4 mr-2" /> Discard Changes</Link></Button>
                    <div className="flex w-full sm:w-auto gap-4 order-1 sm:order-2">
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-slate-900 text-white hover:bg-black font-black tracking-widest shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 min-w-[220px]">
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 animate-pulse" />
                                    SYNCHRONIZING...
                                </span>
                            ) : "PUSH UPDATES TO CLOUD"}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}
