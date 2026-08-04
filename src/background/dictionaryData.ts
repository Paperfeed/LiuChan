import { gunzipSync, strFromU8, unzipSync } from 'fflate'

import { DictionaryFiles } from '@/background/Dictionary'

const DATABASE = 'liuchan-dictionaries'
const STORE = 'bundles'
const ACTIVE_KEY = 'active'
const MAX_ARCHIVE_BYTES = 25 * 1024 * 1024
const MAX_FILE_BYTES = 30 * 1024 * 1024

export const DICTIONARY_URLS = {
  canto: 'https://cccanto.org/cccanto-170202.zip',
  cedict: 'https://cc-cedict.org/editor/editor_export_cedict.php?c=gz',
  readings: 'https://cccanto.org/cccedict-canto-readings-150923.zip',
} as const

export interface DictionaryMetadata {
  entryCounts: Record<keyof DictionaryFiles, number>
  fingerprints: Record<keyof DictionaryFiles, string>
  installedAt: string
  versions: Record<keyof DictionaryFiles, string>
}

interface StoredBundle {
  files: DictionaryFiles
  key: typeof ACTIVE_KEY
  metadata: DictionaryMetadata
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readBundle(): Promise<StoredBundle | undefined> {
  const database = await openDatabase()
  return new Promise<StoredBundle | undefined>((resolve, reject) => {
    const request = database
      .transaction(STORE, 'readonly')
      .objectStore(STORE)
      .get(ACTIVE_KEY)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  }).finally(() => database.close())
}

async function writeBundle(bundle: StoredBundle) {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).put(bundle)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  }).finally(() => database.close())
}

export async function getDownloadedDictionaries() {
  return (await readBundle())?.files
}

export async function getDictionaryMetadata() {
  return (await readBundle())?.metadata
}

export async function restoreBundledDictionaries() {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).delete(ACTIVE_KEY)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  }).finally(() => database.close())
}

async function fetchArchive(url: string) {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok)
    throw new Error(`Dictionary download failed (${response.status})`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength > MAX_ARCHIVE_BYTES)
    throw new Error('Dictionary archive is too large')
  return bytes
}

function unzipText(bytes: Uint8Array, expectedName: RegExp) {
  const files = unzipSync(bytes)
  const match = Object.entries(files).find(([name]) => expectedName.test(name))
  if (!match)
    throw new Error('Expected dictionary file was not found in archive')
  if (match[1].byteLength > MAX_FILE_BYTES)
    throw new Error('Dictionary file is too large')
  return strFromU8(match[1])
}

function validateFile(
  text: string,
  type: keyof DictionaryFiles
): { count: number; version: string } {
  const minimums = { canto: 30_000, cedict: 100_000, readings: 90_000 }
  const patterns = {
    canto: /^\S+\s+\S+\s+\[[^\]]+]\s+\{[^}]+}\s+\/[\s\S]*\/(?:\s+#.*)?$/,
    cedict: /^\S+\s+\S+\s+\[[^\]]+]\s+\/[\s\S]*\/(?:\s+#.*)?$/,
    readings: /^\S+\s+\S+\s+\[[^\]]+]\s+\{[^}]+}$/,
  }
  const lines = text.split(/\r?\n/)
  const count = lines.filter((line) => patterns[type].test(line)).length
  if (count < minimums[type])
    throw new Error(`${type} dictionary failed validation`)
  const version =
    lines
      .find((line) => /^(#!\s*)?version=/i.test(line))
      ?.replace(/^.*=/, '') ??
    lines
      .find((line) => /^# Version /i.test(line))
      ?.replace(/^# Version /i, '') ??
    `${count} entries`
  return { count, version }
}

async function fingerprint(text: string) {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text)
  )
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function updateDictionaries(): Promise<DictionaryMetadata> {
  const [cedictArchive, cantoArchive, readingsArchive] = await Promise.all([
    fetchArchive(DICTIONARY_URLS.cedict),
    fetchArchive(DICTIONARY_URLS.canto),
    fetchArchive(DICTIONARY_URLS.readings),
  ])
  const cedictBytes = gunzipSync(cedictArchive)
  if (cedictBytes.byteLength > MAX_FILE_BYTES)
    throw new Error('CC-CEDICT file is too large')
  const files: DictionaryFiles = {
    canto: unzipText(cantoArchive, /cccanto.*\.txt$/i),
    cedict: strFromU8(cedictBytes),
    readings: unzipText(readingsArchive, /readings.*\.txt$/i),
  }
  const validations = {
    canto: validateFile(files.canto, 'canto'),
    cedict: validateFile(files.cedict, 'cedict'),
    readings: validateFile(files.readings, 'readings'),
  }
  const metadata: DictionaryMetadata = {
    entryCounts: {
      canto: validations.canto.count,
      cedict: validations.cedict.count,
      readings: validations.readings.count,
    },
    fingerprints: {
      canto: await fingerprint(files.canto),
      cedict: await fingerprint(files.cedict),
      readings: await fingerprint(files.readings),
    },
    installedAt: new Date().toISOString(),
    versions: {
      canto: validations.canto.version,
      cedict: validations.cedict.version,
      readings: validations.readings.version,
    },
  }
  await writeBundle({ files, key: ACTIVE_KEY, metadata })
  return metadata
}
