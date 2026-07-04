import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getAllPickLists, getPickListById, updatePickList } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["warehouse", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let lists = getAllPickLists();
  if (status) {
    lists = lists.filter((pl) => pl.status === status);
  }

  return NextResponse.json({ pickLists: lists, total: lists.length });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["warehouse", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status, itemUpdates } = await req.json();

  const pl = getPickListById(id);
  if (!pl) {
    return NextResponse.json({ error: "Pick list not found" }, { status: 404 });
  }

  const updated = {
    ...pl,
    status:      status || pl.status,
    assignedTo:  session.name,
    completedAt: status === "completed" ? new Date().toISOString() : pl.completedAt,
    items: pl.items.map((item) => {
      const upd = itemUpdates?.find((u: { id: string }) => u.id === item.id);
      if (!upd) return item;
      return { ...item, pickedQty: upd.pickedQty, status: upd.status };
    }),
  };

  updatePickList(updated);
  return NextResponse.json({ pickList: updated });
}
