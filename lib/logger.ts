type LogContext = Record<string, string | number | boolean | null | undefined>;

function write(level: "info" | "error", message: string, context: LogContext = {}) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });
  (level === "error" ? console.error : console.info)(entry);
}

export const logger = {
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },
  error(message: string, context?: LogContext) {
    write("error", message, context);
  },
};
