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
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Camera, Video, X, Upload, FileVideo, Plus, User, ClipboardList, Activity, Stethoscope, FileText } from "lucide-react";
import { getIndiaDateString } from "@/lib/format-date";
import { sanitizeFormData, validateFileSize, checkDuplicate, compressImage, convertDriveUrl, isVideoUrl, calculatePayloadSize, formatBytes, stripBase64Metadata } from "@/lib/utils-data";
import { getFromGoogleSheet } from "@/lib/apps-script";

const formSchema = z.object({
    // I. Patient Demographics (1-13)
    date: z.string(),
    name: z.string().min(2, "Name is required"),
    age: z.any().optional(),
    sex: z.any().optional(),
    occupation: z.any().optional(),
    phoneNumber: z.any().optional(),
    height: z.any().optional(),
    weight: z.any().optional(),
    bloodPressure: z.any().optional(),
    diabeticMellitus: z.any().optional(),
    dietHabit: z.any().optional(),
    sleepingHistory: z.any().optional(),
    menstruationHistory: z.any().optional(),

    // II. Clinical History (14-18)
    chiefComplaint: z.string().optional(),
    presentHistory: z.string().optional(),
    pastHistory: z.string().optional(),
    diagnosticImaging: z.string().optional(),
    redFlags: z.string().optional(),

    // III. Observation & Physical Examination (19-34)
    observation: z.string().optional(),
    activeROM: z.string().optional(),
    passiveROM: z.string().optional(),
    musclePower: z.string().optional(),
    palpation: z.string().optional(),
    gait: z.string().optional(),
    neurologicalTests: z.string().optional(),
    sensation: z.string().optional(),
    reflexes: z.string().optional(),
    specialTests: z.string().optional(),
    functionalTesting: z.string().optional(),
    comments: z.string().optional(),

    // IV. Pain Assessment (35-40)
    painHistory: z.string().optional(),
    aggravatingFactors: z.string().optional(),
    easingFactors: z.string().optional(),
    painDescription: z.string().optional(),
    painVas: z.number().min(0).max(100),
    symptomsLocation: z.string().optional(),

    // V. Diagnosis & Treatment Plan (41-48)
    problemList: z.string().optional(),
    diagnosis: z.string().optional(),
    treatmentPlan: z.string().optional(),
    manualTherapy: z.string().optional(),
    electrotherapy: z.string().optional(),
    exercisePrescription: z.string().optional(),
    patientEducation: z.string().optional(),
    homeFollowups: z.string().optional(),
    whatTreatment: z.string().optional(),

    // VI. Summary & Follow-up (49-56)
    review1: z.string().optional(),
    review2: z.string().optional(),
    review3: z.string().optional(),
    dailyNote: z.string().optional(),
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

    // Effect to bind stream to video element once it's mounted
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
            name: String(assessment.PatientName || ""),
            age: String(assessment.Age || ""),
            sex: String(assessment.Sex || ""),
            occupation: String(assessment.Occupation || ""),
            phoneNumber: String(assessment.PhoneNumber || ""),
            height: String(assessment.Height || ""),
            weight: String(assessment.Weight || ""),
            bloodPressure: String(assessment.BloodPressure || ""),
            diabeticMellitus: String(assessment.DiabeticMellitus || ""),
            dietHabit: String(assessment.DietHabit || ""),
            sleepingHistory: String(assessment.SleepingHistory || ""),
            menstruationHistory: String(assessment.MenstruationHistory || ""),
            chiefComplaint: String(assessment.ChiefComplaint || ""),
            presentHistory: String(assessment.PresentHistory || ""),
            pastHistory: String(assessment.PastHistory || ""),
            diagnosticImaging: String(assessment.DiagnosticImaging || ""),
            redFlags: String(assessment.RedFlags || ""),
            observation: String(assessment.Observation || ""),
            activeROM: String(assessment.ActiveROM || ""),
            passiveROM: String(assessment.PassiveROM || ""),
            musclePower: String(assessment.MusclePower || ""),
            palpation: String(assessment.Palpation || ""),
            gait: String(assessment.Gait || ""),
            neurologicalTests: String(assessment.NeurologicalTests || ""),
            sensation: String(assessment.Sensation || ""),
            reflexes: String(assessment.Reflexes || ""),
            specialTests: String(assessment.SpecialTests || ""),
            functionalTesting: String(assessment.FunctionalTesting || ""),
            comments: String(assessment.Comments || ""),
            painHistory: String(assessment.PainHistory || ""),
            aggravatingFactors: String(assessment.AggravatingFactors || ""),
            easingFactors: String(assessment.EasingFactors || ""),
            painDescription: String(assessment.PainDescription || ""),
            painVas: Number(assessment.PainIntensity_VAS || 0),
            symptomsLocation: String(assessment.SymptomsLocation || ""),
            problemList: String(assessment['Problem List'] || ""),
            diagnosis: String(assessment.Diagnosis || assessment.diagnosis || ""),
            treatmentPlan: String(assessment.TreatmentPlan || ""),
            manualTherapy: String(assessment.VarmamTherapy || ""),
            electrotherapy: String(assessment.HerbalRemedies || ""),
            exercisePrescription: String(assessment.ExercisePrescription || ""),
            patientEducation: String(assessment.PatientEducation || ""),
            homeFollowups: String(assessment.HomeFollowups || ""),
            whatTreatment: String(assessment['Specific advice'] || assessment.WhatTreatment || ""),
            review1: String(assessment.Review1 || ""),
            review2: String(assessment.Review2 || ""),
            review3: String(assessment.Review3 || ""),
            dailyNote: String(assessment.DailyNote || ""),
        },
    });

    // Fix date format warnings by ensuring YYYY-MM-DD
    const dateValue = form.watch("date");
    useEffect(() => {
        if (dateValue && dateValue.includes('T')) {
            form.setValue("date", dateValue.split('T')[0]);
        }
    }, [dateValue, form]);

    // Extract existing media on mount
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
        console.error('❌ Update Validation Errors:', errors);
        const errorDetails = Object.entries(errors)
            .map(([field, err]: [string, any]) => `• ${field.toUpperCase()}: ${err.message || 'Required field'}`)
            .join("\n");
        alert(`CANNOT UPDATE:\n\n${errorDetails}\n\nPlease check these fields.`);
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        console.log("Saving clinical updates for index:", assessmentIndex);
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

            // Vercel Payload Limit Protection (4.5MB)
            const payloadSize = calculatePayloadSize(payload);
            const MAX_PAYLOAD_SIZE = 4 * 1024 * 1024; // 4MB safety limit
            
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
            console.log("📥 UPDATE RESPONSE:", result);

            if (!response.ok || !result.success || result.data?.success === false) {
                const errorMsg = result.data?.message || result.data?.error || result.error || "Sync update failed (Check Apps Script)";
                throw new Error(errorMsg);
            }

            alert("Assessment updated successfully!");
            router.push(`/assessment/${assessmentIndex}`);
            router.refresh();
        } catch (error) {
            console.error('❌ CRITICAL UPDATE FAILURE:', error);
            const msg = error instanceof Error ? error.message : "Sync failure (check internet)";
            alert(`UPDATE FAILED:\n${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    // Camera & File logic (simplified for readability, keeping same functionality)
    const startCamera = async () => {
        setIsInitializing(true);
        try {
            const constraints = { 
                video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } }, 
                audio: false 
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setActiveStream(stream);
            setIsStreaming(true);
        } catch (err) { 
            console.error("Camera Error:", err);
            alert("Camera not detected or lens permission denied."); 
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
        // Reduced quality for better payload speed
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

        // Auto-stop at 15s to keep payload manageable (Vercel limit)
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1: Core Records */}
                    <div className="space-y-6">
                        <Card className="rounded-2xl shadow-lg border-primary/10 overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b py-4">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Patient Demographics</CardTitle>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => router.push(`/assessment/${assessmentIndex}`)} className="text-slate-400 hover:text-red-500 font-bold transition-colors"><X className="h-4 w-4 mr-1" /> CANCEL</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="date" render={({ field }) => (
                                        <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Patient Name" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="age" render={({ field }) => (
                                        <FormItem><FormLabel>Age</FormLabel><FormControl><Input placeholder="Yrs" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="sex" render={({ field }) => (
                                        <FormItem><FormLabel>Sex</FormLabel><FormControl><Input placeholder="M/F/O" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="occupation" render={({ field }) => (
                                        <FormItem><FormLabel>Occupation</FormLabel><FormControl><Input placeholder="Job" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                                        <FormItem><FormLabel>Contact</FormLabel><FormControl><Input placeholder="Phone" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="height" render={({ field }) => (
                                        <FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input placeholder="cm" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="weight" render={({ field }) => (
                                        <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input placeholder="kg" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="bloodPressure" render={({ field }) => (
                                        <FormItem><FormLabel>BP</FormLabel><FormControl><Input placeholder="120/80" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="diabeticMellitus" render={({ field }) => (
                                        <FormItem><FormLabel>Diabetic Status (Yes/No)</FormLabel><FormControl><Input placeholder="Yes/No" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="dietHabit" render={({ field }) => (
                                    <FormItem><FormLabel>Dietary Habits</FormLabel><FormControl><Input placeholder="Dietary notes" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="sleepingHistory" render={({ field }) => (
                                        <FormItem><FormLabel>Sleep History</FormLabel><FormControl><Input placeholder="Rest patterns" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="menstruationHistory" render={({ field }) => (
                                        <FormItem><FormLabel>Menstruation</FormLabel><FormControl><Input placeholder="History" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-lg border-primary/10 overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b py-4">
                                <CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Clinical History</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <FormField control={form.control} name="chiefComplaint" render={({ field }) => (
                                    <FormItem><FormLabel>Chief Complaint</FormLabel><FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="presentHistory" render={({ field }) => (
                                    <FormItem><FormLabel>History of Present Illness</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="pastHistory" render={({ field }) => (
                                    <FormItem><FormLabel>Past Medical History</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="diagnosticImaging" render={({ field }) => (
                                    <FormItem><FormLabel>Diagnostic Imaging Results</FormLabel><FormControl><Textarea placeholder="MRI, X-Ray, etc." {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="redFlags" render={({ field }) => (
                                    <FormItem><FormLabel>Red Flags / Contraindications</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Column 2: Physical Findings & Plans */}
                    <div className="space-y-6">
                        <Card className="rounded-2xl shadow-lg border-primary/10 overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b py-4">
                                <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Physical Examination</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <FormField control={form.control} name="observation" render={({ field }) => (
                                    <FormItem><FormLabel>Posture & Observation</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="activeROM" render={({ field }) => (
                                        <FormItem><FormLabel>Active ROM</FormLabel><FormControl><Textarea placeholder="Flex101 int. Rot.16..." {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="passiveROM" render={({ field }) => (
                                        <FormItem><FormLabel>Passive ROM</FormLabel><FormControl><Textarea placeholder="End-feel..." {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="palpation" render={({ field }) => (
                                    <FormItem><FormLabel>Palpation (Tenderness/Effusion)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="musclePower" render={({ field }) => (
                                        <FormItem><FormLabel>Muscle Power (MMT)</FormLabel><FormControl><Textarea placeholder="Grade 0-5" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="gait" render={({ field }) => (
                                        <FormItem><FormLabel>Gait Analysis</FormLabel><FormControl><Textarea placeholder="Limp, etc." {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-lg border-primary/10 overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b py-4">
                                <CardTitle className="text-lg flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary" /> Specialized Assessments</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="neurologicalTests" render={({ field }) => (
                                        <FormItem><FormLabel>Neuro Tests</FormLabel><FormControl><Textarea placeholder="Myotomes, etc." {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="sensation" render={({ field }) => (
                                        <FormItem><FormLabel>Sensation</FormLabel><FormControl><Textarea placeholder="Dermatomes" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="reflexes" render={({ field }) => (
                                        <FormItem><FormLabel>Reflexes</FormLabel><FormControl><Textarea placeholder="DTRs" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="specialTests" render={({ field }) => (
                                        <FormItem><FormLabel>Special Tests</FormLabel><FormControl><Textarea placeholder="Orthopedic tests" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="comments" render={({ field }) => (
                                    <FormItem><FormLabel>Clinical Comments</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="rounded-2xl shadow-lg border-primary/10 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b py-4">
                            <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Pain Assessment</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <FormField control={form.control} name="painVas" render={({ field }) => (
                                <FormItem className="space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <FormLabel className="text-primary font-bold">Pain Intensity (VAS)</FormLabel>
                                        <Badge variant="secondary" className="px-3 py-1 text-lg font-black bg-primary/10 text-primary border-primary/20">{field.value / 10}</Badge>
                                    </div>
                                    <FormControl>
                                        <Slider min={0} max={100} step={1} value={[field.value]} onValueChange={(val) => field.onChange(val[0])} className="py-4" />
                                    </FormControl>
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-black px-1"><span>NO PAIN</span><span>MODERATE</span><span>SEVERE</span></div>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="painHistory" render={({ field }) => (
                                <FormItem><FormLabel>Pain History</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="painDescription" render={({ field }) => (
                                <FormItem><FormLabel>Pain Description</FormLabel><FormControl><Textarea placeholder="Burning, Sharp, etc." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="symptomsLocation" render={({ field }) => (
                                <FormItem><FormLabel>Symptoms Location</FormLabel><FormControl><Textarea placeholder="Left leg, etc." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="space-y-4">
                                <FormField control={form.control} name="aggravatingFactors" render={({ field }) => (
                                    <FormItem><FormLabel>Aggravating</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="easingFactors" render={({ field }) => (
                                    <FormItem><FormLabel>Easing</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="rounded-2xl shadow-lg border-primary/10 overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b py-4">
                                <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Treatment Plan</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <FormField control={form.control} name="problemList" render={({ field }) => (
                                    <FormItem><FormLabel>Problem List</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="diagnosis" render={({ field }) => (
                                    <FormItem><FormLabel>Clinical Diagnosis</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="treatmentPlan" render={({ field }) => (
                                    <FormItem><FormLabel>Treatment Strategy</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="space-y-4">
                                    <FormField control={form.control} name="manualTherapy" render={({ field }) => (
                                        <FormItem><FormLabel>Varmam Therapy</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="electrotherapy" render={({ field }) => (
                                        <FormItem><FormLabel>Thokkanam / Herbal Remedies</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="exercisePrescription" render={({ field }) => (
                                    <FormItem><FormLabel>Exercise Prescription</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="space-y-4">
                                    <FormField control={form.control} name="patientEducation" render={({ field }) => (
                                        <FormItem><FormLabel>Education</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="homeFollowups" render={({ field }) => (
                                        <FormItem><FormLabel>Follow-ups</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="whatTreatment" render={({ field }) => (
                                    <FormItem><FormLabel>Specific advise</FormLabel><FormControl><Textarea placeholder="Modalities used today" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-lg border-primary/10 overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b py-4">
                                <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Summary & Reviews</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <FormField control={form.control} name="dailyNote" render={({ field }) => (
                                    <FormItem><FormLabel className="text-primary font-bold">Daily Consultation Note</FormLabel><FormControl><Textarea className="min-h-[120px] bg-white" placeholder="Progress notes for today..." {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="space-y-4">
                                    <FormField control={form.control} name="review1" render={({ field }) => (
                                        <FormItem><FormLabel>Review 1</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="review2" render={({ field }) => (
                                        <FormItem><FormLabel>Review 2</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="review3" render={({ field }) => (
                                        <FormItem><FormLabel>Review 3</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Card className="overflow-hidden border-2 border-primary/10 bg-muted/5 rounded-3xl">
                    <CardHeader className="bg-primary/5 flex flex-row items-center justify-between py-5 border-b">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-inner"><Camera className="h-5 w-5 text-primary" /></div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Clinical Media Evidence</CardTitle>
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
                                        <p className="text-white/40 text-sm mb-10 font-medium leading-relaxed">Activate camera to document physical indicators, postural alignment, or ROM limitations.</p>
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
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Button type="button" variant="destructive" size="icon" onClick={() => removeExisting(index)} className="h-8 w-8 rounded-full shadow-lg"><X className="h-4 w-4" /></Button></div>
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
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Button type="button" variant="destructive" size="icon" onClick={() => removeFile(index)} className="h-8 w-8 rounded-full shadow-lg"><X className="h-4 w-4" /></Button></div>
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
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-14 px-10 rounded-2xl font-black tracking-widest shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 min-w-[220px]">
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
