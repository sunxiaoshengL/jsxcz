export interface Skill {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  // 前置技能需求：[skillId, minLevel]
  prerequisites?: [string, number][];
  effect: (level: number) => any;
}

export const skillPool: Skill[] = [
  {
    id: 'damage_boost',
    name: '子弹强化',
    description: '子弹伤害 +60%',
    maxLevel: 99, // 允许无限叠加
    effect: (level: number) => {
      // 每次叠加都是基础伤害 * 1.6 ^ level
      return { damageMultiplier: Math.pow(1.6, level) };
    }
  },
  {
    id: 'split_shot_2',
    name: '子弹分裂 2',
    description: '子弹命中后分裂为 2 颗',
    maxLevel: 1,
    prerequisites: [['damage_boost', 1]],
    effect: (_level: number) => {
      return { splitLevel: 1 };
    }
  },
  {
    id: 'split_shot_4',
    name: '子弹分裂 4',
    description: '子弹命中后分裂为 4 颗',
    maxLevel: 1,
    prerequisites: [['split_shot_2', 1]],
    effect: (_level: number) => {
      return { splitLevel: 2 };
    }
  },

  {
    id: 'multi_shot',
    name: '齐射',
    description: '每次射击发射多颗子弹',
    maxLevel: 5,
    effect: (level: number) => {
      return { bulletCount: level };
    }
  },
  {
    id: 'rapid_fire',
    name: '连发',
    description: '射击间隔减少',
    maxLevel: 5,
    effect: (level: number) => {
      const multipliers = [0.9, 0.8, 0.7, 0.6, 0.5];
      return { fireRate: multipliers[level - 1] };
    }
  },
  {
    id: 'penetration',
    name: '穿透',
    description: '子弹可穿透敌人',
    maxLevel: 5,
    effect: (level: number) => {
      return { maxHits: level };
    }
  },
  {
    id: 'dry_ice_bomb',
    name: '干冰弹',
    description: '核心技能：干冰弹发射器',
    maxLevel: 1,
    effect: (_level: number) => {
      return { dryIceBomb: true };
    }
  },
  {
    id: 'dry_ice_damage_boost',
    name: '干冰弹增伤',
    description: '干冰弹基础伤害 +60%',
    maxLevel: 1,
    prerequisites: [['dry_ice_bomb', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_freeze',
    name: '急冻寒冰',
    description: '干冰弹伤害 +30%，命中冻结2秒',
    maxLevel: 1,
    prerequisites: [['dry_ice_bomb', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_penetration',
    name: '低温贯穿',
    description: '干冰弹伤害 +30%，穿透 +2',
    maxLevel: 1,
    prerequisites: [['dry_ice_bomb', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_frostbite',
    name: '冰冻侵袭',
    description: '命中叠加冻伤，持续10秒',
    maxLevel: 1,
    prerequisites: [['dry_ice_bomb', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_burst',
    name: '干冰连发',
    description: '每次额外发射1枚干冰弹，伤害降低20%',
    maxLevel: 1,
    prerequisites: [['dry_ice_bomb', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_burst_no_penalty',
    name: '干冰连发无减值',
    description: '干冰连发不再降低伤害',
    maxLevel: 1,
    prerequisites: [['dry_ice_burst', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_scatter',
    name: '干冰散射',
    description: '命中后散射多枚小冰弹',
    maxLevel: 1,
    prerequisites: [['dry_ice_bomb', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_volley',
    name: '干冰齐射',
    description: '同时射出多枚干冰弹',
    maxLevel: 1,
    prerequisites: [['dry_ice_bomb', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_paralysis_bonus',
    name: '麻痹增伤',
    description: '对麻痹状态敌人伤害 +100%',
    maxLevel: 1,
    prerequisites: [['dry_ice_bomb', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_return',
    name: '干冰折返',
    description: '触边折返造成二次伤害',
    maxLevel: 1,
    prerequisites: [['dry_ice_bomb', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_ice_storm_link',
    name: '冰暴联动',
    description: '首次命中释放1个无强化冰暴',
    maxLevel: 1,
    prerequisites: [['dry_ice_bomb', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_frostbite_unlimit',
    name: '冻伤无限叠层',
    description: '冻伤层数上限提升至99',
    maxLevel: 1,
    prerequisites: [['dry_ice_frostbite', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_frost_path',
    name: '冰霜路径',
    description: '干冰弹路径结冰并减速',
    maxLevel: 1,
    prerequisites: [['dry_ice_bomb', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_zero_degree_storm',
    name: '零度风暴',
    description: '干冰弹命中累计32次触发冰风暴',
    maxLevel: 1,
    prerequisites: [['dry_ice_bomb', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'dry_ice_ultimate',
    name: '极寒大冰弹',
    description: '干冰弹强化为大体积冰弹并分裂小冰弹',
    maxLevel: 1,
    prerequisites: [['dry_ice_damage_boost', 1], ['dry_ice_freeze', 1], ['dry_ice_penetration', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'electromagnetic_railgun',
    name: '电磁轨道炮',
    description: '核心技能：电磁轨道炮（功能开发中）',
    maxLevel: 1,
    effect: (_level: number) => {
      // TODO: Implement Electromagnetic Railgun effect
      return {};
    }
  },
  {
    id: 'thermobaric_bomb',
    name: '温压弹',
    description: '解锁温压弹发射器，每5秒发射一枚温压子弹',
    maxLevel: 50, // 核心等级
    effect: (level: number) => {
      return { thermobaricLevel: level };
    }
  },
  {
    id: 'ice_storm_generator',
    name: '冰暴发生器',
    description: '核心技能：解锁冰暴发生器，周期性生成冰暴',
    maxLevel: 50,
    effect: (level: number) => {
      return { iceStormLevel: level };
    }
  },
  {
    id: 'ice_storm_damage_boost',
    name: '冰暴增伤',
    description: '冰系基础伤害 +60%',
    maxLevel: 1,
    prerequisites: [['ice_storm_generator', 1]],
    effect: (_level: number) => {
      return { iceDamageBoost: 0.6 };
    }
  },
  {
    id: 'frost_explosion',
    name: '冰霜爆炸',
    description: '冰暴范围内小范围冰爆，30%概率冻结1秒，冰伤+20%',
    maxLevel: 1,
    prerequisites: [['ice_storm_generator', 1]],
    effect: (_level: number) => {
      return { frostExplosion: true, iceDamageBoost: 0.2 };
    }
  },
  {
    id: 'ice_storm_expansion',
    name: '冰暴扩张',
    description: '冰暴范围+50%，敌人减速+30%',
    maxLevel: 1,
    prerequisites: [['ice_storm_generator', 2]],
    effect: (_level: number) => {
      return { iceStormRangeMult: 0.5, slowBoost: 0.3 };
    }
  },
  {
    id: 'ice_bullet',
    name: '急冻子弹',
    description: '子弹变为冰系，30%概率冻结1秒，冰伤+40%',
    maxLevel: 1,
    prerequisites: [['ice_storm_generator', 1], ['ice_storm_damage_boost', 1]],
    effect: (_level: number) => {
      return { iceBullet: true, iceDamageBoost: 0.4 };
    }
  },
  {
    id: 'four_way_split',
    name: '分裂冰片',
    description: '急冻子弹命中冻结敌人时分裂出4枚冰片',
    maxLevel: 1,
    prerequisites: [['damage_boost', 1], ['ice_bullet', 1]],
    effect: (_level: number) => {
      return { fourWaySplit: true };
    }
  },
  {
    id: 'ice_storm_duration',
    name: '冰暴延续',
    description: '冰暴持续时间+2秒，伤害-15%',
    maxLevel: 1,
    prerequisites: [['ice_storm_generator', 1], ['ice_storm_damage_boost', 1]],
    effect: (_level: number) => {
      return { iceStormDurationBoost: 2, iceStormDamagePenalty: 0.15 };
    }
  },
  {
    id: 'freeze_dot',
    name: '冻结附加伤害',
    description: '冻结目标每秒受基础伤害x0.3的冰伤',
    maxLevel: 1,
    prerequisites: [['ice_storm_generator', 1], ['ice_storm_damage_boost', 1]],
    effect: (_level: number) => {
      return { freezeDot: true };
    }
  },
  {
    id: 'ice_storm_cannon',
    name: '冰暴加农',
    description: '冰暴结束发射3枚冰锥弹',
    maxLevel: 1,
    prerequisites: [['ice_storm_generator', 14]],
    effect: (_level: number) => {
      return { iceStormCannon: true };
    }
  },
  {
    id: 'chain_ice_storm',
    name: '连环冰暴',
    description: '释放冰暴时额外触发1次小型冰暴，冷却+1秒',
    maxLevel: 1,
    prerequisites: [['ice_storm_generator', 1]],
    effect: (_level: number) => {
      return { chainIceStorm: true };
    }
  },
  // --- 子弹级词条 ---
  {
    id: 'bullet_explosion',
    name: '子弹爆炸',
    description: '温压子弹命中时概率爆炸，造成范围伤害',
    maxLevel: 1,
    prerequisites: [['thermobaric_bomb', 1]],
    effect: (_level: number) => {
      return { thermobaricExplosion: true };
    }
  },
  {
    id: 'bullet_explosion_damage',
    name: '爆炸增伤',
    description: '子弹爆炸伤害提升',
    maxLevel: 1,
    prerequisites: [['bullet_explosion', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'bullet_explosion_range',
    name: '爆炸范围',
    description: '子弹爆炸范围提升',
    maxLevel: 1,
    prerequisites: [['bullet_explosion', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'bullet_explosion_split',
    name: '分裂爆炸',
    description: '分裂子弹也可触发爆炸',
    maxLevel: 1,
    prerequisites: [['bullet_explosion', 1]],
    effect: (_level: number) => {
      return {};
    }
  },
  {
    id: 'thermobaric_fire_bullet',
    name: '火焰子弹',
    description: '温压子弹变为火系，造成燃烧持续伤害',
    maxLevel: 1,
    prerequisites: [['thermobaric_bomb', 1], ['thermobaric_shock', 1]],
    effect: (_level: number) => {
      return { thermobaricFire: true };
    }
  },
  // --- 弹道级词条 ---
  {
    id: 'thermobaric_burst',
    name: '温压弹连发',
    description: '每次额外发射1枚子弹，伤害降低20%',
    maxLevel: 1,
    prerequisites: [['thermobaric_bomb', 10]],
    effect: (_level: number) => {
      return { thermobaricBurst: true };
    }
  },
  {
    id: 'explosion_spark',
    name: '爆炸火花',
    description: '爆炸时产生3枚火花进行二次弹射',
    maxLevel: 1,
    prerequisites: [['thermobaric_bomb', 2], ['bullet_explosion', 1]], // 逻辑上需要爆炸才能触发火花
    effect: (_level: number) => {
      return { thermobaricSparks: true };
    }
  },
  {
    id: 'thermobaric_shock',
    name: '温压冲击',
    description: '提升冲击伤害，概率眩晕',
    maxLevel: 1,
    prerequisites: [['thermobaric_bomb', 1]],
    effect: (_level: number) => {
      return { thermobaricShock: true };
    }
  },
  // --- 进阶核心链 ---
  {
    id: 'thermal_explosion',
    name: '热能爆炸',
    description: '强化子弹爆炸，伤害提升80%',
    maxLevel: 1,
    prerequisites: [['thermobaric_bomb', 1], ['bullet_explosion', 1]],
    effect: (_level: number) => {
      return { thermobaricThermalExplosion: true };
    }
  },
  {
    id: 'thermal_ignition',
    name: '热能引燃',
    description: '爆炸命中敌人后施加6秒燃烧',
    maxLevel: 1,
    prerequisites: [['thermobaric_bomb', 1], ['thermal_explosion', 1]],
    effect: (_level: number) => {
      return { thermobaricThermalIgnition: true };
    }
  },
  {
    id: 'thermal_incineration',
    name: '热能焚身',
    description: '燃烧敌人每秒受到3%最大生命值伤害',
    maxLevel: 1,
    prerequisites: [['thermal_explosion', 1], ['thermal_ignition', 1]],
    effect: (_level: number) => {
      return { thermobaricThermalIncineration: true };
    }
  },
  {
    id: 'thermal_outbreak',
    name: '热能爆发',
    description: '提升火焰与爆炸联动伤害',
    maxLevel: 1,
    prerequisites: [['thermobaric_bomb', 1]],
    effect: (_level: number) => {
      return { thermobaricThermalOutbreak: true };
    }
  }
];

export default skillPool;
