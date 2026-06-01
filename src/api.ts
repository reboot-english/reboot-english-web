export interface PartOfSpeech {
  pos: string
  name: string
  meanings: string[]
}

export interface WordData {
  raw: string
  word: string
  words: string[]
  phonetic: string
  phonetics: string[]
  poss: PartOfSpeech[]
}

interface ApiEnvelope {
  code: number
  message: string
  data: WordData
}

export const NOT_RECOGNIZED = '无法识别'

export function isFound(data: WordData): boolean {
  return data.poss.length > 0 && data.phonetic !== NOT_RECOGNIZED
}

export async function lookupWord(word: string, splitHint = ''): Promise<WordData> {
  const params = new URLSearchParams({ word })
  if (splitHint) params.set('splitHint', splitHint)
  const res = await fetch(`/api/word/lookup?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`查询失败 (${res.status})`)
  }
  const json: ApiEnvelope = await res.json()
  if (json.code !== 200) {
    throw new Error(json.message || '查询失败')
  }
  return json.data
}

interface FavoriteEnvelope<T> {
  code: number
  message: string
  data: T
}

async function postWord(path: string, word: string): Promise<void> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  })
  if (!res.ok) {
    throw new Error(`操作失败 (${res.status})`)
  }
  const json: FavoriteEnvelope<unknown> = await res.json()
  if (json.code !== 200) {
    throw new Error(json.message || '操作失败')
  }
}

export function favoriteWord(word: string): Promise<void> {
  return postWord('/api/word/favorite', word)
}

export function unfavoriteWord(word: string): Promise<void> {
  return postWord('/api/word/unfavorite', word)
}

async function getWordList(path: string): Promise<string[]> {
  const res = await fetch(path)
  if (!res.ok) {
    throw new Error(`查询失败 (${res.status})`)
  }
  const json: FavoriteEnvelope<string[]> = await res.json()
  if (json.code !== 200) {
    throw new Error(json.message || '查询失败')
  }
  return json.data ?? []
}

export function listFavorite(): Promise<string[]> {
  return getWordList('/api/word/listFavorite')
}

export function listAllWords(): Promise<string[]> {
  return getWordList('/api/word/list')
}

export function listAudio(): Promise<string[]> {
  return getWordList('/api/word/listAudio')
}

async function postDelete(path: string, word: string): Promise<void> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  })
  if (!res.ok) {
    throw new Error(`删除失败 (${res.status})`)
  }
  const json: FavoriteEnvelope<unknown> = await res.json()
  if (json.code !== 200) {
    throw new Error(json.message || '删除失败')
  }
}

export function deleteAudio(word: string): Promise<void> {
  return postDelete('/api/word/deleteAudio', word)
}

export function deleteWord(word: string): Promise<void> {
  return postDelete('/api/word/delete', word)
}

export interface Alias {
  raw: string
  word: string
}

export async function listAlias(): Promise<Alias[]> {
  const res = await fetch('/api/word/listAlias')
  if (!res.ok) {
    throw new Error(`查询失败 (${res.status})`)
  }
  const json: FavoriteEnvelope<Alias[]> = await res.json()
  if (json.code !== 200) {
    throw new Error(json.message || '查询失败')
  }
  return json.data ?? []
}

export async function deleteAlias(raw: string): Promise<void> {
  const res = await fetch('/api/word/deleteAlias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  })
  if (!res.ok) {
    throw new Error(`删除失败 (${res.status})`)
  }
  const json: FavoriteEnvelope<unknown> = await res.json()
  if (json.code !== 200) {
    throw new Error(json.message || '删除失败')
  }
}

export async function isFavorite(word: string): Promise<boolean> {
  const res = await fetch(`/api/word/isFavorite?word=${encodeURIComponent(word)}`)
  if (!res.ok) {
    throw new Error(`查询失败 (${res.status})`)
  }
  const json: FavoriteEnvelope<{ word: string; favorited: boolean }> = await res.json()
  if (json.code !== 200) {
    throw new Error(json.message || '查询失败')
  }
  return Boolean(json.data?.favorited)
}
