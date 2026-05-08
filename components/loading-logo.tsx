export function PremiumLoadingLogo() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in duration-500">
            <div className="relative flex items-center justify-center">
                {/* Outer pulsing ring */}
                <div className="absolute h-32 w-32 rounded-full border-[3px] border-primary/10 border-t-primary animate-spin" style={{ animationDuration: '2s' }} />
                
                {/* Inner counter-spinning ring */}
                <div className="absolute h-24 w-24 rounded-full border-[3px] border-primary/10 border-b-primary animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                
                {/* Inner glowing effect */}
                <div className="absolute h-24 w-24 rounded-full bg-primary/20 animate-pulse blur-2xl" />
                
                {/* The Logo */}
                <div className="relative h-20 w-20 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-[#f4fce3] flex items-center justify-center z-10">
                    <img src="/logo-removebg-preview.png" alt="Loading" className="h-16 w-16 object-contain animate-pulse" style={{ animationDuration: '2s' }} />
                </div>
            </div>
            
            <div className="mt-16 flex flex-col items-center">
                <h3 className="text-slate-800 font-black tracking-[0.3em] text-xs uppercase animate-pulse">Synchronizing Data</h3>
                <div className="flex gap-1.5 mt-4">
                    <div className="h-1.5 w-8 bg-primary/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-full origin-left animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
