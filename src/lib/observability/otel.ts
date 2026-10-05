import "server-only";
import { logs } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { LoggerProvider, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";

/**
 * Ships server logs to PostHog over OTLP. Called once from instrumentation.ts, only when
 * POSTHOG_LOGS_KEY is set; without it nothing is sent and `serverLog` just prints to the console.
 * SimpleLogRecordProcessor (not batch) because serverless functions can freeze before a batch flushes;
 * the volume is a handful of error lines, so one request per line is fine. The export is time boxed.
 */
export const initServerLogs = (key: string, host: string) => {
  const exporter = new OTLPLogExporter({
    url: `${host.replace(/\/+$/, "")}/otlp/v1/logs`,
    headers: { Authorization: `Bearer ${key}` },
    timeoutMillis: 3000,
  });
  const provider = new LoggerProvider({
    resource: resourceFromAttributes({ "service.name": "northframe", "deployment.environment": process.env.VERCEL_ENV ?? "local" }),
    processors: [new SimpleLogRecordProcessor({ exporter })],
  });
  logs.setGlobalLoggerProvider(provider);
};
