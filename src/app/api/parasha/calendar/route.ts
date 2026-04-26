import { NextResponse } from "next/server";
import { getCurrentParasha } from "@/lib/parasha/sefaria";

export const maxDuration = 30;

export async function GET() {
  try {
    const parasha = await getCurrentParasha();
    if (!parasha) {
      return NextResponse.json(
        { error: "Could not determine current parasha from Sefaria calendar" },
        { status: 502 },
      );
    }
    return NextResponse.json({ parasha });
  } catch (error) {
    console.error("Parasha calendar error:", error);
    return NextResponse.json(
      { error: "Failed to fetch parasha calendar" },
      { status: 500 },
    );
  }
}
