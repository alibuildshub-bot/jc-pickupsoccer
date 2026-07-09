import {
  adminConfigError,
  createSupabaseAdminClient,
  isAdminRequest,
  unauthorizedError,
} from "@/lib/admin";

type PlayerPayload = {
  id?: string;
  name?: string;
  nickname?: string;
  position?: string;
  is_active?: boolean;
};

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const { data, error } = await supabase
    .from("players")
    .select("id,name,nickname,position,is_active,created_at")
    .order("name");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ players: data });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const payload = (await request.json()) as PlayerPayload;
  const name = payload.name?.trim();

  if (!name) {
    return Response.json({ error: "Player name is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("players")
    .insert({
      name,
      nickname: payload.nickname?.trim() || null,
      position: payload.position?.trim() || null,
      is_active: payload.is_active ?? true,
    })
    .select("id,name,nickname,position,is_active,created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ player: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const payload = (await request.json()) as PlayerPayload;

  if (!payload.id) {
    return Response.json({ error: "Player id is required." }, { status: 400 });
  }

  const name = payload.name?.trim();
  if (!name) {
    return Response.json({ error: "Player name is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("players")
    .update({
      name,
      nickname: payload.nickname?.trim() || null,
      position: payload.position?.trim() || null,
      is_active: payload.is_active ?? true,
    })
    .eq("id", payload.id)
    .select("id,name,nickname,position,is_active,created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ player: data });
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Player id is required." }, { status: 400 });
  }

  const { error } = await supabase.from("players").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
