import configPromise from '@payload-config'
import { getPayload } from 'payload'

// Tu peux complètement supprimer le fichier, c'est pas si important mais il ne sert à rien 
export const GET = async (request: Request) => {
  const payload = await getPayload({
    config: configPromise,
  })

  return Response.json({
    message: 'This is an example of a custom route.',
  })
}
