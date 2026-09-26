import { useEffect, useState } from 'react'
import { getDepartments } from '../shared/api/spending'
import { getSpendingItem, getSpendingItems } from '../shared/api/spending'
import { getTaxEstimate } from '../shared/api/tax'
import { NotFoundError } from '../shared/api/errors'
import { receiptCategories } from '../shared/fixtures'
import { calculateFederalTax, formatDate, formatPersonalShare, money } from '../shared/finance'
import type { DepartmentsResponse, SpendingItem, SpendingResponse, TaxEstimate, UserInputs } from '../shared/types'

type AsyncState<T> = { status: 'loading' | 'success' | 'error' | 'not-found'; data?: T; message?: string }

type FeedPayload = {
  spending: SpendingResponse
  departments: DepartmentsResponse
  tax: TaxEstimate
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'We could not load this spending data.'
}

function retryButton(retry: () => void) {
  return <button className="primary-button retry-button" type="button" onClick={retry}>Try again <span aria-hidden="true">↻</span></button>
}

export function ReceiptScreen({ inputs, navigate }: { inputs: UserInputs; navigate: (path: string) => void }) {
  const tax = calculateFederalTax(inputs.income).federal
  const rows = receiptCategories.map((category) => ({ ...category, personal: Math.round(tax * category.percent / 100) }))
  const operationalPercent = rows.filter((row) => row.id === 'departments' || row.id === 'defence').reduce((sum, row) => sum + row.percent, 0)

  return (
    <section className="tracker-page receipt-page" aria-labelledby="receipt-title">
      <div className="tracker-heading">
        <div><p className="screen-kicker">02 · YOUR FEDERAL RECEIPT</p><h1 id="receipt-title">Here is where<br />your money goes.</h1></div>
        <button className="text-action" onClick={() => navigate('/')}>Edit inputs ↗</button>
      </div>
      <div className="receipt-layout">
        <article className="tax-receipt">
          <div className="receipt-header"><span>WHERE DOES MY TAX GO?</span><span>2024–25</span></div>
          <div className="receipt-rule" />
          <p className="receipt-small">ESTIMATED FEDERAL INCOME TAX</p>
          <strong className="receipt-total">{money.format(tax)}</strong>
          <p className="receipt-subtitle">Based on {money.format(inputs.income)} income · {inputs.province}</p>
          <div className="receipt-rule receipt-rule-dashed" />
          <div className="receipt-lines">{rows.map((row, index) => <div className="receipt-line" key={row.id} style={{ '--line-delay': `${index * 60}ms` } as React.CSSProperties}><span>{row.name}</span><strong>{money.format(row.personal)}</strong><button onClick={() => row.drillable && navigate(`/category/${row.id}`)} disabled={!row.drillable} aria-label={row.drillable ? `Explore ${row.name}` : `${row.name} information`}>{row.drillable ? '↗' : '·'}</button></div>)}</div>
          <div className="receipt-rule" />
          <p className="receipt-method">Illustrative estimate. Replace with the official breakdown when the data API is connected.</p>
          <div className="receipt-footer"><span>DATA: FISCAL YEAR 2024–25</span><a href="https://www.canada.ca/en.html" target="_blank" rel="noreferrer">OFFICIAL SOURCE ↗</a></div>
        </article>
        <aside className="receipt-insight">
          <p className="section-label">A closer look</p>
          <div className="receipt-stat"><strong>{operationalPercent.toFixed(1)}%</strong><span>supports departments and defence—the part of the federal budget where contracts appear.</span></div>
          <div className="receipt-bars">{rows.slice(0, 6).map((row) => <div key={row.id} className="mini-bar"><span>{row.name}</span><i><b style={{ width: `${row.percent * 4.3}%` }} /></i><em>{row.percent}%</em></div>)}</div>
          <p className="source-note">Mock values for the visual phase. Each line will connect to official Public Accounts data when the API is available.</p>
        </aside>
      </div>
    </section>
  )
}

export function CategoryScreen({ categoryId, inputs, navigate }: { categoryId: string; inputs: UserInputs; navigate: (path: string) => void }) {
  return <SpendingFeedScreen department={departmentForCategory(categoryId)} inputs={inputs} navigate={navigate} />
}

