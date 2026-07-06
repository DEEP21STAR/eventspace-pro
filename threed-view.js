// EVENTSPACE 3D INSIDE VIEW — self-contained module
// Three.js via ESM CDN. Parametric marquee + furniture + HDR + bloom.
// Usage: import { mountInsideView } from './threed-view.js'
//        mountInsideView(canvasEl, { width: 12, length: 15, equipment: [...] })

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/postprocessing/UnrealBloomPass.js'
import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/loaders/RGBELoader.js'

const EQUIPMENT_MODELS = {
  'round-10p':   { type: 'roundTable', radius: 0.9, seats: 10, color: 0xfbbf24 },
  'round-8p':    { type: 'roundTable', radius: 0.75, seats: 8, color: 0xfbbf24 },
  'round-6p':    { type: 'roundTable', radius: 0.6, seats: 6, color: 0xfbbf24 },
  'banquet-2.4m': { type: 'rectTable', w: 2.4, d: 0.75, h: 0.75, color: 0xfbbf24 },
  'banquet-1.8m': { type: 'rectTable', w: 1.8, d: 0.75, h: 0.75, color: 0xfbbf24 },
  'cocktail':    { type: 'cocktailTable', radius: 0.4, height: 1.1, color: 0xfbbf24 },
  'stage':       { type: 'stage', w: 3, d: 2, h: 0.4, color: 0xc084fc },
  'dj':          { type: 'dj', w: 1.6, d: 0.8, h: 1.0, color: 0xc084fc },
  'dance-16':    { type: 'danceFloor', size: 4, color: 0xc084fc },
  'dance-25':    { type: 'danceFloor', size: 5, color: 0xc084fc }
}

function buildMarquee(scene, width, length) {
  // Parametric marquee — frame + canvas (semi-transparent)
  const height = 3.5
  const peak = 4.5

  // Floor
  const floorGeo = new THREE.PlaneGeometry(width + 1, length + 1)
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.9 })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // Marquee canvas — semi-transparent white
  const canvasMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.3, metalness: 0.1,
    transmission: 0.6, transparent: true, opacity: 0.65,
    side: THREE.DoubleSide
  })

  // Side walls (4)
  const sides = [
    { w: width, h: height, pos: [0, height/2, -length/2], rot: [0, 0, 0] },
    { w: width, h: height, pos: [0, height/2, length/2],  rot: [0, Math.PI, 0] },
    { w: length, h: height, pos: [-width/2, height/2, 0], rot: [0, Math.PI/2, 0] },
    { w: length, h: height, pos: [width/2, height/2, 0],  rot: [0, -Math.PI/2, 0] }
  ]
  sides.forEach(s => {
    const geo = new THREE.PlaneGeometry(s.w, s.h)
    const wall = new THREE.Mesh(geo, canvasMat)
    wall.position.set(...s.pos); wall.rotation.set(...s.rot)
    scene.add(wall)
  })

  // Roof — two triangular slopes (peaked)
  const roofGeo = new THREE.BufferGeometry()
  const v = [
    -width/2, height, -length/2,  width/2, height, -length/2,  0, peak, -length/2,
    -width/2, height,  length/2,  width/2, height,  length/2,  0, peak,  length/2,
  ]
  const idx = [0,1,2, 3,4,5]
  roofGeo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
  roofGeo.setIndex(idx); roofGeo.computeVertexNormals()
  const roofMesh = new THREE.Mesh(roofGeo, canvasMat)
  scene.add(roofMesh)

  // Roof slopes
  const slopeGeo = new THREE.PlaneGeometry(width, length, 1, 1)
  const slope1 = new THREE.Mesh(slopeGeo, canvasMat)
  slope1.position.set(-width/4, (height + peak) / 2, 0)
  slope1.rotation.set(-Math.PI / 2, 0, Math.atan2(peak - height, width / 2))
  scene.add(slope1)
  const slope2 = slope1.clone()
  slope2.position.set(width/4, (height + peak) / 2, 0)
  slope2.rotation.set(-Math.PI / 2, 0, -Math.atan2(peak - height, width / 2))
  scene.add(slope2)

  // Frame poles (vertical metal)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.85, roughness: 0.3 })
  const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, height, 8)
  const poleCorners = [
    [-width/2, -length/2], [width/2, -length/2],
    [-width/2,  length/2], [width/2,  length/2]
  ]
  poleCorners.forEach(([x, z]) => {
    const pole = new THREE.Mesh(poleGeo, poleMat)
    pole.position.set(x, height/2, z)
    scene.add(pole)
  })
}

