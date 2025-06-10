'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  Download, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet,
  Calendar,
  Clock,
  MapPin,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  Search,
  Filter,
  X,
  CalendarDays,
  Copy,
  RotateCcw,
  TrendingUp,
  Target,
  UserCheck,
  AlertTriangle,
  BookOpen,
  Wrench,
  HelpCircle,
  UserMinus,
  RefreshCw,
  AlertOctagon
} from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

interface SchedulingResult {
  岗位编码: string
  姓名: string
  工号: string
  技能等级: number
  班组: string
  工作中心: string
  日期: string
}

interface TaskData {
  产成品编码: string
  岗位编码: string
  需求人数: number
}

interface PositionData {
  工作中心: string
  岗位编码: string
  岗位技能等级: number
}

interface SkillMatrixData {
  姓名: string
  工号: string
  班组?: string
  [key: string]: any
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
  状态: string // '全部' | '已满' | '缺员'
  搜索关键词: string
}

interface WeeklySchedule {
  [date: string]: {
    positionGroups: PositionGroup[]
    schedulingResults: SchedulingResult[]
    productCode: string
  }
}

type ViewMode = 'day' | 'week'

// 公式提示组件
const FormulaTooltip = ({ title, formula }: { title: string; formula: string }) => (
  <div className="relative inline-block group">
    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-max max-w-sm">
      <div className="font-semibold mb-1">{title}</div>
      <div className="whitespace-nowrap">
        {formula}
      </div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
)

// 新增评价指标相关接口
interface PerformanceMetrics {
  人岗匹配度: {
    总体匹配度: number
    岗位匹配情况: PositionMatchData[]
    培养计划: TrainingPlan[]
  }
  工时利用率: {
    总体利用率: number
    低效岗位: LowEfficiencyPosition[]
    优化方案: OptimizationSuggestion[]
  }
}

interface PositionMatchData {
  岗位编码: string
  工作中心: string
  要求技能等级: number
  平均实际技能: number
  匹配度: number
  匹配状态: '完全匹配' | '基本匹配' | '需要培养'
  员工情况: {
    姓名: string
    工号: string
    实际技能: number
    技能差距: number
  }[]
}

interface TrainingPlan {
  岗位编码: string
  工作中心: string
  需培养人员: {
    姓名: string
    工号: string
    当前技能: number
    目标技能: number
    培养内容: string
    预计时间: string
  }[]
  优先级: '高' | '中' | '低'
}

interface LowEfficiencyPosition {
  岗位编码: string
  工作中心: string
  当前利用率: number
  标准工时: number
  实际工时: number
  差距工时: number
  影响原因: string[]
}

interface OptimizationSuggestion {
  岗位编码: string
  建议类型: '人员调整' | '技能提升' | '工艺优化'
  具体建议: string
  预期效果: string
  实施难度: '容易' | '中等' | '困难'
}

// 新增：请假和调整相关接口
interface LeaveInfo {
  工号: string
  姓名: string
  请假日期: string
  请假类型: '病假' | '事假' | '年假' | '其他'
  请假时长: number // 小时
  影响岗位: string[]
  紧急程度: '高' | '中' | '低'
}

interface AdjustmentSuggestion {
  调整类型: '班组内调整' | '跨班组调整' | '外借人员' | '加班补偿'
  原岗位: string
  目标岗位?: string
  调整人员: {
    工号: string
    姓名: string
    当前班组: string
    目标班组?: string
    技能等级: number
    调整原因: string
  }[]
  效率影响: {
    原岗位效率损失: number
    目标岗位效率变化: number
    整体效率影响: number
  }
  制造周期影响: {
    预计延误时间: number // 小时
    关键路径影响: boolean
    影响产品: string[]
  }
  实施建议: string
  优先级: number // 1-10，数字越大优先级越高
}

interface TeamWorkload {
  班组: string
  总人数: number
  在岗人数: number
  请假人数: number
  技能分布: { [技能等级: string]: number }
  负荷率: number
  可调配人员: {
    工号: string
    姓名: string
    可支援岗位: string[]
    技能等级分布: { [岗位: string]: number }
  }[]
}

