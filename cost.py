# 封装成函数
from typing import Tuple, List
import pandas as pd

def find_min_cost_schedule(df: pd.DataFrame, start_date: str, end_date: str, order_quantity: int) -> Tuple[pd.DataFrame, dict]:
    from itertools import product
    from datetime import datetime, timedelta

    # 计算天数
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    num_days = (end_dt - start_dt).days + 1

    # 添加成本字段
    df = df.copy()
    df["能耗成本"] = df["能耗"] * 1
    df["人效成本"] = df["人效"] * 360
    df["总成本"] = df["能耗成本"] + df["人效成本"]

    # 遍历所有组合
    best_combo = None
    min_total_cost = float("inf")
    best_total_capacity = 0
    best_combo_details = []

    all_combinations = list(product(df.index, repeat=num_days))

    for combo in all_combinations:
        selected = df.loc[list(combo)]
        total_capacity = selected["产能"].sum()
        total_cost = selected["总成本"].sum()

        if total_capacity >= order_quantity and total_cost < min_total_cost:
            min_total_cost = total_cost
            best_combo = combo
            best_total_capacity = total_capacity
            best_combo_details = selected.copy()

    # 添加日期列
    if isinstance(best_combo_details, pd.DataFrame) and not best_combo_details.empty:
        date_range = [start_dt + timedelta(days=i) for i in range(num_days)]
        best_combo_details.insert(0, "日期", [d.date() for d in date_range])
        summary = {
            "总产能": best_total_capacity,
            "总成本": round(min_total_cost, 2)
        }
        return best_combo_details, summary
    else:
        return pd.DataFrame(), {"总产能": 0, "总成本": float("inf")}

schedule_df, summary = find_min_cost_schedule(
    df=pd.read_excel("完整产能数据表.xlsx"),                # 基础数据表
    start_date="2025-05-13",         # 开始日期
    end_date="2025-05-16",           # 结束日期
    order_quantity=500             # 订单总产能需求
)

print(schedule_df)   # 输出每日排程详情
print(summary)       # 输出总产能与总成本

