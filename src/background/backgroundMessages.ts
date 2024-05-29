import { Runtime } from 'webextension-polyfill'

import { ContentOptions } from '@/background/config/defaultConfig'
import MessageSender = Runtime.MessageSender

export enum BackgroundMessageType {
  Config = 'config',
  Disable = 'disable',
  Enable = 'enable',
  Heartbeat = 'heartbeat',
  Initialize = 'initialize',
}

interface BaseMessage {
  type: BackgroundMessageType
}

interface InitializeMessage extends BaseMessage {
  config: ContentOptions
  enabled?: boolean
  type: BackgroundMessageType.Initialize
}

interface ConfigMessage extends BaseMessage {
  config: ContentOptions
  type: BackgroundMessageType.Config
}

interface EnableMessage extends BaseMessage {
  type: BackgroundMessageType.Enable
}

interface DisableMessage extends BaseMessage {
  type: BackgroundMessageType.Disable
}

interface HeartbeatMessage extends BaseMessage {
  type: BackgroundMessageType.Heartbeat
}

export type BackgroundMessages =
  | InitializeMessage
  | EnableMessage
  | DisableMessage
  | ConfigMessage
  | HeartbeatMessage

interface BackgroundResponseMap {
  [BackgroundMessageType.Heartbeat]: { alive: true }
}

export type BackgroundResponse<T extends BackgroundMessageType> =
  T extends keyof BackgroundResponseMap ? BackgroundResponseMap[T] : undefined

// Todo - Fix typing in messageHandler response
export type BackgroundMessageHandler<
  T extends BackgroundMessages = BackgroundMessages
> = (
  message: T,
  sender: MessageSender,
  sendResponse: (response: BackgroundResponse<T['type']>) => void
) => void
