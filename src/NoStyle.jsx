import { useState, useEffect, useRef, useCallback } from "react";
import "./NoStyle.css";

const STYLES = {
  DeepObsidian: {
    name: "DEEP OBSIDIAN",
    desc: "SILENCE · GRAVITY · INTROSPECTION",
    color: [80, 60, 160],
  },
  HarmonicFlow: {
    name: "HARMONIC FLOW",
    desc: "ORDER · ELEGANCE · PRECISION",
    color: [40, 160, 180],
  },
  CosmicKinetic: {
    name: "COSMIC KINETIC",
    desc: "ENERGY · CHAOS · PASSION",
    color: [220, 80, 60],
  },
  ReactiveEcho: {
    name: "REACTIVE ECHO",
    desc: "CURIOSITY · RESONANCE · SENSITIVITY",
    color: [80, 200, 120],
  },
};

// SCORE_GOAL
const SCORE_GOAL = 1500;


// --- 粒子生成ロジック ---

function createParticle(W, H, phase) {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    size: Math.random() * 10 + 0.5,
    life: Math.random() * 150,
    maxLife: 120 + Math.random() * 200,
    speed: Math.random() * 0.8 + 0.1,
    angle: Math.random() * Math.PI * 2,
    faction:
      phase === "pre"
        ? "neutral"
        : ["neutral", "flee", "approach"][Math.floor(Math.random() * 3)],
    converging: false,
    cx: 0,
    cy: 0,
    initialHue: Math.random() * 360,
  };
}


// --- メインコンポーネント ---

