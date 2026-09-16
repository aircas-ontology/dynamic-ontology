import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { OntologyRelationClass, RelationGraphLayoutMode } from "@/types";
import { computeHopDistances } from "../utils/spaceRelationGraph";
import {
  createRelationEdgeLabelTexture,
  resolveSoftCategoryColor,
} from "../utils/relationGraph3dTexture";
import { themeColor } from "../utils/themeColor";
import { createGlowTexture, createLabelTexture } from "../utils/graphTextureFactory";

export interface RelationGraph3dData {
  items: OntologyRelationClass[];
  layoutMode: RelationGraphLayoutMode;
  seedNames: string[];
  maxHop: number;
  /** 分类自定义颜色映射（categoryId → hex） */
  categoryColors?: Record<string, string>;
}

export interface RelationGraph3dApi {
  setData: (data: RelationGraph3dData) => Promise<void>;
  resize: () => void;
  dispose: () => void;
}

interface NodeRecord {
  name: string;
  sprite: THREE.Sprite;
  position: THREE.Vector3;
  isSeed: boolean;
  hop: number;
  degree: number;
  baseScale: number;
  hologram?: THREE.Group;
}

interface EdgeRecord {
  relationId: string;
  line: THREE.Line;
  arrow: THREE.Mesh;
  label: THREE.Sprite;
  color: string;
  sourceName: string;
  targetName: string;
  displayName: string;
  cardinality: string;
}

function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points) {
      child.geometry.dispose();
      const material = child.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material.dispose();
    } else if (child instanceof THREE.Sprite) {
      const material = child.material;
      material.map?.dispose();
      material.dispose();
    }
  });
}

function buildDegreeMap(items: OntologyRelationClass[]): Map<string, number> {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const source = item.sourceName.trim();
    const target = item.targetName.trim();
    if (source) map.set(source, (map.get(source) ?? 0) + 1);
    if (target) map.set(target, (map.get(target) ?? 0) + 1);
  });
  return map;
}

function buildCategoryColorMap(
  items: OntologyRelationClass[],
  customColors?: Record<string, string>,
): Map<string, string> {
  const map = new Map<string, string>();
  let index = 0;
  items.forEach((item) => {
    const key = item.categoryId || item.categoryName || item.id;
    if (map.has(key)) return;
    const custom = customColors?.[key]?.trim();
    map.set(key, custom || resolveSoftCategoryColor(index));
    index += 1;
  });
  return map;
}

function sizeFromDegree(degree: number, degrees: number[]): number {
  if (!degrees.length) return 1;
  const minDegree = Math.min(...degrees);
  const maxDegree = Math.max(...degrees);
  if (maxDegree <= minDegree) return 1;
  const t = (degree - minDegree) / (maxDegree - minDegree);
  return 0.65 + t * 0.8;
}

/** 度数最大者居中；并列时取名称字典序更小者，保证稳定 */
function pickMaxDegreeCenter(names: string[], degreeMap: Map<string, number>): string {
  if (!names.length) return "";
  return [...names].sort((a, b) => {
    const degreeDiff = (degreeMap.get(b) ?? 0) - (degreeMap.get(a) ?? 0);
    if (degreeDiff !== 0) return degreeDiff;
    return a.localeCompare(b, "zh-CN");
  })[0]!;
}

function placeRingNodes(
  result: Map<string, { position: THREE.Vector3; isSeed: boolean; hop: number }>,
  names: string[],
  radius: number,
  hop: number,
  yAmp: number,
  zFactor: number,
): void {
  names.forEach((name, index) => {
    const angle =
      names.length === 1 ? -Math.PI / 2 : (Math.PI * 2 * index) / names.length - Math.PI / 2;
    result.set(name, {
      position: new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * yAmp,
        Math.sin(angle) * radius * zFactor,
      ),
      isSeed: false,
      hop,
    });
  });
}

