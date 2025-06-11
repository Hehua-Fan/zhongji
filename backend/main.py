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
    CustomerOrder
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
