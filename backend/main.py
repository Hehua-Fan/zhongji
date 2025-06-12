"""
FastAPI主服务
提供排班和排产的API接口
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import pandas as pd
import io
import json
from datetime import datetime

from models import (
    SchedulingRequest, SchedulingResponse, WeeklySchedulingRequest, 
    WeeklySchedulingResponse, PerformanceMetrics, SchedulingResult,
    PositionGroup, LeaveInfo, AdjustmentSuggestion, TeamWorkload,
    MultiPlanProductionResponse, MultiPlanProductionRequest, ProductionToSchedulingRequest,
    CustomerOrder, CapacityPlan, ProductionScheduleResult, 
    CapacityOptimizationPlan, MultiPlanProductionResponse,
    ProductionToSchedulingResponse, WorkCenterScheduleResult, WorkCenterProductionPlan,
    EmployeeStatusRecord, EmployeeStatusRequest, EmployeeStatusResponse,
    EmployeeStatusType, ShiftType, ShiftAdjustmentSuggestion, CurrentWorkforceStatus,
    TeamEfficiencyAnalysis, WorkforceAnalysisResponse
)
from paiban import SchedulingEngine
from paichan import ProductionSchedulingEngine

app = FastAPI(
    title="智能排班排产系统",
    description="基于算法的排班和排产服务",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # 前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化算法引擎
scheduling_engine = SchedulingEngine()
production_engine = ProductionSchedulingEngine()

# 全局变量存储员工状态记录（实际应用中应使用数据库）
employee_status_records: List[EmployeeStatusRecord] = []

@app.get("/")
async def root():
    """健康检查"""
    return {"message": "智能排班排产系统 API 服务正常运行"}

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "scheduling_engine": "ready",
            "production_engine": "ready"
        }
    }

# ====== 文件上传处理 ======

async def process_excel_file(file: UploadFile) -> List[List[Any]]:
    """处理上传的Excel文件"""
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # 转换为列表格式
        data = []
        # 添加列标题
        data.append(df.columns.tolist())
        # 添加数据行
        for _, row in df.iterrows():
            data.append(row.tolist())
        
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"文件处理失败: {str(e)}")

@app.post("/upload/excel")
async def upload_excel_files(
    sku_file: UploadFile = File(...),
    position_file: UploadFile = File(...),
    skill_file: UploadFile = File(...)
):
    """上传并处理Excel文件"""
    try:
        # 验证文件类型
        for file in [sku_file, position_file, skill_file]:
            if not file.filename.endswith(('.xlsx', '.xls')):
                raise HTTPException(status_code=400, detail=f"文件 {file.filename} 不是Excel格式")
        
        # 处理文件
        sku_data = await process_excel_file(sku_file)
        position_data = await process_excel_file(position_file)
        skill_data = await process_excel_file(skill_file)
        
        return {
            "message": "文件上传成功",
            "sku_rows": len(sku_data),
            "position_rows": len(position_data),
            "skill_rows": len(skill_data),
            "sku_data": sku_data,
            "position_data": position_data,
            "skill_data": skill_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")

# ====== 排班相关API ======

@app.post("/scheduling/day", response_model=SchedulingResponse)
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

@app.post("/scheduling/week", response_model=WeeklySchedulingResponse)
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

@app.post("/scheduling/performance")
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

@app.post("/scheduling/team-workloads")
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

# ====== 排产相关API ======

@app.post("/production/multi-plan", response_model=MultiPlanProductionResponse)
async def multi_plan_production_scheduling(request: MultiPlanProductionRequest):
    """多方案排产优化"""
    try:
        result = production_engine.multi_plan_production_scheduling(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"多方案排产失败: {str(e)}")

@app.post("/production/integrate-scheduling")
async def integrate_production_to_scheduling(request: ProductionToSchedulingRequest):
    """排产结果集成到排班"""
    try:
        result = production_engine.integrate_production_to_scheduling(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"排产排班集成失败: {str(e)}")

@app.post("/production/capacity-plans")
async def generate_capacity_plans(
    start_date: str,
    baseline_capacity: int = 180,
    capacity_variation: int = 10,
    weeks: int = 4
):
    """生成产能方案"""
    try:
        working_dates = production_engine.get_working_dates(start_date, weeks)
        capacity_plans = production_engine.generate_capacity_plans(
            working_dates, baseline_capacity, capacity_variation
        )
        return {
            "working_dates": working_dates,
            "capacity_plans": [plan.dict() for plan in capacity_plans],
            "total_plans": len(capacity_plans)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"产能方案生成失败: {str(e)}")

@app.post("/production/schedule")
async def schedule_production(
    orders: List[Dict[str, Any]],
    production_lines: List[Dict[str, Any]],
    rule: str = "FIFO"
):
    """执行生产排程 - 保留兼容性"""
    try:
        # 转换为新的订单格式
        customer_orders = []
        for i, order in enumerate(orders):
            customer_order = CustomerOrder(
                order_id=order.get("order_id", f"ORDER_{i+1}"),
                customer_name=order.get("customer_name", f"客户_{i+1}"),
                product_code=order.get("product_code", ""),
                quantity=order.get("quantity", 0),
                due_date=order.get("due_date", ""),
                priority=order.get("priority", 1),
                order_date=order.get("order_date", ""),
                unit_price=order.get("unit_price", 0.0)
            )
            customer_orders.append(customer_order)
        
        # 使用多方案排产
        request = MultiPlanProductionRequest(
            orders=customer_orders,
            start_date=datetime.now().strftime("%Y-%m-%d")
        )
        
        result = production_engine.multi_plan_production_scheduling(request)
        
        # 返回兼容格式
        return {
            "scheduled_orders": [],
            "line_schedules": {},
            "metrics": result.baseline_plan.metrics,
            "multi_plan_result": result.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生产排程失败: {str(e)}")

@app.post("/production/optimize")
async def optimize_production_schedule(
    plan_id: str,
    schedule_result: Dict[str, Any]
):
    """优化生产排程"""
    try:
        # 这里可以实现具体的优化逻辑
        return {
            "message": f"方案 {plan_id} 优化完成",
            "optimized_result": schedule_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"排程优化失败: {str(e)}")

@app.post("/production/gantt")
async def generate_gantt_chart(
    schedule_result: Dict[str, Any]
):
    """生成甘特图数据"""
    try:
        # 从排产结果生成甘特图
        gantt_data = []
        
        if "weekly_schedule" in schedule_result:
            for date, day_results in schedule_result["weekly_schedule"].items():
                for result in day_results:
                    gantt_data.append({
                        "task": result.get("order_id", ""),
                        "customer": result.get("customer_name", ""),
                        "product": result.get("product_code", ""),
                        "date": result.get("scheduled_date", ""),
                        "quantity": result.get("quantity", 0),
                        "capacity_used": result.get("capacity_used", 0)
                    })
        
        return {"gantt_data": gantt_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"甘特图生成失败: {str(e)}")

@app.post("/production/summary")
async def get_production_summary(
    schedule_result: Dict[str, Any]
):
    """获取排程摘要"""
    try:
        if "baseline_plan" in schedule_result:
            plan = schedule_result["baseline_plan"]
            summary = {
                "方案名称": plan.get("plan_name", ""),
                "总成本": f"¥{plan.get('total_cost', 0):,.2f}",
                "完成率": f"{plan.get('completion_rate', 0)*100:.1f}%",
                "平均延误": f"{plan.get('average_delay', 0):.1f}天",
                "产能利用率": f"{plan.get('capacity_utilization', 0)*100:.1f}%",
                "指标详情": plan.get("metrics", {})
            }
        else:
            summary = {"message": "无排程数据"}
        
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"摘要生成失败: {str(e)}")

@app.get("/production/capacity-config")
async def get_capacity_config():
    """获取产能配置数据"""
    try:
        capacity_data = []
        for capacity, config in production_engine.capacity_config.items():
            # 计算成本
            energy_cost = config["能耗"] * 1.0  # 能耗成本=能耗×1 ¥/kWh
            labor_cost = config["人效"] * 360.0  # 人效成本=人效×360 ¥/人
            total_cost = energy_cost + labor_cost  # 总成本=能耗成本+人效成本
            
            capacity_data.append({
                "产能": capacity,
                "节拍": config["节拍"],
                "能耗": config["能耗"],
                "定员": config["定员"],
                "人效": config["人效"],
                "能耗成本": energy_cost,
                "人效成本": labor_cost,
                "总成本": total_cost
            })
        
        # 按产能排序
        capacity_data.sort(key=lambda x: x["产能"])
        
        return {
            "capacity_data": capacity_data,
            "cost_formula": {
                "energy_cost": "能耗成本 = 能耗 × 1 ¥/kWh",
                "labor_cost": "人效成本 = 人效 × 360 ¥/人", 
                "total_cost": "总成本 = 能耗成本 + 人效成本"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取产能配置失败: {str(e)}")

@app.get("/production/changeover-time-config")
async def get_changeover_time_config():
    """获取转产时间配置数据"""
    try:
        # 基于用户提供的转产时间数据表
        changeover_time_data = {
            "HL": {
                "前框": 30,
                "T地板": 30,
                "顶板发泡": 150,
                "侧板发泡": 150,
                "底架发泡": 300,
                "总装": 30,
                "涂装": 15,
                "内装修": 15
            },
            "20尺小箱": {
                "内侧板线": 50,
                "外侧板线": 50,
                "底架线": 45,
                "T地板线": 35,
                "前框线": 35,
                "后框线": 35,
                "顶板发泡": 180,
                "侧板发泡": 260,
                "底架发泡": 190,
                "总装线": 20,
                "涂装线": 19,
                "完工线": 25
            }
        }
        
        # 计算统计信息
        all_times = []
        total_work_centers = set()
        total_records = 0
        
        for box_type, centers in changeover_time_data.items():
            for work_center, time_value in centers.items():
                all_times.append(time_value)
                total_work_centers.add(work_center)
                total_records += 1
        
        statistics = {
            "total_box_types": len(changeover_time_data),
            "total_work_centers": len(total_work_centers),
            "total_records": total_records,
            "min_changeover_time": min(all_times) if all_times else 0,
            "max_changeover_time": max(all_times) if all_times else 0,
            "unit": "分钟"
        }
        
        description = {
            "purpose": "用于排产系统计算不同箱型间的转产时间",
            "includes": "设备调整、工艺调整、调试等过程时间",
            "note": "时间为原始数据，实际转产时间可能有出入"
        }
        
        return {
            "changeover_data": changeover_time_data,
            "statistics": statistics,
            "description": description
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取转产时间配置失败: {str(e)}")

@app.post("/production/work-center-schedule")
async def calculate_work_center_schedule(
    orders: List[Dict[str, Any]],
    capacity_plan: Dict[str, Any],
    sku_data: List[List[Any]] = None
):
    """按工作中心计算排产计划"""
    try:
        # 转换订单格式
        customer_orders = []
        for i, order in enumerate(orders):
            customer_order = CustomerOrder(
                order_id=order.get("order_id", f"ORDER_{i+1}"),
                customer_name=order.get("customer_name", f"客户_{i+1}"),
                product_code=order.get("product_code", ""),
                quantity=order.get("quantity", 0),
                due_date=order.get("due_date", ""),
                priority=order.get("priority", 1),
                order_date=order.get("order_date", ""),
                unit_price=order.get("unit_price", 0.0)
            )
            customer_orders.append(customer_order)
        
        # 转换产能计划格式
        capacity_plan_obj = CapacityPlan(
            plan_id=capacity_plan.get("plan_id", "default"),
            plan_name=capacity_plan.get("plan_name", "默认方案"),
            daily_capacities=capacity_plan.get("daily_capacities", {}),
            is_baseline=capacity_plan.get("is_baseline", True),
            cost_coefficient=capacity_plan.get("cost_coefficient", 1.0)
        )
        
        # 执行按工作中心排产
        work_center_schedules = production_engine.calculate_work_center_schedule(
            customer_orders, 
            capacity_plan_obj, 
            sku_data
        )
        
        return {
            "work_center_schedules": work_center_schedules,
            "summary": {
                "total_work_centers": len(work_center_schedules),
                "total_production_days": len(capacity_plan_obj.daily_capacities),
                "total_orders": len(customer_orders)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"工作中心排产计算失败: {str(e)}")

@app.get("/production/box-type-mapping")
async def get_box_type_mapping():
    """获取产品编码到箱型的映射"""
    try:
        mapping = {
            "C1B010000036": "HL",
            "C1B010000037": "20尺小箱"
        }
        
        return {
            "mapping": mapping,
            "description": "产品编码与箱型对应关系",
            "usage": "用于排产系统识别产品对应的箱型，计算转产时间"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取箱型映射失败: {str(e)}")

# ====== 通用工具API ======

@app.get("/algorithms/scheduling-rules")
async def get_scheduling_rules():
    """获取可用的排班规则"""
    return {
        "rules": [
            {"id": "skill_priority", "name": "技能优先", "description": "优先安排技能等级高的员工"},
            {"id": "team_balance", "name": "班组均衡", "description": "保持班组内人员分配均衡"},
            {"id": "workload_balance", "name": "负荷均衡", "description": "均衡各岗位工作负荷"}
        ]
    }

@app.get("/algorithms/production-rules")
async def get_production_rules():
    """获取可用的排产规则"""
    return {
        "rules": [
            {"id": "FIFO", "name": "先进先出", "description": "按订单接收时间排序"},
            {"id": "SPT", "name": "最短时间优先", "description": "优先安排加工时间短的订单"},
            {"id": "EDD", "name": "最早交期优先", "description": "优先安排交期最近的订单"},
            {"id": "CR", "name": "关键比率优先", "description": "基于剩余时间和加工时间比率排序"}
        ]
    }

@app.post("/data/validate")
async def validate_data(
    data_type: str,
    data: List[List[Any]]
):
    """验证数据格式"""
    try:
        if data_type == "sku":
            processed = scheduling_engine.process_sku_data(data)
            return {"valid": True, "records": len(processed), "message": "SKU数据格式正确"}
        elif data_type == "position":
            processed = scheduling_engine.process_position_data(data)
            return {"valid": True, "records": len(processed), "message": "岗位数据格式正确"}
        elif data_type == "skill":
            processed = scheduling_engine.process_skill_matrix(data)
            return {"valid": True, "records": len(processed), "message": "技能矩阵数据格式正确"}
        else:
            raise HTTPException(status_code=400, detail="不支持的数据类型")
    except Exception as e:
        return {"valid": False, "message": f"数据验证失败: {str(e)}"}

# ====== 请假和调整相关API ======

@app.post("/leave/submit")
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

@app.post("/adjustment/suggestions")
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

@app.post("/data/filter-positions")
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

@app.post("/export/schedule-data")
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

@app.post("/analysis/leave-impact")
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

# ====== 员工状态管理API ======

@app.post("/employee-status/add")
async def add_employee_status(request: EmployeeStatusRequest):
    """添加员工状态记录"""
    try:
        from datetime import datetime
        import uuid
        
        # 创建新的状态记录
        record = EmployeeStatusRecord(
            id=str(uuid.uuid4()),
            employee_id=request.employee_id,
            employee_name=request.employee_name,
            team=request.team,
            status_type=request.status_type,
            shift_type=request.shift_type,
            start_date=request.start_date,
            end_date=request.end_date,
            reason=request.reason,
            created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            created_by="系统管理员"
        )
        
        employee_status_records.append(record)
        
        return {
            "success": True,
            "message": "员工状态记录添加成功",
            "record": record
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"添加员工状态记录失败: {str(e)}")

@app.get("/employee-status/list", response_model=EmployeeStatusResponse)
async def get_employee_status_list(
    status_type: Optional[str] = None,
    shift_type: Optional[str] = None,
    team: Optional[str] = None,
    employee_id: Optional[str] = None
):
    """获取员工状态记录列表"""
    try:
        # 过滤记录
        filtered_records = employee_status_records.copy()
        
        if status_type and status_type != "全部":
            filtered_records = [r for r in filtered_records if r.status_type == status_type]
        
        if shift_type and shift_type != "全部":
            filtered_records = [r for r in filtered_records if r.shift_type == shift_type]
            
        if team and team != "全部":
            filtered_records = [r for r in filtered_records if r.team == team]
            
        if employee_id:
            filtered_records = [r for r in filtered_records if employee_id.lower() in r.employee_id.lower()]
        
        # 按创建时间倒序排列
        filtered_records.sort(key=lambda x: x.created_at or "", reverse=True)
        
        # 计算统计信息
        total_records = len(filtered_records)
        leave_count = len([r for r in filtered_records if r.status_type == EmployeeStatusType.LEAVE])
        resignation_count = len([r for r in filtered_records if r.status_type == EmployeeStatusType.RESIGNATION])
        rest_count = len([r for r in filtered_records if r.status_type == EmployeeStatusType.REST])
        
        day_shift_count = len([r for r in filtered_records if r.shift_type == ShiftType.DAY_SHIFT])
        night_shift_count = len([r for r in filtered_records if r.shift_type == ShiftType.NIGHT_SHIFT])
        
        # 获取筛选选项
        all_teams = list(set([r.team for r in employee_status_records if r.team]))
        all_status_types = [e.value for e in EmployeeStatusType]
        all_shift_types = [e.value for e in ShiftType]
        
        summary = {
            "total_records": total_records,
            "leave_count": leave_count,
            "resignation_count": resignation_count,
            "rest_count": rest_count,
            "day_shift_count": day_shift_count,
            "night_shift_count": night_shift_count
        }
        
        filter_options = {
            "teams": all_teams,
            "status_types": all_status_types,
            "shift_types": all_shift_types
        }
        
        return EmployeeStatusResponse(
            records=filtered_records,
            summary=summary,
            filter_options=filter_options
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取员工状态记录失败: {str(e)}")

@app.delete("/employee-status/{record_id}")
async def delete_employee_status(record_id: str):
    """删除员工状态记录"""
    try:
        global employee_status_records
        
        # 查找并删除记录
        original_count = len(employee_status_records)
        employee_status_records = [r for r in employee_status_records if r.id != record_id]
        
        if len(employee_status_records) == original_count:
            raise HTTPException(status_code=404, detail="未找到指定的员工状态记录")
        
        return {
            "success": True,
            "message": "员工状态记录删除成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除员工状态记录失败: {str(e)}")

@app.get("/employee-status/employees")
async def get_available_employees():
    """获取可用员工列表"""
    try:
        # 模拟员工数据（实际应用中从数据库获取）
        employees = [
            {"employee_id": "55738", "name": "张舒畅", "team": "东冷A"},
            {"employee_id": "57804", "name": "王志鹏", "team": "东冷A"},
            {"employee_id": "55119", "name": "白森林", "team": "底板B"},
            {"employee_id": "57890", "name": "李明", "team": "东冷A"},
            {"employee_id": "58901", "name": "王小华", "team": "底板B"},
            {"employee_id": "59012", "name": "刘强", "team": "东冷A"},
            {"employee_id": "60123", "name": "赵六", "team": "底板B"},
            {"employee_id": "61234", "name": "钱七", "team": "东冷A"},
            {"employee_id": "62345", "name": "孙八", "team": "底板B"},
            {"employee_id": "63456", "name": "周九", "team": "东冷A"},
            {"employee_id": "64567", "name": "吴十", "team": "底板B"},
            {"employee_id": "65678", "name": "郑十一", "team": "东冷A"},
            {"employee_id": "66789", "name": "王十二", "team": "底板B"},
            {"employee_id": "67890", "name": "冯十三", "team": "东冷A"},
            {"employee_id": "68901", "name": "陈十四", "team": "底板B"},
            {"employee_id": "69012", "name": "褚十五", "team": "东冷A"},
            {"employee_id": "70123", "name": "卫十六", "team": "底板B"},
            {"employee_id": "71234", "name": "蒋十七", "team": "东冷A"},
            {"employee_id": "72345", "name": "沈十八", "team": "底板B"},
            {"employee_id": "73456", "name": "韩十九", "team": "东冷A"}
        ]
        
        return {"employees": employees}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取员工列表失败: {str(e)}")

# ====== 新增：人员分析和班次调整建议 ======

@app.post("/workforce/analysis", response_model=WorkforceAnalysisResponse)
async def analyze_workforce_status(
    position_groups: List[PositionGroup] = [],
    employee_status_records: List[EmployeeStatusRecord] = [],
    target_date: str = None
):
    """分析当前人员在岗情况和生成班次调整建议"""
    try:
        from datetime import datetime, date
        
        if not target_date:
            target_date = datetime.now().strftime("%Y-%m-%d")
        
        # 分析当前人员状态
        current_status = _analyze_current_workforce_status(position_groups, employee_status_records, target_date)
        
        # 生成班次调整建议
        shift_suggestions = _generate_shift_adjustment_suggestions(current_status, position_groups, employee_status_records)
        
        # 效率分析
        efficiency_analysis = _analyze_team_efficiency(current_status, position_groups)
        
        # 汇总指标
        summary_metrics = _calculate_workforce_summary_metrics(current_status)
        
        # 预警通知
        alert_notifications = _generate_alert_notifications(current_status, shift_suggestions)
        
        return WorkforceAnalysisResponse(
            current_status=current_status,
            shift_suggestions=shift_suggestions,
            efficiency_analysis=efficiency_analysis,
            summary_metrics=summary_metrics,
            alert_notifications=alert_notifications
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"人员分析失败: {str(e)}")

def _analyze_current_workforce_status(position_groups, employee_status_records, target_date):
    """分析当前人员在岗情况"""
    teams = {}
    
    # 从排班数据中获取团队信息
    for group in position_groups:
        team = group.班组
        if team not in teams:
            teams[team] = {
                '白班': {'total': 0, 'on_duty': 0, 'leave': 0, 'rest': 0, 'resigned': 0, 'employees': []},
                '夜班': {'total': 0, 'on_duty': 0, 'leave': 0, 'rest': 0, 'resigned': 0, 'employees': []}
            }
        
        # 统计员工
        for employee in group.员工列表:
            teams[team]['白班']['total'] += 1
            teams[team]['白班']['on_duty'] += 1
            teams[team]['白班']['employees'].append(employee)
    
    # 处理员工状态记录
    for record in employee_status_records:
        team = record.team
        shift = record.shift_type.value if hasattr(record.shift_type, 'value') else record.shift_type
        
        if team in teams and shift in teams[team]:
            teams[team][shift]['on_duty'] -= 1
            if record.status_type.value == "请假" if hasattr(record.status_type, 'value') else record.status_type == "请假":
                teams[team][shift]['leave'] += 1
            elif record.status_type.value == "休息" if hasattr(record.status_type, 'value') else record.status_type == "休息":
                teams[team][shift]['rest'] += 1
            elif record.status_type.value == "辞职" if hasattr(record.status_type, 'value') else record.status_type == "辞职":
                teams[team][shift]['resigned'] += 1
    
    # 生成分析结果
    current_status = []
    for team, shifts in teams.items():
        for shift_type, stats in shifts.items():
            if stats['total'] > 0:  # 只有有人员的班次才显示
                attendance_rate = stats['on_duty'] / stats['total'] if stats['total'] > 0 else 0
                capacity_utilization = attendance_rate * 0.85  # 假设满勤时利用率为85%
                
                # 技能覆盖分析
                skill_coverage = {
                    "技能4级": {"人数": max(0, stats['on_duty'] // 3), "覆盖率": 0.8},
                    "技能3级": {"人数": max(0, stats['on_duty'] // 2), "覆盖率": 0.9},
                    "技能2级": {"人数": stats['on_duty'], "覆盖率": 1.0}
                }
                
                # 关键岗位缺员情况
                critical_positions = []
                if attendance_rate < 0.8:
                    critical_positions.append({
                        "岗位": f"{team}-{shift_type}关键岗位",
                        "缺员数": stats['total'] - stats['on_duty'],
                        "影响程度": "高" if attendance_rate < 0.6 else "中"
                    })
                
                # 可调配人员
                available_for_transfer = []
                if stats['on_duty'] > stats['total'] * 0.8:  # 如果人员充足
                    surplus = max(0, stats['on_duty'] - int(stats['total'] * 0.8))
                    for i in range(min(surplus, 2)):  # 最多2人可调配
                        available_for_transfer.append({
                            "工号": f"T{team}{i+1:02d}",
                            "姓名": f"{team}员工{i+1}",
                            "技能等级": 3,
                            "可调配到": "其他班组"
                        })
                
                current_status.append(CurrentWorkforceStatus(
                    team=team,
                    shift_type=shift_type,
                    total_employees=stats['total'],
                    on_duty_employees=stats['on_duty'],
                    leave_employees=stats['leave'],
                    rest_employees=stats['rest'],
                    resigned_employees=stats['resigned'],
                    attendance_rate=attendance_rate,
                    capacity_utilization=capacity_utilization,
                    skill_coverage=skill_coverage,
                    critical_positions=critical_positions,
                    available_for_transfer=available_for_transfer,
                    overtime_required=attendance_rate < 0.7,
                    backup_options=[
                        {"方案": "临时调配", "可行性": "高" if len(available_for_transfer) > 0 else "低"},
                        {"方案": "加班安排", "可行性": "中"},
                        {"方案": "外援支持", "可行性": "低"}
                    ]
                ))
    
    return current_status

def _generate_shift_adjustment_suggestions(current_status, position_groups, employee_status_records):
    """生成班次调整建议"""
    suggestions = []
    suggestion_id = 1
    
    # 分析缺员和富余情况
    understaffed_teams = []
    overstaffed_teams = []
    
    for status in current_status:
        if status.attendance_rate < 0.7:  # 出勤率低于70%
            understaffed_teams.append(status)
        elif status.attendance_rate > 0.9 and len(status.available_for_transfer) > 0:  # 出勤率高且有可调配人员
            overstaffed_teams.append(status)
    
    # 生成调配建议
    for understaffed in understaffed_teams:
        for overstaffed in overstaffed_teams:
            if understaffed.team != overstaffed.team and len(overstaffed.available_for_transfer) > 0:
                for available_person in overstaffed.available_for_transfer[:1]:  # 每次建议最多1人
                    suggestions.append(ShiftAdjustmentSuggestion(
                        adjustment_id=f"ADJ{suggestion_id:03d}",
                        adjustment_type="人员调配",
                        source_team=overstaffed.team,
                        target_team=understaffed.team,
                        source_shift=overstaffed.shift_type,
                        target_shift=understaffed.shift_type,
                        affected_employee={
                            "工号": available_person["工号"],
                            "姓名": available_person["姓名"],
                            "当前班组": overstaffed.team,
                            "技能等级": available_person["技能等级"]
                        },
                        replacement_employee=None,
                        reason=f"{understaffed.team}班组出勤率较低({understaffed.attendance_rate:.1%})，需要人员支援",
                        efficiency_impact={
                            "源班组影响": -5.0,  # 源班组效率轻微下降
                            "目标班组影响": 15.0,  # 目标班组效率显著提升
                            "整体影响": 8.0
                        },
                        implementation_difficulty="中",
                        priority_level=4 if understaffed.attendance_rate < 0.6 else 3,
                        estimated_time="2小时",
                        approval_required=True
                    ))
                    suggestion_id += 1
    
    # 生成班次调换建议
    for status in current_status:
        if status.leave_employees > 0 and status.shift_type == "白班":
            # 查找夜班是否有可调配人员
            night_shift_status = next((s for s in current_status if s.team == status.team and s.shift_type == "夜班"), None)
            if night_shift_status and len(night_shift_status.available_for_transfer) > 0:
                for available_person in night_shift_status.available_for_transfer[:1]:
                    suggestions.append(ShiftAdjustmentSuggestion(
                        adjustment_id=f"ADJ{suggestion_id:03d}",
                        adjustment_type="班次调换",
                        source_team=status.team,
                        target_team=status.team,
                        source_shift="夜班",
                        target_shift="白班",
                        affected_employee={
                            "工号": available_person["工号"],
                            "姓名": available_person["姓名"],
                            "当前班次": "夜班",
                            "技能等级": available_person["技能等级"]
                        },
                        replacement_employee=None,
                        reason=f"白班有{status.leave_employees}人请假，夜班人员充足可调换",
                        efficiency_impact={
                            "夜班影响": -3.0,
                            "白班影响": 12.0,
                            "整体影响": 6.0
                        },
                        implementation_difficulty="低",
                        priority_level=3,
                        estimated_time="1小时",
                        approval_required=False
                    ))
                    suggestion_id += 1
    
    return suggestions

def _analyze_team_efficiency(current_status, position_groups):
    """分析班组效率"""
    efficiency_analysis = []
    
    for status in current_status:
        current_eff = status.capacity_utilization * 100
        target_eff = 85.0  # 目标效率85%
        gap = target_eff - current_eff
        
        bottlenecks = []
        improvements = []
        recommendations = []
        
        if status.attendance_rate < 0.8:
            bottlenecks.append("人员出勤不足")
            improvements.append("提高出勤率")
            recommendations.append("建立激励机制，减少请假")
        
        if len(status.critical_positions) > 0:
            bottlenecks.append("关键岗位缺员")
            improvements.append("关键岗位人员补充")
            recommendations.append("优先调配技能匹配人员")
        
        if status.overtime_required:
            improvements.append("合理安排加班")
            recommendations.append("制定加班计划，确保人员休息")
        
        efficiency_analysis.append(TeamEfficiencyAnalysis(
            team=f"{status.team}-{status.shift_type}",
            current_efficiency=current_eff,
            target_efficiency=target_eff,
            efficiency_gap=gap,
            bottleneck_positions=bottlenecks,
            improvement_opportunities=improvements,
            resource_recommendations=recommendations
        ))
    
    return efficiency_analysis

def _calculate_workforce_summary_metrics(current_status):
    """计算人员汇总指标"""
    total_employees = sum(s.total_employees for s in current_status)
    total_on_duty = sum(s.on_duty_employees for s in current_status)
    total_leave = sum(s.leave_employees for s in current_status)
    total_rest = sum(s.rest_employees for s in current_status)
    total_resigned = sum(s.resigned_employees for s in current_status)
    
    overall_attendance = total_on_duty / total_employees if total_employees > 0 else 0
    overall_capacity = sum(s.capacity_utilization * s.total_employees for s in current_status) / total_employees if total_employees > 0 else 0
    
    teams_needing_support = len([s for s in current_status if s.attendance_rate < 0.7])
    teams_with_surplus = len([s for s in current_status if len(s.available_for_transfer) > 0])
    
    return {
        "总人数": total_employees,
        "在岗人数": total_on_duty,
        "请假人数": total_leave,
        "休息人数": total_rest,
        "辞职人数": total_resigned,
        "总体出勤率": overall_attendance,
        "总体产能利用率": overall_capacity,
        "需要支援班组数": teams_needing_support,
        "可提供支援班组数": teams_with_surplus,
        "人员调配可行性": "高" if teams_with_surplus >= teams_needing_support else "中" if teams_with_surplus > 0 else "低"
    }

def _generate_alert_notifications(current_status, shift_suggestions):
    """生成预警通知"""
    alerts = []
    
    # 出勤率预警
    for status in current_status:
        if status.attendance_rate < 0.6:
            alerts.append({
                "类型": "紧急预警",
                "级别": "高",
                "内容": f"{status.team}-{status.shift_type}班组出勤率严重不足({status.attendance_rate:.1%})",
                "建议": "立即调配人员或安排加班",
                "时间": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
        elif status.attendance_rate < 0.7:
            alerts.append({
                "类型": "注意预警",
                "级别": "中",
                "内容": f"{status.team}-{status.shift_type}班组出勤率偏低({status.attendance_rate:.1%})",
                "建议": "考虑人员调配或关注请假情况",
                "时间": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
    
    # 关键岗位缺员预警
    for status in current_status:
        if len(status.critical_positions) > 0:
            for pos in status.critical_positions:
                alerts.append({
                    "类型": "岗位预警",
                    "级别": "高" if pos["影响程度"] == "高" else "中",
                    "内容": f"{pos['岗位']}缺员{pos['缺员数']}人",
                    "建议": "紧急调配具备相应技能的人员",
                    "时间": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
    
    # 调整建议预警
    high_priority_suggestions = [s for s in shift_suggestions if s.priority_level >= 4]
    if len(high_priority_suggestions) > 0:
        alerts.append({
            "类型": "调整建议",
            "级别": "中",
            "内容": f"有{len(high_priority_suggestions)}个高优先级班次调整建议待处理",
            "建议": "及时审核和执行人员调配方案",
            "时间": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
    
    return alerts

@app.get("/workforce/quick-status")
async def get_quick_workforce_status():
    """获取人员状态快速概览"""
    try:
        # 基于实际的员工状态记录计算快速状态
        if not employee_status_records:
            return {
                "总体状况": {
                    "总人数": 0,
                    "在岗人数": 0,
                    "出勤率": 0.0,
                    "产能利用率": 0.0
                },
                "班组状况": [],
                "紧急情况": [],
                "调配建议数": 0,
                "更新时间": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
        
        # 统计各班组的状况
        team_stats = {}
        total_employees = 0
        
        # 从员工状态记录中统计
        for record in employee_status_records:
            team = record.team
            shift = record.shift_type.value if hasattr(record.shift_type, 'value') else record.shift_type
            
            if team not in team_stats:
                team_stats[team] = {
                    "白班在岗": 0,
                    "夜班在岗": 0,
                    "白班总数": 0, 
                    "夜班总数": 0,
                    "状态": "正常"
                }
            
            # 增加总数
            if shift == "白班":
                team_stats[team]["白班总数"] += 1
            else:
                team_stats[team]["夜班总数"] += 1
            
            total_employees += 1
            
            # 如果是请假、辞职或休息，则减少在岗人数
            status = record.status_type.value if hasattr(record.status_type, 'value') else record.status_type
            if status not in ["请假", "辞职", "休息"]:
                if shift == "白班":
                    team_stats[team]["白班在岗"] += 1
                else:
                    team_stats[team]["夜班在岗"] += 1
        
        # 假设有一些基础员工（如果没有记录的话）
        if not team_stats:
            team_stats = {
                "东冷A": {"白班在岗": 0, "夜班在岗": 0, "白班总数": 0, "夜班总数": 0, "状态": "正常"},
                "底板B": {"白班在岗": 0, "夜班在岗": 0, "白班总数": 0, "夜班总数": 0, "状态": "正常"}
            }
        
        # 计算总体在岗人数
        total_on_duty = sum(team["白班在岗"] + team["夜班在岗"] for team in team_stats.values())
        total_count = max(total_employees, sum(team["白班总数"] + team["夜班总数"] for team in team_stats.values()))
        
        # 如果总数为0，假设一些基础人数
        if total_count == 0:
            total_count = 20
            total_on_duty = 20
        
        attendance_rate = total_on_duty / total_count if total_count > 0 else 0
        capacity_utilization = attendance_rate * 0.85  # 假设满勤时利用率为85%
        
        # 构建班组状况列表
        team_status_list = []
        for team_name, stats in team_stats.items():
            # 判断状态
            team_total = stats["白班总数"] + stats["夜班总数"]
            team_on_duty = stats["白班在岗"] + stats["夜班在岗"]
            team_rate = team_on_duty / team_total if team_total > 0 else 1.0
            
            team_status_list.append({
                "班组": team_name,
                "白班在岗": stats["白班在岗"],
                "夜班在岗": stats["夜班在岗"],
                "状态": "正常" if team_rate >= 0.8 else "缺员"
            })
        
        # 检查紧急情况
        emergency_situations = []
        leave_count = len([r for r in employee_status_records if 
                          (r.status_type.value if hasattr(r.status_type, 'value') else r.status_type) == "请假"])
        resignation_count = len([r for r in employee_status_records if 
                               (r.status_type.value if hasattr(r.status_type, 'value') else r.status_type) == "辞职"])
        
        if attendance_rate < 0.7:
            emergency_situations.append("整体出勤率偏低")
        if resignation_count > 2:
            emergency_situations.append("辞职人数较多")
            
        # 调配建议数（基于实际需要）
        suggestion_count = 0
        if leave_count > 0:
            suggestion_count += 1
        if attendance_rate < 0.8:
            suggestion_count += 1
        
        quick_status = {
            "总体状况": {
                "总人数": total_count,
                "在岗人数": total_on_duty,
                "出勤率": attendance_rate,
                "产能利用率": capacity_utilization
            },
            "班组状况": team_status_list,
            "紧急情况": emergency_situations,
            "调配建议数": suggestion_count,
            "更新时间": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return quick_status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取快速状态失败: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
