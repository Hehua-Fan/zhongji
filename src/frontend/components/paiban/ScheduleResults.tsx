'use client'

import React, { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  CalendarDays, 
  Download, 
  Filter, 
  X, 
  Search, 
  Copy, 
  Users, 
  MapPin, 
  Star, 
  Plus 
} from 'lucide-react'

interface SchedulingResult {
  岗位编码: string
  姓名: string
  工号: string
  技能等级: number
  班组: string
  工作中心: string
  日期: string
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
  状态: string
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

interface ScheduleResultsProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  currentDate: Date
  setCurrentDate: (date: Date) => void
  weekDates: Date[]
  weeklySchedule: WeeklySchedule
  positionGroups: PositionGroup[]
  schedulingResults: SchedulingResult[]
  selectedWeekDay: string
  setSelectedWeekDay: (day: string) => void
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  filterOptions: {
    岗位编码列表: string[]
    工作中心列表: string[]
    班组列表: string[]
  }
  downloadResults: () => void
  navigateToDay: (date: Date) => void
  formatDate: (date: Date) => string
  formatWeekday: (date: Date) => string
}

export default function ScheduleResults({
  viewMode,
  setViewMode,
  currentDate,
  weekDates,
  weeklySchedule,
  positionGroups,
  selectedWeekDay,
  setSelectedWeekDay,
  filters,
  setFilters,
  showFilters,
  setShowFilters,
  filterOptions,
  downloadResults,
  navigateToDay,
  formatDate,
  formatWeekday
}: ScheduleResultsProps) {
  
  // 筛选后的岗位组
  const filteredPositionGroups = useMemo(() => {
    let currentGroups = positionGroups
    
    if (viewMode === 'week' && selectedWeekDay) {
      currentGroups = weeklySchedule[selectedWeekDay]?.positionGroups || []
    }
    
    return currentGroups.filter(group => {
      // 基本筛选逻辑
      if (filters.岗位编码 && !group.岗位编码.includes(filters.岗位编码)) return false
      if (filters.工作中心 && group.工作中心 !== filters.工作中心) return false
      if (filters.班组 && !group.员工列表.some(w => w.班组 === filters.班组)) return false
      
      if (filters.状态 !== '全部') {
        const 已满 = group.已排人数 >= group.需求人数
        if (filters.状态 === '已满' && !已满) return false
        if (filters.状态 === '缺员' && 已满) return false
      }
      
      if (filters.搜索关键词) {
        const keyword = filters.搜索关键词.toLowerCase()
        const searchText = [
          group.岗位编码, group.工作中心,
          ...group.员工列表.map(w => w.姓名),
          ...group.员工列表.map(w => w.工号)
        ].join(' ').toLowerCase()
        
        if (!searchText.includes(keyword)) return false
      }
      
      return true
    })
  }, [positionGroups, weeklySchedule, selectedWeekDay, viewMode, filters])

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

  const navigateToWeek = () => {
    setViewMode('week')
  }

  return (
    <div className="space-y-6">
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
          {((viewMode === 'day' && positionGroups.length > 0) || 
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
                            // 复制到其他日期的逻辑
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
    </div>
  )
} 