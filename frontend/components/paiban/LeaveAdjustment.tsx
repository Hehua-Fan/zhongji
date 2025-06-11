'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  UserMinus, 
  Users, 
  RefreshCw, 
  AlertOctagon, 
  Plus, 
  X, 
  Star, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  Clock,
  Edit,
  Trash2,
  TrendingUp,
  Target,
  Settings
} from 'lucide-react'
import toast from 'react-hot-toast'

interface LeaveInfo {
  工号: string
  姓名: string
  请假日期: string
  请假类型: string
  请假时长: number
  影响岗位: string[]
  紧急程度: string
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

interface TeamWorkload {
  班组: string
  总人数: number
  在岗人数: number
  请假人数: number
  技能分布: { [key: string]: number }
  负荷率: number
  可调配人员: any[]
}

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

interface LeaveAdjustmentProps {
  positionGroups: PositionGroup[]
  leaveList: LeaveInfo[]
  setLeaveList: React.Dispatch<React.SetStateAction<LeaveInfo[]>>
  adjustmentSuggestions: AdjustmentSuggestion[]
  teamWorkloads: TeamWorkload[]
  handleLeaveRequest: (leaveInfo: LeaveInfo) => void
  generateAdjustmentSolutions: () => void
  isProcessing: boolean
  formatDate: (date: Date) => string
  setActiveTab: (tab: string) => void
}

export default function LeaveAdjustment({
  positionGroups,
  leaveList,
  setLeaveList,
  adjustmentSuggestions,
  teamWorkloads,
  handleLeaveRequest,
  generateAdjustmentSolutions,
  isProcessing,
  formatDate,
  setActiveTab
}: LeaveAdjustmentProps) {
  // Modal相关状态
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<LeaveInfo>({
    工号: '',
    姓名: '',
    请假日期: new Date().toISOString().split('T')[0],
    请假类型: '病假',
    请假时长: 8,
    影响岗位: [],
    紧急程度: '中'
  })
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  // 获取所有可用员工（从岗位组中提取，去重）
  const availableEmployees = Array.from(
    new Map(
      positionGroups.flatMap(group => 
        group.员工列表.map(emp => ({
          工号: emp.工号 || '',
          姓名: emp.姓名 || '',
          岗位编码: group.岗位编码,
          班组: emp.班组 || group.班组
        }))
      ).map(emp => [emp.工号, emp])
    ).values()
  ).filter(emp => emp.工号.trim() !== '')

  // 获取所有岗位编码
  const availablePositions = [...new Set(positionGroups.map(group => group.岗位编码))]

  // 打开添加请假modal
  const openAddModal = () => {
    setIsEditing(false)
    setEditingIndex(null)
    setFormData({
      工号: '',
      姓名: '',
      请假日期: new Date().toISOString().split('T')[0],
      请假类型: '病假',
      请假时长: 8,
      影响岗位: [],
      紧急程度: '中'
    })
    setFormErrors({})
    setShowModal(true)
  }

  // 打开编辑请假modal
  const openEditModal = (leave: LeaveInfo, index: number) => {
    setIsEditing(true)
    setEditingIndex(index)
    setFormData({ ...leave })
    setFormErrors({})
    setShowModal(true)
  }

  // 关闭modal
  const closeModal = () => {
    setShowModal(false)
    setIsEditing(false)
    setEditingIndex(null)
    setFormData({
      工号: '',
      姓名: '',
      请假日期: new Date().toISOString().split('T')[0],
      请假类型: '病假',
      请假时长: 8,
      影响岗位: [],
      紧急程度: '中'
    })
    setFormErrors({})
  }

  // 表单验证
  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!formData.工号.trim()) {
      errors.工号 = '工号不能为空'
    }
    if (!formData.姓名.trim()) {
      errors.姓名 = '姓名不能为空'
    }
    if (!formData.请假日期) {
      errors.请假日期 = '请假日期不能为空'
    }
    if (formData.请假时长 <= 0) {
      errors.请假时长 = '请假时长必须大于0'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 提交表单
  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    if (isEditing && editingIndex !== null) {
      // 更新现有请假记录
      const updatedLeaves = [...leaveList]
      updatedLeaves[editingIndex] = formData
      setLeaveList(updatedLeaves)
      toast.success('请假记录已更新')
    } else {
      // 添加新请假记录
      handleLeaveRequest(formData)
      toast.success('请假申请已提交，正在生成调整建议...')
    }
    
    closeModal()
  }

