// src/services/dummyUsers.ts
import axios from 'axios'

export interface DummyUser {
  id: number
  firstName: string
  lastName: string
  age: number
  email: string
  username: string
  // ... see the full shape at https://dummyjson.com/users
}

export interface DummyUsersResponse {
  users: DummyUser[]
  total: number
  skip: number
  limit: number
}

export async function getDummyUsers(): Promise<DummyUsersResponse> {
  const response = await axios.get<DummyUsersResponse>('https://dummyjson.com/users')
  return response.data
}
