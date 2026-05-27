import { useCallback, useEffect, useRef, useState } from "react";

// Processing resolution — small for performance, 16:9 matches typical camera AR
const W = 160;
const H = 90;
// Per-channel brightness diff (0–255) to count a pixel as "in motion"
const THRESHOLD = 25;
// Fraction of pixels that must be in motion before we declare isMoving=true
const RATIO_MIN = 0.005;

export type Motion = {
  isMoving: boolean;
  centroid: { x: number; y: number } | null; // normalized 0..1
  ratio: number; // fraction of pixels in motion
};

type InternalRefs = {
  processCtx: OffscreenCanvasRenderingContext2D;
  motionCanvas: OffscreenCanvas;
  motionCtx: OffscreenCanvasRenderingContext2D;
  motionImg: ImageData;
  prevBuf: Uint8ClampedArray;
  hasPrev: boolean;
};

export function useMotionDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const internals = useRef<InternalRefs | null>(null);

  const [motion, setMotion] = useState<Motion>({
    isMoving: false,
    centroid: null,
    ratio: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const processCanvas = new OffscreenCanvas(W, H);
    const processCtx = processCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    const motionCanvas = new OffscreenCanvas(W, H);
    const motionCtx = motionCanvas.getContext("2d");
    if (!processCtx || !motionCtx) return;
    internals.current = {
      processCtx,
      motionCanvas,
      motionCtx,
      motionImg: new ImageData(W, H),
      prevBuf: new Uint8ClampedArray(W * H * 4),
      hasPrev: false,
    };
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("カメラ API が利用できません (HTTPS が必要です)");
      return;
    }
    let stream: MediaStream | null = null;
    let active = true;
    const video = videoRef.current;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (!active || !video) return;
        video.srcObject = stream;
        await video.play();
        if (!active) return;
        setReady(true);
      } catch (e) {
        // AbortError はクリーンアップ時に play() が中断された際の正常な挙動
        if (!active) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "カメラエラー");
      }
    })();
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
      if (video) {
        video.pause();
        video.srcObject = null;
      }
    };
  }, []);

  const tick = useCallback(() => {
    rafRef.current = requestAnimationFrame(tick);

    const video = videoRef.current;
    const overlay = overlayRef.current;
    const r = internals.current;
    if (!video || !overlay || !r) return;
    if (video.readyState < 2) return;

    const { processCtx, motionCanvas, motionCtx, motionImg, prevBuf } = r;

    processCtx.drawImage(video, 0, 0, W, H);
    const curr = processCtx.getImageData(0, 0, W, H).data;

    const overlayCtx = overlay.getContext("2d");
    if (!overlayCtx) return;
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

    if (r.hasPrev) {
      const pixels = motionImg.data;
      pixels.fill(0);

      let count = 0;
      let sumX = 0;
      let sumY = 0;
      let sumW = 0;

      for (let i = 0; i < W * H; i++) {
        const p = i * 4;
        const diff =
          (Math.abs(curr[p] - prevBuf[p]) +
            Math.abs(curr[p + 1] - prevBuf[p + 1]) +
            Math.abs(curr[p + 2] - prevBuf[p + 2])) /
          3;
        if (diff > THRESHOLD) {
          count++;
          const x = i % W;
          const y = Math.floor(i / W);
          sumX += x * diff;
          sumY += y * diff;
          sumW += diff;
          pixels[p] = 255;
          pixels[p + 1] = 100;
          pixels[p + 2] = 0;
          pixels[p + 3] = 160;
        }
      }

      // Scale motion pixels up to overlay size via drawImage
      motionCtx.putImageData(motionImg, 0, 0);
      overlayCtx.drawImage(motionCanvas, 0, 0, overlay.width, overlay.height);

      const ratio = count / (W * H);
      const isMoving = ratio > RATIO_MIN;
      const centroid = isMoving && sumW > 0 ? { x: sumX / sumW / W, y: sumY / sumW / H } : null;

      if (centroid) {
        const cx = centroid.x * overlay.width;
        const cy = centroid.y * overlay.height;
        overlayCtx.strokeStyle = "rgba(255, 220, 0, 0.9)";
        overlayCtx.lineWidth = 2;
        overlayCtx.beginPath();
        overlayCtx.arc(cx, cy, 14, 0, Math.PI * 2);
        overlayCtx.stroke();
        overlayCtx.beginPath();
        overlayCtx.moveTo(cx - 20, cy);
        overlayCtx.lineTo(cx + 20, cy);
        overlayCtx.moveTo(cx, cy - 20);
        overlayCtx.lineTo(cx, cy + 20);
        overlayCtx.stroke();
      }

      setMotion({ isMoving, centroid, ratio });
    }

    prevBuf.set(curr);
    r.hasPrev = true;
  }, []);

  useEffect(() => {
    if (!ready) return;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready, tick]);

  return { videoRef, overlayRef, motion, error };
}
