from typing import List, Dict, Optional, Union, Any
from pydantic import BaseModel
from datetime import datetime

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