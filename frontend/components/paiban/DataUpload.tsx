'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, AlertCircle, CheckCircle2, Play, Calendar, Zap, Target, Database, TrendingUp, Eye, X, Factory, BarChart3, Settings, DollarSign, Package, Info } from 'lucide-react'
import * as XLSX from 'xlsx'

interface DataUploadProps {
  skuFile: File | null
  positionFile: File | null
  skillFile: File | null
  productCode: string
  error: string | null
  isProcessing: boolean
  productionCapacityConfig?: {
    planName: string
    planType: string
    baselineCapacity: number
    capacityVariation: number
    actualCapacity: number
    utilizationRate: number
    totalCost: number
    completionRate: number
    averageDelay: number
    weeklyScheduleSummary: {
      totalProduction: number
      workingDays: number
      customers: string[]
      products: string[]
    }
  } | null
  handleFileUpload: (file: File, setter: (file: File | null) => void) => void
  setSkuFile: (file: File | null) => void
  setPositionFile: (file: File | null) => void
  setSkillFile: (file: File | null) => void
  setProductCode: (code: string) => void
  handleScheduling: () => void
  handleWeeklyScheduling: () => void
}

export default function DataUpload({
  skuFile,
  positionFile,
  skillFile,
  productCode,
  error,
  isProcessing,
  productionCapacityConfig,
  handleFileUpload,
  setSkuFile,
  setPositionFile,
  setSkillFile,
  setProductCode,
  handleScheduling,
  handleWeeklyScheduling
}: DataUploadProps) {
  const [previewFile, setPreviewFile] = useState<{file: File, data: any[]} | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  
  // 当有排产配置数据时，自动设置产品代码
  useEffect(() => {
    if (productionCapacityConfig?.weeklyScheduleSummary?.products && 
        productionCapacityConfig.weeklyScheduleSummary.products.length > 0) {
      // 使用排产系统中的第一个产品代码
      const firstProduct = productionCapacityConfig.weeklyScheduleSummary.products[0]
      if (firstProduct && productCode !== firstProduct) {
        setProductCode(firstProduct)
      }
    }
  }, [productionCapacityConfig, setProductCode, productCode])
  
  const allFilesUploaded = skuFile && positionFile && skillFile && productCode

  // 预览文件内容
  const previewFileContent = async (file: File) => {
    setIsLoadingPreview(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          setPreviewFile({ file, data: jsonData })
        } catch (error) {
          console.error('文件解析失败:', error)
        } finally {
          setIsLoadingPreview(false)
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('文件读取失败:', error)
      setIsLoadingPreview(false)
    }
  }

  // 文件预览modal
  const renderPreviewModal = () => {
    if (!previewFile) return null

    const { file, data } = previewFile
    const headers = data[0] || []
    const rows = data.slice(1, 21) // 只显示前20行

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] m-4">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{file.name}</h2>
              <p className="text-sm text-gray-600">文件预览 (显示前20行数据)</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {headers.map((header: any, index: number) => (
                      <th key={index} className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: any[], rowIndex: number) => (
                    <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      {headers.map((_: any, colIndex: number) => (
                        <td key={colIndex} className="border border-gray-300 px-4 py-2 text-sm">
                          {row[colIndex] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {data.length > 21 && (
              <div className="mt-4 text-center text-gray-600">
                <p>共 {data.length - 1} 行数据，仅显示前20行</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 排产方案配置数据概览 - 如果有的话 */}
      {productionCapacityConfig && (
        <div className="space-y-4">
          <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <Factory className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium mb-1">排产方案数据已导入</p>
                  <p className="text-sm">
                    方案：{productionCapacityConfig.planName} ({productionCapacityConfig.planType})，
                    包含 {productionCapacityConfig.weeklyScheduleSummary.customers.length} 个客户，
                    {productionCapacityConfig.weeklyScheduleSummary.products.length} 个产品型号
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">总成本</p>
                    <p className="text-xl font-bold text-blue-900">
                      ¥{(productionCapacityConfig.totalCost / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">完成率</p>
                    <p className="text-xl font-bold text-green-900">
                      {(productionCapacityConfig.completionRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">平均延误</p>
                    <p className="text-xl font-bold text-orange-900">
                      {productionCapacityConfig.averageDelay.toFixed(1)}天
                    </p>
                  </div>
                  <AlertCircle className="h-6 w-6 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">产能利用率</p>
                    <p className="text-xl font-bold text-purple-900">
                      {productionCapacityConfig.utilizationRate.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-600 text-sm font-medium">总产量</p>
                    <p className="text-xl font-bold text-indigo-900">
                      {productionCapacityConfig.weeklyScheduleSummary.totalProduction}件
                    </p>
                  </div>
                  <Package className="h-6 w-6 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-600 text-sm font-medium">工作日</p>
                    <p className="text-xl font-bold text-cyan-900">
                      {productionCapacityConfig.weeklyScheduleSummary.workingDays}天
                    </p>
                  </div>
                  <Calendar className="h-6 w-6 text-cyan-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* 数据文件上传 */}
      <Card>
        <CardHeader>
          <CardTitle>数据文件上传</CardTitle>
          <CardDescription>上传SKU工艺路线、岗位信息和技能矩阵文件</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* SKU工艺路线 */}
            <div className="space-y-4">
              <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  skuFile ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">SKU工艺路线</h3>
                <p className="text-sm text-gray-600 mb-4">产品代码、工序信息、标准工时、箱型映射</p>
                
                <Input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, setSkuFile)
                  }}
                  className="cursor-pointer"
                />
              </div>
              
              {skuFile && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center text-blue-700">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium truncate">{skuFile.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => previewFileContent(skuFile)}
                    disabled={isLoadingPreview}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* 岗位信息 */}
            <div className="space-y-4">
              <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 transition-colors">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  positionFile ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">岗位信息</h3>
                <p className="text-sm text-gray-600 mb-4">岗位编码、工作中心、班组配置</p>
                
                <Input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, setPositionFile)
                  }}
                  className="cursor-pointer"
                />
              </div>
              
              {positionFile && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-green-700">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium truncate">{positionFile.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => previewFileContent(positionFile)}
                    disabled={isLoadingPreview}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* 技能矩阵 */}
            <div className="space-y-4">
              <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  skillFile ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">技能矩阵</h3>
                <p className="text-sm text-gray-600 mb-4">人员技能等级、岗位适配度</p>
                
                <Input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, setSkillFile)
                  }}
                  className="cursor-pointer"
                />
              </div>
              
              {skillFile && (
                <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center text-purple-700">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium truncate">{skillFile.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => previewFileContent(skillFile)}
                    disabled={isLoadingPreview}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 产品配置和排班控制 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 产品配置 */}
        <Card>
          <CardHeader>
            <CardTitle>产品配置</CardTitle>
            <CardDescription>
              {productionCapacityConfig ? '从排产方案自动获取' : '设置目标产品型号'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {productionCapacityConfig ? (
              // 显示从排产系统获取的产品信息
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-blue-900">排产方案产品</Label>
                    <Factory className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    {productionCapacityConfig.weeklyScheduleSummary.products.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white border border-blue-100 rounded">
                        <span className="font-mono text-sm">{product}</span>
                        {index === 0 && (
                          <Badge variant="default" className="text-xs">
                            已选择
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center text-blue-600 text-sm">
                  <Info className="h-4 w-4 mr-2" />
                  产品型号已从排产方案自动获取
                </div>
              </div>
            ) : (
              // 手动输入产品型号
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="product-code">产品型号 (SKU)</Label>
                  <Input
                    id="product-code"
                    type="text"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    placeholder="例如: C1B010000036"
                  />
                </div>
                {productCode && (
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    产品型号已设置
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 上传状态 */}
        <Card>
          <CardHeader>
            <CardTitle>上传状态</CardTitle>
            <CardDescription>检查所有必需数据是否就绪</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">SKU工艺路线</span>
                {skuFile ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">岗位信息</span>
                {positionFile ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">技能矩阵</span>
                {skillFile ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">产品型号</span>
                {productCode ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                )}
              </div>
              {productionCapacityConfig && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">排产方案数据</span>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>

            {allFilesUploaded && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">所有数据已就绪，可以开始排班！</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 排班控制 */}
        <Card>
          <CardHeader>
            <CardTitle>执行排班</CardTitle>
            <CardDescription>启动AI智能排班算法</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleScheduling}
              disabled={!allFilesUploaded || isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  计算中...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  单日排班
                </>
              )}
            </Button>

            <Button
              onClick={handleWeeklyScheduling}
              disabled={!allFilesUploaded || isProcessing}
              variant="outline"
              className="w-full"
            >
              <Calendar className="h-4 w-4 mr-2" />
              一周排班
            </Button>

            {!allFilesUploaded && (
              <p className="text-sm text-gray-500 text-center">
                请完成所有文件上传和配置
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 文件预览 Modal */}
      {renderPreviewModal()}
    </div>
  )
} 