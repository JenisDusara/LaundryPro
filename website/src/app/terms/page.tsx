import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { FloatingButtons } from "@/components/sections/FloatingButtons";
import { LegalArticle } from "@/components/sections/LegalArticle";
import { terms } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions — LaundryMax",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main>
        <LegalArticle doc={terms} />
      </main>
      <Footer />
      <FloatingButtons />
    </>
  );
}
