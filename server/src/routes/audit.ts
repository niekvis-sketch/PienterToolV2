// ============================================================
// Audit Issue Routes – update status van issues
// ============================================================
import { Router, Request, Response } from 'express'
import { readCollection, writeCollection } from '../storage'
import { ok, err } from '../helpers'
import type { AuditIssue } from '../../../shared/types'

export const auditRouter = Router()

auditRouter.put('/issues/:issueId', (req: Request, res: Response) => {
  const issues = readCollection<AuditIssue>('auditIssues')
  const idx = issues.findIndex(i => i.id === req.params.issueId)
  if (idx < 0) return res.status(404).json(err('Issue niet gevonden'))
  issues[idx] = { ...issues[idx], ...req.body, id: issues[idx].id, auditRunId: issues[idx].auditRunId }
  writeCollection('auditIssues', issues)
  res.json(ok(issues[idx]))
})
