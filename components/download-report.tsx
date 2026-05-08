"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/format-date";

interface ReportProps {
    assessment: any;
    className?: string;
}

export function DownloadReportButton({ assessment, className }: ReportProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    async function generatePDF() {
        setIsGenerating(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 15;

            const addTitle = (text: string) => {
                if (y > 260) { doc.addPage(); y = 15; }
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(21, 128, 61); // Primary green
                doc.text(text, 14, y);
                y += 2;
                doc.setDrawColor(220, 252, 231);
                doc.line(14, y, pageWidth - 14, y);
                y += 6;
            };

            const addField = (label: string, value: string | undefined | null) => {
                if (y > 275) { doc.addPage(); y = 15; }
                const val = value || 'N/A';
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(100, 116, 139);
                doc.text(`${label}:`, 14, y);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 41, 59);
                const lines = doc.splitTextToSize(String(val), pageWidth - 65);
                doc.text(lines, 55, y);
                y += Math.max(lines.length * 5, 6) + 2;
            };

            // Load Logo & Signature
            let logoBase64 = null;
            let sigBase64 = null;
            
            try {
                const logoRes = await fetch('/logo-removebg-preview.png');
                const logoBlob = await logoRes.blob();
                logoBase64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(logoBlob);
                });
                
                const sigRes = await fetch('/Untitled_design-removebg-preview.png');
                const sigBlob = await sigRes.blob();
                sigBase64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(sigBlob);
                });
            } catch (e) {
                console.warn('Failed to load assets', e);
            }

            // ── Header ──
            doc.setFillColor(21, 128, 61);
            doc.rect(0, 0, pageWidth, logoBase64 ? 50 : 40, 'F');
            
            if (logoBase64) {
                doc.setFillColor(255, 255, 255);
                doc.circle(pageWidth / 2, 16, 9, 'F');
                doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 8, 8, 16, 16);
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(15);
                doc.setFont('helvetica', 'bold');
                doc.text('AAFIYA SIDDHA VARMAM CLINIC', pageWidth / 2, 32, { align: 'center' });
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(`Record ID: #${String(assessment.rowIndex || 'NEW').padStart(4, '0')}`, pageWidth / 2, 38, { align: 'center' });
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('CLINICAL SUMMARY & INVOICE', pageWidth / 2, 46, { align: 'center' });
                y = 60;
            } else {
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(15);
                doc.setFont('helvetica', 'bold');
                doc.text('AAFIYA SIDDHA VARMAM CLINIC', pageWidth / 2, 16, { align: 'center' });
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(`Record ID: #${String(assessment.rowIndex || 'NEW').padStart(4, '0')}`, pageWidth / 2, 23, { align: 'center' });
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('CLINICAL SUMMARY & INVOICE', pageWidth / 2, 32, { align: 'center' });
                y = 50;
            }

            // ── Patient Demographics ──
            addTitle('I. PATIENT DETAILS');
            addField('Patient Name', assessment.PatientName);
            addField('Visit Date', formatDate(assessment.Date));
            addField('Mobile Number', assessment.PhoneNumber);
            y += 4;

            // ── Clinical Assessment ──
            addTitle('II. CLINICAL ASSESSMENT');
            addField('Medical History', assessment.MedicalHistory);
            addField('BP / Sugar', assessment.BPSugar);
            addField('Chief Complaint', assessment.ChiefComplaint);
            addField('Diagnosis', assessment.Diagnosis);
            addField('Treatment Done', assessment.TreatmentDone);
            addField('Advice Given', assessment.AdviceGiven);
            y += 4;

            // ── Financial Summary ──
            addTitle('III. FINANCIAL SUMMARY');
            addField('Total Fees Collected', `Rs. ${assessment.FeesCollected || '0'}`);
            addField('Paid Amount', `Rs. ${assessment.PaidAmount || '0'}`);
            
            // Highlight pending amount if it exists
            const pending = Number(assessment.PendingAmount || 0);
            if (pending > 0) {
                doc.setTextColor(220, 38, 38); // Red text for pending
            }
            addField('Pending Amount', `Rs. ${assessment.PendingAmount || '0'}`);
            
            // ── Doctor Signature Section ──
            y += 5;
            if (y > 240) { doc.addPage(); y = 20; }
            
            const rightPos = pageWidth - 60;
            if (sigBase64) {
                doc.addImage(sigBase64, 'PNG', rightPos, y, 40, 20);
                y += 18;
            } else {
                y += 20; // Space for signature even if image fails
            }
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('Dr. J. Abdullah MD(S)', rightPos + 20, y, { align: 'center' });
            y += 5;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Consultant', rightPos + 20, y, { align: 'center' });
            y += 15;

            // ── Footer ──
            if (y > 270) { doc.addPage(); y = 15; }
            doc.setDrawColor(21, 128, 61);
            doc.setLineWidth(0.5);
            doc.line(14, y, pageWidth - 14, y);
            y += 10;
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.setFont('helvetica', 'italic');
            doc.text('This is a system-generated clinical and financial record.', pageWidth / 2, y, { align: 'center' });

            // Generate filename and download
            const safeName = (assessment.PatientName || 'patient').toLowerCase().replace(/[^a-z0-9]/g, '_');
            const dateStr = assessment.Date ? String(assessment.Date).split('T')[0] : 'date';
            doc.save(`${safeName}_report_${dateStr}.pdf`);
            
        } catch (error) {
            console.error("PDF Generation failed:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <Button 
            onClick={generatePDF} 
            disabled={isGenerating}
            variant="outline"
            className={`font-bold border-primary/20 text-primary hover:bg-primary/5 transition-all ${className}`}
        >
            <FileDown className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Download Report'}
        </Button>
    );
}
