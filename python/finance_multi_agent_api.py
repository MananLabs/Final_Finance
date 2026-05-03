"""FastAPI backend for the Finance AI multi-agent Groq pipeline."""

from __future__ import annotations

import json
import os
import time
from typing import Any, Literal

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field

load_dotenv()


MODEL_NAME = "openai/gpt-oss-120b"
TEMPERATURE = 0.3
MAX_COMPLETION_TOKENS = 4096
TOP_P = 1


class FinanceInput(BaseModel):
    revenue: float | None = None
    expenses: float | None = None
    profit: float | None = None
    monthlyBurn: float | None = None
    runwayMonths: float | None = None
    trendSummary: str | None = None
    transaction_count: int | None = None
    debug_mode: bool = False
    simulate_treasury_failure: bool = False
    research_override: dict[str, Any] | None = None


def _require_api_key() -> str:
    api_key = os.getenv("Master_AI")
    if not api_key:
        raise RuntimeError("Master_AI is not configured")
    return api_key


def log_bot(bot_name: str) -> None:
    print(f"🚀 Running {bot_name}...")


def _safe_json_text(value: Any) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False, default=str)


def _extract_json_payload(text: str) -> Any:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start_candidates = [text.find("{"), text.find("[")]
        start_candidates = [index for index in start_candidates if index != -1]
        if not start_candidates:
          
            raise

        start = min(start_candidates)
        end_object = text.rfind("}")
        end_array = text.rfind("]")
        end = max(end_object, end_array)
        if end <= start:
            raise
        return json.loads(text[start : end + 1])


def call_groq(prompt: str) -> str:
    api_key = _require_api_key()
    client = Groq(api_key=api_key)
    completion = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=TEMPERATURE,
        max_completion_tokens=MAX_COMPLETION_TOKENS,
        top_p=TOP_P,
        stream=False,
    )
    return completion.choices[0].message.content or ""


def _call_json_bot(prompt: str) -> dict[str, Any]:
    raw = call_groq(prompt)
    parsed = _extract_json_payload(raw)
    if not isinstance(parsed, dict):
        raise ValueError("Model returned non-object JSON")
    return parsed


def _wrap_output(bot_name: str, output: dict[str, Any], duration_ms: int) -> dict[str, Any]:
    return {
        "bot": bot_name,
        "output": output,
        "meta": {"duration_ms": duration_ms},
    }


def run_research_ai(input_data: Any) -> dict[str, Any]:
    bot_name = "Research AI"
    log_bot(bot_name)
    start = time.perf_counter()
    prompt = f"""
You are Research AI.

Input Data:
{_safe_json_text(input_data)}

Tasks:
- Analyze trends
- Identify risks
- Detect opportunities

Return ONLY JSON:
{{
  "bot": "Research AI",
  "market_summary": "",
  "key_trends": [],
  "risk_signals": [],
  "opportunities": []
}}
"""
    output = _call_json_bot(prompt)
    return _wrap_output(bot_name, output, int((time.perf_counter() - start) * 1000))


def run_planning_ai(input_data: Any, research_output: Any) -> dict[str, Any]:
    bot_name = "Planning AI"
    log_bot(bot_name)
    start = time.perf_counter()
    prompt = f"""
You are Planning AI.

Input:
{_safe_json_text(input_data)}

Research:
{_safe_json_text(research_output)}

Tasks:
- Forecast
- Burn rate
- Runway

Return ONLY JSON:
{{
  "bot": "Planning AI",
  "forecast": {{}},
  "burn_rate": "",
  "runway": "",
  "scenarios": {{
    "best": "",
    "worst": "",
    "base": ""
  }}
}}
"""
    output = _call_json_bot(prompt)
    return _wrap_output(bot_name, output, int((time.perf_counter() - start) * 1000))


def run_accounting_ai(input_data: Any) -> dict[str, Any]:
    bot_name = "Accounting AI"
    log_bot(bot_name)
    start = time.perf_counter()
    prompt = f"""
You are Accounting AI.

Input:
{_safe_json_text(input_data)}

Tasks:
- Categorize
- Detect anomalies

Return ONLY JSON:
{{
  "bot": "Accounting AI",
  "categorized_transactions": [],
  "anomalies": [],
  "fraud_flags": []
}}
"""
    output = _call_json_bot(prompt)
    return _wrap_output(bot_name, output, int((time.perf_counter() - start) * 1000))


def run_treasury_ai(input_data: Any, accounting_output: Any, simulate_failure: bool = False) -> dict[str, Any]:
    bot_name = "Treasury AI"
    log_bot(bot_name)
    start = time.perf_counter()
    if simulate_failure:
        output = {"bot": bot_name, "output": "TEST FAILURE"}
        return _wrap_output(bot_name, output, int((time.perf_counter() - start) * 1000))

    prompt = f"""
You are Treasury AI.

Input:
{_safe_json_text(input_data)}

Accounting:
{_safe_json_text(accounting_output)}

Tasks:
- Cash flow
- Liquidity

Return ONLY JSON:
{{
  "bot": "Treasury AI",
  "cash_position": "",
  "cash_flow_summary": "",
  "liquidity_risks": []
}}
"""
    output = _call_json_bot(prompt)
    return _wrap_output(bot_name, output, int((time.perf_counter() - start) * 1000))


