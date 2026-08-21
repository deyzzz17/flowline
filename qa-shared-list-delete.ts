import 'dotenv/config'
import { Pool } from 'pg'
import { getPayload } from 'payload'
import config from './src/payload.config'
import { resolveListRole } from './src/lib/list-roles'

// Server actions read the caller via getSession() (better-auth, cookie-based)
// which doesn't exist outside a real request, so this replicates deleteList's
// cascade logic directly against the collections instead of calling the
// action through the auth wall.
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const payload = await getPayload({ config })

  const adminId = `qa-admin-${Date.now()}`
  const memberId = `qa-member-${Date.now()}`

  try {
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", plan) VALUES ($1,$2,$3,true,'plus')`,
      [adminId, 'QA Admin', `${adminId}@example.com`],
    )
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", plan) VALUES ($1,$2,$3,true,'free')`,
      [memberId, 'QA Member', `${memberId}@example.com`],
    )

    const list = await payload.create({
      collection: 'lists',
      data: {
        name: 'QA Shared List',
        userId: adminId,
        isShared: true,
        slug: `qa-shared-list-${Date.now()}`,
      },
    })

    const memberRow = await payload.create({
      collection: 'list-members',
      data: {
        list: list.id,
        userId: memberId,
        invitedBy: adminId,
        role: 'editor',
        status: 'accepted',
        respondedAt: new Date().toISOString(),
      },
    })

    const memberSharedListsBefore = await payload.find({
      collection: 'list-members',
      where: { and: [{ userId: { equals: memberId } }, { status: { equals: 'accepted' } }] },
    })

    console.log('Before delete:')
    console.log('  member role:', await resolveListRole(payload, list.id, memberId))
    console.log('  member accepted list-members rows:', memberSharedListsBefore.docs.length)

    // --- Replicates deleteList's cascade (src/api/lists/actions.ts) ---
    const { docs: members } = await payload.find({
      collection: 'list-members',
      where: { list: { equals: list.id } },
      limit: 0,
    })
    for (const m of members) {
      await payload.delete({ collection: 'list-members', id: m.id })
    }
    await payload.delete({ collection: 'lists', id: list.id })
    // --------------------------------------------------------------

    const memberSharedListsAfter = await payload.find({
      collection: 'list-members',
      where: { and: [{ userId: { equals: memberId } }, { status: { equals: 'accepted' } }] },
    })

    console.log('\nAfter delete:')
    console.log('  member role:', await resolveListRole(payload, list.id, memberId))
    console.log('  member accepted list-members rows:', memberSharedListsAfter.docs.length)

    const remainingMemberRow = await payload
      .findByID({ collection: 'list-members', id: memberRow.id })
      .catch(() => null)
    console.log('  original list-members row still exists:', !!remainingMemberRow)

    const remainingList = await payload
      .findByID({ collection: 'lists', id: list.id })
      .catch(() => null)
    console.log('  list still exists:', !!remainingList)
  } finally {
    await pool.query(`DELETE FROM "user" WHERE id IN ($1, $2)`, [adminId, memberId])
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
