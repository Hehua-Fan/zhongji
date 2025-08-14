"""
基础路由模块
包含健康检查和文件上传等基础功能
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import List, Any
import pandas as pd
import io
from datetime import datetime

router = APIRouter()

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

@router.get("/")
async def root():
    """健康检查"""
    return {"message": "智能排班排产系统 API 服务正常运行"}

@router.get("/health")
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

@router.post("/upload/excel")
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
