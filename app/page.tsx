"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { FileText, Upload, Calendar, BarChart2, Info, Download, X, Eye, AlertCircle, Crown, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';

// 数据类型定义
interface ScheduleItem {
  日期: string;
  产能: number;
  节拍: number;
  能耗: number;
  定员: number;
  人效: number;
  能耗成本: number;
  人效成本: number;
  总成本: number;
  CT时间: number;
  TT时间: number;
  熟练工等级: string;
  时间紧迫度: string;
  [key: string]: string | number;
}

interface ScheduleSummary {
  总产能: number;
  总成本: number;
  平均CT时间: number;
  总TT时间: number;
  时间达成率: number;
  [key: string]: number;
}

interface ScheduleData {
  方案名称: string;
  dailySchedule: ScheduleItem[];
  summary: ScheduleSummary;
  排程策略: string;
}


// 添加Modal组件
const Modal = ({ isOpen, onClose, title, children }: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] z-10 relative flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none cursor-pointer"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-sm cursor-pointer"
          >
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
};

const ProductionScheduler = () => {
  // Use isMounted to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  
  // Move all other state declarations after isMounted check
  const [file, setFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalCapacity, setTotalCapacity] = useState("");
  const [scheduleData, setScheduleData] = useState<ScheduleData[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [totalDays, setTotalDays] = useState<number | null>(null);
  const [isUsingDefaultFile, setIsUsingDefaultFile] = useState(true);
  const [defaultFilePreview, setDefaultFilePreview] = useState<Array<Array<string | number>>>([]);
  const [isDefaultFileLoaded, setIsDefaultFileLoaded] = useState(false);
  const [defaultFileData, setDefaultFileData] = useState<Blob | null>(null);

  // CT/TT 相关状态
  const [ttTime, setTtTime] = useState(""); // TT时间（订单要求完成时间，小时）
  const [ctTime, setCTTime] = useState(""); // CT时间（单人完成时间，小时）
  const [priorityMode, setPriorityMode] = useState<"cost" | "time">("cost"); // 优先模式：成本优先 or 时间优先

  const [loading, setLoading] = useState(false);
  const [filePreview, setFilePreview] = useState<Array<Array<string | number>>>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Use memo hooks only after component has mounted
  const lowestCostIndex = useMemo(() => {
    if (!isMounted || !scheduleData || scheduleData.length <= 1) return 0;
    let minIndex = 0;
    let minCost = scheduleData[0].summary["总成本"];
    
    for (let i = 1; i < scheduleData.length; i++) {
      if (scheduleData[i].summary["总成本"] < minCost) {
        minCost = scheduleData[i].summary["总成本"];
        minIndex = i;
      }
    }
    return minIndex;
  }, [scheduleData, isMounted]);

  // 按照优先策略排序的方案数据
  const sortedScheduleData = useMemo(() => {
    if (!isMounted || !scheduleData || scheduleData.length <= 1) return scheduleData;
    
    return [...scheduleData].sort((a, b) => {
      if (priorityMode === "cost") {
        // 成本优先：按总成本排序
        return a.summary["总成本"] - b.summary["总成本"];
      } else {
        // 时间优先：按时间达成率排序（高到低）
        const aTimeRate = a.summary["时间达成率"] || 0;
        const bTimeRate = b.summary["时间达成率"] || 0;
        return bTimeRate - aTimeRate;
      }
    });
  }, [scheduleData, priorityMode, isMounted]);

  // 计算两个日期之间的天数
  const calculateDaysBetween = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 加1因为包括起始日期
  };

  // 计算时间紧迫度和推荐熟练工等级
  const calculateTimeUrgency = () => {
    if (!ttTime || !ctTime || !totalDays) return null;
    
    const tt = parseFloat(ttTime);
    const ct = parseFloat(ctTime);
    const days = totalDays;
    
    // 可用总工时 = 天数 * 8小时/天
    const availableHours = days * 8;
    
    // 时间紧迫度 = CT时间 / TT时间
    const urgencyRatio = ct / tt;
    
    // 时间达成率 = TT时间 / 可用总工时
    const timeAchievementRate = (tt / availableHours) * 100;
    
    let recommendedSkillLevel = "";
    let urgencyLevel = "";
    let strategy = "";
    
    if (urgencyRatio <= 1.0) {
      // CT时间满足TT要求
      recommendedSkillLevel = "二级/三级熟练工";
      urgencyLevel = "正常";
      strategy = "成本优先策略：选择二级/三级熟练工，在满足时间要求的前提下降低成本";
    } else if (urgencyRatio <= 1.5) {
      // 轻微时间压力
      recommendedSkillLevel = "三级/四级熟练工";
      urgencyLevel = "轻微紧迫";
      strategy = "平衡策略：选择三级/四级熟练工，平衡时间和成本";
    } else {
      // 高时间压力
      recommendedSkillLevel = "四级熟练工";
      urgencyLevel = "高度紧迫";
      strategy = "时间优先策略：必须使用四级熟练工，确保在TT时间内完成订单";
    }
    
    return {
      urgencyRatio,
      timeAchievementRate,
      recommendedSkillLevel,
      urgencyLevel,
      strategy,
      availableHours,
      ct,
      tt
    };
  };

  const timeUrgencyInfo = calculateTimeUrgency();

  // 当日期改变时，更新总天数
  useEffect(() => {
    if (startDate && endDate) {
      setTotalDays(calculateDaysBetween(startDate, endDate));
    } else {
      setTotalDays(null);
    }
  }, [startDate, endDate]);

  // Ensure component is mounted before any client-side operations
  useEffect(() => {
    setIsMounted(true);
    
    // 加载默认数据文件
    const loadDefaultFile = async () => {
      try {
        const response = await fetch('/默认产能数据表.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        
        // 保存原始数据用于表单提交
        const defaultFileData = new Blob([data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
        
        // 解析Excel文件
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        setDefaultFileData(defaultFileData);
        setDefaultFilePreview(jsonData as Array<Array<string | number>>);
        setFilePreview(jsonData as Array<Array<string | number>>);
        setIsDefaultFileLoaded(true);
      } catch (error) {
        console.error('加载默认数据文件失败:', error);
      }
    };
    
    loadDefaultFile();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsUsingDefaultFile(false);
      
      try {
        // 预览Excel文件
        const data = await readExcelFile(selectedFile);
        setFilePreview(data);
      } catch (err) {
        toast.error("无法读取Excel文件，请确保文件格式正确");
        console.error(err);
      }
    }
  };

  const readExcelFile = (file: File): Promise<Array<Array<string | number>>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // 返回完整数据
          resolve(jsonData as Array<Array<string | number>>);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  // 重置为默认文件
  const resetToDefaultFile = () => {
    setFile(null);
    setIsUsingDefaultFile(true);
    setFilePreview(defaultFilePreview);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isUsingDefaultFile && !file) {
      toast.error("请上传产能数据表");
      return;
    }
    
    if (!startDate || !endDate) {
      toast.error("请选择起始和终止日期");
      return;
    }
    
    if (!totalCapacity || isNaN(Number(totalCapacity)) || Number(totalCapacity) <= 0) {
      toast.error("请输入有效的订单总产能需求");
      return;
    }

    if (!ttTime || isNaN(Number(ttTime)) || Number(ttTime) <= 0) {
      toast.error("请输入有效的TT时间（订单要求完成时间）");
      return;
    }

    if (!ctTime || isNaN(Number(ctTime)) || Number(ctTime) <= 0) {
      toast.error("请输入有效的CT时间（单人完成时间）");
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else if (isUsingDefaultFile && defaultFileData) {
        // 使用默认文件数据创建文件对象
        formData.append("file", defaultFileData, "默认产能数据表.xlsx");
      } else {
        throw new Error("无法获取产能数据表");
      }
      
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("totalCapacity", totalCapacity);
      formData.append("ttTime", ttTime);
      formData.append("ctTime", ctTime);
      formData.append("priorityMode", priorityMode);
      
      // 添加时间紧迫度信息
      if (timeUrgencyInfo) {
        formData.append("urgencyRatio", timeUrgencyInfo.urgencyRatio.toString());
        formData.append("recommendedSkillLevel", timeUrgencyInfo.recommendedSkillLevel);
        formData.append("urgencyLevel", timeUrgencyInfo.urgencyLevel);
      }
      
      const response = await fetch("http://localhost:8000/api/schedule", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "排程计算失败");
      }
      
      const data = await response.json();
      
      // 根据优先模式选择最优方案
      let optimalIndex = 0;
      if (data.length > 1) {
        if (priorityMode === "cost") {
          // 成本优先：选择成本最低的方案
          let lowestCost = data[0].summary["总成本"];
          for (let i = 1; i < data.length; i++) {
            if (data[i].summary["总成本"] < lowestCost) {
              lowestCost = data[i].summary["总成本"];
              optimalIndex = i;
            }
          }
        } else {
          // 时间优先：选择时间达成率最高的方案
          let highestTimeRate = data[0].summary["时间达成率"] || 0;
          for (let i = 1; i < data.length; i++) {
            const timeRate = data[i].summary["时间达成率"] || 0;
            if (timeRate > highestTimeRate) {
              highestTimeRate = timeRate;
              optimalIndex = i;
            }
          }
        }
      }
      
      setScheduleData(data as ScheduleData[]);
      setActiveTab(optimalIndex);  // 自动选择最优方案
      toast.success(`排程计算完成 - ${priorityMode === "cost" ? "成本优先" : "时间优先"}方案`);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const selected = scheduleData[activeTab];
    if (!selected) return;
  
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
  
      const headers = ["日期", "产能", "节拍", "能耗", "定员", "人效", "CT时间", "TT时间", "熟练工等级", "时间紧迫度", "能耗成本", "人效成本", "总成本"];
      const rows = selected.dailySchedule.map((item) => [
        item["日期"], item["产能"], item["节拍"], item["能耗"],
        item["定员"], item["人效"], item["CT时间"] || 0, item["TT时间"] || 0,
        item["熟练工等级"] || "", item["时间紧迫度"] || "", item["能耗成本"], item["人效成本"], item["总成本"]
      ]);
      const summaryRow = [
        "汇总", selected.summary["总产能"], "", "", "", "", 
        selected.summary["平均CT时间"] || 0, selected.summary["总TT时间"] || 0, "", "", 
        "", "", selected.summary["总成本"]
      ];
      const additionalInfo = [
        [], // 空行
        ["排程策略", selected.排程策略 || ""],
        ["时间达成率", `${selected.summary["时间达成率"] || 0}%`],
        ["平均CT时间", `${selected.summary["平均CT时间"] || 0}小时`],
        ["总TT时间", `${selected.summary["总TT时间"] || 0}小时`]
      ];
      
      const wsData = [headers, ...rows, [], summaryRow, ...additionalInfo];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 12 }, // 日期
        ...Array(8).fill({ wch: 10 }), // 原有列
        { wch: 8 }, // CT时间
        { wch: 8 }, // TT时间
        { wch: 12 }, // 熟练工等级
        { wch: 10 }, // 时间紧迫度
        { wch: 10 }, // 能耗成本
        { wch: 10 }, // 人效成本
        { wch: 10 }  // 总成本
      ];
  
      XLSX.utils.book_append_sheet(wb, ws, selected.方案名称);
      const date = new Date();
      const fileName = `排程_${selected.方案名称}_CT_TT_${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success("导出成功");
    } catch (err) {
      toast.error("导出Excel失败");
    } finally {
      setExporting(false);
    }
  };
  

  // 如果组件尚未在客户端挂载完成，返回一个基础的加载状态
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#706eff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gray-50">
      {/* Toast 通知 */}
      <Toaster
        position="top-center"
        reverseOrder={false}
      />

      {/* 背景图 */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-20"
        style={{ 
          backgroundImage: "url('/img/background.jpg')",
          zIndex: -1
        }}
      />

      {/* Excel预览Modal */}
      <Modal 
        isOpen={isPreviewModalOpen} 
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Excel预览: ${file ? file.name : isUsingDefaultFile ? '默认产能数据表.xlsx' : '文件'}`}
      >
        {filePreview.length > 0 ? (
          <div className="bg-white rounded-lg overflow-auto max-h-[70vh]">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {/* 添加行号列 */}
                  <th className="px-3 py-2 text-left font-medium text-gray-500 bg-gray-100 border-r border-gray-200">#</th>
                  {filePreview[0].map((cell, idx) => (
                    <th key={idx} className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      {cell || <span className="text-gray-400">Column {idx+1}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filePreview.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'} style={{cursor: 'pointer'}}>
                    {/* 行号 */}
                    <td className="px-3 py-2 text-sm font-medium text-gray-500 bg-gray-100 border-r border-gray-200 whitespace-nowrap">{rowIdx+1}</td>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-3 py-2 text-gray-700 whitespace-nowrap border-r border-gray-100">
                        {cell === undefined || cell === null || cell === '' ? 
                          <span className="text-gray-300">-</span> : 
                          String(cell)
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-center py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
              共 {filePreview.length-1} 行数据，{filePreview[0]?.length || 0} 列
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">无可预览的数据</p>
          </div>
        )}
      </Modal>

      {/* 主体区域 */}
      <div className="relative max-w-screen-xl mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* 左侧输入栏 */}
        <div className="lg:col-span-2">
          <Card className="shadow-md border border-[#E6F4FF] overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-3">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <Info className="h-5 w-5 text-[#706eff] mr-2" />
                生产排程参数
              </CardTitle>
            </CardHeader>
            <CardContent className="">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="file" className="font-medium">产能数据表 (Excel)</Label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* 默认数据文件状态 */}
                    <div className={`flex items-center justify-between p-3 ${isUsingDefaultFile ? 'bg-blue-50 border-b border-blue-100' : 'bg-gray-50 border-b border-gray-100'}`}>
                      <div className="flex items-center">
                        <FileText className={`h-4 w-4 mr-2 ${isUsingDefaultFile ? 'text-blue-500' : 'text-gray-400'}`} />
                        <div>
                          <span className={`text-sm font-medium ${isUsingDefaultFile ? 'text-blue-700' : 'text-gray-500'}`}>
                            默认产能数据表
                          </span>
                          {isDefaultFileLoaded && (
                            <p className="text-xs mt-0.5 text-gray-500">已加载默认数据</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isDefaultFileLoaded && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            className="h-8 px-2 flex-shrink-0 cursor-pointer hover:bg-blue-100 text-blue-600"
                            onClick={() => {
                              setIsPreviewModalOpen(true);
                              setIsUsingDefaultFile(true);
                              setFile(null);
                              setFilePreview(defaultFilePreview);
                            }}
                            title="预览默认文件"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span className="text-xs">预览</span>
                          </Button>
                        )}
                        {!isUsingDefaultFile && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs cursor-pointer text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={resetToDefaultFile}
                          >
                            切换到默认
                          </Button>
                        )}
                        {isUsingDefaultFile && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">
                            当前使用
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* 自定义数据文件 */}
                    <div className={`flex items-center justify-between p-3 ${!isUsingDefaultFile ? 'bg-green-50' : 'bg-white'}`}>
                      <div className="flex items-center">
                        <Upload className={`h-4 w-4 mr-2 ${!isUsingDefaultFile ? 'text-green-500' : 'text-gray-400'}`} />
                        <div>
                          <span className={`text-sm font-medium ${!isUsingDefaultFile ? 'text-green-700' : 'text-gray-500'}`}>
                            自定义产能数据表
                          </span>
                          {file && (
                            <p className="text-xs mt-0.5 text-gray-500">已选择: {file.name}</p>
                          )}
                          {!file && (
                            <p className="text-xs mt-0.5 text-gray-500">上传自己的Excel数据文件</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          type="button" 
                          variant={!isUsingDefaultFile ? "default" : "outline"} 
                          size="sm"
                          className={`h-8 text-xs cursor-pointer ${!isUsingDefaultFile ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => document.getElementById('file')?.click()}
                        >
                          {file ? "更换文件" : "上传文件"}
                        </Button>
                        {file && (
                          <>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              className="h-8 px-2 flex-shrink-0 cursor-pointer hover:bg-green-100 text-green-600"
                              onClick={() => setIsPreviewModalOpen(true)}
                              title="预览文件"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">预览</span>
                            </Button>
                            {isUsingDefaultFile && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs cursor-pointer text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => setIsUsingDefaultFile(false)}
                              >
                                切换到自定义
                              </Button>
                            )}
                            {!isUsingDefaultFile && (
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                                当前使用
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="font-medium">起始日期</Label>
                    <div className="flex items-center gap-2 mt-1 relative">
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                        className="pl-9 cursor-pointer"
                      />
                      <Calendar className="h-4 w-4 text-gray-500 absolute left-3 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="font-medium">终止日期</Label>
                    <div className="flex items-center gap-2 mt-1 relative">
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                        className="pl-9 cursor-pointer"
                      />
                      <Calendar className="h-4 w-4 text-gray-500 absolute left-3 pointer-events-none" />
                    </div>
                  </div>
                </div>
                
                {totalDays !== null && (
                  <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded border border-blue-100 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    计划总天数: <span className="font-medium ml-1">{totalDays}天</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="totalCapacity" className="font-medium">订单总产能需求</Label>
                  <div className="flex items-center gap-2 mt-1 relative">
                    <Input
                      id="totalCapacity"
                      type="number"
                      min="1"
                      value={totalCapacity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTotalCapacity(e.target.value)}
                      placeholder="请输入整数"
                      className="pl-9 cursor-text"
                    />
                    <BarChart2 className="h-4 w-4 text-gray-500 absolute left-3 pointer-events-none" />
                  </div>
                </div>

                {/* CT/TT 时间输入 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ctTime" className="font-medium">CT时间 (小时)</Label>
                    <div className="flex items-center gap-2 mt-1 relative">
                      <Input
                        id="ctTime"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={ctTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCTTime(e.target.value)}
                        placeholder="单人完成时间"
                        className="pl-9 cursor-text"
                      />
                      <Clock className="h-4 w-4 text-gray-500 absolute left-3 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-500">一个人从头到尾完成的时间</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ttTime" className="font-medium">TT时间 (小时)</Label>
                    <div className="flex items-center gap-2 mt-1 relative">
                      <Input
                        id="ttTime"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={ttTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTtTime(e.target.value)}
                        placeholder="订单要求完成时间"
                        className="pl-9 cursor-text"
                      />
                      <AlertCircle className="h-4 w-4 text-gray-500 absolute left-3 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-500">订单实际要求的完成时间</p>
                  </div>
                </div>

                {/* 时间紧迫度分析 */}
                {timeUrgencyInfo && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-sm bg-gray-50 px-3 py-2 rounded border flex items-center justify-between">
                        <span className="text-gray-600">时间紧迫度:</span>
                        <Badge 
                          variant={timeUrgencyInfo.urgencyRatio <= 1.0 ? "default" : 
                                  timeUrgencyInfo.urgencyRatio <= 1.5 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {timeUrgencyInfo.urgencyLevel}
                        </Badge>
                      </div>
                      <div className="text-sm bg-gray-50 px-3 py-2 rounded border flex items-center justify-between">
                        <span className="text-gray-600">时间利用率:</span>
                        <span className="font-medium text-blue-600">
                          {timeUrgencyInfo.timeAchievementRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 px-3 py-2 rounded border border-blue-100">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-700 mb-1">推荐策略</p>
                          <p className="text-blue-600">
                            <span className="font-medium">{timeUrgencyInfo.recommendedSkillLevel}</span>
                          </p>
                          <p className="text-xs text-blue-500 mt-1">{timeUrgencyInfo.strategy}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 优先策略选择 */}
                <div className="space-y-2">
                  <Label className="font-medium">排程优先策略</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={priorityMode === "cost" ? "default" : "outline"}
                      size="sm"
                      className="text-sm cursor-pointer"
                      onClick={() => setPriorityMode("cost")}
                    >
                      <BarChart2 className="h-4 w-4 mr-2" />
                      成本优先
                    </Button>
                    <Button
                      type="button"
                      variant={priorityMode === "time" ? "default" : "outline"}
                      size="sm"
                      className="text-sm cursor-pointer"
                      onClick={() => setPriorityMode("time")}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      时间优先
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {priorityMode === "cost" ? "优先选择成本最低的排程方案" : "优先选择时间达成率最高的排程方案"}
                  </p>
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-gradient-to-r from-[#706eff] to-[#4d4bcc] hover:from-[#5a58cc] hover:to-[#3e3cab] text-white shadow-md transition-all duration-200 h-10 text-sm font-medium cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      计算中...
                    </>
                  ) : (
                    "开始智能排程"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 右侧展示栏 */}
        <div className="lg:col-span-3">
          <Card className="shadow-md border border-[#E6F4FF] overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                  <BarChart2 className="h-5 w-5 text-[#706eff] mr-2" />
                  排程结果
                </CardTitle>
                {scheduleData.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-8 cursor-pointer"
                    onClick={exportToExcel}
                    disabled={exporting}
                  >
                    {exporting ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                        导出中...
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3 mr-1" />
                        导出Excel
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="">
              {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#706eff]"></div>
                  <p className="mt-6 text-sm text-gray-500">正在计算排程方案...</p>
                  <p className="text-xs text-gray-400 mt-2">请稍候，这可能需要几分钟时间</p>
                </div>
              ) : scheduleData.length > 0 ? (
                <div className="space-y-6">
                  {/* Tabs 切换 - 改进布局以处理长文本 */}
                  <div className="flex flex-wrap gap-2 mb-4 max-w-full overflow-visible">
                    {sortedScheduleData.map((plan, idx) => {
                      const currentIndex = scheduleData.findIndex(item => item.方案名称 === plan.方案名称);
                      const isActive = currentIndex === activeTab;
                      const isOptimal = idx === 0; // 排序后第一个是最优方案
                      
                      // 根据优先模式格式化显示信息
                      const formattedInfo = priorityMode === "cost" 
                        ? plan.summary["总成本"].toLocaleString()
                        : `${plan.summary["时间达成率"] || 0}%`;
                      const infoLabel = priorityMode === "cost" ? "成本" : "时间达成率";
                      const rankLabel = idx === 0 ? "最优" : `#${idx + 1}`;
                      
                      return (
                        <Button
                          key={idx}
                          variant={isActive ? "default" : "outline"}
                          className={`text-sm cursor-pointer flex items-center gap-1 px-3 py-2 min-w-0 max-w-[200px] ${
                            isOptimal && isActive ? "bg-yellow-500 hover:bg-yellow-600" : 
                            isOptimal ? "text-yellow-600 border-yellow-300 bg-yellow-50 hover:bg-yellow-100" : ""
                          }`}
                          onClick={() => setActiveTab(currentIndex)}
                          title={`方案 #${idx + 1} - ${infoLabel}: ${formattedInfo}${plan.排程策略 ? ` - ${plan.排程策略}` : ""}`}
                        >
                          {isOptimal && <Crown className="h-3.5 w-3.5 flex-shrink-0 mr-1 text-yellow-600" />}
                          <div className="flex flex-col items-start overflow-hidden">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">方案 {idx + 1}</span>
                              <Badge variant="outline" className={`text-[10px] px-1 py-0 ${
                                isOptimal ? "bg-yellow-100 text-yellow-700 border-yellow-300" : 
                                "bg-gray-100 text-gray-600 border-gray-200"
                              }`}>
                                {rankLabel}
                              </Badge>
                              {priorityMode === "time" && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                  <Clock className="h-2.5 w-2.5 mr-0.5" />
                                  时间
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs opacity-80 truncate w-full">
                              {infoLabel}: {formattedInfo}
                            </span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>

                  {/* 当前方案展示 */}
                  {(() => {
                    const current = scheduleData[activeTab];
                    return (
                      <>
                        {/* 表格展示 */}
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                {["日期", "产能", "节拍", "能耗", "定员", "人效", "CT时间", "TT时间", "熟练工等级", "时间紧迫度", "能耗成本", "人效成本", "总成本"].map((h) => (
                                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {current.dailySchedule.map((item, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-3 py-3 whitespace-nowrap">{item["日期"]}</td>
                                  <td className="px-3 py-3 font-medium">{item["产能"]}</td>
                                  <td className="px-3 py-3">{item["节拍"]}</td>
                                  <td className="px-3 py-3">{item["能耗"]}</td>
                                  <td className="px-3 py-3">{item["定员"]}</td>
                                  <td className="px-3 py-3">{item["人效"]}</td>
                                  <td className="px-3 py-3 text-blue-600 font-medium">{item["CT时间"] || 0}h</td>
                                  <td className="px-3 py-3 text-orange-600 font-medium">{item["TT时间"] || 0}h</td>
                                  <td className="px-3 py-3">
                                    <Badge variant="outline" className="text-xs">
                                      {item["熟练工等级"] || "标准"}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-3">
                                    <Badge 
                                      variant={
                                        item["时间紧迫度"] === "正常" ? "default" :
                                        item["时间紧迫度"] === "轻微紧迫" ? "secondary" : "destructive"
                                      }
                                      className="text-xs"
                                    >
                                      {item["时间紧迫度"] || "正常"}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-3">{item["能耗成本"]}</td>
                                  <td className="px-3 py-3">{item["人效成本"]}</td>
                                  <td className="px-3 py-3 font-medium text-blue-600">{item["总成本"]}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* 排程策略信息 */}
                        {current.排程策略 && (
                          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-medium text-indigo-800 mb-1">排程策略</h4>
                                <p className="text-sm text-indigo-600">{current.排程策略}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 汇总信息 */}
                        <div className="bg-white p-5 rounded-lg border-gray-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                              <p className="text-sm text-blue-600 mb-1">总产能</p>
                              <p className="text-2xl font-bold text-blue-700">{current.summary["总产能"]}</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                              <p className="text-sm text-purple-600 mb-1">总成本</p>
                              <p className="text-2xl font-bold text-purple-700">{current.summary["总成本"]}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                              <p className="text-sm text-green-600 mb-1">平均CT时间</p>
                              <p className="text-2xl font-bold text-green-700">{current.summary["平均CT时间"] || 0}h</p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                              <p className="text-sm text-orange-600 mb-1">时间达成率</p>
                              <p className="text-2xl font-bold text-orange-700">{current.summary["时间达成率"] || 0}%</p>
                            </div>
                          </div>
                          
                          {/* 详细时间分析 */}
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-800 mb-3">时间分析详情</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">总TT时间:</span>
                                <span className="font-medium">{current.summary["总TT时间"] || 0}小时</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">平均CT时间:</span>
                                <span className="font-medium">{current.summary["平均CT时间"] || 0}小时</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">时间紧迫度:</span>
                                <span className="font-medium">
                                  {timeUrgencyInfo ? timeUrgencyInfo.urgencyRatio.toFixed(2) : "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">推荐熟练工:</span>
                                <span className="font-medium">
                                  {timeUrgencyInfo ? timeUrgencyInfo.recommendedSkillLevel : "标准"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <FileText className="h-16 w-16 mb-4 text-gray-300" />
                  <p className="text-sm text-gray-500">填写左侧表单并点击"开始排程"获取排程结果</p>
                  <p className="text-xs text-gray-400 mt-2">支持Excel文件上传</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 页脚信息 */}
      <div className="border-t border-gray-200 mt-8">
        <div className="max-w-screen-xl mx-auto py-4 px-4 flex justify-between items-center">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} 智能生产排程系统 版权所有</p>
          <p className="text-xs text-gray-400">v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default ProductionScheduler;
