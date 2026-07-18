import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required("JWT_SECRET", "dev-only-insecure-secret"),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:5174").split(","),
};
