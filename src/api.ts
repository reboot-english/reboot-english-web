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

export async function lookupWord(word: string): Promise<WordData> {
  const res = await fetch(`/api/word/lookup?word=${encodeURIComponent(word)}`)
  if (!res.ok) {
    throw new Error(`查询失败 (${res.status})`)
  }
  const json: ApiEnvelope = await res.json()
  if (json.code !== 200) {
    throw new Error(json.message || '查询失败')
  }
  return json.data
}
