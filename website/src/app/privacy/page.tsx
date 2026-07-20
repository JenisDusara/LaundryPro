import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { FloatingButtons } from "@/components/sections/FloatingButtons";
import { LegalArticle } from "@/components/sections/LegalArticle";
import { privacy } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — LaundryMax",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main>
        <LegalArticle doc={privacy} />
      </main>
      <Footer />
      <FloatingButtons />
    </>
  );
}
