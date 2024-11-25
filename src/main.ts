import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  getAllNodes,
  getAllRelationships,
  getNodeWithRelationships,
} from './api'
import { GetAllNodesResponse, GetAllRelationshipsResponse } from './models'

const NODE_COLORS: { [key: string]: number } = {
  User: 0x1e90ff, // Синий (DodgerBlue)
  Group: 0x32cd32, // Зелёный (LimeGreen)
  Label: 0xffd700, // Золотой (Gold)
  AnotherLabel: 0xff69b4, // Розовый (HotPink)
}

interface RelationshipLine {
  line: THREE.Line
  start_node_id: number
  end_node_id: number
}

interface NodeUserData {
  id: number
  label: string
  originalColor: THREE.Color
}

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2
let nodes: THREE.Mesh[] = []
let nodeDataMap: Map<string, GetAllNodesResponse> = new Map()
let relationshipLines: RelationshipLine[] = []
let highlightedLines: RelationshipLine[] = []
let infoPanel: HTMLElement
let previousSelectedNode: THREE.Mesh | null = null

function lightenColor(color: THREE.Color, amount: number = 0.5): THREE.Color {
  return color.clone().lerp(new THREE.Color(0xffffff), amount)
}

function init() {
  scene = new THREE.Scene()

  const fov = 75
  const aspect = window.innerWidth / window.innerHeight
  const near = 0.1
  const far = 1000
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
  camera.position.z = 100

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.getElementById('container')?.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight.position.set(1, 1, 1)
  scene.add(directionalLight)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  infoPanel = document.getElementById('info-panel')!

  window.addEventListener('resize', onWindowResize, false)
  window.addEventListener('click', onClick, false)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  requestAnimationFrame(animate)

  controls.update()

  renderer.render(scene, camera)
}

async function loadData() {
  try {
    const [nodesData, relationshipsData] = await Promise.all([
      getAllNodes(),
      getAllRelationships(),
    ])

    nodesData.forEach(node => {
      nodeDataMap.set(node.id.toString(), node)
    })

    createNodes(nodesData)
    createRelationships(relationshipsData)
    centerNodes()
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error)
  }
}

function createNodes(nodesData: GetAllNodesResponse[]) {
  const geometry = new THREE.SphereGeometry(1, 32, 32)

  nodesData.forEach(node => {
    const material = new THREE.MeshStandardMaterial({
      color: NODE_COLORS[node.label] || 0xffffff,
    })
    const sphere = new THREE.Mesh(geometry, material)
    const userData: NodeUserData = {
      id: node.id,
      label: node.label,
      originalColor: material.color.clone(),
    }
    sphere.userData = userData
    scene.add(sphere)
    nodes.push(sphere)
  })

  // Распределение узлов равномерно на сфере
  const radius = 50
  const count = nodes.length
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // Золотое сечение

  nodes.forEach((node, index) => {
    const y = 1 - (index / (count - 1)) * 2 // y от 1 до -1
    const radiusAtY = Math.sqrt(1 - y * y) // радиус круга на высоте y
    const theta = goldenAngle * index // угол

    const x = radiusAtY * Math.cos(theta)
    const z = radiusAtY * Math.sin(theta)

    node.position.set(x * radius, y * radius, z * radius)
  })
}

function createRelationships(relData: GetAllRelationshipsResponse[]) {
  const defaultMaterial = new THREE.LineBasicMaterial({ color: 0x888888 })
  const linesGroup = new THREE.Group()

  relData.forEach(rel => {
    const start_node_id = rel.start_node_id
    const end_node_id = rel.end_node_id

    const startNode = nodes.find(node => node.userData.id === start_node_id)
    const endNode = nodes.find(node => node.userData.id === end_node_id)

    if (startNode && endNode) {
      const points = []
      points.push(startNode.position.clone())
      points.push(endNode.position.clone())

      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(geometry, defaultMaterial.clone())
      linesGroup.add(line)

      relationshipLines.push({
        line,
        start_node_id,
        end_node_id,
      })
    }
  })

  scene.add(linesGroup)
}

function centerNodes() {
  const center = new THREE.Vector3()
  nodes.forEach(node => {
    center.add(node.position)
  })
  center.divideScalar(nodes.length)

  nodes.forEach(node => {
    node.position.sub(center)
  })

  controls.target.set(0, 0, 0)
  camera.position.set(0, 0, 100)
  controls.update()
}

