# 算法详细文档

## 目录
- [概述](#概述)
- [排程算法](#排程算法)
- [排班算法](#排班算法)
- [算法性能分析](#算法性能分析)
- [参数调优指南](#参数调优指南)

## 概述

智能生产排程系统采用了多项先进的算法技术，包括CT/TT时间优化、多目标优化、约束满足和启发式搜索等。本文档详细介绍这些算法的数学模型、实现逻辑和优化策略。

## 排程算法

### 1. CT/TT时间优化算法

#### 1.1 数学模型

**时间紧迫度计算**：
```
R = CT / TT
```
其中：
- R: 时间紧迫度比值
- CT: Cycle Time（单人完成时间）
- TT: Takt Time（订单要求完成时间）

**时间利用率计算**：
```
U = TT / (D × H) × 100%
```
其中：
- U: 时间利用率
- D: 计划天数
- H: 每日工作小时数（默认8小时）

#### 1.2 决策矩阵

| 紧迫度范围 | 决策策略 | 熟练工等级 | 成本系数 | 效率系数 |
|-----------|----------|------------|----------|----------|
| R ≤ 1.0   | 成本优先 | 2-3级     | 1.0-1.4  | 0.8-0.9  |
| 1.0 < R ≤ 1.5 | 平衡策略 | 3-4级 | 1.4-1.6  | 0.9-1.0  |
| R > 1.5   | 时间优先 | 4级       | 1.6      | 1.0      |

#### 1.3 多目标优化函数

```
minimize F(x) = w₁·C(x) + w₂·T(x) + w₃·Q(x) + w₄·E(x)
```

其中：
- C(x): 总成本函数
- T(x): 时间偏差函数
- Q(x): 质量损失函数
- E(x): 效率损失函数
- w₁, w₂, w₃, w₄: 权重系数

**成本函数**：
```
C(x) = Σᵢ (pᵢ × sᵢ × hᵢ × cᵢ)
```
- pᵢ: 第i天的产能
- sᵢ: 第i天的人员数量
- hᵢ: 第i天的工时
- cᵢ: 第i天的单位成本

**时间偏差函数**：
```
T(x) = max(0, Σᵢ CTᵢ - TT)²
```

### 2. 动态规划算法

#### 2.1 状态定义
```
dp[i][j][k] = 在第i天，累计产能为j，使用熟练工等级为k时的最小成本
```

#### 2.2 状态转移方程
```
dp[i][j][k] = min{dp[i-1][j-p][k'] + cost(i, p, k)}
```
其中：
- p: 第i天的产能
- k': 前一天的熟练工等级
- cost(i, p, k): 第i天产能p使用等级k的成本

#### 2.3 算法复杂度
- 时间复杂度: O(D × P × K²)
- 空间复杂度: O(D × P × K)
- D: 天数, P: 最大产能, K: 熟练工等级数

### 3. 启发式优化算法

#### 3.1 贪心策略
```python
def greedy_schedule(demands, resources):
    schedule = []
    for day in demands:
        # 选择当天最优的资源配置
        best_config = find_optimal_config(day, resources)
        schedule.append(best_config)
        # 更新可用资源
        resources = update_resources(resources, best_config)
    return schedule
```

#### 3.2 局部搜索优化
```python
def local_search_optimization(initial_solution):
    current = initial_solution
    best = current
    
    for iteration in range(max_iterations):
        neighbors = generate_neighbors(current)
        current = select_best_neighbor(neighbors)
        
        if objective_function(current) < objective_function(best):
            best = current
            
        if convergence_check(current):
            break
    
    return best
```

## 排班算法

### 1. 技能匹配算法

#### 1.1 匹配分数计算
```python
def calculate_match_score(employee, position):
    skill_score = skill_level_match(employee.skill, position.required_skill)
    team_score = team_compatibility(employee.team, position.work_center)
    experience_score = experience_match(employee.experience, position.complexity)
    
    # 加权求和
    total_score = (
        0.4 * skill_score + 
        0.3 * team_score + 
        0.3 * experience_score
    )
    
    return total_score
```

#### 1.2 技能等级匹配函数
```python
def skill_level_match(employee_level, required_level):
    if employee_level < required_level:
        return 0  # 不满足要求
    
    # 计算匹配度：满足要求 + 超出奖励 - 过度匹配惩罚
    over_qualification = employee_level - required_level
    base_score = 0.8
    bonus = min(0.2, over_qualification * 0.05)
    penalty = max(0, (over_qualification - 1) * 0.02)
    
    return base_score + bonus - penalty
```

### 2. 约束满足算法

#### 2.1 约束类型定义

**硬约束（必须满足）**：
1. 技能等级约束: `skill_level(eᵢ) ≥ required_level(pⱼ)`
2. 时间冲突约束: `∀i,j: time_conflict(eᵢ, pⱼ) = false`
3. 容量约束: `Σᵢ assigned(pⱼ) ≤ capacity(pⱼ)`

**软约束（尽量满足）**：
1. 班组完整性: `team_integrity_score = Σⱼ same_team_ratio(pⱼ)`
2. 负荷平衡: `workload_balance = 1 - std_dev(workload)`

#### 2.2 约束满足算法
```python
def constraint_satisfaction_solver(positions, employees):
    # 初始化变量域
    domains = initialize_domains(positions, employees)
    
    # 约束传播
    domains = constraint_propagation(domains, hard_constraints)
    
    # 回溯搜索
    assignment = backtrack_search(domains, soft_constraints)
    
    return assignment

def backtrack_search(domains, constraints):
    if is_complete(assignment):
        return assignment
    
    var = select_unassigned_variable(domains)
    
    for value in order_domain_values(var, domains):
        if is_consistent(var, value, constraints):
            assignment[var] = value
            inferences = inference(var, value, domains)
            
            if inferences != failure:
                result = backtrack_search(domains, constraints)
                if result != failure:
                    return result
            
            remove_inferences(inferences)
        
        remove_assignment(var)
    
    return failure
```

### 3. 周期性排班算法

#### 3.1 一周排班策略
```python
def weekly_scheduling(week_demands, employees):
    weekly_schedule = {}
    used_employees = set()
    
    # 按天进行排班，避免员工重复分配
    for day, demands in week_demands.items():
        available_employees = [e for e in employees if e.id not in used_employees]
        
        daily_schedule = daily_scheduling_algorithm(demands, available_employees)
        
        # 更新已使用员工列表
        for assignment in daily_schedule:
            used_employees.add(assignment.employee_id)
        
        weekly_schedule[day] = daily_schedule
    
    return optimize_weekly_schedule(weekly_schedule)
```

#### 3.2 负荷平衡优化
```python
def balance_workload(weekly_schedule):
    # 计算每位员工的周工作量
    employee_workload = calculate_weekly_workload(weekly_schedule)
    
    # 识别负荷不均衡的情况
    overloaded = [e for e, load in employee_workload.items() if load > max_weekly_hours]
    underloaded = [e for e, load in employee_workload.items() if load < min_weekly_hours]
    
    # 重新分配工作负荷
    for overloaded_emp in overloaded:
        for underloaded_emp in underloaded:
            if can_transfer_workload(overloaded_emp, underloaded_emp):
                transfer_assignments(overloaded_emp, underloaded_emp)
    
    return weekly_schedule
```

## 算法性能分析

### 1. 时间复杂度分析

| 算法模块 | 最坏情况 | 平均情况 | 最好情况 |
|---------|----------|----------|----------|
| CT/TT优化 | O(D×P×K²) | O(D×P×K) | O(D×P) |
| 技能匹配 | O(E×P²) | O(E×P) | O(E×P) |
| 约束满足 | O(E^P) | O(E^(P/2)) | O(E×P) |
| 周期排班 | O(7×E×P) | O(7×E×P) | O(7×E×P) |

其中：
- D: 天数
- P: 岗位数
- K: 熟练工等级数
- E: 员工数

### 2. 空间复杂度分析

| 数据结构 | 空间复杂度 | 说明 |
|---------|------------|------|
| 排程矩阵 | O(D×P×K) | 存储每天每个岗位的排程方案 |
| 技能矩阵 | O(E×P) | 存储员工技能与岗位的匹配关系 |
| 约束图 | O(P²) | 存储岗位间的约束关系 |
| 搜索树 | O(P×E) | 回溯搜索的状态空间 |

### 3. 算法收敛性分析

#### 3.1 收敛条件
```python
def convergence_check(current_solution, previous_solution, threshold=0.001):
    improvement = abs(objective_value(current_solution) - objective_value(previous_solution))
    relative_improvement = improvement / objective_value(previous_solution)
    
    return relative_improvement < threshold
```

#### 3.2 收敛速度优化
- **自适应步长**：根据梯度大小调整搜索步长
- **多起点搜索**：从多个初始解开始搜索，避免局部最优
- **模拟退火**：接受一定概率的劣化解，跳出局部最优

## 参数调优指南

### 1. CT/TT阈值调优

```python
# 根据历史数据统计调整阈值
def optimize_ct_tt_thresholds(historical_data):
    success_rates = analyze_success_rates(historical_data)
    
    # 找到成功率突变点
    normal_threshold = find_threshold_point(success_rates, target_success_rate=0.95)
    moderate_threshold = find_threshold_point(success_rates, target_success_rate=0.80)
    
    return {
        'normal': normal_threshold,
        'moderate': moderate_threshold
    }
```

### 2. 权重系数调优

```python
# 使用遗传算法优化权重系数
def optimize_weights(training_data):
    population = initialize_weight_population(population_size=100)
    
    for generation in range(max_generations):
        # 评估适应度
        fitness_scores = evaluate_fitness(population, training_data)
        
        # 选择、交叉、变异
        population = genetic_operations(population, fitness_scores)
        
        # 收敛检查
        if convergence_reached(fitness_scores):
            break
    
    return best_individual(population)
```

### 3. 性能调优建议

#### 3.1 数据预处理优化
- 使用索引加速技能矩阵查询
- 预计算常用的匹配分数
- 压缩稀疏矩阵存储

#### 3.2 并行化优化
```python
# 并行处理多个排程方案
def parallel_scheduling(demands, resources, num_workers=4):
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = []
        
        # 为每个工作线程分配不同的初始解
        for i in range(num_workers):
            initial_solution = generate_random_solution(demands, resources, seed=i)
            future = executor.submit(optimize_solution, initial_solution)
            futures.append(future)
        
        # 收集结果并选择最优解
        solutions = [future.result() for future in futures]
        return select_best_solution(solutions)
```

#### 3.3 内存优化
- 使用流式处理大文件
- 实现LRU缓存减少重复计算
- 及时释放不需要的中间结果

### 4. 实时性能监控

```python
class AlgorithmProfiler:
    def __init__(self):
        self.metrics = {}
    
    def profile_algorithm(self, algorithm_name, func, *args, **kwargs):
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss
        
        result = func(*args, **kwargs)
        
        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss
        
        self.metrics[algorithm_name] = {
            'execution_time': end_time - start_time,
            'memory_usage': end_memory - start_memory,
            'solution_quality': evaluate_solution_quality(result)
        }
        
        return result
    
    def generate_report(self):
        return {
            'performance_summary': self.metrics,
            'recommendations': self.generate_optimization_recommendations()
        }
```

## 总结

本文档详细介绍了智能生产排程系统中使用的核心算法，包括数学模型、实现细节和性能优化策略。通过合理的参数调优和算法优化，系统能够在保证解决方案质量的同时，实现良好的计算性能和用户体验。

在实际应用中，建议根据具体的业务需求和数据特征，对算法参数进行持续的调优和改进，以获得最佳的排程效果。 