'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, 
  RefreshCw,
  Factory,
  DollarSign,
  Info,
  Eye,
  Settings,
  Zap,
  Users
} from 'lucide-react'

interface ParameterSettingsProps {
  baselineCapacity: number
  capacityVariation: number
  delayPenalty: number
  setBaselineCapacity: (value: number) => void
  setCapacityVariation: (value: number) => void
  setDelayPenalty: (value: number) => void
  executeMultiPlanProduction: () => void
  openCapacityModal: () => void
  isLoading: boolean
  ordersLength: number
}

export default function ParameterSettings({
  baselineCapacity,
  capacityVariation,
  delayPenalty,
  setBaselineCapacity,
  setCapacityVariation,
  setDelayPenalty,
  executeMultiPlanProduction,
  openCapacityModal,
  isLoading,
  ordersLength
}: ParameterSettingsProps) {
  return (
    <div className="space-y-6">
      {/* 产能数据提示卡片 */}
      <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-1">重要说明</p>
              <p className="text-sm">
                成本计算基于产能数据表，而非下方的成本参数。点击查看详细的产能-成本对应关系。
              </p>
            </div>
            <Button
              onClick={openCapacityModal}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 ml-4"
            >
              <Eye className="h-4 w-4 mr-2" />
              查看产能数据表
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* 主要参数设置卡片 */}
      <Card className="shadow-lg">
        <CardHeader className="bg-white border-b">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">生产参数设置</CardTitle>
          </div>
          <CardDescription>
            配置基础产能、算法参数等排产相关设置
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 产能参数区域 */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Factory className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-foreground">产能参数</h3>
                <Badge variant="secondary" className="text-xs">
                  核心配置
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baseline-capacity" className="text-sm font-medium flex items-center">
                    基准产能 (件/天)
                    <Badge variant="outline" className="ml-2 text-xs">
                      必填
                    </Badge>
                  </Label>
                  <Input
                    id="baseline-capacity"
                    type="number"
                    value={baselineCapacity}
                    onChange={(e) => setBaselineCapacity(parseInt(e.target.value) || 180)}
                    className="text-lg font-medium"
                    placeholder="例如: 180"
                  />
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    推荐使用 170、180、190
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity-variation" className="text-sm font-medium">
                    产能变化幅度 (±件/天)
                  </Label>
                  <Input
                    id="capacity-variation"
                    type="number"
                    value={capacityVariation}
                    onChange={(e) => setCapacityVariation(parseInt(e.target.value) || 10)}
                    className="text-lg font-medium"
                    placeholder="例如: 10"
                  />
                  <p className="text-xs text-muted-foreground">
                    用于生成多个产能方案
                  </p>
                </div>
              </div>
            </div>

            {/* 算法参数区域 */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-foreground">算法参数</h3>
                <Badge variant="secondary" className="text-xs">
                  成本配置
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delay-penalty" className="text-sm font-medium">
                    延误罚金 (元/件/天)
                  </Label>
                  <Input
                    id="delay-penalty"
                    type="number"
                    step="0.01"
                    value={delayPenalty}
                    onChange={(e) => setDelayPenalty(parseFloat(e.target.value) || 200)}
                    className="text-lg font-medium"
                    placeholder="例如: 200"
                  />
                  <p className="text-xs text-muted-foreground">
                    超期交付的罚金
                  </p>
                </div>

                {/* 成本计算说明 */}
                <Card className="bg-muted/50 border-muted">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Calculator className="h-4 w-4 mr-2" />
                      成本计算公式
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span>能耗成本 = 能耗 × 1 ¥/kWh</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3 text-blue-500" />
                        <span>人效成本 = 人效 × 360 ¥/人</span>
                      </div>
                      <div className="flex items-center space-x-2 font-medium">
                        <Calculator className="h-3 w-3 text-green-500" />
                        <span>总成本 = 能耗成本 + 人效成本</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* 执行按钮区域 */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant={ordersLength > 0 ? "default" : "secondary"} className="text-sm">
                  {ordersLength} 个订单
                </Badge>
                {ordersLength === 0 && (
                  <p className="text-sm text-muted-foreground">
                    请先添加订单再执行排产
                  </p>
                )}
              </div>
              
              <Button
                onClick={executeMultiPlanProduction}
                disabled={isLoading || ordersLength === 0}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    计算中...
                  </>
                ) : (
                  <>
                    <Calculator className="h-5 w-5 mr-2" />
                    执行多方案排产
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 