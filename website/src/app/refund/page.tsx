import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { FloatingButtons } from "@/components/sections/FloatingButtons";
import { LegalArticle } from "@/components/sections/LegalArticle";
import { refund } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Refund & Cancellation — LaundryMax",
};

export default function RefundPage() {
  return (
    <>
      <Navbar />
      <main>
        <LegalArticle doc={refund} />
      </main>
      <Footer />
      <FloatingButtons />
    </>
  );
}