export function SpendingFeedScreen({ department, inputs, navigate }: { department?: string; inputs: UserInputs; navigate: (path: string) => void }) {
  const [refresh, setRefresh] = useState(0)
  const [state, setState] = useState<AsyncState<FeedPayload>>({ status: 'loading' })

  useEffect(() => {
    let active = true
    Promise.all([getSpendingItems({ department }), getDepartments(), getTaxEstimate(inputs)])
      .then(([spending, departments, tax]) => { if (active) setState({ status: 'success', data: { spending, departments, tax } }) })
      .catch((error) => { if (active) setState({ status: 'error', message: errorMessage(error) }) })
    return () => { active = false }
  }, [department, inputs, refresh])

  return (
    <section className="tracker-page feed-page" aria-labelledby="feed-title">
      <button className="back-action" onClick={() => navigate('/receipt')}>← Back to receipt</button>
      <div className="tracker-heading">
        <div><p className="screen-kicker">03 · SPENDING STORIES</p><h1 id="feed-title">Follow the spending.</h1></div>
      </div>
      {state.status === 'loading' && <FeedLoading />}
      {state.status === 'error' && <div className="empty-state"><strong>Spending data is unavailable.</strong><p>{state.message}</p>{retryButton(() => setRefresh((value) => value + 1))}</div>}
      {state.status === 'success' && state.data && <FeedContent payload={state.data} department={department} navigate={navigate} />}
    </section>
  )
}

function FeedContent({ payload, department, navigate }: { payload: FeedPayload; department?: string; navigate: (path: string) => void }) {
  const { spending, departments, tax } = payload
  const departmentOptions = [...new Set(['All departments', ...departments.departments])]

  return (
    <>
      <div className="feed-filters" aria-label="Filter spending stories">
        {departmentOptions.map((option) => {
          const active = option === 'All departments' ? !department : option === department
          const path = option === 'All departments' ? '/spending' : `/spending?department=${encodeURIComponent(option)}`
          return <button key={option} type="button" className={`feed-filter ${active ? 'is-active' : ''}`} aria-pressed={active} onClick={() => navigate(path)}>{option}</button>
        })}
      </div>
      <div className="feed-meta"><span>{department || 'All departments'}</span><span>{spending.items.length} {spending.items.length === 1 ? 'story' : 'stories'}</span></div>
      {!spending.items.length && <div className="empty-state"><strong>No stories match this department.</strong><p>Try another department or return to the full spending feed.</p><button className="text-action" onClick={() => navigate('/spending')}>Clear filter ↗</button></div>}
      <div className="decision-list feed-list">{spending.items.map((item) => <FeedCard key={item.id} item={item} tax={tax.federal} totalFederalSpending={spending.totalFederalSpending} navigate={navigate} />)}</div>
    </>
  )
}

function FeedCard({ item, tax, totalFederalSpending, navigate }: { item: SpendingItem; tax: number; totalFederalSpending: number; navigate: (path: string) => void }) {
  const source = item.sources[0]
  return (
    <article className="decision-card feed-card">
      <div className="feed-card-visual">{item.image_url ? <div className="feed-card-image" role="img" aria-label="Illustration attached to this public record" style={{ backgroundImage: `url(${item.image_url})` }} /> : <span aria-hidden="true">PUBLIC RECORD</span>}</div>
      <div className="decision-card-top"><span className="source-dot">{item.source_type === 'news' ? 'NEWS RECORD' : 'FEDERAL RECORD'}</span><span>{item.fiscal_year}</span></div>
      <button className="decision-card-link" onClick={() => navigate(`/spending/${item.id}`)}><h2>{item.title}</h2><span className="decision-arrow">↗</span></button>
      <p>{item.summary}</p>
      <div className="decision-facts"><span><b>Department</b>{item.department}</span><span><b>Amount</b>{item.currentValue !== item.originalValue ? 'Up to ' : ''}{money.format(item.currentValue)}</span><span><b>Your share</b>{formatPersonalShare(tax, item.amount, totalFederalSpending)}</span></div>
      {source && <div className="feed-source"><a href={source.url} target="_blank" rel="noreferrer">Source: {source.label} ↗</a></div>}
    </article>
  )
}

