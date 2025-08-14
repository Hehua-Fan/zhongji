"""
基础模型定义
包含通用的数据结构和基础模型
"""

from typing import List, Dict, Optional, Union, Any
from pydantic import BaseModel

class SchedulingResult(BaseModel):
    岗位编码: str
    姓名: str
    工号: str
    技能等级: int
    班组: str
    工作中心: str
    日期: str

class TaskData(BaseModel):
    产成品编码: str
    岗位编码: str
    需求人数: int
    箱型: str = ""  # 新增箱型字段
    工作中心: str = ""  # 新增工作中心字段

class PositionData(BaseModel):
    工作中心: str
    岗位编码: str
    岗位技能等级: int

class SkillMatrixData(BaseModel):
    姓名: str
    工号: str
    班组: Optional[str] = None
    # 动态技能等级字段
    skills: Dict[str, Union[str, int]] = {}

# 文件上传响应
class FileUploadResponse(BaseModel):
    message: str
    sku_rows: int
    position_rows: int
    skill_rows: int
    sku_data: List[List[Any]]
    position_data: List[List[Any]]
    skill_data: List[List[Any]]

# 数据验证响应
class DataValidationResponse(BaseModel):
    valid: bool
    records: Optional[int] = None
    message: str

# 算法规则响应
class AlgorithmRule(BaseModel):
    id: str
    name: str
    description: str

class AlgorithmRulesResponse(BaseModel):
    rules: List[AlgorithmRule]
