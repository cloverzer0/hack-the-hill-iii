import { useMemo, useState } from 'react'

type Province = { code: string; name: string }
type BreakdownItem = { name: string; amount: number; percent: number; color: string }

const provinces: Province[] = [
  { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' }, { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' }, { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' }, { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' }, { code: 'YT', name: 'Yukon' },
]

const baseBreakdown: BreakdownItem[] = [
  { name: 'Seniors (Old Age Security)', amount: 1_503, percent: 15.8, color: '#1e1f1d' },
  { name: 'Interest on public debt', amount: 941, percent: 9.9, color: '#454744' },
  { name: 'Canada Health Transfer', amount: 894, percent: 9.4, color: '#696b66' },
  { name: 'Indigenous services', amount: 675, percent: 7.1, color: '#8b8d87' },
  { name: 'National defence', amount: 590, percent: 6.2, color: '#adada6' },
  { name: 'Canada Child Benefit', amount: 552, percent: 5.8, color: '#c7c6be' },
  { name: 'Employment Insurance', amount: 466, percent: 4.9, color: '#d8d6ce' },
  { name: 'All other programs', amount: 3_889, percent: 40.9, color: '#e5e2d9' },
]

const currency = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
const currencyWithCents = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

function guessProvince() {
  return navigator.language.toLowerCase().includes('-ca') ? 'ON' : 'ON'
}

function scaled(value: number, income: number) {
  return Math.round(value * (income / 75_000))
}

function App() {
  const [screen, setScreen] = useState<'onboarding' | 'overview'>('onboarding')
  const [income, setIncome] = useState(75_000)
  const [province, setProvince] = useState(guessProvince)
  const totalTax = scaled(13_530, income)
  const federalTax = scaled(9_510, income)
  const provincialTax = scaled(4_020, income)
  const breakdown = useMemo(() => baseBreakdown.map((item) => ({ ...item, amount: scaled(item.amount, income) })), [income])

  const updateIncome = (value: string) => {
    const next = Number(value.replace(/[^0-9]/g, ''))
    if (Number.isFinite(next)) setIncome(Math.min(300_000, Math.max(0, next)))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setScreen('onboarding')} aria-label="Go to the start">
          <span className="brand-mark">↓</span>
          <span>Where Does My Tax Go?</span>
        </button>
        {screen === 'overview' && <button className="header-edit" onClick={() => setScreen('onboarding')}>‹ &nbsp;{currency.format(income)} · {province} · Edit</button>}
      </header>

      <main>
        {screen === 'onboarding' ? (
          <section className="mobile-screen onboarding" aria-labelledby="onboarding-title">
            <p className="screen-kicker">01 &nbsp; / &nbsp; ONBOARDING / TAX CALCULATOR</p>
            <h1 id="onboarding-title">See where your<br />federal taxes go.</h1>
            <p className="screen-intro">Enter your income to estimate what you pay, where it’s spent, and how to have a say through official House of Commons petitions.</p>

            <form onSubmit={(event) => { event.preventDefault(); setScreen('overview') }}>
              <label className="field-label" htmlFor="income">Annual income <span>(before tax)</span></label>
              <div className="money-input"><span>$</span><input id="income" inputMode="numeric" value={currency.format(income).replace('$', '').trim()} onChange={(event) => updateIncome(event.target.value)} /></div>

              <label className="field-label" htmlFor="province">Province or territory</label>
              <div className="select-wrap"><select id="province" value={province} onChange={(event) => setProvince(event.target.value)}>{provinces.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select><span aria-hidden="true">⌄</span></div>

              <button className="primary-button" type="submit">See my breakdown <span aria-hidden="true">→</span></button>
              <p className="privacy-note">Estimates use 2024 tax brackets and the Government of Canada’s public spending data (fiscal year 2024). Your income stays on your device.</p>
            </form>
          </section>
        ) : (
          <section className="mobile-screen overview" aria-labelledby="overview-title">
            <p className="screen-kicker">02 &nbsp; / &nbsp; PERSONALIZED SPENDING OVERVIEW</p>
            <div className="overview-summary"><h1 id="overview-title">Your estimated total income tax</h1><strong>{currency.format(totalTax)}</strong><div className="rate-line"><span>Effective rate</span><b>{(totalTax / Math.max(income, 1) * 100).toFixed(1)}%</b></div><div className="tax-split"><span>Federal <b>{currency.format(federalTax)}</b></span><span>Provincial ({province}) <b>{currency.format(provincialTax)}</b></span></div></div>

            <div className="breakdown-heading"><h2>Where your {currency.format(federalTax)} in federal tax goes</h2><p>Based on 2024 federal spending by category. Provincial tax funds provincial services and isn’t shown.</p></div>
            <div className="breakdown-list">{breakdown.map((item) => <div className="breakdown-row" key={item.name}><div className="breakdown-label"><span>{item.name}</span><strong>{currencyWithCents.format(item.amount)}</strong></div><div className="bar-track"><span style={{ width: `${Math.max(item.percent, 2)}%`, background: item.color }} /></div><span className="breakdown-percent">{item.percent}%</span></div>)}</div>
            <p className="tap-note">Tap a category to see related spending stories.</p>
            <button className="browse-button" onClick={() => setScreen('overview')}>Browse spending stories <span aria-hidden="true">→</span></button>
            <div className="overview-links"><span>Estimate only. Source: Public Accounts of Canada 2024</span><a href="https://www.canada.ca/" target="_blank" rel="noreferrer">open.canada.ca ↗</a><button onClick={() => setScreen('onboarding')}>How we calculate</button></div>
          </section>
        )}
      </main>
      <footer className="site-footer"><span>Where Does My Tax Go?</span><span>Estimate · fiscal year 2024–25</span></footer>
    </div>
  )
}

export default App
