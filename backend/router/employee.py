"""
员工管理路由模块
包含员工状态管理和人员分析相关的API接口
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, date
import uuid

from models import (
    EmployeeStatusRecord, EmployeeStatusRequest, EmployeeStatusResponse,
    EmployeeStatusType, ShiftType, ShiftAdjustmentSuggestion, CurrentWorkforceStatus,
    TeamEfficiencyAnalysis, WorkforceAnalysisResponse, PositionGroup
)

# 创建路由器
router = APIRouter(prefix="/employee-status", tags=["员工管理"])

# 全局变量存储员工状态记录（实际应用中应使用数据库）
employee_status_records: List[EmployeeStatusRecord] = []

def get_employee_records():
    """获取员工状态记录"""
    return employee_status_records

def set_employee_records(records: List[EmployeeStatusRecord]):
    """设置员工状态记录"""
    global employee_status_records
    employee_status_records = records

@router.post("/add")
async def add_employee_status(request: EmployeeStatusRequest):
    """添加员工状态记录"""
    try:
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

@router.get("/list", response_model=EmployeeStatusResponse)
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

@router.delete("/{record_id}")
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

@router.get("/employees")
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


# 创建人员分析路由器
workforce_router = APIRouter(prefix="/workforce", tags=["人员分析"])

@workforce_router.post("/analysis", response_model=WorkforceAnalysisResponse)
async def analyze_workforce_status(
    position_groups: List[PositionGroup] = [],
    employee_status_records_input: List[EmployeeStatusRecord] = [],
    target_date: str = None
):
    """分析当前人员在岗情况和生成班次调整建议"""
    try:
        if not target_date:
            target_date = datetime.now().strftime("%Y-%m-%d")
        
        # 使用传入的员工状态记录，如果没有则使用全局变量
        records_to_use = employee_status_records_input if employee_status_records_input else employee_status_records
        
        # 分析当前人员状态
        current_status = _analyze_current_workforce_status(position_groups, records_to_use, target_date)
        
        # 生成班次调整建议
        shift_suggestions = _generate_shift_adjustment_suggestions(current_status, position_groups, records_to_use)
        
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

@workforce_router.get("/quick-status")
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


# 辅助函数
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
