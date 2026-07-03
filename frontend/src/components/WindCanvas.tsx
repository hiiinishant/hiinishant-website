"use client";

import { useEffect, useRef } from "react";

/* ─── TYPES ─── */

interface CircuitPath {
  points: { x: number; y: number }[];
  progress: number;
  speed: number;
  color: string;
  width: number;
  life: number;
  maxLife: number;
}

interface DataNode {
  x: number;
  y: number;
  radius: number;
  pulsePhase: number;
  connections: number[];
  color: string;
}

interface DataPacket {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  opacity: number;
  life: number;
  maxLife: number;
  speed: number;
  size: number;
  color: string;
}

interface BannerText {
  x: number;
  y: number;
  text: string;
  size: number;
  life: number;
  maxLife: number;
  revealed: number;
  color: string;
  glitchPhase: number;
}

/* ─── HELPERS ─── */

function rnd(a: number, b: number) { return a + Math.random() * (b - a); }
function rndInt(a: number, b: number) { return Math.floor(rnd(a, b)); }

const TECH_WORDS = [
  "2 AM Study", "2amstudy.com", "@hiiinishant",
  "Visit 2 AM Study", "Join 2 AM Study", "2 AM Study ✦",
  "→ 2amstudy.online", "2 AM Study Community", "Learn with 2 AM Study",
];

const CYBER_COLORS = {
  green: "0,255,136",
  cyan: "0,230,255",
  amber: "245,158,11",
  purple: "160,100,255",
  white: "255,255,255",
  blue: "80,160,255",
};

function pickCyber() {
  const keys = Object.values(CYBER_COLORS);
  return keys[Math.floor(Math.random() * keys.length)];
}

/* ─── COMPONENT ─── */

