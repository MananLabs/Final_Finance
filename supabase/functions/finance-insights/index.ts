// AI insights for finance dashboard via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { revenue, expenses, profit, trendSummary, monthlyBurn, runwayMonths } =
      await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `Analyze this financial data:
- Total Revenue: ₹${revenue}
- Total Expenses: ₹${expenses}
- Profit/Loss: ₹${profit}
- Monthly Burn Rate: ₹${monthlyBurn}
- Runway: ${runwayMonths === null ? "N/A (profitable)" : `${runwayMonths.toFixed(1)} months`}
- Trend: ${trendSummary}

Return concise, actionable CFO-grade analysis.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a sharp, pragmatic CFO AI. Respond ONLY using the provided tool call. Be specific and concise.",
          },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_insights",
              description: "Return structured financial insights",
              parameters: {
                type: "object",
                properties: {
                  risks: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 key financial risks",
                  },
                  opportunities: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 growth or efficiency opportunities",
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Exactly 3 concrete actionable recommendations",
                  },
                  summary: {
                    type: "string",
                    description: "One-sentence executive summary",
                  },
                },
                required: ["risks", "opportunities", "recommendations", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_insights" } },
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No structured response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const insights = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("finance-insights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
