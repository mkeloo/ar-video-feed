// mediapipe.d.ts
declare module "@mediapipe/face_mesh/face_mesh.js" {
    import type { FaceMesh as FM } from "@mediapipe/face_mesh";
    export const FaceMesh: typeof FM;
    // if you need Results too, you can re-export its type
    export type Results = import("@mediapipe/face_mesh").Results;
}