export function SpendingDetailScreen({ itemId, inputs, navigate }: { itemId: string; inputs: UserInputs; navigate: (path: string) => void }) {
  const [refresh, setRefresh] = useState(0)
  const [state, setState] = useState<AsyncState<{ item: SpendingItem; spending: SpendingResponse; tax: TaxEstimate }>>({ status: 'loading' })

  useEffect(() => {
    let active = true
    Promise.all([getSpendingItem(itemId), getSpendingItems(), getTaxEstimate(inputs)])
      .then(([item, spending, tax]) => { if (active) setState({ status: 'success', data: { item, spending, tax } }) })
      .catch((error) => { if (active) setState({ status: error instanceof NotFoundError ? 'not-found' : 'error', message: errorMessage(error) }) })
    return () => { active = false }
  }, [itemId, inputs, refresh])

  if (state.status === 'loading') return <section className="tracker-page detail-page"><p className="screen-kicker">04 · SPENDING DECISION</p><FeedLoading /></section>
  if (state.status === 'not-found') return <section className="tracker-page detail-page"><button className="back-action" onClick={() => navigate('/spending')}>← Back to spending</button><div className="empty-state"><strong>This spending record is unavailable.</strong><p>It may have moved or the ID may be invalid.</p><button className="text-action" onClick={() => navigate('/spending')}>Return to spending ↗</button></div></section>
  if (state.status === 'error') return <section className="tracker-page detail-page"><button className="back-action" onClick={() => navigate('/spending')}>← Back to spending</button><div className="empty-state"><strong>Spending data could not be loaded.</strong><p>{state.message}</p>{retryButton(() => setRefresh((value) => value + 1))}</div></section>
  if (!state.data) return null

  const { item, spending, tax } = state.data
  const growth = Math.round((item.currentValue / item.originalValue - 1) * 100)
  const source = item.sources[0]
  return (
    <section className="tracker-page detail-page" aria-labelledby="decision-title">
      <button className="back-action" onClick={() => navigate('/spending')}>← Back to spending</button>
      <p className="screen-kicker">04 · SPENDING DECISION</p>
      <div className="detail-hero"><div><h1 id="decision-title">{item.title}</h1><p className="detail-recipient">Recipient: {item.recipient}</p></div><span className="detail-stamp">FEDERAL<br />RECORD</span></div>
      <div className="detail-facts"><span><b>Department</b>{item.department}</span><span><b>Date</b>{formatDate(item.date)}</span><span><b>Fiscal year</b>{item.fiscal_year}</span><span><b>Amount</b>{item.currentValue !== item.originalValue ? `Up to ${money.format(item.currentValue)}` : money.format(item.currentValue)}</span></div>
      <section className="your-share"><p className="section-label">How this relates to you</p><strong>{formatPersonalShare(tax.federal, item.amount, spending.totalFederalSpending)}</strong><p>Your estimated share is calculated using the federal tax estimate and total federal spending for {spending.fiscalYear}.</p></section>
      <div className="fact-badges detail-badges">{item.competitive === false && <span>Awarded without competition</span>}{item.amendmentCount > 0 && <span>Cost grew {Math.round(item.currentValue / item.originalValue)}× (+{growth}%)</span>}</div>
      <section className="detail-section"><p className="section-label">Plain-language summary</p><h2>What the record says</h2><p>{item.summary}</p><p className="ai-disclosure">AI-assisted summary — check the original record before drawing conclusions.</p></section>
      <section className="detail-section responsibility"><p className="section-label">Who is responsible</p><h2>{item.department}</h2><p>{item.ministerResponsible || 'Responsible department information will appear with the official record.'}</p>{item.ministerAsOf && <small>Responsible as of {formatDate(item.ministerAsOf)}</small>}</section>
      {item.contextLinks.length > 0 && <section className="detail-section"><p className="section-label">Context</p><div className="context-links">{item.contextLinks.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div></section>}
      <PetitionState item={item} />
      <footer className="detail-source"><span>DATA AS OF {item.dataAsOf || spending.fiscalYear}</span>{source && <a href={source.url} target="_blank" rel="noreferrer">VIEW ORIGINAL RECORD ↗</a>}</footer>
    </section>
  )
}

function PetitionState({ item }: { item: SpendingItem }) {
  if (item.petition) return <section className="civic-placeholder"><p className="section-label">Matched petition</p><h2>{item.petition.title}</h2><p>{item.petition.signatures.toLocaleString('en-CA')} signatures · closes {formatDate(item.petition.closes)}</p><a className="primary-button" href={item.petition.url} target="_blank" rel="noreferrer">Join petition <span aria-hidden="true">↗</span></a><p className="petition-secondary">Start a different petition will be available in the next stage.</p></section>
  return <section className="civic-placeholder"><p className="section-label">Civic action</p><h2>Start a petition.</h2><p>No matching petition is attached to this federal record yet.</p></section>
}

function FeedLoading() {
  return <div className="feed-loading" aria-label="Loading spending data"><span /><span /><span /></div>
}

function departmentForCategory(categoryId: string) {
  if (categoryId === 'defence') return 'National Defence'
  if (categoryId === 'grants') return 'Grants'
  if (categoryId === 'departments') return 'Running federal departments'
  return undefined
}

export function DecisionScreen({ itemId, inputs, navigate }: { itemId: string; inputs: UserInputs; navigate: (path: string) => void }) {
  return <SpendingDetailScreen itemId={itemId} inputs={inputs} navigate={navigate} />
}

export function categoryOptions() { return receiptCategories.filter((category) => category.drillable) }
