'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select, FieldLabel } from '@payloadcms/ui'

type Option = { value: string; label: string }

const ALL_OPTION: Option = { label: 'Todas las campañas', value: '' }

export function CampaignFilterClient({
  campaigns,
  initialSelected,
}: {
  campaigns: { id: string; name: string }[]
  initialSelected: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const options: Option[] = [ALL_OPTION, ...campaigns.map(c => ({ label: c.name, value: c.id }))]

  const [selected, setSelected] = useState<Option>(
    options.find(o => o.value === initialSelected) ?? ALL_OPTION,
  )

  // Sync when server re-renders after URL change
  useEffect(() => {
    const match = options.find(o => o.value === initialSelected)
    if (match && match.value !== selected.value) {
      setSelected(match)
    }
  }, [initialSelected])

  const onChange = useCallback((value: unknown) => {
    const opt = (value as Option | null) ?? ALL_OPTION
    setSelected(opt)
    const params = new URLSearchParams(searchParams.toString())
    if (opt.value) params.set('campaign', opt.value)
    else params.delete('campaign')
    router.replace(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  return (
    <div style={{ width: '100%' }}>
      <FieldLabel label="Campaña" />
      <Select
        value={selected}
        onChange={onChange}
        options={options}
      />
    </div>
  )
}
