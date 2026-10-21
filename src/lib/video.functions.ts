import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ASPECT_RATIOS, VIDEO_COST, VIDEO_MAX_SECONDS, VIDEO_MIN_SECONDS, VIDEO_MODEL, videoAspect, type AspectRatio } from "./catalog";
import { friendly, guard, recordUsage, type Ctx } from "./ai.functions";

export const startVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        prompt: z.string().trim().min(3).max(2000),
        style: z.string().max(40),
        aspect: z.enum(ASPECT_RATIOS),
        duration: z.number().int().min(VIDEO_MIN_SECONDS).max(VIDEO_MAX_SECONDS),
        sourceId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await guard(ctx, VIDEO_COST);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: running } = await supabaseAdmin
      .from("video_jobs")
      .select("id")
      .eq("user_id", ctx.userId)
      .in("status", ["queued", "in_progress"])
      .gte("created_at", new Date(Date.now() - 15 * 60_000).toISOString());
    if (running?.length) throw new Error("A video is already being created. Please wait for it to finish.");
    const prompt = data.style && data.style !== "None" ? `${data.prompt}. Style: ${data.style}.` : data.prompt;
    // Optional: animate one of the caller's own images (RLS-scoped read).
    let input: any = prompt;
    if (data.sourceId) {
      const { data: src } = await ctx.supabase.from("generations").select("image_url,kind").eq("id", data.sourceId).maybeSingle();
      if (!src || src.kind === "video") throw new Error("That image could not be found.");
      const { data: file, error: dlErr } = await supabaseAdmin.storage.from("generations").download(src.image_url);
      if (dlErr || !file) throw new Error("Could not load the image for the video.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      input = [
        { type: "image", data: btoa(bin), mime_type: file.type || "image/png" },
        { type: "text", text: `Animate this image into a video. ${prompt}` },
      ];
    }
    let job: any;
    try {
      const gw = await import("@lovable.dev/ai-gateway");
      job = await gw.generateVideo({
        model: VIDEO_MODEL,
        input,
        response_format: { type: "video", resolution: "720p", duration: `${data.duration}s`, aspect_ratio: videoAspect(data.aspect as AspectRatio) },
      } as any);
    } catch (err) {
      console.error("generateVideo failed", err);
      throw friendly(err);
    }
    if (!job?.id) throw new Error("Video generation could not be started. Please retry.");
    const { error } = await supabaseAdmin.from("video_jobs").insert({
      id: job.id,
      user_id: ctx.userId,
      prompt: data.prompt,
      aspect: data.aspect,
      duration: data.duration,
      status: job.status ?? "queued",
    });
    if (error) throw new Error("Could not track the video job.");
    return { id: job.id as string };
  });

export const checkVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    // RLS restricts this read to the caller's own jobs.
    const { data: row } = await ctx.supabase.from("video_jobs").select("*").eq("id", data.id).maybeSingle();
    if (!row) throw new Error("Video not found.");
    if (row.status === "completed" || row.status === "failed") return { status: row.status as string, error: row.error as string | null };
    const gw = await import("@lovable.dev/ai-gateway");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let job: any;
    try {
      job = await gw.getVideo(data.id);
    } catch (err) {
      throw friendly(err);
    }
    if (job?.status === "failed") {
      const msg = job?.error?.message ?? "Video generation failed.";
      await supabaseAdmin.from("video_jobs").update({ status: "failed", error: msg }).eq("id", data.id);
      return { status: "failed", error: msg };
    }
    if (job?.status !== "completed") {
      await supabaseAdmin.from("video_jobs").update({ status: job?.status ?? "in_progress" }).eq("id", data.id);
      return { status: (job?.status as string) ?? "in_progress", progress: job?.progress as number | undefined, error: null };
    }
    // Claim the job so concurrent polls store it only once.
    const { data: claimed } = await supabaseAdmin
      .from("video_jobs")
      .update({ status: "storing" })
      .eq("id", data.id)
      .neq("status", "storing")
      .select("id");
    if (!claimed?.length) return { status: "in_progress", error: null };
    try {
      const bin: any = await gw.downloadVideo(data.id);
      const bytes = new Uint8Array(await (await bin.blob()).arrayBuffer());
      const genId = crypto.randomUUID();
      const path = `${ctx.userId}/${genId}.mp4`;
      const { error: upErr } = await supabaseAdmin.storage.from("generations").upload(path, bytes, { contentType: "video/mp4" });
      if (upErr) throw new Error("Could not store the generated video.");
      await supabaseAdmin.from("generations").insert({
        id: genId,
        user_id: ctx.userId,
        prompt: row.prompt,
        aspect: row.aspect,
        model: VIDEO_MODEL,
        image_url: path,
        kind: "video",
        duration: row.duration,
      });
      await recordUsage(ctx.userId, "video", VIDEO_MODEL, VIDEO_COST);
      await supabaseAdmin.from("video_jobs").update({ status: "completed", generation_id: genId }).eq("id", data.id);
      return { status: "completed", error: null };
    } catch (err) {
      await supabaseAdmin.from("video_jobs").update({ status: "in_progress" }).eq("id", data.id);
      throw err instanceof Error ? err : new Error("Could not save the video.");
    }
  });
