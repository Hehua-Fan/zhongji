'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  UserMinus, 
  Users, 
  RefreshCw, 
  AlertOctagon, 
  Plus, 
  X, 
  Star, 
  CheckCircle2, 
  AlertTriangle 
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
  formatDate,
  setActiveTab
}: LeaveAdjustmentProps) {
  
  const handleAddLeave = () => {
    // 模拟添加请假
    const sampleLeave: LeaveInfo = {
      工号: 'EMP001',
      姓名: '张三',
      请假日期: formatDate(new Date()),
      请假类型: '病假',
      请假时长: 8,
      影响岗位: ['ZZ-G190'],
      紧急程度: '高'
    }
    handleLeaveRequest(sampleLeave)
  }

  const handleDeleteLeave = (index: number) => {
    setLeaveList(prev => prev.filter((_, i) => i !== index))
    toast.success('已删除请假记录')
  }

  if (positionGroups.length === 0) {
    return (
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
    )
  }

  return (
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
              onClick={handleAddLeave}
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
                          onClick={() => handleDeleteLeave(index)}
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
  )
} 