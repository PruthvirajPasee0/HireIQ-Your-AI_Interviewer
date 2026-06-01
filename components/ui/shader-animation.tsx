"use client"

import { useEffect, useRef } from "react"
// Type-only import — erased at build time, so `three` is NOT pulled into this
// component's static chunk. The actual library is loaded dynamically inside the
// effect (client-only, after hydration), keeping it out of the initial bundle.
import type * as THREE from "three"

export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    geometry: THREE.BufferGeometry
    material: THREE.Material
    animationId: number
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    let cancelled = false
    let cleanupResize: (() => void) | null = null

    void (async () => {
      const THREE = await import("three")
      if (cancelled || !containerRef.current) return

      // Vertex shader
      const vertexShader = `
        void main() {
          gl_Position = vec4( position, 1.0 );
        }
      `

      // Fragment shader
      const fragmentShader = `
        #define TWO_PI 6.2831853072
        #define PI 3.14159265359

        precision highp float;
        uniform vec2 resolution;
        uniform float time;

        void main(void) {
          vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
          float t = time*0.05;
          float lineWidth = 0.002;

          vec3 color = vec3(0.0);
          for(int j = 0; j < 3; j++){
            for(int i=0; i < 5; i++){
              color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
            }
          }

          gl_FragColor = vec4(color[0],color[1],color[2],1.0);
        }
      `

      // Initialize Three.js scene
      const camera = new THREE.Camera()
      camera.position.z = 1

      const scene = new THREE.Scene()
      const geometry = new THREE.PlaneGeometry(2, 2)

      const uniforms = {
        time: { value: 1.0 },
        resolution: { value: new THREE.Vector2() },
      }

      const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
      })

      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(window.devicePixelRatio)

      container.appendChild(renderer.domElement)

      // Handle window resize
      const onWindowResize = () => {
        const width = container.clientWidth
        const height = container.clientHeight
        renderer.setSize(width, height)
        uniforms.resolution.value.x = renderer.domElement.width
        uniforms.resolution.value.y = renderer.domElement.height
      }

      // Initial resize
      onWindowResize()
      window.addEventListener("resize", onWindowResize, false)
      cleanupResize = () => window.removeEventListener("resize", onWindowResize)

      sceneRef.current = { renderer, geometry, material, animationId: 0 }

      // Animation loop
      const animate = () => {
        const animationId = requestAnimationFrame(animate)
        uniforms.time.value += 0.05
        renderer.render(scene, camera)
        if (sceneRef.current) sceneRef.current.animationId = animationId
      }

      animate()
    })()

    // Cleanup function (runs synchronously on unmount)
    return () => {
      cancelled = true
      cleanupResize?.()
      const s = sceneRef.current
      if (s) {
        cancelAnimationFrame(s.animationId)
        if (
          container &&
          s.renderer.domElement &&
          container.contains(s.renderer.domElement)
        ) {
          container.removeChild(s.renderer.domElement)
        }
        s.renderer.dispose()
        s.geometry.dispose()
        s.material.dispose()
        sceneRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{
        background: "#000",
        overflow: "hidden",
      }}
    />
  )
}
