"use client";
import { useEffect, useRef } from "react";

// ✅ Include the .deepar extension and ensure proper path
const FILTERS = [
    "/deepar-resources/masks/Viking_Helmet_PBR/viking_helmet.deepar",
    // "/deepar-resources/masks/Emotions_Exaggerator/Emotions_Exaggerator.deepar",
    // "/deepar-resources/masks/Humanoid/Humanoid.deepar",
    "/deepar-resources/masks/Fire Effect/Fire_Effect.deepar",
];

export default function ARMirror() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sdkRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        let deepARInstance: any;
        (async () => {
            try {
                const { initialize } = await import("deepar");

                deepARInstance = await initialize({
                    licenseKey: process.env.NEXT_PUBLIC_DEEP_AR_SDK_KEY!,
                    canvas: canvasRef.current!,
                    segmentationEnabled: true,
                    beautyEnabled: true,
                    facesTracking: true,
                    // ✅ Don't set rootPath - let DeepAR load core files from CDN
                    // rootPath: "/deepar-resources/",
                    // ✅ Explicitly set the core path to CDN
                    additionalOptions: {
                        hint: "try-no-wasm-simd"
                    }
                });

                sdkRef.current = deepARInstance;

                // ✅ Wait for camera to start before switching effects
                await deepARInstance.startCamera();

                // ✅ Add a small delay to ensure everything is initialized
                setTimeout(() => {
                    deepARInstance.switchEffect(FILTERS[0]);
                }, 1500);

            } catch (error) {
                console.error("DeepAR initialization failed:", error);
            }
        })();

        return () => {
            if (deepARInstance) {
                deepARInstance.close();
            }
        };
    }, []);

    useEffect(() => {
        let idx = 0;
        const interval = setInterval(() => {
            const sdk = sdkRef.current;
            if (!sdk) return;

            idx = (idx + 1) % FILTERS.length;

            // ✅ Add error handling for effect switching
            try {
                sdk.switchEffect(FILTERS[idx]);
            } catch (error) {
                console.error("Failed to switch effect:", error);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-screen h-screen bg-black">
            <canvas
                ref={canvasRef}
                className="w-full h-full object-cover"
            />
            {/* ✅ Optional: Add loading indicator */}
            {/* <div className="absolute top-4 left-4 text-white text-sm">
        AR Mirror - Loading...
      </div> */}
        </div>
    );
}