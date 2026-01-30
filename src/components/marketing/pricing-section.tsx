import { Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const plans = [
    {
        name: "VIP",
        id: "vip-7d",
        price: "Rp 19.000",
        period: "per 7 hari",
        description: "Akses cloud phone harian untuk task ringan.",
        features: [
            "8 Core CPU / 64 BIT",
            "ALL VERSI ANDROID",
            "4G RAM / 64G ROM",
            "Qualcomm Processor",
        ],
        cta: "Order VIP 7D",
        featured: false,
        badge: "Hemat",
    },
    {
        name: "VIP",
        id: "vip-30d",
        price: "Rp 60.000",
        period: "per 30 hari",
        description: "Versi standar yang stabil untuk penggunaan bulanan.",
        features: [
            "8 Core CPU / 64 BIT",
            "ALL VERSI ANDROID",
            "4G RAM / 64G ROM",
            "Qualcomm Processor",
        ],
        cta: "Order VIP 30D",
        featured: false,
        badge: "Terlaris",
    },
    {
        name: "KVIP",
        id: "kvip-7d",
        price: "Rp 34.000",
        period: "per 7 hari",
        description: "Performa flagship untuk gaming durasi pendek.",
        features: [
            "8 Core CPU / 64 BIT",
            "ALL VERSI ANDROID",
            "6G RAM / 80G ROM",
            "Qualcomm Processor",
        ],
        cta: "Order KVIP 7D",
        featured: false,
    },
    {
        name: "KVIP",
        id: "kvip-30d",
        price: "Rp 98.000",
        period: "per 30 hari",
        description: "Versi terbaik dengan performa maksimal untuk gaming berat.",
        features: [
            "8 Core CPU / 64 BIT",
            "ALL VERSI ANDROID",
            "6G RAM / 80G ROM",
            "Qualcomm Processor",
        ],
        cta: "Order KVIP 30D",
        featured: true,
        badge: "Best Value",
    },
]

export function PricingSection() {
    return (
        <section id="pricing" className="w-full py-16 md:py-24 bg-background">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col items-center text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl font-[family-name:var(--font-heading)]">
                        Paket <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/50">Kode Redeem</span>
                    </h2>
                    <p className="text-muted-foreground mt-4 max-w-[700px] text-base md:text-lg leading-relaxed">
                        Pilih spesifikasi cloud phone yang sesuai dengan kebutuhan gaming Anda.
                    </p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 max-w-7xl mx-auto">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`relative flex flex-col p-4 md:p-6 rounded-xl border transition-all duration-300 ${plan.featured ? 'border-foreground shadow-2xl z-10 scale-[1.02]' : 'border-border/50 hover:bg-muted/30'}`}>
                            {plan.badge && (
                                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-[60%] w-full flex justify-center">
                                    <Badge className={`${plan.featured ? 'bg-foreground text-background' : 'bg-muted text-foreground border-border/50'} font-bold text-[7px] md:text-[9px] uppercase px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap`}>
                                        {plan.badge}
                                    </Badge>
                                </div>
                            )}
                            <div className="mb-3 md:mb-4">
                                <h3 className="text-sm md:text-xl font-bold text-foreground">{plan.name}</h3>
                                <p className="text-[9px] md:text-[11px] text-muted-foreground mt-0.5 md:mt-1 leading-tight line-clamp-2">{plan.description}</p>
                            </div>
                            <div className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-baseline gap-0 md:gap-1">
                                <span className="text-lg md:text-4xl font-bold text-foreground tracking-tighter">{plan.price}</span>
                                <span className="text-muted-foreground text-[8px] md:text-xs font-medium">{plan.period}</span>
                            </div>
                            <ul className="mb-4 md:mb-8 space-y-2 md:space-y-4 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start text-[9px] md:text-sm text-foreground/90 font-medium leading-tight">
                                        <Check className="h-2.5 w-2.5 md:h-4 md:w-4 text-foreground mr-1.5 md:mr-3 shrink-0 mt-0.5" />
                                        <span className="truncate md:whitespace-normal">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button size="sm" variant={plan.featured ? "default" : "outline"} className="w-full h-8 md:h-12 rounded-md font-bold tracking-widest text-[8px] md:text-[11px] uppercase shadow-sm">
                                {plan.cta}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
