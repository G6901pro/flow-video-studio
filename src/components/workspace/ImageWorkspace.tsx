import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Image, Loader2, Sparkles, Download, Film, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { generateImageFn, getUsage, listGenerations } from "@/lib/ai.functions";
import { checkVideo, startVideo } from "@/lib/video.functions";
import { ASPECT_RATIOS, IMAGE_COST, VIDEO_COST, VIDEO_MAX_SECONDS, VIDEO_MIN_SECONDS, type AspectRatio } from "@/lib/catalog";
import { UpgradePrompt } from "./UpgradePrompt";

type Kind = "image" | "video";

function Pill({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-all",
        active
          ? "border-cyan bg-cyan/15 text-foreground shadow-[0_0_14px_-2px_var(--cyan)]"
          : "border-border text-muted-foreground hover:border-cyan/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function ImageWorkspace() {
  const generate = useServerFn(generateImageFn);
  const start = useServerFn(startVideo);
  const check = useServerFn(checkVideo);
  const list = useServerFn(listGenerations);
  const usageFn = useServerFn(getUsage);
  const qc = useQueryClient();
  const gallery = useQuery({ queryKey: ["generations"], queryFn: () => list() });
  const usage = useQuery({ queryKey: ["usage"], queryFn: () => usageFn() });
  const [kind, setKind] = useState<Kind>("image");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("None");
  const [aspect, setAspect] = useState<AspectRatio>("1:1");
  const [duration, setDuration] = useState(5);
  const [pending, setPending] = useState(false);
  const [videoJob, setVideoJob] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cost = kind === "image" ? IMAGE_COST : VIDEO_COST;
  const remaining = usage.data?.remaining;
  const enough = remaining === undefined || remaining >= cost;
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!videoJob) return;
    let stop = false;
    let failures = 0;
    const tick = async () => {
      try {
        const r = await check({ data: { id: videoJob } });
        if (stop) return;
        failures = 0;
        setError(null);
        if (r.status === "completed") {
          setVideoJob(null);
          setPending(false);
          toast.success("Your video is ready!");
          await Promise.all([qc.invalidateQueries({ queryKey: ["generations"] }), qc.invalidateQueries({ queryKey: ["usage"] })]);
          return;
        }
        if (r.status === "failed") {
          setVideoJob(null);
          setPending(false);
          setError(r.error ?? "Video generation failed.");
          return;
        }
      } catch (e) {
        if (stop) return;
        failures += 1;
        if (failures >= 5) {
          setVideoJob(null);
          setPending(false);
          setError(e instanceof Error ? e.message : "Could not check the video. Please refresh later.");
          return;
        }
      }
      if (!stop) timer = setTimeout(tick, 7000);
    };
    let timer = setTimeout(tick, 7000);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [videoJob, check, qc]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || !enough) return;
    setPending(true);
    setError(null);
    try {
      if (kind === "image") {
        await generate({ data: { prompt, style, aspect } });
        await Promise.all([qc.invalidateQueries({ queryKey: ["generations"] }), qc.invalidateQueries({ queryKey: ["usage"] })]);
        setPending(false);
      } else {
        const { id } = await start({ data: { prompt, style, aspect, duration } });
        setVideoJob(id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
      setPending(false);
    }
  }

  async function animate(sourceId: string, srcPrompt: string, srcAspect: string | null) {
    if (pending) return;
    const a = (ASPECT_RATIOS as readonly string[]).includes(srcAspect ?? "") ? (srcAspect as AspectRatio) : aspect;
    setKind("video");
    setPending(true);
    setError(null);
    try {
      const { id } = await start({ data: { prompt: srcPrompt.slice(0, 2000) || "Bring this image to life", style: "None", aspect: a, duration, sourceId } });
      setVideoJob(id);
      toast.success("Turning your image into a video…");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the video.");
      setPending(false);
    }
  }

  async function download(id: string, url: string, k: string) {
    setDownloading(id);
    const filename = `xenix-${id.slice(0, 8)}.${k === "video" ? "mp4" : "png"}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const file = new File([blob], filename, { type: blob.type });
      const touch = matchMedia("(pointer: coarse)").matches;
      if (touch && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: filename });
          return;
        } catch (e) {
          if ((e as DOMException).name === "AbortError") return;
        }
      }
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 30_000);
    } catch {
      toast.error("Download failed. Opening the file instead.");
      window.open(url, "_blank", "noopener");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-8 md:px-10">
      <p className="mb-2 text-xs uppercase tracking-widest text-cyan">Creative workspace</p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold">Image Studio</h1>
        {usage.data && <p className="text-sm text-muted-foreground">{usage.data.remaining} credits left today</p>}
      </div>
      {usage.data?.plan === "free" && <UpgradePrompt className="mt-6" />}
      <div className="mt-8 grid gap-10 lg:grid-cols-[340px_1fr]">
        <form className="space-y-6" onSubmit={submit}>
          <div className="flex gap-2 rounded-full border border-border p-1" role="tablist" aria-label="Output type">
            {(["image", "video"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={kind === k}
                disabled={pending}
                onClick={() => setKind(k)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm transition-colors",
                  kind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {k === "image" ? <Image className="size-4" /> : <Film className="size-4" />}
                {k === "image" ? "Image" : "Video"}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <Label htmlFor="imagePrompt">Prompt</Label>
            <Textarea id="imagePrompt" placeholder="A cinematic shot of a futuristic city at sunrise…" className="min-h-40" value={prompt} maxLength={2000} onChange={(e) => setPrompt(e.target.value)} required minLength={3} />
          </div>
          <div className="space-y-3">
            <Label htmlFor="imageStyle">Style</Label>
            <select id="imageStyle" value={style} onChange={(e) => setStyle(e.target.value)} className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm">
              {["None", "Photographic", "Cinematic", "Digital art", "Watercolor", "Minimalist"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <Label>Aspect ratio</Label>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((a) => (
                <Pill key={a} active={aspect === a} onClick={() => setAspect(a)} label={`Aspect ratio ${a}`}>
                  {a}
                </Pill>
              ))}
            </div>
          </div>
          {kind === "video" && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label htmlFor="videoDuration">Duration</Label>
                <span className="text-sm text-muted-foreground">{duration}s (max {VIDEO_MAX_SECONDS}s)</span>
              </div>
              <input id="videoDuration" type="range" min={VIDEO_MIN_SECONDS} max={VIDEO_MAX_SECONDS} step={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full accent-primary" />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={pending || !enough || prompt.trim().length < 3}>
            {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {pending ? (kind === "image" ? "Generating…" : "Creating video…") : `Generate ${kind === "image" ? "Image" : "Video"} (${cost} Credits)`}
          </Button>
          {!enough && <p className="text-sm text-warning">Not enough credits left today. Credits refill at midnight UTC.</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </form>
        <div>
          {pending && (
            <div className="mb-5 flex aspect-video items-center justify-center rounded-lg border border-border bg-surface">
              <p role="status" className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="ai-glow-dot" />
                {kind === "image" ? "Creating your image…" : "Creating your video — this can take a minute or two…"}
              </p>
            </div>
          )}
          {gallery.error && <p role="alert">{gallery.error.message}</p>}
          {!pending && !gallery.data?.length && (
            <div className="flex min-h-96 flex-col items-center justify-center border-y border-border text-muted-foreground">
              <Image className="mb-4 size-10" />
              <p className="text-sm">Your images and videos will appear here.</p>
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            {gallery.data?.map((g) => (
              <article key={g.id} className="group relative overflow-hidden rounded-lg border border-border">
                {g.kind === "video" ? (
                  <video src={g.url} controls playsInline className="aspect-square w-full bg-surface object-contain" />
                ) : (
                  <div className="relative">
                    <img src={g.url} alt={g.prompt} loading="lazy" className="aspect-square w-full bg-surface object-contain" />
                    <button
                      type="button"
                      title="Turn into video"
                      aria-label="Turn this image into a video"
                      disabled={pending || remaining !== undefined && remaining < VIDEO_COST}
                      onClick={() => animate(g.id, g.prompt, g.aspect)}
                      className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full border border-cyan/60 bg-background/80 text-cyan shadow-[0_0_18px_-2px_var(--cyan)] backdrop-blur transition-transform hover:scale-110 disabled:opacity-40"
                    >
                      <Plus className="size-5" />
                    </button>
                  </div>
                )}
                <div className="p-4">
                  <p className="line-clamp-2 text-sm">{g.prompt}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {g.kind === "video" ? `Video · ${g.duration ?? ""}s` : "Image"} · {g.aspect}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Download"
                      aria-label="Download"
                      disabled={downloading === g.id}
                      onClick={() => download(g.id, g.url, g.kind)}
                    >
                      {downloading === g.id ? <Loader2 className="animate-spin" /> : <Download />}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
