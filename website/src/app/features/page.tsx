import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { FeaturesDetailed } from "@/components/sections/FeaturesDetailed";
import { Footer } from "@/components/sections/Footer";
import { FloatingButtons } from "@/components/sections/FloatingButtons";

export const metadata: Metadata = {
  title: "Features — LaundryMax Laundry Management Software",
  description:
    "Billing & POS, customers, orders, services, WhatsApp & monthly bills, payments, accounting, reports and labour — everything to run your laundry shop.",
};

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main>
        <FeaturesDetailed />
      </main>
      <Footer />
      <FloatingButtons />
    </>
  );
}
