import os
from typing import Iterator
from groq import Groq

_client: Groq | None = None


def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ["GROQ_API_KEY"])
    return _client


def generate_narrative(analysis_results: dict) -> str:
    """Generate a one-shot narrative analysis of MMM results."""
    roas = analysis_results["roas"]
    contributions = analysis_results["contributions"]

    prompt = f"""Você é um analista de marketing especialista em Marketing Mix Modeling.
Analise os resultados abaixo e produza um relatório executivo em português do Brasil.

## Resultados do Modelo MMM

**ROAS por canal:**
{chr(10).join(f"- {ch}: {v:.2f}" for ch, v in roas.items())}

**Contribuição de cada canal para a receita total:**
{chr(10).join(f"- {ch}: {v*100:.1f}%" for ch, v in contributions.items())}

## Instruções para o relatório

Escreva em 3 seções:
1. **Resumo executivo** (2-3 frases): qual canal performa melhor, qual é a situação geral
2. **Pontos de atenção**: canais com ROAS abaixo de 1.0 (prejuízo), canais próximos da saturação
3. **Recomendações**: 2-3 ações concretas baseadas nos dados

Seja direto e use linguagem de negócios. Não explique o que é MMM."""

    response = get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=1024,
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
        model="deepseek-r1-distill-llama-70b",
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
