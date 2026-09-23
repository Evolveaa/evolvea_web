import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import DemoSection from "@/components/DemoSection";
import Project from "@/components/Project";
import Info from "@/components/Info";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <DemoSection />
        <Project />
        <Info />
      </main>
      <SiteFooter />
    </>
  );
}
