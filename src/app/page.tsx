import { Hero } from "@/components/sections/Hero";
import { Pricing } from "@/components/sections/Pricing";
import { Process } from "@/components/sections/Process";
import { WhatWeBuild } from "@/components/sections/WhatWeBuild";
import { WhyNorthframe } from "@/components/sections/WhyNorthframe";

export default function Home() {
  return (
    <>
      <Hero />
      <WhatWeBuild />
      <WhyNorthframe />
      <Process />
      <Pricing />
    </>
  );
}
