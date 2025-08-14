'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  Wrench, 
  Target, 
  HelpCircle 
} from 'lucide-react'

interface PerformanceMetrics {
  人岗匹配度: any
  工时利用率: any
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

interface PerformanceAnalysisProps {
  performanceMetrics: PerformanceMetrics | null
  positionGroups: PositionGroup[]
  setActiveTab: (tab: string) => void
}

// 公式提示组件
const FormulaTooltip = ({ title, formula }: { title: string; formula: string }) => (
  <div className="relative inline-block group">
    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-max max-w-sm">
      <div className="font-semibold mb-1">{title}</div>
      <div className="whitespace-nowrap">{formula}</div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
)

export default function PerformanceAnalysis({
  performanceMetrics,
  positionGroups,
  setActiveTab
}: PerformanceAnalysisProps) {
  if (!performanceMetrics) {
    return (
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
    )
  }

  return (
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
                  {performanceMetrics.人岗匹配度.岗位匹配情况.filter((p: any) => p.匹配状态 === '完全匹配').length}个
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>基本匹配岗位</span>
                <span className="font-medium">
                  {performanceMetrics.人岗匹配度.岗位匹配情况.filter((p: any) => p.匹配状态 === '基本匹配').length}个
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>需要培养岗位</span>
                <span className="font-medium text-red-600">
                  {performanceMetrics.人岗匹配度.岗位匹配情况.filter((p: any) => p.匹配状态 === '需要培养').length}个
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
                  {performanceMetrics.人岗匹配度.岗位匹配情况.map((item: any, index: number) => (
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
                    {performanceMetrics.工时利用率.低效岗位.map((item: any, index: number) => (
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
              {performanceMetrics.人岗匹配度.培养计划.map((plan: any, index: number) => (
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
                    {plan.需培养人员.map((person: any, personIndex: number) => (
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
              {performanceMetrics.工时利用率.优化方案.map((suggestion: any, index: number) => (
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
  )
} 