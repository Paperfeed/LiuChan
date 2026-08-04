import { LiuChanOptions } from '@/background/config/defaultConfig'
import { DictionaryMetadata } from '@/background/dictionaryData'
import { SearchResult } from '@/background/Dictionary'

export enum ContentMessageType {
  Config = 'config',
  DictionaryRestore = 'dictionaryRestore',
  DictionaryStatus = 'dictionaryStatus',
  DictionaryUpdate = 'dictionaryUpdate',
  Initialize = 'initialize',
  Search = 'search',
  Speak = 'speak',
}

export type ContentMessages =
  | { type: ContentMessageType.Initialize }
  | { config: LiuChanOptions; type: ContentMessageType.Config }
  | { text: string; type: ContentMessageType.Search }
  | { text: string; type: ContentMessageType.Speak }
  | { type: ContentMessageType.DictionaryStatus }
  | { type: ContentMessageType.DictionaryUpdate }
  | { type: ContentMessageType.DictionaryRestore }

export interface ContentResponseMap {
  [ContentMessageType.Initialize]: { config: LiuChanOptions; enabled: boolean }
  [ContentMessageType.Config]: undefined
  [ContentMessageType.Search]: SearchResult | undefined
  [ContentMessageType.Speak]: string
  [ContentMessageType.DictionaryStatus]: DictionaryMetadata | undefined
  [ContentMessageType.DictionaryUpdate]: DictionaryMetadata
  [ContentMessageType.DictionaryRestore]: undefined
}

export type ContentResponse<T extends ContentMessageType> =
  ContentResponseMap[T]