def run_compliance_ai(input_data: Any) -> dict[str, Any]:
    bot_name = "Compliance AI"
    log_bot(bot_name)
    start = time.perf_counter()
    prompt = f"""
You are Compliance AI.

Input:
{_safe_json_text(input_data)}

Tasks:
- Detect compliance issues

Return ONLY JSON:
{{
  "bot": "Compliance AI",
  "compliance_issues": [],
  "tax_flags": [],
  "deadlines": []
}}
"""
    output = _call_json_bot(prompt)
    return _wrap_output(bot_name, output, int((time.perf_counter() - start) * 1000))


def run_reporting_ai(input_data: Any, planning_output: Any, treasury_output: Any) -> dict[str, Any]:
    bot_name = "Reporting AI"
    log_bot(bot_name)
    start = time.perf_counter()
    prompt = f"""
You are Reporting AI.

Input:
{_safe_json_text(input_data)}

Planning:
{_safe_json_text(planning_output)}

Treasury:
{_safe_json_text(treasury_output)}

Tasks:
- KPIs
- Performance summary

Return ONLY JSON:
{{
  "bot": "Reporting AI",
  "kpis": {{
    "revenue": "",
    "expenses": "",
    "profit": ""
  }},
  "performance_summary": "",
  "insights": []
}}
"""
    output = _call_json_bot(prompt)
    return _wrap_output(bot_name, output, int((time.perf_counter() - start) * 1000))


def run_decision_ai(research: Any, planning: Any, reporting: Any, treasury: Any, compliance: Any) -> dict[str, Any]:
    bot_name = "Decision AI"
    log_bot(bot_name)
    start = time.perf_counter()
    prompt = f"""
You are Decision AI.

Input:
Research: {_safe_json_text(research)}
Planning: {_safe_json_text(planning)}
Reporting: {_safe_json_text(reporting)}
Treasury: {_safe_json_text(treasury)}
Compliance: {_safe_json_text(compliance)}

Tasks:
- Evaluate risks
- Give decisions

Return ONLY JSON:
{{
  "bot": "Decision AI",
  "decisions": [],
  "risk_score": "",
  "confidence_score": "",
  "recommended_actions": []
}}
"""
    output = _call_json_bot(prompt)
    return _wrap_output(bot_name, output, int((time.perf_counter() - start) * 1000))


def run_chief_command_ai(decision: Any, reporting: Any, compliance: Any) -> dict[str, Any]:
    bot_name = "Chief Command AI"
    log_bot(bot_name)
    start = time.perf_counter()
    prompt = f"""
You are Chief Finance AI.

Input:
Decision: {_safe_json_text(decision)}
Reporting: {_safe_json_text(reporting)}
Compliance: {_safe_json_text(compliance)}

Tasks:
- Prioritize
- Final summary

Return ONLY JSON:
{{
  "bot": "Chief Command AI",
  "priority": "CRITICAL | WARNING | NORMAL",
  "final_summary": "",
  "urgent_actions": [],
  "alerts": []
}}
"""
    output = _call_json_bot(prompt)
    return _wrap_output(bot_name, output, int((time.perf_counter() - start) * 1000))


def run_full_system(input_data: Any) -> dict[str, Any]:
    execution_flow: list[str] = []
    bot_outputs: dict[str, Any] = {}

    research = run_research_ai(input_data)
    execution_flow.append("Research AI")
    bot_outputs["research"] = research

    planning = run_planning_ai(input_data, research)
    execution_flow.append("Planning AI")
    bot_outputs["planning"] = planning

    accounting = run_accounting_ai(input_data)
    execution_flow.append("Accounting AI")
    bot_outputs["accounting"] = accounting

    treasury = run_treasury_ai(input_data, accounting, bool(input_data.get("simulate_treasury_failure")))
    execution_flow.append("Treasury AI")
    bot_outputs["treasury"] = treasury

    compliance = run_compliance_ai(input_data)
    execution_flow.append("Compliance AI")
    bot_outputs["compliance"] = compliance

    reporting = run_reporting_ai(input_data, planning, treasury)
    execution_flow.append("Reporting AI")
    bot_outputs["reporting"] = reporting

    decision = run_decision_ai(research, planning, reporting, treasury, compliance)
    execution_flow.append("Decision AI")
    bot_outputs["decision"] = decision

    final = run_chief_command_ai(decision, reporting, compliance)
    execution_flow.append("Chief Command AI")
    bot_outputs["final"] = final

    return {
        "execution_flow": execution_flow,
        "bot_outputs": bot_outputs,
        "research": research,
        "planning": planning,
        "accounting": accounting,
        "treasury": treasury,
        "compliance": compliance,
        "reporting": reporting,
        "decision": decision,
        "final": final,
    }


app = FastAPI(title="Finance AI Multi-Agent API", version="1.0.0")

origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/run")
def run_pipeline(payload: FinanceInput) -> dict[str, Any]:
    try:
        start = time.perf_counter()
        input_data = payload.model_dump()

        if payload.research_override is not None:
            input_data["research_override"] = payload.research_override

        if payload.research_override:
            input_data["manual_research_override"] = payload.research_override

        result = run_full_system(input_data)
        latency_seconds = round(time.perf_counter() - start, 3)
        result["latency_seconds"] = latency_seconds
        result["validation"] = {
            "bot_failure_test_enabled": payload.simulate_treasury_failure,
            "debug_mode": payload.debug_mode,
            "output_dependency_check": "Planning AI consumes Research AI output directly",
        }
        return result
    except Exception as exc:
        return {"error": str(exc), "type": type(exc).__name__}