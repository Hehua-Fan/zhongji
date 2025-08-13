"""
排班路由模块
包含排班相关的所有API接口
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime

from models import (
    SchedulingRequest, SchedulingResponse, WeeklySchedulingRequest, 
    WeeklySchedulingResponse, PositionGroup, LeaveInfo, 
    AdjustmentSuggestion, TeamWorkload
)
from paiban import SchedulingEngine

# 创建路由器
router = APIRouter(prefix="/scheduling", tags=["排班管理"])

# 排班算法引擎 - 将在主应用中注入
scheduling_engine: SchedulingEngine = None

def init_scheduling_engine(engine: SchedulingEngine):
    """初始化排班引擎"""
    global scheduling_engine
    scheduling_engine = engine

@router.post("/day", response_model=SchedulingResponse)
async def perform_day_scheduling(request: SchedulingRequest):
    """执行单日排班"""
    try:
        # 执行排班算法
        results, groups = scheduling_engine.perform_day_scheduling(
            target_date=request.target_date,
            product_code=request.product_code,
            sku_data=request.sku_data,
            position_data=request.position_data,
            skill_data=request.skill_data,
            weekly_assigned_workers=request.weekly_assigned_workers
        )
        
        # 计算性能指标
        position_matching = scheduling_engine.calculate_position_matching(groups)
        work_hour_efficiency = scheduling_engine.calculate_work_hour_efficiency(groups)
        
        performance_metrics = {
            "人岗匹配度": position_matching,
            "工时利用率": work_hour_efficiency
        }
        
        return SchedulingResponse(
            results=results,
            groups=groups,
            performance_metrics=performance_metrics
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"排班失败: {str(e)}")

@router.post("/week", response_model=WeeklySchedulingResponse)
async def perform_weekly_scheduling(request: WeeklySchedulingRequest):
    """执行一周排班"""
    try:
        # 执行一周排班
        weekly_schedule = scheduling_engine.generate_weekly_schedule(
            start_date=request.start_date,
            product_code=request.product_code,
            sku_data=request.sku_data,
            position_data=request.position_data,
            skill_data=request.skill_data
        )
        
        # 转换为响应格式
        response_schedule = {}
        total_results = 0
        total_positions = 0
        
        for date_str, (results, groups) in weekly_schedule.items():
            # 计算性能指标
            position_matching = scheduling_engine.calculate_position_matching(groups)
            work_hour_efficiency = scheduling_engine.calculate_work_hour_efficiency(groups)
            
            performance_metrics = {
                "人岗匹配度": position_matching,
                "工时利用率": work_hour_efficiency
            }
            
            response_schedule[date_str] = SchedulingResponse(
                results=results,
                groups=groups,
                performance_metrics=performance_metrics
            )
            
            total_results += len(results)
            total_positions += len(groups)
        
        summary = {
            "total_days": len(weekly_schedule),
            "total_results": total_results,
            "total_positions": total_positions,
            "avg_daily_results": total_results / len(weekly_schedule) if weekly_schedule else 0
        }
        
        return WeeklySchedulingResponse(
            weekly_schedule=response_schedule,
            summary=summary
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"一周排班失败: {str(e)}")

@router.post("/performance")
async def calculate_performance_metrics(
    groups: List[PositionGroup]
):
    """计算排班性能指标"""
    try:
        position_matching = scheduling_engine.calculate_position_matching(groups)
        work_hour_efficiency = scheduling_engine.calculate_work_hour_efficiency(groups)
        
        return {
            "人岗匹配度": position_matching,
            "工时利用率": work_hour_efficiency
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"性能指标计算失败: {str(e)}")

@router.post("/team-workloads")
async def calculate_team_workloads(
    groups: List[PositionGroup],
    leaves: List[LeaveInfo],
    skill_data: List[List[Any]],
    current_date: str
):
    """计算班组负荷情况"""
    try:
        # 处理技能矩阵数据
        skill_matrix = scheduling_engine.process_skill_matrix(skill_data)
        
        # 计算班组负荷
        workloads = scheduling_engine.calculate_team_workloads(
            groups=groups,
            leaves=leaves,
            skill_matrix=skill_matrix,
            current_date=current_date
        )
        
        return {"team_workloads": workloads}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"班组负荷计算失败: {str(e)}")

@router.post("/leave/submit")
async def submit_leave_request(request_data: dict):
    """提交请假申请并生成调整建议"""
    try:
        # 提取请求数据
        leave_info = LeaveInfo(**request_data.get("leave_info", {}))
        groups = [PositionGroup(**group) for group in request_data.get("groups", [])]
        skill_data = request_data.get("skill_data", [])
        current_date = request_data.get("current_date", "")
        
        # 处理技能矩阵数据
        skill_matrix = scheduling_engine.process_skill_matrix(skill_data)
        
        # 计算班组负荷（将单个请假信息包装成列表）
        leaves = [leave_info]
        workloads = scheduling_engine.calculate_team_workloads(
            groups=groups,
            leaves=leaves,
            skill_matrix=skill_matrix,
            current_date=current_date
        )
        
        # 生成调整建议
        suggestions = scheduling_engine.generate_adjustment_suggestions(
            groups=groups,
            leaves=leaves,
            workloads=workloads,
            skill_matrix=skill_matrix,
            current_date=current_date
        )
        
        return {
            "status": "success",
            "message": f"已处理{leave_info.姓名}的请假申请",
            "leave_info": leave_info.dict(),
            "team_workloads": workloads,
            "adjustment_suggestions": suggestions,
            "analysis_date": current_date
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"请假申请处理失败: {str(e)}")

@router.post("/adjustment/suggestions")
async def generate_adjustment_suggestions(
    request_data: dict
):
    """生成调整建议"""
    try:
        # 提取请求数据
        groups = [PositionGroup(**group) for group in request_data.get("groups", [])]
        leaves = [LeaveInfo(**leave) for leave in request_data.get("leaves", [])]
        skill_data = request_data.get("skill_data", [])
        current_date = request_data.get("current_date", "")
        
        # 处理技能矩阵数据
        skill_matrix = scheduling_engine.process_skill_matrix(skill_data)
        
        # 计算班组负荷
        workloads = scheduling_engine.calculate_team_workloads(
            groups=groups,
            leaves=leaves,
            skill_matrix=skill_matrix,
            current_date=current_date
        )
        
        # 生成调整建议
        suggestions = scheduling_engine.generate_adjustment_suggestions(
            groups=groups,
            leaves=leaves,
            workloads=workloads,
            skill_matrix=skill_matrix,
            current_date=current_date
        )
        
        return {
            "team_workloads": workloads,
            "adjustment_suggestions": suggestions,
            "analysis_date": current_date
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成调整建议失败: {str(e)}")

@router.post("/export/schedule-data")
async def export_schedule_data(
    schedule_type: str,
    schedule_data: Dict[str, Any]
):
    """准备导出数据"""
    try:
        export_data = scheduling_engine.prepare_export_data(schedule_type, schedule_data)
        
        return {
            "schedule_results": export_data["schedule_results"],
            "summary": export_data.get("summary", {}),
            "daily_summary": export_data.get("daily_summary", []),
            "export_time": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出数据准备失败: {str(e)}")

@router.post("/analysis/leave-impact")
async def analyze_leave_impact(
    groups: List[PositionGroup],
    leave_info: LeaveInfo,
    skill_data: List[List[Any]]
):
    """分析请假对排班的影响"""
    try:
        skill_matrix = scheduling_engine.process_skill_matrix(skill_data)
        impact_analysis = scheduling_engine.analyze_leave_impact(groups, leave_info, skill_matrix)
        
        return {
            "impact_analysis": impact_analysis,
            "leave_info": leave_info,
            "analysis_time": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"请假影响分析失败: {str(e)}")

@router.post("/data/filter-positions")
async def filter_positions(
    groups: List[PositionGroup],
    filters: Dict[str, Any]
):
    """筛选岗位组并返回筛选选项"""
    try:
        # 获取筛选选项
        filter_options = scheduling_engine.get_filter_options(groups)
        
        # 应用筛选条件
        filtered_groups = scheduling_engine.filter_position_groups(groups, filters)
        
        return {
            "filtered_groups": filtered_groups,
            "filter_options": filter_options,
            "total_count": len(groups),
            "filtered_count": len(filtered_groups)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"筛选处理失败: {str(e)}")
