import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const payload = {
            PatientName: body.patientName,
            Date: body.date,
            PhoneNumber: body.phoneNumber || "",
            MedicalHistory: body.medicalHistory || "",
            BPSugar: body.bpSugar || "",
            ChiefComplaint: body.chiefComplaint || "",
            Diagnosis: body.diagnosis || "",
            TreatmentDone: body.treatmentDone || "",
            AdviceGiven: body.adviceGiven || "",
            FeesCollected: body.feesCollected || "",
            PaidAmount: body.paidAmount || "",
            PendingAmount: body.pendingAmount || "",
            files: body.files || []
        };

        const response = await fetch(process.env.APPS_SCRIPT_URL!, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
        });

        const result = await response.json();
        
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Failed to submit assessment" }, { status: 500 });
    }
}
