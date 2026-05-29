import { listFavorite } from '../api'
import WordListView from './WordListView'

export default function FavoritesPage() {
  return (
    <WordListView
      title="我的收藏"
      fetchWords={listFavorite}
      emptyText="还没有收藏任何单词。"
    />
  )
}
