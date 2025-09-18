// src/app/api/sendClientEmail/route.ts
import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
export async function POST(req: NextRequest) {
  try {
    const { userEmail, text } = await req.json();

    await sgMail.send({
      to: "ankaraauragh@gmail.com", // client email
      from: "uhasihrproject@gmail.com",
      subject: `New message from ${userEmail}`,
      text: text,
      html: `<p>${text}</p><p>From: ${userEmail}</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
