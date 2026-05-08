import { NextResponse } from "next/server";
import { saveToGoogleSheet, getFromGoogleSheet, AssessmentData } from "@/lib/apps-script";

/**
 * POST /api/assessments
 * Handles clinical record creation. 
 * Maps frontend fields to strict Google Sheet column names.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 54-Column Core Clinical Schema Mapping
        const rowData: AssessmentData = {
            // 1-13: Patient Demographics & Basics
            Date: body.date || new Date().toISOString().split('T')[0],
            PatientName: body.name,
            Age: String(body.age),
            Sex: body.sex || "",
            Occupation: body.occupation || "",
            PhoneNumber: body.phoneNumber || "",
            Height: body.height || "",
            Weight: body.weight || "",
            BloodPressure: body.bloodPressure || "",
            DiabeticMellitus: body.diabeticMellitus || "",
            DietHabit: body.dietHabit || "",
            SleepingHistory: body.sleepingHistory || "",
            MenstruationHistory: body.menstruationHistory || "",

            // 14-18: Clinical History
            ChiefComplaint: body.chiefComplaint || "",
            PresentHistory: body.presentHistory || "",
            PastHistory: body.pastHistory || "",
            DiagnosticImaging: body.diagnosticImaging || "",
            RedFlags: body.redFlags || "",

            // 19-30: Physical Examination & Findings
            Observation: body.observation || "",
            ActiveROM: body.activeROM || "",
            PassiveROM: body.passiveROM || "",
            MusclePower: body.musclePower || "",
            Palpation: body.palpation || "",
            Gait: body.gait || "",
            NeurologicalTests: body.neurologicalTests || "",
            Sensation: body.sensation || "",
            Reflexes: body.reflexes || "",
            SpecialTests: body.specialTests || "",
            FunctionalTesting: body.functionalTesting || "",
            Comments: body.comments || "",

            // 31-36: Pain Assessment
            PainHistory: body.painHistory || "",
            AggravatingFactors: body.aggravatingFactors || "",
            EasingFactors: body.easingFactors || "",
            PainDescription: body.painDescription || "",
            PainIntensity_VAS: body.painVas || 0,
            SymptomsLocation: body.symptomsLocation || "",

            // 37-44: Diagnosis & Treatment Plan
            ['Problem List']: body.problemList || "",
            Diagnosis: body.diagnosis || "",
            TreatmentPlan: body.treatmentPlan || "",
            VarmamTherapy: body.manualTherapy || "",
            HerbalRemedies: body.electrotherapy || "",
            ExercisePrescription: body.exercisePrescription || "",
            PatientEducation: body.patientEducation || "",
            HomeFollowups: body.homeFollowups || "",
            ['Specific advice']: body.whatTreatment || "",

            // 45-49: Summary & Reviews
            PatientSummary: body.patientSummary || "",
            Review1: body.review1 || "",
            Review2: body.review2 || "",
            Review3: body.review3 || "",
            DailyNote: body.dailyNote || "",

            // 50-53: Media (Will be handled by Apps Script via the 'files' array)
            Media1: "",
            Media2: "",
            Media3: "",
            Media4: "",

            // 54: Timestamp
            Timestamp: new Intl.DateTimeFormat('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: true, timeZone: 'Asia/Kolkata',
            }).format(new Date()).replace(', ', ', '),

            // Extended metadata for processing
            files: body.files || [],
            action: 'create'
        };

        const result = await saveToGoogleSheet(rowData);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Save Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Persistence failure" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const assessments = await getFromGoogleSheet();
        return NextResponse.json(assessments);
    } catch (error) {
        console.error("Fetch Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Retrieval failure" },
            { status: 500 }
        );
    }
}
