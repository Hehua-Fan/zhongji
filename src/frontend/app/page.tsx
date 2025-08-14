'use client'

import React, { useState, useMemo} from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast, Toaster } from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Eye, Users, Calendar, BarChart3, Plus, ClipboardList, UserCog, Factory, ShoppingCart, Settings, FileText, Upload, TrendingUp, ChevronDown, ChevronRight, Calculator, PieChart, AlertCircle, Clock, Package } from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import * as XLSX from 'xlsx'

// 导入排产组件
import OrderManagement from '@/components/paichan/OrderManagement'
import ParameterSettings from '@/components/paichan/ParameterSettings'
import PlanComparison from '@/components/paichan/PlanComparison'
import ProductionAnalysis from '@/components/paichan/ProductionAnalysis'

// 导入排班组件
import DataUpload from '@/components/paiban/DataUpload'
import ScheduleResults from '@/components/paiban/ScheduleResults'
import SchedulingPerformanceAnalysis from '@/components/paiban/PerformanceAnalysis'
import EmployeeStatusManagement from '@/components/paiban/EmployeeStatusManagement'

// 定义生产计划项接口
interface ProductionItem {
  order_id: string
  customer_name: string
  product_code: string
  quantity: number
  capacity_used: number
  delay_days: number
  cost: number
  completion_date: string
}

// 定义性能指标接口
interface PlanMetrics {
  total_cost: number
  completion_rate: number
  average_delay: number
  capacity_utilization: number
  energy_cost: number
  labor_cost: number
  efficiency_score: number
}

// 定义对比指标接口
interface ComparisonMetrics {
  cost_comparison: {
    baseline_cost: number
    optimized_cost: number
    cost_saving: number
    saving_percentage: number
  }
  efficiency_comparison: {
    baseline_completion_rate: number
    optimized_completion_rate: number
    improvement: number
  }
  delay_comparison: {
    baseline_delay: number
    optimized_delay: number
    reduction: number
  }
}

// 定义人岗匹配度接口
interface PersonJobMatch {
  total_match_rate: number
  position_match_details: {
    position_code: string
    position_name: string
    required_count: number
    assigned_count: number
    match_rate: number
    skill_requirements: number[]
    assigned_skills: number[]
  }[]
}

// 定义工时利用率接口
interface WorkHourUtilization {
  overall_utilization: number
  department_utilization: {
    work_center: string
    team: string
    utilization_rate: number
    total_hours: number
    effective_hours: number
  }[]
}

// 定义请假信息接口
interface LeaveInfo {
  工号: string
  姓名: string
  请假日期: string
  请假类型: string
  请假时长: number
  影响岗位: string[]
  紧急程度: string
}

// 定义调整建议接口
interface AdjustmentSuggestion {
  调整类型: string
  原岗位: string
  调整人员: unknown[]
  效率影响: unknown
  制造周期影响: unknown
  实施建议: string
  优先级: number
}

// 定义团队工作量接口
interface TeamWorkload {
  班组: string
  总人数: number
  在岗人数: number
  请假人数: number
  技能分布: { [key: string]: number }
  负荷率: number
  可调配人员: unknown[]
}

// 排产相关接口
interface CustomerOrder {
  order_id: string
  customer_name: string
  product_code: string
  quantity: number
  due_date: string
  priority: number
  order_date: string
  unit_price: number
}

interface CustomerOrderForm extends CustomerOrder {
  id: string
}

interface CapacityOptimizationPlan {
  plan_id: string
  plan_name: string
  plan_type: string
  weekly_schedule: Record<string, ProductionItem[]>
  total_cost: number
  completion_rate: number
  average_delay: number
  capacity_utilization: number
  metrics: PlanMetrics
}

interface MultiPlanProductionResponse {
  baseline_plan: CapacityOptimizationPlan
  optimized_plans: CapacityOptimizationPlan[]
  recommended_plan: CapacityOptimizationPlan
  comparison_metrics: ComparisonMetrics
}

interface CapacityConfigData {
  产能: number
  节拍: number
  能耗: number
  定员: number
  人效: number
  能耗成本: number
  人效成本: number
  总成本: number
}

interface CapacityConfigResponse {
  capacity_data: CapacityConfigData[]
  cost_formula: {
    energy_cost: string
    labor_cost: string
    total_cost: string
  }
}

