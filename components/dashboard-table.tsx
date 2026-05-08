"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, RefreshCw, Banknote } from "lucide-react";
import { formatDateShort } from "@/lib/format-date";

interface Assessment {
    rowIndex?: number;
    Date: string;
    Timestamp?: string;
    PatientName: string;
    Diagnosis?: string;
    PhoneNumber?: string;
    FeesCollected?: string;
    PendingAmount?: string;
    [key: string]: any;
}

interface DashboardTableProps {
    assessments: Assessment[];
}

export function DashboardTable({ assessments }: DashboardTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.refresh();
        setTimeout(() => setIsRefreshing(false), 800);
    };

    const sortedAssessments = [...assessments].sort((a, b) => {
        const dateA = a.Date ? new Date(a.Date).getTime() : 0;
        const dateB = b.Date ? new Date(b.Date).getTime() : 0;
        return (dateB || 0) - (dateA || 0);
    });

    const filteredAssessments = sortedAssessments.filter((assessment) => {
        const query = searchQuery.toLowerCase();
        return (
            (assessment.PatientName && String(assessment.PatientName).toLowerCase().includes(query)) ||
            (assessment.Diagnosis && String(assessment.Diagnosis).toLowerCase().includes(query)) ||
            (assessment.Date && String(assessment.Date).toLowerCase().includes(query)) ||
            (assessment.PhoneNumber && String(assessment.PhoneNumber).toLowerCase().includes(query))
        );
    });

    const btnClass = "transition-none active:scale-[0.98]";
    const rowClass = "group hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100";

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative flex-1 w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search patient name, diagnosis, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 rounded-xl"
                    />
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="h-10 px-4 rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm active:scale-95 ml-auto"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                    {isRefreshing ? 'Syncing...' : 'Refresh'}
                </Button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="table-fixed w-[1200px]">
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[110px] px-3 font-black text-[11px] uppercase tracking-widest text-slate-800">Date</TableHead>
                                <TableHead className="w-[240px] px-3 font-black text-[11px] uppercase tracking-widest text-slate-800">Patient Details</TableHead>
                                <TableHead className="w-[140px] px-3 text-center font-black text-[11px] uppercase tracking-widest text-slate-800">Contact</TableHead>
                                <TableHead className="w-[250px] px-3 font-black text-[11px] uppercase tracking-widest text-slate-800">Diagnosis</TableHead>
                                <TableHead className="w-[140px] px-3 text-right font-black text-[11px] uppercase tracking-widest text-slate-800">Total Fee</TableHead>
                                <TableHead className="w-[140px] px-3 text-right font-black text-[11px] uppercase tracking-widest text-slate-800">Pending</TableHead>
                                <TableHead className="text-right w-[140px] px-3 pr-8 font-black text-[11px] uppercase tracking-widest text-slate-800">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAssessments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                                        {searchQuery ? "No results found." : "No patient records found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAssessments.map((assessment) => {
                                    const targetId = assessment.rowIndex;
                                    const hasPending = Boolean(assessment.PendingAmount && Number(assessment.PendingAmount) > 0);

                                    return (
                                        <TableRow 
                                            key={`${targetId}-${assessment.Date}`} 
                                            className={rowClass}
                                            onClick={() => router.push(`/assessment/${targetId}`)}
                                        >
                                            <TableCell className="px-3 py-3 w-[110px]">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[11px] font-bold whitespace-nowrap text-slate-700">{formatDateShort(assessment.Date)}</span>
                                                    <span className="text-[9px] text-muted-foreground font-mono">{assessment.Timestamp?.split(', ')[1]}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-3 py-3 w-[240px]">
                                                <div className="w-full flex flex-col gap-0.5 min-w-0">
                                                    <div className="w-full truncate">
                                                        <span className="text-[13px] font-black leading-tight uppercase tracking-tight text-slate-900">
                                                            {assessment.PatientName || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-center w-[140px]">
                                                <span className="text-[11px] text-primary font-black truncate block">
                                                    {assessment.PhoneNumber || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-3 py-3 w-[250px]">
                                                <span className="text-[11px] font-bold text-slate-700 truncate block">
                                                    {assessment.Diagnosis || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-right w-[140px]">
                                                <span className="text-[12px] font-black text-slate-800 truncate block">
                                                    ₹{assessment.FeesCollected || '0'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-right w-[140px]">
                                                <span className={`text-[12px] font-black truncate block ${hasPending ? 'text-red-600 bg-red-50 inline-block px-2 py-0.5 rounded' : 'text-slate-400'}`}>
                                                    {hasPending ? `₹${assessment.PendingAmount}` : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right px-3 pr-8 w-[140px]">
                                                <div className="flex flex-row justify-end gap-2 h-full items-center" onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="outline" size="sm" asChild className={`h-8 rounded-lg text-[10px] font-black px-3 ${btnClass} border-slate-200 active:scale-95 transition-all`}>
                                                        <Link href={`/assessment/${targetId}`} prefetch={true}>VIEW</Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
