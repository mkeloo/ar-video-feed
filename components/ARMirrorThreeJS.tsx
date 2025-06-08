"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ARMirrorThreeJS() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !videoRef.current) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        // Three.js renderer
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(width, height);
        canvasRef.current.appendChild(renderer.domElement);

        // Camera and scene
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        camera.position.z = 1;
        const scene = new THREE.Scene();

        // Video texture setup
        const videoTexture = new THREE.VideoTexture(videoRef.current);
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                videoTexture: { value: videoTexture },
                time: { value: 0.0 },
            },
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        precision mediump float;
        uniform sampler2D videoTexture;
        uniform float time;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          uv.y += sin(uv.x * 10.0 + time * 2.0) * 0.02;
          uv.x += cos(uv.y * 10.0 + time * 2.0) * 0.02;
          gl_FragColor = texture2D(videoTexture, uv);
        }
      `,
        });

        const quad = new THREE.Mesh(geometry, material);
        scene.add(quad);

        // Webcam capture
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            videoRef.current!.srcObject = stream;
            videoRef.current!.play();
        });

        // Animation loop
        let animationFrame: number;
        const animate = () => {
            material.uniforms.time.value += 0.01;
            renderer.render(scene, camera);
            animationFrame = requestAnimationFrame(animate);
        };
        animate();

        // Cleanup
        return () => {
            cancelAnimationFrame(animationFrame);
            videoTexture.dispose();
            renderer.dispose();
            (videoRef.current!.srcObject as MediaStream)
                .getTracks()
                .forEach((t) => t.stop());
        };
    }, []);

    return (
        <>
            <video ref={videoRef} className="hidden" playsInline muted />
            <div ref={canvasRef} className="w-screen h-screen bg-black"></div>
        </>
    );
}