'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  PieChart,
  Table,
  Download,
  RefreshCw,
  Play,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Target,
  Clock,
  Factory
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

interface ProductionAnalysisProps {
  selectedPlan: CapacityOptimizationPlan | null
  setActiveTab: (tab: string) => void
  integrateToScheduling: (plan: CapacityOptimizationPlan) => void
  isIntegratingToScheduling: boolean
  generateTableData: (plan: CapacityOptimizationPlan) => any
  formatPercentage: (value: number) => string
}

interface DayInfo {
  date: Date
  isCurrentMonth: boolean
}

export default function ProductionAnalysis({
  selectedPlan,
  setActiveTab,
  integrateToScheduling,
  isIntegratingToScheduling,
  generateTableData,
  formatPercentage
}: ProductionAnalysisProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeView, setActiveView] = useState<'table' | 'calendar'>('table')

  // 处理Tab切换和日历导航显示
  useEffect(() => {
    const calendarNav = document.getElementById('calendar-nav')
    if (calendarNav) {
      calendarNav.style.display = activeView === 'calendar' ? 'flex' : 'none'
    }
  }, [activeView])

  if (!selectedPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <PieChart className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium text-foreground">请选择方案</h3>
          <p className="text-muted-foreground">从方案对比页面选择一个方案进行详细分析</p>
        </div>
        <Button onClick={() => setActiveTab('prod-comparison')}>
          <BarChart3 className="h-4 w-4 mr-2" />
          返回方案对比
        </Button>
      </div>
    )
  }

  const { tableData } = generateTableData(selectedPlan)

  // 日历相关函数
  const getDaysInMonth = (date: Date): DayInfo[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingWeekday = firstDay.getDay()
    
    const days: DayInfo[] = []
    
    // 添加上个月的日期来填充第一周
    for (let i = startingWeekday - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }
    
    // 添加当前月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day)
      days.push({ date: currentDate, isCurrentMonth: true })
    }
    
    // 添加下个月的日期来填充最后一周
    const totalCells = Math.ceil(days.length / 7) * 7
    for (let day = 1; days.length < totalCells; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push({ date: nextDate, isCurrentMonth: false })
    }
    
    return days
  }

  const formatDateKey = (date: Date) => {
    // 使用本地时区格式化，避免UTC偏移导致的日期差异
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getProductionForDate = (date: Date) => {
    const dateKey = formatDateKey(date)
    return selectedPlan.weekly_schedule[dateKey] || []
  }

  // 客户颜色配置
  const customerColors = [
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
    { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
    { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
  ]

  // 获取所有客户并分配颜色
  const getAllCustomers = () => {
    const customers = new Set<string>()
    Object.values(selectedPlan.weekly_schedule).forEach(daySchedule => {
      daySchedule.forEach((item: any) => {
        if (item.customer_name) {
          customers.add(item.customer_name)
        }
      })
    })
    return Array.from(customers)
  }

  const allCustomers = getAllCustomers()
  const getCustomerColor = (customerName: string) => {
    const index = allCustomers.indexOf(customerName)
    return customerColors[index % customerColors.length]
  }

  // 判断是否为工作日（周一到周六）
  const isWorkingDay = (date: Date) => {
    const dayOfWeek = date.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
    return dayOfWeek >= 1 && dayOfWeek <= 6 // 周一到周六
  }

  // 获取某日期的客户产量统计
  const getCustomerProductionStats = (date: Date) => {
    const production = getProductionForDate(date)
    const customerStats: { [key: string]: number } = {}
    
    production.forEach((item: any) => {
      const customer = item.customer_name || '未知客户'
      customerStats[customer] = (customerStats[customer] || 0) + item.quantity
    })
    
    return Object.entries(customerStats).map(([customer, quantity]) => ({
      customer,
      quantity,
      color: getCustomerColor(customer)
    }))
  }

  return (
    <div className="space-y-6">
      {/* 方案概要 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <PieChart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-foreground">{selectedPlan.plan_name}</CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">
                    详细分析和生产计划
                  </CardDescription>
                </div>
              </div>
              
              {/* 关键指标 */}
              <div className="flex items-center space-x-6 pt-2">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">完成率</span>
                  <Badge variant="outline" className="font-medium">
                    {formatPercentage(selectedPlan.completion_rate)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Factory className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground">产能利用率</span>
                  <Badge variant="outline" className="font-medium">
                    {formatPercentage(selectedPlan.capacity_utilization)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-muted-foreground">平均延误</span>
                  <Badge variant="outline" className="font-medium">
                    {selectedPlan.average_delay.toFixed(1)}天
                  </Badge>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => integrateToScheduling(selectedPlan)}
              disabled={isIntegratingToScheduling}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold shadow-lg"
            >
              {isIntegratingToScheduling ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  转入中...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  开始排班
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 主要内容区域 */}
      <Card className="shadow-lg">
        <CardHeader className="bg-white border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* 视图切换按钮 */}
              <div className="flex items-center space-x-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={activeView === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('table')}
                  className="flex items-center space-x-2"
                >
                  <Table className="h-4 w-4" />
                  <span>表格视图</span>
                </Button>
                <Button
                  variant={activeView === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('calendar')}
                  className="flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>日历视图</span>
                </Button>
              </div>

              {/* 工作日说明 - 简洁版 */}
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>工作日</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>休息日</span>
                </div>
              </div>

              {/* 客户颜色图例 - 简洁版 */}
              {allCustomers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">客户:</span>
                  <div className="flex items-center space-x-1">
                    {allCustomers.slice(0, 4).map((customer) => {
                      const color = getCustomerColor(customer)
                      return (
                        <Badge
                          key={customer}
                          variant="outline"
                          className={`${color.bg} ${color.text} ${color.border} text-xs px-2 py-1`}
                          title={customer}
                        >
                          {customer.length > 4 ? customer.substring(0, 4) + '...' : customer}
                        </Badge>
                      )
                    })}
                    {allCustomers.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{allCustomers.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 日历导航 (仅在日历视图时显示) */}
            {activeView === 'calendar' && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                  {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* 表格视图操作按钮 */}
            {activeView === 'table' && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                导出Excel
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* 表格视图 */}
          {activeView === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b-2">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-foreground border-r border-border">日期</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground border-r border-border">星期</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground border-r border-border">客户</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground border-r border-border">产品</th>
                    <th className="text-right py-4 px-6 font-semibold text-foreground border-r border-border">数量</th>
                    <th className="text-right py-4 px-6 font-semibold text-foreground border-r border-border">产能利用</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tableData.map((row: any, index: number) => (
                    <tr key={index} className={`hover:bg-muted/50 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <td className="py-4 px-6 font-medium text-foreground border-r border-border">
                        {row.date}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground border-r border-border">
                        {row.weekday}
                      </td>
                      <td className="py-4 px-6 border-r border-border">
                        <div className="flex flex-wrap gap-1">
                          {row.customers.map((customer: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {customer}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 border-r border-border">
                        <div className="flex flex-wrap gap-1">
                          {row.products.map((product: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-medium border-r border-border">
                        {row.totalQuantity.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-medium border-r border-border">
                        {row.totalCapacityUsed.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        {row.details.some((d: any) => d.delay_days > 0) ? (
                          <Badge variant="destructive" className="text-xs">
                            延误
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                            正常
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted border-t-2">
                  <tr>
                    <td colSpan={4} className="py-4 px-6 font-bold text-foreground">
                      总计
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-foreground">
                      {tableData.reduce((sum: number, row: any) => sum + row.totalQuantity, 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-foreground">
                      {tableData.reduce((sum: number, row: any) => sum + row.totalCapacityUsed, 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <Badge className="bg-blue-500 hover:bg-blue-600">
                        完成率 {formatPercentage(selectedPlan.completion_rate)}
                      </Badge>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          
          {/* 日历视图 */}
          {activeView === 'calendar' && (
            <div className="p-6">
              <div className="grid grid-cols-7 gap-1">
                {/* 星期标题 */}
                {['日', '一', '二', '三', '四', '五', '六'].map((weekday) => (
                  <div key={weekday} className="h-8 flex items-center justify-center text-sm font-medium text-muted-foreground bg-muted rounded">
                    {weekday}
                  </div>
                ))}
                
                {/* 日期格子 */}
                {getDaysInMonth(currentMonth).map((dayInfo, index) => {
                  const customerStats = getCustomerProductionStats(dayInfo.date)
                  const hasProduction = customerStats.length > 0
                  const totalQuantity = customerStats.reduce((sum, stat) => sum + stat.quantity, 0)
                  const isWorking = isWorkingDay(dayInfo.date)
                  
                  return (
                    <div
                      key={index}
                      className={`h-32 border-2 rounded-lg p-2 transition-all duration-200 ${
                        !dayInfo.isCurrentMonth 
                          ? 'bg-muted/50 border-muted' // 非当前月
                          : !isWorking 
                            ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200' // 休息日（周日）
                            : hasProduction 
                              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-md hover:shadow-lg transform hover:scale-105' // 有排产的工作日
                              : 'bg-background border-border hover:bg-muted/30' // 无排产的工作日
                      }`}
                    >
                      {/* 日期数字和休息日标识 */}
                      <div className={`text-sm font-bold flex items-center justify-between ${
                        dayInfo.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        <span>{dayInfo.date.getDate()}</span>
                        <div className="flex items-center space-x-1">
                          {/* 休息日标识 */}
                          {!isWorking && dayInfo.isCurrentMonth && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0.5 h-auto">
                              休
                            </Badge>
                          )}
                          {/* 排产标识点 */}
                          {hasProduction && dayInfo.isCurrentMonth && isWorking && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      {/* 生产信息 - 只在工作日显示 */}
                      {hasProduction && dayInfo.isCurrentMonth && isWorking && (
                        <div className="mt-1 space-y-1.5 overflow-hidden">
                          {/* 客户标签 */}
                          {customerStats.slice(0, 3).map((stat, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className={`${stat.color.bg} ${stat.color.text} ${stat.color.border} text-xs px-2 py-1 font-medium flex items-center justify-between shadow-sm w-full`}
                              title={`${stat.customer} - ${stat.quantity}件`}
                            >
                              <span className="truncate flex-1 mr-1">{stat.customer}</span>
                              <span className="font-bold">{stat.quantity}</span>
                            </Badge>
                          ))}
                          
                          {/* 更多客户提示 */}
                          {customerStats.length > 3 && (
                            <Badge variant="secondary" className="text-xs w-full justify-center">
                              +{customerStats.length - 3}个客户
                            </Badge>
                          )}
                          
                          {/* 总产量 */}
                          <Badge className="text-xs font-bold w-full justify-center mt-2 bg-gradient-to-r from-emerald-500 to-green-500">
                            总计: {totalQuantity}件
                          </Badge>
                        </div>
                      )}
                      
                      {/* 休息日说明 */}
                      {!isWorking && dayInfo.isCurrentMonth && (
                        <div className="mt-4 text-center space-y-1">
                          <Badge variant="outline" className="text-xs border-red-300 text-red-600">
                            工人休息
                          </Badge>
                          <p className="text-xs text-muted-foreground">无排产安排</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 