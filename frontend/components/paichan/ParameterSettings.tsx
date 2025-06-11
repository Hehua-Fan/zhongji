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
  Info,
  Eye,
  Settings,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  Package
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
  setBaselineCapacity,
  setCapacityVariation,
  executeMultiPlanProduction,
  openCapacityModal,
  isLoading,
  ordersLength
}: ParameterSettingsProps) {
  return (
    <div className="space-y-8">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">基准产能</p>
                <p className="text-2xl font-bold text-blue-900">{baselineCapacity}</p>
              </div>
              <Factory className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">变化幅度</p>
                <p className="text-2xl font-bold text-green-900">±{capacityVariation}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">待排订单</p>
                <p className="text-2xl font-bold text-orange-900">{ordersLength}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">方案数量</p>
                <p className="text-2xl font-bold text-purple-900">{Math.floor(capacityVariation / 10) * 2 + 1}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 产能数据提示 */}
      <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-1">产能配置参考</p>
              <p className="text-sm">
                成本计算基于产能数据表，推荐使用 170、180、190 等标准配置
              </p>
            </div>
            <Button
              onClick={openCapacityModal}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 ml-4 cursor-pointer"
            >
              <Eye className="h-4 w-4 mr-2" />
              查看配置表
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* 参数配置 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>生产参数配置</span>
            </CardTitle>
            <CardDescription>设置基础产能参数，系统将生成多个优化方案</CardDescription>
          </div>
          {ordersLength > 0 && (
            <Badge variant="default" className="bg-blue-500">
              {ordersLength} 个订单待处理
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 左侧：参数设置 */}
            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-6 border border-green-200 cursor-default">
                <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                  <Factory className="h-4 w-4 mr-2" />
                  参数输入
                </h3>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="baseline-capacity" className="text-sm font-medium text-green-800 cursor-default">
                      基准产能 (件/天)
                    </Label>
                    <div className="w-full">
                      <Input
                        id="baseline-capacity"
                        type="number"
                        value={baselineCapacity}
                        onChange={(e) => setBaselineCapacity(parseInt(e.target.value) || 180)}
                        className="text-lg text-center w-full cursor-text"
                        placeholder="输入基准产能"
                      />
                    </div>
                    <p className="text-xs text-green-700 flex items-center cursor-default">
                      <Info className="h-3 w-3 mr-1" />
                      推荐范围：170-190
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="capacity-variation" className="text-sm font-medium text-green-800 cursor-default">
                      产能变化幅度 (±件/天)
                    </Label>
                    <div className="w-full">
                      <Input
                        id="capacity-variation"
                        type="number"
                        value={capacityVariation}
                        onChange={(e) => setCapacityVariation(parseInt(e.target.value) || 10)}
                        className="text-lg text-center w-full cursor-text"
                        placeholder="输入变化幅度"
                      />
                    </div>
                    <p className="text-xs text-green-700 cursor-default">
                      用于生成多个产能方案进行比较
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：成本说明 */}
            <div className="space-y-6">
              <div className="bg-orange-50 rounded-lg p-6 border border-orange-200 cursor-default">
                <h3 className="font-semibold text-orange-900 mb-4 flex items-center">
                  <Calculator className="h-4 w-4 mr-2" />
                  成本计算公式
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-orange-800">能耗成本 = 能耗 × 1 ¥/kWh</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-orange-800">人效成本 = 人效 × 360 ¥/人</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="font-medium text-orange-900">总成本 = 能耗成本 + 人效成本</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 cursor-default">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  方案预览
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>基准方案：</span>
                    <span className="font-medium">{baselineCapacity} 件/天</span>
                  </div>
                  <div className="flex justify-between">
                    <span>优化方案：</span>
                    <span className="font-medium">
                      {baselineCapacity - capacityVariation} - {baselineCapacity + capacityVariation} 件/天
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>方案总数：</span>
                    <span className="font-medium">{Math.floor(capacityVariation / 10) * 2 + 1} 个</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 执行按钮 */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center justify-center space-x-4">
              {ordersLength === 0 ? (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4 cursor-default">请先添加订单再执行排产</p>
                  <Button variant="outline" disabled className="w-48 cursor-not-allowed">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    暂无订单数据
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={executeMultiPlanProduction}
                  disabled={isLoading}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-12 py-3 shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
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
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 