export default function PaibanPage() {
  const [skuFile, setSkuFile] = useState<File | null>(null)
  const [positionFile, setPositionFile] = useState<File | null>(null)
  const [skillFile, setSkillFile] = useState<File | null>(null)
  const [productCode, setProductCode] = useState('C1B010000036')
  const [schedulingResults, setSchedulingResults] = useState<SchedulingResult[]>([])
  const [positionGroups, setPositionGroups] = useState<PositionGroup[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState('upload')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({})
  const [selectedWeekDay, setSelectedWeekDay] = useState<string>('')
  
  // 筛选状态
  const [filters, setFilters] = useState<FilterState>({
    岗位编码: '',
    工作中心: '',
    班组: '',
    状态: '全部',
    搜索关键词: ''
  })

  // 性能评价指标状态
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)

  // 新增：请假和调整相关状态
  const [leaveList, setLeaveList] = useState<LeaveInfo[]>([])
  const [adjustmentSuggestions, setAdjustmentSuggestions] = useState<AdjustmentSuggestion[]>([])
  const [teamWorkloads, setTeamWorkloads] = useState<TeamWorkload[]>([])
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [skillMatrixData, setSkillMatrixData] = useState<SkillMatrixData[]>([])

  // 获取当前周的日期范围
  const getCurrentWeekDates = () => {
    const today = new Date(currentDate)
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    
    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      weekDates.push(date)
    }
    return weekDates
  }

  const weekDates = getCurrentWeekDates()

  // 获取筛选选项
  const filterOptions = useMemo(() => {
    let currentGroups = positionGroups
    
    if (viewMode === 'week' && selectedWeekDay) {
      currentGroups = weeklySchedule[selectedWeekDay]?.positionGroups || []
    }
    
    const 岗位编码列表 = [...new Set(currentGroups.map(g => g.岗位编码))].sort()
    const 工作中心列表 = [...new Set(currentGroups.map(g => g.工作中心))].sort()
    const 班组列表 = [...new Set(currentGroups.flatMap(g => g.员工列表.map(w => w.班组)).filter(Boolean))].sort()
    
    return {
      岗位编码列表,
      工作中心列表,
      班组列表
    }
  }, [positionGroups, weeklySchedule, selectedWeekDay, viewMode])

  // 筛选后的岗位组
  const filteredPositionGroups = useMemo(() => {
    let currentGroups = positionGroups
    
    if (viewMode === 'week' && selectedWeekDay) {
      currentGroups = weeklySchedule[selectedWeekDay]?.positionGroups || []
    }
    
    return currentGroups.filter(group => {
      // 岗位编码筛选
      if (filters.岗位编码 && !group.岗位编码.includes(filters.岗位编码)) {
        return false
      }
      
      // 工作中心筛选
      if (filters.工作中心 && group.工作中心 !== filters.工作中心) {
        return false
      }
      
      // 班组筛选
      if (filters.班组 && !group.员工列表.some(w => w.班组 === filters.班组)) {
        return false
      }
      
      // 状态筛选
      if (filters.状态 !== '全部') {
        const 已满 = group.已排人数 >= group.需求人数
        if (filters.状态 === '已满' && !已满) return false
        if (filters.状态 === '缺员' && 已满) return false
      }
      
      // 搜索关键词筛选
      if (filters.搜索关键词) {
        const keyword = filters.搜索关键词.toLowerCase()
        const searchText = [
          group.岗位编码,
          group.工作中心,
          ...group.员工列表.map(w => w.姓名),
          ...group.员工列表.map(w => w.工号)
        ].join(' ').toLowerCase()
        
        if (!searchText.includes(keyword)) {
          return false
        }
      }
      
      return true
    })
  }, [positionGroups, weeklySchedule, selectedWeekDay, viewMode, filters])

  // 计算人岗匹配度
  const calculatePositionMatching = (groups: PositionGroup[]): PerformanceMetrics['人岗匹配度'] => {
    const 岗位匹配情况: PositionMatchData[] = []
    const 培养计划: TrainingPlan[] = []
    let 总匹配度分子 = 0
    let 总匹配度分母 = 0

    groups.forEach(group => {
      const 要求技能等级 = parseInt(group.技能等级.replace('级', ''))
      let 技能总分 = 0
      let 员工数量 = group.员工列表.length
      let 满足要求人数 = 0
      
      const 员工情况 = group.员工列表.map(worker => {
        const 实际技能 = worker.技能等级
        const 技能差距 = Math.max(0, 要求技能等级 - 实际技能)
        技能总分 += 实际技能
        
        // 统计满足要求的人数
        if (实际技能 >= 要求技能等级) {
          满足要求人数++
        }
        
        return {
          姓名: worker.姓名,
          工号: worker.工号,
          实际技能,
          技能差距
        }
      })

      if (员工数量 > 0) {
        const 平均实际技能 = 员工数量 > 0 ? 技能总分 / 员工数量 : 0
        // 修改匹配度计算逻辑：使用满足要求的人数比例
        const 匹配度 = (满足要求人数 / 员工数量) * 100
        
        let 匹配状态: '完全匹配' | '基本匹配' | '需要培养'
        if (匹配度 === 100) 匹配状态 = '完全匹配'
        else if (匹配度 >= 75) 匹配状态 = '基本匹配'
        else 匹配状态 = '需要培养'

        岗位匹配情况.push({
          岗位编码: group.岗位编码,
          工作中心: group.工作中心,
          要求技能等级,
          平均实际技能: Number.isNaN(平均实际技能) ? 0 : 平均实际技能,
          匹配度: Number.isNaN(匹配度) ? 0 : 匹配度,
          匹配状态,
          员工情况
        })

        // 计算总体匹配度
        总匹配度分子 += 满足要求人数
        总匹配度分母 += 员工数量

        // 生成培养计划
        const 需培养人员 = 员工情况
          .filter(emp => emp.技能差距 > 0)
          .map(emp => ({
            姓名: emp.姓名,
            工号: emp.工号,
            当前技能: emp.实际技能,
            目标技能: 要求技能等级,
            培养内容: `${group.岗位编码}岗位技能提升训练`,
            预计时间: emp.技能差距 > 2 ? '3-6个月' : emp.技能差距 > 1 ? '1-3个月' : '2-4周'
          }))

        if (需培养人员.length > 0) {
          const 优先级 = 匹配度 < 50 ? '高' : 匹配度 < 75 ? '中' : '低'
          培养计划.push({
            岗位编码: group.岗位编码,
            工作中心: group.工作中心,
            需培养人员,
            优先级
          })
        }
      }
    })

    const 总体匹配度 = 总匹配度分母 > 0 ? (总匹配度分子 / 总匹配度分母) * 100 : 0

    return {
      总体匹配度,
      岗位匹配情况,
      培养计划: 培养计划.sort((a, b) => {
        const priorityOrder = { '高': 3, '中': 2, '低': 1 }
        return priorityOrder[b.优先级] - priorityOrder[a.优先级]
      })
    }
  }

  // 计算工时利用率
  const calculateWorkHourEfficiency = (groups: PositionGroup[]): PerformanceMetrics['工时利用率'] => {
    const 低效岗位: LowEfficiencyPosition[] = []
    const 优化方案: OptimizationSuggestion[] = []
    let 总利用率分子 = 0
    let 总利用率分母 = 0

    groups.forEach(group => {
      // 模拟标准工时数据（实际应该从数据文件获取）
      const 标准工时 = 8 // 假设标准工时为8小时
      const 实际配置工时 = group.已排人数 * 标准工时
      const 需求工时 = group.需求人数 * 标准工时
      const 当前利用率 = 需求工时 > 0 ? (实际配置工时 / 需求工时) * 100 : 0

      总利用率分子 += 实际配置工时
      总利用率分母 += 需求工时

      if (当前利用率 < 85 && group.需求人数 > 0) {
        const 差距工时 = 需求工时 - 实际配置工时
        const 影响原因: string[] = []
        
        if (group.已排人数 < group.需求人数) {
          影响原因.push('人员配置不足')
        }
        
        const 技能不足人员 = group.员工列表.filter(w => 
          w.技能等级 < parseInt(group.技能等级.replace('级', ''))
        ).length
        
        if (技能不足人员 > 0) {
          影响原因.push('技能水平不达标')
        }

        if (影响原因.length === 0) {
          影响原因.push('其他因素')
        }

        低效岗位.push({
          岗位编码: group.岗位编码,
          工作中心: group.工作中心,
          当前利用率,
          标准工时,
          实际工时: 实际配置工时,
          差距工时,
          影响原因
        })

        // 生成优化方案
        if (group.已排人数 < group.需求人数) {
          优化方案.push({
            岗位编码: group.岗位编码,
            建议类型: '人员调整',
            具体建议: `建议增加${group.需求人数 - group.已排人数}名员工`,
            预期效果: `提升工时利用率至${Math.min(100, 当前利用率 + (差距工时/需求工时)*100).toFixed(1)}%`,
            实施难度: '中等'
          })
        }

        if (技能不足人员 > 0) {
          优化方案.push({
            岗位编码: group.岗位编码,
            建议类型: '技能提升',
            具体建议: `对${技能不足人员}名员工进行技能培训`,
            预期效果: '提升操作效率10-20%',
            实施难度: '容易'
          })
        }

        if (当前利用率 < 70) {
          优化方案.push({
            岗位编码: group.岗位编码,
            建议类型: '工艺优化',
            具体建议: '检查工艺流程，优化操作标准',
            预期效果: '提升整体效率5-15%',
            实施难度: '困难'
          })
        }
      }
    })

    const 总体利用率 = 总利用率分母 > 0 ? (总利用率分子 / 总利用率分母) * 100 : 0

    return {
      总体利用率,
      低效岗位: 低效岗位.sort((a, b) => a.当前利用率 - b.当前利用率),
      优化方案: 优化方案.sort((a, b) => {
        const difficultyOrder = { '容易': 3, '中等': 2, '困难': 1 }
        return difficultyOrder[b.实施难度] - difficultyOrder[a.实施难度]
      })
    }
  }

  // 更新性能指标
  const updatePerformanceMetrics = (groups: PositionGroup[]) => {
    if (groups.length === 0) {
      setPerformanceMetrics(null)
      return
    }

    const 人岗匹配度 = calculatePositionMatching(groups)
    const 工时利用率 = calculateWorkHourEfficiency(groups)

    setPerformanceMetrics({
      人岗匹配度,
      工时利用率
    })
  }

  // 重置筛选
  const resetFilters = () => {
    setFilters({
      岗位编码: '',
      工作中心: '',
      班组: '',
      状态: '全部',
      搜索关键词: ''
    })
  }

  // 检查是否有活动筛选
  const hasActiveFilters = useMemo(() => {
    return filters.岗位编码 || filters.工作中心 || filters.班组 || 
           filters.状态 !== '全部' || filters.搜索关键词
  }, [filters])

  const handleFileUpload = (file: File, setter: (file: File | null) => void) => {
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setter(file)
      setError(null)
    } else {
      toast.error('请上传 .xlsx 格式的文件')
    }
  }

  const readExcelFile = async (file: File): Promise<any[]> => {
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

  const processSkuData = (rawData: any[]): TaskData[] => {
    return rawData.slice(1).map(row => ({
      产成品编码: row[0] || '',
      岗位编码: row[4] || '',
      需求人数: parseInt(row[16]) || 0
    })).filter(item => item.产成品编码 && item.岗位编码)
  }

  const processPositionData = (rawData: any[]): PositionData[] => {
    return rawData.slice(1).map(row => ({
      工作中心: row[2] || '',
      岗位编码: row[5] || '',
      岗位技能等级: parseInt(row[12]) || 0
    })).filter(item => item.工作中心 && item.岗位编码)
  }

  const processSkillMatrix = (rawData: any[]): SkillMatrixData[] => {
    if (rawData.length < 2) return []
    
    const headers = rawData[0]
    return rawData.slice(1).map(row => {
      const obj: SkillMatrixData = {
        姓名: '',
        工号: ''
      }
      
      headers.forEach((header: string, index: number) => {
        if (header === '姓名') obj.姓名 = row[index] || ''
        else if (header === '工号') obj.工号 = row[index] || ''
        else if (header === '班组') obj.班组 = row[index] || ''
        else obj[header] = parseInt(row[index]) || 0
      })
      
      return obj
    }).filter(item => item.姓名 && item.工号)
  }

  // 单日排班逻辑
  const performDayScheduling = async (targetDate: string, productCodeForDay: string) => {
    if (!skuFile || !positionFile || !skillFile || !productCodeForDay) {
      throw new Error('请上传所有数据文件，并填写SKU型号')
    }

    const [skuRawData, positionRawData, skillRawData] = await Promise.all([
      readExcelFile(skuFile),
      readExcelFile(positionFile),
      readExcelFile(skillFile)
    ])

    const table1 = processSkuData(skuRawData)
    const dolePositions = processPositionData(positionRawData)
    const skillMatrix = processSkillMatrix(skillRawData)

    // 保存技能矩阵数据用于后续调整建议计算
    setSkillMatrixData(skillMatrix)

    const todayTasks = table1
      .filter(item => item.产成品编码 === productCodeForDay)
      .reduce((acc, curr) => {
        const existing = acc.find(item => item.岗位编码 === curr.岗位编码)
        if (existing) {
          existing.需求人数 += curr.需求人数
        } else {
          acc.push({ ...curr })
        }
        return acc
      }, [] as TaskData[])
      .filter(item => item.需求人数 > 0)

    // 获取已经在本周其他日期排班的员工
    const weeklyAssignedWorkers = new Set<string>()
    Object.entries(weeklySchedule).forEach(([date, schedule]) => {
      if (date !== targetDate) {
        schedule.schedulingResults.forEach(result => {
          weeklyAssignedWorkers.add(result.工号)
        })
      }
    })

    const assignedWorkers = new Set<string>(weeklyAssignedWorkers)
    const results: SchedulingResult[] = []
    const groups: PositionGroup[] = []

    for (const task of todayTasks) {
      const { 岗位编码: postCode, 需求人数: requiredPeople } = task

      const skillReq = dolePositions.find(pos => pos.岗位编码 === postCode)
      if (!skillReq) continue

      const requiredSkillLevel = skillReq.岗位技能等级
      const workCenter = skillReq.工作中心

      // 获取所有可用员工
      let available = skillMatrix.filter(worker => !assignedWorkers.has(worker.工号))
      
      // 按技能等级排序，优先安排高技能人员
      const sortedWorkers = available
        .filter(worker => (worker[postCode] || 0) > 0) // 至少有一点该岗位技能
        .sort((a, b) => {
          // 首先按班组排序（相同班组优先）
          if (a.班组 && b.班组 && a.班组 !== b.班组) {
            return a.班组.localeCompare(b.班组)
          }
          // 然后按技能等级降序排序
          return (b[postCode] || 0) - (a[postCode] || 0)
        })

      // 逐级安排人员，优先满足要求的，再逐级降低
      const assigned: any[] = []
      let currentIndex = 0

      // 先安排满足要求的人员（技能 >= 要求等级）
      while (assigned.length < requiredPeople && currentIndex < sortedWorkers.length) {
        const worker = sortedWorkers[currentIndex]
        if ((worker[postCode] || 0) >= requiredSkillLevel) {
          assigned.push(worker)
          assignedWorkers.add(worker.工号)
        }
        currentIndex++
      }

      // 如果还有空位，按技能等级从高到低继续安排
      currentIndex = 0
      while (assigned.length < requiredPeople && currentIndex < sortedWorkers.length) {
        const worker = sortedWorkers[currentIndex]
        if (!assignedWorkers.has(worker.工号) && (worker[postCode] || 0) < requiredSkillLevel) {
          assigned.push(worker)
          assignedWorkers.add(worker.工号)
        }
        currentIndex++
      }

      const positionResults: SchedulingResult[] = []

      for (const worker of assigned) {
        const result = {
          岗位编码: postCode,
          姓名: worker.姓名,
          工号: worker.工号,
          技能等级: worker[postCode] || 0,
          班组: worker.班组 || '',
          工作中心: workCenter,
          日期: targetDate
        }
        results.push(result)
        positionResults.push(result)
      }

      groups.push({
        岗位编码: postCode,
        岗位名称: postCode,
        工作中心: workCenter,
        班组: positionResults[0]?.班组 || '',
        技能等级: `${requiredSkillLevel}级`,
        需求人数: requiredPeople,
        已排人数: positionResults.length,
        员工列表: positionResults
      })
    }

    return { results, groups }
  }

  // 单日排班
  const handleScheduling = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      const targetDate = formatDate(currentDate)
      const { results, groups } = await performDayScheduling(targetDate, productCode)

      setSchedulingResults(results)
      setPositionGroups(groups)
      
      // 更新性能指标
      updatePerformanceMetrics(groups)
      
      // 更新周排班数据
      setWeeklySchedule(prev => ({
        ...prev,
        [targetDate]: {
          positionGroups: groups,
          schedulingResults: results,
          productCode: productCode
        }
      }))
      
      setActiveTab('schedule')
      
      if (results.length > 0) {
        toast.success('排班成功！')
      } else {
        toast.error('无排班结果，请检查数据或条件')
      }
    } catch (error) {
      console.error('排班处理错误:', error)
      setError(error instanceof Error ? error.message : '处理文件时发生错误，请检查文件格式')
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
      const newWeeklySchedule: WeeklySchedule = {}
      
      for (const date of weekDates) {
        const dateStr = formatDate(date)
        const { results, groups } = await performDayScheduling(dateStr, productCode)
        
        newWeeklySchedule[dateStr] = {
          positionGroups: groups,
          schedulingResults: results,
          productCode: productCode
        }
      }

      setWeeklySchedule(newWeeklySchedule)
      setViewMode('week')
      setActiveTab('schedule')
      
      // 更新性能指标 - 使用最新一天的数据作为示例
      const latestDate = formatDate(weekDates[weekDates.length - 1])
      if (newWeeklySchedule[latestDate]) {
        updatePerformanceMetrics(newWeeklySchedule[latestDate].positionGroups)
      }
      
      const totalResults = Object.values(newWeeklySchedule).reduce((sum, day) => sum + day.schedulingResults.length, 0)
      
      if (totalResults > 0) {
        toast.success(`一周排班成功！共排班 ${totalResults} 人次`)
      } else {
        toast.error('无排班结果，请检查数据或条件')
      }
    } catch (error) {
      console.error('一周排班处理错误:', error)
      setError(error instanceof Error ? error.message : '处理文件时发生错误，请检查文件格式')
      toast.error('一周排班失败')
    } finally {
      setIsProcessing(false)
    }
  }

  // 复制排班到其他日期
  const copyScheduleToDate = (fromDate: string, toDate: string) => {
    const sourceSchedule = weeklySchedule[fromDate]
    if (!sourceSchedule) return

    setWeeklySchedule(prev => ({
      ...prev,
      [toDate]: {
        ...sourceSchedule,
        schedulingResults: sourceSchedule.schedulingResults.map(result => ({
          ...result,
          日期: toDate
        }))
      }
    }))

    toast.success(`已复制 ${fromDate} 的排班到 ${toDate}`)
  }

  const downloadResults = () => {
    if (viewMode === 'day') {
      if (schedulingResults.length === 0) return

      const ws = XLSX.utils.json_to_sheet(schedulingResults)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '今日排班结果')
      XLSX.writeFile(wb, `${formatDate(currentDate)}_排班结果.xlsx`)
      toast.success('文件下载成功')
    } else {
      // 下载一周的排班结果
      const allResults: SchedulingResult[] = []
      Object.values(weeklySchedule).forEach(day => {
        allResults.push(...day.schedulingResults)
      })

      if (allResults.length === 0) return

      const ws = XLSX.utils.json_to_sheet(allResults)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '一周排班结果')
      
      // 添加每日汇总表
      const dailySummary = weekDates.map(date => {
        const dateStr = formatDate(date)
        const daySchedule = weeklySchedule[dateStr]
        return {
          日期: dateStr,
          产品SKU: daySchedule?.productCode || '',
          排班人数: daySchedule?.schedulingResults.length || 0,
          岗位数: daySchedule?.positionGroups.length || 0
        }
      })
      
      const summaryWs = XLSX.utils.json_to_sheet(dailySummary)
      XLSX.utils.book_append_sheet(wb, summaryWs, '每日汇总')
      
      XLSX.writeFile(wb, `${formatDate(weekDates[0])}_至_${formatDate(weekDates[6])}_一周排班结果.xlsx`)
      toast.success('一周排班文件下载成功')
    }
  }

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

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const navigateToWeek = () => {
    setViewMode('week')
    setActiveTab('schedule')
  }

  const navigateToDay = (date: Date) => {
    setCurrentDate(date)
    setViewMode('day')
    
    const dateStr = formatDate(date)
    const daySchedule = weeklySchedule[dateStr]
    
    if (daySchedule) {
      setSchedulingResults(daySchedule.schedulingResults)
      setPositionGroups(daySchedule.positionGroups)
      setProductCode(daySchedule.productCode)
    }
    
    setActiveTab('schedule')
  }

  // 新增：计算班组负荷情况
  const calculateTeamWorkloads = (groups: PositionGroup[], leaves: LeaveInfo[]): TeamWorkload[] => {
    const teamMap = new Map<string, TeamWorkload>()
    
    // 初始化班组数据
    groups.forEach(group => {
      group.员工列表.forEach(worker => {
        const teamName = worker.班组 || '未分组'
        if (!teamMap.has(teamName)) {
          teamMap.set(teamName, {
            班组: teamName,
            总人数: 0,
            在岗人数: 0,
            请假人数: 0,
            技能分布: {},
            负荷率: 0,
            可调配人员: []
          })
        }
        
        const team = teamMap.get(teamName)!
        team.总人数++
        
        // 检查是否请假
        const isOnLeave = leaves.some(leave => 
          leave.工号 === worker.工号 && 
          leave.请假日期 === formatDate(currentDate)
        )
        
        if (isOnLeave) {
          team.请假人数++
        } else {
          team.在岗人数++
        }
        
        // 统计技能分布
        const skillLevel = `${worker.技能等级}级`
        team.技能分布[skillLevel] = (team.技能分布[skillLevel] || 0) + 1
      })
    })
    
    // 计算可调配人员和负荷率
    teamMap.forEach(team => {
      team.负荷率 = team.总人数 > 0 ? (team.在岗人数 / team.总人数) * 100 : 0
      
      // 找出可调配的人员（技能较高且不在关键岗位）
      groups.forEach(group => {
        group.员工列表.forEach(worker => {
          if (worker.班组 === team.班组 && worker.技能等级 >= 3) {
            const isOnLeave = leaves.some(leave => 
              leave.工号 === worker.工号 && 
              leave.请假日期 === formatDate(currentDate)
            )
            
            if (!isOnLeave) {
              // 获取该员工的所有技能
              const workerSkills = skillMatrixData.find((w: SkillMatrixData) => w.工号 === worker.工号)
              const supportPositions: string[] = []
              const skillDistribution: { [岗位: string]: number } = {}
              
              if (workerSkills) {
                Object.keys(workerSkills).forEach(key => {
                  if (key !== '姓名' && key !== '工号' && key !== '班组') {
                    const skillLevel = workerSkills[key] as number
                    if (skillLevel >= 2) { // 至少2级技能才能支援
                      supportPositions.push(key)
                      skillDistribution[key] = skillLevel
                    }
                  }
                })
              }
              
              if (supportPositions.length > 1) { // 能支援多个岗位才算可调配
                team.可调配人员.push({
                  工号: worker.工号,
                  姓名: worker.姓名,
                  可支援岗位: supportPositions,
                  技能等级分布: skillDistribution
                })
              }
            }
          }
        })
      })
    })
    
    return Array.from(teamMap.values())
  }

  // 新增：生成调整建议
  const generateAdjustmentSuggestions = (
    groups: PositionGroup[], 
    leaves: LeaveInfo[], 
    workloads: TeamWorkload[]
  ): AdjustmentSuggestion[] => {
    const suggestions: AdjustmentSuggestion[] = []
    
    // 分析受请假影响的岗位
    const affectedPositions = new Map<string, { group: PositionGroup, leaveWorkers: string[] }>()
    
    leaves.forEach(leave => {
      if (leave.请假日期 === formatDate(currentDate)) {
        leave.影响岗位.forEach(position => {
          const group = groups.find(g => g.岗位编码 === position)
          if (group) {
            if (!affectedPositions.has(position)) {
              affectedPositions.set(position, { group, leaveWorkers: [] })
            }
            affectedPositions.get(position)!.leaveWorkers.push(leave.工号)
          }
        })
      }
    })
    
    // 为每个受影响的岗位生成调整建议
    affectedPositions.forEach(({ group, leaveWorkers }, position) => {
      const leaveCount = leaveWorkers.length
      const remainingWorkers = group.已排人数 - leaveCount
      const shortage = Math.max(0, group.需求人数 - remainingWorkers)
      
      if (shortage > 0) {
        // 策略1: 班组内调整
        const sameTeamSuggestion = generateInternalTeamAdjustment(group, workloads, shortage)
        if (sameTeamSuggestion) {
          suggestions.push(sameTeamSuggestion)
        }
        
        // 策略2: 跨班组调整
        const crossTeamSuggestion = generateCrossTeamAdjustment(group, workloads, shortage)
        if (crossTeamSuggestion) {
          suggestions.push(crossTeamSuggestion)
        }
        
        // 策略3: 加班补偿
        const overtimeSuggestion = generateOvertimeSuggestion(group, leaveCount, shortage)
        if (overtimeSuggestion) {
          suggestions.push(overtimeSuggestion)
        }
      }
    })
    
    // 按优先级排序
    return suggestions.sort((a, b) => b.优先级 - a.优先级)
  }

  // 班组内调整建议
  const generateInternalTeamAdjustment = (
    group: PositionGroup, 
    workloads: TeamWorkload[], 
    shortage: number
  ): AdjustmentSuggestion | null => {
    const teamWorkload = workloads.find(w => w.班组 === group.班组)
    if (!teamWorkload || teamWorkload.可调配人员.length === 0) return null
    
    const availableWorkers = teamWorkload.可调配人员.filter(worker =>
      worker.可支援岗位.includes(group.岗位编码) &&
      worker.技能等级分布[group.岗位编码] >= parseInt(group.技能等级.replace('级', '')) - 1
    ).slice(0, shortage)
    
    if (availableWorkers.length === 0) return null
    
    const efficiencyLoss = calculateEfficiencyLoss(availableWorkers, group)
    
    return {
      调整类型: '班组内调整',
      原岗位: group.岗位编码,
      调整人员: availableWorkers.map(worker => ({
        工号: worker.工号,
        姓名: worker.姓名,
        当前班组: teamWorkload.班组,
        技能等级: worker.技能等级分布[group.岗位编码] || 0,
        调整原因: '班组内人员支援'
      })),
      效率影响: {
        原岗位效率损失: efficiencyLoss.original,
        目标岗位效率变化: efficiencyLoss.target,
        整体效率影响: efficiencyLoss.overall
      },
      制造周期影响: {
        预计延误时间: Math.max(0, (shortage - availableWorkers.length) * 2),
        关键路径影响: group.需求人数 >= 3, // 假设需求3人以上为关键岗位
        影响产品: [productCode]
      },
      实施建议: `从${teamWorkload.班组}调配${availableWorkers.length}名人员支援${group.岗位编码}岗位`,
      优先级: 8
    }
  }

  // 跨班组调整建议
  const generateCrossTeamAdjustment = (
    group: PositionGroup, 
    workloads: TeamWorkload[], 
    shortage: number
  ): AdjustmentSuggestion | null => {
    const otherTeams = workloads.filter(w => w.班组 !== group.班组 && w.负荷率 < 90)
    const availableWorkers: any[] = []
    
    otherTeams.forEach(team => {
      const suitableWorkers = team.可调配人员.filter(worker =>
        worker.可支援岗位.includes(group.岗位编码) &&
        worker.技能等级分布[group.岗位编码] >= parseInt(group.技能等级.replace('级', '')) - 2
      )
      availableWorkers.push(...suitableWorkers.map(w => ({ ...w, 来源班组: team.班组 })))
    })
    
    const selectedWorkers = availableWorkers
      .sort((a, b) => b.技能等级分布[group.岗位编码] - a.技能等级分布[group.岗位编码])
      .slice(0, shortage)
    
    if (selectedWorkers.length === 0) return null
    
    const efficiencyLoss = calculateEfficiencyLoss(selectedWorkers, group)
    
    return {
      调整类型: '跨班组调整',
      原岗位: group.岗位编码,
      调整人员: selectedWorkers.map(worker => ({
        工号: worker.工号,
        姓名: worker.姓名,
        当前班组: worker.来源班组,
        目标班组: group.班组,
        技能等级: worker.技能等级分布[group.岗位编码] || 0,
        调整原因: '跨班组人员支援'
      })),
      效率影响: {
        原岗位效率损失: efficiencyLoss.original,
        目标岗位效率变化: efficiencyLoss.target,
        整体效率影响: efficiencyLoss.overall
      },
      制造周期影响: {
        预计延误时间: selectedWorkers.length * 0.5, // 跨班组协调时间
        关键路径影响: group.需求人数 >= 3,
        影响产品: [productCode]
      },
      实施建议: `从其他班组调配${selectedWorkers.length}名人员支援，需要协调班组间工作安排`,
      优先级: 6
    }
  }

  // 加班补偿建议
  const generateOvertimeSuggestion = (
    group: PositionGroup, 
    leaveCount: number, 
    shortage: number
  ): AdjustmentSuggestion | null => {
    const remainingWorkers = group.员工列表.filter(worker => 
      !leaveList.some(leave => 
        leave.工号 === worker.工号 && 
        leave.请假日期 === formatDate(currentDate)
      )
    )
    
    if (remainingWorkers.length === 0) return null
    
    const overtimeHours = Math.ceil((shortage / remainingWorkers.length) * 2)
    
    return {
      调整类型: '加班补偿',
      原岗位: group.岗位编码,
      调整人员: remainingWorkers.map(worker => ({
        工号: worker.工号,
        姓名: worker.姓名,
        当前班组: worker.班组,
        技能等级: worker.技能等级,
        调整原因: `加班${overtimeHours}小时补偿人员不足`
      })),
      效率影响: {
        原岗位效率损失: shortage * 15, // 每缺1人损失15%效率
        目标岗位效率变化: -5, // 加班导致效率略降
        整体效率影响: shortage * 10
      },
      制造周期影响: {
        预计延误时间: Math.max(0, shortage * 1.5),
        关键路径影响: shortage >= 2,
        影响产品: [productCode]
      },
      实施建议: `安排在岗人员加班${overtimeHours}小时，注意劳动强度控制`,
      优先级: 4
    }
  }

  // 计算效率损失
  const calculateEfficiencyLoss = (workers: any[], group: PositionGroup) => {
    const requiredSkill = parseInt(group.技能等级.replace('级', ''))
    let totalEfficiencyLoss = 0
    
    workers.forEach(worker => {
      const actualSkill = worker.技能等级分布?.[group.岗位编码] || worker.技能等级 || 0
      const skillGap = Math.max(0, requiredSkill - actualSkill)
      totalEfficiencyLoss += skillGap * 10 // 每级技能差距损失10%效率
    })
    
    return {
      original: totalEfficiencyLoss,
      target: -totalEfficiencyLoss * 0.3, // 目标岗位效率提升
      overall: totalEfficiencyLoss * 0.7
    }
  }

  // 处理请假申请
  const handleLeaveRequest = (leaveInfo: LeaveInfo) => {
    setLeaveList(prev => [...prev, leaveInfo])
    
    // 重新计算调整建议
    const newWorkloads = calculateTeamWorkloads(positionGroups, [...leaveList, leaveInfo])
    const newSuggestions = generateAdjustmentSuggestions(positionGroups, [...leaveList, leaveInfo], newWorkloads)
    
    setTeamWorkloads(newWorkloads)
    setAdjustmentSuggestions(newSuggestions)
    
    toast.success(`已处理${leaveInfo.姓名}的请假申请，生成了${newSuggestions.length}条调整建议`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">按岗位排班</h1>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-md">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">{formatDate(currentDate)}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              发布
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              数据上传
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              排班视图
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              效果评价
            </TabsTrigger>
            <TabsTrigger value="adjustment" className="flex items-center gap-2">
              <UserMinus className="h-4 w-4" />
              请假调整
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 文件上传区域 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    数据文件上传
                  </CardTitle>
                  <CardDescription>
                    请上传所需的Excel文件进行排班分析
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sku-file">基础箱型库.xlsx</Label>
                    <div className="mt-1">
                      <Input
                        id="sku-file"
                        type="file"
                        accept=".xlsx"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setSkuFile)}
                        className="cursor-pointer"
                      />
                      {skuFile && (
                        <Badge variant="secondary" className="mt-2">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {skuFile.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="position-file">岗位图谱.xlsx</Label>
                    <div className="mt-1">
                      <Input
                        id="position-file"
                        type="file"
                        accept=".xlsx"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setPositionFile)}
                        className="cursor-pointer"
                      />
                      {positionFile && (
                        <Badge variant="secondary" className="mt-2">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {positionFile.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="skill-file">技能矩阵.xlsx</Label>
                    <div className="mt-1">
                      <Input
                        id="skill-file"
                        type="file"
                        accept=".xlsx"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setSkillFile)}
                        className="cursor-pointer"
                      />
                      {skillFile && (
                        <Badge variant="secondary" className="mt-2">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {skillFile.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="product-code">产品SKU</Label>
                    <Input
                      id="product-code"
                      type="text"
                      placeholder="如：C1B010000036"
                      value={productCode}
                      onChange={(e) => setProductCode(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={handleScheduling}
                      disabled={isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          处理中...
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4 mr-2" />
                          今日排班
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleWeeklyScheduling}
                      disabled={isProcessing}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          处理中...
                        </>
                      ) : (
                        <>
                          <CalendarDays className="h-4 w-4 mr-2" />
                          一周排班
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 排班统计 */}
              <Card>
                <CardHeader>
                  <CardTitle>排班统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {viewMode === 'day' ? (
                      <>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm text-gray-600">总岗位数</span>
                          <span className="text-lg font-semibold text-blue-600">{positionGroups.length}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="text-sm text-gray-600">已排人数</span>
                          <span className="text-lg font-semibold text-green-600">{schedulingResults.length}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                          <span className="text-sm text-gray-600">需求人数</span>
                          <span className="text-lg font-semibold text-orange-600">
                            {positionGroups.reduce((sum, group) => sum + group.需求人数, 0)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <span className="text-sm text-gray-600">一周总排班</span>
                          <span className="text-lg font-semibold text-purple-600">
                            {Object.values(weeklySchedule).reduce((sum, day) => sum + day.schedulingResults.length, 0)} 人次
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm text-gray-600">已排天数</span>
                          <span className="text-lg font-semibold text-blue-600">
                            {Object.keys(weeklySchedule).length} / 7 天
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="text-sm text-gray-600">平均每日</span>
                          <span className="text-lg font-semibold text-green-600">
                            {Object.keys(weeklySchedule).length > 0 
                              ? Math.round(Object.values(weeklySchedule).reduce((sum, day) => sum + day.schedulingResults.length, 0) / Object.keys(weeklySchedule).length)
                              : 0
                            } 人
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 性能评价指标 */}
              {performanceMetrics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      排班效果评价
                    </CardTitle>
                    <CardDescription>人岗匹配度与工时利用率分析</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* 人岗匹配度 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <UserCheck className="h-4 w-4 text-blue-600" />
                          <h4 className="font-medium text-gray-900">人岗匹配度</h4>
                          <FormulaTooltip 
                            title="人岗匹配度计算公式" 
                            formula="总体匹配度 = 满足要求总人数 / 总人数 × 100%；岗位匹配度 = 满足要求人数 / 岗位总人数 × 100%"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm text-gray-600">总体匹配度</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-blue-600">
                                {performanceMetrics.人岗匹配度.总体匹配度.toFixed(1)}%
                              </span>
                              <Badge 
                                variant={performanceMetrics.人岗匹配度.总体匹配度 >= 90 ? 'default' : 
                                       performanceMetrics.人岗匹配度.总体匹配度 >= 80 ? 'secondary' : 'destructive'}
                              >
                                {performanceMetrics.人岗匹配度.总体匹配度 >= 90 ? '优秀' : 
                                 performanceMetrics.人岗匹配度.总体匹配度 >= 80 ? '良好' : '需改进'}
                              </Badge>
                            </div>
                          </div>
                          
                          {performanceMetrics.人岗匹配度.培养计划.length > 0 && (
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="h-4 w-4 text-amber-600" />
                                <span className="text-sm font-medium text-amber-800">
                                  需培养人员：{performanceMetrics.人岗匹配度.培养计划.reduce((sum, plan) => sum + plan.需培养人员.length, 0)}人
                                </span>
                              </div>
                              <div className="space-y-1">
                                {performanceMetrics.人岗匹配度.培养计划.slice(0, 3).map((plan, index) => (
                                  <div key={index} className="text-xs text-amber-700">
                                    • {plan.岗位编码}: {plan.需培养人员.length}人 ({plan.优先级}优先级)
                                  </div>
                                ))}
                                {performanceMetrics.人岗匹配度.培养计划.length > 3 && (
                                  <div className="text-xs text-amber-600">
                                    ...还有{performanceMetrics.人岗匹配度.培养计划.length - 3}个岗位需要培养
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 工时利用率 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-5 w-5 text-green-600" />
                          <h4 className="font-medium text-gray-900">工时利用率</h4>
                          <FormulaTooltip 
                            title="工时利用率计算公式" 
                            formula="总体利用率 = (实际配置工时 / 需求工时) × 100%；实际配置工时 = 已排人数 × 标准工时；需求工时 = 需求人数 × 标准工时"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-sm text-gray-600">总体利用率</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-green-600">
                                {performanceMetrics.工时利用率.总体利用率.toFixed(1)}%
                              </span>
                              <Badge 
                                variant={performanceMetrics.工时利用率.总体利用率 >= 85 ? 'default' : 'destructive'}
                              >
                                {performanceMetrics.工时利用率.总体利用率 >= 85 ? '达标' : '低效'}
                              </Badge>
                            </div>
                          </div>
                          
                          {performanceMetrics.工时利用率.低效岗位.length > 0 && (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-800">
                                  低效岗位：{performanceMetrics.工时利用率.低效岗位.length}个
                                </span>
                              </div>
                              <div className="space-y-1">
                                {performanceMetrics.工时利用率.低效岗位.slice(0, 3).map((position, index) => (
                                  <div key={index} className="text-xs text-red-700">
                                    • {position.岗位编码}: {position.当前利用率.toFixed(1)}% ({position.影响原因.join(', ')})
                                  </div>
                                ))}
                                {performanceMetrics.工时利用率.低效岗位.length > 3 && (
                                  <div className="text-xs text-red-600">
                                    ...还有{performanceMetrics.工时利用率.低效岗位.length - 3}个低效岗位
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {performanceMetrics.工时利用率.优化方案.length > 0 && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Wrench className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">优化建议</span>
                              </div>
                              <div className="space-y-1">
                                {performanceMetrics.工时利用率.优化方案.slice(0, 2).map((suggestion, index) => (
                                  <div key={index} className="text-xs text-blue-700">
                                    • {suggestion.岗位编码}: {suggestion.具体建议} ({suggestion.实施难度})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            {/* 视图切换和导航 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    日视图
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={navigateToWeek}
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    周视图
                  </Button>
                </div>
                
                {viewMode === 'week' && (
                  <div className="text-sm text-gray-500">
                    {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  筛选
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                      !
                    </Badge>
                  )}
                </Button>
                {((viewMode === 'day' && schedulingResults.length > 0) || 
                  (viewMode === 'week' && Object.keys(weeklySchedule).length > 0)) && (
                  <Button onClick={downloadResults} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    导出Excel
                  </Button>
                )}
              </div>
            </div>

            {/* 周视图 - 日期选择器 */}
            {viewMode === 'week' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">一周排班概览</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDates.map((date, index) => {
                      const dateStr = formatDate(date)
                      const daySchedule = weeklySchedule[dateStr]
                      const isSelected = selectedWeekDay === dateStr
                      const hasSchedule = !!daySchedule
                      
                      return (
                        <div key={index} className="text-center">
                          <div className="text-xs text-gray-500 mb-1">{formatWeekday(date)}</div>
                          <Button
                            variant={isSelected ? 'default' : hasSchedule ? 'secondary' : 'outline'}
                            size="sm"
                            className={`w-full h-16 flex flex-col items-center justify-center ${
                              hasSchedule && !isSelected ? 'bg-green-50 border-green-200 text-green-700' : ''
                            }`}
                            onClick={() => setSelectedWeekDay(isSelected ? '' : dateStr)}
                          >
                            <div className="text-sm font-medium">{date.getDate()}</div>
                            {hasSchedule && (
                              <div className="text-xs">
                                {daySchedule.schedulingResults.length}人
                              </div>
                            )}
                          </Button>
                          
                          {hasSchedule && (
                            <div className="mt-2 flex justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => navigateToDay(date)}
                                title="查看详情"
                              >
                                <Search className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  const otherDates = weekDates.filter(d => formatDate(d) !== dateStr)
                                  // 这里可以添加复制到其他日期的逻辑
                                }}
                                title="复制排班"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 筛选面板 */}
            {showFilters && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">筛选条件</CardTitle>
                    <div className="flex items-center gap-2">
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={resetFilters}>
                          <X className="h-4 w-4 mr-1" />
                          清除
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* 搜索框 */}
                    <div>
                      <Label className="text-xs text-gray-500">搜索</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="岗位、姓名、工号..."
                          value={filters.搜索关键词}
                          onChange={(e) => setFilters(prev => ({ ...prev, 搜索关键词: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* 岗位编码筛选 */}
                    <div>
                      <Label className="text-xs text-gray-500">岗位编码</Label>
                      <select
                        value={filters.岗位编码}
                        onChange={(e) => setFilters(prev => ({ ...prev, 岗位编码: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">全部岗位</option>
                        {filterOptions.岗位编码列表.map(code => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                    </div>

                    {/* 工作中心筛选 */}
                    <div>
                      <Label className="text-xs text-gray-500">工作中心</Label>
                      <select
                        value={filters.工作中心}
                        onChange={(e) => setFilters(prev => ({ ...prev, 工作中心: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">全部中心</option>
                        {filterOptions.工作中心列表.map(center => (
                          <option key={center} value={center}>{center}</option>
                        ))}
                      </select>
                    </div>

                    {/* 班组筛选 */}
                    <div>
                      <Label className="text-xs text-gray-500">班组</Label>
                      <select
                        value={filters.班组}
                        onChange={(e) => setFilters(prev => ({ ...prev, 班组: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">全部班组</option>
                        {filterOptions.班组列表.map(team => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                    </div>

                    {/* 状态筛选 */}
                    <div>
                      <Label className="text-xs text-gray-500">排班状态</Label>
                      <select
                        value={filters.状态}
                        onChange={(e) => setFilters(prev => ({ ...prev, 状态: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="全部">全部状态</option>
                        <option value="已满">已满员</option>
                        <option value="缺员">缺员</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 排班结果表格 */}
            {(viewMode === 'day' && positionGroups.length > 0) || 
             (viewMode === 'week' && selectedWeekDay && weeklySchedule[selectedWeekDay]) ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          岗位信息
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          技能
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          需求
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          已排人员
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPositionGroups.map((group, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{group.岗位编码}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {group.工作中心}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline" className="text-xs">
                              {group.技能等级}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {group.已排人数}/{group.需求人数}
                              </span>
                              <Badge 
                                variant={group.已排人数 >= group.需求人数 ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {group.已排人数 >= group.需求人数 ? "已满" : `缺${group.需求人数 - group.已排人数}人`}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {group.员工列表.map((worker, workerIndex) => (
                                <div 
                                  key={workerIndex} 
                                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-xs"
                                >
                                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                                    {worker.姓名.charAt(0)}
                                  </div>
                                  <span className="font-medium">{worker.姓名}</span>
                                  <span className="text-gray-500">({worker.工号})</span>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                    <span>{worker.技能等级}</span>
                                  </div>
                                </div>
                              ))}
                              {group.已排人数 < group.需求人数 && (
                                <div className="inline-flex items-center gap-1 px-3 py-1 border-2 border-dashed border-gray-300 rounded-full text-xs text-gray-400">
                                  <Plus className="h-3 w-3" />
                                  <span>还需{group.需求人数 - group.已排人数}人</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {filteredPositionGroups.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>没有找到符合条件的岗位</p>
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="mt-2">
                      清除筛选条件
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {viewMode === 'week' ? '请选择日期查看排班详情' : '暂无排班结果'}
                </p>
                <p className="text-sm">
                  {viewMode === 'week' ? '点击上方日期卡片查看具体排班' : '请先上传文件并进行排班'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {performanceMetrics ? (
              <div className="space-y-6">
                {/* 总体概况 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                        人岗匹配度分析
                        <FormulaTooltip 
                          title="人岗匹配度计算公式" 
                          formula="总体匹配度 = 满足要求总人数 / 总人数 × 100%；岗位匹配度 = 满足要求人数 / 岗位总人数 × 100%"
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {performanceMetrics.人岗匹配度.总体匹配度.toFixed(1)}%
                        </div>
                        <Badge 
                          variant={performanceMetrics.人岗匹配度.总体匹配度 >= 90 ? 'default' : 
                                 performanceMetrics.人岗匹配度.总体匹配度 >= 80 ? 'secondary' : 'destructive'}
                          className="text-sm"
                        >
                          {performanceMetrics.人岗匹配度.总体匹配度 >= 90 ? '优秀' : 
                           performanceMetrics.人岗匹配度.总体匹配度 >= 80 ? '良好' : '需改进'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>完全匹配岗位</span>
                          <span className="font-medium">
                            {performanceMetrics.人岗匹配度.岗位匹配情况.filter(p => p.匹配状态 === '完全匹配').length}个
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>基本匹配岗位</span>
                          <span className="font-medium">
                            {performanceMetrics.人岗匹配度.岗位匹配情况.filter(p => p.匹配状态 === '基本匹配').length}个
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>需要培养岗位</span>
                          <span className="font-medium text-red-600">
                            {performanceMetrics.人岗匹配度.岗位匹配情况.filter(p => p.匹配状态 === '需要培养').length}个
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-green-600" />
                        工时利用率分析
                        <FormulaTooltip 
                          title="工时利用率计算公式" 
                          formula="总体利用率 = (实际配置工时 / 需求工时) × 100%；实际配置工时 = 已排人数 × 标准工时；需求工时 = 需求人数 × 标准工时"
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {performanceMetrics.工时利用率.总体利用率.toFixed(1)}%
                        </div>
                        <Badge 
                          variant={performanceMetrics.工时利用率.总体利用率 >= 85 ? 'default' : 'destructive'}
                          className="text-sm"
                        >
                          {performanceMetrics.工时利用率.总体利用率 >= 85 ? '达标' : '低效'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>高效岗位</span>
                          <span className="font-medium">
                            {positionGroups.length - performanceMetrics.工时利用率.低效岗位.length}个
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>低效岗位</span>
                          <span className="font-medium text-red-600">
                            {performanceMetrics.工时利用率.低效岗位.length}个
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>优化方案</span>
                          <span className="font-medium">
                            {performanceMetrics.工时利用率.优化方案.length}条建议
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 详细分析表格 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 人岗匹配详情 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">岗位匹配详情</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">岗位编码</th>
                              <th className="text-left py-2">要求技能</th>
                              <th className="text-left py-2">实际技能</th>
                              <th className="text-left py-2 flex items-center gap-1">
                                匹配度
                                <FormulaTooltip 
                                  title="岗位匹配度计算" 
                                  formula="满足要求人数 / 岗位总人数 × 100%"
                                />
                              </th>
                              <th className="text-left py-2">状态</th>
                            </tr>
                          </thead>
                          <tbody>
                            {performanceMetrics.人岗匹配度.岗位匹配情况.map((item, index) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="py-2 font-medium">{item.岗位编码}</td>
                                <td className="py-2">{item.要求技能等级}级</td>
                                <td className="py-2">{(item.平均实际技能 || 0).toFixed(1)}级</td>
                                <td className="py-2">{(item.匹配度 || 0).toFixed(1)}%</td>
                                <td className="py-2">
                                  <Badge 
                                    variant={item.匹配状态 === '完全匹配' ? 'default' : 
                                           item.匹配状态 === '基本匹配' ? 'secondary' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {item.匹配状态}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 工时利用率详情 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">低效岗位详情</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {performanceMetrics.工时利用率.低效岗位.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">岗位编码</th>
                                <th className="text-left py-2 flex items-center gap-1">
                                  当前利用率
                                  <FormulaTooltip 
                                    title="岗位利用率计算" 
                                    formula="(已排人数 × 标准工时) / (需求人数 × 标准工时) × 100%"
                                  />
                                </th>
                                <th className="text-left py-2">影响原因</th>
                              </tr>
                            </thead>
                            <tbody>
                              {performanceMetrics.工时利用率.低效岗位.map((item, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                  <td className="py-2 font-medium">{item.岗位编码}</td>
                                  <td className="py-2 text-red-600">{item.当前利用率.toFixed(1)}%</td>
                                  <td className="py-2 text-xs">{item.影响原因.join(', ')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                          <p>所有岗位工时利用率均已达标</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* 培养计划 */}
                {performanceMetrics.人岗匹配度.培养计划.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        人员培养计划
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {performanceMetrics.人岗匹配度.培养计划.map((plan, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{plan.岗位编码}</h4>
                                <Badge variant={plan.优先级 === '高' ? 'destructive' : plan.优先级 === '中' ? 'secondary' : 'outline'}>
                                  {plan.优先级}优先级
                                </Badge>
                              </div>
                              <span className="text-sm text-gray-500">{plan.工作中心}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {plan.需培养人员.map((person, personIndex) => (
                                <div key={personIndex} className="bg-gray-50 rounded p-3 text-sm">
                                  <div className="font-medium">{person.姓名} ({person.工号})</div>
                                  <div className="text-gray-600 mt-1">
                                    当前：{person.当前技能}级 → 目标：{person.目标技能}级
                                  </div>
                                  <div className="text-gray-600">预计时间：{person.预计时间}</div>
                                  <div className="text-xs text-blue-600 mt-1">{person.培养内容}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 优化建议 */}
                {performanceMetrics.工时利用率.优化方案.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        优化建议
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {performanceMetrics.工时利用率.优化方案.map((suggestion, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{suggestion.岗位编码}</span>
                                <Badge variant="outline">{suggestion.建议类型}</Badge>
                              </div>
                              <Badge 
                                variant={suggestion.实施难度 === '容易' ? 'default' : 
                                       suggestion.实施难度 === '中等' ? 'secondary' : 'destructive'}
                              >
                                {suggestion.实施难度}
                              </Badge>
                            </div>
                            <p className="text-gray-700 text-sm mb-1">{suggestion.具体建议}</p>
                            <p className="text-green-600 text-xs">预期效果：{suggestion.预期效果}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">暂无效果评价数据</p>
                <p className="text-sm">请先完成排班后查看效果分析</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('upload')}
                >
                  去排班
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="adjustment" className="space-y-6">
            {positionGroups.length > 0 ? (
              <div className="space-y-6">
                {/* 请假管理 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserMinus className="h-5 w-5" />
                      请假管理
                    </CardTitle>
                    <CardDescription>
                      管理人员请假申请，自动生成调整建议
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{leaveList.length}</div>
                          <div className="text-sm text-gray-500">今日请假人数</div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{adjustmentSuggestions.length}</div>
                          <div className="text-sm text-gray-500">调整建议数</div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {teamWorkloads.reduce((sum, team) => sum + team.可调配人员.length, 0)}
                          </div>
                          <div className="text-sm text-gray-500">可调配人员</div>
                        </div>
                      </Card>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">请假记录</h4>
                      <Button 
                        onClick={() => {
                          // 模拟添加请假
                          const sampleLeave: LeaveInfo = {
                            工号: 'EMP001',
                            姓名: '张三',
                            请假日期: formatDate(currentDate),
                            请假类型: '病假',
                            请假时长: 8,
                            影响岗位: ['ZZ-G190'],
                            紧急程度: '高'
                          }
                          handleLeaveRequest(sampleLeave)
                        }}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        添加请假
                      </Button>
                    </div>

                    {leaveList.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium">员工</th>
                              <th className="text-left py-3 px-4 font-medium">请假类型</th>
                              <th className="text-left py-3 px-4 font-medium">时长</th>
                              <th className="text-left py-3 px-4 font-medium">影响岗位</th>
                              <th className="text-left py-3 px-4 font-medium">紧急程度</th>
                              <th className="text-left py-3 px-4 font-medium">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaveList.map((leave, index) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <div>
                                    <div className="font-medium">{leave.姓名}</div>
                                    <div className="text-gray-500 text-xs">{leave.工号}</div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">{leave.请假类型}</td>
                                <td className="py-3 px-4">{leave.请假时长}小时</td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {leave.影响岗位.map((position, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {position}
                                      </Badge>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge 
                                    variant={leave.紧急程度 === '高' ? 'destructive' : 
                                           leave.紧急程度 === '中' ? 'secondary' : 'outline'}
                                    className="text-xs"
                                  >
                                    {leave.紧急程度}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setLeaveList(prev => prev.filter((_, i) => i !== index))
                                      // 重新计算调整建议
                                      const newLeaves = leaveList.filter((_, i) => i !== index)
                                      const newWorkloads = calculateTeamWorkloads(positionGroups, newLeaves)
                                      const newSuggestions = generateAdjustmentSuggestions(positionGroups, newLeaves, newWorkloads)
                                      setTeamWorkloads(newWorkloads)
                                      setAdjustmentSuggestions(newSuggestions)
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <UserMinus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>暂无请假记录</p>
                        <p className="text-sm">点击"添加请假"按钮测试调整功能</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 班组负荷情况 */}
                {teamWorkloads.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        班组负荷分析
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teamWorkloads.map((team, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">{team.班组}</h4>
                              <Badge 
                                variant={team.负荷率 >= 90 ? 'destructive' : 
                                       team.负荷率 >= 70 ? 'secondary' : 'default'}
                              >
                                {team.负荷率.toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>总人数：</span>
                                <span>{team.总人数}人</span>
                              </div>
                              <div className="flex justify-between">
                                <span>在岗：</span>
                                <span className="text-green-600">{team.在岗人数}人</span>
                              </div>
                              {team.请假人数 > 0 && (
                                <div className="flex justify-between">
                                  <span>请假：</span>
                                  <span className="text-red-600">{team.请假人数}人</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>可调配：</span>
                                <span className="text-blue-600">{team.可调配人员.length}人</span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 调整建议 */}
                {adjustmentSuggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        智能调整建议
                      </CardTitle>
                      <CardDescription>
                        系统基于效率损失最小原则生成的调整方案
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {adjustmentSuggestions.map((suggestion, index) => (
                          <Card key={index} className="p-4 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{suggestion.调整类型}</Badge>
                                <span className="font-medium">{suggestion.原岗位}</span>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="text-sm">优先级 {suggestion.优先级}</span>
                                </div>
                              </div>
                              <Button size="sm">
                                采纳建议
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <h5 className="font-medium mb-2">调整人员</h5>
                                <div className="space-y-2">
                                  {suggestion.调整人员.map((person, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded p-2 text-sm">
                                      <div className="font-medium">{person.姓名} ({person.工号})</div>
                                      <div className="text-gray-600">
                                        {person.当前班组}
                                        {person.目标班组 && ` → ${person.目标班组}`}
                                        <span className="ml-2">技能: {person.技能等级}级</span>
                                      </div>
                                      <div className="text-xs text-blue-600">{person.调整原因}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h5 className="font-medium mb-2">效率影响</h5>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span>原岗位效率损失：</span>
                                      <span className="text-red-600">
                                        {suggestion.效率影响.原岗位效率损失.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>整体效率影响：</span>
                                      <span className={suggestion.效率影响.整体效率影响 > 0 ? 'text-red-600' : 'text-green-600'}>
                                        {suggestion.效率影响.整体效率影响 > 0 ? '+' : ''}
                                        {suggestion.效率影响.整体效率影响.toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h5 className="font-medium mb-2">制造周期影响</h5>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span>预计延误：</span>
                                      <span className="text-orange-600">
                                        {suggestion.制造周期影响.预计延误时间}小时
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>关键路径：</span>
                                      <span>
                                        {suggestion.制造周期影响.关键路径影响 ? (
                                          <AlertOctagon className="h-4 w-4 text-red-600" />
                                        ) : (
                                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border-t pt-3">
                              <p className="text-sm text-gray-700 font-medium">实施建议：</p>
                              <p className="text-sm text-gray-600 mt-1">{suggestion.实施建议}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <AlertOctagon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">暂无排班数据</p>
                <p className="text-sm">请先完成排班后进行请假调整管理</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('upload')}
                >
                  去排班
                </Button>
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
