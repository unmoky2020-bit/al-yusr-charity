import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { RelatedOwnerLinks } from "@/components/seo/RelatedOwnerLinks";

export const PageLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-1 pt-20">{children}</main>
    <RelatedOwnerLinks />
    <Footer />
  </div>
);
