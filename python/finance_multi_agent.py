"""Finance AI multi-agent Groq MVP.

Each bot runs independently, returns structured JSON, and feeds the next
stage in the strict sequence:
Research -> Planning -> Accounting -> Treasury -> Compliance -> Reporting ->
Decision -> Chief Command.

Usage:
    export GROQ_API_KEY="..."
    python python/finance_multi_agent.py --input input.json

If --input is omitted, the script reads JSON from stdin.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any

from groq import Groq


MODEL_NAME = "openai/gpt-oss-120b"
TEMPERATURE = 0.3
MAX_COMPLETION_TOKENS = 4096
TOP_P = 1


def _require_api_key() -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")
    return api_key


_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=_require_api_key())
    return _client


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
    completion = _get_client().chat.completions.create(
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


def run_research_ai(input_data: Any) -> dict[str, Any]:
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
  "market_summary": "",
  "key_trends": [],
  "risk_signals": [],
  "opportunities": []
}}
"""
    return _call_json_bot(prompt)


def run_planning_ai(input_data: Any, research_output: Any) -> dict[str, Any]:
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
    return _call_json_bot(prompt)


def run_accounting_ai(input_data: Any) -> dict[str, Any]:
    prompt = f"""
You are Accounting AI.

Input:
{_safe_json_text(input_data)}

Tasks:
- Categorize
- Detect anomalies

Return ONLY JSON:
{{
  "categorized_transactions": [],
  "anomalies": [],
  "fraud_flags": []
}}
"""
    return _call_json_bot(prompt)


def run_treasury_ai(input_data: Any, accounting_output: Any) -> dict[str, Any]:
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
  "cash_position": "",
  "cash_flow_summary": "",
  "liquidity_risks": []
}}
"""
    return _call_json_bot(prompt)


def run_compliance_ai(input_data: Any) -> dict[str, Any]:
    prompt = f"""
You are Compliance AI.

Input:
{_safe_json_text(input_data)}

Tasks:
- Detect compliance issues

Return ONLY JSON:
{{
  "compliance_issues": [],
  "tax_flags": [],
  "deadlines": []
}}
"""
    return _call_json_bot(prompt)


def run_reporting_ai(input_data: Any, planning_output: Any, treasury_output: Any) -> dict[str, Any]:
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
  "kpis": {{
    "revenue": "",
    "expenses": "",
    "profit": ""
  }},
  "performance_summary": "",
  "insights": []
}}
"""
    return _call_json_bot(prompt)


def run_decision_ai(
    research: Any,
    planning: Any,
    reporting: Any,
    treasury: Any,
    compliance: Any,
) -> dict[str, Any]:
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
  "decisions": [],
  "risk_score": "",
  "confidence_score": "",
  "recommended_actions": []
}}
"""
    return _call_json_bot(prompt)


def run_chief_command_ai(decision: Any, reporting: Any, compliance: Any) -> dict[str, Any]:
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
  "priority": "CRITICAL | WARNING | NORMAL",
  "final_summary": "",
  "urgent_actions": [],
  "alerts": []
}}
"""
    return _call_json_bot(prompt)


def run_full_system(input_data: Any) -> dict[str, Any]:
    research = run_research_ai(input_data)
    planning = run_planning_ai(input_data, research)
    accounting = run_accounting_ai(input_data)
    treasury = run_treasury_ai(input_data, accounting)
    compliance = run_compliance_ai(input_data)
    reporting = run_reporting_ai(input_data, planning, treasury)
    decision = run_decision_ai(research, planning, reporting, treasury, compliance)
    final = run_chief_command_ai(decision, reporting, compliance)

    return final


def _load_input(path: str | None) -> Any:
    if path:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)

    return json.load(sys.stdin)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the Finance AI Groq multi-agent pipeline.")
    parser.add_argument(
        "--input",
        help="Path to a JSON file with the pipeline input. If omitted, reads JSON from stdin.",
    )
    args = parser.parse_args()

    try:
        input_data = _load_input(args.input)
        result = run_full_system(input_data)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())