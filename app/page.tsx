"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
// Import directly from the UMD ES build
import { FaceMesh } from "@mediapipe/face_mesh/face_mesh.js";

export default function ARMirror() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    // ── Three.js setup ─────────────────────────────────
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scene = new THREE.Scene();

    // ── Create video background ─────────────────────────
    const videoTexture = new THREE.VideoTexture(videoRef.current!);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;
    scene.background = videoTexture;
    const cam3D = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    cam3D.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    canvasRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 10, 10);
    scene.add(dirLight);

    // Debug cube to confirm rendering
    const debugCube = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshNormalMaterial()
    );
    debugCube.position.set(-1.5, 0, 0);
    scene.add(debugCube);

    // ── Load your glasses model ─────────────────────────
    const loader = new GLTFLoader();
    const glasses = new THREE.Group();
    loader.load(
      "/models/PixelGlasses.glb",
      (gltf: any) => {
        const model = gltf.scene;
        model.scale.set(1.5, 1.5, 1.5);
        glasses.add(model);
        scene.add(glasses);
      },
      undefined,
      console.error
    );

    // ── MediaPipe via window globals ────────────────────
    const { FaceMesh } = window as any;
    const faceMesh = new FaceMesh({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, selfieMode: true });

    faceMesh.onResults((results: any) => {
      if (results.multiFaceLandmarks?.length) {
        const lm = results.multiFaceLandmarks[0];
        const leftEye = lm[33];
        const rightEye = lm[263];

        const mx = (leftEye.x + rightEye.x) / 2 - 0.5;
        const my = -(leftEye.y + rightEye.y) / 2 + 0.5;
        const mz = -(leftEye.z + rightEye.z) / 2;

        const eyeDist = Math.hypot(
          leftEye.x - rightEye.x,
          leftEye.y - rightEye.y,
          leftEye.z - rightEye.z
        );

        const angle = Math.atan2(
          leftEye.y - rightEye.y,
          leftEye.x - rightEye.x
        );

        glasses.position.set(mx * 5, my * 5, mz * 5);
        glasses.scale.set(eyeDist * 5, eyeDist * 5, eyeDist * 5);
        glasses.rotation.set(0, 0, angle);
      }
    });

    // ── Start webcam & animation loop ─────────────────
    let animationFrame: number;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current!.srcObject = stream;
        await videoRef.current!.play();

        const tick = async () => {
          debugCube.rotation.y += 0.01;
          await faceMesh.send({ image: videoRef.current! });
          renderer.render(scene, cam3D);
          animationFrame = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        console.error(e);
      }
    };
    start();

    // ── Cleanup ─────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrame);
      renderer.dispose();
      faceMesh.close();
      const tracks = (videoRef.current!.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      <video ref={videoRef} className="hidden" playsInline muted />
      <div ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
