// components/PersonalizedAvatarMirror.tsx
"use client";
import { useEffect, useRef, useState } from "react";

interface FaceLandmark {
    x: number;
    y: number;
    z: number;
}

interface PersonAnalysis {
    faceShape: 'round' | 'oval' | 'square' | 'long';
    eyeSize: 'small' | 'medium' | 'large';
    eyeDistance: 'close' | 'normal' | 'wide';
    noseSize: 'small' | 'medium' | 'large';
    mouthSize: 'small' | 'medium' | 'large';
    skinTone: string;
    hairStyle: 'short' | 'medium' | 'long' | 'curly';
    facialHair: boolean;
    smiling: boolean;
    eyebrowThickness: 'thin' | 'medium' | 'thick';
}

export default function PersonalizedAvatarMirror() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentPerson, setCurrentPerson] = useState<PersonAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeFace = (landmarks: FaceLandmark[], w: number, h: number): PersonAnalysis => {
        // Face dimensions
        const faceWidth = Math.abs(landmarks[234].x - landmarks[454].x) * w;
        const faceHeight = Math.abs(landmarks[10].y - landmarks[152].y) * h;
        const jawWidth = Math.abs(landmarks[172].x - landmarks[397].x) * w;
        const faceRatio = faceHeight / faceWidth;
        const jawRatio = jawWidth / faceWidth;

        // Determine face shape
        let faceShape: PersonAnalysis['faceShape'] = 'oval';
        if (faceRatio > 1.3) faceShape = 'long';
        else if (faceRatio < 1.1 && jawRatio > 0.85) faceShape = 'round';
        else if (jawRatio > 0.9) faceShape = 'square';

        // Eye analysis
        const leftEyeWidth = Math.abs(landmarks[33].x - landmarks[133].x) * w;
        const rightEyeWidth = Math.abs(landmarks[362].x - landmarks[263].x) * w;
        const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2;
        const eyeDistance = Math.abs(landmarks[33].x - landmarks[362].x) * w;

        const eyeSize = avgEyeWidth > faceWidth * 0.15 ? 'large' :
            avgEyeWidth < faceWidth * 0.12 ? 'small' : 'medium';

        const eyeDistanceType = eyeDistance > faceWidth * 0.45 ? 'wide' :
            eyeDistance < faceWidth * 0.35 ? 'close' : 'normal';

        // Nose analysis
        const noseWidth = Math.abs(landmarks[219].x - landmarks[439].x) * w;
        const noseSize = noseWidth > faceWidth * 0.25 ? 'large' :
            noseWidth < faceWidth * 0.18 ? 'small' : 'medium';

        // Mouth analysis
        const mouthWidth = Math.abs(landmarks[61].x - landmarks[291].x) * w;
        const mouthHeight = Math.abs(landmarks[13].y - landmarks[14].y) * h;
        const mouthSize = mouthWidth > faceWidth * 0.25 ? 'large' :
            mouthWidth < faceWidth * 0.18 ? 'small' : 'medium';

        // Smile detection
        const mouthCornerLeft = landmarks[61];
        const mouthCornerRight = landmarks[291];
        const mouthCenter = landmarks[13];
        const smiling = (mouthCornerLeft.y + mouthCornerRight.y) / 2 < mouthCenter.y - 0.005;

        // Eyebrow analysis
        const leftBrowHeight = Math.abs(landmarks[70].y - landmarks[63].y) * h;
        const rightBrowHeight = Math.abs(landmarks[300].y - landmarks[293].y) * h;
        const avgBrowHeight = (leftBrowHeight + rightBrowHeight) / 2;
        const eyebrowThickness = avgBrowHeight > 8 ? 'thick' : avgBrowHeight < 4 ? 'thin' : 'medium';

        // Generate skin tone (simplified - in real app you'd use more sophisticated color analysis)
        const skinTones = ['#FDBCB4', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#ffe0bd'];
        const skinTone = skinTones[Math.floor(Math.random() * skinTones.length)];

        // Hair style (randomized for demo - in real app you'd analyze hair region)
        const hairStyles: PersonAnalysis['hairStyle'][] = ['short', 'medium', 'long', 'curly'];
        const hairStyle = hairStyles[Math.floor(Math.random() * hairStyles.length)];

        return {
            faceShape,
            eyeSize,
            eyeDistance: eyeDistanceType,
            noseSize,
            mouthSize,
            skinTone,
            hairStyle,
            facialHair: Math.random() > 0.7, // 30% chance
            smiling,
            eyebrowThickness
        };
    };

    const drawPersonalizedAvatar = (landmarks: FaceLandmark[], analysis: PersonAnalysis) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        const w = canvasRef.current!.width;
        const h = canvasRef.current!.height;

        // Calculate face center and size
        const xs = landmarks.map(l => l.x * w);
        const ys = landmarks.map(l => l.y * h);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const baseRadius = Math.max(maxX - minX, maxY - minY) * 0.6;

        // Draw hair first (behind head)
        drawHair(ctx, centerX, centerY, baseRadius, analysis);

        // Draw face with personalized shape
        drawFaceShape(ctx, centerX, centerY, baseRadius, analysis);

        // Draw facial features
        drawEyes(ctx, landmarks, baseRadius, analysis);
        drawEyebrows(ctx, landmarks, baseRadius, analysis);
        drawNose(ctx, landmarks, baseRadius, analysis);
        drawMouth(ctx, landmarks, baseRadius, analysis);

        // Draw facial hair if present
        if (analysis.facialHair) {
            drawFacialHair(ctx, landmarks, baseRadius, analysis);
        }
    };

    const drawFaceShape = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, analysis: PersonAnalysis) => {
        ctx.fillStyle = analysis.skinTone;
        ctx.beginPath();

        switch (analysis.faceShape) {
            case 'round':
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                break;
            case 'long':
                ctx.ellipse(centerX, centerY, radius * 0.8, radius * 1.2, 0, 0, 2 * Math.PI);
                break;
            case 'square':
                ctx.roundRect(centerX - radius, centerY - radius, radius * 2, radius * 2, radius * 0.2);
                break;
            default: // oval
                ctx.ellipse(centerX, centerY, radius * 0.9, radius * 1.1, 0, 0, 2 * Math.PI);
        }
        ctx.fill();

        // Add subtle shading
        ctx.fillStyle = `${analysis.skinTone}88`;
        ctx.beginPath();
        ctx.ellipse(centerX + radius * 0.3, centerY + radius * 0.3, radius * 0.3, radius * 0.5, 0, 0, 2 * Math.PI);
        ctx.fill();
    };

    const drawHair = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, analysis: PersonAnalysis) => {
        const hairColors = ['#2C1810', '#8B4513', '#DAA520', '#FF4500', '#000000', '#696969'];
        ctx.fillStyle = hairColors[Math.floor(Math.random() * hairColors.length)];

        switch (analysis.hairStyle) {
            case 'short':
                ctx.beginPath();
                ctx.arc(centerX, centerY - radius * 0.3, radius * 1.1, Math.PI, 2 * Math.PI);
                ctx.fill();
                break;
            case 'medium':
                ctx.beginPath();
                ctx.ellipse(centerX, centerY - radius * 0.2, radius * 1.2, radius * 0.8, 0, Math.PI, 2 * Math.PI);
                ctx.fill();
                break;
            case 'long':
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, radius * 1.3, radius * 1.5, 0, 0, Math.PI);
                ctx.fill();
                break;
            case 'curly':
                // Draw multiple circles for curly effect
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const x = centerX + Math.cos(angle) * radius * 0.9;
                    const y = centerY - radius * 0.3 + Math.sin(angle) * radius * 0.3;
                    ctx.beginPath();
                    ctx.arc(x, y, radius * 0.2, 0, 2 * Math.PI);
                    ctx.fill();
                }
                break;
        }
    };

    const drawEyes = (ctx: CanvasRenderingContext2D, landmarks: FaceLandmark[], radius: number, analysis: PersonAnalysis) => {
        const w = canvasRef.current!.width;
        const h = canvasRef.current!.height;
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const eyeRadius = analysis.eyeSize === 'large' ? radius * 0.18 :
            analysis.eyeSize === 'small' ? radius * 0.12 : radius * 0.15;

        [leftEye, rightEye].forEach((eye) => {
            // Eye white
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(eye.x * w, eye.y * h, eyeRadius, 0, 2 * Math.PI);
            ctx.fill();

            // Iris (colored part)
            const irisColors = ['#8B4513', '#228B22', '#4169E1', '#808080', '#DAA520'];
            ctx.fillStyle = irisColors[Math.floor(Math.random() * irisColors.length)];
            ctx.beginPath();
            ctx.arc(eye.x * w, eye.y * h, eyeRadius * 0.6, 0, 2 * Math.PI);
            ctx.fill();

            // Pupil
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(eye.x * w, eye.y * h, eyeRadius * 0.3, 0, 2 * Math.PI);
            ctx.fill();

            // Eye highlight
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(eye.x * w - eyeRadius * 0.2, eye.y * h - eyeRadius * 0.2, eyeRadius * 0.15, 0, 2 * Math.PI);
            ctx.fill();
        });
    };

    const drawEyebrows = (ctx: CanvasRenderingContext2D, landmarks: FaceLandmark[], radius: number, analysis: PersonAnalysis) => {
        const w = canvasRef.current!.width;
        const h = canvasRef.current!.height;

        const browThickness = analysis.eyebrowThickness === 'thick' ? 6 :
            analysis.eyebrowThickness === 'thin' ? 2 : 4;

        ctx.strokeStyle = '#2C1810';
        ctx.lineWidth = browThickness;
        ctx.lineCap = 'round';

        // Left eyebrow
        ctx.beginPath();
        ctx.moveTo(landmarks[70].x * w, landmarks[70].y * h);
        ctx.lineTo(landmarks[63].x * w, landmarks[63].y * h);
        ctx.stroke();

        // Right eyebrow
        ctx.beginPath();
        ctx.moveTo(landmarks[300].x * w, landmarks[300].y * h);
        ctx.lineTo(landmarks[293].x * w, landmarks[293].y * h);
        ctx.stroke();
    };

    const drawNose = (ctx: CanvasRenderingContext2D, landmarks: FaceLandmark[], radius: number, analysis: PersonAnalysis) => {
        const w = canvasRef.current!.width;
        const h = canvasRef.current!.height;
        const noseTip = landmarks[19];
        const noseLeft = landmarks[219];
        const noseRight = landmarks[439];

        const noseWidth = analysis.noseSize === 'large' ? radius * 0.15 :
            analysis.noseSize === 'small' ? radius * 0.08 : radius * 0.12;

        ctx.fillStyle = '#D2B48C';
        ctx.beginPath();
        ctx.ellipse(noseTip.x * w, noseTip.y * h, noseWidth, radius * 0.1, 0, 0, 2 * Math.PI);
        ctx.fill();

        // Nostrils
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.arc(noseLeft.x * w, noseLeft.y * h, 2, 0, 2 * Math.PI);
        ctx.arc(noseRight.x * w, noseRight.y * h, 2, 0, 2 * Math.PI);
        ctx.fill();
    };

    const drawMouth = (ctx: CanvasRenderingContext2D, landmarks: FaceLandmark[], radius: number, analysis: PersonAnalysis) => {
        const w = canvasRef.current!.width;
        const h = canvasRef.current!.height;
        const mouthLeft = landmarks[61];
        const mouthRight = landmarks[291];
        const mouthTop = landmarks[13];
        const mouthBottom = landmarks[14];

        const mouthWidth = analysis.mouthSize === 'large' ? radius * 0.3 :
            analysis.mouthSize === 'small' ? radius * 0.15 : radius * 0.22;

        if (analysis.smiling) {
            // Smiling mouth
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc((mouthLeft.x + mouthRight.x) / 2 * w, (mouthTop.y + mouthBottom.y) / 2 * h, mouthWidth, 0.2, Math.PI - 0.2);
            ctx.stroke();
        } else {
            // Neutral mouth
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.ellipse((mouthLeft.x + mouthRight.x) / 2 * w, (mouthTop.y + mouthBottom.y) / 2 * h, mouthWidth, radius * 0.05, 0, 0, 2 * Math.PI);
            ctx.fill();
        }
    };

    const drawFacialHair = (ctx: CanvasRenderingContext2D, landmarks: FaceLandmark[], radius: number, analysis: PersonAnalysis) => {
        const w = canvasRef.current!.width;
        const h = canvasRef.current!.height;

        ctx.fillStyle = '#2C1810';
        ctx.beginPath();
        // Simple beard/mustache
        ctx.ellipse(landmarks[152].x * w, landmarks[152].y * h + 20, radius * 0.4, radius * 0.2, 0, 0, 2 * Math.PI);
        ctx.fill();
    };

    useEffect(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const FaceMesh = (window as any).FaceMesh;
        const Camera = (window as any).Camera;
        if (!FaceMesh || !Camera) {
            console.error("MediaPipe FaceMesh or CameraUtils not loaded");
            return;
        }

        const faceMesh = new FaceMesh({
            locateFile: (file: string) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });
        faceMesh.setOptions({ selfieMode: true, maxNumFaces: 1, refineLandmarks: true });

        faceMesh.onResults((results: any) => {
            const ctx = canvasRef.current!.getContext("2d");
            if (!ctx) return;

            ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

            // Draw background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvasRef.current!.height);
            gradient.addColorStop(0, '#FFE4E1');
            gradient.addColorStop(1, '#E0E6FF');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

            if (results.multiFaceLandmarks?.length) {
                const landmarks = results.multiFaceLandmarks[0];
                const w = canvasRef.current!.width;
                const h = canvasRef.current!.height;

                // Analyze face and create personalized avatar
                if (!isAnalyzing) {
                    setIsAnalyzing(true);
                    const analysis = analyzeFace(landmarks, w, h);
                    setCurrentPerson(analysis);
                    setTimeout(() => setIsAnalyzing(false), 1000); // Prevent constant re-analysis
                }

                if (currentPerson) {
                    drawPersonalizedAvatar(landmarks, currentPerson);
                }
            } else {
                // No face detected
                setCurrentPerson(null);
                ctx.fillStyle = '#666';
                ctx.font = '32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('👋 Step into view!', canvasRef.current!.width / 2, canvasRef.current!.height / 2);
            }
        });

        const cam = new Camera(videoRef.current, {
            onFrame: async () => await faceMesh.send({ image: videoRef.current! }),
            width: 640,
            height: 480
        });
        cam.start();

        return () => {
            cam.stop();
            faceMesh.close();
            (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
        };
    }, [currentPerson, isAnalyzing]);

    return (
        <div className="relative w-screen h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
                <h1 className="text-3xl font-bold text-white text-center mb-6">
                    ✨ AI Avatar Generator ✨
                </h1>
                <video ref={videoRef} className="hidden" playsInline muted />
                <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    className="rounded-2xl shadow-lg"
                />
                {currentPerson && (
                    <div className="mt-4 text-white text-center bg-black/20 rounded-xl p-4 backdrop-blur-sm">
                        <h3 className="font-bold mb-2">Your Avatar Analysis:</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Face: {currentPerson.faceShape}</div>
                            <div>Eyes: {currentPerson.eyeSize}</div>
                            <div>Hair: {currentPerson.hairStyle}</div>
                            <div>Mood: {currentPerson.smiling ? '😊 Happy' : '😐 Neutral'}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}