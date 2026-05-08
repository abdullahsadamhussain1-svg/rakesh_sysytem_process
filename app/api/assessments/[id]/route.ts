import { NextResponse } from "next/server";
import { getFromGoogleSheet, saveToGoogleSheet, AssessmentData } from "@/lib/apps-script";

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

/**
 * PUT /api/assessments/[id]
 * Handles record updates. 
 * Implements "Merge & Preserve" strategy for the 65 clinical columns.
 */
export async function PUT(request: Request, context: RouteParams) {
    try {
        const params = await context.params;
        const assessmentIndex = Number(params.id);
        const body = await request.json();

        // Fetch state to merge
        const assessments = await getFromGoogleSheet();

        if (isNaN(assessmentIndex) || assessmentIndex < 0 || assessmentIndex >= assessments.length) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        const existingRow = assessments[assessmentIndex];
        const existingMedia: string[] = body.existingMedia || [];

        // 65-Column Mapping Strategy (UPDATE PHASE - Merge & Preserve)
        const updateData: AssessmentData = {
            // 1-13: Patient Basics
            Date: body.date ?? existingRow.Date,
            PatientName: body.name ?? existingRow.PatientName,
            Age: body.age ?? existingRow.Age,
            Sex: body.sex ?? existingRow.Sex ?? "",
            Occupation: body.occupation ?? existingRow.Occupation ?? "",
            PhoneNumber: body.phoneNumber ?? existingRow.PhoneNumber ?? "",
            Height: body.height ?? existingRow.Height ?? "",
            Weight: body.weight ?? existingRow.Weight ?? "",
            BloodPressure: body.bloodPressure ?? existingRow.BloodPressure ?? "",
            DiabeticMellitus: body.diabeticMellitus ?? existingRow.DiabeticMellitus ?? "",
            DietHabit: body.dietHabit ?? existingRow.DietHabit ?? "",
            SleepingHistory: body.sleepingHistory ?? existingRow.SleepingHistory ?? "",
            MenstruationHistory: body.menstruationHistory ?? existingRow.MenstruationHistory ?? "",

            // 14-18: Clinical History
            ChiefComplaint: body.chiefComplaint ?? existingRow.ChiefComplaint ?? "",
            PresentHistory: body.presentHistory ?? existingRow.PresentHistory ?? "",
            PastHistory: body.pastHistory ?? existingRow.PastHistory ?? "",
            DiagnosticImaging: body.diagnosticImaging ?? existingRow.DiagnosticImaging ?? "",
            RedFlags: body.redFlags ?? existingRow.RedFlags ?? "",

            // 19-30: Physical Exam & Comments
            Observation: body.observation ?? existingRow.Observation ?? "",
            ActiveROM: body.activeROM ?? existingRow.ActiveROM ?? "",
            PassiveROM: body.passiveROM ?? existingRow.PassiveROM ?? "",
            MusclePower: body.musclePower ?? existingRow.MusclePower ?? "",
            Palpation: body.palpation ?? existingRow.Palpation ?? "",
            Gait: body.gait ?? existingRow.Gait ?? "",
            NeurologicalTests: body.neurologicalTests ?? existingRow.NeurologicalTests ?? "",
            Sensation: body.sensation ?? existingRow.Sensation ?? "",
            Reflexes: body.reflexes ?? existingRow.Reflexes ?? "",
            SpecialTests: body.specialTests ?? existingRow.SpecialTests ?? "",
            FunctionalTesting: body.functionalTesting ?? existingRow.FunctionalTesting ?? "",
            Comments: body.comments ?? existingRow.Comments ?? "",

            // 31-36: Pain Profile
            PainHistory: body.painHistory ?? existingRow.PainHistory ?? "",
            AggravatingFactors: body.aggravatingFactors ?? existingRow.AggravatingFactors ?? "",
            EasingFactors: body.easingFactors ?? existingRow.EasingFactors ?? "",
            PainDescription: body.painDescription ?? existingRow.PainDescription ?? "",
            PainIntensity_VAS: body.painVas ?? existingRow.PainIntensity_VAS ?? 0,
            SymptomsLocation: body.symptomsLocation ?? existingRow.SymptomsLocation ?? "",

            // 37-44: Treatment Strategy
            ['Problem List']: body.problemList ?? existingRow['Problem List'] ?? "",
            Diagnosis: body.diagnosis ?? existingRow.Diagnosis ?? "",
            TreatmentPlan: body.treatmentPlan ?? existingRow.TreatmentPlan ?? "",
            VarmamTherapy: body.manualTherapy ?? existingRow.VarmamTherapy ?? "",
            HerbalRemedies: body.electrotherapy ?? existingRow.HerbalRemedies ?? "",
            ExercisePrescription: body.exercisePrescription ?? existingRow.ExercisePrescription ?? "",
            PatientEducation: body.patientEducation ?? existingRow.PatientEducation ?? "" ,
            HomeFollowups: body.homeFollowups ?? existingRow.HomeFollowups ?? "",
            ['Specific advice']: body.whatTreatment ?? existingRow['Specific advice'] ?? "",

            // 45-49: Summaries & Notes
            Review1: body.review1 ?? existingRow.Review1 ?? "",
            Review2: body.review2 ?? existingRow.Review2 ?? "",
            Review3: body.review3 ?? existingRow.Review3 ?? "",
            DailyNote: body.dailyNote ?? existingRow.DailyNote ?? "",

            // 50-53: Media Preservation
            Media1: existingMedia.length > 0 ? existingMedia[0] : (existingRow.Media1 || ""),
            Media2: existingMedia.length > 1 ? existingMedia[1] : (existingRow.Media2 || ""),
            Media3: existingMedia.length > 2 ? existingMedia[2] : (existingRow.Media3 || ""),
            Media4: existingMedia.length > 3 ? existingMedia[3] : (existingRow.Media4 || ""),

            // 54: Timestamp Management
            Timestamp: new Intl.DateTimeFormat('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: true, timeZone: 'Asia/Kolkata'
            }).format(new Date()).replace(', ', ', '),

            // System Identification (Strategic Row Addressing)
            id: assessmentIndex,
            rowIndex: assessmentIndex + 2, // Map array index to 1-based sheet row (Header is Row 1)
            action: 'update'
        };

        const payload: AssessmentData = { ...updateData };
        if (body.files && body.files.length > 0) {
            payload.files = body.files;
        }

        const result = await saveToGoogleSheet(payload);
        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Sync failure" },
            { status: 500 }
        );
    }
}