function computeLayoutPositions(
  data: RelationGraph3dData,
): Map<string, { position: THREE.Vector3; isSeed: boolean; hop: number }> {
  const result = new Map<string, { position: THREE.Vector3; isSeed: boolean; hop: number }>();
  const names = new Set<string>();
  data.items.forEach((item) => {
    names.add(item.sourceName.trim());
    names.add(item.targetName.trim());
  });
  const nameList = [...names].filter(Boolean);
  if (!nameList.length) return result;

  const degreeMap = buildDegreeMap(data.items);

  if (data.layoutMode === "star") {
    const centerLabel = pickMaxDegreeCenter(nameList, degreeMap) || nameList[0]!;
    const targets = nameList.filter((name) => name !== centerLabel);
    result.set(centerLabel, {
      position: new THREE.Vector3(0, 0.35, 0),
      isSeed: true,
      hop: 0,
    });
    placeRingNodes(result, targets, 7.2, 1, 0.55, 0.72);
    return result;
  }

  const primarySeed =
    data.seedNames.map((name) => name.trim()).find((name) => Boolean(name)) || "";
  const hopLevel = Math.max(1, data.maxHop || 1);

  if (!primarySeed) {
    const centerLabel = pickMaxDegreeCenter(nameList, degreeMap) || nameList[0]!;
    const others = nameList.filter((name) => name !== centerLabel);
    result.set(centerLabel, {
      position: new THREE.Vector3(0, 0.4, 0),
      isSeed: true,
      hop: 0,
    });
    const ringSize = 12;
    for (let offset = 0; offset < others.length; offset += ringSize) {
      placeRingNodes(result, others.slice(offset, offset + ringSize), 4.8 + Math.floor(offset / ringSize) * 3, 1, 0, 0.85);
    }
    return result;
  }

  const hopMap = computeHopDistances(data.items, [primarySeed], hopLevel);
  const byHop = new Map<number, string[]>();
  nameList.forEach((name) => {
    const hop = hopMap.get(name) ?? 0;
    const list = byHop.get(hop) ?? [];
    list.push(name);
    byHop.set(hop, list);
  });

  byHop.forEach((groupNames, hop) => {
    groupNames.forEach((name, index) => {
      if (hop === 0) {
        result.set(name, {
          position: new THREE.Vector3(0, 0.45, 0),
          isSeed: name === primarySeed,
          hop: 0,
        });
        return;
      }
      const radius = 3.2 + (hop / hopLevel) * 5.4;
      const angle =
        groupNames.length === 1
          ? -Math.PI / 2
          : (Math.PI * 2 * index) / groupNames.length - Math.PI / 2;
      result.set(name, {
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          0.2 + hop * 0.35,
          Math.sin(angle) * radius * 0.78,
        ),
        isSeed: false,
        hop,
      });
    });
  });

  return result;
}

