# 智能排班排产系统: 下一代工业智能化解决方案

智能排班排产系统是一个现代化的生产管理平台，集成了智能排班、生产排程和数据分析功能。

## 特性

- 🏭 **智能排班**: 基于技能矩阵和岗位需求的自动排班算法
- 📊 **生产排程**: 多算法支持的订单排产优化系统
- 🧠 **智能分析**: AI驱动的效果评价和优化建议
- 📱 **响应式设计**: 跨设备完美适配的用户界面
- ⚡ **实时处理**: 高性能的数据处理和实时反馈
- 🎨 **数据可视化**: 直观的图表和报告展示

## 增强的React组件支持

智能排班排产系统采用现代化的React技术栈，支持全面的组件库和开发模式：

### 📦 **支持的React模式**

- **基础React组件**: 函数组件、类组件、箭头函数组件
- **TypeScript React**: FC、FunctionComponent、ReactNode、JSX.Element
- **React Hooks**: useState、useEffect、useContext、useReducer、自定义Hooks
- **现代React**: 带Hooks的函数式组件
- **Next.js组件**: 页面组件、API路由、服务端组件

### 🎨 **UI库支持**

- **Shadcn/ui**: 现代化的React组件库
- **Radix UI**: @radix-ui/react-* 无障碍组件
- **Tailwind CSS**: 实用优先的CSS框架
- **Lucide React**: 美观的SVG图标库
- **React Hot Toast**: 优雅的通知组件
- **React Select**: 高级选择器组件

### 🔧 **开发工具**

- **表单处理**: React Hook Form集成
- **状态管理**: React内置状态管理
- **数据处理**: Excel文件读取和处理
- **路由**: Next.js内置路由系统
- **动画**: Tailwind CSS动画
- **图标**: Lucide React图标库

### 📊 **数据可视化**

- **表格**: 自定义高性能表格组件
- **日历**: 生产排程日历视图
- **图表**: 自定义图表组件
- **仪表板**: 多维度数据展示

### 🚀 **组件架构**

系统采用模块化组件架构：

```tsx
// 排产组件
<OrderManagement />      // 订单管理
<ParameterSettings />    // 参数设置
<PlanComparison />       // 方案对比
<ProductionAnalysis />   // 生产分析
```

```tsx
// 排班组件
<ProductionSchedule />   // 生产排程
<DataUpload />          // 数据上传
<ScheduleResults />     // 排班结果
<PerformanceAnalysis /> // 性能分析
<LeaveAdjustment />     // 请假调整
```

### 🎯 **自动检测特性**

- **智能组件识别**: 自动识别React组件类型
- **组件名称提取**: 智能提取组件名称用于组织
- **TypeScript支持**: 完整的TypeScript React组件支持
- **库检测**: 识别流行的React库和框架
- **实时渲染**: 组件在流式传输期间出现在artifacts面板

### 💡 **使用示例**

系统支持创建各种复杂的React组件：
- "创建带有验证的排班表单组件"
- "构建使用Tailwind CSS的生产分析仪表板"
- "设计TypeScript React排产优化组件"
- "制作响应式的数据上传界面"

## 开始使用

### 前置条件

1. Node.js 18+ 和 npm
2. Python 3.8+
3. Conda 环境管理器

### 环境配置

1. **创建Conda环境**:
```bash
conda create -n zhongji python=3.11
conda activate zhongji
```

2. **安装后端依赖**:
```bash
cd backend
pip install -r requirements.txt
```

3. **安装前端依赖**:
```bash
cd frontend
npm install
```

### 一键启动

使用提供的Makefile脚本一键启动前后端服务：
```bash
make dev
```

### 手动启动

**后端:**
```bash
cd backend
conda activate zhongji
python start.py
```

**前端:**
```bash
cd frontend
npm run dev
```

## 功能模块

### 🏭 排班管理系统

#### 核心功能
- **数据上传**: 支持Excel文件上传（基础箱型库、岗位图谱、技能矩阵）
- **智能排班**: 基于技能匹配的自动排班算法
- **效果评价**: 人岗匹配度和工时利用率分析
- **请假调整**: 智能生成人员调整建议
- **多视图展示**: 支持日视图、周视图切换

#### 排班算法
```
技能匹配优先: 优先分配技能等级满足要求的员工
班组均衡: 保持班组内人员分配相对均衡
负荷均衡: 避免个别岗位过度集中或不足
```

### 📊 排产管理系统

#### 核心功能
- **订单管理**: 客户订单录入和管理
- **参数设置**: 生产参数配置和优化
- **方案对比**: 多算法排产方案比较
- **生产分析**: 详细的生产计划分析

