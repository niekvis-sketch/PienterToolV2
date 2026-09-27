import { computeStructureWarnings, normalizeTopic, type WarningNode } from '../../../shared/structuurWarnings'

function node(id: string, title: string, extra: Partial<WarningNode> = {}): WarningNode {
  return {
    id, title, slug: title.toLowerCase().replace(/\s+/g, '-'), level: 1, parentId: null,
    goal: 'informeren', focusTopic: '', isParked: false, isDetailTemplate: false,
    ...extra,
  }
}

describe('computeStructureWarnings', () => {
  it('meldt pagina\'s met hetzelfde focus-zoekwoord als concurrerend in Google', () => {
    const warnings = computeStructureWarnings([
      node('a', 'Bedrijfscatering', { focusTopic: 'Bedrijfscatering' }),
      node('b', 'Zakelijke lunch', { focusTopic: '  bedrijfscatering ' }),
      node('c', 'Evenementencatering', { focusTopic: 'catering evenementen' }),
    ])
    const cannibal = warnings.filter(w => w.type === 'keyword-cannibalization')
    expect(cannibal).toHaveLength(1)
    expect(cannibal[0]).toMatchObject({ nodeId: 'a', relatedNodeId: 'b', severity: 'error' })
    expect(cannibal[0].message).toContain('concurreren in Google')
  })

  it('negeert geparkeerde pagina\'s', () => {
    const warnings = computeStructureWarnings([
      node('a', 'Bedrijfscatering', { focusTopic: 'bedrijfscatering' }),
      node('b', 'Zakelijke lunch', { focusTopic: 'bedrijfscatering', isParked: true }),
    ])
    expect(warnings.some(w => w.type === 'keyword-cannibalization')).toBe(false)
  })

  it('zet fouten vóór waarschuwingen en info-meldingen', () => {
    const warnings = computeStructureWarnings([
      node('a', 'Home', { goal: null }),
      node('b', 'Bedrijfscatering', { focusTopic: 'bedrijfscatering' }),
      node('c', 'Zakelijke lunch', { focusTopic: 'bedrijfscatering' }),
    ])
    const order = { error: 0, warning: 1, info: 2 }
    const severities = warnings.map(w => order[w.severity])
    expect(severities).toEqual([...severities].sort((x, y) => x - y))
    expect(warnings[0].type).toBe('keyword-cannibalization')
  })
})

describe('normalizeTopic', () => {
  it('trekt hoofdletters, witruimte en leestekens gelijk', () => {
    expect(normalizeTopic('  Bedrijfs-catering! ')).toBe('bedrijfs catering')
    expect(normalizeTopic(undefined)).toBe('')
  })
})
