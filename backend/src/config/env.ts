export interface Env {
  DATABASE_URL: string;
  PORT: number;
  NODE_ENV: "development" | "test" | "production";
}

export function getEnv(): Env {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const portRaw = process.env.PORT ?? "3001";
  const PORT = Number.parseInt(portRaw, 10);
  if (Number.isNaN(PORT)) {
    throw new Error("PORT must be a valid number");
  }

  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (
    nodeEnv !== "development" &&
    nodeEnv !== "test" &&
    nodeEnv !== "production"
  ) {
    throw new Error("NODE_ENV must be development, test, or production");
  }

  return {
    DATABASE_URL,
    PORT,
    NODE_ENV: nodeEnv,
  };
}
