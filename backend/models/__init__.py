"""
模型模块
提供所有数据模型的统一导入入口
"""

# 基础模型
from .base import (
    SchedulingResult,
    TaskData,
    PositionData,
    SkillMatrixData,
    FileUploadResponse,
    DataValidationResponse,
    AlgorithmRule,
    AlgorithmRulesResponse
)

# 排班相关模型
from .scheduling import (
    PositionGroup,
    PositionMatchData,
    LowEfficiencyPosition,
    OptimizationSuggestion,
    TrainingPlan,
    LeaveInfo,
    AdjustmentSuggestion,
    TeamWorkload,
    PerformanceMetrics,
    SchedulingRequest,
    WeeklySchedulingRequest,
    SchedulingResponse,
    WeeklySchedulingResponse
)

# 排产相关模型
from .production import (
    CustomerOrder,
    CapacityPlan,
    ProductionScheduleResult,
    CapacityOptimizationPlan,
    MultiPlanProductionRequest,
    MultiPlanProductionResponse,
    ProductionToSchedulingRequest,
    ProductionToSchedulingResponse,
    ChangeoverTimeData,
    WorkCenterProductionPlan,
    WorkCenterScheduleResult,
    ProductionSchedulingRequest,
    ProductionSchedulingResponse
)

# 员工管理相关模型
from .employee import (
    EmployeeStatusType,
    ShiftType,
    EmployeeStatusRecord,
    EmployeeStatusRequest,
    EmployeeStatusResponse,
    ShiftAdjustmentSuggestion,
    CurrentWorkforceStatus,
    TeamEfficiencyAnalysis,
    WorkforceAnalysisResponse
)

# 导出所有模型，保持向后兼容性
__all__ = [
    # 基础模型
    "SchedulingResult",
    "TaskData", 
    "PositionData",
    "SkillMatrixData",
    "FileUploadResponse",
    "DataValidationResponse",
    "AlgorithmRule",
    "AlgorithmRulesResponse",
    
    # 排班相关模型
    "PositionGroup",
    "PositionMatchData",
    "LowEfficiencyPosition",
    "OptimizationSuggestion", 
    "TrainingPlan",
    "LeaveInfo",
    "AdjustmentSuggestion",
    "TeamWorkload",
    "PerformanceMetrics",
    "SchedulingRequest",
    "WeeklySchedulingRequest",
    "SchedulingResponse",
    "WeeklySchedulingResponse",
    
    # 排产相关模型
    "CustomerOrder",
    "CapacityPlan",
    "ProductionScheduleResult",
    "CapacityOptimizationPlan",
    "MultiPlanProductionRequest",
    "MultiPlanProductionResponse",
    "ProductionToSchedulingRequest",
    "ProductionToSchedulingResponse",
    "ChangeoverTimeData",
    "WorkCenterProductionPlan",
    "WorkCenterScheduleResult",
    "ProductionSchedulingRequest",
    "ProductionSchedulingResponse",
    
    # 员工管理相关模型
    "EmployeeStatusType",
    "ShiftType",
    "EmployeeStatusRecord",
    "EmployeeStatusRequest",
    "EmployeeStatusResponse",
    "ShiftAdjustmentSuggestion",
    "CurrentWorkforceStatus",
    "TeamEfficiencyAnalysis",
    "WorkforceAnalysisResponse"
]
