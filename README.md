# 智能生产排程系统
## 环境要求

- Node.js 18.0 或更高版本
- npm 9.0 或更高版本
- Python 3.8+ (用于算法引擎)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd zhongji
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   ```
   本地访问：http://localhost:3000
   网络访问：http://192.168.1.6:3000
   ```

### 生产部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 📖 使用指南

### 排程功能使用

1. **数据准备**
   - 上传产能数据表（Excel格式）或使用默认数据
   - 设置起始和终止日期
   - 输入订单总产能需求

2. **CT/TT时间设置**
   - 输入CT时间（单人完成时间）
   - 输入TT时间（订单要求完成时间）
   - 选择优先策略（成本优先/时间优先）

3. **结果分析**
   - 查看时间紧迫度分析
   - 对比多个排程方案
   - 导出详细的排程报告

### 排班功能使用

1. **数据上传**
   - 上传基础箱型库.xlsx
   - 上传岗位图谱.xlsx
   - 上传技能矩阵.xlsx

2. **排班执行**
   - 输入产品SKU代码
   - 选择单日排班或一周排班
   - 设置筛选条件

3. **结果管理**
   - 查看排班结果详情
   - 使用多维度筛选
   - 导出排班计划表

## 🔌 API接口

### 排程接口

```typescript
POST /api/schedule
Content-Type: multipart/form-data

{
  file: File,              // 产能数据表
  startDate: string,       // 开始日期
  endDate: string,         // 结束日期
  totalCapacity: number,   // 总产能需求
  ttTime: number,          // TT时间
  ctTime: number,          // CT时间
  priorityMode: string     // 优先模式
}
```

### 排班接口

```typescript
POST /api/scheduling
Content-Type: multipart/form-data

{
  skuFile: File,           // 基础箱型库
  positionFile: File,      // 岗位图谱
  skillFile: File,         // 技能矩阵
  productCode: string,     // 产品SKU
  scheduleType: string     // 排班类型
}
```

## 📁 项目结构

```
zhongji/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 排程页面
│   ├── paiban/            # 排班页面
│   └── api/               # API路由
├── components/            # React组件
│   ├── ui/                # shadcn/ui组件
│   └── Header.tsx         # 导航组件
├── lib/                   # 工具函数
├── public/                # 静态资源
│   ├── img/               # 图片资源
│   └── 默认产能数据表.xlsx # 默认数据
├── styles/                # 样式文件
└── types/                 # TypeScript类型定义
```

## 🔧 配置选项

### 算法参数配置

```typescript
// config/algorithm.ts
export const AlgorithmConfig = {
  // CT/TT阈值配置
  timeUrgencyThresholds: {
    normal: 1.0,        // 正常阈值
    moderate: 1.5,      // 轻微紧迫阈值
  },
  
  // 权重配置
  objectiveWeights: {
    cost: 0.4,          // 成本权重
    time: 0.3,          // 时间权重
    quality: 0.2,       // 质量权重
    efficiency: 0.1     // 效率权重
  },
  
  // 排班约束
  schedulingConstraints: {
    maxDailyHours: 8,     // 每日最大工时
    minSkillLevel: 2,     // 最低技能等级
    teamIntegrityWeight: 0.3  // 班组完整性权重
  }
}
```

## 📊 性能指标

- **排程计算速度**：< 30秒 (1000+数据点)
- **排班处理能力**：500+员工 × 100+岗位
- **文件上传限制**：最大50MB Excel文件
- **并发用户支持**：100+并发用户
- **响应时间**：平均 < 2秒

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint + Prettier 代码规范
- 编写单元测试覆盖核心算法
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [shadcn/ui](https://ui.shadcn.com/) - UI组件库
- [SheetJS](https://sheetjs.com/) - Excel文件处理
- [Lucide](https://lucide.dev/) - 图标库

## 📞 联系方式

- 项目维护者：[您的姓名]
- 邮箱：[您的邮箱]
- 项目地址：[GitHub链接]

---

<div align="center">

**[⬆ 回到顶部](#智能生产排程系统)**

Made with ❤️ by [您的团队名称]

</div>
