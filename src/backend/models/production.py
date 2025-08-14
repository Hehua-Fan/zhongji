"""
排产相关模型定义
包含生产计划、产能优化、订单管理等相关的数据模型
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from .scheduling import SchedulingResponse

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

# 保留向后兼容的请求和响应模型
class ProductionSchedulingRequest(BaseModel):
    orders: List[Dict[str, Any]]
    production_lines: List[Dict[str, Any]]
    rule: str = "FIFO"

class ProductionSchedulingResponse(BaseModel):
    scheduled_orders: List[Dict[str, Any]]
    line_schedules: Dict[str, List[Dict[str, Any]]]
    metrics: Dict[str, Any]
