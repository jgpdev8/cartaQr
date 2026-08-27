import type { NextRequest } from "next/server";
import QRCode from "qrcode";
import { isAuthenticated } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site";

const COLOR = { dark: "#0078a0", light: "#ffffff" };

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return new Response("No autorizado", { status: 401 });
  }

  const format = req.nextUrl.searchParams.get("format") === "png" ? "png" : "svg";
  const target = getSiteUrl();

  if (format === "svg") {
    const svg = await QRCode.toString(target, {
      type: "svg",
      margin: 2,
      color: COLOR,
      errorCorrectionLevel: "M",
      width: 512,
    });
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": 'inline; filename="qr-aspas-cafe.svg"',
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = await QRCode.toBuffer(target, {
    type: "png",
    margin: 2,
    color: COLOR,
    errorCorrectionLevel: "M",
    width: 1024,
  });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'inline; filename="qr-aspas-cafe.png"',
      "Cache-Control": "no-store",
    },
  });
}
