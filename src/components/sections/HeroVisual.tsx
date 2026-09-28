import { GlassPane } from "@/components/visual/pane/GlassPane";
import { PaneStage } from "@/components/visual/pane/PaneStage";
import { ScreenIdeas, ScreenPhoto, ScreenTall } from "@/components/visual/pane/Screens";

/** Hero centrepiece: three glass website panes floating over the plinth in the rendered plate. */
export const HeroVisual = () => (
  <PaneStage
    className="hero-stage"
    label="Three concept website designs shown on floating glass panels"
    layers={[
      { id: "top", className: "hero-pane--top", depth: 10, node: <GlassPane><ScreenPhoto title="Cleaner websites. Bigger ideas." /></GlassPane> },
      { id: "main", className: "hero-pane--main", depth: 22, float: true, node: <GlassPane><ScreenIdeas /></GlassPane> },
      { id: "tall", className: "hero-pane--tall", depth: 16, node: <GlassPane><ScreenTall /></GlassPane> },
    ]}
  />
);
