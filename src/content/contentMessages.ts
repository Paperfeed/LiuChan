import { Runtime } from 'webextension-polyfill'

import { SearchResult } from '@/background/Dictionary'
import MessageSender = Runtime.MessageSender

import { LiuChanOptions } from '@/background/config/defaultConfig'

export enum ContentMessageType {
  Config = 'config',
  Initialize = 'initialize',
  Search = 'xsearch',
}

interface BaseMessage {
  type: ContentMessageType
}

interface InitializeMessage extends BaseMessage {
  type: ContentMessageType.Initialize
}

interface SearchMessage extends BaseMessage {
  text: string
  type: ContentMessageType.Search
}

// This message is sent from the options page to the background script
interface ConfigMessage extends BaseMessage {
  config: LiuChanOptions
  type: ContentMessageType.Config
}

export type ContentMessages = InitializeMessage | SearchMessage | ConfigMessage

interface ContentResponseMap {
  [ContentMessageType.Search]: SearchResult
  [ContentMessageType.Initialize]: {
    config: LiuChanOptions
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
