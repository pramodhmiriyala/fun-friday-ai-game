import { Injectable } from '@angular/core';

interface Piece {
  x: number; y: number; vx: number; vy: number; size: number;
  rot: number; vr: number; color: string; shape: number; life: number;
}

const COLORS = ['#a855f7', '#3b82f6', '#ec4899', '#22d3ee', '#facc15', '#ffffff', '#f97316'];

/** Full-screen canvas confetti, no dependencies. */
@Injectable({ providedIn: 'root' })
export class ConfettiService {
  private canvas?: HTMLCanvasElement;
  private pieces: Piece[] = [];
  private raf = 0;
  private rainUntil = 0;

  private ensure() {
    if (this.canvas) return;
    const c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:3000';
    document.body.appendChild(c);
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize();
    addEventListener('resize', resize);
    this.canvas = c;
  }

  burst(x = 0.5, y = 0.5, count = 160) {
    this.ensure();
    const w = this.canvas!.width, h = this.canvas!.height;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 4 + Math.random() * 12;
      this.pieces.push(this.piece(x * w, y * h, Math.cos(a) * s, Math.sin(a) * s - 6));
    }
    this.run();
  }

  cannons(count = 120) {
    this.ensure();
    const h = this.canvas!.height, w = this.canvas!.width;
    for (let i = 0; i < count; i++) {
      const left = i % 2 === 0;
      this.pieces.push(this.piece(left ? 0 : w, h * 0.9, (left ? 1 : -1) * (6 + Math.random() * 12), -(10 + Math.random() * 14)));
    }
    this.run();
  }

  rain(ms = 6000) {
    this.ensure();
    this.rainUntil = Date.now() + ms;
    this.run();
  }

  private piece(x: number, y: number, vx: number, vy: number): Piece {
    return {
      x, y, vx, vy, size: 6 + Math.random() * 8, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)], shape: Math.floor(Math.random() * 3), life: 1,
    };
  }

  private run() {
    if (this.raf) return;
    const ctx = this.canvas!.getContext('2d')!;
    const loop = () => {
      const c = this.canvas!;
      ctx.clearRect(0, 0, c.width, c.height);
      if (Date.now() < this.rainUntil && this.pieces.length < 400) {
        for (let i = 0; i < 4; i++) this.pieces.push(this.piece(Math.random() * c.width, -20, (Math.random() - 0.5) * 3, 2 + Math.random() * 4));
      }
      for (const p of this.pieces) {
        p.vy += 0.25; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y > c.height * 0.8) p.life -= 0.02;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 0) ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else if (p.shape === 1) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2.5, 0, 7); ctx.fill(); }
        else { ctx.beginPath(); ctx.moveTo(0, -p.size / 2); ctx.lineTo(p.size / 2, p.size / 2); ctx.lineTo(-p.size / 2, p.size / 2); ctx.fill(); }
        ctx.restore();
      }
      this.pieces = this.pieces.filter((p) => p.life > 0 && p.y < c.height + 50);
      if (this.pieces.length || Date.now() < this.rainUntil) this.raf = requestAnimationFrame(loop);
      else { this.raf = 0; ctx.clearRect(0, 0, c.width, c.height); }
    };
    this.raf = requestAnimationFrame(loop);
  }
}
