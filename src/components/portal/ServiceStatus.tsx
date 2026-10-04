import { getServiceHealth, type ServiceState } from "@/lib/status/serviceStatus";
import { Card } from "./parts";

const label: Record<ServiceState, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Outage",
  unknown: "Status unavailable",
};

/** Admin-only. Streams in behind Suspense so a slow status API never delays the dashboard. */
export const ServiceStatus = async () => {
  const services = await getServiceHealth();
  const issues = services.filter((s) => s.state === "degraded" || s.state === "down").length;
  return (
    <Card
      title="Service status"
      note={issues === 0 ? "Payments, database, hosting and email, checked every few minutes" : `${issues} ${issues === 1 ? "service reports" : "services report"} a problem`}
    >
      <ul className="pt-status">
        {services.map((s) => (
          <li key={s.slug}>
            <span className="pt-status__dot" data-state={s.state} aria-hidden />
            <a className="pt-status__name pt-link" href={s.statusPage} target="_blank" rel="noopener noreferrer">
              {s.name}
            </a>
            <span className="pt-status__state">{label[s.state]}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const ServiceStatusFallback = () => (
  <Card title="Service status" note="Checking…">
    <p className="pt-muted">Contacting the status feed.</p>
  </Card>
);
