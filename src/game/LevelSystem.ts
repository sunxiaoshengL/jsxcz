import SkillSystem from './SkillSystem';

export default class LevelSystem {
  private level: number = 1;
  private experience: number = 0;
  private experienceToNextLevel: number = 180;
  private readonly expTable: number[] = [
    180, 190, 200, 210, 220,
    240, 250, 260, 270, 280, 290, 300, 310,
    320, 330, 340, 350, 360, 370, 380
  ];
  private readonly baseExpRate: number = 7;

  constructor(skillSystem: SkillSystem) {
    void skillSystem;
  }

  addExperience(amount: number): void {
    this.experience += amount;
  }

  shouldLevelUp(): boolean {
    return this.experience >= this.experienceToNextLevel;
  }

  levelUp(): void {
    this.level++;
    this.experience -= this.experienceToNextLevel;
    this.experienceToNextLevel = this.getExperienceToNextLevel();
  }

  update(): void {
    // This is now handled in Game.update()
  }

  getLevel(): number {
    return this.level;
  }

  getExperience(): number {
    return this.experience;
  }

  getExperienceToNextLevel(): number {
    const index = Math.max(0, Math.min(this.expTable.length - 1, this.level - 1));
    return this.expTable[index];
  }

  getBaseExpRate(): number {
    return this.baseExpRate;
  }

  reset(): void {
    this.level = 1;
    this.experience = 0;
    this.experienceToNextLevel = this.getExperienceToNextLevel();
  }
}