export function createRelationGraph3d(options: {
  container: HTMLElement;
  onEdgeContextMenu: (relationId: string, clientX: number, clientY: number) => void;
}): RelationGraph3dApi {
  const container = options.container;
  const scene = new THREE.Scene();
  const fogColor = themeColor("--aircas-color-panel-background") || "#0c2430";
  scene.fog = new THREE.FogExp2(fogColor, 0.014);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(0, 9.5, 16);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 6;
  controls.maxDistance = 36;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 0.2, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 1.05);
  const key = new THREE.DirectionalLight(0xffffff, 0.75);
  key.position.set(4, 10, 6);
  const fill = new THREE.DirectionalLight(0xa8e8ff, 0.35);
  fill.position.set(-6, 4, -4);
  scene.add(ambient, key, fill);

  const graphRoot = new THREE.Group();
  scene.add(graphRoot);

  const raycaster = new THREE.Raycaster();
  raycaster.params.Line = { threshold: 0.35 };
  const pointer = new THREE.Vector2();

  let nodes: NodeRecord[] = [];
  let edges: EdgeRecord[] = [];
  let hoveredRelationId: string | null = null;
  let hoveredNodeName: string | null = null;
  let holographicLayout = false;
  let animationId = 0;
  let disposed = false;
  let buildToken = 0;

  const resize = (): void => {
    if (disposed) return;
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const clearGraph = (): void => {
    while (graphRoot.children.length) {
      const child = graphRoot.children[0]!;
      graphRoot.remove(child);
      disposeObject(child);
    }
    nodes = [];
    edges = [];
  };

  const refreshHighlight = (): void => {
    const focusEdge = hoveredRelationId
      ? edges.find((item) => item.relationId === hoveredRelationId)
      : null;
    const focusNames = new Set<string>();
    if (focusEdge) {
      focusNames.add(focusEdge.sourceName);
      focusNames.add(focusEdge.targetName);
    }
    if (hoveredNodeName) focusNames.add(hoveredNodeName);

    const dimming = focusNames.size > 0;

    nodes.forEach((node) => {
      const active = !dimming || focusNames.has(node.name);
      const material = node.sprite.material;
      material.opacity = dimming ? (active ? 1 : 0.22) : 1;
      const boost = active && dimming ? 1.08 : 1;
      node.sprite.scale.set(node.baseScale * boost * (node.hologram ? 3.35 : 2.4), node.baseScale * boost * (node.hologram ? 0.86 : 3), 1);
      node.hologram?.scale.setScalar(boost);
    });

    edges.forEach((edge) => {
      const active = hoveredRelationId === edge.relationId || edge.sourceName === hoveredNodeName || edge.targetName === hoveredNodeName;
      const lineMaterial = edge.line.material as THREE.LineBasicMaterial;
      lineMaterial.opacity = dimming ? (active ? 0.98 : 0.18) : 0.78;
      const arrowMaterial = edge.arrow.material as THREE.MeshBasicMaterial;
      arrowMaterial.opacity = dimming ? (active ? 1 : 0.18) : holographicLayout ? 1 : 0.95;
      const labelMaterial = edge.label.material;
      labelMaterial.opacity = active ? 1 : dimming ? 0.16 : 0.55;
    });
  };

  const setData = async (data: RelationGraph3dData): Promise<void> => {
    if (disposed) return;
    const seed = data.seedNames.map(name => name.trim()).find(Boolean);
    if (data.layoutMode === "network" && seed && data.maxHop === 1) {
      data = {
        ...data,
        items: data.items.filter(item =>
          item.sourceName.trim() === seed || item.targetName.trim() === seed,
        ),
      };
    }
    const token = ++buildToken;
    clearGraph();
    hoveredRelationId = null;
    hoveredNodeName = null;
    if (!data.items.length) return;

    const degreeMap = buildDegreeMap(data.items);
    const degreeValues = [...degreeMap.values()];
    const categoryColors = buildCategoryColorMap(data.items, data.categoryColors);
    const layout = computeLayoutPositions(data);
    const holographic = data.layoutMode === "network";
    holographicLayout = holographic;
    scene.fog = holographic ? new THREE.FogExp2(0x020612, 0.022) : new THREE.FogExp2(fogColor, 0.014);

    for (const [name, layoutItem] of layout) {
      if (token !== buildToken || disposed) return;
      const degree = degreeMap.get(name) ?? 1;
      const baseScale = sizeFromDegree(degree, degreeValues);
      const texture = createLabelTexture(
        name,
        holographic
          ? `${degree} 条关联关系`
          : layoutItem.isSeed
            ? `中心 · ${degree}`
            : `L${layoutItem.hop} · ${degree}`,
        "#d9edf7",
      );
      if (token !== buildToken || disposed) {
        texture.dispose();
        return;
      }
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(layoutItem.position);
      let hologram: THREE.Group | undefined;
      if (holographic) {
        hologram = new THREE.Group();
        hologram.position.copy(layoutItem.position);
        const size = layoutItem.isSeed ? 0.42 : 0.25;
        const color = layoutItem.isSeed ? "#a5efff" : "#d9edf7";
        const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
        wire.userData = { kind: "node", name };
        const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(size * 1.5, 1), new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending }));
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: createGlowTexture(color), transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }));
        glow.scale.setScalar(size * 8);
        const base = new THREE.Mesh(new THREE.RingGeometry(size * 1.4, size * 1.7, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
        base.rotation.x = -Math.PI / 2;
        base.position.y = -0.45;
        const halo = new THREE.Mesh(new THREE.TorusGeometry(size * 1.9, 0.008, 8, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 }));
        halo.rotation.x = Math.PI / 2;
        hologram.add(wire, shell, glow, base, halo);
        graphRoot.add(hologram);
        sprite.position.y += size * 2.4 + 0.3;
      }
      sprite.scale.set(baseScale * (holographic ? 3.35 : 2.4), baseScale * (holographic ? 0.86 : 3), 1);
      sprite.userData = { kind: "node", name };
      graphRoot.add(sprite);
      nodes.push({
        name,
        sprite,
        position: layoutItem.position.clone(),
        isSeed: layoutItem.isSeed,
        hop: layoutItem.hop,
        degree,
        baseScale,
        hologram,
      });
    }

    const siblingCounter = new Map<string, number>();
    for (const item of data.items) {
      if (token !== buildToken || disposed) return;
      const source = item.sourceName.trim();
      const target = item.targetName.trim();
      const sourceNode = nodes.find((node) => node.name === source);
      const targetNode = nodes.find((node) => node.name === target);
      if (!sourceNode || !targetNode) continue;

      const pairKey = `${source}=>${target}`;
      const siblingIndex = siblingCounter.get(pairKey) ?? 0;
      siblingCounter.set(pairKey, siblingIndex + 1);

      const start = sourceNode.position.clone();
      const end = targetNode.position.clone();
      const mid = start.clone().lerp(end, 0.5);
      const side = new THREE.Vector3().subVectors(end, start).cross(new THREE.Vector3(0, 1, 0));
      if (side.lengthSq() < 1e-6) side.set(0.2, 0, 0.2);
      side.normalize().multiplyScalar((siblingIndex - 0.5) * 0.55);
      mid.add(side).add(new THREE.Vector3(0, 0.55 + siblingIndex * 0.2, 0));

      const colorKey = item.categoryId || item.categoryName || item.id;
      const color = categoryColors.get(colorKey) ?? resolveSoftCategoryColor(0);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      });
      const line = new THREE.Line(geometry, material);
      line.userData = { kind: "edge", relationId: item.id };
      graphRoot.add(line);

      const arrowT = 0.5;
      const arrowPos = curve.getPoint(arrowT);
      const arrowDir = curve.getTangent(arrowT);
      if (arrowDir.lengthSq() < 1e-6) arrowDir.set(0, 0, 1);
      arrowDir.normalize();
      const arrowHeight = holographic ? 0.32 : 0.36;
      const arrowGeometry = new THREE.ConeGeometry(holographic ? 0.1 : 0.1, arrowHeight, 12);
      const arrowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: holographic ? 1 : 0.95,
        depthWrite: false,
        blending: holographic ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arrowDir);
      arrow.position.copy(arrowPos);
      arrow.userData = { kind: "edge-arrow", relationId: item.id };
      graphRoot.add(arrow);

      const labelTexture = createRelationEdgeLabelTexture(
        item.displayName,
        "",
        color,
        false,
      );
      const labelMaterial = new THREE.SpriteMaterial({
        map: labelTexture,
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
      });
      const label = new THREE.Sprite(labelMaterial);
      label.position.copy(mid);
      label.scale.set(2.1, 0.58, 1);
      label.userData = { kind: "edge-label", relationId: item.id };
      graphRoot.add(label);

      edges.push({
        relationId: item.id,
        line,
        arrow,
        label,
        color,
        sourceName: source,
        targetName: target,
        displayName: item.displayName,
        cardinality: item.cardinality,
      });
    }

    controls.target.set(0, 0.2, 0);
    camera.position.set(0, 9.5, 16);
    if (holographic) {
      const radius = Math.max(7, ...nodes.map(node => node.position.length()));
      camera.position.set(0, radius * 1.25, radius * 1.9);
    }
    controls.update();
  };

  const pick = (event: PointerEvent): { kind: "node" | "edge"; id: string } | null => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const targets: THREE.Object3D[] = [
      ...nodes.map((item) => item.sprite),
      ...nodes.flatMap((item) => item.hologram ? [item.hologram.children[0]!] : []),
      ...edges.map((item) => item.line),
      ...edges.map((item) => item.label),
    ];
    const hits = raycaster.intersectObjects(targets, false);
    const hit = hits[0];
    if (!hit) return null;
    const kind = String(hit.object.userData.kind ?? "");
    if (kind === "node") return { kind: "node", id: String(hit.object.userData.name ?? "") };
    if (kind === "edge" || kind === "edge-label") {
      return { kind: "edge", id: String(hit.object.userData.relationId ?? "") };
    }
    return null;
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (disposed) return;
    const hit = pick(event);
    const nextRelation = hit?.kind === "edge" ? hit.id : null;
    const nextNode = hit?.kind === "node" ? hit.id : null;
    if (nextRelation === hoveredRelationId && nextNode === hoveredNodeName) {
      renderer.domElement.style.cursor = hit ? "pointer" : "grab";
      return;
    }
    hoveredRelationId = nextRelation;
    hoveredNodeName = nextNode;
    renderer.domElement.style.cursor = hit ? "pointer" : "grab";
    refreshHighlight();
  };

  const onPointerLeave = (): void => {
    hoveredRelationId = null;
    hoveredNodeName = null;
    renderer.domElement.style.cursor = "grab";
    refreshHighlight();
  };

  const onContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
    const hit = pick(event as PointerEvent);
    if (!hit || hit.kind !== "edge") return;
    options.onEdgeContextMenu(hit.id, event.clientX, event.clientY);
  };

  const onClick = (): void => {
    // 留给外层关闭菜单
  };

  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerleave", onPointerLeave);
  renderer.domElement.addEventListener("contextmenu", onContextMenu);
  renderer.domElement.addEventListener("click", onClick);

  const animate = (): void => {
    if (disposed) return;
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };

  resize();
  animate();

  const dispose = (): void => {
    disposed = true;
    cancelAnimationFrame(animationId);
    buildToken += 1;
    renderer.domElement.removeEventListener("pointermove", onPointerMove);
    renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
    renderer.domElement.removeEventListener("contextmenu", onContextMenu);
    renderer.domElement.removeEventListener("click", onClick);
    controls.dispose();
    clearGraph();
    scene.remove(ambient, key, fill, graphRoot);
    renderer.dispose();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };

  return { setData, resize, dispose };
}
