'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CinematicTaxJourney } from '../../components/CinematicTaxJourney'
import { CategoryScreen, DecisionScreen, ReceiptScreen } from '../../components/TrackerScreens'
import { receiptCategories } from '../../shared/fixtures'
import { getServerUserInputsSnapshot, getUserInputsSnapshot, saveUserInputs, subscribeToUserInputs } from '../../shared/userInputs'
import type { UserInputs } from '../../shared/types'

type Route = { name: 'landing' | 'receipt' | 'category' | 'decision'; id?: string }
type Province = { code: string; name: string }

const provinces: Province[] = [
  { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' }, { code: 'MB', name: 'Manitoba' }, { code: 'NB', name: 'New Brunswick' }, { code: 'NL', name: 'Newfoundland and Labrador' }, { code: 'NS', name: 'Nova Scotia' }, { code: 'NT', name: 'Northwest Territories' }, { code: 'NU', name: 'Nunavut' }, { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' }, { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' }, { code: 'YT', name: 'Yukon' },
]
const money = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
const federalTax = (income: number) => Math.round(9510 * (income / 75_000))

function routeFromPath(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'receipt') return { name: 'receipt' }
  if (parts[0] === 'category') return { name: 'category', id: parts[1] }
  if (parts[0] === 'decision') return { name: 'decision', id: parts[1] }
  return { name: 'landing' }
}

export default function TaxApp() {
  const pathname = usePathname()
  const router = useRouter()
  const route = useMemo(() => routeFromPath(pathname), [pathname])
  const inputs = useSyncExternalStore(subscribeToUserInputs, getUserInputsSnapshot, getServerUserInputsSnapshot)

  const navigate = (path: string) => {
    router.push(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateInputs = (next: UserInputs) => {
    saveUserInputs(next)
  }
  const headerLabel = useMemo(() => route.name === 'landing' ? 'A public money story' : `${money.format(inputs.income)} · ${inputs.province}`, [inputs, route.name])

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('/')} aria-label="Go to the start"><span className="brand-mark">$</span><span>Where Does My Tax Go?</span></button>
        <div className="header-meta">{headerLabel}</div>
      </header>
      <main>
        {route.name === 'landing' && <Landing inputs={inputs} updateInputs={updateInputs} navigate={navigate} />}
        {route.name === 'receipt' && <ReceiptScreen inputs={inputs} navigate={navigate} />}
        {route.name === 'category' && <CategoryScreen categoryId={route.id ?? receiptCategories[0].id} inputs={inputs} navigate={navigate} />}
        {route.name === 'decision' && <DecisionScreen itemId={route.id ?? ''} inputs={inputs} navigate={navigate} />}
      </main>
      <footer className="site-footer"><span>Where Does My Tax Go?</span><span>Estimate · fiscal year 2024–25</span></footer>
    </div>
  )
}

function Landing({ inputs, updateInputs, navigate }: { inputs: UserInputs; updateInputs: (inputs: UserInputs) => void; navigate: (path: string) => void }) {
  const [postalError, setPostalError] = useState('')
  const updateIncome = (value: string) => {
    const next = Number(value.replace(/[^0-9]/g, ''))
    if (Number.isFinite(next)) {
      updateInputs({ ...inputs, income: Math.min(300_000, Math.max(0, next)), incomeIsTypical: false })
    }
  }
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const postal = inputs.postalCode.trim().toUpperCase()
    if (postal && !/^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/.test(postal)) {
      setPostalError('Enter a Canadian postal code, such as K1A 0B1.')
      return
    }
    setPostalError('')
    updateInputs({ ...inputs, postalCode: postal })
    navigate('/receipt')
  }
  return <CinematicTaxJourney data={{ incomeLabel: money.format(inputs.income), federalTaxLabel: money.format(federalTax(inputs.income)), provinceLabel: inputs.province }} onContinue={() => navigate('/receipt')}>
    <form className="journey-income-form" onSubmit={submit}>
      <label className="field-label" htmlFor="income">Annual income <span>(before tax)</span></label>
      <div className="money-input"><span>$</span><input id="income" inputMode="numeric" value={String(inputs.income)} onChange={(event) => updateIncome(event.target.value)} /></div>
      <button type="button" className="typical-income" onClick={() => updateInputs({ ...inputs, income: 75_000, incomeIsTypical: true })}>Use a typical income <span>$75,000</span></button>
      <label className="field-label" htmlFor="province">Province or territory</label>
      <div className="select-wrap"><select id="province" value={inputs.province} onChange={(event) => updateInputs({ ...inputs, province: event.target.value })}>{provinces.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select><span aria-hidden="true">⌄</span></div>
      <label className="field-label" htmlFor="postal">Postal code <span>(optional)</span></label>
      <input className="postal-input" id="postal" inputMode="text" maxLength={7} placeholder="K1A 0B1" value={inputs.postalCode} onChange={(event) => updateInputs({ ...inputs, postalCode: event.target.value.toUpperCase() })} aria-describedby={postalError ? 'postal-error' : undefined} />
      {postalError && <p className="field-error" id="postal-error" role="alert">{postalError}</p>}
      <button className="primary-button" type="submit">See my receipt <span aria-hidden="true">→</span></button>
      <p className="privacy-note">Your income never leaves this device. Estimates use mock fiscal-year 2024–25 data for now.</p>
    </form>
  </CinematicTaxJourney>
}
