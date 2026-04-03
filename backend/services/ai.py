import os
from typing import Iterator
from groq import Groq

_client: Groq | None = None


def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ["GROQ_API_KEY"])
    return _client


def _saturation_summary(saturation: dict) -> str:
    lines = []
    for ch, points in saturation.items():
        if not points:
            continue
        max_y = max(p["y"] for p in points)
        sat_point = next((p for p in points if p["y"] >= max_y * 0.9), None)
        max_spend = max(p["x"] for p in points)
        current_est = max_spend / 1.5
        saturated = sat_point and current_est >= sat_point["x"] * 0.85
        status = "SATURADO" if saturated else "pode escalar"
        sat_str = f"satura em R${sat_point['x']:,.0f}" if sat_point else "ponto de saturação não identificado"
        lines.append(f"- {ch}: {status} ({sat_str}, spend atual estimado R${current_est:,.0f})")
    return "\n".join(lines)


def _channel_role(ch: str) -> str:
    name = ch.replace("_spend", "").lower()
    if any(k in name for k in ("search", "sem", "paid")):
        return "captura de demanda (converte intenção existente)"
    if any(k in name for k in ("tv", "social", "display", "ooh", "radio", "youtube")):
        return "geração de demanda (cria intenção nova)"
    return "papel indefinido"


