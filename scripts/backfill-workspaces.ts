// One-time backfill: ensures every user with lists/timer data has a Personal workspace
// and that those existing documents are attached to it. Idempotent — safe to rerun.
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const COLLECTIONS = ['lists', 'timer-configs', 'timer-sessions', 'timer-categories'] as const

async function main() {
  const payload = await getPayload({ config })

  const userIds = new Set<string>()
  for (const collection of COLLECTIONS) {
    const { docs } = await payload.find({
      collection,
      where: { workspace: { exists: false } },
      limit: 0,
      depth: 0,
    })
    for (const doc of docs) {
      const userId = (doc as { userId?: string }).userId
      if (userId) userIds.add(userId)
    }
  }

  console.log(`Found ${userIds.size} user(s) with unassigned documents.`)

  const workspaceByUser = new Map<string, number>()
  for (const userId of userIds) {
    const { docs: existing } = await payload.find({
      collection: 'workspaces',
      where: {
        and: [{ userId: { equals: userId } }, { isPersonal: { equals: true } }],
      },
      limit: 1,
    })
    let workspace = existing[0]
    if (!workspace) {
      workspace = await payload.create({
        collection: 'workspaces',
        data: { name: 'Personal', userId, isPersonal: true },
      })
      console.log(`Created personal workspace ${workspace.id} for user ${userId}`)
    }
    workspaceByUser.set(userId, workspace.id)
  }

  let totalUpdated = 0
  const failures: { collection: string; id: number; userId?: string; error: string }[] = []
  for (const collection of COLLECTIONS) {
    const { docs } = await payload.find({
      collection,
      where: { workspace: { exists: false } },
      limit: 0,
      depth: 0,
    })
    let updatedInCollection = 0
    for (const doc of docs) {
      const userId = (doc as { userId?: string }).userId
      const workspaceId = userId ? workspaceByUser.get(userId) : undefined
      if (!workspaceId) continue
      try {
        await payload.update({ collection, id: doc.id, data: { workspace: workspaceId } })
        totalUpdated++
        updatedInCollection++
      } catch (error) {
        failures.push({
          collection,
          id: doc.id,
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
    console.log(`${collection}: updated ${updatedInCollection}/${docs.length} document(s).`)
  }

  console.log(
    `Done. ${workspaceByUser.size} workspace(s) ensured, ${totalUpdated} document(s) backfilled.`,
  )
  if (failures.length > 0) {
    console.log(`${failures.length} document(s) failed:`)
    for (const f of failures) {
      console.log(`  - ${f.collection}#${f.id} (user ${f.userId}): ${f.error}`)
    }
  }
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
