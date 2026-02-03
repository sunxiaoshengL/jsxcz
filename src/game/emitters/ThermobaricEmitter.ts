import { GameState } from '../Game_v2';
import ThermobaricBullet from '../ThermobaricBullet';
import Enemy from '../Enemy';

export default class ThermobaricEmitter {
    private state: GameState;
    private timer: number = 0;
    private interval: number = 5.0; // 5 seconds
    private level: number = 0;

    // Config cache (updated on skill change)
    private config = {
        hasExplosion: false,
        isFire: false,
        hasSparks: false,
        explosionDamageMult: 1.0,
        explosionRadius: 100,
        explosionAppliesBurn: false,
        explosionBurnDuration: 6,
        canStun: false,
        burnDamageMult: 1.0,
        burnMaxHPDamage: 0,
        extraBullets: 0,
        damagePenalty: 0
    };

    constructor(state: GameState) {
        this.state = state;
    }

    update(deltaTime: number): void {
        // Sync with skill system to check if unlocked and get level
        // In a real optimized system, we'd use events or check only when skills change.
        // For now, we check activeSkills list in GameState which is updated by SkillSystem.
        
        // Find core skill level
        const coreSkill = this.state.activeSkills.find(s => s.id === 'thermobaric_bomb');
        if (!coreSkill) return; // Not unlocked

        this.level = coreSkill.level;
        this.updateConfig();

        this.timer += deltaTime;
        if (this.timer >= this.interval) {
            this.timer = 0;
            this.fire();
        }
    }

    private updateConfig(): void {
        const skills = this.state.activeSkills;
        const hasSkill = (id: string) => skills.some(s => s.id === id);

        this.config.hasExplosion = hasSkill('bullet_explosion');
        this.config.isFire = hasSkill('thermobaric_fire_bullet');
        this.config.hasSparks = hasSkill('explosion_spark');
        this.config.canStun = hasSkill('thermobaric_shock') && this.level >= 18; // Level 18 effect placeholder
        
        // Base multipliers
        this.config.explosionDamageMult = 1.0;
        this.config.explosionRadius = 100;
        this.config.explosionAppliesBurn = hasSkill('thermal_ignition');
        this.config.explosionBurnDuration = 6;
        this.config.burnDamageMult = 1.0;
        this.config.burnMaxHPDamage = 0;
        this.config.extraBullets = 0;
        this.config.damagePenalty = 0;

        // Apply Modifiers
        if (hasSkill('thermobaric_burst')) {
            this.config.extraBullets += 1;
            this.config.damagePenalty += 0.2; // 20% reduction
        }

        if (hasSkill('thermal_explosion')) {
            this.config.explosionDamageMult += 0.8; // +80%
        }
        if (hasSkill('bullet_explosion_damage')) {
            this.config.explosionDamageMult += 0.6;
        }
        if (hasSkill('bullet_explosion_range')) {
            this.config.explosionRadius *= 1.5;
        }

        if (hasSkill('thermal_incineration')) {
            this.config.burnMaxHPDamage = 0.03; // 3% max HP
        }
        
        // Thermal Ignition logic handled in bullet (if explosion hits, apply burn)
        // But bullet needs to know if it should apply burn on explosion.
        // Let's pass 'isFire' as true for explosion if 'thermal_ignition' is active?
        // Or better, let the bullet handle complex logic. 
        // We'll stick to passing config flags.
        // Wait, ThermobaricBullet config interface needs update if we want to support 'ignition on explosion'.
        // For now, let's assume if isFire is true, explosion also applies burn (simplified).
        // Or if thermal_ignition is active, we treat explosion as fire source too.
    }

    private fire(): void {
        const player = this.state.player;
        const baseDamage = player.damage * (1 - this.config.damagePenalty);
        
        // Fire count
        const count = 1 + this.config.extraBullets;
        
        for (let i = 0; i < count; i++) {
            // Position: Right side of player. 
            // If multiple, maybe spread slightly?
            const offsetX = 40 + (i * 20); 
            const startX = player.x + player.width + offsetX;
            const startY = player.y + player.height / 2;

            // Find target (nearest enemy)
            let target = null;
            let minDist = Infinity;
            this.state.enemies.forEach(e => {
                if (e.isDead) return;
                const dist = Math.sqrt(Math.pow(e.x - player.x, 2) + Math.pow(e.y - player.y, 2));
                if (dist < minDist) {
                    minDist = dist;
                    target = e;
                }
            });

            // If no target, fire straight right? Or angle 0 (up)? 
            // Game coordinate: Angle 0 is Up? 
            // Bullet.ts: this.y -= Math.cos(this.angle) * this.speed
            // Angle 0 -> cos(0)=1 -> y decreases -> Up.
            // Angle PI/2 -> cos(PI/2)=0, sin(PI/2)=1 -> x increases -> Right.
            
            // Let's fire towards target or random direction if no target
            let angle = 0;
            if (target) {
                const t = target as Enemy;
                const dx = t.x - startX;
                const dy = t.y - startY;
                // standard atan2 is y, x. 
                // But our Bullet update uses: 
                // x += sin(angle), y -= cos(angle)
                // To get angle from dy, dx:
                // sin(a) = dx/dist, -cos(a) = dy/dist => cos(a) = -dy/dist
                // tan(a) = sin/cos = dx/-dy = -dx/dy
                // angle = atan2(dx, -dy)
                angle = Math.atan2(dx, -dy);
            } else {
                // Default fire up
                angle = 0;
            }

            // Create Bullet
            const bullet = new ThermobaricBullet(
                startX,
                startY,
                8, // Speed
                baseDamage,
                {
                    hasExplosion: this.config.hasExplosion,
                    isFire: this.config.isFire,
                    hasSparks: this.config.hasSparks,
                    explosionDamageMult: this.config.explosionDamageMult,
                    explosionRadius: this.config.explosionRadius,
                    explosionAppliesBurn: this.config.explosionAppliesBurn,
                    explosionBurnDuration: this.config.explosionBurnDuration,
                    canStun: this.config.canStun,
                    burnDamageMult: this.config.burnDamageMult,
                    burnMaxHPDamage: this.config.burnMaxHPDamage
                },
                target || undefined,
                angle
            );

            this.state.bullets.push(bullet);
        }
    }
}
