import { cn, haptic, Codicon, ROUTES_AREA, SIDEBAR_NAV_AREA, useQuery } from '@hermes/plugin-sdk'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useState } from 'react'

const ID = 'error-tracker'
const ROUTE = '/error-tracker'

function ErrorTrackerPage({ loadData }) {
  const [activeTab, setActiveTab] = useState('errors')
  const { data: payload, isLoading: loading, isError: loadError, refetch } = useQuery({
    queryKey: [ID, 'errors'],
    queryFn: loadData,
    refetchInterval: 15000,
    staleTime: 5000
  })
  const data = {
    errors: Array.isArray(payload?.errors) ? payload.errors : [],
    recoveries: Array.isArray(payload?.recoveries) ? payload.recoveries : []
  }

  const emptyState = (message) => jsx('div', {
    className: 'text-sm text-(--ui-text-tertiary) py-8 text-center',
    children: message
  })

  return jsxs('div', {
    className: 'flex h-full flex-col text-foreground p-6 overflow-y-auto',
    children: [
      jsxs('div', {
        className: 'flex items-center justify-between mb-6',
        children: [
          jsxs('div', {
            children: [
              jsx('h1', {
                className: 'text-2xl font-bold flex items-center gap-2',
                children: [jsx(Codicon, { name: 'bug', className: 'text-(--ui-accent)' }), 'Error & Recovery Tracker']
              }),
              jsx('p', {
                className: 'text-sm text-(--ui-text-tertiary) mt-1',
                children: 'Recent local Hermes errors and scheduled-job recovery events.'
              })
            ]
          }),
          jsx('button', {
            className: 'px-3 py-1.5 text-xs font-medium rounded bg-(--ui-accent) text-white hover:opacity-90 transition-opacity flex items-center gap-1.5',
            onClick: () => { haptic('tap'); void refetch() },
            'aria-label': 'Refresh error and recovery data',
            children: [jsx(Codicon, { name: 'refresh' }), 'Refresh']
          })
        ]
      }),
      loadError && jsx('div', {
        className: 'mb-4 rounded border border-(--ui-stroke-secondary) px-3 py-2 text-sm text-(--ui-text-tertiary)',
        role: 'status',
        children: 'Could not load plugin data. Check that the Error Tracker backend is enabled.'
      }),
      jsxs('div', {
        className: 'flex gap-2 mb-4 border-b border-(--ui-stroke-secondary) pb-2',
        children: [
          jsx('button', {
            className: cn('px-3 py-1.5 text-sm font-medium rounded transition-colors', activeTab === 'errors' ? 'bg-(--ui-accent) text-white' : 'text-(--ui-text-tertiary) hover:text-foreground'),
            onClick: () => { haptic('tap'); setActiveTab('errors') },
            children: `Error Log (${data.errors.length})`
          }),
          jsx('button', {
            className: cn('px-3 py-1.5 text-sm font-medium rounded transition-colors', activeTab === 'recoveries' ? 'bg-(--ui-accent) text-white' : 'text-(--ui-text-tertiary) hover:text-foreground'),
            onClick: () => { haptic('tap'); setActiveTab('recoveries') },
            children: `Recoveries (${data.recoveries.length})`
          })
        ]
      }),
      loading && emptyState('Loading local Hermes data…'),
      !loading && activeTab === 'errors' && jsxs('div', {
        className: 'space-y-2',
        children: data.errors.length === 0
          ? emptyState('No entries found in $HERMES_HOME/logs/errors.log.')
          : data.errors.map((entry, index) => jsx('div', {
              className: 'p-3 rounded bg-(--ui-card) border border-(--ui-stroke-secondary) font-mono text-xs text-(--ui-text-secondary) break-all whitespace-pre-wrap',
              children: entry.line
            }, `error-${index}`))
      }),
      !loading && activeTab === 'recoveries' && jsxs('div', {
        className: 'space-y-3',
        children: data.recoveries.length === 0
          ? emptyState('No persisted cron recovery events found.')
          : data.recoveries.map((entry, index) => jsxs('div', {
              className: 'p-4 rounded bg-(--ui-card) border border-(--ui-stroke-secondary) space-y-2',
              children: [
                jsxs('div', {
                  className: 'flex justify-between items-center gap-3 text-xs text-(--ui-text-tertiary)',
                  children: [
                    jsx('span', { className: 'font-semibold text-(--ui-accent)', children: entry.timestamp || 'Time unavailable' }),
                    jsx('span', { className: 'truncate', children: entry.event })
                  ]
                }),
                jsx('div', { className: 'text-sm text-foreground', children: entry.details })
              ]
            }, `recovery-${index}`))
      })
    ]
  })
}

export default {
  id: ID,
  name: 'Error & Recovery Tracker',
  register(ctx) {
    const loadData = () => ctx.rest('/errors', { timeoutMs: 15000 })

    ctx.registerMany([
      {
        id: 'error-tracker-page',
        area: ROUTES_AREA,
        data: { path: ROUTE },
        render: () => jsx(ErrorTrackerPage, { loadData })
      },
      {
        id: 'error-tracker-nav',
        area: SIDEBAR_NAV_AREA,
        order: 100,
        data: { path: ROUTE, label: 'Error Tracker', codicon: 'bug' }
      }
    ])
  }
}
