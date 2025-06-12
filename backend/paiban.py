"""
排班算法模块
实现按岗位排班的核心算法逻辑
"""

from typing import List, Dict, Set, Optional, Union, Any, Tuple
from models import (
    SchedulingResult, TaskData, PositionData, SkillMatrixData, 
    PositionGroup, PerformanceMetrics, PositionMatchData, TrainingPlan,
    LowEfficiencyPosition, OptimizationSuggestion, LeaveInfo, 
    AdjustmentSuggestion, TeamWorkload
)
import pandas as pd
from datetime import datetime, timedelta
import math

class SchedulingEngine:
    """排班算法引擎"""
    
    def __init__(self):
        self.standard_work_hours = 8  # 标准工时
    
    def process_sku_data(self, raw_data: List[List[Any]]) -> List[TaskData]:
        """处理SKU数据"""
        if not raw_data or len(raw_data) < 2:
            return []
        
        results = []
        for row in raw_data[1:]:  # 跳过标题行
            if len(row) >= 17:
                task = TaskData(
                    产成品编码=str(row[0]) if row[0] else "",
                    岗位编码=str(row[4]) if row[4] else "",
                    需求人数=int(row[16]) if row[16] and str(row[16]).isdigit() else 0,
                    工作中心=str(row[3]) if len(row) > 3 and row[3] else "",  # 工作中心通常在第4列
                    箱型=str(row[17]) if len(row) > 17 and row[17] else ""  # 新增：箱型在第18列
                )
                if task.产成品编码 and task.岗位编码:
                    results.append(task)
        return results
    
    def process_position_data(self, raw_data: List[List[Any]]) -> List[PositionData]:
        """处理岗位数据"""
        if not raw_data or len(raw_data) < 2:
            return []
        
        results = []
        for row in raw_data[1:]:  # 跳过标题行
            if len(row) >= 13:
                position = PositionData(
                    工作中心=str(row[2]) if row[2] else "",
                    岗位编码=str(row[5]) if row[5] else "",
                    岗位技能等级=int(row[12]) if row[12] and str(row[12]).isdigit() else 0
                )
                if position.工作中心 and position.岗位编码:
                    results.append(position)
        return results
    
    def process_skill_matrix(self, raw_data: List[List[Any]]) -> List[SkillMatrixData]:
        """处理技能矩阵数据"""
        if not raw_data or len(raw_data) < 2:
            return []
        
        headers = [str(h) for h in raw_data[0]]
        results = []
        
        for row in raw_data[1:]:
            if len(row) < len(headers):
                continue
                
            skill_data = SkillMatrixData(
                姓名="",
                工号="",
                班组=None,
                skills={}
            )
            
            for i, header in enumerate(headers):
                if i < len(row):
                    value = row[i]
                    if header == "姓名":
                        skill_data.姓名 = str(value) if value else ""
                    elif header == "工号":
                        skill_data.工号 = str(value) if value else ""
                    elif header == "班组":
                        skill_data.班组 = str(value) if value else None
                    else:
                        # 技能等级数据
                        skill_level = int(value) if value and str(value).isdigit() else 0
                        skill_data.skills[header] = skill_level
            
            if skill_data.姓名 and skill_data.工号:
                results.append(skill_data)
        
        return results
    
    def perform_day_scheduling(
        self, 
        target_date: str, 
        product_code: str,
        sku_data: List[List[Any]],
        position_data: List[List[Any]],
        skill_data: List[List[Any]],
        weekly_assigned_workers: List[str] = None
    ) -> Tuple[List[SchedulingResult], List[PositionGroup]]:
        """执行单日排班"""
        
        # 处理数据
        table1 = self.process_sku_data(sku_data)
        dole_positions = self.process_position_data(position_data)
        skill_matrix = self.process_skill_matrix(skill_data)
        
        # 筛选当天任务
        today_tasks = []
        task_dict = {}
        
        for item in table1:
            if item.产成品编码 == product_code:
                key = item.岗位编码
                if key in task_dict:
                    task_dict[key].需求人数 += item.需求人数
                else:
                    task_dict[key] = TaskData(
                        产成品编码=item.产成品编码,
                        岗位编码=item.岗位编码,
                        需求人数=item.需求人数
                    )
        
        today_tasks = [task for task in task_dict.values() if task.需求人数 > 0]
        
        # 已分配员工集合
        assigned_workers = set(weekly_assigned_workers or [])
        results = []
        groups = []
        
        for task in today_tasks:
            post_code = task.岗位编码
            required_people = task.需求人数
            
            # 查找技能要求
            skill_req = next((pos for pos in dole_positions if pos.岗位编码 == post_code), None)
            if not skill_req:
                continue
                
            required_skill_level = skill_req.岗位技能等级
            work_center = skill_req.工作中心
            
            # 获取可用员工
            available_workers = [
                worker for worker in skill_matrix 
                if worker.工号 not in assigned_workers
            ]
            
            # 筛选有该岗位技能的员工并排序
            skilled_workers = []
            for worker in available_workers:
                skill_level = worker.skills.get(post_code, 0)
                if isinstance(skill_level, int) and skill_level > 0:
                    skilled_workers.append((worker, skill_level))
            
            # 排序：优先班组，然后技能等级
            skilled_workers.sort(key=lambda x: (
                x[0].班组 or "zzz",  # 班组排序，无班组排到最后
                -x[1]  # 技能等级降序
            ))
            
            # 分配员工
            assigned = []
            
            # 优先分配满足要求的员工
            for worker, skill_level in skilled_workers:
                if len(assigned) >= required_people:
                    break
                if skill_level >= required_skill_level:
                    assigned.append((worker, skill_level))
                    assigned_workers.add(worker.工号)
            
            # 如果还有空位，分配技能等级较低的员工
            for worker, skill_level in skilled_workers:
                if len(assigned) >= required_people:
                    break
                if worker.工号 not in assigned_workers and skill_level < required_skill_level:
                    assigned.append((worker, skill_level))
                    assigned_workers.add(worker.工号)
            
            # 生成排班结果
            position_results = []
            for worker, skill_level in assigned:
                result = SchedulingResult(
                    岗位编码=post_code,
                    姓名=worker.姓名,
                    工号=worker.工号,
                    技能等级=skill_level,
                    班组=worker.班组 or "",
                    工作中心=work_center,
                    日期=target_date
                )
                results.append(result)
                position_results.append(result)
            
            # 生成岗位组信息
            group = PositionGroup(
                岗位编码=post_code,
                岗位名称=post_code,
                工作中心=work_center,
                班组=position_results[0].班组 if position_results else "",
                技能等级=f"{required_skill_level}级",
                需求人数=required_people,
                已排人数=len(position_results),
                员工列表=position_results
            )
            groups.append(group)
        
        return results, groups
    
    def calculate_position_matching(self, groups: List[PositionGroup]) -> Dict[str, Any]:
        """计算人岗匹配度"""
        if not groups:
            return {
                "总体匹配度": 0.0,
                "岗位匹配情况": [],
                "培养计划": []
            }
        
        position_match_data = []
        training_plans = []
        total_match_numerator = 0
        total_match_denominator = 0
        
        for group in groups:
            required_skill = int(group.技能等级.replace("级", ""))
            skill_total = 0
            employee_count = len(group.员工列表)
            qualified_count = 0
            
            employee_situations = []
            for worker in group.员工列表:
                actual_skill = worker.技能等级
                skill_gap = max(0, required_skill - actual_skill)
                skill_total += actual_skill
                
                if actual_skill >= required_skill:
                    qualified_count += 1
                
                employee_situations.append({
                    "姓名": worker.姓名,
                    "工号": worker.工号,
                    "实际技能": actual_skill,
                    "技能差距": skill_gap
                })
            
            if employee_count > 0:
                avg_actual_skill = skill_total / employee_count
                match_rate = (qualified_count / employee_count) * 100
                
                if match_rate == 100:
                    match_status = "完全匹配"
                elif match_rate >= 75:
                    match_status = "基本匹配"
                else:
                    match_status = "需要培养"
                
                position_match_data.append(PositionMatchData(
                    岗位编码=group.岗位编码,
                    工作中心=group.工作中心,
                    要求技能等级=required_skill,
                    平均实际技能=avg_actual_skill,
                    匹配度=match_rate,
                    匹配状态=match_status,
                    员工情况=employee_situations
                ))
                
                total_match_numerator += qualified_count
                total_match_denominator += employee_count
                
                # 生成培养计划
                training_needed = [
                    emp for emp in employee_situations 
                    if emp["技能差距"] > 0
                ]
                
                if training_needed:
                    priority = "高" if match_rate < 50 else ("中" if match_rate < 75 else "低")
                    training_plan = {
                        "岗位编码": group.岗位编码,
                        "工作中心": group.工作中心,
                        "需培养人员": [
                            {
                                "姓名": emp["姓名"],
                                "工号": emp["工号"],
                                "当前技能": emp["实际技能"],
                                "目标技能": required_skill,
                                "培养内容": f"{group.岗位编码}岗位技能提升训练",
                                "预计时间": (
                                    "3-6个月" if emp["技能差距"] > 2 else
                                    "1-3个月" if emp["技能差距"] > 1 else
                                    "2-4周"
                                )
                            }
                            for emp in training_needed
                        ],
                        "优先级": priority
                    }
                    training_plans.append(training_plan)
        
        overall_match_rate = (total_match_numerator / total_match_denominator * 100) if total_match_denominator > 0 else 0
        
        # 按优先级排序培养计划
        priority_order = {"高": 3, "中": 2, "低": 1}
        training_plans.sort(key=lambda x: priority_order.get(x["优先级"], 0), reverse=True)
        
        return {
            "总体匹配度": overall_match_rate,
            "岗位匹配情况": [data.dict() for data in position_match_data],
            "培养计划": training_plans
        }
    
    def calculate_work_hour_efficiency(self, groups: List[PositionGroup]) -> Dict[str, Any]:
        """计算工时利用率"""
        if not groups:
            return {
                "总体利用率": 0.0,
                "低效岗位": [],
                "优化方案": []
            }
        
        low_efficiency_positions = []
        optimization_suggestions = []
        total_efficiency_numerator = 0
        total_efficiency_denominator = 0
        
        for group in groups:
            standard_hours = self.standard_work_hours
            actual_work_hours = group.已排人数 * standard_hours
            required_work_hours = group.需求人数 * standard_hours
            current_efficiency = (actual_work_hours / required_work_hours * 100) if required_work_hours > 0 else 0
            
            total_efficiency_numerator += actual_work_hours
            total_efficiency_denominator += required_work_hours
            
            if current_efficiency < 85 and group.需求人数 > 0:
                gap_hours = required_work_hours - actual_work_hours
                impact_reasons = []
                
                if group.已排人数 < group.需求人数:
                    impact_reasons.append("人员配置不足")
                
                required_skill = int(group.技能等级.replace("级", ""))
                under_skilled_count = sum(
                    1 for worker in group.员工列表 
                    if worker.技能等级 < required_skill
                )
                
                if under_skilled_count > 0:
                    impact_reasons.append("技能水平不达标")
                
                if not impact_reasons:
                    impact_reasons.append("其他因素")
                
                low_efficiency_positions.append(LowEfficiencyPosition(
                    岗位编码=group.岗位编码,
                    工作中心=group.工作中心,
                    当前利用率=current_efficiency,
                    标准工时=standard_hours,
                    实际工时=actual_work_hours,
                    差距工时=gap_hours,
                    影响原因=impact_reasons
                ))
                
                # 生成优化方案
                if group.已排人数 < group.需求人数:
                    shortage = group.需求人数 - group.已排人数
                    expected_improvement = min(100, current_efficiency + (gap_hours / required_work_hours) * 100)
                    optimization_suggestions.append(OptimizationSuggestion(
                        岗位编码=group.岗位编码,
                        建议类型="人员调整",
                        具体建议=f"建议增加{shortage}名员工",
                        预期效果=f"提升工时利用率至{expected_improvement:.1f}%",
                        实施难度="中等"
                    ))
                
                if under_skilled_count > 0:
                    optimization_suggestions.append(OptimizationSuggestion(
                        岗位编码=group.岗位编码,
                        建议类型="技能提升",
                        具体建议=f"对{under_skilled_count}名员工进行技能培训",
                        预期效果="提升操作效率10-20%",
                        实施难度="容易"
                    ))
                
                if current_efficiency < 70:
                    optimization_suggestions.append(OptimizationSuggestion(
                        岗位编码=group.岗位编码,
                        建议类型="工艺优化",
                        具体建议="检查工艺流程，优化操作标准",
                        预期效果="提升整体效率5-15%",
                        实施难度="困难"
                    ))
        
        overall_efficiency = (total_efficiency_numerator / total_efficiency_denominator * 100) if total_efficiency_denominator > 0 else 0
        
        # 排序
        low_efficiency_positions.sort(key=lambda x: x.当前利用率)
        difficulty_order = {"容易": 3, "中等": 2, "困难": 1}
        optimization_suggestions.sort(key=lambda x: difficulty_order.get(x.实施难度, 0), reverse=True)
        
        return {
            "总体利用率": overall_efficiency,
            "低效岗位": [pos.dict() for pos in low_efficiency_positions],
            "优化方案": [sug.dict() for sug in optimization_suggestions]
        }
    
    def calculate_team_workloads(
        self, 
        groups: List[PositionGroup], 
        leaves: List[LeaveInfo],
        skill_matrix: List[SkillMatrixData],
        current_date: str
    ) -> List[TeamWorkload]:
        """计算班组负荷情况 - 重新设计，区分在岗和空闲人员"""
        team_map = {}
        
        # 先收集所有在岗人员（已分配到具体岗位的人员）
        on_duty_workers = set()
        leave_workers = set()
        
        # 收集请假人员
        for leave in leaves:
            if leave.请假日期 == current_date:
                leave_workers.add(leave.工号)
        
        # 收集在岗人员（分配到岗位且未请假的人员）
        for group in groups:
            for worker in group.员工列表:
                if worker.工号 not in leave_workers:
                    on_duty_workers.add(worker.工号)
        
        # 初始化班组数据
        for group in groups:
            for worker in group.员工列表:
                team_name = worker.班组 or "未分组"
                if team_name not in team_map:
                    team_map[team_name] = {
                        "班组": team_name,
                        "总人数": 0,
                        "在岗人数": 0,
                        "请假人数": 0,
                        "技能分布": {},
                        "负荷率": 0.0,
                        "可调配人员": []
                    }
                
                team = team_map[team_name]
                team["总人数"] += 1
                
                if worker.工号 in leave_workers:
                    team["请假人数"] += 1
                else:
                    team["在岗人数"] += 1
                
                # 统计技能分布
                skill_level = f"{worker.技能等级}级"
                team["技能分布"][skill_level] = team["技能分布"].get(skill_level, 0) + 1
        
        # 查找空闲人员（有技能但未分配到任何岗位的人员）
        for skill_data in skill_matrix:
            worker_id = skill_data.工号
            
            # 如果该员工未请假且未分配到任何岗位，则为空闲人员
            if worker_id not in leave_workers and worker_id not in on_duty_workers:
                # 根据技能矩阵推断所属班组（简化处理）
                team_name = "备用班组"  # 默认班组，实际应用中可以更精确
                
                # 尝试从已有班组中推断
                for team in team_map.keys():
                    if team != "备用班组":
                        team_name = team
                        break
                
                if team_name not in team_map:
                    team_map[team_name] = {
                        "班组": team_name,
                        "总人数": 0,
                        "在岗人数": 0,
                        "请假人数": 0,
                        "技能分布": {},
                        "负荷率": 0.0,
                        "可调配人员": []
                    }
                
                # 分析该员工的技能
                support_positions = []
                skill_distribution = {}
                
                if hasattr(skill_data, 'skills') and skill_data.skills:
                    for skill_name, skill_level in skill_data.skills.items():
                        if isinstance(skill_level, int) and skill_level >= 2:
                            support_positions.append(skill_name)
                            skill_distribution[skill_name] = skill_level
                elif hasattr(skill_data, '技能等级分布') and skill_data.技能等级分布:
                    for skill_name, skill_level in skill_data.技能等级分布.items():
                        if isinstance(skill_level, int) and skill_level >= 2:
                            support_positions.append(skill_name)
                            skill_distribution[skill_name] = skill_level
                
                # 只有多技能人员才被认为是可调配的
                if len(support_positions) >= 1:
                    team_map[team_name]["可调配人员"].append({
                        "工号": worker_id,
                        "姓名": getattr(skill_data, '姓名', f'员工{worker_id}'),
                        "可支援岗位": support_positions,
                        "技能等级分布": skill_distribution,
                        "状态": "空闲"
                    })
        
        # 计算负荷率
        for team_name, team in team_map.items():
            if team["总人数"] > 0:
                # 负荷率 = 在岗人数 / 总人数
                team["负荷率"] = (team["在岗人数"] / team["总人数"]) * 100
            else:
                team["负荷率"] = 0.0
        
        return [TeamWorkload(**team) for team in team_map.values()]
    
    def generate_weekly_schedule(
        self,
        start_date: str,
        product_code: str,
        sku_data: List[List[Any]],
        position_data: List[List[Any]],
        skill_data: List[List[Any]]
    ) -> Dict[str, Tuple[List[SchedulingResult], List[PositionGroup]]]:
        """生成一周排班"""
        weekly_schedule = {}
        
        # 解析开始日期
        start_dt = datetime.strptime(start_date, "%Y/%m/%d")
        
        # 计算一周的日期（从周一开始）
        weekday = start_dt.weekday()  # 0=Monday, 6=Sunday
        monday = start_dt - timedelta(days=weekday)
        
        week_dates = [monday + timedelta(days=i) for i in range(7)]
        
        assigned_workers_weekly = set()
        
        for date in week_dates:
            date_str = date.strftime("%Y/%m/%d")
            
            # 执行单日排班
            results, groups = self.perform_day_scheduling(
                date_str,
                product_code,
                sku_data,
                position_data,
                skill_data,
                list(assigned_workers_weekly)
            )
            
            weekly_schedule[date_str] = (results, groups)
            
            # 更新已分配员工列表
            for result in results:
                assigned_workers_weekly.add(result.工号)
        
        return weekly_schedule
    
    def generate_adjustment_suggestions(
        self,
        groups: List[PositionGroup], 
        leaves: List[LeaveInfo], 
        workloads: List[TeamWorkload],
        skill_matrix: List[SkillMatrixData],
        current_date: str
    ) -> List[AdjustmentSuggestion]:
        """生成调整建议 - 基于岗位技能需求和空闲人员匹配"""
        suggestions = []
        
        # 分析受请假影响的岗位及其缺口
        affected_positions = {}
        
        for leave in leaves:
            if leave.请假日期 == current_date:
                for position_code in leave.影响岗位:
                    group = next((g for g in groups if g.岗位编码 == position_code), None)
                    if group:
                        if position_code not in affected_positions:
                            affected_positions[position_code] = {
                                "group": group,
                                "leave_workers": [],
                                "required_skill_level": int(group.技能等级.replace("级", "")) if group.技能等级 else 3
                            }
                        affected_positions[position_code]["leave_workers"].append(leave.工号)
        
        # 为每个受影响的岗位寻找替代人员
        for position_code, data in affected_positions.items():
            group = data["group"]
            leave_workers = data["leave_workers"]
            required_skill = data["required_skill_level"]
            leave_count = len(leave_workers)
            remaining_workers = group.已排人数 - leave_count
            shortage = max(0, group.需求人数 - remaining_workers)
            
            if shortage > 0:
                # 从所有班组的空闲人员中寻找合适的替代者
                suitable_candidates = []
                
                for workload in workloads:
                    for available_worker in workload.可调配人员:
                        # 检查是否具备该岗位的技能
                        worker_skill_level = available_worker["技能等级分布"].get(position_code, 0)
                        
                        if worker_skill_level >= required_skill - 1:  # 允许技能等级稍低
                            suitable_candidates.append({
                                "worker": available_worker,
                                "source_team": workload.班组,
                                "skill_level": worker_skill_level,
                                "skill_match": worker_skill_level >= required_skill
                            })
                
                if suitable_candidates:
                    # 按技能等级排序，优先选择技能高的
                    suitable_candidates.sort(key=lambda x: x["skill_level"], reverse=True)
                    
                    # 选择最合适的人员（不超过缺口数量）
                    selected_candidates = suitable_candidates[:shortage]
                    
                    # 按来源班组分组生成建议
                    by_team = {}
                    for candidate in selected_candidates:
                        team = candidate["source_team"]
                        if team not in by_team:
                            by_team[team] = []
                        by_team[team].append(candidate)
                    
                    for source_team, team_candidates in by_team.items():
                        suggestion_type = "班组内调整" if source_team == group.班组 else "跨班组调整"
                        priority = 8 if source_team == group.班组 else 6
                        
                        # 计算效率影响
                        avg_skill = sum(c["skill_level"] for c in team_candidates) / len(team_candidates)
                        skill_gap = max(0, required_skill - avg_skill)
                        efficiency_loss = skill_gap * 10  # 技能差距转换为效率损失
                        
                        suggestion = AdjustmentSuggestion(
                            调整类型=suggestion_type,
                            原岗位=position_code,
                            调整人员=[{
                                "工号": c["worker"]["工号"],
                                "姓名": c["worker"]["姓名"],
                                "当前班组": source_team,
                                "目标班组": group.班组,
                                "技能等级": c["skill_level"],
                                "调整原因": f"补充{position_code}岗位人员缺口",
                                "技能匹配度": "完全匹配" if c["skill_match"] else "基本匹配"
                            } for c in team_candidates],
                            效率影响={
                                "原岗位效率损失": efficiency_loss,
                                "目标岗位效率变化": 5 if avg_skill >= required_skill else -5,
                                "整体效率影响": efficiency_loss - (5 if avg_skill >= required_skill else -5)
                            },
                            制造周期影响={
                                "预计延误时间": max(0, (shortage - len(team_candidates)) * 1.5),
                                "关键路径影响": group.需求人数 >= 3,
                                "影响产品": [group.岗位编码]
                            },
                            实施建议=self._generate_implementation_advice(
                                position_code, team_candidates, source_team, group.班组
                            ),
                            优先级=priority
                        )
                        suggestions.append(suggestion)
                else:
                    # 没有合适的替代人员，生成加班建议
                    overtime_suggestion = self._generate_overtime_suggestion(
                        group, shortage, leaves, current_date
                    )
                    if overtime_suggestion:
                        suggestions.append(overtime_suggestion)
        
        # 按优先级排序
        return sorted(suggestions, key=lambda x: x.优先级, reverse=True)
    
    def _generate_implementation_advice(
        self, position_code: str, candidates: List[Dict], 
        source_team: str, target_team: str
    ) -> str:
        """生成实施建议"""
        candidate_count = len(candidates)
        
        if source_team == target_team:
            return f"建议从{source_team}内部调配{candidate_count}名人员到{position_code}岗位，" \
                   f"平均技能等级{sum(c['skill_level'] for c in candidates) / candidate_count:.1f}级"
        else:
            avg_skill = sum(c['skill_level'] for c in candidates) / candidate_count
            return f"建议从{source_team}调配{candidate_count}名人员支援{target_team}的{position_code}岗位，" \
                   f"需要协调跨班组工作安排，建议给予适当补贴。平均技能等级{avg_skill:.1f}级。"
    
    def _generate_internal_team_adjustment(
        self, group: PositionGroup, workloads: List[TeamWorkload], 
        shortage: int, skill_matrix: List[SkillMatrixData]
    ) -> Optional[AdjustmentSuggestion]:
        """生成班组内调整建议"""
        team_workload = next((w for w in workloads if w.班组 == group.班组), None)
        if not team_workload or not team_workload.可调配人员:
            return None
        
        available_workers = [
            worker for worker in team_workload.可调配人员
            if group.岗位编码 in worker["可支援岗位"] and
            worker["技能等级分布"].get(group.岗位编码, 0) >= 
            int(group.技能等级.replace("级", "")) - 1
        ][:shortage]
        
        if not available_workers:
            return None
        
        efficiency_impact = self._calculate_efficiency_impact(available_workers, group)
        
        return AdjustmentSuggestion(
            调整类型="班组内调整",
            原岗位=group.岗位编码,
            调整人员=[{
                "工号": worker["工号"],
                "姓名": worker["姓名"],
                "当前班组": team_workload.班组,
                "技能等级": worker["技能等级分布"].get(group.岗位编码, 0),
                "调整原因": "班组内人员支援"
            } for worker in available_workers],
            效率影响={
                "原岗位效率损失": efficiency_impact["original"],
                "目标岗位效率变化": efficiency_impact["target"],
                "整体效率影响": efficiency_impact["overall"]
            },
            制造周期影响={
                "预计延误时间": max(0, (shortage - len(available_workers)) * 2),
                "关键路径影响": group.需求人数 >= 3,
                "影响产品": ["产品SKU"]
            },
            实施建议=f"从{team_workload.班组}调配{len(available_workers)}名人员支援{group.岗位编码}岗位",
            优先级=8
        )
    
    def _generate_cross_team_adjustment(
        self, group: PositionGroup, workloads: List[TeamWorkload], 
        shortage: int, skill_matrix: List[SkillMatrixData]
    ) -> Optional[AdjustmentSuggestion]:
        """生成跨班组调整建议"""
        other_teams = [w for w in workloads if w.班组 != group.班组 and w.负荷率 < 90]
        available_workers = []
        
        for team in other_teams:
            suitable_workers = [
                {**worker, "source_team": team.班组} 
                for worker in team.可调配人员
                if group.岗位编码 in worker["可支援岗位"] and
                worker["技能等级分布"].get(group.岗位编码, 0) >= 
                int(group.技能等级.replace("级", "")) - 2
            ]
            available_workers.extend(suitable_workers)
        
        # 按技能等级排序选择最佳人员
        selected_workers = sorted(
            available_workers,
            key=lambda x: x["技能等级分布"].get(group.岗位编码, 0),
            reverse=True
        )[:shortage]
        
        if not selected_workers:
            return None
        
        efficiency_impact = self._calculate_efficiency_impact(selected_workers, group)
        
        return AdjustmentSuggestion(
            调整类型="跨班组调整",
            原岗位=group.岗位编码,
            调整人员=[{
                "工号": worker["工号"],
                "姓名": worker["姓名"],
                "当前班组": worker["source_team"],
                "目标班组": group.班组,
                "技能等级": worker["技能等级分布"].get(group.岗位编码, 0),
                "调整原因": "跨班组人员支援"
            } for worker in selected_workers],
            效率影响={
                "原岗位效率损失": efficiency_impact["original"],
                "目标岗位效率变化": efficiency_impact["target"],
                "整体效率影响": efficiency_impact["overall"]
            },
            制造周期影响={
                "预计延误时间": len(selected_workers) * 0.5,
                "关键路径影响": group.需求人数 >= 3,
                "影响产品": ["产品SKU"]
            },
            实施建议=f"从其他班组调配{len(selected_workers)}名人员支援，需要协调班组间工作安排",
            优先级=6
        )
    
    def _generate_overtime_suggestion(
        self, group: PositionGroup, shortage: int, 
        leaves: List[LeaveInfo], current_date: str
    ) -> Optional[AdjustmentSuggestion]:
        """生成加班补偿建议"""
        remaining_workers = [
            worker for worker in group.员工列表
            if not any(leave.工号 == worker.工号 and leave.请假日期 == current_date 
                      for leave in leaves)
        ]
        
        if not remaining_workers:
            return None
        
        overtime_hours = math.ceil((shortage / len(remaining_workers)) * 2)
        
        return AdjustmentSuggestion(
            调整类型="加班补偿",
            原岗位=group.岗位编码,
            调整人员=[{
                "工号": worker.工号,
                "姓名": worker.姓名,
                "当前班组": worker.班组,
                "技能等级": worker.技能等级,
                "调整原因": f"加班{overtime_hours}小时补偿人员不足"
            } for worker in remaining_workers],
            效率影响={
                "原岗位效率损失": shortage * 15,
                "目标岗位效率变化": -5,
                "整体效率影响": shortage * 10
            },
            制造周期影响={
                "预计延误时间": max(0, shortage * 1.5),
                "关键路径影响": shortage >= 2,
                "影响产品": ["产品SKU"]
            },
            实施建议=f"安排在岗人员加班{overtime_hours}小时，注意劳动强度控制",
            优先级=4
        )
    
    def _calculate_efficiency_impact(self, workers: List[Dict], group: PositionGroup) -> Dict[str, float]:
        """计算效率影响"""
        required_skill = int(group.技能等级.replace("级", ""))
        total_efficiency_loss = 0
        
        for worker in workers:
            actual_skill = worker["技能等级分布"].get(group.岗位编码, 0)
            skill_gap = max(0, required_skill - actual_skill)
            total_efficiency_loss += skill_gap * 10
        
        return {
            "original": total_efficiency_loss,
            "target": -total_efficiency_loss * 0.3,
            "overall": total_efficiency_loss * 0.7
        }
    
    def analyze_leave_impact(
        self, groups: List[PositionGroup], leave_info: LeaveInfo,
        skill_matrix: List[SkillMatrixData]
    ) -> Dict[str, Any]:
        """分析请假对排班的影响"""
        impact_analysis = {
            "affected_positions": [],
            "efficiency_impact": {},
            "suggested_actions": []
        }
        
        for position in leave_info.影响岗位:
            group = next((g for g in groups if g.岗位编码 == position), None)
            if group:
                # 计算影响
                remaining_capacity = (group.已排人数 - 1) / group.需求人数 if group.需求人数 > 0 else 0
                efficiency_loss = max(0, (1 - remaining_capacity) * 100)
                
                impact_analysis["affected_positions"].append({
                    "岗位编码": position,
                    "当前人数": group.已排人数,
                    "需求人数": group.需求人数,
                    "剩余产能": remaining_capacity,
                    "效率损失": efficiency_loss
                })
                
                impact_analysis["efficiency_impact"][position] = efficiency_loss
                
                # 建议行动
                if efficiency_loss > 20:
                    impact_analysis["suggested_actions"].append(
                        f"{position}岗位效率损失{efficiency_loss:.1f}%，建议立即安排替补人员"
                    )
        
        return impact_analysis
    
    def filter_position_groups(
        self, groups: List[PositionGroup], filters: Dict[str, Any]
    ) -> List[PositionGroup]:
        """根据筛选条件过滤岗位组"""
        filtered_groups = []
        
        for group in groups:
            # 岗位编码筛选
            if filters.get("岗位编码") and filters["岗位编码"] not in group.岗位编码:
                continue
            
            # 工作中心筛选
            if filters.get("工作中心") and group.工作中心 != filters["工作中心"]:
                continue
            
            # 班组筛选
            if filters.get("班组") and not any(w.班组 == filters["班组"] for w in group.员工列表):
                continue
            
            # 状态筛选
            if filters.get("状态") and filters["状态"] != "全部":
                已满 = group.已排人数 >= group.需求人数
                if filters["状态"] == "已满" and not 已满:
                    continue
                if filters["状态"] == "缺员" and 已满:
                    continue
            
            # 搜索关键词筛选
            if filters.get("搜索关键词"):
                keyword = filters["搜索关键词"].lower()
                search_text = " ".join([
                    group.岗位编码, group.工作中心,
                    *[w.姓名 for w in group.员工列表],
                    *[w.工号 for w in group.员工列表]
                ]).lower()
                
                if keyword not in search_text:
                    continue
            
            filtered_groups.append(group)
        
        return filtered_groups
    
    def get_filter_options(self, groups: List[PositionGroup]) -> Dict[str, List[str]]:
        """获取筛选选项"""
        岗位编码列表 = sorted(list(set(g.岗位编码 for g in groups)))
        工作中心列表 = sorted(list(set(g.工作中心 for g in groups)))
        班组列表 = sorted(list(set(
            w.班组 for g in groups for w in g.员工列表 if w.班组
        )))
        
        return {
            "岗位编码列表": 岗位编码列表,
            "工作中心列表": 工作中心列表,
            "班组列表": 班组列表
        }
    
    def prepare_export_data(self, schedule_type: str, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """准备导出数据"""
        if schedule_type == "day":
            # 单日排班导出
            results = schedule_data.get("results", [])
            groups = schedule_data.get("groups", [])
            
            export_data = {
                "schedule_results": [
                    {
                        "岗位编码": r.岗位编码,
                        "姓名": r.姓名,
                        "工号": r.工号,
                        "技能等级": r.技能等级,
                        "班组": r.班组,
                        "工作中心": r.工作中心,
                        "日期": r.日期
                    } for r in results
                ],
                "summary": {
                    "总岗位数": len(groups),
                    "已排人数": len(results),
                    "需求人数": sum(g.需求人数 for g in groups)
                }
            }
        else:
            # 一周排班导出
            weekly_schedule = schedule_data.get("weekly_schedule", {})
            all_results = []
            daily_summary = []
            
            for date_str, day_data in weekly_schedule.items():
                if hasattr(day_data, 'results'):
                    day_results = day_data.results
                else:
                    day_results = day_data.get("results", [])
                    
                all_results.extend([
                    {
                        "岗位编码": r.岗位编码,
                        "姓名": r.姓名,
                        "工号": r.工号,
                        "技能等级": r.技能等级,
                        "班组": r.班组,
                        "工作中心": r.工作中心,
                        "日期": r.日期
                    } for r in day_results
                ])
                
                daily_summary.append({
                    "日期": date_str,
                    "排班人数": len(day_results),
                    "岗位数": len(day_data.get("groups", []))
                })
            
            export_data = {
                "schedule_results": all_results,
                "daily_summary": daily_summary,
                "summary": {
                    "总天数": len(weekly_schedule),
                    "总排班人次": len(all_results),
                    "平均每日人数": len(all_results) // len(weekly_schedule) if weekly_schedule else 0
                }
            }
        
        return export_data
