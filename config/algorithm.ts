/**
 * 智能生产排程系统 - 算法配置
 * Algorithm Configuration for Intelligent Production Scheduling System
 */

export const AlgorithmConfig = {
  // CT/TT时间优化算法配置
  timeOptimization: {
    // 时间紧迫度阈值
    urgencyThresholds: {
      normal: 1.0,        // 正常阈值：CT ≤ TT
      moderate: 1.5,      // 轻微紧迫阈值：1.0 < CT/TT ≤ 1.5
      critical: 2.0       // 严重紧迫阈值：CT/TT > 1.5
    },
    
    // 时间计算参数
    timeCalculation: {
      workHoursPerDay: 8,     // 每日工作小时数
      workDaysPerWeek: 5,     // 每周工作天数
      efficiencyFactor: 0.85  // 生产效率系数
    }
  },

  // 多目标优化权重配置
  objectiveWeights: {
    // 成本优先模式权重
    costPriority: {
      cost: 0.5,          // 成本权重
      time: 0.2,          // 时间权重
      quality: 0.2,       // 质量权重
      efficiency: 0.1     // 效率权重
    },
    
    // 时间优先模式权重
    timePriority: {
      cost: 0.2,          // 成本权重
      time: 0.5,          // 时间权重
      quality: 0.2,       // 质量权重
      efficiency: 0.1     // 效率权重
    },
    
    // 平衡模式权重
    balanced: {
      cost: 0.3,          // 成本权重
      time: 0.3,          // 时间权重
      quality: 0.25,      // 质量权重
      efficiency: 0.15    // 效率权重
    }
  },

  // 熟练工等级配置
  skillLevelConfig: {
    levels: {
      level1: { name: "一级熟练工", efficiency: 0.7, cost: 1.0 },
      level2: { name: "二级熟练工", efficiency: 0.8, cost: 1.2 },
      level3: { name: "三级熟练工", efficiency: 0.9, cost: 1.4 },
      level4: { name: "四级熟练工", efficiency: 1.0, cost: 1.6 }
    },
    
    // 技能等级推荐策略
    recommendations: {
      normal: ["level2", "level3"],      // 正常情况推荐
      moderate: ["level3", "level4"],    // 轻微紧迫推荐
      critical: ["level4"]               // 严重紧迫推荐
    }
  },

  // 排班算法配置
  schedulingConfig: {
    // 技能匹配参数
    skillMatching: {
      minSkillLevel: 2,           // 最低技能等级要求
      skillLevelWeight: 0.4,      // 技能等级权重
      experienceWeight: 0.3,      // 经验权重
      availabilityWeight: 0.3     // 可用性权重
    },
    
    // 班组管理参数
    teamManagement: {
      teamIntegrityWeight: 0.3,   // 班组完整性权重
      maxTeamSize: 15,            // 最大班组人数
      minTeamSize: 5,             // 最小班组人数
      crossTeamPenalty: 0.2       // 跨班组分配惩罚系数
    },
    
    // 工作负荷平衡
    workloadBalance: {
      maxDailyHours: 8,           // 每日最大工时
      maxWeeklyHours: 40,         // 每周最大工时
      overtimePenalty: 1.5,       // 加班成本系数
      balanceWeight: 0.25         // 负荷平衡权重
    },
    
    // 约束条件
    constraints: {
      hardConstraints: {
        skillRequirement: true,    // 技能等级硬约束
        timeConflict: true,        // 时间冲突硬约束
        capacityLimit: true        // 容量限制硬约束
      },
      
      softConstraints: {
        teamIntegrity: true,       // 班组完整性软约束
        workloadBalance: true,     // 工作负荷平衡软约束
        employeePreference: false  // 员工偏好软约束
      }
    }
  },

  // 算法性能参数
  performance: {
    maxIterations: 1000,          // 最大迭代次数
    convergenceThreshold: 0.001,  // 收敛阈值
    timeoutSeconds: 30,           // 算法超时时间（秒）
    parallelProcessing: true      // 是否启用并行处理
  },

  // 数据处理配置
  dataProcessing: {
    maxFileSize: 50 * 1024 * 1024,  // 最大文件大小（50MB）
    supportedFormats: ['.xlsx', '.xls'],
    batchSize: 1000,                // 批处理大小
    cacheTimeout: 300               // 缓存超时时间（秒）
  },

  // 结果优化配置
  resultOptimization: {
    maxSolutions: 10,             // 最大方案数量
    diversityThreshold: 0.1,      // 方案多样性阈值
    rankingCriteria: {
      cost: true,                 // 成本排名
      time: true,                 // 时间排名
      quality: true,              // 质量排名
      feasibility: true           // 可行性排名
    }
  }
};

/**
 * 根据时间紧迫度获取推荐策略
 */
export function getRecommendedStrategy(urgencyRatio: number) {
  const { urgencyThresholds } = AlgorithmConfig.timeOptimization;
  
  if (urgencyRatio <= urgencyThresholds.normal) {
    return {
      level: 'normal',
      strategy: '成本优先策略',
      skillLevels: AlgorithmConfig.skillLevelConfig.recommendations.normal,
      description: '在满足时间要求的前提下，优先选择二级/三级熟练工以降低成本'
    };
  } else if (urgencyRatio <= urgencyThresholds.moderate) {
    return {
      level: 'moderate',
      strategy: '平衡策略',
      skillLevels: AlgorithmConfig.skillLevelConfig.recommendations.moderate,
      description: '采用三级/四级熟练工，平衡时间和成本要求'
    };
  } else {
    return {
      level: 'critical',
      strategy: '时间优先策略',
      skillLevels: AlgorithmConfig.skillLevelConfig.recommendations.critical,
      description: '必须使用四级熟练工，确保在TT时间内完成订单'
    };
  }
}

/**
 * 获取优化权重配置
 */
export function getOptimizationWeights(priorityMode: 'cost' | 'time' | 'balanced') {
  return AlgorithmConfig.objectiveWeights[priorityMode === 'cost' ? 'costPriority' : 
                                         priorityMode === 'time' ? 'timePriority' : 'balanced'];
}

/**
 * 计算技能等级匹配分数
 */
export function calculateSkillMatchScore(
  employeeLevel: number, 
  requiredLevel: number, 
  maxLevel: number = 4
): number {
  if (employeeLevel < requiredLevel) {
    return 0; // 不满足要求
  }
  
  // 计算匹配分数：满足要求且等级越高分数越高，但避免过度匹配
  const overqualification = Math.max(0, employeeLevel - requiredLevel);
  const baseScore = 0.8; // 满足要求的基础分数
  const bonusScore = Math.min(0.2, overqualification * 0.05); // 超出部分的奖励分数
  const overqualificationPenalty = overqualification > 1 ? overqualification * 0.02 : 0; // 过度匹配惩罚
  
  return Math.min(1.0, baseScore + bonusScore - overqualificationPenalty);
}

export default AlgorithmConfig; 