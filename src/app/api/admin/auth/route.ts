import { getAdminAuthInfo } from "@/lib/admin";

export async function GET(request: Request) {
  const auth = await getAdminAuthInfo(request);

  return Response.json({ auth });
}
