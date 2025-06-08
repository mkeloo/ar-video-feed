// components/MeshComponent.tsx
"use client";
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export default function MeshComponent() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

    useEffect(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        canvasRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Add a basic 3D object (e.g. glasses model or cube)
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        camera.position.z = 5;

        // Start MediaPipe FaceMesh
        const faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });
        faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, selfieMode: true });
        faceMesh.onResults((results) => {
            if (results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];

                // Example: align 3D object to nose
                const nose = landmarks[1]; // index 1 = tip of nose
                cube.position.set((nose.x - 0.5) * 5, -(nose.y - 0.5) * 5, -nose.z * 5);
            }
            renderer.render(scene, camera);
        });

        const mpCamera = new Camera(videoRef.current, {
            onFrame: async () => {
                await faceMesh.send({ image: videoRef.current! });
            },
            width: 640,
            height: 480
        });
        mpCamera.start();

    }, []);

    return (
        <div className="w-screen h-screen bg-black relative">
            <video ref={videoRef} className="hidden" autoPlay playsInline muted />
            <div ref={canvasRef} className="absolute inset-0" />
        </div>
    );
}