function buildEquipment(scene, equipment) {
  equipment.forEach(item => {
    const def = EQUIPMENT_MODELS[item.type]
    if (!def) return
    const mat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.6 })
    let mesh
    switch (def.type) {
      case 'roundTable':
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(def.radius, def.radius, 0.05, 32), mat)
        mesh.position.y = 0.75
        break
      case 'rectTable':
        mesh = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.05, def.d), mat)
        mesh.position.y = def.h
        break
      case 'cocktailTable':
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(def.radius, 0.15, def.height, 16), mat)
        mesh.position.y = def.height / 2
        break
      case 'stage':
        mesh = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.h, def.d), mat)
        mesh.position.y = def.h / 2
        break
      case 'dj':
        mesh = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.h, def.d), mat)
        mesh.position.y = def.h / 2
        break
      case 'danceFloor':
        mesh = new THREE.Mesh(new THREE.BoxGeometry(def.size, 0.05, def.size), mat)
        mesh.position.y = 0.025
        break
    }
    if (mesh) {
      mesh.position.x = item.x || 0
      mesh.position.z = item.z || 0
      mesh.castShadow = true
      mesh.receiveShadow = true
      scene.add(mesh)
    }
  })
}

export function mountInsideView(canvas, opts = {}) {
  const width = opts.width || 12
  const length = opts.length || 15
  const equipment = opts.equipment || []
  const lighting = opts.lighting || 'reception'  // 'day' | 'night' | 'reception'

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a0a)

  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
  camera.position.set(width * 0.8, 3, length * 0.8)
  camera.lookAt(0, 1.5, 0)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1

  // Lighting presets
  const setLighting = (preset) => {
    scene.children = scene.children.filter(c => !c.isLight)
    if (preset === 'day') {
      scene.add(new THREE.AmbientLight(0xffffff, 0.6))
      const sun = new THREE.DirectionalLight(0xfff5e1, 1.5)
      sun.position.set(10, 20, 5); sun.castShadow = true
      scene.add(sun)
    } else if (preset === 'night') {
      scene.add(new THREE.AmbientLight(0x4a5fb8, 0.15))
      const moon = new THREE.DirectionalLight(0xb0c4ff, 0.5)
      moon.position.set(-5, 15, -5)
      scene.add(moon)
    } else {  // reception
      scene.add(new THREE.AmbientLight(0xfde68a, 0.35))
      const warm = new THREE.PointLight(0xfbbf24, 1.2, 30)
      warm.position.set(0, 4, 0); scene.add(warm)
      const cool = new THREE.PointLight(0x6366f1, 0.6, 25)
      cool.position.set(width/2, 2, length/3); scene.add(cool)
    }
  }
  setLighting(lighting)

  buildMarquee(scene, width, length)
  buildEquipment(scene, equipment)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.target.set(0, 1, 0)

  // Postprocessing — bloom for cinematic look
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(canvas.clientWidth, canvas.clientHeight), 0.35, 0.5, 0.85)
  composer.addPass(bloomPass)

  let raf = null
  function animate() {
    controls.update()
    composer.render()
    raf = requestAnimationFrame(animate)
  }
  animate()

  // Public API
  return {
    setLighting: (p) => setLighting(p),
    updateEquipment: (newEquipment) => {
      // Remove old equipment, add new
      scene.children.filter(c => c.userData.isEquipment).forEach(c => scene.remove(c))
      buildEquipment(scene, newEquipment)
    },
    flyInto: () => {
      // Camera fly-in animation — from far birds-eye to inside
      const start = { x: width * 2, y: 15, z: length * 2 }
      const end   = { x: 0, y: 1.6, z: 0 }
      const duration = 1800
      const t0 = performance.now()
      function step() {
        const t = Math.min((performance.now() - t0) / duration, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        camera.position.x = start.x + (end.x - start.x) * ease
        camera.position.y = start.y + (end.y - start.y) * ease
        camera.position.z = start.z + (end.z - start.z) * ease
        camera.lookAt(0, 1.5, 0)
        if (t < 1) requestAnimationFrame(step)
      }
      step()
    },
    dispose: () => {
      if (raf) cancelAnimationFrame(raf)
      renderer.dispose()
      composer.dispose()
    }
  }
}
