import { NextResponse } from "next/server";
import { fetchParashaText } from "@/lib/parasha/sefaria";
import { findParashaById } from "@/lib/parasha/list";

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing parasha id" }, { status: 400 });
    }
    const parasha = findParashaById(id);
    if (!parasha) {
      return NextResponse.json({ error: `Unknown parasha id: ${id}` }, { status: 404 });
    }
    const text = await fetchParashaText(parasha);
    return NextResponse.json({ parasha, ...text });
  } catch (error) {
    console.error("Parasha text error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch parasha text" },
      { status: 500 },
    );
  }
}
