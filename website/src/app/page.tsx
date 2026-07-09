import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { TrustBar } from "@/components/sections/TrustBar";
import { Problem } from "@/components/sections/Problem";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Features } from "@/components/sections/Features";
import { MobileShowcase } from "@/components/sections/MobileShowcase";
import { WhatsApp } from "@/components/sections/WhatsApp";
import { Testimonials } from "@/components/sections/Testimonials";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/sections/Footer";
import { FloatingButtons } from "@/components/sections/FloatingButtons";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <Problem />
        <HowItWorks />
        <Features />
        <MobileShowcase />
        <WhatsApp />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
      <FloatingButtons />
    </>
  );
}
