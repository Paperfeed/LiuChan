export const themes = {
  charcoal: {
    brace: 'text-brace',
    bullet: 'text-xs mr-[1px] font-bold',
    colors: {
      background: '45 45 45',
      border: '188 188 188',
      brace: '255 255 255',
      pinyin: '102 204 204',
      tone1: '242 119 122',
      tone2: '153 204 153',
      tone3: '102 153 204',
      tone4: '204 153 204',
      tone5: '204 204 204',
    },
    container:
      'bg-background text-white px-2 py-1 border-solid border-border my-2',
    definition: 'text-[12px]',
    entry:
      '-mx-2 mb-1 px-2 pb-1 border-b border-white/15 last:mb-0 last:border-b-0 last:pb-0',
    hanzi: 'font-bold text-[18px] mr-[10px] leading-0',
    pinyin: 'font-bold text-[16px] leading-0 text-pinyin',
    spacer: 'pl-2',
  },

  liuchan: {
    brace: 'text-brace',
    bullet: 'text-xs mr-[1px] font-bold',
    colors: {
      background: '255 255 224',
      border: '215 211 175',
      brace: '201 194 177',
      pinyin: '102 204 204',
      tone1: '242 119 122',
      tone2: '153 204 153',
      tone3: '111 114 185',
      tone4: '204 153 204',
      tone5: '204 204 204',
    },
    container: 'bg-background px-2 py-1 border-solid border-border my-2',
    definition: 'text-[13px]',
    entry:
      '-mx-2 mb-1 px-2 pb-1 border-b border-black/10 last:mb-0 last:border-b-0 last:pb-0',
    hanzi: 'font-bold text-[18px] mr-[10px] leading-0',
    pinyin: 'font-bold text-[16px] leading-0 text-pinyin',
    spacer: 'pl-2',
  },

  paper: {
    brace: 'text-brace',
    bullet: 'text-xs mr-[1px] font-bold',
    colors: {
      background: '245 245 241',
      border: '188 188 188',
      brace: '112 112 112',
      pinyin: '0 177 174',
      tone1: '225 37 37',
      tone2: '36 182 36',
      tone3: '0 0 255',
      tone4: '218 110 255',
      tone5: '119 119 119',
    },
    container:
      'bg-background text-black px-2 py-1 border-solid border-border my-2',
    definition: 'text-[12px]',
    entry:
      '-mx-2 mb-1 px-2 pb-1 border-b border-black/10 last:mb-0 last:border-b-0 last:pb-0',
    hanzi: 'font-bold text-[18px] mr-[10px] leading-0',
    pinyin: 'text-[16px] leading-0 text-pinyin',
    spacer: 'pl-2',
  },

  pleco: {
    brace: 'text-brace',
    bullet: 'text-xs mr-[1px] font-bold',
    colors: {
      background: '255 255 255',
      border: '215 211 175',
      brace: '201 194 177',
      pinyin: '102 204 204',
      tone1: '227 0 0',
      tone2: '0 176 0',
      tone3: '0 0 239',
      tone4: '127 0 186',
      tone5: '99 99 99',
    },
    container: 'bg-background px-2 py-1 border-solid border-border my-2',
    definition: 'text-[13px]',
    entry:
      '-mx-2 mb-1 px-2 pb-1 border-b border-black/10 last:mb-0 last:border-b-0 last:pb-0',
    hanzi: 'font-bold text-[18px] mr-[10px] leading-0',
    pinyin: 'font-bold text-[16px] leading-0 text-pinyin',
    spacer: 'pl-2',
  },

  sepia: {
    brace: 'text-brace',
    bullet: 'text-xs mr-[1px] font-bold',
    colors: {
      background: '251 246 233',
      border: '126 88 50',
      brace: '126 88 50',
      pinyin: '35 93 154',
      tone1: '242 119 122',
      tone2: '90 167 89',
      tone3: '67 138 213',
      tone4: '203 92 202',
      tone5: '154 149 149',
    },
    container:
      'bg-background text-[#573920] px-2 py-1 border-solid border-border my-2',
    definition: 'text-[12px]',
    entry:
      '-mx-2 mb-1 px-2 pb-1 border-b border-black/10 last:mb-0 last:border-b-0 last:pb-0',
    hanzi: 'font-bold text-[18px] mr-[10px] leading-0',
    pinyin: 'font-bold text-[16px] leading-0 text-pinyin',
    spacer: 'pl-2',
  },
}

export type Theme = keyof typeof themes
