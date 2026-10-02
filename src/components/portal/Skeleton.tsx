/** Placeholders shown the instant a portal link is clicked, while the server loads the page's data. */
const Line = ({ w }: { w: string }) => <span className="pt-skel" style={{ width: w }} />;

const Pane = ({ lines }: { lines: string[] }) => (
  <div className="pt-card pt-skel-pane">
    {lines.map((w, i) => (
      <Line key={i} w={w} />
    ))}
  </div>
);

/** Body of a page: two panes of rows. Used on its own under the project tabs. */
export const PanelSkeleton = () => (
  <div className="pt-grid pt-cols-main pt-section-gap" aria-hidden>
    <Pane lines={["34%", "92%", "84%", "88%", "62%"]} />
    <Pane lines={["48%", "90%", "72%", "80%"]} />
  </div>
);

export const PageSkeleton = () => (
  <div role="status">
    <span className="sr-only">Loading</span>
    <div className="pt-head" aria-hidden>
      <div className="pt-skel-pane">
        <span className="pt-skel pt-skel--title" />
        <Line w="18rem" />
      </div>
    </div>
    <PanelSkeleton />
  </div>
);
