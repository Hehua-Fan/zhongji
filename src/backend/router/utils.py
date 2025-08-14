"""
工具路由模块
包含算法规则、数据验证等通用功能API接口
"""

from fastapi import APIRouter, HTTPException
from typing import List, Any

from tools import SchedulingEngine

# 创建路由器
router = APIRouter(prefix="/algorithms", tags=["工具算法"])

# 数据验证路由器
data_router = APIRouter(prefix="/data", tags=["数据验证"])

# 排班算法引擎 - 将在主应用中注入
scheduling_engine: SchedulingEngine = None

def init_scheduling_engine(engine: SchedulingEngine):
    """初始化排班引擎"""
    global scheduling_engine
    scheduling_engine = engine

@router.get("/scheduling-rules")
async def get_scheduling_rules():
    """获取可用的排班规则"""
    return {
        "rules": [
            {"id": "skill_priority", "name": "技能优先", "description": "优先安排技能等级高的员工"},
            {"id": "team_balance", "name": "班组均衡", "description": "保持班组内人员分配均衡"},
            {"id": "workload_balance", "name": "负荷均衡", "description": "均衡各岗位工作负荷"}
        ]
    }

@router.get("/production-rules")
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

@data_router.post("/validate")
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
