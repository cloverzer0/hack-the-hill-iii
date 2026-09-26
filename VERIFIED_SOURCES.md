# Verified sources

Every number in the app comes from one of these. Checked on 2026-09-26.

## Spending data (GC InfoBase, Treasury Board of Canada Secretariat)

Dataset page: https://open.canada.ca/data/en/dataset/a35cf382-690c-4221-a971-cf0fd189a46f

Downloaded into `pipeline/data/` (gitignored, re-download with the links below):

| File | Used for | Download |
|---|---|---|
| `programs_spending.csv` | Actual spending per program per year (`expenditure` column) | https://open.canada.ca/data/dataset/a35cf382-690c-4221-a971-cf0fd189a46f/resource/55934650-3380-44d5-82c1-bb68f8cc5abb/download/programs_spending.csv |
| `programs.csv` | Program names. Join on `year` + `dept_code` + `program_code` | https://open.canada.ca/data/dataset/a35cf382-690c-4221-a971-cf0fd189a46f/resource/8d3cd22d-15b0-468a-bb75-c1e736107c45/download/programs.csv |
| `organizations.csv` | Department names. Join on `dept_code` | https://open.canada.ca/data/dataset/a35cf382-690c-4221-a971-cf0fd189a46f/resource/d9f87f7f-62f9-4baf-a803-2d8743f38e76/download/organizations.csv |

Notes:
- `year = 2024` means fiscal year April 2024 – March 2025 ("2024–25").
- Sum of `expenditure` for 2024 = **$472.5B**. Employment Insurance benefits are not in this dataset.
- Program structure changed in 2018; don't compare program codes across that year.

## Tax calculation (2024 tax year, Canada Revenue Agency)

| What | Source |
|---|---|
| Federal brackets and rates, all years | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/all-years.html |
| Basic personal amount, Canada employment amount, CPP, EI, Ontario brackets (T4032-ON, January 2024) | https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4032-payroll-deductions-tables-previous-years/t4032on-january-2024/t4032on-january-general-information.html |
| Basic personal amount explained | https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30000-basic-personal-amount.html |

2024 federal brackets (verified):

| Taxable income | Rate |
|---|---|
| $0 – $55,867 | 15% |
| $55,867 – $111,733 | 20.5% |
| $111,733 – $173,205 | 26% |
| $173,205 – $246,752 | 29% |
| over $246,752 | 33% |

2024 federal amounts (verified, T4032-ON January 2024):
- Basic personal amount: $15,705 (reduced to $14,156 for high incomes, between $173,205 and $246,752)
- Canada employment amount: $1,433
- CPP: 5.95% (base 4.95% + first additional 1%) on earnings $3,500 – $68,500; CPP2: 4% on $68,500 – $73,200
- EI: 1.66% up to $63,200 insurable earnings (max premium $1,049.12)

Ontario 2024 (verified, same T4032-ON page): basic personal amount $12,399; brackets 5.05% to $51,446, 9.15% to $102,894, 11.16% to $150,000, 12.16% to $220,000, 13.16% above.

Other provinces/territories: use each province's T4032 January 2024 page (same URL pattern, e.g. `t4032bc-january-2024`). Add each one here when verified.

## Tax checks (compare our calculator against these)

- Wealthsimple tax calculator: https://www.wealthsimple.com/en-ca/tool/tax-calculator (pick the 2024 tax year)
- TaxTips.ca Canadian tax calculator: https://www.taxtips.ca/calculators/canadian-tax/canadian-tax-calculator.htm
