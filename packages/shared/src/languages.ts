export type LanguageCode = 'en' | 'ja' | 'zh' | 'es';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

/** Source language for sermons (fixed for MVP). */
export const SOURCE_LANGUAGE = 'ko' as const;

/** Target languages available to listeners. */
export const TARGET_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
];

export const TARGET_LANGUAGE_CODES: LanguageCode[] = TARGET_LANGUAGES.map((l) => l.code);

export function isLanguageCode(value: string): value is LanguageCode {
  return TARGET_LANGUAGE_CODES.includes(value as LanguageCode);
}

export function languageTrackName(code: LanguageCode): string {
  return `lang-${code}`;
}

export const SPEAKER_TRACK_NAME = 'speaker';