def generate_narrative(analysis_results: dict) -> str:
    """Generate a structured 4-section narrative following Situação → Diagnóstico → Interpretação → Ação."""
    roas = analysis_results["roas"]
    contributions = analysis_results["contributions"]
    saturation = analysis_results.get("saturation", {})
    budget_rec = analysis_results.get("budget_recommendation", {})

    incremental = 1 - contributions.get("baseline", 0)
    avg_roas = sum(roas.values()) / len(roas) if roas else 0
    channels_sorted = sorted(roas.keys(), key=lambda c: roas[c], reverse=True)

    channel_data = "\n".join(
        f"- {ch}: ROAS {roas[ch]:.2f}x | contribuição {contributions.get(ch, 0)*100:.1f}% | papel: {_channel_role(ch)}"
        for ch in channels_sorted
    )
    sat_data = _saturation_summary(saturation)
    uplift = budget_rec.get("uplift_percent", 0)

    prompt = f"""Você é um consultor sênior de Marketing Mix Modeling. Escreva um relatório executivo em português do Brasil com exatamente 4 seções. Use APENAS os dados fornecidos — nunca invente números.

## DADOS DA ANÁLISE

ROAS médio: {avg_roas:.2f}x
Receita incremental (mídia): {incremental*100:.1f}%
Receita orgânica (baseline): {(1-incremental)*100:.1f}%

Canais (ordenados por ROAS):
{channel_data}

Saturação por canal:
{sat_data}

Potencial de uplift com redistribuição de budget: {uplift:.1f}%

## REGRAS OBRIGATÓRIAS

1. NUNCA escreva frases genéricas como "aumentar investimento em mídia social". Toda frase deve ter número, comparação e justificativa.
   ❌ "Social apresenta bom ROAS."
   ✅ "Social apresenta ROAS de 3.0x — 32% acima do Search — e ainda não atingiu saturação, indicando espaço real para escalar com retorno positivo."

2. Para cada canal, conecte SEMPRE as três dimensões juntas: ROAS + contribuição + saturação.
   ✅ "Apesar do ROAS elevado (X.Xx), a contribuição de Y% indica que o canal opera em escala limitada. Como ainda não está saturado, há espaço para crescimento."

3. Canais de captura de demanda (Search/SEM) devem ser explicados como tal.
   ✅ "Search captura demanda já existente, o que explica sua alta eficiência, mas limita seu crescimento sem canais de awareness que gerem volume de intenção."

4. Saturação deve virar uma decisão clara — não apenas uma observação.
   ❌ "TV está próxima da saturação."
   ✅ "TV apresenta retorno marginal baixo e sinais claros de saturação. Recomenda-se evitar qualquer aumento de investimento neste canal."

5. Cada recomendação deve responder "então o que eu faço?" com um verbo de ação claro: aumentar / manter / reduzir / realocar.

## ESTRUTURA (siga exatamente, use ## para cada seção)

## Situação
1 parágrafo. ROAS médio com contexto, proporção mídia vs orgânico e o que isso implica para a dependência do negócio em mídia paga.

## Diagnóstico por canal
Lista numerada. 1 item por canal com as 3 dimensões conectadas (ROAS + contribuição + saturação). Compare canais entre si com percentuais.

## Interpretação
1 parágrafo. Explique como os canais se complementam: awareness (TV/Social) gera intenção que o Search captura. Por que ROAS alto em Search é esperado e limitado ao mesmo tempo. Qual é o risco de cortar awareness.

## Ação recomendada
Lista numerada com exatamente 1 ação por canal. Formato: [Canal]: [verbo] — [justificativa com número]. Se houver uplift possível com redistribuição, mencione no final."""

    response = get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=1200,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def _format_context(ctx: dict) -> str:
    """Render analysis_context as clean text for the LLM."""
    lines: list[str] = []

    if "roas" in ctx:
        lines.append("ROAS por canal (receita gerada por R$1 investido):")
        for ch, v in ctx["roas"].items():
            lines.append(f"  {ch}: {v:.2f}x")

    if "contributions" in ctx:
        lines.append("Contribuição de cada canal para a receita total:")
        for ch, v in ctx["contributions"].items():
            lines.append(f"  {ch}: {v*100:.1f}%")

    if "decomposition_por_canal" in ctx:
        lines.append("Receita gerada por canal no período (R$):")
        for ch, v in ctx["decomposition_por_canal"].items():
            lines.append(f"  {ch}: R${v:,.0f}")

    if "saturation" in ctx:
        lines.append("Status de saturação por canal:")
        for ch, s in ctx["saturation"].items():
            sat = "SATURADO" if s.get("saturado") else "tem espaço para escalar"
            sat_at = s.get("satura_em_spend")
            current = s.get("spend_atual_estimado")
            sat_str = f"satura em R${sat_at:,}" if sat_at else "saturação não identificada"
            lines.append(f"  {ch}: {sat} — spend atual ~R${current:,}, {sat_str}")

    if "adstock" in ctx:
        lines.append("Adstock — efeito carryover de cada canal (% que persiste na semana seguinte):")
        for ch, v in ctx["adstock"].items():
            lines.append(f"  {ch}: {v*100:.1f}%")

    if "budget_recommendation" in ctx:
        rec = ctx["budget_recommendation"]
        lines.append("Recomendação de redistribuição de budget:")
        lines.append(f"  Receita atual estimada: R${rec.get('current_revenue_estimate', 0):,.0f}")
        lines.append(f"  Receita com novo budget: R${rec.get('suggested_revenue_estimate', 0):,.0f}")
        lines.append(f"  Uplift esperado: {rec.get('uplift_percent', 0):.1f}%")
        if "current_allocation" in rec:
            lines.append("  Alocação atual:")
            for ch, v in rec["current_allocation"].items():
                lines.append(f"    {ch}: R${v:,.0f}")
        if "suggested_allocation" in rec:
            lines.append("  Alocação sugerida:")
            for ch, v in rec["suggested_allocation"].items():
                lines.append(f"    {ch}: R${v:,.0f}")

    if "relatorio_ia" in ctx:
        lines.append(f"Relatório executivo gerado pela IA:\n{ctx['relatorio_ia']}")

    return "\n".join(lines)


def stream_chat(message: str, analysis_context: dict) -> Iterator[str]:
    """Stream a chat response with analysis context."""
    formatted = _format_context(analysis_context)
    system = f"""Você é um analista sênior de Marketing Mix Modeling.
Você está conversando com o dono/gestor do negócio que acabou de receber o relatório MMM abaixo.

--- RELATÓRIO MMM ---
{formatted}
--- FIM DO RELATÓRIO ---

Regras:
- Use APENAS os dados acima. Nunca invente ou extrapole números que não estão no relatório.
- Seja direto e assertivo — fale como um consultor de confiança, não como um chatbot.
- Responda em português do Brasil, linguagem de negócios simples.
- Respostas concisas: vá ao ponto em 2-4 frases, com os números reais.
- Se a pergunta não puder ser respondida com os dados disponíveis, diga claramente o que falta."""

    stream = get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=512,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": message},
        ],
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
