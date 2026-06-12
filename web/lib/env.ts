export function getPublicEnv() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is required");
  }

  return {
    apiUrl,
  };
}
