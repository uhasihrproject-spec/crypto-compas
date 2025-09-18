import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const { email, type, token } = await req.json();

  if (!email || !type || !token) {
    return new Response("Missing required fields", { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let subject = "";
  let link = "";
  let text = "";

  if (type === "verify") {
    link = `${process.env.NEXT_PUBLIC_BASE_URL}/login?token=${token}`;
    subject = "Verify your email / Sign In";
    text = `Click here to verify and sign in: ${link}`;
  } else if (type === "reset") {
    link = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
    subject = "Reset your password";
    text = `Click here to reset your password: ${link}`;
  } else {
    return new Response("Invalid email type", { status: 400 });
  }

  try {
    await transporter.sendMail({
      from: `"CryptoCurrent" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
    });
    return new Response("Email sent", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Failed to send email", { status: 500 });
  }
}
