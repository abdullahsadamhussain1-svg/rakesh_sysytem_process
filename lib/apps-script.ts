const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

export interface AssessmentData {
    rowIndex?: number; // Used for identifying row when editing
    PatientName: string;
    Date: string;
    PhoneNumber: string;
    MedicalHistory?: string;
    BPSugar?: string;
    ChiefComplaint?: string;
    Diagnosis?: string;
    TreatmentDone?: string;
    AdviceGiven?: string;
    FeesCollected?: string;
    PaidAmount?: string;
    PendingAmount?: string;
    Media1?: string;
    Media2?: string;
    Media3?: string;
    Media4?: string;
    Timestamp?: string;
}

export async function getFromGoogleSheet() {
    if (!APPS_SCRIPT_URL) {
        throw new Error("APPS_SCRIPT_URL environment variable is not defined");
    }

    const response = await fetch(APPS_SCRIPT_URL, {
        method: "GET",
        headers: {
            "Accept": "application/json",
        },
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}
