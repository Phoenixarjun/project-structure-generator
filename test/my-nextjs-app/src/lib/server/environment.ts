import "server-only";

export const serverEnv = {
  secretKey: process.env.SESSION_SECRET || "default_secret",
};
