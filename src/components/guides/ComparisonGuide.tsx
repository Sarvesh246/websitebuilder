import Link from "next/link";
import { ArrowRight, Check, Code2, LayoutTemplate, UserRound, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { startHref } from "@/config/inquiry";
import { priceLine } from "@/config/guides";

export const builderComparisonSlug = "custom-website-vs-website-builder";
export const isComparisonGuide = (slug: string) => slug === builderComparisonSlug || slug === "portfolio-website-vs-linkedin";

const builderRows = [
  ["Design", "Designed around your content", "A template and editor you customize", "A template and editor you customize"],
  ["Who does the work", "Northframe plans, designs, and builds", "You build it, or hire someone to help", "You build it, or hire someone to help"],
  ["Cost structure", "One-time build; domain and services separate", "Platform plan plus any paid extras", "Platform plan plus any paid extras"],
  ["Hosting & portability", "Your code and hosting accounts; move with a developer", "Your Wix site runs on Wix hosting", "Some content exports; the complete design does not"],
  ["Day-to-day edits", "Edit the code or ask a developer; no visual editor by default", "Visual editor for hands-on updates", "Visual editor for hands-on updates"],
  ["Advanced features", "Accounts, payments, and databases quoted under Custom", "Check the plan, apps, and platform limits", "Check the plan, extensions, and platform limits"],
] as const;
const portfolioRows = [
  ["Main job", "Show the evidence behind your experience", "Help people find you and connect"],
  ["Project presentation", "Your layout, case studies, galleries, and live demos", "Featured work and project links within a profile layout"],
  ["Your identity", "Your own domain and visual direction", "Your name within LinkedIn’s platform"],
  ["Discovery", "Search engines, applications, and links you share", "Recruiter searches, connections, and your network"],
  ["Control", "You choose the content, structure, and hosting", "Your profile follows the platform’s format and rules"],
  ["Best next step", "Send readers to the projects that prove your fit", "Link your portfolio so readers can explore further"],
] as const;

export const ComparisonGuide = ({ slug }: { slug: string }) => {
  const builder = slug === builderComparisonSlug;
  const columns = builder ? ["Northframe custom website", "Wix", "Squarespace"] : ["Portfolio website", "LinkedIn profile"];
  const rows = builder ? builderRows : portfolioRows;
  return (
    <div className="comparison-guide">
      <section className="decision-pair" aria-label="Which option fits your goal?">
        <div className="decision-pair__option decision-pair__option--featured">
          {builder ? <Code2 size={28} aria-hidden /> : <Globe2 size={28} aria-hidden />}
          <p className="decision-pair__label">{builder ? "Built for you" : "Your work, in depth"}</p>
          <h2>{builder ? "A site shaped around your business." : "Give your work room to speak."}</h2>
          <p>{builder ? "Choose custom web design when you want someone to handle the build, a layout tailored to your content, and source code you keep." : "Choose a personal portfolio website when projects, images, demos, or case studies are the strongest proof of what you can do."}</p>
          <a href="#comparison-details">{builder ? "See what Northframe includes" : "Compare how each works"}<ArrowRight size={16} aria-hidden /></a>
        </div>
        <div className="decision-pair__option">
          {builder ? <LayoutTemplate size={28} aria-hidden /> : <UserRound size={28} aria-hidden />}
          <p className="decision-pair__label">{builder ? "Build it yourself" : "Your professional network"}</p>
          <h2>{builder ? "An editor you can run yourself." : "Help the right people find you."}</h2>
          <p>{builder ? "Wix or Squarespace can suit you if you enjoy building, want a visual editor for frequent changes, and are comfortable staying on the platform." : "Use LinkedIn for a familiar professional profile, recruiter discovery, connections, and conversations. A portfolio gives those readers a place to go deeper."}</p>
          <p className="decision-pair__takeaway">{builder ? "The tradeoff: your time and the platform’s limits." : "The strongest pairing: a profile plus proof of your work."}</p>
        </div>
      </section>

      <section id="comparison-details" className="comparison-matrix" aria-labelledby="comparison-title">
        <div className="comparison-matrix__intro"><h2 id="comparison-title" className="t-h3">{builder ? "Custom website vs Wix vs Squarespace" : "Portfolio website vs LinkedIn, side by side"}</h2><p>{builder ? "Compare the work, ongoing costs, and control behind each option." : "They serve different jobs. Here is where each earns its place."}</p></div>
        <table>
          <caption className="sr-only">{builder ? "Custom web design and website builder comparison" : "Personal portfolio website and LinkedIn comparison"}</caption>
          <thead><tr><th scope="col">What matters</th>{columns.map((col, i) => <th scope="col" key={col} data-featured={i === 0 ? "" : undefined}>{col}</th>)}</tr></thead>
          <tbody>{rows.map(([label, ...values]) => <tr key={label}><th scope="row">{label}</th>{values.map((value, i) => <td key={columns[i]} data-label={columns[i]} data-featured={i === 0 ? "" : undefined}>{value}</td>)}</tr>)}</tbody>
        </table>
      </section>

      <section className="comparison-difference" aria-labelledby="difference-title">
        <div><p className="decision-pair__label">The Northframe approach</p><h2 id="difference-title" className="t-h3">Custom design.<br />Clear scope. Yours to keep.</h2><p>{builder ? "A custom website does not have to mean an open-ended agency bill. Start with the package that fits your pages and features." : "Your portfolio should be built around your projects. Northframe handles the design and build, so you can focus on the work you want to share."}</p></div>
        <ul>{["A layout designed around your content, with responsive design and deployment included.", "The finished code, domain, and hosting accounts under your control.", `${priceLine("launch")}. ${priceLine("presence")}.`, "Logins, databases, and payments are scoped separately. Domain registration and paid services are extra."].map((item) => <li key={item}><Check size={18} aria-hidden /><span>{item}</span></li>)}</ul>
        <div className="guide__actions"><Button href={startHref()} icon="diag">Discuss your website</Button><Button href="/tools/website-cost-calculator" variant="secondary">Estimate your website cost</Button></div>
      </section>
      <section className="comparison-sources" aria-label="Platform documentation"><h2 className="t-h4">Check the platform details</h2><p>{builder ? <>Platform features and plans change. Review <a href="https://support.wix.com/en/article/exporting-or-embedding-your-wix-site-elsewhere">Wix’s hosting and export policy</a> and <a href="https://support.squarespace.com/hc/en-us/articles/206566687-Exporting-your-site">Squarespace’s content export limits</a> before deciding.</> : <>LinkedIn can showcase work too. Its <a href="https://www.linkedin.com/help/linkedin/answer/a550399/feature-samples-of-your-work-on-your-linkedin-profile?lang=en">Featured section documentation</a> explains how samples fit into a profile. A dedicated portfolio adds control over the full presentation.</>}</p><Link href="/guides/domain-hosting-and-website-ownership">Learn about domain, hosting, and website ownership</Link></section>
    </div>
  );
};
