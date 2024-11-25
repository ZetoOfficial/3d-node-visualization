import { Node } from 'neo4j-driver'

export interface MyNode {
  id: number
  label: string
  name?: string | null
  screen_name?: string | null
  sex?: number | null
  city?: string | null
}

export interface MyRelationship {
  type: string
  end_node_id: number
}

export interface GetAllNodesResponse {
  id: number
  label: string
  name?: string | null
}

export interface GetAllRelationshipsResponse {
  start_node_id: number
  relationship_type: string
  end_node_id: number
  end_node: Node
}

export interface GetNodeWithRelationshipsResponse {
  node: MyNode
  relationships: MyRelationship[]
}
