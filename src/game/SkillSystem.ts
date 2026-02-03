import { GameState } from './Game_v2';
import skillPool, { Skill } from './SkillPool';

export default class SkillSystem {
  private state: GameState;
  private acquiredSkills: Map<string, number> = new Map();

  constructor(state: GameState) {
    this.state = state;
  }

  acquireSkill(skillId: string): void {
    const currentLevel = this.acquiredSkills.get(skillId) || 0;
    const skill = skillPool.find(s => s.id === skillId);
    if (skill && currentLevel < skill.maxLevel) {
      this.acquiredSkills.set(skillId, currentLevel + 1);
      if (skillId === 'ice_storm_generator') {
        this.addSkillIfMissing('frost_explosion');
        this.addSkillIfMissing('chain_ice_storm');
      }
      this.updateActiveSkillsList();
      this.applySkillEffects();
    }
  }

  private addSkillIfMissing(skillId: string): void {
    const currentLevel = this.acquiredSkills.get(skillId) || 0;
    const skill = skillPool.find(s => s.id === skillId);
    if (skill && currentLevel < 1) {
      this.acquiredSkills.set(skillId, 1);
    }
  }

  private updateActiveSkillsList(): void {
    this.state.activeSkills = Array.from(this.acquiredSkills.entries()).map(([id, level]) => {
      const skill = skillPool.find(s => s.id === id);
      return {
        id,
        name: skill ? skill.name : id,
        level
      };
    });
  }

  private applySkillEffects(): void {
    this.state.player.fireRate = this.state.player.baseFireRate * this.state.player.levelFireRateMultiplier;
    this.state.player.damage = this.state.player.baseDamage * this.state.player.levelDamageMultiplier;

    // 先重置玩家的技能效果状态
    this.state.player.splitLevel = 0;

    for (const [skillId, level] of this.acquiredSkills) {
      const skill = skillPool.find(s => s.id === skillId);
      if (skill) {
        const effect = skill.effect(level);
        if (effect.fireRate) {
          this.state.player.fireRate *= effect.fireRate;
        }
        if (effect.damageMultiplier) {
          this.state.player.damage *= effect.damageMultiplier;
        }
        if (effect.damage) {
          this.state.player.damage += effect.damage;
        }
        if (effect.splitLevel) {
          // 取最大的分裂等级
          this.state.player.splitLevel = Math.max(this.state.player.splitLevel, effect.splitLevel);
        }
      }
      this.state.player.setSkillLevel(skillId, level);
    }
  }

  getAvailableSkills(count: number = 3, options: { excludeAcquiredCore?: boolean } = {}): Skill[] {
    const available: Skill[] = [];
    const shuffled = [...skillPool].sort(() => Math.random() - 0.5);
    const excludeAcquiredCore = options.excludeAcquiredCore ?? false;
    const coreSkillIds = new Set(['thermobaric_bomb', 'ice_storm_generator', 'dry_ice_bomb']);
    const attributeBulletIds = new Set(['ice_bullet', 'thermobaric_fire_bullet']);
    const normalSplitIds = new Set(['split_shot_2', 'split_shot_4']);
    const hasAttributeBullet = Array.from(attributeBulletIds).some(id => (this.acquiredSkills.get(id) || 0) > 0);
    const hasNormalSplit = Array.from(normalSplitIds).some(id => (this.acquiredSkills.get(id) || 0) > 0);
    
    for (const skill of shuffled) {
      const currentLevel = this.acquiredSkills.get(skill.id) || 0;
      if (excludeAcquiredCore && currentLevel > 0 && coreSkillIds.has(skill.id)) continue;
      if (hasAttributeBullet && normalSplitIds.has(skill.id)) continue;
      if (hasNormalSplit && attributeBulletIds.has(skill.id)) continue;
      
      // 检查前置条件
      let prereqsMet = true;
      if (skill.prerequisites) {
        for (const [reqId, reqLevel] of skill.prerequisites) {
          const acquiredLevel = this.acquiredSkills.get(reqId) || 0;
          if (acquiredLevel < reqLevel) {
            prereqsMet = false;
            break;
          }
        }
      }
      if (!prereqsMet) continue;

      if (currentLevel < skill.maxLevel) {
        const skillCopy = { ...skill };
        // 如果是可无限叠加的技能，显示当前等级
        if (skill.maxLevel > 10) {
           skillCopy.name = `${skill.name} Lv.${currentLevel + 1}`;
        } 
        // 否则如果是多级技能，也显示等级
        else if (skill.maxLevel > 1 && currentLevel > 0) {
          skillCopy.name = `${skill.name} Lv.${currentLevel + 1}`;
        }
        available.push(skillCopy);
        if (available.length >= count) break;
      }
    }
    
    return available;
  }

  // 随机授予 N 个技能并应用
  grantRandomSkills(count: number): Skill[] {
    const grantedSkills: Skill[] = [];
    
    for (let i = 0; i < count; i++) {
      // 每次只取 1 个，因为取完后状态会变（可能解锁新前置，或达到上限）
      const candidates = this.getAvailableSkills(1);
      if (candidates.length > 0) {
        const skill = candidates[0];
        // 这里的 skill 是 copy，我们需要原始 ID 来 acquire
        this.acquireSkill(skill.id);
        
        // 为了展示，我们需要最新的技能信息（比如等级）
        // acquireSkill 已经更新了等级，所以我们重新构建一个展示用的对象
        const currentLevel = this.acquiredSkills.get(skill.id) || 1;
        
        // 重新获取原始技能信息以确保数据准确
        const originalSkill = skillPool.find(s => s.id === skill.id);
        if (originalSkill) {
             const displaySkill = { ...originalSkill };
             if (displaySkill.maxLevel > 10 || (displaySkill.maxLevel > 1 && currentLevel > 0)) {
                displaySkill.name = `${originalSkill.name} Lv.${currentLevel}`;
             }
             grantedSkills.push(displaySkill);
        }
      }
    }
    
    return grantedSkills;
  }

  getSkillLevel(skillId: string): number {
    return this.acquiredSkills.get(skillId) || 0;
  }

  reset(): void {
    this.acquiredSkills.clear();
  }
}
