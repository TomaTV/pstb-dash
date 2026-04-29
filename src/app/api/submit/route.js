import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";
import { getStore, setStore } from "@/lib/db";
import crypto from "crypto";

export async function POST(req) {
  try {
    const body = await req.json();

    let finalImageUrl = body.imageUrl;

    // If imageUrl is a base64 string, save it to disk
    if (finalImageUrl && finalImageUrl.startsWith("data:image/")) {
      const match = finalImageUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (match) {
        const ext = match[1].toLowerCase();
        const allowedExts = ["png", "jpg", "jpeg", "gif", "webp"];
        if (!allowedExts.includes(ext)) {
          return NextResponse.json({ error: "Invalid image format. Allowed: png, jpg, jpeg, gif, webp" }, { status: 400 });
        }
        const base64Data = match[2];
        const fileName = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, fileName), base64Data, "base64");
        
        finalImageUrl = `/uploads/${fileName}`;
      }
    }

    // Generate unique ID
    const newWidget = {
      id: `student-${Date.now()}`,
      type: "student",
      title: body.title,
      focusable: true,
      status: "pending", // Important: won't be displayed automatically
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // Expires in 1 week
      data: {
        title: body.title,
        description: body.description,
        dateLabel: body.dateLabel,
        submitter: body.submitter,
        qrUrl: body.qrUrl,
        imageUrl: finalImageUrl, 
      },
    };

    // Save to db
    const widgets = (await getStore("widgets")) || [];
    widgets.push(newWidget);
    await setStore("widgets", widgets);

    // Optional: Send email notification to t.devulder@pstb.fr
    // Configure SMTP if you have it in .env.local:
    // SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"PST&B Dashboard" <${process.env.SMTP_USER}>`,
        to: "t.devulder@pstb.fr",
        subject: `[Dashboard] Nouvelle demande de publication BDE : ${body.title}`,
        text: `Une nouvelle demande a été soumise sur le campus :\n\n` +
              `Titre : ${body.title}\n` +
              `Par : ${body.submitter}\n\n` +
              `Allez sur http://localhost:3000/admin pour valider ou refuser cette demande.`,
      });
    }

    return NextResponse.json({ success: true, widget: newWidget });

  } catch (error) {
    console.error("[Submit API Error]", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