interface ChangeoverTimeData {
  [boxType: string]: {
    [workCenter: string]: number
  }
}

interface ChangeoverTimeConfigResponse {
  changeover_data: ChangeoverTimeData
  statistics: {
    total_box_types: number
    total_work_centers: number
    total_records: number
    min_changeover_time: number
    max_changeover_time: number
    unit: string
  }
  description: {
    purpose: string
    includes: string
    note: string
  }
}

// 排班相关接口
interface SchedulingResult {
  岗位编码: string
  姓名: string
  工号: string
  技能等级: number
  班组: string
  工作中心: string
  日期: string
}

interface PositionGroup {
  岗位编码: string
  岗位名称: string
  工作中心: string
  班组: string
  技能等级: string
  需求人数: number
  已排人数: number
  员工列表: SchedulingResult[]
}

interface FilterState {
  岗位编码: string
  工作中心: string
  班组: string
  状态: string
  搜索关键词: string
}

interface WeeklySchedule {
  [date: string]: {
    positionGroups: PositionGroup[]
    schedulingResults: SchedulingResult[]
    productCode: string
  }
}

interface PerformanceMetrics {
  人岗匹配度: PersonJobMatch
  工时利用率: WorkHourUtilization
}

type ViewMode = 'day' | 'week'

// 导航配置
interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  description?: string
}

interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
  collapsed?: boolean
}

const navigationConfig: NavGroup[] = [
  {
    id: 'production',
    label: '排产系统',
    icon: Factory,
    items: [
      { id: 'prod-orders', label: '订单管理', icon: ShoppingCart, description: '管理客户订单和需求' },
      { id: 'prod-params', label: '参数设置', icon: Settings, description: '配置算法参数和成本模型' },
      { id: 'prod-comparison', label: '方案对比', icon: BarChart3, description: '比较多种排产方案的效果' },
      { id: 'prod-analysis', label: '详细分析', icon: FileText, description: '查看排产结果的详细分析' }
    ]
  },
  {
    id: 'scheduling',
    label: '排班系统',
    icon: Users,
    items: [
      { id: 'sched-upload', label: '数据上传', icon: Upload, description: '上传SKU、岗位和技能数据' },
      { id: 'sched-schedule', label: '排班结果', icon: Calendar, description: '查看和管理排班安排' },
      { id: 'sched-analysis', label: '性能分析', icon: TrendingUp, description: '分析排班效果和优化建议' },
      { id: 'sched-employee-status', label: '员工状态管理', icon: UserCog, description: '管理员工状态' }
    ]
  }
]

