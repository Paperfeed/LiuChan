import { LiuChanOptions } from '@/background/config/defaultConfig'

export enum BackgroundMessageType {
  Config = 'config',
  Disable = 'disable',
  Enable = 'enable',
}

export type BackgroundMessages =
  | { config: LiuChanOptions; type: BackgroundMessageType.Config }
  | { type: BackgroundMessageType.Disable }
  | { type: BackgroundMessageType.Enable }
