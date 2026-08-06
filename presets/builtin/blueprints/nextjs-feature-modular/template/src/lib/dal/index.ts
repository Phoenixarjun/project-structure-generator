import "server-only";

export async function verifySession() {
  return { isAuth: true };
}
