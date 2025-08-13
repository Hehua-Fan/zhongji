"""
FastAPI主服务
提供排班和排产的API接口
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from models import EmployeeStatusRecord
from tools import SchedulingEngine, ProductionSchedulingEngine

# 导入路由模块
from router import base, scheduling, production, employee, utils

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

# 初始化各个路由模块的引擎
scheduling.init_scheduling_engine(scheduling_engine)
production.init_production_engine(production_engine)
utils.init_scheduling_engine(scheduling_engine)

# 设置员工状态记录到员工模块
employee.set_employee_records(employee_status_records)

# 注册路由
app.include_router(base.router, tags=["基础功能"])
app.include_router(scheduling.router, tags=["排班管理"])
app.include_router(production.router, tags=["排产管理"])
app.include_router(employee.router, tags=["员工管理"])
app.include_router(employee.workforce_router, tags=["人员分析"])
app.include_router(utils.router, tags=["工具算法"])
app.include_router(utils.data_router, tags=["数据验证"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
