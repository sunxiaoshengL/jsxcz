import Bullet from './Bullet';
import Enemy from './Enemy';
import { GameState } from './Game_v2';
import DamageText from './DamageText';

interface ThermobaricConfig {
    hasExplosion: boolean;
    isFire: boolean;
    hasSparks: boolean;
    explosionDamageMult: number; // default 1.0 (base + 25% = 1.25 * baseDamage, managed by logic)
    explosionRadius: number;
    explosionAppliesBurn: boolean;
    explosionBurnDuration: number;
    canStun: boolean;
    burnDamageMult: number;
    burnMaxHPDamage: number; // 0.03 for 3%
}

export default class ThermobaricBullet extends Bullet {
    private config: ThermobaricConfig;

    constructor(
        x: number, 
        y: number, 
        speed: number, 
        damage: number, 
        config: ThermobaricConfig,
        target?: Enemy, 
        angle: number = 0
    ) {
        super(x, y, speed, damage, target, angle);
        this.config = config;

        this.width = 16;
        this.height = 16;
    }

    render(ctx: CanvasRenderingContext2D): void {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const length = this.height * 2.4;
        const radius = this.width / 2;
        const isFire = this.config.isFire;

        const coreStart = isFire ? '#ffd1a8' : '#ffe0b2';
        const coreEnd = isFire ? '#ff3d00' : '#ff8f00';
        const rim = isFire ? '#ff6d00' : '#ffb74d';
        const glow = isFire ? 'rgba(255, 80, 0, 0.7)' : 'rgba(255, 180, 80, 0.55)';

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.angle);

        ctx.globalAlpha = 0.9;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(0, length * 0.15, radius * 2.6, radius * 2.2, 0, 0, Math.PI * 2);
        ctx.fill();

        if (isFire) {
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = 'rgba(255, 120, 0, 0.55)';
            ctx.beginPath();
            ctx.moveTo(0, length * 0.9);
            ctx.lineTo(-radius * 1.4, length * 0.35);
            ctx.lineTo(0, length * 0.45);
            ctx.lineTo(radius * 1.4, length * 0.35);
            ctx.closePath();
            ctx.fill();
        }

        const gradient = ctx.createLinearGradient(0, -length * 0.8, 0, length * 0.8);
        gradient.addColorStop(0, coreStart);
        gradient.addColorStop(1, coreEnd);
        ctx.fillStyle = gradient;
        ctx.strokeStyle = rim;
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(-radius, -length * 0.6);
        ctx.lineTo(radius, -length * 0.6);
        ctx.arc(radius, -length * 0.6 + radius, radius, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(-radius, length * 0.6);
        ctx.arc(-radius, -length * 0.6 + radius, radius, Math.PI / 2, -Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!isFire) {
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -length * 0.35, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    onHit(target: Enemy | any, state: GameState): void {
        // 1. Fire Bullet Logic (Apply Burn)
        if (this.config.isFire) {
            if (target instanceof Enemy) {
                target.isBurning = true;
                target.burnTimer = 6.0;
                // Burn damage per second = base damage * 0.3
                // We store per-second damage in enemy, or handle it in enemy update
                // Enemy.ts needs update to support custom burn damage
                target.burnDamage = this.damage * this.config.burnDamageMult; 
                // Advanced: max HP damage (handled in Enemy update if we add support, or here?)
                // Enemy update logic for burn is: takeDamage(burnDamage * dt)
                // If we want max HP damage, we need to pass that info to enemy too.
                // For now, let's assume Enemy has 'burnMaxHPDamageRate' property we can add.
                (target as any).burnMaxHPDamageRate = this.config.burnMaxHPDamage;
            }
        }

        // 2. Bullet Explosion Logic
        if (this.config.hasExplosion) {
            if (Math.random() < 0.25) {
                this.triggerExplosion(state);
                if (this.config.hasSparks) {
                    this.spawnSparks(state);
                }
            }
        }
        
        // 4. Stun Logic
        if (this.config.canStun) {
             if (target instanceof Enemy && Math.random() < 0.2) {
                 // Stun for 1s. Enemy needs 'stunTimer'
                 (target as any).stunTimer = 1.0;
             }
        }
    }

    private triggerExplosion(state: GameState): void {
        // Range: 2.5 grids. Grid size is roughly enemy size (40px)? 
        // Let's assume 1 grid = 40px, so 2.5 grids = 100px radius.
        const radius = this.config.explosionRadius;
        const explosionDamage = this.damage * (1 + 0.25) * this.config.explosionDamageMult;

        // Visual Effect (Placeholder)
        // In a real game, we'd spawn a ParticleSystem or ExplosionObject.
        // For now, maybe just draw it for 1 frame? Or spawn a temporary visual object.
        // Since we don't have a visual effect system yet, we'll skip the visual persistence 
        // or maybe push a special "ExplosionEffect" to a list in GameState if we had one.
        // We'll just rely on DamageNumbers appearing to show it happened.
        
        // Apply AOE
        state.enemies.forEach(enemy => {
            if (enemy.isDead) return;
            const dx = enemy.x + enemy.width/2 - (this.x + this.width/2);
            const dy = enemy.y + enemy.height/2 - (this.y + this.height/2);
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist <= radius) {
                enemy.takeDamage(explosionDamage);
                state.damageTexts.push(new DamageText(enemy.x, enemy.y, explosionDamage, false));
                if (this.config.explosionAppliesBurn) {
                    enemy.isBurning = true;
                    enemy.burnTimer = this.config.explosionBurnDuration;
                    enemy.burnDamage = this.damage * this.config.burnDamageMult;
                    (enemy as any).burnMaxHPDamageRate = this.config.burnMaxHPDamage;
                }
            }
        });
    }

    private spawnSparks(state: GameState): void {
        // Spawn 3 sparks
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const sparkDamage = this.damage * 0.5;
            // Sparks are just bullets with short life/bouncing? 
            // "Bounce 3 grids" -> roughly travel 120px?
            // Let's create simple bullets that travel a bit and die.
            const spark = new Bullet(
                this.x, 
                this.y, 
                this.speed * 1.5, 
                sparkDamage, 
                undefined, 
                angle
            );
            spark.width = 4;
            spark.height = 4;
            // Spark visual override? Bullet class renders rects. 
            // We can let them be orange small rects.
            spark.isMainBullet = false; 
            state.bullets.push(spark);
        }
    }
}
