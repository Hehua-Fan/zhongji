'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, AlertCircle, CheckCircle2, Play, Calendar, Zap, Target, Database, TrendingUp, Eye, X } from 'lucide-react'
import * as XLSX from 'xlsx'

interface DataUploadProps {
  skuFile: File | null
  positionFile: File | null
  skillFile: File | null
  productCode: string
  error: string | null
  isProcessing: boolean
  productionCapacityConfig?: {
    baselineCapacity: number
    capacityVariation: number
    actualCapacity: number
    utilizationRate: number
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="space-y-8 p-6">
        {/* 产能配置显示 */}
        {productionCapacityConfig && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center text-2xl text-green-800">
                <Zap className="h-6 w-6 mr-2" />
                排产系统导入的产能配置
              </CardTitle>
              <CardDescription className="text-green-700">
                系统已自动配置最优产能参数，将用于智能排班计算
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-green-600">
                    {productionCapacityConfig.baselineCapacity}
                  </div>
                  <div className="text-sm text-gray-600">基准产能</div>
                </div>
                <div className="text-center p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-blue-600">
                    ±{productionCapacityConfig.capacityVariation}%
                  </div>
                  <div className="text-sm text-gray-600">产能波动</div>
                </div>
                <div className="text-center p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-orange-600">
                    {productionCapacityConfig.actualCapacity.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">实际产能</div>
                </div>
                <div className="text-center p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-purple-600">
                    {productionCapacityConfig.utilizationRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">利用率</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50/80 backdrop-blur-sm shadow-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-medium">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* 文件上传区域 */}
          <div className="xl:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Database className="h-6 w-6 mr-2 text-blue-600" />
              数据文件上传
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* SKU工艺路线文件 */}
              <Card className={`border-0 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                skuFile ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500' : 'bg-white/70 backdrop-blur-sm'
              }`}>
                <CardHeader className="text-center">
                  <div className={`mx-auto p-3 rounded-full ${skuFile ? 'bg-blue-500' : 'bg-gray-300'} transition-colors duration-300`}>
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">SKU工艺路线</CardTitle>
                  <CardDescription className="text-sm">
                    产品代码、工序信息、标准工时
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, setSkuFile)
                    }}
                    className="cursor-pointer border-2 border-dashed border-blue-300 bg-white/80"
                  />
                  {skuFile && (
                    <div className="flex items-center justify-between text-blue-600 text-sm bg-blue-50 p-2 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {skuFile.name}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => previewFileContent(skuFile)}
                        disabled={isLoadingPreview}
                        className="h-6 w-6 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 岗位信息文件 */}
              <Card className={`border-0 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                positionFile ? 'bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500' : 'bg-white/70 backdrop-blur-sm'
              }`}>
                <CardHeader className="text-center">
                  <div className={`mx-auto p-3 rounded-full ${positionFile ? 'bg-green-500' : 'bg-gray-300'} transition-colors duration-300`}>
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">岗位信息</CardTitle>
                  <CardDescription className="text-sm">
                    岗位编码、工作中心、班组配置
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, setPositionFile)
                    }}
                    className="cursor-pointer border-2 border-dashed border-green-300 bg-white/80"
                  />
                  {positionFile && (
                    <div className="flex items-center justify-between text-green-600 text-sm bg-green-50 p-2 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {positionFile.name}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => previewFileContent(positionFile)}
                        disabled={isLoadingPreview}
                        className="h-6 w-6 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 技能矩阵文件 */}
              <Card className={`border-0 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                skillFile ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500' : 'bg-white/70 backdrop-blur-sm'
              }`}>
                <CardHeader className="text-center">
                  <div className={`mx-auto p-3 rounded-full ${skillFile ? 'bg-purple-500' : 'bg-gray-300'} transition-colors duration-300`}>
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">技能矩阵</CardTitle>
                  <CardDescription className="text-sm">
                    人员技能等级、岗位适配度
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, setSkillFile)
                    }}
                    className="cursor-pointer border-2 border-dashed border-purple-300 bg-white/80"
                  />
                  {skillFile && (
                    <div className="flex items-center justify-between text-purple-600 text-sm bg-purple-50 p-2 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {skillFile.name}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => previewFileContent(skillFile)}
                        disabled={isLoadingPreview}
                        className="h-6 w-6 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 控制面板 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Play className="h-6 w-6 mr-2 text-indigo-600" />
              控制面板
            </h2>

            {/* 产品代码输入 */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-blue-100 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-indigo-800">产品信息</CardTitle>
                <CardDescription className="text-indigo-600">
                  设置目标产品型号
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="product-code" className="text-indigo-700 font-medium">产品型号 (SKU)</Label>
                  <Input
                    id="product-code"
                    type="text"
                    placeholder="例如: C1B010000036"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    className="border-2 border-indigo-200 bg-white/80 focus:border-indigo-400"
                  />
                  {productCode && (
                    <div className="flex items-center text-indigo-600 text-sm">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      产品型号已设置
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 排班操作 */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-orange-100 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-amber-800">执行排班</CardTitle>
                <CardDescription className="text-amber-600">
                  启动AI智能排班算法
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleScheduling}
                  disabled={!allFilesUploaded || isProcessing}
                  className={`w-full h-12 font-semibold text-lg transition-all duration-300 ${
                    allFilesUploaded && !isProcessing
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Play className="h-5 w-5 mr-2" />
                  {isProcessing ? '智能计算中...' : '单日排班'}
                </Button>
                
                <Button
                  onClick={handleWeeklyScheduling}
                  disabled={!allFilesUploaded || isProcessing}
                  variant="outline"
                  className={`w-full h-12 font-semibold text-lg transition-all duration-300 ${
                    allFilesUploaded && !isProcessing
                      ? 'border-2 border-green-500 text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'border-gray-300 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  {isProcessing ? '智能计算中...' : '一周排班'}
                </Button>
              </CardContent>
            </Card>

            {/* 进度指示器 */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-gray-800">准备状态</CardTitle>
                <CardDescription className="text-gray-600">
                  检查所有必需数据是否就绪
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'SKU工艺路线', status: !!skuFile, color: 'blue' },
                    { label: '岗位信息', status: !!positionFile, color: 'green' },
                    { label: '技能矩阵', status: !!skillFile, color: 'purple' },
                    { label: '产品型号', status: !!productCode, color: 'indigo' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <span className="text-sm font-medium">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        {item.status ? (
                          <>
                            <Badge className={`bg-${item.color}-100 text-${item.color}-800 border-${item.color}-200`}>
                              完成
                            </Badge>
                            <CheckCircle2 className={`h-5 w-5 text-${item.color}-500`} />
                          </>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {allFilesUploaded && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center text-green-700">
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      <span className="font-medium">所有数据已就绪，可以开始排班！</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {renderPreviewModal()}
    </div>
  )
} 