#### 排产算法
- **FIFO**: 先进先出，按订单接收时间排序
- **SPT**: 最短时间优先，优先安排加工时间短的订单
- **EDD**: 最早交期优先，优先安排交期最近的订单
- **CR**: 关键比率优先，基于剩余时间和加工时间比率

### 📈 数据分析与优化

#### 评价指标
- **人岗匹配度**: `满足要求总人数 / 总人数 × 100%`
- **工时利用率**: `(实际配置工时 / 需求工时) × 100%`
- **完成率**: 订单按时完成的百分比
- **产能利用率**: 实际产出与设计产能的比率

## API文档

### 排班相关API
- `POST /scheduling/day` - 单日排班
- `POST /scheduling/week` - 一周排班
- `POST /scheduling/performance` - 性能指标计算
- `POST /scheduling/team-workloads` - 班组负荷计算

### 排产相关API
- `POST /production/schedule` - 生产排程
- `POST /production/optimize` - 排程优化
- `POST /production/gantt` - 甘特图数据
- `POST /production/summary` - 排程摘要

### 通用API
- `GET /health` - 健康检查
- `GET /algorithms/scheduling-rules` - 排班规则
- `GET /algorithms/production-rules` - 排产规则

## Docker部署

### 构建和启动
```bash
# 构建镜像
make docker-build

# 启动服务
make docker-up

# 查看日志
make docker-logs
```

### 生产环境
```bash
# 一键生产部署
make prod
```

### 服务地址

- 前端界面: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

## 测试功能

访问测试页面进行系统验证：
- **API连通性测试**: http://localhost:3000/test
- **健康检查**: http://localhost:8000/health
- **交互式API文档**: http://localhost:8000/docs

## 高级特性

### 🎯 智能优化引擎

系统集成了多种优化算法：
- **遗传算法**: 用于复杂排班优化
- **贪心算法**: 快速排产决策
- **动态规划**: 资源分配优化
- **机器学习**: 基于历史数据的预测优化

### 📊 可视化分析

- **甘特图**: 生产进度可视化
- **热力图**: 工作负荷分布
- **仪表板**: 实时关键指标监控
- **趋势分析**: 历史数据趋势图

### 🔧 系统集成

- **Excel集成**: 无缝导入导出Excel文件
- **REST API**: 标准化API接口
- **实时更新**: WebSocket实时数据更新
- **多格式导出**: PDF、Excel、CSV格式支持

## 技术架构

### 后端技术栈
- **FastAPI**: 现代化的Python Web框架
- **Pandas**: 强大的数据处理库
- **Pydantic**: 数据验证和设置管理
- **Uvicorn**: 高性能ASGI服务器

### 前端技术栈
- **Next.js 15**: React全栈框架
- **TypeScript**: 类型安全的JavaScript
- **Tailwind CSS**: 实用优先的CSS框架
- **Shadcn/ui**: 现代化组件库

### 开发工具
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Conda**: Python环境管理
- **Docker**: 容器化部署

## 故障排除

### 常见问题

#### 🔧 环境问题
```bash
# 检查环境
make check

# 强制关闭端口
make kill-ports

# 重新安装依赖
make install
```

#### 🐛 服务问题
```bash
# 清理缓存
make clean

# 重启服务
make restart

# 查看日志
make logs
```

#### 📦 Docker问题
```bash
# 清理Docker资源
make docker-clean

# 重新构建
make docker-build

# 重启容器
make docker-restart
```

## 开发指南

### 项目结构
```
├── frontend/                 # Next.js前端应用
│   ├── app/                 # 页面和布局
│   │   ├── paiban/         # 排班组件
│   │   ├── paichan/        # 排产组件
│   │   └── ui/             # 基础UI组件
│   └── lib/                # 工具函数
├── backend/                 # FastAPI后端应用
│   ├── main.py             # 主应用入口
│   ├── paiban.py           # 排班逻辑
│   ├── paichan.py          # 排产逻辑
│   └── models.py           # 数据模型
└── Makefile                # 构建和部署脚本
```

### 组件开发

创建新的React组件：
```tsx
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MyComponentProps {
  title: string
  onAction: () => void
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={onAction}>执行操作</Button>
      </CardContent>
    </Card>
  )
}
```

### API开发

添加新的API端点：
```python
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class RequestModel(BaseModel):
    name: str
    value: int

@router.post("/api/endpoint")
async def new_endpoint(data: RequestModel):
    return {"message": f"处理 {data.name} 成功"}
```

## 贡献指南

1. Fork项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如有问题或建议，请提交Issue或联系开发团队。

---

**智能排班排产系统** - 让生产管理更智能、更高效！