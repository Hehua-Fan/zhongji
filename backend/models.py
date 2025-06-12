from typing import List, Dict, Optional, Union, Any
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class SchedulingResult(BaseModel):
    岗位编码: str
    姓名: str
    工号: str
    技能等级: int
    班组: str
    工作中心: str
    日期: str

class TaskData(BaseModel):
    产成品编码: str
    岗位编码: str
    需求人数: int
    箱型: str = ""  # 新增箱型字段
    工作中心: str = ""  # 新增工作中心字段

class PositionData(BaseModel):
    工作中心: str
    岗位编码: str
    岗位技能等级: int

class SkillMatrixData(BaseModel):
    姓名: str
    工号: str
    班组: Optional[str] = None
    # 动态技能等级字段
    skills: Dict[str, Union[str, int]] = {}

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

class ProductionSchedulingRequest(BaseModel):
    orders: List[Dict[str, Any]]
    production_lines: List[Dict[str, Any]]
    rule: str = "FIFO"

# API 响应模型
class SchedulingResponse(BaseModel):
    results: List[SchedulingResult]
    groups: List[PositionGroup]
    performance_metrics: Dict[str, Any]

class WeeklySchedulingResponse(BaseModel):
    weekly_schedule: Dict[str, SchedulingResponse]
    summary: Dict[str, Any]

class ProductionSchedulingResponse(BaseModel):
    scheduled_orders: List[Dict[str, Any]]
    line_schedules: Dict[str, List[Dict[str, Any]]]
    metrics: Dict[str, Any]

# 文件上传响应
class FileUploadResponse(BaseModel):
    message: str
    sku_rows: int
    position_rows: int
    skill_rows: int
    sku_data: List[List[Any]]
    position_data: List[List[Any]]
    skill_data: List[List[Any]]

# 数据验证响应
class DataValidationResponse(BaseModel):
    valid: bool
    records: Optional[int] = None
    message: str

# 算法规则响应
class AlgorithmRule(BaseModel):
    id: str
    name: str
    description: str

class AlgorithmRulesResponse(BaseModel):
    rules: List[AlgorithmRule]

# ====== 新增排产相关模型 ======

# 客户订单模型
class CustomerOrder(BaseModel):
    order_id: str
    customer_name: str
    product_code: str
    quantity: int
    due_date: str  # YYYY-MM-DD
    priority: int = 1  # 1-5, 5最高
    order_date: str
    unit_price: float = 0.0

# 产能方案模型
class CapacityPlan(BaseModel):
    plan_id: str
    plan_name: str
    daily_capacities: Dict[str, int]  # 日期 -> 产能
    is_baseline: bool = False
    cost_coefficient: float = 1.0  # 成本系数

# 排产结果模型
class ProductionScheduleResult(BaseModel):
    order_id: str
    customer_name: str
    product_code: str
    quantity: int
    scheduled_date: str
    capacity_used: int
    completion_date: str
    delay_days: int = 0

# 产能优化方案模型
class CapacityOptimizationPlan(BaseModel):
    plan_id: str
    plan_name: str
    plan_type: str  # 'baseline' | 'optimized'
    weekly_schedule: Dict[str, List[ProductionScheduleResult]]  # 日期 -> 排产结果列表
    total_cost: float
    completion_rate: float  # 按时完成率
    average_delay: float
    capacity_utilization: float
    metrics: Dict[str, Any]

# 多方案排产请求
class MultiPlanProductionRequest(BaseModel):
    orders: List[CustomerOrder]
    baseline_capacity: int = 180
    capacity_variation: int = 10  # 上下浮动范围
    start_date: str  # YYYY-MM-DD
    cost_params: Dict[str, float] = {
        "production_cost_per_unit": 100.0,
        "capacity_increase_cost": 50.0,  # 产能增加每单位成本
        "capacity_decrease_saving": 30.0,  # 产能减少每单位节省
        "delay_penalty": 200.0  # 延误每天每单位罚金
    }

# 多方案排产响应
class MultiPlanProductionResponse(BaseModel):
    baseline_plan: CapacityOptimizationPlan
    optimized_plans: List[CapacityOptimizationPlan]
    recommended_plan: CapacityOptimizationPlan
    comparison_metrics: Dict[str, Any]

# 排产到排班的集成模型
class ProductionToSchedulingRequest(BaseModel):
    selected_plan_id: str
    production_schedule: Dict[str, List[ProductionScheduleResult]]  # 日期 -> 排产结果
    position_data: List[List[Any]]
    skill_data: List[List[Any]]
    
class ProductionToSchedulingResponse(BaseModel):
    daily_schedules: Dict[str, SchedulingResponse]  # 日期 -> 排班结果
    production_plan: Dict[str, List[ProductionScheduleResult]]
    integration_metrics: Dict[str, Any] 

# 转产时间相关模型
class ChangeoverTimeData(BaseModel):
    """转产时间数据模型"""
    from_box_type: str  # 源箱型
    to_box_type: str    # 目标箱型
    work_center: str    # 工作中心
    changeover_time: int  # 转产时间（分钟）
    
class WorkCenterProductionPlan(BaseModel):
    """工作中心生产计划"""
    work_center: str
    date: str
    box_type: str
    start_time: str
    end_time: str
    quantity: int
    product_code: str
    changeover_time: int = 0  # 转产时间

class WorkCenterScheduleResult(BaseModel):
    """按工作中心的排产结果"""
    work_center: str
    daily_plans: Dict[str, List[WorkCenterProductionPlan]]  # 日期 -> 生产计划列表
    total_changeover_time: int  # 总转产时间
    efficiency_metrics: Dict[str, float]  # 效率指标

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

# 新增：班次调整建议相关模型
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