'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Award,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Target,
  Zap,
  Timer
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
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Calculator className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium text-foreground">暂无排产结果</h3>
          <p className="text-muted-foreground">请先在参数设置页面执行排产计算</p>
        </div>
        <Button onClick={() => setActiveTab('prod-params')} className="mt-4">
          <Calculator className="h-4 w-4 mr-2" />
          去设置参数
        </Button>
      </div>
    )
  }

  const allPlans = [results.baseline_plan, ...results.optimized_plans]
  const minCost = Math.min(...allPlans.map(p => p.total_cost))

  return (
    <div className="space-y-6">
      {/* 排产概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">生成方案</p>
                <p className="text-3xl font-bold text-blue-900">{allPlans.length}</p>
                <p className="text-xs text-blue-600 mt-1">个可选方案</p>
              </div>
              <BarChart3 className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">推荐方案</p>
                <p className="text-lg font-bold text-green-900 truncate">
                  {results.recommended_plan?.plan_name}
                </p>
                <Badge variant="outline" className="text-xs mt-1 border-green-300 text-green-700">
                  AI推荐
                </Badge>
              </div>
              <Award className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">最低成本</p>
                <p className="text-lg font-bold text-purple-900">
                  {formatCurrency(minCost)}
                </p>
                <p className="text-xs text-purple-600 mt-1">优化后成本</p>
              </div>
              <TrendingDown className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">节省金额</p>
                <p className="text-lg font-bold text-orange-900">
                  {formatCurrency(results.comparison_metrics.cost_comparison.cost_saving)}
                </p>
                <p className="text-xs text-orange-600 mt-1">相比基准</p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 推荐方案提示 */}
      {results.recommended_plan && (
        <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <Award className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium mb-1">系统推荐方案</p>
                <p className="text-sm">
                  <strong>{results.recommended_plan.plan_name}</strong> 在成本、效率和风险之间实现了最佳平衡
                </p>
              </div>
              <Button
                onClick={() => integrateToScheduling(results.recommended_plan)}
                disabled={isIntegratingToScheduling}
                size="sm"
                className="bg-green-600 hover:bg-green-700 ml-4"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                采用推荐
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 方案对比列表 */}
      <Card className="shadow-lg">
        <CardHeader className="bg-white border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>方案对比分析</span>
              </CardTitle>
              <CardDescription>
                按综合评分排序，点击方案查看详细信息
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {allPlans.length} 个方案
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {allPlans
              .sort((a, b) => a.total_cost - b.total_cost)
              .map((plan, index) => {
                const isSelected = selectedPlan?.plan_id === plan.plan_id
                const isRecommended = plan.plan_id === results.recommended_plan?.plan_id
                const isLowestCost = plan.total_cost === minCost
                const costSaving = results.baseline_plan.total_cost - plan.total_cost
                
                return (
                  <Card 
                    key={plan.plan_id} 
                    className={`transition-all duration-200 cursor-pointer border-2 ${
                      isSelected 
                        ? 'ring-2 ring-primary/50 bg-primary/5 shadow-lg border-primary/30' 
                        : 'hover:shadow-md hover:bg-muted/30 border-border'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        {/* 方案信息 */}
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-full ${
                            isLowestCost ? 'bg-green-100 text-green-600' :
                            isRecommended ? 'bg-blue-100 text-blue-600' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {isLowestCost ? <Award className="h-6 w-6" /> : 
                             isRecommended ? <CheckCircle2 className="h-6 w-6" /> :
                             <BarChart3 className="h-6 w-6" />}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold">{plan.plan_name}</h3>
                              {isLowestCost && (
                                <Badge className="bg-green-500 hover:bg-green-600">
                                  <Award className="h-3 w-3 mr-1" />
                                  最低成本
                                </Badge>
                              )}
                              {isRecommended && (
                                <Badge className="bg-blue-500 hover:bg-blue-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  系统推荐
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{plan.plan_type === 'baseline' ? '基准方案' : '优化方案'}</span>
                              {costSaving > 0 && (
                                <span className="text-green-600 font-medium">
                                  节省 {formatCurrency(costSaving)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* 关键指标 */}
                        <div className="flex items-center space-x-8">
                          <div className="text-center space-y-1">
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(plan.total_cost)}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center">
                              <Calculator className="h-3 w-3 mr-1" />
                              总成本
                            </div>
                          </div>
                          
                          <div className="text-center space-y-1">
                            <div className="text-lg font-bold text-blue-600">
                              {formatPercentage(plan.completion_rate)}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center">
                              <Target className="h-3 w-3 mr-1" />
                              完成率
                            </div>
                          </div>
                          
                          <div className="text-center space-y-1">
                            <div className="text-lg font-bold text-purple-600">
                              {formatPercentage(plan.capacity_utilization)}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center">
                              <Zap className="h-3 w-3 mr-1" />
                              产能利用率
                            </div>
                          </div>
                          
                          <div className="text-center space-y-1">
                            <div className="text-lg font-bold text-orange-600">
                              {plan.average_delay.toFixed(1)}天
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center">
                              <Timer className="h-3 w-3 mr-1" />
                              平均延误
                            </div>
                          </div>
                          
                          {/* 操作按钮 */}
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedPlan(plan)
                                setActiveTab('prod-analysis')
                              }}
                            >
                              查看详情
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                integrateToScheduling(plan)
                              }}
                              disabled={isIntegratingToScheduling}
                              size="sm"
                              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                            >
                              {isIntegratingToScheduling ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <ArrowRight className="h-4 w-4 mr-2" />
                              )}
                              转入排班
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 