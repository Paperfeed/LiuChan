import { Runtime } from 'webextension-polyfill'

import { SearchResult } from '@/background/Dictionary'
import MessageSender = Runtime.MessageSender
import { ContentOptions } from '@/background/config/defaultConfig'

export enum ContentMessageType {
  Initialize = 'initialize',
  Search = 'xsearch',
}

interface BaseMessage {
  type: ContentMessageType
}

interface SearchMessage extends BaseMessage {
  text: string
  type: ContentMessageType.Search
}

interface InitializeMessage extends BaseMessage {
  type: ContentMessageType.Initialize
}

export type ContentMessages = SearchMessage | InitializeMessage

interface ContentResponseMap {
  [ContentMessageType.Search]: SearchResult
  [ContentMessageType.Initialize]: {
    config: ContentOptions
    enabled: boolean
  }
}

export type ContentResponse<T extends ContentMessageType> =
  T extends keyof ContentResponseMap ? ContentResponseMap[T] : undefined

export type ContentMessageHandler<T extends ContentMessages = ContentMessages> =
  (
    message: T,
    sender: MessageSender,
    sendResponse: (response: ContentResponse<T['type']>) => void
  ) => void
