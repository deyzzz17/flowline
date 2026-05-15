'use client'

import { useQuery } from '@tanstack/react-query'

export interface PublicHoliday {
  date: string
  localName: string
  name: string
  countryCode: string
}

function timezoneToCountryCode(timezone: string): string {
  const map: Record<string, string> = {
    'Europe/Paris': 'FR',
    'Europe/Lyon': 'FR',
    'Europe/Marseille': 'FR',
    'Europe/London': 'GB',
    'Europe/Dublin': 'IE',
    'Europe/Berlin': 'DE',
    'Europe/Munich': 'DE',
    'Europe/Hamburg': 'DE',
    'Europe/Madrid': 'ES',
    'Europe/Barcelona': 'ES',
    'Europe/Rome': 'IT',
    'Europe/Milan': 'IT',
    'Europe/Amsterdam': 'NL',
    'Europe/Brussels': 'BE',
    'Europe/Zurich': 'CH',
    'Europe/Geneva': 'CH',
    'Europe/Vienna': 'AT',
    'Europe/Warsaw': 'PL',
    'Europe/Prague': 'CZ',
    'Europe/Budapest': 'HU',
    'Europe/Bucharest': 'RO',
    'Europe/Sofia': 'BG',
    'Europe/Athens': 'GR',
    'Europe/Helsinki': 'FI',
    'Europe/Stockholm': 'SE',
    'Europe/Oslo': 'NO',
    'Europe/Copenhagen': 'DK',
    'Europe/Lisbon': 'PT',
    'Europe/Kyiv': 'UA',
    'Europe/Moscow': 'RU',
    'Europe/Istanbul': 'TR',
    'Europe/Minsk': 'BY',
    'Europe/Riga': 'LV',
    'Europe/Tallinn': 'EE',
    'Europe/Vilnius': 'LT',
    'Europe/Bratislava': 'SK',
    'Europe/Ljubljana': 'SI',
    'Europe/Zagreb': 'HR',
    'Europe/Belgrade': 'RS',
    'Europe/Sarajevo': 'BA',
    'Europe/Skopje': 'MK',
    'Europe/Tirane': 'AL',
    'Europe/Podgorica': 'ME',
    'Europe/Luxembourg': 'LU',
    'Europe/Malta': 'MT',
    'Europe/Nicosia': 'CY',
    'Europe/Reykjavik': 'IS',
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'America/Phoenix': 'US',
    'America/Anchorage': 'US',
    'America/Honolulu': 'US',
    'America/Detroit': 'US',
    'America/Indiana/Indianapolis': 'US',
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    'America/Montreal': 'CA',
    'America/Edmonton': 'CA',
    'America/Winnipeg': 'CA',
    'America/Halifax': 'CA',
    'America/Mexico_City': 'MX',
    'America/Cancun': 'MX',
    'America/Monterrey': 'MX',
    'America/Sao_Paulo': 'BR',
    'America/Rio_Branco': 'BR',
    'America/Manaus': 'BR',
    'America/Buenos_Aires': 'AR',
    'America/Argentina/Buenos_Aires': 'AR',
    'America/Santiago': 'CL',
    'America/Bogota': 'CO',
    'America/Lima': 'PE',
    'America/Caracas': 'VE',
    'America/La_Paz': 'BO',
    'America/Asuncion': 'PY',
    'America/Montevideo': 'UY',
    'America/Guayaquil': 'EC',
    'Asia/Tokyo': 'JP',
    'Asia/Seoul': 'KR',
    'Asia/Shanghai': 'CN',
    'Asia/Hong_Kong': 'HK',
    'Asia/Taipei': 'TW',
    'Asia/Singapore': 'SG',
    'Asia/Bangkok': 'TH',
    'Asia/Jakarta': 'ID',
    'Asia/Manila': 'PH',
    'Asia/Kolkata': 'IN',
    'Asia/Karachi': 'PK',
    'Asia/Dhaka': 'BD',
    'Asia/Colombo': 'LK',
    'Asia/Kathmandu': 'NP',
    'Asia/Dubai': 'AE',
    'Asia/Riyadh': 'SA',
    'Asia/Kuwait': 'KW',
    'Asia/Baghdad': 'IQ',
    'Asia/Tehran': 'IR',
    'Asia/Jerusalem': 'IL',
    'Asia/Beirut': 'LB',
    'Asia/Damascus': 'SY',
    'Asia/Amman': 'JO',
    'Asia/Almaty': 'KZ',
    'Asia/Tashkent': 'UZ',
    'Asia/Baku': 'AZ',
    'Asia/Tbilisi': 'GE',
    'Asia/Yerevan': 'AM',
    'Asia/Kuala_Lumpur': 'MY',
    'Asia/Ho_Chi_Minh': 'VN',
    'Asia/Rangoon': 'MM',
    'Asia/Phnom_Penh': 'KH',
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU',
    'Australia/Brisbane': 'AU',
    'Australia/Perth': 'AU',
    'Australia/Adelaide': 'AU',
    'Australia/Darwin': 'AU',
    'Pacific/Auckland': 'NZ',
    'Pacific/Fiji': 'FJ',
    'Africa/Cairo': 'EG',
    'Africa/Lagos': 'NG',
    'Africa/Nairobi': 'KE',
    'Africa/Johannesburg': 'ZA',
    'Africa/Casablanca': 'MA',
    'Africa/Tunis': 'TN',
    'Africa/Algiers': 'DZ',
    'Africa/Accra': 'GH',
    'Africa/Addis_Ababa': 'ET',
    'Africa/Dar_es_Salaam': 'TZ',
    'Africa/Kampala': 'UG',
    'Africa/Khartoum': 'SD',
    'Africa/Abidjan': 'CI',
    'Africa/Dakar': 'SN',
    'Africa/Douala': 'CM',
  }
  return map[timezone] ?? 'FR' // fallback France
}

async function fetchHolidays(year: number, countryCode: string): Promise<PublicHoliday[]> {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`, {
    next: { revalidate: 86400 },
  })
  if (!res.ok) return []
  return res.json()
}

export function usePublicHolidays(year: number) {
  const timezone =
    typeof window !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'Europe/Paris'
  const countryCode = timezoneToCountryCode(timezone)

  const { data: holidays = [] } = useQuery({
    queryKey: ['public-holidays', year, countryCode],
    queryFn: () => fetchHolidays(year, countryCode),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  })

  const holidayMap = new Map<string, PublicHoliday>()
  holidays.forEach((h) => holidayMap.set(h.date, h))

  const getHoliday = (date: Date): PublicHoliday | null => {
    const key = date.toISOString().slice(0, 10)
    return holidayMap.get(key) ?? null
  }

  return { holidays, getHoliday, countryCode }
}