async function onClick(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(nodes)

  if (intersects.length > 0) {
    const selectedMesh = intersects[0].object as THREE.Mesh

    if (previousSelectedNode !== selectedMesh) {
      if (previousSelectedNode) {
        const prevUserData = previousSelectedNode.userData as NodeUserData
        const originalColor = prevUserData.originalColor
        const prevMaterial = previousSelectedNode.material

        if (Array.isArray(prevMaterial)) {
          prevMaterial.forEach(mat => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.color.copy(originalColor)
            }
          })
        } else if (prevMaterial instanceof THREE.MeshStandardMaterial) {
          prevMaterial.color.copy(originalColor)
        }
      }

      previousSelectedNode = selectedMesh
      const nodeId = (selectedMesh.userData as NodeUserData).id
      displayNodeInfo(nodeId)

      const selectedUserData = selectedMesh.userData as NodeUserData
      const currentColor = selectedUserData.originalColor
      const lightenedColor: THREE.Color = lightenColor(currentColor, 0.3)
      const selectedMaterial = selectedMesh.material

      if (Array.isArray(selectedMaterial)) {
        selectedMaterial.forEach(mat => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.color.copy(lightenedColor)
          }
        })
      } else if (selectedMaterial instanceof THREE.MeshStandardMaterial) {
        selectedMaterial.color.copy(lightenedColor)
      }

      highlightConnections(nodeId)
    }
  } else {
    infoPanel.classList.add('hidden')

    if (previousSelectedNode) {
      const prevUserData = previousSelectedNode.userData as NodeUserData
      const originalColor = prevUserData.originalColor
      const prevMaterial = previousSelectedNode.material

      if (Array.isArray(prevMaterial)) {
        prevMaterial.forEach(mat => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.color.copy(originalColor)
          }
        })
      } else if (prevMaterial instanceof THREE.MeshStandardMaterial) {
        prevMaterial.color.copy(originalColor)
      }

      previousSelectedNode = null
    }

    resetHighlights()
  }
}

async function displayNodeInfo(nodeId: number) {
  try {
    const nodeWithRel = await getNodeWithRelationships(nodeId.toString())
    const { node, relationships } = nodeWithRel

    console.log('Полученные данные узла:', nodeWithRel)

    const nodeNameElement = document.getElementById('node-name')!
    nodeNameElement.textContent = node.name || `Узел ${node.id}`

    const attributesList = document.getElementById('node-attributes')!
    attributesList.innerHTML = ''

    const hasAttributes = Object.entries(node).some(
      ([key, value]) =>
        key !== 'id' &&
        key !== 'label' &&
        value !== null &&
        value !== undefined,
    )

    if (hasAttributes) {
      Object.entries(node).forEach(([key, value]) => {
        if (
          key !== 'id' &&
          key !== 'label' &&
          value !== null &&
          value !== undefined
        ) {
          const li = document.createElement('li')
          li.textContent = `${key}: ${value}`
          attributesList.appendChild(li)
        }
      })
    } else {
      const li = document.createElement('li')
      li.textContent = 'Дополнительных атрибутов нет.'
      attributesList.appendChild(li)
    }

    if (Array.isArray(relationships) && relationships.length > 0) {
      console.log(nodeDataMap)
      const relHeader = document.createElement('li')
      relHeader.textContent = 'Связи:'
      relHeader.style.fontWeight = 'bold'
      attributesList.appendChild(relHeader)

      relationships.forEach(rel => {
        const value = nodeDataMap.get(rel.end_node_id.toString())
        const relItem = document.createElement('li')
        relItem.textContent = `${rel.type} -> Узел ${rel.end_node_id} (${
          value?.name || 'Неизвестно'
        })`
        attributesList.appendChild(relItem)
      })
    } else {
      const relItem = document.createElement('li')
      relItem.textContent = 'Связей нет.'
      relItem.style.fontStyle = 'italic'
      attributesList.appendChild(relItem)
    }

    infoPanel.classList.remove('hidden')
  } catch (error) {
    console.error('Ошибка при получении информации о узле:', error)
    infoPanel.classList.add('hidden')
  }
}

function highlightConnections(nodeId: number) {
  resetHighlights()

  highlightedLines = relationshipLines.filter(
    rel => rel.start_node_id === nodeId || rel.end_node_id === nodeId,
  )

  highlightedLines.forEach(rel => {
    const material = rel.line.material as THREE.LineBasicMaterial
    material.color.set(0xff0000)
  })
}

function resetHighlights() {
  highlightedLines.forEach(rel => {
    const material = rel.line.material as THREE.LineBasicMaterial
    material.color.set(0x888888)
  })
  highlightedLines = []
}

init()
loadData()
animate()