export default function WindCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = 0, H = 0;

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* ─── STATE ─── */

    const circuits: CircuitPath[] = [];
    const nodes: DataNode[] = [];
    const packets: DataPacket[] = [];
    const banners: BannerText[] = [];
    const texts: FloatingText[] = [];

    let frame = 0;

    /* ─── INIT NEURAL NETWORK NODES ─── */
    const NODE_COUNT = Math.floor(rnd(8, 14));
    for (let i = 0; i < NODE_COUNT; i++) {
      const conns: number[] = [];
      const numConns = rndInt(1, 4);
      for (let j = 0; j < numConns; j++) {
        conns.push(rndInt(0, NODE_COUNT));
      }
      nodes.push({
        x: rnd(W * 0.05, W * 0.95),
        y: rnd(H * 0.05, H * 0.95),
        radius: rnd(2, 5),
        pulsePhase: Math.random() * Math.PI * 2,
        connections: conns,
        color: pickCyber(),
      });
    }

    /* ─── SPAWN FUNCTIONS ─── */

    function spawnCircuit() {
      const pts: { x: number; y: number }[] = [];
      let cx = rnd(-50, W * 0.3);
      let cy = rnd(H * 0.1, H * 0.9);
      pts.push({ x: cx, y: cy });

      const segments = rndInt(4, 10);
      for (let i = 0; i < segments; i++) {
        if (Math.random() > 0.5) {
          cx += rnd(30, 120);
        } else {
          cy += rnd(-60, 60);
        }
        pts.push({ x: cx, y: cy });
      }

      circuits.push({
        points: pts,
        progress: 0,
        speed: rnd(0.008, 0.025),
        color: pickCyber(),
        width: rnd(0.8, 2),
        life: 0,
        maxLife: Math.floor(rnd(180, 350)),
      });
    }

    function spawnPacket() {
      if (nodes.length < 2) return;
      const from = rndInt(0, nodes.length);
      const to = nodes[from].connections[rndInt(0, nodes[from].connections.length)] ?? rndInt(0, nodes.length);
      if (from === to) return;
      packets.push({
        fromNode: from,
        toNode: to,
        progress: 0,
        speed: rnd(0.015, 0.04),
        color: pickCyber(),
      });
    }

    function getSafeX(estimatedWidth: number) {
      const halfBlockWidth = Math.min(320, W * 0.35);
      const leftBound = W / 2 - halfBlockWidth;
      const rightBound = W / 2 + halfBlockWidth;

      const leftSafeMax = leftBound - estimatedWidth;
      const rightSafeMin = rightBound;

      const canLeft = leftSafeMax > 15;
      const canRight = W - rightSafeMin - estimatedWidth > 15;

      if (canLeft && canRight) {
        return Math.random() > 0.5 ? rnd(15, leftSafeMax) : rnd(rightSafeMin, W - estimatedWidth - 15);
      } else if (canLeft) {
        return rnd(15, leftSafeMax);
      } else if (canRight) {
        return rnd(rightSafeMin, W - estimatedWidth - 15);
      } else {
        return Math.random() > 0.5 ? rnd(5, 15) : rnd(W - estimatedWidth - 15, W - 5);
      }
    }

    function isInsideExclusionZone(x: number, y: number, width: number = 100, height: number = 30) {
      const halfBlockWidth = Math.min(320, W * 0.35);
      const halfBlockHeight = Math.min(100, H * 0.45);
      const xStart = W / 2 - halfBlockWidth;
      const xEnd = W / 2 + halfBlockWidth;
      const yStart = H / 2 - halfBlockHeight;
      const yEnd = H / 2 + halfBlockHeight;

      return (
        x + width >= xStart &&
        x <= xEnd &&
        y + height >= yStart &&
        y - height <= yEnd
      );
    }

    function spawnText() {
      if (texts.length >= 4) return;
      const word = TECH_WORDS[rndInt(0, TECH_WORDS.length)];
      const size = rnd(10, 15);
      const estWidth = word.length * (size * 0.6);
      const x = getSafeX(estWidth);
      texts.push({
        x,
        y: rnd(H * 0.08, H * 0.92),
        text: word,
        opacity: 0,
        life: 0,
        maxLife: rndInt(120, 250),
        speed: rnd(-0.2, -0.5),
        size,
        color: [CYBER_COLORS.amber, CYBER_COLORS.cyan, CYBER_COLORS.white][rndInt(0, 3)],
      });
    }

    function spawnBanner() {
      if (banners.length >= 2) return;
      const msgs = [
        "Visit 2 AM Study Store",
        "⚡  2AMSTUDY.COM  ⚡",
        "★  JOIN 2 AM STUDY  ★",
      ];
      const slots = [H * 0.3, H * 0.7];
      const usedY = banners.map(b => b.y);
      const available = slots.filter(s => !usedY.some(uy => Math.abs(uy - s) < H * 0.2));
      const y = available.length > 0 ? available[rndInt(0, available.length)] : rnd(H * 0.25, H * 0.75);

      const msg = msgs[rndInt(0, msgs.length)];
      const size = rnd(15, 22);
      const estWidth = msg.length * (size * 0.65);
      const x = getSafeX(estWidth);

      banners.push({
        x,
        y,
        text: msg,
        size,
        life: 0,
        maxLife: rndInt(250, 380),
        revealed: 0,
        color: [CYBER_COLORS.amber, CYBER_COLORS.cyan][rndInt(0, 2)],
        glitchPhase: Math.random() * Math.PI * 2,
      });
    }

    // Initial spawns
    for (let i = 0; i < 3; i++) spawnCircuit();
    for (let i = 0; i < 4; i++) spawnPacket();
    for (let i = 0; i < 2; i++) spawnText();
    spawnBanner();

    /* ─── DRAW LOOP ─── */
    const draw = () => {
      frame++;

      // Fade previous frame
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, W, H);

      // Spawning
      if (frame % rndInt(30, 55) === 0) spawnCircuit();
      if (frame % rndInt(15, 30) === 0) spawnPacket();
      if (frame % rndInt(50, 90) === 0) spawnText();
      if (frame % rndInt(180, 320) === 0) spawnBanner();

      /* ── CIRCUIT BOARD TRACES ── */
      for (let i = circuits.length - 1; i >= 0; i--) {
        const c = circuits[i];
        c.life++;
        c.progress = Math.min(1, c.progress + c.speed);

        if (c.life >= c.maxLife) { circuits.splice(i, 1); continue; }

        const fadeOut = c.life > c.maxLife * 0.7 ? 1 - (c.life - c.maxLife * 0.7) / (c.maxLife * 0.3) : 1;
        const totalLen = c.points.length - 1;
        const drawnSegments = Math.floor(c.progress * totalLen);

        // Static path (dim)
        ctx.strokeStyle = `rgba(${c.color},${0.08 * fadeOut})`;
        ctx.lineWidth = c.width;
        ctx.beginPath();
        ctx.moveTo(c.points[0].x, c.points[0].y);
        for (let j = 1; j < c.points.length; j++) {
          ctx.lineTo(c.points[j].x, c.points[j].y);
        }
        ctx.stroke();

        // Animated bright leading edge
        if (drawnSegments < totalLen) {
          const segIdx = drawnSegments;
          const segProg = (c.progress * totalLen) - segIdx;
          const p1 = c.points[segIdx];
          const p2 = c.points[segIdx + 1];
          const hx = p1.x + (p2.x - p1.x) * segProg;
          const hy = p1.y + (p2.y - p1.y) * segProg;

          // Glow at head
          const headGlow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 12);
          headGlow.addColorStop(0, `rgba(${c.color},${0.6 * fadeOut})`);
          headGlow.addColorStop(1, `rgba(${c.color},0)`);
          ctx.fillStyle = headGlow;
          ctx.beginPath();
          ctx.arc(hx, hy, 12, 0, Math.PI * 2);
          ctx.fill();

          // Bright dot
          ctx.fillStyle = `rgba(255,255,255,${0.9 * fadeOut})`;
          ctx.beginPath();
          ctx.arc(hx, hy, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Junction dots
        for (let j = 0; j <= drawnSegments && j < c.points.length; j++) {
          const pt = c.points[j];
          ctx.fillStyle = `rgba(${c.color},${0.4 * fadeOut})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* ── NEURAL NETWORK ── */
      for (const node of nodes) {
        node.pulsePhase += 0.02;
        for (const ci of node.connections) {
          if (ci >= nodes.length) continue;
          const target = nodes[ci];
          const pulse = 0.04 + Math.sin(node.pulsePhase) * 0.02;
          ctx.strokeStyle = `rgba(${CYBER_COLORS.cyan},${pulse})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      }

      for (const node of nodes) {
        const pulse = 0.3 + Math.sin(node.pulsePhase) * 0.2;
        const ng = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 4);
        ng.addColorStop(0, `rgba(${node.color},${pulse * 0.5})`);
        ng.addColorStop(1, `rgba(${node.color},0)`);
        ctx.fillStyle = ng;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${node.color},${pulse})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ── DATA PACKETS ── */
      for (let i = packets.length - 1; i >= 0; i--) {
        const pk = packets[i];
        pk.progress += pk.speed;
        if (pk.progress >= 1) { packets.splice(i, 1); continue; }
        if (pk.fromNode >= nodes.length || pk.toNode >= nodes.length) { packets.splice(i, 1); continue; }

        const from = nodes[pk.fromNode];
        const to = nodes[pk.toNode];
        const px = from.x + (to.x - from.x) * pk.progress;
        const py = from.y + (to.y - from.y) * pk.progress;

        const pg = ctx.createRadialGradient(px, py, 0, px, py, 8);
        pg.addColorStop(0, `rgba(${pk.color},0.8)`);
        pg.addColorStop(0.5, `rgba(${pk.color},0.2)`);
        pg.addColorStop(1, `rgba(${pk.color},0)`);
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255,255,255,0.95)`;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ── FLOATING TECH TEXT ── */
      for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i];
        t.life++;
        if (t.life >= t.maxLife) { texts.splice(i, 1); continue; }

        t.y += t.speed;

        const estWidth = t.text.length * (t.size * 0.6);
        if (isInsideExclusionZone(t.x, t.y, estWidth, t.size)) {
          continue;
        }

        const prog = t.life / t.maxLife;
        t.opacity = prog < 0.15 ? prog / 0.15 : prog > 0.75 ? (1 - prog) / 0.25 : 1;
        t.opacity *= 0.35;

        ctx.font = `${t.size}px 'Courier New', monospace`;
        ctx.fillStyle = `rgba(${t.color},${t.opacity})`;
        ctx.fillText(t.text, t.x, t.y);
      }

      /* ── BANNER TEXT ── */
      for (let i = banners.length - 1; i >= 0; i--) {
        const b = banners[i];
        b.life++;
        b.glitchPhase += 0.03;
        if (b.life >= b.maxLife) { banners.splice(i, 1); continue; }

        if (b.revealed < b.text.length) {
          b.revealed += (b.life % 3 === 0) ? 1 : 0;
        }
        const shown = b.text.slice(0, Math.floor(b.revealed));
        if (shown.length === 0) continue;

        const estWidth = shown.length * (b.size * 0.65);
        if (isInsideExclusionZone(b.x, b.y, estWidth, b.size)) {
          continue;
        }

        const t = b.life / b.maxLife;
        const fade = t < 0.08 ? t / 0.08
          : t > 0.75 ? (1 - t) / 0.25
            : 1;
        const alpha = fade * 0.45;
        if (alpha < 0.01) continue;

        ctx.font = `bold ${b.size}px 'Courier New', monospace`;
        ctx.letterSpacing = "2px";

        ctx.fillStyle = `rgba(${b.color},${alpha * 0.2})`;
        ctx.fillText(shown, b.x, b.y);

        ctx.fillStyle = `rgba(${b.color},${alpha})`;
        ctx.fillText(shown, b.x, b.y);

        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.35})`;
        ctx.fillText(shown, b.x, b.y);

        if (b.revealed < b.text.length && Math.sin(b.life * 0.2) > 0) {
          const textW = ctx.measureText(shown).width;
          ctx.fillStyle = `rgba(${b.color},${alpha})`;
          ctx.fillRect(b.x + textW + 3, b.y - b.size + 3, 2, b.size);
        }

        const textWidth = ctx.measureText(shown).width;
        const ulGrad = ctx.createLinearGradient(b.x, b.y + 4, b.x + textWidth, b.y + 4);
        ulGrad.addColorStop(0, `rgba(${b.color},0)`);
        ulGrad.addColorStop(0.3, `rgba(${b.color},${alpha * 0.5})`);
        ulGrad.addColorStop(0.7, `rgba(${b.color},${alpha * 0.5})`);
        ulGrad.addColorStop(1, `rgba(${b.color},0)`);
        ctx.strokeStyle = ulGrad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + 4);
        ctx.lineTo(b.x + textWidth, b.y + 4);
        ctx.stroke();

        ctx.letterSpacing = "0px";
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
