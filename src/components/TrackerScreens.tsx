import { yourShare, type Breakdown } from '../shared/breakdown'
import { categoryById, receiptCategories, spendingById, spendingItems } from '../shared/fixtures'
import { howWeCalculate } from '../shared/howWeCalculate'
import { estimateTax } from '../shared/tax'
import type { SpendingItem, UserInputs } from '../shared/types'
import { useBreakdown } from './useBreakdown'
import { useSpending, useSpendingDetail } from './useSpending'
import type { Story } from '@/lib/stories'
import { useState } from 'react'
import Link from 'next/link'
import { useCampaigns } from './useCampaigns'

const money = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
const cents = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const federalTax = (inputs: UserInputs) => estimateTax(inputs.income, inputs.province).federal
// total is null while the breakdown is still loading (or failed), so the share shows as a placeholder.
const shareOf = (tax: number, amount: number, total: number | null) => total ? cents.format(yourShare(tax, amount, total)) : '…'
const dateLabel = (value: string) => new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`))

export function ReceiptScreen({ inputs, navigate }: { inputs: UserInputs; navigate: (path: string) => void }) {
  const state = useBreakdown()
  if (state.status === 'ready') return <Receipt breakdown={state.breakdown} inputs={inputs} navigate={navigate} />
  return (
    <section className="tracker-page receipt-page" aria-labelledby="receipt-title" aria-busy={state.status === 'loading'}>
      <div className="tracker-heading">
        <div><p className="screen-kicker">02 · YOUR FEDERAL RECEIPT</p><h1 id="receipt-title">Here is where<br />your money goes.</h1></div>
        <button className="text-action" onClick={() => navigate('/')}>Edit inputs ↗</button>
      </div>
      {state.status === 'loading'
        ? <p className="receipt-status" role="status">Loading 2024–25 federal spending…</p>
        : <div className="empty-state receipt-status" role="alert"><strong>We couldn&apos;t load the spending data.</strong><p>Check your connection and try again.</p><button className="text-action" onClick={() => window.location.reload()}>Try again ↻</button></div>}
    </section>
  )
}

function Receipt({ breakdown, inputs, navigate }: { breakdown: Breakdown; inputs: UserInputs; navigate: (path: string) => void }) {
  const tax = federalTax(inputs)
  // With no federal tax to split, show how every $100 of federal spending is split instead.
  const perHundred = tax === 0
  const base = perHundred ? 100 : tax
  const rows = breakdown.items.map((item) => ({ ...item, personal: yourShare(base, item.amount, breakdown.total_federal_spending) }))
  const programs = rows.slice(0, -1)
  const topPercent = (programs.reduce((sum, row) => sum + row.amount, 0) / breakdown.total_federal_spending) * 100
  const biggestPercent = Math.max(...programs.map((row) => row.percent))

  return (
    <section className="tracker-page receipt-page" aria-labelledby="receipt-title">
      <div className="tracker-heading">
        <div><p className="screen-kicker">02 · YOUR FEDERAL RECEIPT</p><h1 id="receipt-title">Here is where<br />your money goes.</h1></div>
        <button className="text-action" onClick={() => navigate('/')}>Edit inputs ↗</button>
      </div>
      <div className="receipt-layout">
        <article className="tax-receipt">
          <div className="receipt-header"><span>WHERE DOES MY TAX GO?</span><span>{breakdown.fiscal_year.replace('-', '–')}</span></div>
          <div className="receipt-rule" />
          <p className="receipt-small">{perHundred ? 'HOW EVERY $100 OF FEDERAL SPENDING IS SPLIT' : 'ESTIMATED FEDERAL INCOME TAX'}</p>
          <strong className="receipt-total">{money.format(base)}</strong>
          <p className="receipt-subtitle">{perHundred ? `No federal income tax on ${money.format(inputs.income)} income · ${inputs.province}` : `Based on ${money.format(inputs.income)} income · ${inputs.province}`}</p>
          <div className="receipt-rule receipt-rule-dashed" />
          <div className="receipt-lines">{rows.map((row, index) => <div className="receipt-line" key={row.name} style={{ '--line-delay': `${index * 60}ms` } as React.CSSProperties}><span title={row.official_name || undefined}>{row.name}</span><strong>{money.format(row.personal)}</strong><span aria-hidden="true">·</span></div>)}</div>
          <div className="receipt-rule" />
          <p className="receipt-method">Estimate. Your federal income tax, split in the same proportions as total federal spending.</p>
          <div className="receipt-footer"><span>DATA: FISCAL YEAR {breakdown.fiscal_year.replace('-', '–')}</span><a href={breakdown.source.url} target="_blank" rel="noreferrer">OFFICIAL SOURCE ↗</a></div>
        </article>
        <aside className="receipt-insight">
          <p className="section-label">A closer look</p>
          <div className="receipt-stat"><strong>{topPercent.toFixed(1)}%</strong><span>goes to just {programs.length} of the {breakdown.program_count.toLocaleString('en-CA')} federal programs.</span></div>
          <div className="receipt-bars">{programs.slice(0, 6).map((row) => <div key={row.name} className="mini-bar"><span>{row.name}</span><i><b style={{ width: `${(row.percent / biggestPercent) * 100}%` }} /></i><em>{row.percent}%</em></div>)}</div>
          <button className="text-action receipt-explore" onClick={() => navigate('/spending')}>Browse spending stories ↗</button>
          <details className="how-we-calculate">
            <summary>How we calculate</summary>
            {howWeCalculate(breakdown).map((section) => <section key={section.title}><h3>{section.title}</h3>{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</section>)}
          </details>
          <p className="source-note">Source: {breakdown.source.label}, actual spending for fiscal year {breakdown.fiscal_year.replace('-', '–')}. Tax estimate uses Canada Revenue Agency 2024 rates.</p>
        </aside>
      </div>
    </section>
  )
}

export function SpendingScreen({ inputs, navigate }: { inputs: UserInputs; navigate: (path: string) => void }) {
  const [department, setDepartment] = useState<string | null>(null)
  const state = useSpending(department)
  const tax = federalTax(inputs)
  const breakdown = useBreakdown()
  const total = breakdown.status === 'ready' ? breakdown.breakdown.total_federal_spending : null

  return <section className="tracker-page spending-page" aria-labelledby="spending-title" aria-busy={state.status === 'loading'}>
    <button className="back-action" onClick={() => navigate('/receipt')}>← Back to receipt</button>
    <div className="tracker-heading spending-heading">
      <div><p className="screen-kicker">03 · PUBLIC SPENDING STORIES</p><h1 id="spending-title">Follow the money.</h1><p className="category-intro">Real federal spending, translated into stories you can investigate. Your share keeps the scale personal.</p></div>
      <div className="spending-context"><span>Your federal tax</span><strong>{money.format(tax)}</strong><small>{inputs.province} · {money.format(inputs.income)} income</small></div>
    </div>
    {state.status === 'loading' && <p className="feed-status" role="status">Loading spending stories…</p>}
    {state.status === 'error' && <div className="empty-state feed-status" role="alert"><strong>We couldn&apos;t load the spending stories.</strong><p>Check your connection and try again.</p><button className="text-action" onClick={() => window.location.reload()}>Try again ↻</button></div>}
    {state.status === 'ready' && <>
      <div className="department-filter" aria-label="Filter spending stories by department" role="group">
        <button className={department === null ? 'filter-chip active' : 'filter-chip'} onClick={() => setDepartment(null)} aria-pressed={department === null}>All stories</button>
        {state.departments.map((item) => <button key={item.dept_code} className={department === item.dept_code ? 'filter-chip active' : 'filter-chip'} onClick={() => setDepartment(item.dept_code)} aria-pressed={department === item.dept_code}>{item.name} <span>{item.count}</span></button>)}
      </div>
      {state.stories.length ? <div className="story-list">{state.stories.map((story, index) => <StoryCard key={story.id} story={story} tax={tax} total={total} featured={index === 0} navigate={navigate} />)}</div> : <div className="empty-state"><strong>No stories in this department yet.</strong><p>Try another department or return to all stories.</p><button className="text-action" onClick={() => setDepartment(null)}>Show all stories ↗</button></div>}
    </>}
  </section>
}

function StoryCard({ story, tax, total, featured, navigate }: { story: Story; tax: number; total: number | null; featured: boolean; navigate: (path: string) => void }) {
  return <article className={featured ? 'story-card story-card-featured' : 'story-card'}>
    <div className="story-card-top"><span className={story.source_type === 'news' ? 'story-type story-type-news' : 'story-type'}>{story.source_type === 'news' ? 'NEWS RECORD' : 'DATA STORY'}</span><span>{story.fiscal_year}</span></div>
    {story.image_url ? <div className="story-image story-image-photo" role="img" aria-label={`Illustration for ${story.title}`} style={{ backgroundImage: `url(${story.image_url})` }} /> : <div className="story-image story-image-fallback" role="img" aria-label={`Public record from ${story.department}`}><span>{story.dept_code}</span><small>PUBLIC RECORD</small></div>}
    <button className="story-card-link" onClick={() => navigate(`/decision/${story.id}`)}><h2>{story.title}</h2><span className="decision-arrow" aria-hidden="true">↗</span></button>
    <p>{story.summary}</p>
    <div className="story-card-facts"><span><b>Public amount</b>{money.format(story.amount)}</span><span><b>Department</b>{story.department}</span><span className="story-share"><b>Your share</b>{shareOf(tax, story.amount, total)}</span></div>
    <a className="story-source" href={story.sources[0]?.url} target="_blank" rel="noreferrer">{story.sources[0]?.label ?? 'Official source'} ↗</a>
  </article>
}

export function CategoryScreen({ categoryId, inputs, navigate }: { categoryId: string; inputs: UserInputs; navigate: (path: string) => void }) {
  const category = categoryById(categoryId) ?? receiptCategories.find((item) => item.drillable)!
  const items = spendingItems.filter((item) => categoryFor(item) === category.id).sort((a, b) => b.amount - a.amount)
  const tax = federalTax(inputs)
  const state = useBreakdown()
  const total = state.status === 'ready' ? state.breakdown.total_federal_spending : null
  return (
    <section className="tracker-page category-page" aria-labelledby="category-title">
      <button className="back-action" onClick={() => navigate('/receipt')}>← Back to receipt</button>
      <p className="screen-kicker">03 · CATEGORY EXPLORER</p>
      <h1 id="category-title">{category.name}.</h1>
      <p className="category-intro">{category.description} These are illustrative spending records, ordered by amount.</p>
      <div className="category-meta"><span>{category.percent}% of the federal breakdown</span><a href={category.source.url} target="_blank" rel="noreferrer">Source: {category.source.label} ↗</a></div>
      <div className="decision-list">{items.map((item) => <DecisionCard key={item.id} item={item} tax={tax} total={total} navigate={navigate} />)}</div>
      {!items.length && <div className="empty-state"><strong>This category is shown as a summary.</strong><p>Detailed spending records will appear here when the category data is connected.</p><a href={category.source.url} target="_blank" rel="noreferrer">Read the official source ↗</a></div>}
    </section>
  )
}

function DecisionCard({ item, tax, total, navigate }: { item: SpendingItem; tax: number; total: number | null; navigate: (path: string) => void }) {
  return <article className="decision-card"><div className="decision-card-top"><span className="source-dot">FEDERAL RECORD</span><span>{item.fiscal_year}</span></div><button className="decision-card-link" onClick={() => navigate(`/decision/${item.id}`)}><h2>{item.title}</h2><span className="decision-arrow">↗</span></button><p>{item.summary}</p><div className="decision-facts"><span><b>Recipient</b>{item.recipient}</span><span><b>Amount</b>{item.currentValue !== item.originalValue ? 'Up to ' : ''}{money.format(item.currentValue)}</span><span><b>Your share</b>{shareOf(tax, item.amount, total)}</span></div><div className="fact-badges">{item.competitive === false && <span>Awarded without competition</span>}{item.amendmentCount > 0 && <span>Cost grew {Math.round(item.currentValue / item.originalValue)}×</span>}</div></article>
}

export function DecisionScreen({ itemId, inputs, navigate }: { itemId: string; inputs: UserInputs; navigate: (path: string) => void }) {
  const item = spendingById(itemId) ?? spendingItems[0]
  const tax = federalTax(inputs)
  const state = useBreakdown()
  const total = state.status === 'ready' ? state.breakdown.total_federal_spending : null
  const growth = Math.round((item.currentValue / item.originalValue - 1) * 100)
  return (
    <section className="tracker-page detail-page" aria-labelledby="decision-title">
      <button className="back-action" onClick={() => navigate(`/category/${categoryFor(item)}`)}>← Back to category</button>
      <p className="screen-kicker">04 · SPENDING DECISION</p>
      <div className="detail-hero"><div><h1 id="decision-title">{item.title}</h1><p className="detail-recipient">Recipient: {item.recipient}</p></div><span className="detail-stamp">FEDERAL<br />RECORD</span></div>
      <div className="detail-facts"><span><b>Department</b>{item.department}</span><span><b>Date</b>{dateLabel(item.date)}</span><span><b>Amount</b>{item.currentValue !== item.originalValue ? `Up to ${money.format(item.currentValue)}` : money.format(item.currentValue)}</span></div>
      <section className="your-share"><p className="section-label">How this relates to you</p><strong>{shareOf(tax, item.amount, total)}</strong><p>Your estimated share of this spending item, based on your federal tax and the total federal spending pool for {item.fiscal_year}.</p></section>
      <div className="fact-badges detail-badges">{item.competitive === false && <span>Awarded without competition</span>}{item.amendmentCount > 0 && <span>Cost grew {Math.round(item.currentValue / item.originalValue)}× (+{growth}%)</span>}</div>
      <section className="detail-section"><p className="section-label">Plain-language summary</p><h2>What the record says</h2><p>{item.summary}</p><p className="ai-disclosure">AI summary — check the original record before drawing conclusions.</p></section>
      <section className="detail-section responsibility"><p className="section-label">Who is responsible</p><h2>{item.department}</h2><p>{item.ministerResponsible}</p><small>Responsible as of {dateLabel(item.ministerAsOf)}</small></section>
      {item.contextLinks.length > 0 && <section className="detail-section"><p className="section-label">Context</p><div className="context-links">{item.contextLinks.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div></section>}
      <section className="civic-placeholder"><p className="section-label">Civic action</p><h2>Questions and actions coming soon.</h2><p>This spending page will later connect to factual questions and official civic pathways.</p></section>
      <footer className="detail-source"><span>DATA AS OF {item.dataAsOf}</span><a href={item.sources[0].url} target="_blank" rel="noreferrer">VIEW ORIGINAL RECORD ↗</a></footer>
    </section>
  )
}

export function ApiDecisionScreen({ itemId, inputs, navigate }: { itemId: string; inputs: UserInputs; navigate: (path: string) => void }) {
  const state = useSpendingDetail(itemId)
  const breakdown = useBreakdown()
  const tax = federalTax(inputs)
  const total = breakdown.status === 'ready' ? breakdown.breakdown.total_federal_spending : null
  if (state.status === 'loading') return <section className="tracker-page detail-page" aria-busy="true"><p className="screen-kicker">04 · SPENDING STORY</p><p className="feed-status" role="status">Loading this spending story…</p></section>
  if (state.status === 'error') return <section className="tracker-page detail-page"><button className="back-action" onClick={() => navigate('/spending')}>← Back to stories</button><div className="empty-state" role="alert"><strong>We couldn&apos;t load this story.</strong><p>Return to the feed and try again.</p><button className="text-action" onClick={() => navigate('/spending')}>Back to spending ↗</button></div></section>
  const story = state.story
  return <section className="tracker-page detail-page" aria-labelledby="story-title">
    <button className="back-action" onClick={() => navigate('/spending')}>← Back to spending stories</button>
    <p className="screen-kicker">04 · SPENDING STORY</p>
    <div className="detail-hero"><div><h1 id="story-title">{story.title}</h1><p className="detail-recipient">{story.department} · {story.fiscal_year}</p></div><span className="detail-stamp">PUBLIC<br />RECORD</span></div>
    <div className="detail-facts"><span><b>Department</b>{story.department}</span><span><b>Date</b>{dateLabel(story.date)}</span><span><b>Public amount</b>{money.format(story.amount)}</span></div>
    <section className="your-share"><p className="section-label">Your share</p><strong>{shareOf(tax, story.amount, total)}</strong><p>An estimate of how much of this story is represented by your federal tax, using the {story.fiscal_year} federal spending pool.</p></section>
    <section className="detail-section"><p className="section-label">What happened</p><h2>The record, in plain language.</h2><p>{story.summary}</p><p className="ai-disclosure">Story summary — check the original record before drawing conclusions.</p></section>
    <section className="detail-section evidence-section"><p className="section-label">Evidence</p><h2>Read the source.</h2><div className="context-links">{story.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div></section>
    <ActionSection story={story} />
    <footer className="detail-source"><span>DATA AS OF {story.date}</span><a href={story.sources[0]?.url} target="_blank" rel="noreferrer">VIEW ORIGINAL RECORD ↗</a></footer>
  </section>
}

function ActionSection({ story }: { story: Story }) {
  const campaignsState = useCampaigns(story.id)
  if (story.petition) {
    return <section className="civic-action"><p className="section-label">Civic action</p><h2>This story already has an official petition.</h2><div className="petition-progress"><strong>{story.petition.signatures.toLocaleString('en-CA')}</strong><span>signatures so far</span></div><p className="action-copy">{story.petition.title}. Signatures count on the official House of Commons petition.</p><div className="action-links"><a className="primary-action" href={story.petition.url} target="_blank" rel="noreferrer">Sign on ourcommons.ca ↗</a><a className="text-action" href={`/campaigns/new?story=${encodeURIComponent(story.id)}`}>Start a different campaign ↗</a></div><small>Closes {dateLabel(story.petition.closes)}</small>{campaignsState.status === 'ready' && <CampaignRows campaigns={campaignsState.campaigns} />}</section>
  }
  return <section className="civic-action"><p className="section-label">Civic action</p><h2>What happens next?</h2><p className="action-copy">Turn a question about this spending story into a campaign people can join, then move it toward an official petition.</p><a className="primary-action" href={`/campaigns/new?story=${encodeURIComponent(story.id)}`}>Start a campaign ↗</a><Link className="text-action" href="/campaigns">Browse all campaigns ↗</Link><small>Only federal spending stories can lead to a House of Commons e-petition.</small>{campaignsState.status === 'ready' && <CampaignRows campaigns={campaignsState.campaigns} />}</section>
}

function CampaignRows({ campaigns }: { campaigns: import('@/lib/campaigns').Campaign[] }) {
  if (!campaigns.length) return <p className="action-copy">No campaigns yet. Start the first one.</p>
  const labels: Record<string, string> = { gathering: 'Gathering members', in_review: 'In review', mp_asked: 'MP asked', mp_agreed: 'MP agreed', live: 'Live', closed: 'Closed' }
  return <div className="campaign-rows" aria-label="Campaigns for this story">{campaigns.slice(0, 4).map((campaign) => <a key={campaign.id} href={`/campaigns/${campaign.id}`} className="campaign-row"><span><b>{campaign.title}</b><small>{campaign.supporters} members · {labels[campaign.status] ?? campaign.status}{campaign.joined ? ' · Joined' : ''}</small></span><span aria-hidden="true">↗</span></a>)}</div>
}

function categoryFor(item: SpendingItem) {
  if (item.department === 'Department of National Defence') return 'defence'
  if (item.department.includes('Housing') || item.recipient.includes('Housing')) return 'grants'
  return 'departments'
}

export function categoryOptions() { return receiptCategories.filter((category) => category.drillable) }
