#!/usr/bin/env python3
"""Test bot execution with step-by-step output"""

import sys
import json
import os
from dotenv import load_dotenv

# Add the backend to path
sys.path.insert(0, "F:\\services\\Finance")

from python.finance_multi_agent_api import (
    run_research_ai,
    run_planning_ai,
    run_accounting_ai,
    run_treasury_ai,
    run_compliance_ai,
    run_reporting_ai,
    run_decision_ai,
    run_chief_command_ai,
)

load_dotenv()

# Sample financial data
input_data = {
    "revenue": 250000,
    "expenses": 180000,
    "profit": 70000,
    "monthlyBurn": 45000,
    "runwayMonths": 3.5,
    "trendSummary": "Revenue growing 15% MoM, expenses stable",
    "transaction_count": 142,
}

print("=" * 80)
print("🤖 MULTI-AGENT FINANCE AI SYSTEM - STEP-BY-STEP EXECUTION")
print("=" * 80)

try:
    # 1. Research AI
    print("\n📊 1️⃣  RESEARCH AI")
    print("-" * 80)
    research = run_research_ai(input_data)
    print(json.dumps(research, indent=2))
    research_output = research.get("output", {})

    # 2. Planning AI
    print("\n📈 2️⃣  PLANNING AI")
    print("-" * 80)
    planning = run_planning_ai(input_data, research_output)
    print(json.dumps(planning, indent=2))
    planning_output = planning.get("output", {})

    # 3. Accounting AI
    print("\n💰 3️⃣  ACCOUNTING AI")
    print("-" * 80)
    accounting = run_accounting_ai(input_data)
    print(json.dumps(accounting, indent=2))
    accounting_output = accounting.get("output", {})

    # 4. Treasury AI
    print("\n💳 4️⃣  TREASURY AI")
    print("-" * 80)
    treasury = run_treasury_ai(input_data, accounting_output)
    print(json.dumps(treasury, indent=2))
    treasury_output = treasury.get("output", {})

    # 5. Compliance AI
    print("\n⚖️  5️⃣  COMPLIANCE AI")
    print("-" * 80)
    compliance = run_compliance_ai(input_data)
    print(json.dumps(compliance, indent=2))
    compliance_output = compliance.get("output", {})

    # 6. Reporting AI
    print("\n📋 6️⃣  REPORTING AI")
    print("-" * 80)
    reporting = run_reporting_ai(input_data, planning_output, treasury_output)
    print(json.dumps(reporting, indent=2))
    reporting_output = reporting.get("output", {})

    # 7. Decision AI
    print("\n🎯 7️⃣  DECISION AI")
    print("-" * 80)
    decision = run_decision_ai(research_output, planning_output, reporting_output, treasury_output, compliance_output)
    print(json.dumps(decision, indent=2))
    decision_output = decision.get("output", {})

    # 8. Chief Command AI
    print("\n👑 8️⃣  CHIEF COMMAND AI (FINAL EXECUTIVE SUMMARY)")
    print("-" * 80)
    chief_command = run_chief_command_ai(decision_output, reporting_output, compliance_output)
    print(json.dumps(chief_command, indent=2))

    print("\n" + "=" * 80)
    print("✅ ALL BOTS EXECUTED SUCCESSFULLY!")
    print("=" * 80)

except Exception as e:
    print(f"\n❌ ERROR: {type(e).__name__}")
    print(f"   {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
