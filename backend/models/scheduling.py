"""
排班相关模型定义
包含排班算法、岗位管理、性能分析等相关的数据模型
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from .base import SchedulingResult

class PositionGroup(BaseModel):
    岗位编码: str
    岗位名称: str
    工作中心: str
    班组: str
    技能等级: str
    需求人数: int
    已排人数: int
    员工列表: List[SchedulingResult]

class PositionMatchData(BaseModel):
    岗位编码: str
    工作中心: str
    要求技能等级: int
    平均实际技能: float
    匹配度: float
    匹配状态: str  # '完全匹配' | '基本匹配' | '需要培养'
    员工情况: List[Dict[str, Any]]

class LowEfficiencyPosition(BaseModel):
    岗位编码: str
    工作中心: str
    当前利用率: float
    标准工时: float
    实际工时: float
    差距工时: float
    影响原因: List[str]

class OptimizationSuggestion(BaseModel):
    岗位编码: str
    建议类型: str
    具体建议: str
    预期效果: str
    实施难度: str

class TrainingPlan(BaseModel):
    岗位编码: str
    工作中心: str
    需培养人员: List[Dict[str, Any]]
    优先级: str

class LeaveInfo(BaseModel):
    工号: str
    姓名: str
    请假日期: str
    请假类型: str

class AdjustmentSuggestion(BaseModel):
    类型: str
    岗位编码: str
    建议内容: str
    影响评估: Dict[str, Any]
    实施建议: str

class TeamWorkload(BaseModel):
    班组: str
    总人数: int
    在岗人数: int
    请假人数: int
    技能分布: Dict[str, int]
    负荷率: float
    可调配人员: List[Dict[str, Any]]

class PerformanceMetrics(BaseModel):
    人岗匹配度: Dict[str, Any]
    工时利用率: Dict[str, Any]

# API 请求模型
class SchedulingRequest(BaseModel):
    target_date: str
    product_code: str
    sku_data: List[List[Any]]
    position_data: List[List[Any]]
    skill_data: List[List[Any]]
    weekly_assigned_workers: Optional[List[str]] = None

class WeeklySchedulingRequest(BaseModel):
    start_date: str
    product_code: str
    sku_data: List[List[Any]]
    position_data: List[List[Any]]
    skill_data: List[List[Any]]

# API 响应模型
class SchedulingResponse(BaseModel):
    results: List[SchedulingResult]
    groups: List[PositionGroup]
    performance_metrics: Dict[str, Any]

class WeeklySchedulingResponse(BaseModel):
    weekly_schedule: Dict[str, SchedulingResponse]
    summary: Dict[str, Any]
