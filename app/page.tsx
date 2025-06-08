"use client";
import { useEffect, useRef } from "react";

const FILTERS = [
  "/deepar-resources/masks/Emotions_Exaggerator.deepar",
];

export default function ARMirror() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sdkRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let deepARInstance: any;
    (async () => {
      const { initialize } = await import("deepar");
      deepARInstance = await initialize({
        licenseKey: process.env.NEXT_PUBLIC_DEEP_AR_SDK_KEY!,
        canvas: canvasRef.current,
        segmentationEnabled: true,
        beautyEnabled: true,
        facesTracking: true,
        // ▶️ Point at your local folder under public/deepar-resources
        // rootPath: "/deepar-resources",
      });
      sdkRef.current = deepARInstance;

      await deepARInstance.startCamera();
      deepARInstance.switchEffect(FILTERS[0]);
    })().catch(console.error);

    return () => deepARInstance?.close();
  }, []);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      const sdk = sdkRef.current;
      if (!sdk) return;
      idx = (idx + 1) % FILTERS.length;
      sdk.switchEffect(FILTERS[idx]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <canvas ref={canvasRef} className="w-screen h-screen object-cover bg-black" />
  );
}