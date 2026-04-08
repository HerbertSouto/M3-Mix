# Modelo MMM

O M3-Mix usa o [PyMC-Marketing](https://www.pymc-marketing.io/) — biblioteca open source construída sobre PyMC — para ajustar um modelo Bayesiano de Marketing Mix Modeling.

## Componentes do modelo

### Adstock — GeometricAdstock

Modela o efeito residual (carryover) da mídia ao longo do tempo. Um investimento em TV na semana 1 ainda gera impacto nas semanas 2, 3, 4...

```
adstock(x_t) = x_t + α · adstock(x_{t-1})
```

- `α` (alpha) é o parâmetro de decay, estimado por canal
- `l_max=8` — janela máxima de 8 semanas
- Alpha próximo de 1 = decay lento (mídia de branding como TV)
- Alpha próximo de 0 = decay rápido (mídia de performance como Search)

### Saturação — LogisticSaturation

Modela os diminishing returns: investir o dobro não gera o dobro de resultado.

```
saturation(x) = L / (1 + exp(-k · (x - x0)))
```

- Curva sigmoidal — cresce rapidamente no início e achata no topo
- Os parâmetros são estimados por canal via MCMC
- A curva de saturação exportada mostra o retorno marginal em função do investimento

### Inferência MCMC

O modelo usa MCMC (Markov Chain Monte Carlo) via PyMC para estimar distribuições posteriores — não um único número fixo, mas uma distribuição de valores plausíveis dado os dados.

Configuração padrão:

```python
mmm.fit(
    X, y,
    draws=500,
    tune=500,
    target_accept=0.9,
    chains=2,
    cores=1,
)
```

Isso gera 1.000 amostras por parâmetro (500 draws × 2 chains), suficientes para intervalos de credibilidade confiáveis com séries de ~100+ semanas.

## Formato de entrada

O modelo espera um DataFrame com:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `date` | YYYY-MM-DD | Data da semana (frequência semanal) |
| `revenue` | float | Receita total gerada na semana, em R$ |
| `*_spend` | float | Investimento por canal — sufixo `_spend` obrigatório |
| outras | float | Variáveis de controle (ex: `promo_flag`, `holiday_flag`) |

Colunas de controle são detectadas automaticamente — qualquer coluna que não seja `date`, `revenue` ou `*_spend`.

## Outputs extraídos

Após o fitting, o serviço `extract_results()` calcula:

| Output | Como é calculado |
|--------|-----------------|
| **ROAS** | `total_contribution_channel / total_spend_channel` |
| **Contribution share** | `total_contribution_channel / total_revenue` |
| **Adstock alpha** | Mediana posterior do parâmetro α por canal |
| **Saturation curve** | 50 pontos de `(spend, response)` para a curva logística |
| **Decomposition** | `contributions_over_time()` — contribuição semanal por canal |
| **Credible intervals** | Percentis 5 e 95 das amostras beta por canal |

## Dataset mínimo recomendado

- **≥ 100 semanas** de dados para estimativas confiáveis de adstock e saturação
- **≥ 1 canal** com sufixo `_spend`
- Sem gaps longos na série temporal
- Variação real nos spends (evitar spends constantes)

O dataset de exemplo incluso tem 131 semanas (~2,5 anos) com TV, Search e Social.
