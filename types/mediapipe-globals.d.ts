export { }; // make it a module

declare global {
    interface Window {
        FaceMesh: typeof import("@mediapipe/face_mesh").FaceMesh;
        Camera: typeof import("@mediapipe/camera_utils").Camera;
    }
}