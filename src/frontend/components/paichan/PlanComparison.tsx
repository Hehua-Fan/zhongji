'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, 
  TrendingDown,
  BarChart3,
  Award,
  CheckCircle2,
  RefreshCw,
  Target,
  DollarSign,
  Eye,
  Star,
  Send,
  Sparkles,
  HelpCircle
} from 'lucide-react'

interface CapacityOptimizationPlan {
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

interface MultiPlanProductionResponse {
  baseline_plan: CapacityOptimizationPlan
  optimized_plans: CapacityOptimizationPlan[]
  recommended_plan: CapacityOptimizationPlan
  comparison_metrics: any
}

interface PlanComparisonProps {
  results: MultiPlanProductionResponse | null
  selectedPlan: CapacityOptimizationPlan | null
  setSelectedPlan: (plan: CapacityOptimizationPlan) => void
  setActiveTab: (tab: string) => void
  integrateToScheduling: (plan: CapacityOptimizationPlan) => void
  isIntegratingToScheduling: boolean
  formatCurrency: (amount: number) => string
  formatPercentage: (value: number) => string
}

export default function PlanComparison({
  results,
  selectedPlan,
  setSelectedPlan,
  setActiveTab,
  integrateToScheduling,
  isIntegratingToScheduling,
  formatCurrency,
  formatPercentage
}: PlanComparisonProps) {
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

  const allPlans = [results.baseline_plan, ...results.optimized_plans]
  const minCost = Math.min(...allPlans.map(p => p.total_cost))
  const maxCompletion = Math.max(...allPlans.map(p => p.completion_rate))

  return (
    <div className="space-y-8">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">方案数量</p>
                <p className="text-2xl font-bold text-blue-900">{allPlans.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">最低成本</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(minCost / 1000)}K
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">节省金额</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(results.comparison_metrics?.cost_comparison?.cost_saving ? results.comparison_metrics.cost_comparison.cost_saving / 1000 : 0)}K
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">最高完成率</p>
                <p className="text-2xl font-bold text-purple-900">
                  {(maxCompletion * 100).toFixed(0)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 推荐方案提示 */}
      {results.recommended_plan && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-6 shadow-xl cursor-default">
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-white/10"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white/5"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                  <h3 className="text-xl font-bold text-white">AI智能推荐方案</h3>
                </div>
                <p className="text-emerald-100 text-sm mb-1">
                  <strong className="text-white">{results.recommended_plan.plan_name}</strong>
                </p>
                <p className="text-emerald-100 text-sm">
                  综合成本效益和生产效率分析，为您精选的最优排产方案
                </p>
                                 <div className="mt-3 flex items-center space-x-4 text-emerald-100 text-xs">
                   <span>💰 成本优化 {results.comparison_metrics?.cost_comparison?.saving_percentage ? formatPercentage(results.comparison_metrics.cost_comparison.saving_percentage) : '0%'}</span>
                   <span>📈 效率提升 {results.comparison_metrics?.efficiency_comparison?.improvement ? formatPercentage(results.comparison_metrics.efficiency_comparison.improvement) : '0%'}</span>
                   <span>⏰ 延误减少 {results.comparison_metrics?.delay_comparison?.reduction ? `${results.comparison_metrics.delay_comparison.reduction.toFixed(1)}天` : '0天'}</span>
                 </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Button
                onClick={() => integrateToScheduling(results.recommended_plan)}
                disabled={isIntegratingToScheduling}
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-50 hover:text-green-700 font-bold px-8 py-3 shadow-lg transition-all duration-200 transform hover:scale-105 border-0"
              >
                {isIntegratingToScheduling ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    选择方案中...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    立即采用
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setSelectedPlan(results.recommended_plan)
                  setActiveTab('prod-analysis')
                }}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 font-medium"
              >
                <Eye className="h-4 w-4 mr-2" />
                查看详情
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 方案列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>排产方案对比</CardTitle>
            <CardDescription>比较各方案的成本、效率和完成率</CardDescription>
          </div>
          <Badge variant="outline">
            {allPlans.length} 个方案
          </Badge>
        </CardHeader>
        <CardContent>
          {allPlans.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无方案数据</h3>
              <p className="text-gray-500 mb-4">请重新执行排产计算</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">方案名称</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">类型</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 relative">
                      <div className="flex items-center space-x-1">
                        <span>总成本</span>
                        <div className="relative group">
                          <HelpCircle className="h-4 w-4 text-gray-400 hover:text-blue-600 cursor-help transition-colors duration-200" />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 p-4 bg-black text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 border border-gray-600">
                            <div className="font-bold mb-3 text-blue-300">💰 总成本计算公式</div>
                            <div className="space-y-2">
                              <div className="bg-gray-800 p-2 rounded border-l-2 border-green-500">
                                <div className="font-medium text-green-200">公式：</div>
                                <div className="text-yellow-300">总成本 = 能耗成本 + 人效成本</div>
                              </div>
                              <div className="border-t border-gray-600 pt-2">
                                <div className="font-medium text-green-300 mb-1">💡 成本构成：</div>
                                <div className="text-gray-300 space-y-1">
                                  <div>• 能耗成本：<span className="text-blue-300">能耗 × 1 ¥/kWh</span></div>
                                  <div>• 人效成本：<span className="text-green-300">人效 × 360 ¥/人</span></div>
                                  <div>• 举例：<span className="text-yellow-300">能耗1200kWh + 人效15人 = 1200 + 5400 = 6600元</span></div>
                                </div>
                              </div>
                            </div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-black"></div>
                          </div>
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">完成率</th>
                                         <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 relative">
                       <div className="flex items-center space-x-1">
                         <span>产能利用率</span>
                         <div className="relative group">
                           <HelpCircle className="h-4 w-4 text-gray-400 hover:text-blue-600 cursor-help transition-colors duration-200" />
                           <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-82 p-4 bg-black text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 border border-gray-600">
                             <div className="font-bold mb-3 text-blue-300">📊 产能利用率计算公式</div>
                             <div className="space-y-2">
                               <div className="bg-gray-800 p-2 rounded border-l-2 border-blue-500">
                                 <div className="font-medium text-blue-200">公式：</div>
                                 <div className="text-yellow-300">产能利用率 = 实际产出 ÷ 设计产能 × 100%</div>
                               </div>
                               <div className="border-t border-gray-600 pt-2">
                                 <div className="font-medium text-green-300 mb-1">💡 实际举例：</div>
                                 <div className="text-gray-300 space-y-1">
                                   <div>• 设计产能：<span className="text-blue-300">180件/天</span></div>
                                   <div>• 实际产出：<span className="text-green-300">162件/天</span></div>
                                   <div>• 产能利用率 = <span className="text-yellow-300">162 ÷ 180 × 100% = 90%</span></div>
                                 </div>
                               </div>
                             </div>
                             <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-black"></div>
                           </div>
                         </div>
                       </div>
                     </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">平均延误</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {allPlans
                    .sort((a, b) => a.total_cost - b.total_cost)
                    .map((plan) => {
                      const isSelected = selectedPlan?.plan_id === plan.plan_id
                      const isRecommended = plan.plan_id === results.recommended_plan?.plan_id
                      const isLowestCost = plan.total_cost === minCost
                      
                      return (
                        <tr 
                          key={plan.plan_id} 
                          className={`border-b transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedPlan(plan)}
                          title="点击选择此方案"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className={`p-1.5 rounded-full ${
                                isLowestCost ? 'bg-green-100 text-green-600' :
                                isRecommended ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {isLowestCost ? <Award className="h-3 w-3" /> : 
                                 isRecommended ? <CheckCircle2 className="h-3 w-3" /> :
                                 <BarChart3 className="h-3 w-3" />}
                              </div>
                              <div>
                                <div className="font-medium">{plan.plan_name}</div>
                                {(isLowestCost || isRecommended) && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    {isLowestCost && (
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                        最优成本
                                      </Badge>
                                    )}
                                    {isRecommended && (
                                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                        推荐
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={plan.plan_type === 'baseline' ? 'outline' : 'default'}>
                              {plan.plan_type === 'baseline' ? '基准方案' : '优化方案'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-green-600">
                              {formatCurrency(plan.total_cost)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {formatPercentage(plan.completion_rate)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-purple-600">
                              {formatPercentage(plan.capacity_utilization)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-orange-600">
                              {plan.average_delay.toFixed(1)}天
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isSelected && (
                              <Badge className="bg-blue-500 hover:bg-blue-600">
                                已选择
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPlan(plan)
                                  setActiveTab('prod-analysis')
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
                                title="查看方案详细分析"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                <span className="text-xs">详情</span>
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  integrateToScheduling(plan)
                                }}
                                disabled={isIntegratingToScheduling}
                                size="sm"
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-sm"
                                title="将此方案选择到排班系统"
                              >
                                {isIntegratingToScheduling ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                    <span className="text-xs">选择方案中</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-1" />
                                    <span className="text-xs">选择方案</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 