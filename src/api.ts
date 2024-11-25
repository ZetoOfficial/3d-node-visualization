import {
  GetAllNodesResponse,
  GetAllRelationshipsResponse,
  GetNodeWithRelationshipsResponse,
} from './models'

export function composeURL(path: string): string {
  return new URL(path, 'http://localhost:8199').href
}

export async function getAllNodes(): Promise<GetAllNodesResponse[]> {
  const response = await fetch(composeURL('api/nodes'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()
  console.log('getAllNodes response:', data)
  return data
}

export async function getAllRelationships(): Promise<
  GetAllRelationshipsResponse[]
> {
  const response = await fetch(composeURL(`api/relationships`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()
  console.log(`getAllRelationships:`, data)
  return data
}

export async function getNodeWithRelationships(
  nodeId: string,
): Promise<GetNodeWithRelationshipsResponse> {
  const response = await fetch(composeURL(`api/nodes/${nodeId}`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()
  console.log(`getNodeWithRelationships ${nodeId}:`, data)
  return data
}
