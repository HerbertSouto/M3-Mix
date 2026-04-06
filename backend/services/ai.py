import os
from typing import Iterator
from groq import Groq

_client: Groq | None = None


def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ["GROQ_API_KEY"])
    return _client


_MODEL = "llama-3.3-70b-versatile"


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
        model=_MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def stream_chat(message: str, analysis_context: dict) -> Iterator[str]:
    """Stream a chat response with analysis context."""
    system = f"""Você é um assistente especialista em Marketing Mix Modeling.
Você tem acesso aos resultados de uma análise MMM específica.

Resultados da análise:
- ROAS por canal: {analysis_context.get('roas', {})}
- Contribuições: {analysis_context.get('contributions', {})}
- Recomendação de budget: {analysis_context.get('budget_recommendation', {})}

Responda em português do Brasil. Seja conciso e direto. Use os dados acima para fundamentar suas respostas."""

    stream = get_client().chat.completions.create(
        model=_MODEL,
        max_tokens=1024,
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
