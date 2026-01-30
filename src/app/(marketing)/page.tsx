import { HeroSection } from "@/components/marketing/hero-section"
import { FeaturesSection } from "@/components/marketing/features-section"
import { HowItWorksSection } from "@/components/marketing/how-it-works-section"
import { PricingSection } from "@/components/marketing/pricing-section"
import { TestimonialsSection } from "@/components/marketing/testimonials-section"
import { FAQSection } from "@/components/marketing/faq-section"
import { CTASection } from "@/components/marketing/cta-section"

export default function MarketingPage() {
    return (
        <>
            <HeroSection />
            <FeaturesSection />
            <HowItWorksSection />
            <PricingSection />
            <TestimonialsSection />
            <FAQSection />
            <CTASection />
        </>
    )
}
