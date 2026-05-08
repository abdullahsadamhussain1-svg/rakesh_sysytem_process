// Google Apps Script integration
const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL;

// Timeout constants (Google Apps Script can hang)
const GET_TIMEOUT_MS = 15000;  // 15 seconds for reads
const POST_TIMEOUT_MS = 30000; // 30 seconds for writes (media uploads can be large)

/**
 * AssessmentData interface strictly follows the 65-column structure 
 * specified by the user to ensure 1:1 mapping with Google Sheets.
 */
export interface AssessmentData {
    // 1-13: Patient Demographics & Basics
    Date: string;
    PatientName: string;
    Age: string;
    Sex?: string;
    Occupation?: string;
    PhoneNumber?: string;
    Height?: string;
    Weight?: string;
    BloodPressure?: string;
    DiabeticMellitus?: string;
    DietHabit?: string;
    SleepingHistory?: string;
    MenstruationHistory?: string;

    // 14-18: Clinical History
    ChiefComplaint?: string;
    PresentHistory?: string;
    PastHistory?: string;
    DiagnosticImaging?: string;
    RedFlags?: string;

    // 19-30: Physical Examination & Findings
    Observation?: string;
    ActiveROM?: string;
    PassiveROM?: string;
    MusclePower?: string;
    Palpation?: string;
    Gait?: string;
    NeurologicalTests?: string;
    Sensation?: string;
    Reflexes?: string;
    SpecialTests?: string;
    FunctionalTesting?: string;
    Comments?: string;

    // 31-36: Pain Assessment
    PainHistory?: string;
    AggravatingFactors?: string;
    EasingFactors?: string;
    PainDescription?: string;
    PainIntensity_VAS?: number | string;
    SymptomsLocation?: string;

    // 37-44: Treatment Strategy
    ['Problem List']?: string;
    Diagnosis?: string;
    TreatmentPlan?: string;
    VarmamTherapy?: string;
    HerbalRemedies?: string;
    ExercisePrescription?: string;
    PatientEducation?: string;
    HomeFollowups?: string;
    ['Specific advice']?: string;

    // 45-49: Summaries & Reviews
    Review1?: string;
    Review2?: string;
    Review3?: string;
    DailyNote?: string;

    // 50-53: Media Suite
    Media1?: string;
    Media2?: string;
    Media3?: string;
    Media4?: string;

    // 54: System Data
    Timestamp?: string;

    // System/Helper fields (not in Sheets columns)
    files?: {
        name: string;
        type: string;
        data: string; // base64
    }[];
    action?: 'create' | 'update';
    rowIndex?: number;
    id?: number | string; // Used for UI identification
    [key: string]: any;
}

export async function saveToGoogleSheet(data: AssessmentData) {
    if (!APPS_SCRIPT_URL) {
        throw new Error('NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL is not configured.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            redirect: 'follow',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const text = await response.text();

        if (!response.ok) {
            throw new Error(`Failed to save (HTTP ${response.status})`);
        }

        try {
            return JSON.parse(text);
        } catch (parseErr) {
            console.error('Non-JSON response:', text.substring(0, 300));
            throw new Error('Invalid server response format.');
        }
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error) throw error;
        throw new Error('Connection error.');
    }
}

export async function getFromGoogleSheet() {
    if (!APPS_SCRIPT_URL) {
        throw new Error('NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL is not configured.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GET_TIMEOUT_MS);

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            cache: 'no-store',
        });

        clearTimeout(timeoutId);
        const text = await response.text();

        if (!response.ok) {
            throw new Error(`Failed to fetch (HTTP ${response.status})`);
        }

        let result;
        try {
            result = JSON.parse(text);
        } catch {
            throw new Error('Invalid JSON format from server.');
        }

        if (Array.isArray(result)) {
            return result.map((item, index) => ({
                ...item,
                id: index
            }));
        }

        if (result && typeof result === 'object' && Array.isArray(result.data)) {
            return result.data.map((item: any, index: number) => ({
                ...item,
                id: index
            }));
        }

        return [];
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error) throw error;
        throw new Error('Data retrieval error.');
    }
}
