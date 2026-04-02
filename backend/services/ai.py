import os
from typing import Iterator
import anthropic

_client: anthropic.Anthropic | None = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


def generate_narrative(analysis_results: dict) -> str:
    """Generate a one-shot narrative analysis of MMM results."""
    roas = analysis_results["roas"]
    contributions = analysis_results["contributions"]

    low_roas_channels = [ch for ch, v in roas.items() if v < 1.0]

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

    message = get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def stream_chat(message: str, analysis_context: dict) -> Iterator[str]:
    """Stream a chat response with analysis context."""
    system = f"""Você é um assistente especialista em Marketing Mix Modeling.
Você tem acesso aos resultados de uma análise MMM específica.

Resultados da análise:
- ROAS por canal: {analysis_context.get('roas', {})}
- Contribuições: {analysis_context.get('contributions', {})}
- Recomendação de budget: {analysis_context.get('budget_recommendation', {})}

Responda em português do Brasil. Seja conciso e direto. Use os dados acima para fundamentar suas respostas."""

    with get_client().messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": message}],
    ) as stream:
        for text in stream.text_stream:
            yield text
