'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Trash2, 
  Users,
  Calendar,
  Clock,
  Search,
  Filter,
  X,
  UserCheck,
  UserX,
  UserMinus,
  Sun,
  Moon,
  Info,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Target,
  Settings,
  CheckCircle2,
  Star,
  MapPin
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface EmployeeStatusRecord {
  id: string
  employee_id: string
  employee_name: string
  team: string
  status_type: '请假' | '辞职' | '休息'
  shift_type: '白班' | '夜班'
  start_date: string
  end_date?: string
  reason?: string
  created_at?: string
  created_by?: string
}

interface Employee {
  employee_id: string
  name: string
  team: string
}

interface EmployeeStatusFormData {
  employee_id: string
  employee_name: string
  team: string
  status_type: '请假' | '辞职' | '休息'
  shift_type: '白班' | '夜班'
  start_date: string
  end_date: string
  reason: string
}

interface FilterState {
  status_type: string
  shift_type: string
  team: string
  employee_search: string
}

// 新增接口定义
interface PositionGroup {
  岗位编码: string
  岗位名称: string
  工作中心: string
  班组: string
  技能等级: string
  需求人数: number
  已排人数: number
  员工列表: any[]
}

interface TeamWorkload {
  班组: string
  总人数: number
  在岗人数: number
  请假人数: number
  技能分布: { [key: string]: number }
  负荷率: number
  可调配人员: any[]
}

interface AdjustmentSuggestion {
  调整类型: string
  原岗位: string
  调整人员: any[]
  效率影响: any
  制造周期影响: any
  实施建议: string
  优先级: number
}

interface Props {
  positionGroups?: PositionGroup[]
  setActiveTab?: (tab: string) => void
}