  // 删除请假记录
  const handleDeleteLeave = (index: number) => {
    setLeaveList(prev => prev.filter((_, i) => i !== index))
    toast.success('已删除请假记录')
  }

  // 员工选择改变时更新表单
  const handleEmployeeChange = (empId: string) => {
    const employee = availableEmployees.find(emp => emp.工号 === empId)
    if (employee) {
      setFormData(prev => ({
        ...prev,
        工号: employee.工号,
        姓名: employee.姓名,
        影响岗位: [employee.岗位编码]
      }))
    }
  }

  // 更新表单数据
  const updateFormData = (field: keyof LeaveInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 清除对应字段的错误
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // 获取紧急程度颜色
  const getUrgencyVariant = (urgency: string) => {
    switch (urgency) {
      case '高': return 'destructive'
      case '中': return 'secondary'
      case '低': return 'outline'
      default: return 'outline'
    }
  }

  // 获取请假类型颜色
  const getLeaveTypeVariant = (type: string) => {
    switch (type) {
      case '病假': return 'destructive'
      case '事假': return 'secondary'
      case '年假': return 'default'
      case '调休': return 'outline'
      default: return 'outline'
    }
  }

  if (positionGroups.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertOctagon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无排班数据</h3>
        <p className="text-gray-500 mb-6">请先完成排班后进行请假调整管理</p>
        <Button onClick={() => setActiveTab('sched-upload')} className="bg-blue-600 hover:bg-blue-700">
          去排班
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">今日请假</p>
                <p className="text-2xl font-bold text-blue-900">{leaveList.length}</p>
              </div>
              <UserMinus className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">可调配人员</p>
                <p className="text-2xl font-bold text-green-900">
                  {teamWorkloads.reduce((sum, team) => sum + team.可调配人员.length, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">调整建议</p>
                <p className="text-2xl font-bold text-orange-900">{adjustmentSuggestions.length}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">班组数量</p>
                <p className="text-2xl font-bold text-purple-900">{teamWorkloads.length}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 请假管理 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <UserMinus className="h-5 w-5 text-primary" />
              <span>请假管理</span>
            </CardTitle>
            <CardDescription>管理人员请假申请，自动生成调整建议</CardDescription>
          </div>
          <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            添加请假
          </Button>
        </CardHeader>
        <CardContent>
          {leaveList.length === 0 ? (
            <div className="text-center py-12">
              <UserMinus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无请假记录</h3>
              <p className="text-gray-500 mb-4">点击"添加请假"按钮创建第一个请假申请</p>
              <Button onClick={openAddModal} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                添加请假
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">员工信息</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">请假类型</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">请假日期</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">时长</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">影响岗位</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">紧急程度</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveList.map((leave, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{leave.姓名}</div>
                          <div className="text-gray-500 text-sm">{leave.工号}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getLeaveTypeVariant(leave.请假类型)}>
                          {leave.请假类型}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{leave.请假日期}</td>
                      <td className="px-4 py-3">{leave.请假时长}小时</td>
                                             <td className="px-4 py-3">
                         <div className="flex flex-wrap gap-1">
                           {leave.影响岗位.map((position, idx) => (
                             <Badge key={`table-position-${index}-${idx}`} variant="outline" className="text-xs">
                               {position}
                             </Badge>
                           ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getUrgencyVariant(leave.紧急程度)}>
                          {leave.紧急程度}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(leave, index)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLeave(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分析和解决方案 */}
      {leaveList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              <span>请假影响分析</span>
            </CardTitle>
            <CardDescription>
              基于当前请假情况，生成智能调整建议和解决方案
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  准备分析 {leaveList.length} 个请假申请
                </h3>
                <p className="text-blue-700 text-sm">
                  系统将综合分析所有请假对排班的影响，并提供最优的人员调配方案
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {leaveList.map((leave, index) => (
                    <Badge key={index} variant="outline" className="bg-white text-blue-700">
                      {leave.姓名} - {leave.请假类型}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                onClick={generateAdjustmentSolutions}
                disabled={isProcessing}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-3 shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Settings className="h-5 w-5 mr-2" />
                    开始解决方案
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 班组负荷情况 */}
      {teamWorkloads.length > 0 && (
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

      {/* 调整建议 */}
      {adjustmentSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>智能调整建议</span>
            </CardTitle>
            <CardDescription>
              系统基于效率损失最小原则生成的调整方案
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
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      采纳建议
                    </Button>
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
                          <div className="flex justify-between">
                            <span>原岗位效率损失：</span>
                            <span className="text-red-600 font-medium">
                              {suggestion.效率影响?.原岗位效率损失?.toFixed(1) || '0.0'}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>整体效率影响：</span>
                            <span className={
                              (suggestion.效率影响?.整体效率影响 || 0) > 0 ? 'text-red-600' : 'text-green-600'
                            }>
                              {(suggestion.效率影响?.整体效率影响 || 0) > 0 ? '+' : ''}
                              {suggestion.效率影响?.整体效率影响?.toFixed(1) || '0.0'}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          制造周期影响
                        </h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>预计延误：</span>
                            <span className="text-orange-600 font-medium">
                              {suggestion.制造周期影响?.预计延误时间 || 0}小时
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>关键路径：</span>
                            <span>
                              {suggestion.制造周期影响?.关键路径影响 ? (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
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
          </CardContent>
        </Card>
      )}

      {/* Modal for Adding/Editing Leave */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isEditing ? '编辑请假申请' : '添加请假申请'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? '修改请假申请信息' : '填写请假申请详细信息'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* 员工选择 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">选择员工 *</Label>
                <Select 
                  value={formData.工号} 
                  onValueChange={handleEmployeeChange}
                  disabled={isEditing}
                >
                  <SelectTrigger className={formErrors.工号 ? 'border-red-500' : ''}>
                    <SelectValue placeholder="选择员工" />
                  </SelectTrigger>
                                     <SelectContent>
                     {availableEmployees.map((emp, empIndex) => (
                       <SelectItem key={`${emp.工号}-${empIndex}`} value={emp.工号}>
                         {emp.姓名} ({emp.工号}) - {emp.班组}
                       </SelectItem>
                     ))}
                  </SelectContent>
                </Select>
                {formErrors.工号 && (
                  <p className="text-red-500 text-sm">{formErrors.工号}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leave_type">请假类型 *</Label>
                <Select 
                  value={formData.请假类型} 
                  onValueChange={(value) => updateFormData('请假类型', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择请假类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="病假">病假</SelectItem>
                    <SelectItem value="事假">事假</SelectItem>
                    <SelectItem value="年假">年假</SelectItem>
                    <SelectItem value="调休">调休</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leave_date">请假日期 *</Label>
                <Input
                  id="leave_date"
                  type="date"
                  value={formData.请假日期}
                  onChange={(e) => updateFormData('请假日期', e.target.value)}
                  className={formErrors.请假日期 ? 'border-red-500' : ''}
                />
                {formErrors.请假日期 && (
                  <p className="text-red-500 text-sm">{formErrors.请假日期}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leave_hours">请假时长(小时) *</Label>
                <Input
                  id="leave_hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.请假时长}
                  onChange={(e) => updateFormData('请假时长', parseFloat(e.target.value) || 0)}
                  className={formErrors.请假时长 ? 'border-red-500' : ''}
                />
                {formErrors.请假时长 && (
                  <p className="text-red-500 text-sm">{formErrors.请假时长}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="urgency">紧急程度</Label>
                <Select 
                  value={formData.紧急程度} 
                  onValueChange={(value) => updateFormData('紧急程度', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择紧急程度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="高">高</SelectItem>
                    <SelectItem value="中">中</SelectItem>
                    <SelectItem value="低">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 影响岗位信息 */}
            {formData.影响岗位.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  影响岗位
                </h3>
                                 <div className="flex flex-wrap gap-2">
                   {formData.影响岗位.map((position, posIndex) => (
                     <Badge key={`modal-position-${posIndex}`} variant="outline" className="bg-white">
                       {position}
                     </Badge>
                   ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? '更新申请' : '提交申请'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 