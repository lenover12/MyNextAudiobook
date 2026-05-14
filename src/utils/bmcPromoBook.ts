import img1a from '../assets/bmc_img/1a.png';
import img1by from '../assets/bmc_img/1b-y.png';
import img2a from '../assets/bmc_img/2a.png';
import img2by from '../assets/bmc_img/2b-y.png';
import img3a from '../assets/bmc_img/3a.png';
import img3by from '../assets/bmc_img/3b-y.png';
import img4a from '../assets/bmc_img/4a.png';
import img4by from '../assets/bmc_img/4b-y.png';
import img5a from '../assets/bmc_img/5a.png';
import img5by from '../assets/bmc_img/5b-y.png';
import img6a from '../assets/bmc_img/6a.png';
import img6by from '../assets/bmc_img/6b-y.png';
import type { AudiobookDTO } from '../dto/audiobookDTO';

export { default as bmcBadge } from '../assets/badge/bmc.png';
export { default as bmcQrImage } from '../assets/bmc_img/bmc-qr.png';

const BMC_IMAGE_PAIRS: [string, string][] = [
  [img1a, img1by],
  [img2a, img2by],
  [img3a, img3by],
  [img4a, img4by],
  [img5a, img5by],
  [img6a, img6by],
];
export const BMC_URL = 'https://www.buymeacoffee.com/leo12';

// First promo triggers at this many real books for a returning user.
export const PROMO_INTERVAL = 50;
// First promo triggers earlier on a user's first visit.
export const PROMO_INTERVAL_FIRST_VISIT = 20;

export function createBmcPromoBook(): AudiobookDTO {
  const pair = BMC_IMAGE_PAIRS[Math.floor(Math.random() * BMC_IMAGE_PAIRS.length)];
  const id = Math.random().toString(36).slice(2, 9);
  return {
    asin: `__pr_${id}`,
    isbn: null,
    itunesId: null,
    // Unique per instance so transition effects re-fire between consecutive promos.
    // The fragment is ignored by the browser when opening the link.
    title: `__pr_${id}`,
    subtitle: null,
    censored_title: null,
    authors: null,
    narrators: null,
    publisher: null,
    audiblePageUrl: `${BMC_URL}#${id}`,
    itunesPageUrl: null,
    audioPreviewUrl: null,
    itunesImageUrl: pair[0],
    audibleImageUrl: null,
    description: null,
    summary: null,
    genre: null,
    genres: null,
    seriesList: null,
    releaseDate: null,
    rating: null,
    lengthMinutes: null,
    durationMinutes: null,
    bookFormat: null,
    language: null,
    explicit: null,
    region: null,
    regions: null,
    _fallback: false,
    __isPr: true,
    __prAltImageUrl: pair[1],
  };
}
