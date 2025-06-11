#!/usr/bin/env python3
"""
启动脚本
用于启动FastAPI服务器
"""

import uvicorn
import sys
import os

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def main():
    """启动服务器"""
    print("正在启动智能排班排产系统...")
    print("API文档地址: http://localhost:8000/docs")
    print("健康检查: http://localhost:8000/health")
    print("按 Ctrl+C 停止服务")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # 开发模式，文件变化时自动重载
        log_level="info"
    )

if __name__ == "__main__":
    main() 