export default function IntegratedPage() {
  // 通用状态
  const [activeTab, setActiveTab] = useState('prod-orders')
  const [navigationState, setNavigationState] = useState<{[key: string]: boolean}>({
    production: true,
    scheduling: true
  })

  // 排产相关状态
  const [orders, setOrders] = useState<CustomerOrderForm[]>([
    {
      id: '1',
      order_id: 'ORD-001',
      customer_name: '客户A',
      product_code: 'C1B010000036',
      quantity: 500,
      due_date: '2025-06-24',
      priority: 1,
      order_date: '2025-06-10',
      unit_price: 150.0
    }
  ])
  
  const [baselineCapacity, setBaselineCapacity] = useState(180)
  const [capacityVariation, setCapacityVariation] = useState(10)
  const [delayPenalty, setDelayPenalty] = useState(200)
  const [results, setResults] = useState<MultiPlanProductionResponse | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<CapacityOptimizationPlan | null>(null)
  const [isIntegratingToScheduling, setIsIntegratingToScheduling] = useState(false)
  const [showCapacityModal, setShowCapacityModal] = useState(false)
  const [capacityData, setCapacityData] = useState<CapacityConfigResponse | null>(null)
  const [loadingCapacityData, setLoadingCapacityData] = useState(false)
  const [showChangeoverModal, setShowChangeoverModal] = useState(false)
  const [changeoverData, setChangeoverData] = useState<ChangeoverTimeConfigResponse | null>(null)
  const [loadingChangeoverData, setLoadingChangeoverData] = useState(false)

  // 排班相关状态
  const [skuFile, setSkuFile] = useState<File | null>(null)
  const [positionFile, setPositionFile] = useState<File | null>(null)
  const [skillFile, setSkillFile] = useState<File | null>(null)
  const [productCode, setProductCode] = useState('C1B010000036')
  const [schedulingResults, setSchedulingResults] = useState<SchedulingResult[]>([])
  const [positionGroups, setPositionGroups] = useState<PositionGroup[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({})
  const [selectedWeekDay, setSelectedWeekDay] = useState<string>('')
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // 筛选状态
  const [filters, setFilters] = useState<FilterState>({
    岗位编码: '',
    工作中心: '',
    班组: '',
    状态: '全部',
    搜索关键词: ''
  })

  // 添加缺失的状态变量
  const [filterOptions, setFilterOptions] = useState({
    岗位编码列表: [] as string[],
    工作中心列表: [] as string[],
    班组列表: [] as string[]
  })

  // 产能配置状态（用于排产到排班的数据传递）
  const [productionCapacityConfig, setProductionCapacityConfig] = useState<{
    planName: string
    planType: string
    baselineCapacity: number
    capacityVariation: number
    actualCapacity: number
    utilizationRate: number
    totalCost: number
    completionRate: number
    averageDelay: number
    weeklyScheduleSummary: {
      totalProduction: number
      workingDays: number
      customers: string[]
      products: string[]
    }
  } | null>(null)

  // 通用加载状态
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // 导航展开/折叠逻辑
  const toggleNavGroup = (groupId: string) => {
    setNavigationState(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  // 获取当前活跃的组
  const getActiveGroup = () => {
    for (const group of navigationConfig) {
      if (group.items.some(item => item.id === activeTab)) {
        return group.id
      }
    }
    return 'production'
  }

  // 切换tab时自动展开对应的组
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const activeGroup = getActiveGroup()
    if (!navigationState[activeGroup]) {
      setNavigationState(prev => ({
        ...prev,
        [activeGroup]: true
      }))
    }
  }

  const removeOrder = (id: string) => {
    setOrders(orders.filter(order => order.id !== id))
  }

  const updateOrder = (id: string, field: keyof CustomerOrder, value: string | number) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, [field]: value } : order
    ))
  }

  // 获取产能配置数据
  const fetchCapacityData = async () => {
    setLoadingCapacityData(true)
    try {
      const response = await fetch('http://localhost:8000/production/capacity-config')
      if (!response.ok) {
        throw new Error('获取产能配置数据失败')
      }
      const data = await response.json()
      setCapacityData(data)
    } catch (error) {
      console.error('获取产能配置数据失败:', error)
      toast.error('获取产能配置数据失败')
    } finally {
      setLoadingCapacityData(false)
    }
  }

  const openCapacityModal = () => {
    if (!capacityData) {
      fetchCapacityData()
    }
    setShowCapacityModal(true)
  }

  // 获取转产时间配置数据
  const fetchChangeoverData = async () => {
    setLoadingChangeoverData(true)
    try {
      const response = await fetch('http://localhost:8000/production/changeover-time-config')
      if (!response.ok) {
        throw new Error('获取转产时间配置数据失败')
      }
      const data = await response.json()
      setChangeoverData(data)
    } catch (error) {
      console.error('获取转产时间配置数据失败:', error)
      toast.error('获取转产时间配置数据失败')
    } finally {
      setLoadingChangeoverData(false)
    }
  }

  const openChangeoverModal = () => {
    if (!changeoverData) {
      fetchChangeoverData()
    }
    setShowChangeoverModal(true)
  }

  const executeMultiPlanProduction = async () => {
    if (orders.length === 0) {
      toast.error('请先添加订单')
      return
    }

    setIsLoading(true)
    try {
      const result = await fetch('http://localhost:8000/production/multi-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orders: orders.map(({ id: _id, ...order }) => order), // eslint-disable-line @typescript-eslint/no-unused-vars
          start_date: new Date().toISOString().split('T')[0],
          baseline_capacity: baselineCapacity,
          capacity_variation: capacityVariation,
          cost_params: {
            delay_penalty: delayPenalty,
            capacity_cost: 100.0,
            efficiency_bonus: 50.0
          }
        }),
      })

      if (!result.ok) {
        throw new Error('排产计算失败')
      }

      const data = await result.json()
      setResults(data)
      setSelectedPlan(data.recommended_plan)
      setActiveTab('prod-comparison')
      toast.success('多方案排产计算完成！')
    } catch (error) {
      console.error('排产失败:', error)
      toast.error('排产计算失败')
    } finally {
      setIsLoading(false)
    }
  }

  const integrateToScheduling = async (plan: CapacityOptimizationPlan) => {
    setIsIntegratingToScheduling(true)
    try {
      // 计算生产安排汇总
      const weeklySchedule = plan.weekly_schedule
      const allCustomers = new Set<string>()
      const allProducts = new Set<string>()
      let totalProduction = 0
      let workingDays = 0
      
      Object.values(weeklySchedule).forEach(daySchedule => {
        if (daySchedule.length > 0) {
          workingDays++
          daySchedule.forEach(item => {
            allCustomers.add(item.customer_name)
            allProducts.add(item.product_code)
            totalProduction += item.quantity
          })
        }
      })
      
      // 设置完整的产能配置数据
      setProductionCapacityConfig({
        planName: plan.plan_name,
        planType: plan.plan_type === 'baseline' ? '基准方案' : '优化方案',
        baselineCapacity: baselineCapacity,
        capacityVariation: capacityVariation,
        actualCapacity: plan.capacity_utilization * baselineCapacity / 100,
        utilizationRate: plan.capacity_utilization,
        totalCost: plan.total_cost,
        completionRate: plan.completion_rate,
        averageDelay: plan.average_delay,
        weeklyScheduleSummary: {
          totalProduction,
          workingDays,
          customers: Array.from(allCustomers),
          products: Array.from(allProducts)
        }
      })
      
      // 切换到数据上传页面
      setActiveTab('sched-upload')
      
      toast.success('排产方案数据已导入到排班系统！')
    } catch (error) {
      console.error('集成到排班失败:', error)
      toast.error('集成到排班失败')
    } finally {
      setIsIntegratingToScheduling(false)
    }
  }

  // 排班相关函数
  const handleFileUpload = (file: File, setter: (file: File | null) => void) => {
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setter(file)
      setError(null)
    } else {
      toast.error('请上传 .xlsx 格式的文件')
    }
  }

  // 导出排班结果
  const downloadResults = async () => {
    try {
      const scheduleData = viewMode === 'day' 
        ? { results: schedulingResults, groups: positionGroups }
        : { weekly_schedule: weeklySchedule }
      
      const data = await callAPI('/export/schedule-data', 'POST', {
        schedule_type: viewMode,
        schedule_data: scheduleData
      })
      
      // 创建Excel文件
      const ws = XLSX.utils.json_to_sheet(data.schedule_results)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, viewMode === 'day' ? '今日排班结果' : '一周排班结果')
      
      if (viewMode === 'week' && data.daily_summary) {
        const summaryWs = XLSX.utils.json_to_sheet(data.daily_summary)
        XLSX.utils.book_append_sheet(wb, summaryWs, '每日汇总')
      }
      
      const filename = viewMode === 'day' 
        ? `${formatDate(currentDate)}_排班结果.xlsx`
        : `${formatDate(getCurrentWeekDates()[0])}_至_${formatDate(getCurrentWeekDates()[6])}_一周排班结果.xlsx`
      
      XLSX.writeFile(wb, filename)
      toast.success('文件下载成功')
    } catch (error) {
      console.error('导出失败:', error)
      toast.error('导出失败')
    }
  }

  // 更新筛选选项
  const updateFilterOptions = async (groups: PositionGroup[]) => {
    try {
      const data = await callAPI('/data/filter-positions', 'POST', {
        groups: groups,
        filters: {}
      })
      setFilterOptions(data.filter_options)
    } catch (error) {
      console.error('获取筛选选项失败:', error)
    }
  }

  // API调用函数
  const callAPI = async (url: string, method: string = 'GET', data?: unknown) => {
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }
    
    if (data && method !== 'GET') {
      config.body = JSON.stringify(data)
    }
    
    const response = await fetch(`http://localhost:8000${url}`, config)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || `API请求失败: ${response.status}`)
    }
    
    return await response.json()
  }

  // 单日排班
  const handleScheduling = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      if (!skuFile || !positionFile || !skillFile || !productCode) {
        throw new Error('请上传所有数据文件，并填写SKU型号')
      }

      // 读取文件数据
      const [skuRawData, positionRawData, skillRawData] = await Promise.all([
        readExcelFile(skuFile),
        readExcelFile(positionFile),
        readExcelFile(skillFile)
      ])

      // 调用后端API进行排班
      const targetDate = formatDate(currentDate)
      const data = await callAPI('/scheduling/day', 'POST', {
        target_date: targetDate,
        product_code: productCode,
        sku_data: skuRawData,
        position_data: positionRawData,
        skill_data: skillRawData,
        weekly_assigned_workers: []
      })
      
      setSchedulingResults(data.results)
      setPositionGroups(data.groups)
      
      // 更新性能指标
      if (data.performance_metrics) {
        setPerformanceMetrics(data.performance_metrics)
      }
      
      // 更新周排班数据
      setWeeklySchedule(prev => ({
        ...prev,
        [targetDate]: {
          positionGroups: data.groups,
          schedulingResults: data.results,
          productCode: productCode
        }
      }))
      
      // 获取筛选选项
      await updateFilterOptions(data.groups)
      
      setActiveTab('sched-schedule')
      
      if (data.results.length > 0) {
        toast.success('排班成功！')
      } else {
        toast.error('无排班结果，请检查数据或条件')
      }
    } catch (error) {
      console.error('排班处理错误:', error)
      const errorMessage = error instanceof Error ? error.message : '处理文件时发生错误，请检查文件格式'
      setError(errorMessage)
      toast.error('处理失败')
    } finally {
      setIsProcessing(false)
    }
  }

  // 一周排班
  const handleWeeklyScheduling = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      if (!skuFile || !positionFile || !skillFile || !productCode) {
        throw new Error('请上传所有数据文件，并填写SKU型号')
      }

      // 读取文件数据
      const [skuRawData, positionRawData, skillRawData] = await Promise.all([
        readExcelFile(skuFile),
        readExcelFile(positionFile),
        readExcelFile(skillFile)
      ])

      // 调用后端API进行一周排班
      const weekDates = getCurrentWeekDates()
      const startDate = formatDate(weekDates[0])
      const data = await callAPI('/scheduling/week', 'POST', {
        start_date: startDate,
        product_code: productCode,
        sku_data: skuRawData,
        position_data: positionRawData,
        skill_data: skillRawData
      })
      
      setWeeklySchedule(data.weekly_schedule)
      setViewMode('week')
      setActiveTab('sched-schedule')
      
      // 更新性能指标 - 使用最新一天的数据
      const latestDate = formatDate(weekDates[weekDates.length - 1])
      if (data.weekly_schedule[latestDate]?.performance_metrics) {
        setPerformanceMetrics(data.weekly_schedule[latestDate].performance_metrics)
      }
      
      const totalResults = data.summary.total_results || 0
      
      if (totalResults > 0) {
        toast.success(`一周排班成功！共排班 ${totalResults} 人次`)
      } else {
        toast.error('无排班结果，请检查数据或条件')
      }
    } catch (error) {
      console.error('一周排班处理错误:', error)
      const errorMessage = error instanceof Error ? error.message : '处理文件时发生错误，请检查文件格式'
      setError(errorMessage)
      toast.error('一周排班失败')
    } finally {
      setIsProcessing(false)
    }
  }

  // 工具函数
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatWeekday = (date: Date) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  }

  // 获取当前周的日期范围
  const getCurrentWeekDates = (): Date[] => {
    const today = new Date(currentDate)
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    
    const weekDates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      weekDates.push(date)
    }
    return weekDates
  }

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  // 生成表格数据
  const generateTableData = (plan: CapacityOptimizationPlan) => {
    const tableData: Array<{
      date: string;
      weekday: string;
      customers: string[];
      products: string[];
      totalQuantity: number;
      totalCapacityUsed: number;
      details: ProductionItem[];
    }> = []
    const dates = Object.keys(plan.weekly_schedule).sort()
    
    // 获取所有客户和产品
    const customers = new Set<string>()
    const products = new Set<string>()
    
    dates.forEach(date => {
      plan.weekly_schedule[date]?.forEach((result: ProductionItem) => {
        customers.add(result.customer_name)
        products.add(result.product_code)
      })
    })
    
    // 构建表格数据
    dates.forEach(date => {
      const dayResults = plan.weekly_schedule[date] || []
      const totalQuantity = dayResults.reduce((sum: number, result: ProductionItem) => sum + result.quantity, 0)
      const totalCapacityUsed = dayResults.reduce((sum: number, result: ProductionItem) => sum + result.capacity_used, 0)
      
      tableData.push({
        date,
        weekday: new Date(date).toLocaleDateString('zh-CN', { weekday: 'long' }),
        customers: [...new Set(dayResults.map((r: ProductionItem) => r.customer_name))],
        products: [...new Set(dayResults.map((r: ProductionItem) => r.product_code))],
        totalQuantity,
        totalCapacityUsed,
        details: dayResults
      })
    })

    return { tableData, allCustomers: Array.from(customers), allProducts: Array.from(products) }
  }

  // 概览数据计算
  const totalQuantity = useMemo(() => orders.reduce((sum, order) => sum + order.quantity, 0), [orders])
  const totalValue = useMemo(() => orders.reduce((sum, order) => sum + (order.quantity * (order.unit_price || 0)), 0), [orders])
  const customerCount = useMemo(() => new Set(orders.map(order => order.customer_name).filter(Boolean)).size, [orders])

  // 侧边栏导航渲染
  const renderSidebar = () => {
    return (
      <div className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200 shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            智能生产管理系统
          </h1>
          <p className="text-gray-600 text-sm mt-1">排产排班一体化解决方案</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navigationConfig.map((group) => (
            <div key={group.id} className="space-y-1">
              {/* 分组标题 */}
              <button
                onClick={() => toggleNavGroup(group.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  getActiveGroup() === group.id
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <group.icon className="h-5 w-5" />
                  <span className="font-medium">{group.label}</span>
                </div>
                {navigationState[group.id] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {/* 子项目 */}
              {navigationState[group.id] && (
                <div className="ml-6 space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 text-left ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className={`text-xs mt-1 ${
                            activeTab === item.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'prod-orders':
        return (
          <OrderManagement
            orders={orders}
            setOrders={setOrders}
            totalQuantity={totalQuantity}
            totalValue={totalValue}
            customerCount={customerCount}
            formatCurrency={formatCurrency}
            removeOrder={removeOrder}
            updateOrder={updateOrder}
          />
        )

      case 'prod-params':
        return (
          <ParameterSettings
            baselineCapacity={baselineCapacity}
            capacityVariation={capacityVariation}
            delayPenalty={delayPenalty}
            setBaselineCapacity={setBaselineCapacity}
            setCapacityVariation={setCapacityVariation}
            setDelayPenalty={setDelayPenalty}
            executeMultiPlanProduction={executeMultiPlanProduction}
            openCapacityModal={openCapacityModal}
            openChangeoverModal={openChangeoverModal}
            isLoading={isProcessing}
            ordersLength={orders.length}
          />
        )

      case 'prod-comparison':
        if (!results) {
          return (
            <div className="text-center py-16">
              <Calculator className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无排产结果</h3>
              <p className="text-gray-500 mb-6">请先在参数设置页面执行排产计算</p>
              <Button onClick={() => setActiveTab('prod-params')} className="bg-blue-600 hover:bg-blue-700">
                去设置参数
              </Button>
            </div>
          )
        }

        return (
          <PlanComparison
            results={results}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            setActiveTab={setActiveTab}
            integrateToScheduling={integrateToScheduling}
            isIntegratingToScheduling={isIntegratingToScheduling}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
          />
        )

      case 'prod-analysis':
        if (!selectedPlan) {
          return (
            <div className="text-center py-16">
              <PieChart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">请选择方案</h3>
              <p className="text-gray-500 mb-6">从方案对比页面选择一个方案进行详细分析</p>
              <Button onClick={() => setActiveTab('prod-comparison')} className="bg-blue-600 hover:bg-blue-700">
                返回方案对比
              </Button>
            </div>
          )
        }

        return (
          <ProductionAnalysis
            selectedPlan={selectedPlan}
            setActiveTab={setActiveTab}
            integrateToScheduling={integrateToScheduling}
            isIntegratingToScheduling={isIntegratingToScheduling}
            generateTableData={generateTableData}
            formatPercentage={formatPercentage}
          />
        )

      case 'sched-upload':
        return (
          <DataUpload
            skuFile={skuFile}
            positionFile={positionFile}
            skillFile={skillFile}
            productCode={productCode}
            error={error}
            isProcessing={isProcessing}
            productionCapacityConfig={productionCapacityConfig}
            handleFileUpload={handleFileUpload}
            setSkuFile={setSkuFile}
            setPositionFile={setPositionFile}
            setSkillFile={setSkillFile}
            setProductCode={setProductCode}
            handleScheduling={handleScheduling}
            handleWeeklyScheduling={handleWeeklyScheduling}
          />
        )

      case 'sched-schedule':
        return (
          <ScheduleResults
            viewMode={viewMode}
            setViewMode={setViewMode}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            weekDates={getCurrentWeekDates()}
            weeklySchedule={weeklySchedule}
            positionGroups={positionGroups}
            schedulingResults={schedulingResults}
            selectedWeekDay={selectedWeekDay}
            setSelectedWeekDay={setSelectedWeekDay}
            filters={filters}
            setFilters={setFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            filterOptions={filterOptions}
            downloadResults={downloadResults}
            navigateToDay={(date: Date) => {
              setCurrentDate(date)
              setViewMode('day')
              const dateStr = formatDate(date)
              const daySchedule = weeklySchedule[dateStr]
              if (daySchedule) {
                setSchedulingResults(daySchedule.schedulingResults)
                setPositionGroups(daySchedule.positionGroups)
                setProductCode(daySchedule.productCode)
              }
            }}
            formatDate={formatDate}
            formatWeekday={formatWeekday}
          />
        )

      case 'sched-analysis':
        return (
          <SchedulingPerformanceAnalysis
            performanceMetrics={performanceMetrics}
            positionGroups={positionGroups}
            setActiveTab={setActiveTab}
          />
        )

      case 'sched-employee-status':
        return (
          <EmployeeStatusManagement 
            positionGroups={positionGroups}
            setActiveTab={setActiveTab}
          />
        )

      default:
        return null
    }
  }

  // 产能数据modal渲染
  const renderCapacityModal = () => {
    if (!showCapacityModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] m-4">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">产能配置数据表</h2>
              <p className="text-sm text-gray-600">查看各产能级别对应的成本参数</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCapacityModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loadingCapacityData ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">加载产能数据中...</p>
              </div>
            ) : capacityData ? (
              <div className="space-y-6">
                {/* 成本计算公式 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    成本计算公式
                  </h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-center">
                      <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                      {capacityData.cost_formula.energy_cost}
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 bg-orange-500 rounded-full mr-2"></span>
                      {capacityData.cost_formula.labor_cost}
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 bg-purple-500 rounded-full mr-2"></span>
                      {capacityData.cost_formula.total_cost}
                    </div>
                  </div>
                </div>

                {/* 产能数据表格 */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">产能</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">节拍</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">能耗</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">定员</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">人效</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">能耗成本</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">人效成本</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">总成本</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capacityData.capacity_data.map((row, index) => (
                        <tr key={index} className={`
                          ${[170, 180, 190].includes(row.产能) ? 'bg-yellow-50 border-yellow-200' : 
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        `}>
                          <td className="border border-gray-300 px-4 py-2">{row.产能}</td>
                          <td className="border border-gray-300 px-4 py-2">{row.节拍}</td>
                          <td className="border border-gray-300 px-4 py-2">{row.能耗}</td>
                          <td className="border border-gray-300 px-4 py-2">{row.定员}</td>
                          <td className="border border-gray-300 px-4 py-2">{row.人效}</td>
                          <td className="border border-gray-300 px-4 py-2">{row.能耗成本.toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-2">{row.人效成本.toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-2 font-semibold">{row.总成本.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                  <p className="font-medium mb-2">说明：</p>
                  <ul className="space-y-1">
                    <li>• 黄色高亮行为系统常用的产能配置（170、180、190）</li>
                    <li>• 成本计算基于实际能耗和人效数据</li>
                    <li>• 能耗单价：1 ¥/kWh，人效单价：360 ¥/人</li>
                    <li>• 总成本 = 能耗成本 + 人效成本</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">获取产能数据失败</p>
                <Button onClick={fetchCapacityData} className="mt-4">
                  重新加载
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 转产时间数据modal渲染
  const renderChangeoverModal = () => {
    if (!showChangeoverModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] m-4">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">转产时间配置表</h2>
              <p className="text-sm text-gray-600">查看各箱型工作中心的转产时间数据</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChangeoverModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loadingChangeoverData ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">加载转产时间数据中...</p>
              </div>
            ) : changeoverData ? (
              <div className="space-y-6">
                {/* 转产时间说明 */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    转产时间说明
                  </h3>
                  <div className="space-y-2 text-sm text-orange-800">
                    <div className="flex items-start">
                      <span className="w-4 h-4 bg-blue-500 rounded-full mr-2 mt-0.5 flex-shrink-0"></span>
                      <span><strong>用途：</strong>{changeoverData.description.purpose}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-4 h-4 bg-green-500 rounded-full mr-2 mt-0.5 flex-shrink-0"></span>
                      <span><strong>包含：</strong>{changeoverData.description.includes}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-4 h-4 bg-yellow-500 rounded-full mr-2 mt-0.5 flex-shrink-0"></span>
                      <span><strong>注意：</strong>{changeoverData.description.note}</span>
                    </div>
                  </div>
                </div>

                {/* 统计概览 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{changeoverData.statistics.total_box_types}</div>
                    <div className="text-sm text-blue-600">箱型数量</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{changeoverData.statistics.total_work_centers}</div>
                    <div className="text-sm text-green-600">工作中心</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{changeoverData.statistics.total_records}</div>
                    <div className="text-sm text-purple-600">转产记录</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{changeoverData.statistics.min_changeover_time}</div>
                    <div className="text-sm text-yellow-600">最短时间({changeoverData.statistics.unit})</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{changeoverData.statistics.max_changeover_time}</div>
                    <div className="text-sm text-red-600">最长时间({changeoverData.statistics.unit})</div>
                  </div>
                </div>

                {/* 转产时间数据表格 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(changeoverData.changeover_data).map(([boxType, workCenters]) => (
                    <div key={boxType} className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Package className="h-5 w-5 mr-2 text-blue-600" />
                        {boxType}
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">工作中心</th>
                              <th className="border border-gray-300 px-4 py-2 text-center font-medium text-gray-700">转产时间({changeoverData.statistics.unit})</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(workCenters).map(([workCenter, time], index) => (
                              <tr key={workCenter} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                <td className="border border-gray-300 px-4 py-2">{workCenter}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                                  <span className={`px-2 py-1 rounded text-sm ${
                                    time <= 30 ? 'bg-green-100 text-green-800' :
                                    time <= 60 ? 'bg-yellow-100 text-yellow-800' :
                                    time <= 180 ? 'bg-orange-100 text-orange-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {time}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                  <p className="font-medium mb-2">说明：</p>
                  <ul className="space-y-1">
                    <li>• <span className="inline-block w-3 h-3 bg-green-100 rounded mr-2"></span>绿色：≤30分钟（快速转产）</li>
                    <li>• <span className="inline-block w-3 h-3 bg-yellow-100 rounded mr-2"></span>黄色：31-60分钟（中等转产）</li>
                    <li>• <span className="inline-block w-3 h-3 bg-orange-100 rounded mr-2"></span>橙色：61-180分钟（较长转产）</li>
                    <li>• <span className="inline-block w-3 h-3 bg-red-100 rounded mr-2"></span>红色：&gt;180分钟（长时转产）</li>
                    <li>• 排产时需考虑工作中心的转产时间对总体生产计划的影响</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">获取转产时间数据失败</p>
                <Button onClick={fetchChangeoverData} className="mt-4">
                  重新加载
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 工具函数：读取Excel文件
  const readExcelFile = async (file: File): Promise<unknown[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsArrayBuffer(file)
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="flex h-screen">
        {/* 左侧导航栏 - 删除标题 */}
        {renderSidebar()}

        {/* 主内容区域 */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* 产能数据modal */}
      {renderCapacityModal()}

      {/* 转产时间数据modal */}
      {renderChangeoverModal()}
    </div>
  )
} 