/**
 * API服务
 * 用于调用后端排班排产接口
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// API错误处理
class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'APIError'
  }
}

// 通用请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  const response = await fetch(url, { ...defaultOptions, ...options })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new APIError(
      response.status,
      errorData.detail || `HTTP ${response.status}: ${response.statusText}`
    )
  }

  return response.json()
}

// 数据类型定义
export interface SchedulingRequest {
  target_date: string
  product_code: string
  sku_data: any[][]
  position_data: any[][]
  skill_data: any[][]
  weekly_assigned_workers?: string[]
}

export interface SchedulingResponse {
  results: any[]
  groups: any[]
  performance_metrics: any
}

export interface WeeklySchedulingRequest {
  start_date: string
  product_code: string
  sku_data: any[][]
  position_data: any[][]
  skill_data: any[][]
}

export interface WeeklySchedulingResponse {
  weekly_schedule: Record<string, SchedulingResponse>
  summary: any
}

export interface ProductionSchedulingRequest {
  orders: any[]
  production_lines: any[]
  rule?: string
}

// 新增排产相关数据类型
export interface CustomerOrder {
  order_id: string
  customer_name: string
  product_code: string
  quantity: number
  due_date: string
  priority?: number
  order_date: string
  unit_price?: number
}

export interface MultiPlanProductionRequest {
  orders: CustomerOrder[]
  baseline_capacity?: number
  capacity_variation?: number
  start_date: string
  cost_params?: {
    production_cost_per_unit?: number
    capacity_increase_cost?: number
    capacity_decrease_saving?: number
    delay_penalty?: number
  }
}

export interface CapacityOptimizationPlan {
  plan_id: string
  plan_name: string
  plan_type: string
  weekly_schedule: Record<string, any[]>
  total_cost: number
  completion_rate: number
  average_delay: number
  capacity_utilization: number
  metrics: any
}

export interface MultiPlanProductionResponse {
  baseline_plan: CapacityOptimizationPlan
  optimized_plans: CapacityOptimizationPlan[]
  recommended_plan: CapacityOptimizationPlan
  comparison_metrics: any
}

export interface ProductionToSchedulingRequest {
  selected_plan_id: string
  production_schedule: Record<string, any[]>
  position_data: any[][]
  skill_data: any[][]
}

// API服务类
export class SchedulingAPI {
  // 健康检查
  static async healthCheck() {
    return apiRequest<any>('/health')
  }

  // 文件上传
  static async uploadExcelFiles(
    skuFile: File,
    positionFile: File,
    skillFile: File
  ) {
    const formData = new FormData()
    formData.append('sku_file', skuFile)
    formData.append('position_file', positionFile)
    formData.append('skill_file', skillFile)

    return apiRequest<any>('/upload/excel', {
      method: 'POST',
      body: formData,
      headers: {}, // 让浏览器自动设置Content-Type
    })
  }

  // 单日排班
  static async performDayScheduling(request: SchedulingRequest) {
    return apiRequest<SchedulingResponse>('/scheduling/day', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // 一周排班
  static async performWeeklyScheduling(request: WeeklySchedulingRequest) {
    return apiRequest<WeeklySchedulingResponse>('/scheduling/week', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // 计算性能指标
  static async calculatePerformanceMetrics(groups: any[]) {
    return apiRequest<any>('/scheduling/performance', {
      method: 'POST',
      body: JSON.stringify(groups),
    })
  }

  // 计算班组负荷
  static async calculateTeamWorkloads(
    groups: any[],
    leaves: any[],
    skillData: any[][],
    currentDate: string
  ) {
    return apiRequest<any>('/scheduling/team-workloads', {
      method: 'POST',
      body: JSON.stringify({
        groups,
        leaves,
        skill_data: skillData,
        current_date: currentDate,
      }),
    })
  }

  // ====== 新增排产相关API ======

  // 多方案排产优化
  static async multiPlanProductionScheduling(request: MultiPlanProductionRequest) {
    return apiRequest<MultiPlanProductionResponse>('/production/multi-plan', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // 排产结果集成到排班
  static async integrateProductionToScheduling(request: ProductionToSchedulingRequest) {
    return apiRequest<any>('/production/integrate-scheduling', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // 生成产能方案
  static async generateCapacityPlans(
    startDate: string,
    baselineCapacity: number = 180,
    capacityVariation: number = 10,
    weeks: number = 4
  ) {
    return apiRequest<any>('/production/capacity-plans', {
      method: 'POST',
      body: JSON.stringify({
        start_date: startDate,
        baseline_capacity: baselineCapacity,
        capacity_variation: capacityVariation,
        weeks,
      }),
    })
  }

  // 生产排程（保留兼容性）
  static async scheduleProduction(request: ProductionSchedulingRequest) {
    return apiRequest<any>('/production/schedule', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // 优化生产排程
  static async optimizeProductionSchedule(planId: string, scheduleResult: any) {
    return apiRequest<any>('/production/optimize', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        schedule_result: scheduleResult,
      }),
    })
  }

  // 生成甘特图数据
  static async generateGanttChart(scheduleResult: any) {
    return apiRequest<any>('/production/gantt', {
      method: 'POST',
      body: JSON.stringify(scheduleResult),
    })
  }

  // 获取排程摘要
  static async getProductionSummary(scheduleResult: any) {
    return apiRequest<any>('/production/summary', {
      method: 'POST',
      body: JSON.stringify(scheduleResult),
    })
  }

  // 获取排班规则
  static async getSchedulingRules() {
    return apiRequest<any>('/algorithms/scheduling-rules')
  }

  // 获取排产规则
  static async getProductionRules() {
    return apiRequest<any>('/algorithms/production-rules')
  }

  // 数据验证
  static async validateData(dataType: string, data: any[][]) {
    return apiRequest<any>('/data/validate', {
      method: 'POST',
      body: JSON.stringify({
        data_type: dataType,
        data,
      }),
    })
  }

  // ====== 请假和调整相关API ======

  // 生成调整建议
  static async generateAdjustmentSuggestions(
    groups: any[],
    leaves: any[],
    skillData: any[][],
    currentDate: string
  ) {
    return apiRequest<any>('/adjustment/suggestions', {
      method: 'POST',
      body: JSON.stringify({
        groups,
        leaves,
        skill_data: skillData,
        current_date: currentDate,
      }),
    })
  }

  // 筛选岗位组
  static async filterPositions(groups: any[], filters: any) {
    return apiRequest<any>('/data/filter-positions', {
      method: 'POST',
      body: JSON.stringify({
        groups,
        filters,
      }),
    })
  }

  // 导出排班数据
  static async exportScheduleData(scheduleType: string, scheduleData: any) {
    return apiRequest<any>('/export/schedule-data', {
      method: 'POST',
      body: JSON.stringify({
        schedule_type: scheduleType,
        schedule_data: scheduleData,
      }),
    })
  }

  // 分析请假影响
  static async analyzeLeaveImpact(groups: any[], leaveInfo: any, skillData: any[][]) {
    return apiRequest<any>('/analysis/leave-impact', {
      method: 'POST',
      body: JSON.stringify({
        groups,
        leave_info: leaveInfo,
        skill_data: skillData,
      }),
    })
  }
}

// 导出便捷方法
export const api = SchedulingAPI

// 错误处理工具
export function isAPIError(error: any): error is APIError {
  return error instanceof APIError
}

export function getErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return '未知错误'
} 