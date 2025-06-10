# file: app.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import pandas as pd
import io
import traceback

app = FastAPI()

# ---------------------------  CORS ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------  API ---------------------------
@app.post("/api/schedule")
async def schedule(
    file: UploadFile = File(...),
    startDate: str = Form(...),  # yyyy-mm-dd
    endDate: str = Form(...),    # yyyy-mm-dd
    totalCapacity: int = Form(...)  # 订单总量
):
    try:
        # ---------- 读取 Excel ----------
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        df.columns = [str(c).strip() for c in df.columns]
        print("📊 读取的列名：", df.columns.tolist())

        # ---------- 校验列 ----------
        required_columns = {"产能", "节拍", "能耗", "定员", "人效"}
        missing = required_columns - set(df.columns)
        if missing:
            return JSONResponse(
                status_code=400,
                content={"error": f"Excel 缺少列：{', '.join(missing)}"}
            )

        # ---------- 成本字段 ----------
        df["能耗成本"] = df["能耗"] * 1          # kWh × ¥1
        df["人效成本"] = df["人效"] * 360        # 人效 × ¥360/人·班
        df["总成本"] = df["能耗成本"] + df["人效成本"]

        # ---------- 日期 ----------
        start_dt = datetime.strptime(startDate, "%Y-%m-%d")
        end_dt = datetime.strptime(endDate, "%Y-%m-%d")
        max_days = (end_dt - start_dt).days + 1
        print(f"📅 日期区间: {startDate} ~ {endDate}（{max_days} 天）")

        # ---------- 可选日产能 ----------
        capacities = sorted(df["产能"].unique())
        print("📦 可选日产能：", capacities)

        # ---------- 候选日产能 ----------
        avg_daily = totalCapacity // max_days
        greater_or_equal = [c for c in capacities if c >= avg_daily]
        if not greater_or_equal:
            return JSONResponse(
                status_code=400,
                content={"error": "平均日产能大于所有可选产能"}
            )

        base = min(greater_or_equal, key=lambda x: abs(x - avg_daily))
        base_idx = capacities.index(base)
        daily_options = []
        if base_idx > 0:
            daily_options.append(capacities[base_idx - 1])
        daily_options.append(base)
        if base_idx < len(capacities) - 1:
            daily_options.append(capacities[base_idx + 1])
        daily_options = sorted(set(daily_options))
        print("🔢 排产候选日产能：", daily_options)

        # ---------- 按产能分组（取最低成本行） ----------
        capacity_groups = {
            cap: g.sort_values("总成本").reset_index(drop=True)
            for cap, g in df.groupby("产能")
        }

        results, seen = [], set()

        # ---------- 生成所有可行方案 ----------
        for daily in daily_options:
            if daily not in capacity_groups:
                continue

            for days in range(1, max_days + 1):
                cap_first = (days - 1) * daily
                if cap_first >= totalCapacity:
                    break  # 继续增加天数只会更超产

                last_cap = totalCapacity - cap_first
                if last_cap not in capacity_groups:
                    continue

                key = (daily, days, last_cap)
                if key in seen:
                    continue
                seen.add(key)

                first_row = capacity_groups[daily].iloc[0]
                last_row = capacity_groups[last_cap].iloc[0]

                sched_df = pd.concat(
                    [first_row.to_frame().T] * (days - 1) + [last_row.to_frame().T],
                    ignore_index=True
                )

                # 补日期
                sched_df.insert(
                    0,
                    "日期",
                    [(start_dt + timedelta(days=i)).date().isoformat()
                     for i in range(days)]
                )

                # 重新计算成本（安全起见）
                sched_df["能耗成本"] = sched_df["能耗"] * 1
                sched_df["人效成本"] = sched_df["人效"] * 360
                sched_df["总成本"] = sched_df["能耗成本"] + sched_df["人效成本"]

                total_cost = float(sched_df["总成本"].sum())
                total_cap = int(sched_df["产能"].sum())

                plan_name = (
                    f"{daily}产能 × {days}天"
                    if last_cap == daily
                    else f"{daily}产能 × {days-1}天 + {last_cap}产能 × 1天"
                )

                results.append({
                    "方案名称": plan_name,
                    "dailySchedule": [
                        {
                            "日期": r["日期"],
                            "产能": int(r["产能"]),
                            "节拍": r["节拍"],
                            "能耗": r["能耗"],
                            "定员": r["定员"],
                            "人效": r["人效"],
                            "能耗成本": round(r["能耗成本"], 1),
                            "人效成本": round(r["人效成本"], 1),
                            "总成本": round(r["总成本"], 1)
                        } for _, r in sched_df.iterrows()
                    ],
                    "summary": {
                        "日产能": int(daily),
                        "所需天数": days,
                        "最后一天产能": int(last_cap),
                        "总产能": total_cap,
                        "总成本": round(total_cost, 1)
                    }
                })

        if not results:
            return JSONResponse(
                status_code=400,
                content={"error": "未能找到满足条件的排程组合"}
            )

        # ---------- 排序并裁剪前 5 ----------
        results.sort(key=lambda r: (r["summary"]["总成本"],
                                    r["summary"]["所需天数"]))
        results = results[:5]

        print("✅ 方案计算完成，返回结果（最多 5 条）")
        return JSONResponse(results)

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

# --------------------------- Stand-alone ---------------------------
# 调试： uvicorn app:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", port=8000, reload=True)
