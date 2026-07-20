import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { TrustBar } from "@/components/sections/TrustBar";
import { About } from "@/components/sections/About";
import { ManagementEasy } from "@/components/sections/ManagementEasy";
import { WhyChoose } from "@/components/sections/WhyChoose";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FeatureShowcase } from "@/components/sections/FeatureShowcase";
import { Pricing } from "@/components/sections/Pricing";
import { Testimonials } from "@/components/sections/Testimonials";
import { FAQ } from "@/components/sections/FAQ";
import { Demo } from "@/components/sections/Demo";
import { Footer } from "@/components/sections/Footer";
import { FloatingButtons } from "@/components/sections/FloatingButtons";
import { AnimatedBrowser } from "@/components/ui/AnimatedBrowser";
import { storeWeb } from "@/lib/site";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <About />
        <ManagementEasy />
        <WhyChoose />
        <HowItWorks />

        <FeatureShowcase
          id="features"
          eyebrow="For Stores"
          heading="Run your store from the browser"
          intro="The LaundryMax Store Web App gives you full control of your laundry business from any browser."
          items={storeWeb}
          footer="Start your 1-month free trial today with the best affordable laundry software in India."
          custom={<AnimatedBrowser />}
          reverse
        />

        <Pricing />
        <Testimonials />
        <FAQ />
        <Demo />
      </main>
      <Footer />
      <FloatingButtons />
    </>
  );
}
