import { NextResponse } from 'next/server';
import { getFromGoogleSheet } from '@/lib/apps-script';

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = Number(params.id);
        const body = await request.json();

        // 1. Fetch current data to get the rowIndex
        const assessments = await getFromGoogleSheet();
        const existingRow = assessments[id];

        if (!existingRow) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        // 2. Build update payload combining new data with existing values where not provided
        const payload = {
            action: 'update',
            rowIndex: existingRow.rowIndex + 2, // Must be +2 because row 1 is headers and rowIndex is 0-indexed
            PatientName: body.patientName ?? existingRow.PatientName,
            Date: body.date ?? existingRow.Date,
            PhoneNumber: body.phoneNumber ?? existingRow.PhoneNumber ?? "",
            MedicalHistory: body.medicalHistory ?? existingRow.MedicalHistory ?? "",
            BPSugar: body.bpSugar ?? existingRow.BPSugar ?? "",
            ChiefComplaint: body.chiefComplaint ?? existingRow.ChiefComplaint ?? "",
            Diagnosis: body.diagnosis ?? existingRow.Diagnosis ?? "",
            TreatmentDone: body.treatmentDone ?? existingRow.TreatmentDone ?? "",
            AdviceGiven: body.adviceGiven ?? existingRow.AdviceGiven ?? "",
            FeesCollected: body.feesCollected ?? existingRow.FeesCollected ?? "",
            PaidAmount: body.paidAmount ?? existingRow.PaidAmount ?? "",
            PendingAmount: body.pendingAmount ?? existingRow.PendingAmount ?? "",
            existingMedia: body.existingMedia || [],
            files: body.files || [] // Only send new files, Apps Script preserves old ones if blank
        };

        // 3. Send update to Apps Script
        const response = await fetch(process.env.APPS_SCRIPT_URL!, {
            method: 'POST', // Apps Script handles updates via POST with action='update'
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
        });

        const result = await response.json();
        
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        const { revalidatePath } = require('next/cache');
        revalidatePath('/', 'layout');

        return NextResponse.json(result);
    } catch (error) {
        console.error("API Update Error:", error);
        return NextResponse.json({ error: "Failed to update assessment" }, { status: 500 });
    }
}
