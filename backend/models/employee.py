"""
员工管理相关模型定义
包含员工状态、人员分析、班次调整等相关的数据模型
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from enum import Enum

# 员工状态管理相关模型
class EmployeeStatusType(str, Enum):
    """员工状态类型"""
    LEAVE = "请假"
    RESIGNATION = "辞职" 
    REST = "休息"

class ShiftType(str, Enum):
    """班次类型"""
    DAY_SHIFT = "白班"
    NIGHT_SHIFT = "夜班"

class EmployeeStatusRecord(BaseModel):
    """员工状态记录"""
    id: Optional[str] = None
    employee_id: str  # 工号
    employee_name: str  # 姓名
    team: str  # 班组
    status_type: EmployeeStatusType  # 状态类型
    shift_type: ShiftType  # 班次
    start_date: str  # 开始日期
    end_date: Optional[str] = None  # 结束日期（辞职可能为空）
    reason: Optional[str] = ""  # 备注说明
    created_at: Optional[str] = None  # 创建时间
    created_by: Optional[str] = "系统"  # 创建人

class EmployeeStatusRequest(BaseModel):
    """员工状态申请请求"""
    employee_id: str
    employee_name: str
    team: str
    status_type: EmployeeStatusType
    shift_type: ShiftType
    start_date: str
    end_date: Optional[str] = None
    reason: Optional[str] = ""

class EmployeeStatusResponse(BaseModel):
    """员工状态响应"""
    records: List[EmployeeStatusRecord]
    summary: Dict[str, Any]
    filter_options: Dict[str, List[str]]

# 班次调整建议相关模型
class ShiftAdjustmentSuggestion(BaseModel):
    """班次调整建议"""
    adjustment_id: str
    adjustment_type: str  # '人员调配', '班次调换', '技能匹配', '紧急替换'
    source_team: str  # 源班组
    target_team: str  # 目标班组
    source_shift: str  # 源班次
    target_shift: str  # 目标班次
    affected_employee: Dict[str, Any]  # 受影响员工信息
    replacement_employee: Optional[Dict[str, Any]] = None  # 替换员工信息
    reason: str  # 调整原因
    efficiency_impact: Dict[str, float]  # 效率影响
    implementation_difficulty: str  # 实施难度 ('低', '中', '高')
    priority_level: int  # 优先级 (1-5, 5最高)
    estimated_time: str  # 预计实施时间
    approval_required: bool = True  # 是否需要审批

class CurrentWorkforceStatus(BaseModel):
    """当前人员在岗情况"""
    team: str  # 班组
    shift_type: str  # 班次
    total_employees: int  # 总人数
    on_duty_employees: int  # 在岗人数
    leave_employees: int  # 请假人数
    rest_employees: int  # 休息人数
    resigned_employees: int  # 辞职人数
    attendance_rate: float  # 出勤率
    capacity_utilization: float  # 产能利用率
    skill_coverage: Dict[str, Dict[str, Any]]  # 技能覆盖情况
    critical_positions: List[Dict[str, Any]]  # 关键岗位缺员情况
    available_for_transfer: List[Dict[str, Any]]  # 可调配人员
    overtime_required: bool = False  # 是否需要加班
    backup_options: List[Dict[str, Any]] = []  # 备选方案

class TeamEfficiencyAnalysis(BaseModel):
    """班组效率分析"""
    team: str
    current_efficiency: float  # 当前效率
    target_efficiency: float  # 目标效率
    efficiency_gap: float  # 效率差距
    bottleneck_positions: List[str]  # 瓶颈岗位
    improvement_opportunities: List[str]  # 改进机会
    resource_recommendations: List[str]  # 资源建议

class WorkforceAnalysisResponse(BaseModel):
    """人员分析响应"""
    current_status: List[CurrentWorkforceStatus]  # 当前状态
    shift_suggestions: List[ShiftAdjustmentSuggestion]  # 班次调整建议
    efficiency_analysis: List[TeamEfficiencyAnalysis]  # 效率分析
    summary_metrics: Dict[str, Any]  # 汇总指标
    alert_notifications: List[Dict[str, Any]]  # 预警通知
