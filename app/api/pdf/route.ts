import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/pdf/ReportDocument";
import React from "react";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientName, dateRange, sections, chartImages, kpis, pages, spend } = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(ReportDocument, {
      clientName: clientName ?? "Client",
      dateRange: dateRange ?? "MTD",
      sections: sections ?? [],
      chartImages: chartImages ?? {},
      kpis: kpis ?? {},
      pages: pages ?? [],
      spend: spend ?? { services: 0, hubspot: 0, ads: 0 },
      accent: "#6C3483",
    }) as any
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="attribution-report-${dateRange}.pdf"`,
    },
  });
}
