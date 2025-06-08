"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function KidsARMirrorPlayground() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [currentEffect, setCurrentEffect] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const effects = [
        {
            name: "Rainbow Waves",
            fragmentShader: `
                precision mediump float;
                uniform sampler2D videoTexture;
                uniform float time;
                varying vec2 vUv;

                void main() {
                    vec2 uv = vUv;
                    uv.y += sin(uv.x * 8.0 + time * 3.0) * 0.03;
                    uv.x += cos(uv.y * 8.0 + time * 3.0) * 0.03;
                    
                    vec4 video = texture2D(videoTexture, uv);
                    float rainbow = sin(uv.x * 5.0 + time) * 0.5 + 0.5;
                    vec3 rainbowColor = vec3(
                        sin(rainbow * 6.28 + 0.0) * 0.5 + 0.5,
                        sin(rainbow * 6.28 + 2.09) * 0.5 + 0.5,
                        sin(rainbow * 6.28 + 4.18) * 0.5 + 0.5
                    );
                    
                    gl_FragColor = vec4(mix(video.rgb, rainbowColor, 0.3), video.a);
                }
            `
        },
        {
            name: "Bubbly Fun",
            fragmentShader: `
                precision mediump float;
                uniform sampler2D videoTexture;
                uniform float time;
                varying vec2 vUv;

                void main() {
                    vec2 uv = vUv;
                    
                    // Create bubble effect
                    float bubble1 = length(uv - vec2(0.3 + sin(time) * 0.2, 0.3 + cos(time * 0.7) * 0.2));
                    float bubble2 = length(uv - vec2(0.7 + cos(time * 0.8) * 0.2, 0.6 + sin(time * 0.6) * 0.2));
                    float bubble3 = length(uv - vec2(0.5 + sin(time * 1.2) * 0.3, 0.8 + cos(time * 0.9) * 0.1));
                    
                    float bubbles = smoothstep(0.1, 0.08, bubble1) + smoothstep(0.12, 0.1, bubble2) + smoothstep(0.08, 0.06, bubble3);
                    
                    // Distort UV based on bubbles
                    uv += vec2(sin(uv.y * 15.0 + time * 2.0), cos(uv.x * 15.0 + time * 2.0)) * 0.01 * bubbles;
                    
                    vec4 video = texture2D(videoTexture, uv);
                    vec3 bubbleColor = vec3(0.3, 0.8, 1.0);
                    
                    gl_FragColor = vec4(mix(video.rgb, bubbleColor, bubbles * 0.4), video.a);
                }
            `
        },
        {
            name: "Kaleidoscope Magic",
            fragmentShader: `
                precision mediump float;
                uniform sampler2D videoTexture;
                uniform float time;
                varying vec2 vUv;

                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    vec2 uv = vUv - center;
                    
                    float angle = atan(uv.y, uv.x) + time * 0.5;
                    float radius = length(uv);
                    
                    // Create kaleidoscope effect
                    angle = mod(angle, 1.047) - 0.524; // 60 degree segments
                    if (angle < 0.0) angle = -angle;
                    
                    vec2 kaleidoUv = vec2(cos(angle), sin(angle)) * radius + center;
                    kaleidoUv = fract(kaleidoUv * 2.0);
                    
                    vec4 video = texture2D(videoTexture, kaleidoUv);
                    
                    // Add some sparkle
                    float sparkle = sin(kaleidoUv.x * 20.0 + time * 3.0) * sin(kaleidoUv.y * 20.0 + time * 2.0);
                    sparkle = pow(max(sparkle, 0.0), 8.0);
                    
                    vec3 sparkleColor = vec3(1.0, 0.8, 0.2);
                    gl_FragColor = vec4(mix(video.rgb, sparkleColor, sparkle * 0.5), video.a);
                }
            `
        },
        {
            name: "Cartoon Swirl",
            fragmentShader: `
                precision mediump float;
                uniform sampler2D videoTexture;
                uniform float time;
                varying vec2 vUv;

                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    vec2 uv = vUv - center;
                    
                    float dist = length(uv);
                    float angle = atan(uv.y, uv.x) + dist * 5.0 + time;
                    
                    vec2 swirlUv = center + vec2(cos(angle), sin(angle)) * dist;
                    
                    vec4 video = texture2D(videoTexture, swirlUv);
                    
                    // Add cartoon-like color enhancement
                    video.rgb = pow(video.rgb, vec3(0.7));
                    video.rgb *= 1.3;
                    
                    // Add some color bands
                    float bands = sin(dist * 15.0 + time * 2.0) * 0.1 + 0.9;
                    video.rgb *= bands;
                    
                    gl_FragColor = vec4(video.rgb, video.a);
                }
            `
        },
        {
            name: "Glitter Storm",
            fragmentShader: `
                precision mediump float;
                uniform sampler2D videoTexture;
                uniform float time;
                varying vec2 vUv;

                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }

                void main() {
                    vec2 uv = vUv;
                    
                    // Add slight wiggle
                    uv += vec2(sin(uv.y * 20.0 + time * 4.0), cos(uv.x * 20.0 + time * 4.0)) * 0.005;
                    
                    vec4 video = texture2D(videoTexture, uv);
                    
                    // Create glitter effect
                    vec2 glitterUv = floor(uv * 40.0) / 40.0;
                    float glitter = random(glitterUv + floor(time * 3.0));
                    glitter = step(0.95, glitter);
                    
                    // Animated glitter colors
                    vec3 glitterColor = vec3(
                        sin(time * 2.0 + glitterUv.x * 10.0) * 0.5 + 0.5,
                        cos(time * 2.5 + glitterUv.y * 10.0) * 0.5 + 0.5,
                        sin(time * 3.0 + (glitterUv.x + glitterUv.y) * 10.0) * 0.5 + 0.5
                    );
                    
                    // Enhance video colors
                    video.rgb = mix(video.rgb, video.rgb * 1.5, 0.3);
                    
                    gl_FragColor = vec4(mix(video.rgb, glitterColor, glitter * 0.8), video.a);
                }
            `
        }
    ];

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
            fragmentShader: effects[currentEffect].fragmentShader,
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
            material.uniforms.time.value += 0.016;
            renderer.render(scene, camera);
            animationFrame = requestAnimationFrame(animate);
        };
        animate();

        // Effect rotation timer with smooth transition
        const effectTimer = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentEffect((prev) => (prev + 1) % effects.length);
                setIsTransitioning(false);
            }, 300);
        }, 5000);

        // Cleanup
        return () => {
            cancelAnimationFrame(animationFrame);
            clearInterval(effectTimer);
            videoTexture.dispose();
            renderer.dispose();
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream)
                    .getTracks()
                    .forEach((t) => t.stop());
            }
        };
    }, [currentEffect]);

    const handleEffectChange = (index: number) => {
        if (index !== currentEffect && !isTransitioning) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentEffect(index);
                setIsTransitioning(false);
            }, 300);
        }
    };

    return (
        <>
            <video ref={videoRef} className="hidden" playsInline muted />
            <div ref={canvasRef} className="w-full h-full"></div>

            {/* Effect name display */}
            <div className={`absolute top-4 left-4 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                }`}>
                <h2 className="text-white font-bold text-lg">{effects[currentEffect].name}</h2>
                <div className="flex gap-1 mt-1">
                    {effects.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentEffect ? 'bg-white scale-125' : 'bg-white/40 scale-100'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Manual controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {effects.map((effect, index) => (
                    <button
                        key={index}
                        onClick={() => handleEffectChange(index)}
                        disabled={isTransitioning}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${index === currentEffect
                            ? 'bg-white text-black shadow-lg scale-105'
                            : 'bg-white/20 text-white hover:bg-white/30'
                            } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
                    >
                        {effect.name}
                    </button>
                ))}
            </div>
        </>
    );
}