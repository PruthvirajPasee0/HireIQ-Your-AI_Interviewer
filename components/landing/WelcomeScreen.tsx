"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const TOTAL_SECTIONS = 2;

const SECTIONS_DATA = [
  {
    title: "HIREIQ",
    subtitle1: "Where AI meets preparation,",
    subtitle2: "we shape the interviews of tomorrow",
  },
  {
    title: "PREPARE",
    subtitle1: "Beyond the boundaries of practice,",
    subtitle2: "lies your path to success",
  },
  {
    title: "SUCCEED",
    subtitle1: "In the space between effort and outcome,",
    subtitle2: "we find the essence of true growth",
  },
];

interface Props {
  children: React.ReactNode;
}

export default function WelcomeScreen({ children }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef<HTMLDivElement>(null);

  const smoothCameraPos = useRef({ x: 0, y: 30, z: 100 });

  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [fullyHidden, setFullyHidden] = useState(false);

  const threeRefs = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    composer: EffectComposer | null;
    stars: THREE.Points[];
    nebula: THREE.Mesh | null;
    mountains: THREE.Mesh[];
    locations: number[];
    animationId: number | null;
    targetCameraX: number;
    targetCameraY: number;
    targetCameraZ: number;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    stars: [],
    nebula: null,
    mountains: [],
    locations: [],
    animationId: null,
    targetCameraX: 0,
    targetCameraY: 30,
    targetCameraZ: 300,
  });

  // Dismiss welcome and reveal landing
  const dismissWelcome = useCallback(() => {
    if (welcomeDone) return;
    setWelcomeDone(true);

    const overlay = scrollContainerRef.current;
    if (!overlay) return;

    gsap.to(overlay, {
      opacity: 0,
      duration: 1.2,
      ease: "power2.inOut",
      onComplete: () => {
        setFullyHidden(true);
        // Clean up Three.js
        const refs = threeRefs.current;
        if (refs.animationId) cancelAnimationFrame(refs.animationId);
        refs.stars.forEach((s) => {
          s.geometry.dispose();
          (s.material as THREE.Material).dispose();
        });
        refs.mountains.forEach((m) => {
          m.geometry.dispose();
          (m.material as THREE.Material).dispose();
        });
        if (refs.nebula) {
          refs.nebula.geometry.dispose();
          (refs.nebula.material as THREE.Material).dispose();
        }
        refs.renderer?.dispose();
        // Reset page scroll
        window.scrollTo(0, 0);
      },
    });
  }, [welcomeDone]);

  // ─── Three.js Init ───
  useEffect(() => {
    if (!canvasRef.current || fullyHidden) return;
    const refs = threeRefs.current;

    refs.scene = new THREE.Scene();
    refs.scene.fog = new THREE.FogExp2(0x000000, 0.00025);

    refs.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    refs.camera.position.set(0, 20, 100);

    refs.renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    refs.renderer.setSize(window.innerWidth, window.innerHeight);
    refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    refs.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    refs.renderer.toneMappingExposure = 0.6;

    refs.composer = new EffectComposer(refs.renderer);
    refs.composer.addPass(new RenderPass(refs.scene, refs.camera));
    refs.composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.2,   // stronger bloom
        0.35,
        0.8
      )
    );

    // ── Stars ──
    const starCount = 5000;
    for (let layer = 0; layer < 3; layer++) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(starCount * 3);
      const col = new Float32Array(starCount * 3);
      const siz = new Float32Array(starCount);

      for (let j = 0; j < starCount; j++) {
        const r = 200 + Math.random() * 800;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        pos[j * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[j * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[j * 3 + 2] = r * Math.cos(phi);

        const c = new THREE.Color();
        const p = Math.random();
        if (p < 0.35) c.setHSL(0.6, 0.4, 0.85 + Math.random() * 0.15);       // soft blue-white
        else if (p < 0.55) c.setHSL(0.75, 0.5, 0.8);                           // purple
        else if (p < 0.7) c.setHSL(0.52, 0.6, 0.8);                            // cyan
        else if (p < 0.85) c.setHSL(0.12, 0.5, 0.85);                          // warm gold
        else c.setHSL(0.85, 0.4, 0.8 + Math.random() * 0.15);                  // magenta-pink
        col[j * 3] = c.r;
        col[j * 3 + 1] = c.g;
        col[j * 3 + 2] = c.b;
        siz[j] = Math.random() * 2 + 0.5;
      }

      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      geo.setAttribute("size", new THREE.BufferAttribute(siz, 1));

      const mat = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, depth: { value: layer } },
        vertexShader: `
          attribute float size; attribute vec3 color;
          varying vec3 vColor; uniform float time; uniform float depth;
          void main() {
            vColor = color; vec3 p = position;
            float a = time * 0.05 * (1.0 - depth * 0.3);
            mat2 rot = mat2(cos(a),-sin(a),sin(a),cos(a));
            p.xy = rot * p.xy;
            vec4 mv = modelViewMatrix * vec4(p,1.0);
            gl_PointSize = size * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if(d > 0.5) discard;
            gl_FragColor = vec4(vColor, 1.0 - smoothstep(0.0,0.5,d));
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const pts = new THREE.Points(geo, mat);
      refs.scene.add(pts);
      refs.stars.push(pts);
    }

    // ── Nebula (vibrant 3-color gradient) ──
    const nebGeo = new THREE.PlaneGeometry(8000, 4000, 100, 100);
    const nebMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0x6d28d9) },  // violet-700
        color2: { value: new THREE.Color(0x06b6d4) },  // cyan-500
        color3: { value: new THREE.Color(0xec4899) },  // pink-500
        opacity: { value: 0.35 },
      },
      vertexShader: `
        varying vec2 vUv; varying float vE; uniform float time;
        void main() {
          vUv=uv; vec3 p=position;
          float e=sin(p.x*0.008+time)*cos(p.y*0.008+time*0.7)*25.0;
          p.z+=e; vE=e;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
        }`,
      fragmentShader: `
        uniform vec3 color1,color2,color3; uniform float opacity,time;
        varying vec2 vUv; varying float vE;
        void main() {
          float m1=sin(vUv.x*8.0+time*0.8)*cos(vUv.y*6.0+time*0.6);
          float m2=cos(vUv.x*5.0-time*0.5)*sin(vUv.y*9.0+time*0.4);
          vec3 c=mix(color1,color2,m1*0.5+0.5);
          c=mix(c,color3,m2*0.3+0.35);
          float a=opacity*(1.0-length(vUv-0.5)*1.8);
          a*=1.0+vE*0.015;
          a=max(a,0.0);
          gl_FragColor=vec4(c,a);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const neb = new THREE.Mesh(nebGeo, nebMat);
    neb.position.z = -1050;
    refs.scene.add(neb);
    refs.nebula = neb;

    // ── Mountains (deep purple-to-blue gradient layers) ──
    const layers = [
      { distance: -50, height: 60, color: 0x0f0a1e, opacity: 1 },     // near-black purple
      { distance: -100, height: 80, color: 0x1a1145, opacity: 0.85 },  // dark indigo
      { distance: -150, height: 100, color: 0x1e1b6e, opacity: 0.65 }, // deep violet
      { distance: -200, height: 120, color: 0x162055, opacity: 0.45 }, // ocean blue
    ];
    layers.forEach((l, idx) => {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 50; i++) {
        const x = (i / 50 - 0.5) * 1000;
        const y =
          Math.sin(i * 0.1) * l.height +
          Math.sin(i * 0.05) * l.height * 0.5 +
          Math.random() * l.height * 0.2 - 100;
        pts.push(new THREE.Vector2(x, y));
      }
      pts.push(new THREE.Vector2(5000, -300));
      pts.push(new THREE.Vector2(-5000, -300));
      const shape = new THREE.Shape(pts);
      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshBasicMaterial({
        color: l.color,
        transparent: true,
        opacity: l.opacity,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = l.distance;
      mesh.position.y = l.distance;
      mesh.userData = { baseZ: l.distance, index: idx };
      refs.scene!.add(mesh);
      refs.mountains.push(mesh);
    });
    refs.locations = refs.mountains.map((m) => m.position.z);

    // ── Atmosphere ──
    const atmGeo = new THREE.SphereGeometry(600, 32, 32);
    const atmMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        varying vec3 vN; varying vec3 vP;
        void main(){
          vN=normalize(normalMatrix*normal);
          vP=position;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        }`,
      fragmentShader: `
        varying vec3 vN; varying vec3 vP; uniform float time;
        void main(){
          float i=pow(0.7-dot(vN,vec3(0,0,1)),2.0);
          // Gradient from purple (top) to cyan (sides) to blue (bottom)
          float yMix=vP.y*0.002+0.5;
          vec3 purple=vec3(0.43,0.16,0.85);
          vec3 cyan=vec3(0.1,0.7,0.9);
          vec3 blue=vec3(0.2,0.4,1.0);
          vec3 atm=mix(blue,mix(cyan,purple,yMix),0.6)*i;
          atm*=sin(time*1.5)*0.12+0.92;
          gl_FragColor=vec4(atm,i*0.3);
        }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    refs.scene.add(new THREE.Mesh(atmGeo, atmMat));

    // ── Animate ──
    const animate = () => {
      refs.animationId = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      refs.stars.forEach((s) => {
        (s.material as THREE.ShaderMaterial).uniforms.time.value = t;
      });
      if (refs.nebula)
        (refs.nebula.material as THREE.ShaderMaterial).uniforms.time.value = t * 0.5;

      if (refs.camera) {
        const sf = 0.05;
        smoothCameraPos.current.x += (refs.targetCameraX - smoothCameraPos.current.x) * sf;
        smoothCameraPos.current.y += (refs.targetCameraY - smoothCameraPos.current.y) * sf;
        smoothCameraPos.current.z += (refs.targetCameraZ - smoothCameraPos.current.z) * sf;
        refs.camera.position.x = smoothCameraPos.current.x + Math.sin(t * 0.1) * 2;
        refs.camera.position.y = smoothCameraPos.current.y + Math.cos(t * 0.15);
        refs.camera.position.z = smoothCameraPos.current.z;
        refs.camera.lookAt(0, 10, -600);
      }

      refs.mountains.forEach((m, i) => {
        const pf = 1 + i * 0.5;
        m.position.x = Math.sin(t * 0.1) * 2 * pf;
        m.position.y = 50 + Math.cos(t * 0.15) * pf;
      });

      refs.composer?.render();
    };
    animate();
    setIsReady(true);

    const onResize = () => {
      if (!refs.camera || !refs.renderer || !refs.composer) return;
      refs.camera.aspect = window.innerWidth / window.innerHeight;
      refs.camera.updateProjectionMatrix();
      refs.renderer.setSize(window.innerWidth, window.innerHeight);
      refs.composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (refs.animationId) cancelAnimationFrame(refs.animationId);
      refs.stars.forEach((s) => {
        s.geometry.dispose();
        (s.material as THREE.Material).dispose();
      });
      refs.mountains.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      if (refs.nebula) {
        refs.nebula.geometry.dispose();
        (refs.nebula.material as THREE.Material).dispose();
      }
      refs.renderer?.dispose();
    };
  }, [fullyHidden]);

  // ─── GSAP Intro ───
  useEffect(() => {
    if (!isReady) return;
    const tl = gsap.timeline({ delay: 0.3 });

    if (titleRef.current) {
      const chars = titleRef.current.querySelectorAll(".title-char");
      // Use clipPath + y to reveal — avoids opacity breaking gradient text
      gsap.set(chars, { y: 150, clipPath: "inset(100% 0 0 0)" });
      tl.to(chars, {
        y: 0,
        clipPath: "inset(0% 0 0 0)",
        duration: 1.5,
        stagger: 0.06,
        ease: "power4.out",
      });
    }
    if (subtitleRef.current) {
      const lines = subtitleRef.current.querySelectorAll(".subtitle-line");
      gsap.set(lines, { y: 40, clipPath: "inset(100% 0 0 0)" });
      tl.to(lines, {
        y: 0,
        clipPath: "inset(0% 0 0 0)",
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
      }, "-=0.8");
    }
    if (scrollProgressRef.current) {
      gsap.set(scrollProgressRef.current, { opacity: 0, y: 30 });
      tl.to(scrollProgressRef.current, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, "-=0.5");
    }
    return () => { tl.kill(); };
  }, [isReady]);

  // ─── Internal scroll handler (on the overlay's own scroll) ───
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || fullyHidden) return;

    const handleScroll = () => {
      const refs = threeRefs.current;
      if (!refs.camera || !refs.nebula || refs.mountains.length === 0) return;

      const scrollTop = el.scrollTop;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) return;
      const progress = Math.min(scrollTop / maxScroll, 1);

      setScrollProgress(progress);
      const section = Math.min(Math.floor(progress * TOTAL_SECTIONS), TOTAL_SECTIONS - 1);
      setCurrentSection(section);

      const tp = progress * TOTAL_SECTIONS;
      const sp = tp % 1;

      const camPos = [
        { x: 0, y: 30, z: 300 },
        { x: 0, y: 40, z: -50 },
        { x: 0, y: 50, z: -700 },
      ];
      const cur = camPos[section] || camPos[0];
      const nxt = camPos[section + 1] || cur;
      refs.targetCameraX = cur.x + (nxt.x - cur.x) * sp;
      refs.targetCameraY = cur.y + (nxt.y - cur.y) * sp;
      refs.targetCameraZ = cur.z + (nxt.z - cur.z) * sp;

      refs.mountains.forEach((m, i) => {
        if (progress > 0.7) m.position.z = 600000;
        else m.position.z = refs.locations[i];
      });
      if (refs.mountains[3]) refs.nebula!.position.z = refs.mountains[3].position.z;

      // Auto-dismiss at the very end
      if (progress >= 0.98) {
        dismissWelcome();
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [fullyHidden, dismissWelcome]);

  return (
    <>
      {/* Welcome overlay - only rendered while active */}
      {!fullyHidden && (
        <div
          ref={scrollContainerRef}
          className="welcome-overlay"
        >
          <canvas ref={canvasRef} className="welcome-canvas" />

          {/* Section 0 - HIREIQ */}
          <div className="welcome-section">
            <div className="welcome-section-inner">
              <h1 ref={titleRef} className="welcome-title-text">
                {"HIREIQ".split("").map((ch, i) => (
                  <span key={i} className="title-char" style={{ "--char-i": i } as React.CSSProperties}>{ch}</span>
                ))}
              </h1>
              <div ref={subtitleRef} className="welcome-subtitle">
                <p className="subtitle-line">{SECTIONS_DATA[0].subtitle1}</p>
                <p className="subtitle-line">{SECTIONS_DATA[0].subtitle2}</p>
              </div>
            </div>
          </div>

          {/* Section 1 - PREPARE */}
          <div className="welcome-section">
            <div className="welcome-section-inner">
              <h1 className="welcome-title-text">
                {"PREPARE".split("").map((ch, i) => (
                  <span key={i} className="title-char">{ch}</span>
                ))}
              </h1>
              <div className="welcome-subtitle">
                <p className="subtitle-line">{SECTIONS_DATA[1].subtitle1}</p>
                <p className="subtitle-line">{SECTIONS_DATA[1].subtitle2}</p>
              </div>
            </div>
          </div>

          {/* Section 2 - SUCCEED */}
          <div className="welcome-section">
            <div className="welcome-section-inner">
              <h1 className="welcome-title-text">
                {"SUCCEED".split("").map((ch, i) => (
                  <span key={i} className="title-char">{ch}</span>
                ))}
              </h1>
              <div className="welcome-subtitle">
                <p className="subtitle-line">{SECTIONS_DATA[2].subtitle1}</p>
                <p className="subtitle-line">{SECTIONS_DATA[2].subtitle2}</p>
              </div>
            </div>
          </div>

          {/* Scroll progress */}
          <div ref={scrollProgressRef} className="welcome-scroll-progress">
            <div className="welcome-scroll-text">SCROLL</div>
            <div className="welcome-progress-track">
              <div
                className="welcome-progress-fill"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
            <div className="welcome-section-counter">
              {String(currentSection).padStart(2, "0")} /{" "}
              {String(TOTAL_SECTIONS).padStart(2, "0")}
            </div>
          </div>
        </div>
      )}

      {/* Children always rendered in DOM - overlay covers them while active */}
      {children}
    </>
  );
}