export default function NoStyle() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const s = useRef({
    mx: 0, my: 0,
    started: false, ended: false,
    totalDist: 0, triggeredDist: 0,
    prevX: 0, prevY: 0,
    frameCount: 0, idleFrames: 0,
    edgeFrames: 0, straightFrames: 0,
    lastMx: 0, lastMy: 0,
    velocities: [], backBtnTouches: 0,
    phase: "pre",
    styleColor: [120, 160, 200],
    particles: [],
    W: 0, H: 0,
    triggerPoints: {
      DeepObsidian: 0,
      HarmonicFlow: 0,
      CosmicKinetic: 0,
      ReactiveEcho: 0
    },
    scores: {
      DeepObsidian: 0,
      HarmonicFlow: 0,
      CosmicKinetic: 0,
      ReactiveEcho: 0,
    },
    currentMax: 0,
    leadingStyle: "HarmonicFlow",
    spotX: 0,
    spotY: 0,
    spot2X: 0,
    spot2Y: 0,
    spot3X: 0,
    spot3Y: 0,
  });

  const [showText, setShowText] = useState(true);
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [backPos, setBackPos] = useState({ top: 24, left: 24 });
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const c = canvasRef.current;
    const container = containerRef.current;
    const state = s.current;
    state.W = container.offsetWidth;
    state.H = container.offsetHeight;
    state.mx = state.W / 2;
    state.my = state.H / 2;
    state.prevX = state.W / 2;
    state.prevY = state.H / 2;
    state.lastMx = state.W / 2;
    state.lastMy = state.H / 2;
    c.width = state.W;
    c.height = state.H;
    state.particles = Array.from({ length: 250 }, () =>
      createParticle(state.W, state.H, "pre")
    );

    const ctx = c.getContext("2d");

    state.spotX = Math.random() * state.W;
    state.spotY = Math.random() * state.H;

    const moveSpot = () => {
      if (state.phase === "pre") {
        state.spotX = Math.random() * state.W;
        state.spotY = Math.random() * state.H;
        state.spot2X = Math.random() * state.W;
        state.spot2Y = Math.random() * state.H;
        state.spot3X = Math.random() * state.W;
        state.spot3Y = Math.random() * state.H;
      }
    };

    const spotInterval = setInterval(moveSpot, 1200);


    // --- 粒子の更新ロジック ---
    function updateParticle(p) {
      p.life++;
      if (p.life > p.maxLife) {
        Object.assign(p, createParticle(state.W, state.H, state.phase));
        return;
      }
      if (p.converging) {
        p.x += (p.cx - p.x) * 0.05;
        p.y += (p.cy - p.y) * 0.05;
        return;
      }

      const dx = state.mx - p.x;
      const dy = state.my - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxReach = Math.sqrt(state.W * state.W + state.H * state.H);

      const baseRadius = 200;
      const influenceRadius = state.leadingStyle === "CosmicKinetic"
        ? baseRadius + (state.currentMax / 1500) * 300
        : state.leadingStyle === "HarmonicFlow"
        ? baseRadius + (state.currentMax / SCORE_GOAL) * maxReach
        : baseRadius;

      if (state.phase === "active") {
        if (dist < influenceRadius) {
          const targetAngle = Math.atan2(dy, dx);
          let angleDiff = targetAngle - p.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          if (state.leadingStyle === "CosmicKinetic") {
            p.angle -= angleDiff * 0.15;
          } else {
            p.angle += angleDiff * 0.15;
          }
          p.speed = Math.min(p.speed + 0.1, 1.5);
        } else {
          p.angle += (Math.random() - 0.5) * 0.4;
          p.speed = Math.max(p.speed - 0.05, 0.5 + Math.random() * 0.5);
        }
      } else {
        p.angle += (Math.random() - 0.5) * 0.4;
      }

      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;

      if (p.x < 0) p.x = state.W;
      if (p.x > state.W) p.x = 0;
      if (p.y < 0) p.y = state.H;
      if (p.y > state.H) p.y = 0;
    }


    // --- 粒子の描画ロジック ---
    function drawParticle(p) {
      const alpha = p.converging
        ? 0.9
        : Math.sin((p.life / p.maxLife) * Math.PI) * 0.7;

      const progressFactor = Math.min(state.currentMax / 1000, 1);

      const r1 = Math.sin(p.initialHue) * 100 + 155;
      const g1 = Math.sin(p.initialHue + 2) * 100 + 155;
      const b1 = Math.sin(p.initialHue + 4) * 100 + 155;

      const targetRGB = state.styleColor;

      // 色のブレンド
      const r = Math.round(r1 * (1 - progressFactor) + targetRGB[0] * progressFactor);
      const g = Math.round(g1 * (1 - progressFactor) + targetRGB[1] * progressFactor);
      const b = Math.round(b1 * (1 - progressFactor) + targetRGB[2] * progressFactor);

      // 3つのフォーカスポイント
      const focusX = state.phase === "pre" ? state.spotX : state.mx;
      const focusY = state.phase === "pre" ? state.spotY : state.my;
      const focus2X = state.phase === "pre" ? state.spot2X : state.mx;
      const focus2Y = state.phase === "pre" ? state.spot2Y : state.my;
      const focus3X = state.phase === "pre" ? state.spot3X : state.mx;
      const focus3Y = state.phase === "pre" ? state.spot3Y : state.my;

      const dx1 = focusX - p.x;
      const dy1 = focusY - p.y;
      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

      const dx2 = focus2X - p.x;
      const dy2 = focus2Y - p.y;
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      const dx3 = focus3X - p.x;
      const dy3 = focus3Y - p.y;
      const dist3 = Math.sqrt(dx3 * dx3 + dy3 * dy3);
      
      const proximity = Math.max(
        Math.max(0, 1 - dist1 / 180),
        Math.max(0, 1 - dist2 / 180),
        Math.max(0, 1 - dist3 / 180)
      );
      const boostedSize = p.size * (0.4 + proximity * 0.8);



      // Halo effect

      const haloRadius = boostedSize * (0.5 + boostedSize * 1.6);
      const haloAlpha = alpha * (0.1 + boostedSize * 0.008);

      const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloRadius);
      halo.addColorStop(0, `rgba(${r},${g},${b},${haloAlpha})`);
      halo.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, haloRadius, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      const coreAlpha = alpha * (0.5 + boostedSize * 0.08);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(boostedSize * 0.5, 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.min(r+80,255)},${Math.min(g+80,255)},${Math.min(b+80,255)},${coreAlpha})`;
      ctx.fill();
    }

    function loop() {
      // ended後はアニメーションループを停止する
      if (state.ended) {
        // 収束アニメーションだけ少し続けてから止める
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(0, 0, state.W, state.H);
        ctx.globalCompositeOperation = "lighter";
        state.particles.forEach((p) => { updateParticle(p); drawParticle(p); });
        ctx.globalCompositeOperation = "source-over";

        const allConverged = state.leadingStyle === "DeepObsidian"
  ? state.particles.every((p) => p.life >= p.maxLife)
  : state.particles.every((p) => Math.hypot(p.cx - p.x, p.cy - p.y) < 2);
        if (!allConverged) {
          animRef.current = requestAnimationFrame(loop);
        }
        // 全粒子が収束したらループ終了（cancelAnimationFrame不要）
        return;
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, 0, state.W, state.H);

      ctx.globalCompositeOperation = "lighter";

      const vel = Math.hypot(state.mx - state.lastMx, state.my - state.lastMy);
      if (vel < 0.5 && state.started && !state.ended) state.idleFrames++;
      if (vel > 0 && vel < 3 && state.started && !state.ended) state.straightFrames++;
      state.lastMx = state.mx;
      state.lastMy = state.my;
      state.particles.forEach((p) => { updateParticle(p); drawParticle(p); });

      ctx.globalCompositeOperation = "source-over";

      animRef.current = requestAnimationFrame(loop);
    }
    loop();

    const handleResize = () => {
      state.W = container.offsetWidth;
      state.H = container.offsetHeight;
      c.width = state.W;
      c.height = state.H;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(spotInterval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // --- 診断ロジック ---

  const diagnose = useCallback(() => {
    const state = s.current;

    //  修正③: 二重呼び出し防止ガード
    if (state.diagnoseCalled) return;
    state.diagnoseCalled = true;

    const tf = state.frameCount || 1;
    const vels = state.velocities;
    const AvgVel = vels.length ? vels.reduce((a, b) => a + b, 0) / vels.length : 0;
    const VarVel = vels.length
      ? Math.sqrt(vels.map((v) => (v - AvgVel) ** 2).reduce((a, b) => a + b, 0) / vels.length)
      : 0;
    const IdleRatio = state.idleFrames / tf;
    const EdgeRatio = state.edgeFrames / tf;
    const StraightRate = state.straightFrames / tf;
    const Nbt = state.backBtnTouches;


    // スコア
    let scores = { DeepObsidian: 0, HarmonicFlow: 0, CosmicKinetic: 0, ReactiveEcho: 0 };

    // DeepObsidian（最大40点）
    if (IdleRatio >= 0.3) scores.DeepObsidian += 25;
    if (AvgVel <= 3)      scores.DeepObsidian += 10;
    if (EdgeRatio >= 0.3) scores.DeepObsidian += 5;
    // HarmonicFlow（最大40点）
    if (StraightRate >= 0.5) scores.HarmonicFlow += 20;
    if (VarVel <= 4)         scores.HarmonicFlow += 15;
    if (AvgVel >= 3 && AvgVel <= 8) scores.HarmonicFlow += 5;
    // CosmicKinetic（最大35点）
    if (AvgVel >= 10)    scores.CosmicKinetic += 20;
    if (VarVel >= 6)     scores.CosmicKinetic += 10;
    if (IdleRatio < 0.05) scores.CosmicKinetic += 5;
    // ReactiveEcho（最大35点）
    scores.ReactiveEcho += Math.min(Nbt * 8, 20);
    if (EdgeRatio < 0.15) scores.ReactiveEcho += 5;
    if (StraightRate < 0.3) scores.ReactiveEcho += 5;
    if (Nbt >= 3) { scores.ReactiveEcho += 10; scores.CosmicKinetic += 10; }

    if (state.totalDist >= 10000) {
      scores.CosmicKinetic += 10;
      scores.HarmonicFlow += 10;
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    let styleKey = sorted[0][0];

    if (sorted[0][1] === sorted[1][1]) {
      if (scores.HarmonicFlow === sorted[0][1]) styleKey = "HarmonicFlow";
      else if (scores.DeepObsidian === sorted[0][1]) styleKey = "DeepObsidian";
      else styleKey = "ReactiveEcho";
    }

    state.styleColor = STYLES[styleKey].color;
    state.leadingStyle = styleKey;

    
const fixedLogs = {
  DeepObsidian: [
    "確信が持てるまで動かない。",
    "安心できる場所から離れない。",
    "一歩ずつ確かめながら進む。",
  ],
  HarmonicFlow: [
    "決めたら振り返らない。",
    "自分のリズムを崩さない。",
    "秩序の中に安心を見つける。",
  ],
  CosmicKinetic: [
    "止まることを少し怖がっている。",
    "考えるより先に反応する。",
    "エネルギーが方向を決める。",
  ],
  ReactiveEcho: [
    "離れていくものを追いかける。",
    "誰も見ない場所を探している。",
    "反応することで自分を確かめる。",
  ],
};

const randomLogs = {
  DeepObsidian: [
    "必要以上にその場に留まる。",
    "まず観察する。",
    "動く前に全部わかっていたい。",
  ],
  HarmonicFlow: [
    "流れに逆らわない。",
    "整っていないと落ち着かない。",
    "無駄を嫌う。",
  ],
  CosmicKinetic: [
    "十分でも探すことをやめない。",
    "衝動が一番正直だと思っている。",
    "静けさが少し苦手。",
  ],
  ReactiveEcho: [
    "消えそうなものに何度も手を伸ばす。",
    "気になったら確かめずにいられない。",
    "境界線がどこにあるか試したくなる。",
  ],
};

const fixed = fixedLogs[styleKey];
const random = randomLogs[styleKey];
const picked = random[Math.floor(Math.random() * random.length)];
const logs = [...fixed, picked];

    state.particles.forEach((p) => {
  p.converging = true;


  // 収束の形をスタイルごとに変える
if (styleKey === "DeepObsidian") {
  // 収束させず、今いる場所からそのままフェードアウト
  p.converging = false;
  p.life = p.maxLife * 0.6; // 残り寿命を短くして早めに消える
  p.speed = p.speed * 0.3;  // 動きも遅くして静かに消える
}
  
else if (styleKey === "HarmonicFlow") {
  // 今いる場所に留まる（動かない）
  p.cx = p.x;
  p.cy = p.y;
}
  
  
  else if (styleKey === "CosmicKinetic") {
    // 画面全体に爆散（エネルギー感）
    p.cx = Math.random() * state.W;
    p.cy = Math.random() * state.H;

  }
  
  
  
  else if (styleKey === "ReactiveEcho") {
    // 円形に広がる（共鳴感）
    const angle = Math.random() * Math.PI * 2;
    const radius = 150 + Math.random() * 80;
    p.cx = state.W / 2 + Math.cos(angle) * radius;
    p.cy = state.H / 2 + Math.sin(angle) * radius;
  }
});
state.scores = scores;
  setTimeout(() => setResult({ styleKey, logs }), 2000);
}, []);

  const handleMove = useCallback((e) => {
    const state = s.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? state.mx + rect.left;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? state.my + rect.top;
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;

    setCursorPos({ x: clientX, y: clientY });
    state.mx = cx;
    state.my = cy;

    const dist = Math.hypot(cx - state.prevX, cy - state.prevY);
    if (!state.started && dist > 5) {
      state.started = true;
      state.phase = "active";
      state.styleColor = [120, 160, 200];
      state.particles.forEach((p) => {
        p.faction = ["neutral", "flee", "approach"][Math.floor(Math.random() * 3)];
      });
      setTimeout(() => { setShowText(false); }, 1500);
      setActive(true);
    }

    if (state.started && !state.ended) {
      state.prevX = cx;
      state.prevY = cy;

      state.velocities.push(Math.min(dist, 20));
      if (state.velocities.length > 500) state.velocities.shift();
      state.frameCount++;

      const vel = Math.min(dist, 20);
      state.triggeredDist += vel;
      state.totalDist += vel;
      const isEdge = cx < 80 || cx > state.W - 80 || cy < 80 || cy > state.H - 80;
      if (isEdge) state.edgeFrames++;

      if (vel > 12) {
        state.triggerPoints.CosmicKinetic += 8;
      } else if (vel > 3 && vel < 8) {
        state.triggerPoints.HarmonicFlow += 5;
      } else if (vel < 1) {
        state.triggerPoints.DeepObsidian += 4;
      }
      if (isEdge) {
        state.triggerPoints.ReactiveEcho += 3;
      }

      const tf = state.frameCount || 1;
      const vels = state.velocities;
      const AvgVel = vels.length ? vels.reduce((a, b) => a + b, 0) / vels.length : 0;
      const VarVel = vels.length
        ? Math.sqrt(vels.map((v) => (v - AvgVel) ** 2).reduce((a, b) => a + b, 0) / vels.length)
        : 0;
      const IdleRatio = state.idleFrames / tf;
      const EdgeRatio = state.edgeFrames / tf;
      const StraightRate = state.straightFrames / tf;
      const Nbt = state.backBtnTouches;



      // スコア計算ロジック（リアルタイム更新）
      const liveScores = { DeepObsidian: 0, HarmonicFlow: 0, CosmicKinetic: 0, ReactiveEcho: 0 };
      if (IdleRatio >= 0.3) liveScores.DeepObsidian += 25;
      if (AvgVel <= 3)      liveScores.DeepObsidian += 10;
      if (EdgeRatio >= 0.3) liveScores.DeepObsidian += 5;
      if (StraightRate >= 0.5) liveScores.HarmonicFlow += 20;
      if (VarVel <= 4)         liveScores.HarmonicFlow += 15;
      if (AvgVel >= 3 && AvgVel <= 8) liveScores.HarmonicFlow += 5;
      if (AvgVel >= 10)     liveScores.CosmicKinetic += 20;
      if (VarVel >= 6)      liveScores.CosmicKinetic += 10;
      if (IdleRatio < 0.05) liveScores.CosmicKinetic += 5;
      liveScores.ReactiveEcho += Math.min(Nbt * 8, 20);
      if (EdgeRatio < 0.15)    liveScores.ReactiveEcho += 5;
      if (StraightRate < 0.3)  liveScores.ReactiveEcho += 5;
      if (Nbt >= 3) { liveScores.ReactiveEcho += 5; liveScores.CosmicKinetic += 5; }
      if (state.totalDist >= 10000) {
        liveScores.CosmicKinetic += 10;
        liveScores.HarmonicFlow += 10;
      }
      const leadingStyle = Object.entries(liveScores).sort((a, b) => b[1] - a[1])[0][0];
      state.styleColor = STYLES[leadingStyle].color;
      state.leadingStyle = leadingStyle;

      // 🔧 修正①: SCORE_GOALを定数から参照
      const currentMax = Math.max(...Object.values(state.triggerPoints));
      state.currentMax = currentMax;
      setProgress(Math.min((currentMax / SCORE_GOAL) * 100, 100));

      if (currentMax >= SCORE_GOAL && !state.ended) {
        state.ended = true;
        diagnose();
      }
    }
  }, [diagnose]);

  const handleBackHover = useCallback(() => {
    const state = s.current;
    if (!state.started || state.ended) return;
    state.backBtnTouches++;
    state.triggerPoints.ReactiveEcho += 100;

    const currentMax = Math.max(...Object.values(state.triggerPoints));

    // SCORE_GOALを定数から参照
    if (currentMax >= SCORE_GOAL) {
      state.ended = true;
      diagnose();
    } else {
      const W = containerRef.current.offsetWidth;
      const H = containerRef.current.offsetHeight;
      setBackPos({
        top: 20 + Math.random() * (H - 50),
        left: 20 + Math.random() * (W - 90)
      });
    }
  }, [diagnose]);

  const styleData = result ? STYLES[result.styleKey] : null;

  return (
    <div
      ref={containerRef}
      className="ns-root"
      onMouseMove={handleMove}
      onTouchMove={(e) => { e.preventDefault(); handleMove(e); }}
    >
      <canvas ref={canvasRef} className="ns-canvas" />

      <div className="ns-cursor" style={{ left: cursorPos.x, top: cursorPos.y }} />

      <div className={`ns-center-text ${!showText ? "is-hidden" : ""}`}>
        <div className="ns-main-text">you have no style</div>
        <div className="ns-sub-text">move to begin</div>
      </div>

      {active && !result && (
        <div className="ns-progress-wrap">
          <div className="ns-progress-bar">
            <div className="ns-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="ns-progress-label">READING YOUR PATTERN</div>
        </div>
      )}

      <div
        className="ns-back-btn"
        style={{ top: backPos.top, left: backPos.left }}
        onMouseEnter={handleBackHover}
      >
        exit
      </div>

      {result && styleData && (
        <div className="ns-result">
          <div className="ns-style-name">{styleData.name}</div>
          <div className="ns-style-line" />
          <div className="ns-style-desc">{styleData.desc}</div>
          <div className="ns-log-wrap">
            {result.logs.map((l, i) => (
              <div key={i} className="ns-log-line" style={{ animationDelay: `${1.3 + i * 0.2}s` }}>
                {l}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

