"""
排产路由模块
包含排产相关的所有API接口
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime

from models import (
    MultiPlanProductionResponse, MultiPlanProductionRequest, ProductionToSchedulingRequest,
    CustomerOrder, CapacityPlan, ProductionScheduleResult
)
from paichan import ProductionSchedulingEngine

# 创建路由器
router = APIRouter(prefix="/production", tags=["排产管理"])

# 排产算法引擎 - 将在主应用中注入
production_engine: ProductionSchedulingEngine = None

def init_production_engine(engine: ProductionSchedulingEngine):
    """初始化排产引擎"""
    global production_engine
    production_engine = engine

@router.post("/multi-plan", response_model=MultiPlanProductionResponse)
async def multi_plan_production_scheduling(request: MultiPlanProductionRequest):
    """多方案排产优化"""
    try:
        result = production_engine.multi_plan_production_scheduling(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"多方案排产失败: {str(e)}")

@router.post("/integrate-scheduling")
async def integrate_production_to_scheduling(request: ProductionToSchedulingRequest):
    """排产结果集成到排班"""
    try:
        result = production_engine.integrate_production_to_scheduling(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"排产排班集成失败: {str(e)}")

@router.post("/capacity-plans")
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

@router.post("/schedule")
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

@router.post("/optimize")
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

@router.post("/gantt")
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

@router.post("/summary")
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

@router.get("/capacity-config")
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

@router.get("/changeover-time-config")
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

@router.post("/work-center-schedule")
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

@router.get("/box-type-mapping")
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
