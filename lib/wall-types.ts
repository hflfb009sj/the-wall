export type TierType = 'stone' | 'bronze' | 'silver' | 'gold' | 'obsidian' | 'genesis' | 'sovereign';

export interface TierConfig {
  id: TierType;
  priceInPi: number;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  color: string;
  glowColor: string;
  maxSupply: number | null;
  order: number;
  perks: string[];
  perksAr: string[];
}

export const TIERS: Record<TierType, TierConfig> = {
  stone: {
    id: 'stone',
    priceInPi: 0.001,
    name: 'Stone',
    nameAr: 'الحجر',
    description: 'Your name on The Wall',
    descriptionAr: 'اسمك على الجدار',
    color: '#707070',
    glowColor: 'rgba(112,112,112,0.3)',
    maxSupply: null,
    order: 6,
    perks: ['Name on The Wall', 'Basic sigil'],
    perksAr: ['اسمك على الجدار', 'رمز أساسي'],
  },
  bronze: {
    id: 'bronze',
    priceInPi: 0.05,
    name: 'Bronze',
    nameAr: 'البرونز',
    description: 'Profile + 1 service',
    descriptionAr: 'صفحة + خدمة واحدة',
    color: '#c8845a',
    glowColor: 'rgba(200,132,90,0.35)',
    maxSupply: null,
    order: 5,
    perks: ['Full profile page', '1 service listing', 'Bronze sigil'],
    perksAr: ['صفحة كاملة', 'خدمة واحدة', 'رمز برونزي'],
  },
  silver: {
    id: 'silver',
    priceInPi: 1,
    name: 'Silver',
    nameAr: 'الفضة',
    description: 'Profile + 3 services',
    descriptionAr: 'صفحة + 3 خدمات',
    color: '#c0c8e0',
    glowColor: 'rgba(192,200,224,0.35)',
    maxSupply: 50000,
    order: 4,
    perks: ['Priority placement', '3 service listings', 'Silver sigil', 'Search priority'],
    perksAr: ['أولوية في الجدار', '3 خدمات', 'رمز فضي', 'أولوية في البحث'],
  },
  gold: {
    id: 'gold',
    priceInPi: 10,
    name: 'Gold',
    nameAr: 'الذهب',
    description: 'VIP profile + 5 services',
    descriptionAr: 'ملف VIP + 5 خدمات',
    color: '#e8b84b',
    glowColor: 'rgba(232,184,75,0.4)',
    maxSupply: 5000,
    order: 3,
    perks: ['Top wall placement', '5 service listings', 'Gold sigil', 'Community voting'],
    perksAr: ['أعلى الجدار', '5 خدمات', 'رمز ذهبي', 'تصويت في المجتمع'],
  },
  obsidian: {
    id: 'obsidian',
    priceInPi: 100,
    name: 'Obsidian',
    nameAr: 'الأوبسيديان',
    description: 'Elite + weekly featured',
    descriptionAr: 'نخبة + إعلان أسبوعي',
    color: '#60c8ff',
    glowColor: 'rgba(96,200,255,0.4)',
    maxSupply: 500,
    order: 2,
    perks: ['Weekly featured spot', 'Unlimited services', 'Obsidian sigil', 'Direct Pi hiring'],
    perksAr: ['إعلان أسبوعي', 'خدمات غير محدودة', 'رمز أوبسيديان', 'توظيف مباشر'],
  },
  genesis: {
    id: 'genesis',
    priceInPi: 500,
    name: 'Genesis',
    nameAr: 'Genesis',
    description: '3% revenue share forever',
    descriptionAr: '3% من عائدات التطبيق للأبد',
    color: '#d4a0ff',
    glowColor: 'rgba(212,160,255,0.5)',
    maxSupply: 100,
    order: 1,
    perks: ['3% revenue share', 'Founder badge', 'Unlimited everything', 'Genesis sigil'],
    perksAr: ['3% من عائدات التطبيق', 'شارة مؤسس', 'كل شيء غير محدود', 'رمز Genesis'],
  },
  sovereign: {
    id: 'sovereign',
    priceInPi: 1000,
    name: 'Sovereign',
    nameAr: 'Sovereign',
    description: '5% revenue share + partnership',
    descriptionAr: '5% من العائدات + شراكة رسمية',
    color: '#fff8e0',
    glowColor: 'rgba(255,248,224,0.6)',
    maxSupply: 10,
    order: 0,
    perks: ['5% revenue share', 'Official partner', 'Sovereign sigil', 'Governance rights'],
    perksAr: ['5% من العائدات', 'شريك رسمي', 'رمز Sovereign', 'حق التصويت'],
  },
};

export const TIER_ORDER: TierType[] = ['sovereign', 'genesis', 'obsidian', 'gold', 'silver', 'bronze', 'stone'];

export interface Service {
  id: string;
  title: string;
  description: string;
  priceInPi: number;
  category: string;
}

export interface PioneerProfile {
  piId: string;
  username: string;
  name: string;
  nameAr?: string;
  profession: string;
  professionAr?: string;
  bio?: string;
  bioAr?: string;
  tier: TierType;
  services: Service[];
  likes: number;
  rating: number;
  ratingCount: number;
  contact?: string;
  engravedAt: number;
  heritage: number; // inheritance count
  isForSale?: boolean;
  salePrice?: number;
}

export interface WallState {
  pioneers: PioneerProfile[];
  currentUser: PioneerProfile | null;
  isLoading: boolean;
}
