"""
排产算法模块
实现多客户排产和产能优化的核心算法逻辑
"""

from typing import List, Dict, Optional, Union, Any, Tuple
from models import (
    CustomerOrder, CapacityPlan, ProductionScheduleResult, 
    CapacityOptimizationPlan, MultiPlanProductionRequest,
    MultiPlanProductionResponse, ProductionToSchedulingRequest,
    ProductionToSchedulingResponse
)
from datetime import datetime, timedelta
import itertools
import uuid

class ProductionSchedulingEngine:
    """多客户排产算法引擎"""
    
    def __init__(self):
        self.working_days = [0, 1, 2, 3, 4, 5]  # 周一到周六
        self.rest_day = 6  # 周日休息
        
        # 产能配置数据映射（根据用户提供的表格数据）
        self.capacity_config = {
            80: {"节拍": 518, "能耗": 960, "定员": 355, "人效": 4.43},
            90: {"节拍": 460, "能耗": 790, "定员": 399, "人效": 4.43},
            100: {"节拍": 414, "能耗": 741, "定员": 444, "人效": 4.44},
            110: {"节拍": 376, "能耗": 880, "定员": 498, "人效": 4.53},
            120: {"节拍": 345, "能耗": 669, "定员": 543, "人效": 4.52},
            130: {"节拍": 318, "能耗": 760, "定员": 620, "人效": 4.77},
            140: {"节拍": 296, "能耗": 728, "定员": 667, "人效": 4.77},
            150: {"节拍": 276, "能耗": 700, "定员": 715, "人效": 4.77},
            160: {"节拍": 259, "能耗": 675, "定员": 763, "人效": 4.77},
            170: {"节拍": 243, "能耗": 678, "定员": 838, "人效": 4.93},
            180: {"节拍": 230, "能耗": 658, "定员": 864, "人效": 4.8},
            190: {"节拍": 218, "能耗": 658, "定员": 912, "人效": 4.8},
            200: {"节拍": 207, "能耗": 622, "定员": 980, "人效": 4.9},
            220: {"节拍": 376, "能耗": 880, "定员": 1078, "人效": 4.9},
            240: {"节拍": 345, "能耗": 669, "定员": 1135, "人效": 4.73},
            260: {"节拍": 318, "能耗": 760, "定员": 1230, "人效": 4.73}
        }
    
    def is_working_day(self, date: datetime) -> bool:
        """判断是否为工作日"""
        return date.weekday() in self.working_days
    
    def get_working_dates(self, start_date: str, weeks: int = 4) -> List[str]:
        """获取工作日列表"""
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        working_dates = []
        
        current_date = start_dt
        total_days = weeks * 7
        
        for _ in range(total_days):
            if self.is_working_day(current_date):
                working_dates.append(current_date.strftime("%Y-%m-%d"))
            current_date += timedelta(days=1)
        
        return working_dates
    
    def generate_capacity_plans(
        self, 
        working_dates: List[str], 
        baseline_capacity: int, 
        variation: int
    ) -> List[CapacityPlan]:
        """生成产能方案"""
        # 使用预定义的产能配置（170、180、190）
        capacity_options = [170, 180, 190]
        
        plans = []
        
        # 基准方案 - 使用180产能
        baseline_plan = CapacityPlan(
            plan_id="baseline",
            plan_name="基准方案(产能180)",
            daily_capacities={date: 180 for date in working_dates},
            is_baseline=True,
            cost_coefficient=1.0
        )
        plans.append(baseline_plan)
        
        # 生成优化方案
        plan_count = 0
        
        # 策略1: 低成本方案 - 使用170产能
        low_cost_plan = CapacityPlan(
            plan_id=f"optimized_{plan_count}",
            plan_name="低成本方案(产能170)",
            daily_capacities={date: 170 for date in working_dates},
            is_baseline=False,
            cost_coefficient=0.85
        )
        plans.append(low_cost_plan)
        plan_count += 1
        
        # 策略2: 高效方案 - 使用190产能
        high_efficiency_plan = CapacityPlan(
            plan_id=f"optimized_{plan_count}",
            plan_name="高效方案(产能190)",
            daily_capacities={date: 190 for date in working_dates},
            is_baseline=False,
            cost_coefficient=1.15
        )
        plans.append(high_efficiency_plan)
        plan_count += 1
        
        # 策略3: 混合方案 - 前期高产能，后期低产能
        mixed_plan_1 = CapacityPlan(
            plan_id=f"optimized_{plan_count}",
            plan_name="前高后低混合方案",
            daily_capacities={},
            is_baseline=False,
            cost_coefficient=1.0
        )
        for i, date in enumerate(working_dates):
            if i < len(working_dates) // 2:
                mixed_plan_1.daily_capacities[date] = 190  # 前期高产能
            else:
                mixed_plan_1.daily_capacities[date] = 170  # 后期低产能
        plans.append(mixed_plan_1)
        plan_count += 1
        
        # 策略4: 波动方案 - 交替使用不同产能
        wave_plan = CapacityPlan(
            plan_id=f"optimized_{plan_count}",
            plan_name="波动调节方案",
            daily_capacities={},
            is_baseline=False,
            cost_coefficient=0.95
        )
        for i, date in enumerate(working_dates):
            capacity_idx = i % 3  # 循环使用三种产能
            wave_plan.daily_capacities[date] = capacity_options[capacity_idx]
        plans.append(wave_plan)
        plan_count += 1
        
        # 策略5: 周期性方案 - 按周调整
        weekly_plan = CapacityPlan(
            plan_id=f"optimized_{plan_count}",
            plan_name="周期性调整方案",
            daily_capacities={},
            is_baseline=False,
            cost_coefficient=1.05
        )
        for i, date in enumerate(working_dates):
            week_num = i // 6  # 每6个工作日为一周
            capacity_idx = week_num % 3
            weekly_plan.daily_capacities[date] = capacity_options[capacity_idx]
        plans.append(weekly_plan)
        
        return plans
    
    def calculate_production_schedule(
        self, 
        orders: List[CustomerOrder], 
        capacity_plan: CapacityPlan,
        cost_params: Dict[str, float]
    ) -> CapacityOptimizationPlan:
        """计算特定产能方案的排产结果"""
        
        # 按优先级和交期排序订单
        sorted_orders = sorted(orders, key=lambda x: (
            -x.priority,  # 优先级降序
            x.due_date,   # 交期升序
            x.order_date  # 订单日期升序
        ))
        
        scheduled_results = []
        daily_capacity_used = {date: 0 for date in capacity_plan.daily_capacities.keys()}
        
        for order in sorted_orders:
            # 寻找最早可安排的日期
            remaining_quantity = order.quantity
            current_results = []
            
            for date in sorted(capacity_plan.daily_capacities.keys()):
                if remaining_quantity <= 0:
                    break
                
                available_capacity = capacity_plan.daily_capacities[date] - daily_capacity_used[date]
                if available_capacity <= 0:
                    continue
                
                # 安排生产
                quantity_to_schedule = min(remaining_quantity, available_capacity)
                
                result = ProductionScheduleResult(
                    order_id=order.order_id,
                    customer_name=order.customer_name,
                    product_code=order.product_code,
                    quantity=quantity_to_schedule,
                    scheduled_date=date,
                    capacity_used=quantity_to_schedule,
                    completion_date=date,
                    delay_days=max(0, (datetime.strptime(date, "%Y-%m-%d") - 
                                     datetime.strptime(order.due_date, "%Y-%m-%d")).days)
                )
                
                current_results.append(result)
                daily_capacity_used[date] += quantity_to_schedule
                remaining_quantity -= quantity_to_schedule
            
            scheduled_results.extend(current_results)
        
        # 计算方案指标
        total_orders = len(orders)
        completed_orders = len(set(r.order_id for r in scheduled_results))
        
        total_cost = self._calculate_total_cost(
            scheduled_results, capacity_plan, cost_params
        )
        
        # 计算成本明细
        cost_breakdown = self._calculate_cost_breakdown(
            scheduled_results, capacity_plan, cost_params
        )
        
        completion_rate = completed_orders / total_orders if total_orders > 0 else 0
        
        delay_days = [r.delay_days for r in scheduled_results]
        average_delay = sum(delay_days) / len(delay_days) if delay_days else 0
        
        total_capacity = sum(capacity_plan.daily_capacities.values())
        used_capacity = sum(r.capacity_used for r in scheduled_results)
        capacity_utilization = used_capacity / total_capacity if total_capacity > 0 else 0
        
        # 按日期组织排产结果
        weekly_schedule = {}
        for result in scheduled_results:
            date = result.scheduled_date
            if date not in weekly_schedule:
                weekly_schedule[date] = []
            weekly_schedule[date].append(result)
        
        return CapacityOptimizationPlan(
            plan_id=capacity_plan.plan_id,
            plan_name=capacity_plan.plan_name,
            plan_type="baseline" if capacity_plan.is_baseline else "optimized",
            weekly_schedule=weekly_schedule,
            total_cost=total_cost,
            completion_rate=completion_rate,
            average_delay=average_delay,
            capacity_utilization=capacity_utilization,
            metrics={
                "total_orders": total_orders,
                "completed_orders": completed_orders,
                "total_quantity": sum(o.quantity for o in orders),
                "scheduled_quantity": used_capacity,
                "on_time_orders": sum(1 for r in scheduled_results if r.delay_days == 0),
                "delayed_orders": sum(1 for r in scheduled_results if r.delay_days > 0),
                "cost_breakdown": cost_breakdown
            }
        )
    
    def _calculate_total_cost(
        self,
        results: List[ProductionScheduleResult],
        capacity_plan: CapacityPlan,
        cost_params: Dict[str, float]
    ) -> float:
        """计算总成本 - 根据新的公式：能耗成本=能耗×1 ¥/kWh，人效成本=人效×360 ¥/人"""
        total_energy_cost = 0
        total_labor_cost = 0
        
        # 计算每日的能耗成本和人效成本
        for date, capacity in capacity_plan.daily_capacities.items():
            if capacity in self.capacity_config:
                config = self.capacity_config[capacity]
                # 能耗成本 = 能耗 × 1 ¥/kWh
                energy_cost = config["能耗"] * 1.0
                # 人效成本 = 人效 × 360 ¥/人  
                labor_cost = config["人效"] * 360.0
                
                total_energy_cost += energy_cost
                total_labor_cost += labor_cost
            else:
                # 如果没有匹配的产能配置，使用线性插值或基准值
                baseline_config = self.capacity_config.get(180, {"能耗": 658, "人效": 4.8})
                energy_cost = baseline_config["能耗"] * 1.0
                labor_cost = baseline_config["人效"] * 360.0
                
                total_energy_cost += energy_cost
                total_labor_cost += labor_cost
        
        # 总成本 = 能耗成本 + 人效成本（去掉延误罚金）
        return total_energy_cost + total_labor_cost
    
    def _calculate_cost_breakdown(
        self,
        results: List[ProductionScheduleResult],
        capacity_plan: CapacityPlan,
        cost_params: Dict[str, float]
    ) -> Dict[str, float]:
        """计算成本明细"""
        total_energy_cost = 0
        total_labor_cost = 0
        
        # 计算每日的能耗成本和人效成本
        for date, capacity in capacity_plan.daily_capacities.items():
            if capacity in self.capacity_config:
                config = self.capacity_config[capacity]
                # 能耗成本 = 能耗 × 1 ¥/kWh
                energy_cost = config["能耗"] * 1.0
                # 人效成本 = 人效 × 360 ¥/人  
                labor_cost = config["人效"] * 360.0
                
                total_energy_cost += energy_cost
                total_labor_cost += labor_cost
            else:
                # 如果没有匹配的产能配置，使用基准值
                baseline_config = self.capacity_config.get(180, {"能耗": 658, "人效": 4.8})
                energy_cost = baseline_config["能耗"] * 1.0
                labor_cost = baseline_config["人效"] * 360.0
                
                total_energy_cost += energy_cost
                total_labor_cost += labor_cost
        
        return {
            "energy_cost": total_energy_cost,
            "labor_cost": total_labor_cost,
            "total_cost": total_energy_cost + total_labor_cost
        }
    
    def multi_plan_production_scheduling(
        self, 
        request: MultiPlanProductionRequest
    ) -> MultiPlanProductionResponse:
        """多方案排产优化"""
        
        # 获取工作日
        working_dates = self.get_working_dates(request.start_date)
        
        # 生成产能方案
        capacity_plans = self.generate_capacity_plans(
            working_dates, 
            request.baseline_capacity, 
            request.capacity_variation
        )
        
        # 计算各方案排产结果
        baseline_plan = None
        optimized_plans = []
        
        for capacity_plan in capacity_plans:
            optimization_plan = self.calculate_production_schedule(
                request.orders, 
                capacity_plan, 
                request.cost_params
            )
            
            if capacity_plan.is_baseline:
                baseline_plan = optimization_plan
            else:
                optimized_plans.append(optimization_plan)
        
        # 按总成本排序优化方案
        optimized_plans.sort(key=lambda x: x.total_cost)
        
        # 选择推荐方案（综合成本和完成率）
        recommended_plan = self._select_recommended_plan(
            baseline_plan, optimized_plans
        )
        
        # 生成对比指标
        comparison_metrics = self._generate_comparison_metrics(
            baseline_plan, optimized_plans, recommended_plan
        )
        
        return MultiPlanProductionResponse(
            baseline_plan=baseline_plan,
            optimized_plans=optimized_plans,
            recommended_plan=recommended_plan,
            comparison_metrics=comparison_metrics
        )
    
    def _select_recommended_plan(
        self, 
        baseline_plan: CapacityOptimizationPlan,
        optimized_plans: List[CapacityOptimizationPlan]
    ) -> CapacityOptimizationPlan:
        """选择推荐方案"""
        if not optimized_plans:
            return baseline_plan
        
        # 综合评分：成本权重0.4，完成率权重0.3，产能利用率权重0.3
        def calculate_score(plan: CapacityOptimizationPlan) -> float:
            # 成本评分（越低越好，转换为0-1分数）
            max_cost = max(p.total_cost for p in [baseline_plan] + optimized_plans)
            min_cost = min(p.total_cost for p in [baseline_plan] + optimized_plans)
            cost_score = 1 - (plan.total_cost - min_cost) / (max_cost - min_cost) if max_cost > min_cost else 1
            
            # 完成率评分
            completion_score = plan.completion_rate
            
            # 产能利用率评分
            utilization_score = plan.capacity_utilization
            
            return cost_score * 0.4 + completion_score * 0.3 + utilization_score * 0.3
        
        all_plans = [baseline_plan] + optimized_plans
        best_plan = max(all_plans, key=calculate_score)
        
        return best_plan
    
    def _generate_comparison_metrics(
        self,
        baseline_plan: CapacityOptimizationPlan,
        optimized_plans: List[CapacityOptimizationPlan],
        recommended_plan: CapacityOptimizationPlan
    ) -> Dict[str, Any]:
        """生成对比指标"""
        all_plans = [baseline_plan] + optimized_plans
        
        return {
            "cost_comparison": {
                "baseline_cost": baseline_plan.total_cost,
                "best_cost": min(p.total_cost for p in all_plans),
                "worst_cost": max(p.total_cost for p in all_plans),
                "recommended_cost": recommended_plan.total_cost,
                "cost_saving": baseline_plan.total_cost - recommended_plan.total_cost
            },
            "performance_comparison": {
                "baseline_completion_rate": baseline_plan.completion_rate,
                "best_completion_rate": max(p.completion_rate for p in all_plans),
                "recommended_completion_rate": recommended_plan.completion_rate,
                "baseline_utilization": baseline_plan.capacity_utilization,
                "best_utilization": max(p.capacity_utilization for p in all_plans),
                "recommended_utilization": recommended_plan.capacity_utilization
            },
            "plan_summary": {
                "total_plans": len(all_plans),
                "baseline_rank": sorted(all_plans, key=lambda x: x.total_cost).index(baseline_plan) + 1,
                "recommended_plan_id": recommended_plan.plan_id,
                "recommended_plan_name": recommended_plan.plan_name
            }
        }
    
    def integrate_production_to_scheduling(
        self, 
        request: ProductionToSchedulingRequest
    ) -> ProductionToSchedulingResponse:
        """集成排产到排班"""
        from paiban import SchedulingEngine
        
        scheduling_engine = SchedulingEngine()
        daily_schedules = {}
        integration_metrics = {
            "total_production_days": len(request.production_schedule),
            "total_scheduling_days": 0,
            "integration_success_rate": 0.0
        }
        
        successful_days = 0
        
        for date, production_results in request.production_schedule.items():
            try:
                # 根据排产结果确定当日产品需求
                total_quantity = sum(r.quantity for r in production_results)
                primary_product = production_results[0].product_code if production_results else ""
                
                # 执行排班（这里需要模拟SKU数据）
                # 实际应用中需要根据排产结果动态生成SKU需求
                mock_sku_data = self._generate_mock_sku_data(production_results)
                
                results, groups = scheduling_engine.perform_day_scheduling(
                    target_date=date.replace("-", "/"),
                    product_code=primary_product,
                    sku_data=mock_sku_data,
                    position_data=request.position_data,
                    skill_data=request.skill_data
                )
                
                # 计算性能指标
                position_matching = scheduling_engine.calculate_position_matching(groups)
                work_hour_efficiency = scheduling_engine.calculate_work_hour_efficiency(groups)
                
                daily_schedules[date] = {
                    "results": results,
                    "groups": groups,
                    "performance_metrics": {
                        "人岗匹配度": position_matching,
                        "工时利用率": work_hour_efficiency
                    }
                }
                
                successful_days += 1
                
            except Exception as e:
                print(f"排班失败 - 日期: {date}, 错误: {str(e)}")
                continue
        
        integration_metrics["total_scheduling_days"] = successful_days
        integration_metrics["integration_success_rate"] = (
            successful_days / len(request.production_schedule) 
            if request.production_schedule else 0
        )
        
        return ProductionToSchedulingResponse(
            daily_schedules=daily_schedules,
            production_plan=request.production_schedule,
            integration_metrics=integration_metrics
        )
    
    def _generate_mock_sku_data(self, production_results: List[ProductionScheduleResult]) -> List[List[Any]]:
        """根据排产结果生成模拟SKU数据"""
        # 这是一个简化的模拟数据生成
        # 实际应用中需要根据产品编码查询真实的工艺路线
        
        headers = ["产成品编码", "工序", "工序名称", "工作中心", "岗位编码", "标准工时", "需求人数"]
        mock_data = [headers]
        
        for result in production_results:
            # 为每个产品生成基本工序
            base_positions = ["ZZ-G190", "ZZ-G200", "ZZ-G210"]  # 示例岗位
            
            for i, position in enumerate(base_positions):
                # 根据数量计算需求人数
                required_workers = max(1, result.quantity // 50)  # 每50个产品需要1个工人
                
                mock_data.append([
                    result.product_code,
                    f"工序{i+1:02d}",
                    f"生产工序{i+1}",
                    "生产中心",
                    position,
                    8.0,  # 标准工时
                    required_workers
                ])
        
        return mock_data