export default function EmployeeStatusManagement({ positionGroups = [], setActiveTab }: Props) {
  const [records, setRecords] = useState<EmployeeStatusRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // 新增状态
  const [teamWorkloads, setTeamWorkloads] = useState<TeamWorkload[]>([])
  const [adjustmentSuggestions, setAdjustmentSuggestions] = useState<AdjustmentSuggestion[]>([])
  const [showAnalysisResults, setShowAnalysisResults] = useState(false)
  
  // 新增：人员分析相关状态
  const [workforceAnalysis, setWorkforceAnalysis] = useState<any>(null)
  const [quickStatus, setQuickStatus] = useState<any>(null)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  
  // 表单数据
  const [formData, setFormData] = useState<EmployeeStatusFormData>({
    employee_id: '',
    employee_name: '',
    team: '',
    status_type: '请假',
    shift_type: '白班',
    start_date: '',
    end_date: '',
    reason: ''
  })
  
  // 筛选条件
  const [filters, setFilters] = useState<FilterState>({
    status_type: '全部',
    shift_type: '全部',
    team: '全部',
    employee_search: ''
  })
  
  // 统计数据
  const [summary, setSummary] = useState({
    total_records: 0,
    leave_count: 0,
    resignation_count: 0,
    rest_count: 0,
    day_shift_count: 0,
    night_shift_count: 0
  })
  
  // 筛选选项
  const [filterOptions, setFilterOptions] = useState({
    teams: [] as string[],
    status_types: ['请假', '辞职', '休息'],
    shift_types: ['白班', '夜班']
  })

  // 检查是否有排班数据
  const hasPositionData = positionGroups && positionGroups.length > 0

  // 加载员工状态记录
  const loadRecords = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status_type !== '全部') params.append('status_type', filters.status_type)
      if (filters.shift_type !== '全部') params.append('shift_type', filters.shift_type)
      if (filters.team !== '全部') params.append('team', filters.team)
      if (filters.employee_search) params.append('employee_id', filters.employee_search)
      
      const response = await fetch(`http://localhost:8000/employee-status/list?${params}`)
      if (!response.ok) throw new Error('获取员工状态记录失败')
      
      const data = await response.json()
      setRecords(data.records)
      setSummary(data.summary)
      setFilterOptions(data.filter_options)
      
      // 如果有请假记录且有排班数据，自动进行影响分析
      if (data.records.some((r: EmployeeStatusRecord) => r.status_type === '请假') && positionGroups.length > 0) {
        await performImpactAnalysis(data.records)
      }
    } catch (error) {
      console.error('加载员工状态记录失败:', error)
      toast.error('加载员工状态记录失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 加载员工列表
  const loadEmployees = async () => {
    try {
      const response = await fetch('http://localhost:8000/employee-status/employees')
      if (!response.ok) throw new Error('获取员工列表失败')
      
      const data = await response.json()
      setEmployees(data.employees)
    } catch (error) {
      console.error('加载员工列表失败:', error)
      toast.error('加载员工列表失败')
    }
  }

  // 执行影响分析
  const performImpactAnalysis = async (statusRecords?: EmployeeStatusRecord[]) => {
    if (positionGroups.length === 0) {
      toast.error('暂无排班数据，无法进行影响分析')
      return
    }

    setIsAnalyzing(true)
    try {
      // 转换请假记录格式
      const currentRecords = statusRecords || records
      const leaveRecords = currentRecords
        .filter(r => r.status_type === '请假')
        .map(r => ({
          工号: r.employee_id,
          姓名: r.employee_name,
          请假日期: r.start_date,
          请假类型: r.reason || '请假',
          请假时长: 8, // 默认8小时
          影响岗位: [],
          紧急程度: '中'
        }))

      if (leaveRecords.length === 0) {
        setTeamWorkloads([])
        setAdjustmentSuggestions([])
        setShowAnalysisResults(false)
        return
      }

      // 调用后端分析接口
      const response = await fetch('http://localhost:8000/adjustment/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          groups: positionGroups,
          leaves: leaveRecords,
          skill_data: [], // 可以后续集成技能数据
          current_date: new Date().toISOString().split('T')[0]
        })
      })

      if (!response.ok) throw new Error('影响分析失败')

      const result = await response.json()
      setTeamWorkloads(result.team_workloads || [])
      setAdjustmentSuggestions(result.adjustment_suggestions || [])
      setShowAnalysisResults(true)
      
      toast.success(`已完成 ${leaveRecords.length} 个请假申请的影响分析`)
    } catch (error) {
      console.error('影响分析失败:', error)
      toast.error('影响分析失败')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 新增：加载人员分析数据
  const loadWorkforceAnalysis = async () => {
    if (!hasPositionData) return // 没有排班数据就不加载
    
    setIsLoadingAnalysis(true)
    try {
      // 调用人员分析接口
      const response = await fetch('http://localhost:8000/workforce/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          position_groups: positionGroups,
          employee_status_records: records,
          target_date: new Date().toISOString().split('T')[0]
        })
      })

      if (!response.ok) throw new Error('人员分析失败')

      const analysisData = await response.json()
      setWorkforceAnalysis(analysisData)
      
      // 更新原有数据结构以保持兼容性
      setTeamWorkloads(analysisData.current_status?.map((status: any) => ({
        班组: status.team,
        总人数: status.total_employees,
        在岗人数: status.on_duty_employees,
        请假人数: status.leave_employees,
        技能分布: {},
        负荷率: status.attendance_rate * 100,
        可调配人员: status.available_for_transfer || []
      })) || [])
      
      setAdjustmentSuggestions(analysisData.shift_suggestions?.map((suggestion: any) => ({
        调整类型: suggestion.adjustment_type,
        原岗位: `${suggestion.source_team}-${suggestion.source_shift}`,
        调整人员: [suggestion.affected_employee],
        效率影响: suggestion.efficiency_impact,
        制造周期影响: {
          预计延误时间: 0,
          关键路径影响: false
        },
        实施建议: suggestion.reason,
        优先级: suggestion.priority_level
      })) || [])
      
      setShowAnalysisResults(true)
    } catch (error) {
      console.error('人员分析失败:', error)
      toast.error('人员分析失败')
    } finally {
      setIsLoadingAnalysis(false)
    }
  }

  // 新增：加载快速状态
  const loadQuickStatus = async () => {
    if (!hasPositionData) return // 没有排班数据就不加载
    
    try {
      const response = await fetch('http://localhost:8000/workforce/quick-status')
      if (!response.ok) throw new Error('获取快速状态失败')
      
      const data = await response.json()
      setQuickStatus(data)
    } catch (error) {
      console.error('获取快速状态失败:', error)
    }
  }

  useEffect(() => {
    loadRecords()
    loadEmployees()
    
    // 只有在有排班数据时才加载相关分析数据
    if (hasPositionData) {
      loadQuickStatus()
      loadWorkforceAnalysis()
    }
  }, [filters, positionGroups])

  // 打开添加模态框
  const openAddModal = () => {
    setFormData({
      employee_id: '',
      employee_name: '',
      team: '',
      status_type: '请假',
      shift_type: '白班',
      start_date: '',
      end_date: '',
      reason: ''
    })
    setShowAddModal(true)
  }

  // 员工选择改变
  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(e => e.employee_id === employeeId)
    if (employee) {
      setFormData(prev => ({
        ...prev,
        employee_id: employee.employee_id,
        employee_name: employee.name,
        team: employee.team
      }))
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      // 验证表单
      if (!formData.employee_id || !formData.start_date) {
        toast.error('请填写必要信息')
        return
      }
      
      if (formData.status_type !== '辞职' && !formData.end_date) {
        toast.error('请假和休息需要填写结束日期')
        return
      }

      const response = await fetch('http://localhost:8000/employee-status/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('添加员工状态记录失败')

      const result = await response.json()
      toast.success(result.message)
      setShowAddModal(false)
      loadRecords()
      
      // 如果是请假且有排班数据，自动进行影响分析
      if (formData.status_type === '请假' && positionGroups.length > 0) {
        toast.success('正在分析请假对排班的影响...')
      }
    } catch (error) {
      console.error('提交失败:', error)
      toast.error('添加员工状态记录失败')
    }
  }

  // 删除记录
  const handleDelete = async (recordId: string) => {
    if (!confirm('确定要删除这条记录吗？')) return
    
    try {
      const response = await fetch(`http://localhost:8000/employee-status/${recordId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('删除失败')

      toast.success('删除成功')
      loadRecords()
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    }
  }

  // 获取状态类型图标和样式
  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case '请假': return <UserMinus className="h-4 w-4" />
      case '辞职': return <UserX className="h-4 w-4" />
      case '休息': return <UserCheck className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusVariant = (statusType: string) => {
    switch (statusType) {
      case '请假': return 'secondary'
      case '辞职': return 'destructive'
      case '休息': return 'default'
      default: return 'outline'
    }
  }

  const getShiftIcon = (shiftType: string) => {
    return shiftType === '白班' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
  }

  // 如果没有排班数据，也可以正常使用基本功能
  return (
    <div className="space-y-6">
      {/* 如果没有排班数据，显示提示但不阻止使用 */}
      {!hasPositionData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Info className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-blue-900 font-medium">提示</h3>
              <p className="text-blue-700 text-sm">
                当前没有排班数据，高级分析功能（班组负荷分析、智能调整建议）将不可用。
                {setActiveTab && (
                  <>
                    您可以先
                    <button 
                      onClick={() => setActiveTab('sched-upload')} 
                      className="text-blue-800 underline hover:text-blue-900 mx-1"
                    >
                      完成排班
                    </button>
                    后获得完整功能，或继续使用基础的员工状态管理功能。
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">总记录</p>
                <p className="text-2xl font-bold text-blue-900">{summary.total_records}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">请假</p>
                <p className="text-2xl font-bold text-orange-900">{summary.leave_count}</p>
              </div>
              <UserMinus className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">辞职</p>
                <p className="text-2xl font-bold text-red-900">{summary.resignation_count}</p>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">休息</p>
                <p className="text-2xl font-bold text-green-900">{summary.rest_count}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">白班</p>
                <p className="text-2xl font-bold text-yellow-900">{summary.day_shift_count}</p>
              </div>
              <Sun className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">夜班</p>
                <p className="text-2xl font-bold text-purple-900">{summary.night_shift_count}</p>
              </div>
              <Moon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">员工状态管理</h2>
          <Button onClick={loadRecords} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          {/* 只有在有排班数据且有请假记录时才显示影响分析按钮 */}
          {hasPositionData && summary.leave_count > 0 && (
            <Button 
              onClick={() => performImpactAnalysis()} 
              variant="outline" 
              size="sm"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              {isAnalyzing ? '分析中...' : '影响分析'}
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            筛选
          </Button>
          <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            添加状态
          </Button>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">筛选条件</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-gray-500">搜索员工</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="工号或姓名..."
                    value={filters.employee_search}
                    onChange={(e) => setFilters(prev => ({ ...prev, employee_search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">状态类型</Label>
                <Select value={filters.status_type} onValueChange={(value) => setFilters(prev => ({ ...prev, status_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">全部状态</SelectItem>
                    {filterOptions.status_types.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-500">班次</Label>
                <Select value={filters.shift_type} onValueChange={(value) => setFilters(prev => ({ ...prev, shift_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">全部班次</SelectItem>
                    {filterOptions.shift_types.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-500">班组</Label>
                <Select value={filters.team} onValueChange={(value) => setFilters(prev => ({ ...prev, team: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">全部班组</SelectItem>
                    {filterOptions.teams.map(team => (
                      <SelectItem key={team} value={team}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 状态记录列表 - 移到上方 */}
      <Card>
        <CardHeader>
          <CardTitle>状态记录</CardTitle>
          <CardDescription>员工请假、辞职、休息状态记录</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无状态记录</h3>
              <p className="text-gray-500 mb-4">点击"添加状态"开始记录员工状态</p>
              <Button onClick={openAddModal} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                添加状态
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">员工信息</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">班次</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">备注</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{record.employee_name}</div>
                          <div className="text-sm text-gray-500">
                            {record.employee_id} · {record.team}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusVariant(record.status_type) as any} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(record.status_type)}
                          {record.status_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {getShiftIcon(record.shift_type)}
                          <span className="text-sm">{record.shift_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div>开始: {record.start_date}</div>
                          {record.end_date && (
                            <div className="text-gray-500">结束: {record.end_date}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-40 truncate text-sm text-gray-600" title={record.reason}>
                          {record.reason || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 当前人员在岗情况 - 只有在有排班数据时显示 */}
      {hasPositionData && quickStatus && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Users className="h-5 w-5" />
              <span>当前人员在岗情况</span>
              <Badge variant="outline" className="text-xs">
                {quickStatus.更新时间}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 总体状况 */}
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-gray-900 mb-2">总体状况</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>总人数：</span>
                    <span className="font-medium">{quickStatus.总体状况.总人数}人</span>
                  </div>
                  <div className="flex justify-between">
                    <span>在岗：</span>
                    <span className="text-green-600 font-medium">{quickStatus.总体状况.在岗人数}人</span>
                  </div>
                  <div className="flex justify-between">
                    <span>出勤率：</span>
                    <span className={`font-medium ${quickStatus.总体状况.出勤率 >= 0.8 ? 'text-green-600' : 'text-orange-600'}`}>
                      {(quickStatus.总体状况.出勤率 * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>产能利用率：</span>
                    <span className={`font-medium ${quickStatus.总体状况.产能利用率 >= 0.7 ? 'text-green-600' : 'text-red-600'}`}>
                      {(quickStatus.总体状况.产能利用率 * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 班组状况 */}
              {quickStatus.班组状况.map((team: any, index: number) => (
                <div key={index} className="bg-white rounded-lg p-4 border">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center justify-between">
                    {team.班组}
                    <Badge variant={team.状态 === '正常' ? 'default' : 'destructive'} className="text-xs">
                      {team.状态}
                    </Badge>
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Sun className="h-3 w-3 mr-1" />
                        白班：
                      </span>
                      <span className="font-medium">{team.白班在岗}人</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Moon className="h-3 w-3 mr-1" />
                        夜班：
                      </span>
                      <span className="font-medium">{team.夜班在岗}人</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      总计: {team.白班在岗 + team.夜班在岗}人在岗
                    </div>
                  </div>
                </div>
              ))}

              {/* 调配建议 */}
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Settings className="h-4 w-4 mr-1" />
                  调配建议
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>待处理：</span>
                    <span className="font-medium text-blue-600">{quickStatus.调配建议数}个</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {quickStatus.紧急情况?.length > 0 ? (
                      <div className="text-red-600">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        有{quickStatus.紧急情况.length}个紧急情况
                      </div>
                    ) : (
                      <div className="text-green-600">
                        <CheckCircle2 className="h-3 w-3 inline mr-1" />
                        暂无紧急情况
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => loadWorkforceAnalysis()}
                    disabled={isLoadingAnalysis}
                  >
                    {isLoadingAnalysis ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    更新分析
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 班组负荷分析 - 移到下方 */}
      {hasPositionData && showAnalysisResults && teamWorkloads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>班组负荷分析</span>
            </CardTitle>
            <CardDescription>各班组的人员配置和负荷情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamWorkloads.map((team, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow">
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
                      <span className="font-medium">{team.总人数}人</span>
                    </div>
                    <div className="flex justify-between">
                      <span>在岗：</span>
                      <span className="text-green-600 font-medium">{team.在岗人数}人</span>
                    </div>
                    {team.请假人数 > 0 && (
                      <div className="flex justify-between">
                        <span>请假：</span>
                        <span className="text-red-600 font-medium">{team.请假人数}人</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>可调配：</span>
                      <span className="text-blue-600 font-medium">{team.可调配人员.length}人</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 智能调整建议 */}
      {hasPositionData && showAnalysisResults && adjustmentSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>智能调整建议</span>
              <Badge variant="outline" className="text-xs">
                {adjustmentSuggestions.length}个建议
              </Badge>
            </CardTitle>
            <CardDescription>
              系统基于当前人员状况和效率损失最小原则生成的班次调整方案
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adjustmentSuggestions.map((suggestion, index) => (
                <Card key={index} className="p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{suggestion.调整类型}</Badge>
                      <span className="font-medium">{suggestion.原岗位}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm">优先级 {suggestion.优先级}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" className="text-blue-600 border-blue-200">
                        查看详情
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        采纳建议
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="font-medium mb-2 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        调整人员
                      </h5>
                      <div className="space-y-2">
                        {suggestion.调整人员 && suggestion.调整人员.length > 0 ? (
                          suggestion.调整人员.map((person: any, idx: number) => (
                            <div key={`person-${index}-${idx}`} className="bg-gray-50 rounded p-3 text-sm">
                              <div className="font-medium">{person?.姓名 || '未知'} ({person?.工号 || '无'})</div>
                              <div className="text-gray-600">
                                {person?.当前班组 || '未知班组'}
                                {person?.目标班组 && ` → ${person.目标班组}`}
                                <span className="ml-2">技能: {person?.技能等级 || 0}级</span>
                              </div>
                              <div className="text-xs text-blue-600">{person?.调整原因 || '暂无说明'}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 text-sm">暂无调整人员信息</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium mb-2 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          效率影响
                        </h5>
                        <div className="space-y-1 text-sm">
                          {suggestion.效率影响 && typeof suggestion.效率影响 === 'object' ? (
                            Object.entries(suggestion.效率影响).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex justify-between">
                                <span>{key}：</span>
                                <span className={
                                  (value || 0) > 0 ? 'text-green-600 font-medium' : 
                                  (value || 0) < 0 ? 'text-red-600 font-medium' : 'text-gray-600'
                                }>
                                  {(value || 0) > 0 ? '+' : ''}{(value || 0).toFixed ? (value || 0).toFixed(1) : (value || 0)}%
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-500 text-sm">效率影响数据不可用</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          实施信息
                        </h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>实施难度：</span>
                            <Badge variant={
                              (workforceAnalysis?.shift_suggestions?.[index]?.implementation_difficulty || '中') === '低' ? 'default' :
                              (workforceAnalysis?.shift_suggestions?.[index]?.implementation_difficulty || '中') === '中' ? 'secondary' : 'destructive'
                            }>
                              {workforceAnalysis?.shift_suggestions?.[index]?.implementation_difficulty || '中'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>预计时间：</span>
                            <span className="font-medium">
                              {workforceAnalysis?.shift_suggestions?.[index]?.estimated_time || '2小时'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>需要审批：</span>
                            <span>
                              {(workforceAnalysis?.shift_suggestions?.[index]?.approval_required ?? true) ? (
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
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
                    <p className="text-sm text-gray-700 font-medium flex items-center">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      实施建议：
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.实施建议}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* 预警通知 */}
            {workforceAnalysis?.alert_notifications && workforceAnalysis.alert_notifications.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />
                  预警通知
                </h4>
                <div className="space-y-2">
                  {workforceAnalysis.alert_notifications.map((alert: any, index: number) => (
                    <div key={index} className={`p-3 rounded border-l-4 ${
                      alert.级别 === '高' ? 'bg-red-50 border-red-500' : 
                      alert.级别 === '中' ? 'bg-orange-50 border-orange-500' : 
                      'bg-blue-50 border-blue-500'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{alert.内容}</div>
                          <div className="text-xs text-gray-600 mt-1">{alert.建议}</div>
                        </div>
                        <div className="text-xs text-gray-500">{alert.时间}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 添加状态模态框 */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">添加员工状态</DialogTitle>
            <DialogDescription>
              记录员工的请假、辞职、休息状态
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">选择员工 *</Label>
                <Select value={formData.employee_id} onValueChange={handleEmployeeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择员工" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.employee_id} value={employee.employee_id}>
                        {employee.name} ({employee.employee_id}) - {employee.team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status_type">状态类型 *</Label>
                <Select value={formData.status_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="请假">请假</SelectItem>
                    <SelectItem value="辞职">辞职</SelectItem>
                    <SelectItem value="休息">休息</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift_type">班次 *</Label>
                <Select value={formData.shift_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, shift_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="白班">白班</SelectItem>
                    <SelectItem value="夜班">夜班</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">开始日期 *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              {formData.status_type !== '辞职' && (
                <div className="space-y-2">
                  <Label htmlFor="end_date">结束日期 *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">备注说明</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="请输入备注说明..."
                rows={3}
              />
            </div>

            {/* 信息预览 */}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="font-medium mb-1">状态预览</div>
                <div className="text-sm space-y-1">
                  <p>员工: {formData.employee_name || '未选择'} ({formData.employee_id || '未选择'})</p>
                  <p>班组: {formData.team || '未选择'}</p>
                  <p>状态: {formData.status_type} - {formData.shift_type}</p>
                  {formData.start_date && (
                    <p>时间: {formData.start_date} {formData.end_date ? `至 ${formData.end_date}` : ''}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              添加状态
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 