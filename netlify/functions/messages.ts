import type { Config, Context } from "@netlify/functions";
import { desc, eq, lt, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { messages } from "../../db/schema.js";

const BAD = ["كلب", "حمار", "غبي", "حقير", "زب", "كس", "شرموط", "عاهر", "قحب", "منيك", "عير", "بلاع", "طيز", "عزك", "تناحة", "حيوان", "مطي", "ساقط", "خشم", "حلك", "موطة", "نيج", "تنيج", "نيجني", "انيجك", "ابعصك", "بعصتك", "فيحاء", "مهند", "ميثاق", "السنيدي", "اياد", "العب بي", "كسه"];
const clean = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();
const hasBad = (s: string) => BAD.some((w) => s.includes(w));
const hasPhone = (s: string) => /(\+?\d[\d\s-]{7,})/.test(s);
const err = (error: string, status = 400) => Response.json({ error }, { status });

export default async (req: Request, context: Context) => {
  const { id, action } = context.params;

  if (req.method === "GET" && !id) {
    const rows = await db
      .select()
      .from(messages)
      .where(lt(messages.reports, 3))
      .orderBy(desc(messages.createdAt))
      .limit(100);
    return Response.json(rows.map((m) => ({ ...m, createdAt: m.createdAt.getTime() })));
  }

  if (req.method === "POST" && !id) {
    let body: any;
    try { body = await req.json(); } catch { return err("طلب غير صالح"); }
    const text = clean(body?.text).slice(0, 500);
    const to = clean(body?.to).slice(0, 30);
    if (text.length < 3) return err("الرسالة قصيرة جداً.");
    if (hasBad(text) || hasBad(to)) return err("الرسالة تحتوي ألفاظاً غير لائقة. عدّلها وحاول مجدداً.");
    if (hasPhone(text)) return err("لا تضع أرقام هواتف أو معلومات شخصية في الرسالة.");
    const [m] = await db.insert(messages).values({ text, to }).returning();
    return Response.json({ ...m, createdAt: m.createdAt.getTime() }, { status: 201 });
  }

  if (req.method === "POST" && id && (action === "like" || action === "report")) {
    const num = Number(id);
    if (!Number.isInteger(num)) return err("معرّف غير صالح");
    const col = action === "like" ? messages.likes : messages.reports;
    const [m] = await db
      .update(messages)
      .set(action === "like" ? { likes: sql`${col} + 1` } : { reports: sql`${col} + 1` })
      .where(eq(messages.id, num))
      .returning();
    if (!m) return err("الرسالة غير موجودة", 404);
    return Response.json({ id: m.id, likes: m.likes, reports: m.reports });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: ["/api/messages", "/api/messages/:id/:action"],
};
