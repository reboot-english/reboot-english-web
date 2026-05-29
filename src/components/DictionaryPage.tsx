import { listAllWords } from '../api'
import WordListView from './WordListView'

export default function DictionaryPage() {
  return (
    <WordListView
      title="单词库"
      fetchWords={listAllWords}
      emptyText="单词库里还没有单词。"
    />
  )
}
