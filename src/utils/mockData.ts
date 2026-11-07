import { ChildProfile, CheckIn, ProductTrial, AppNotification, TrustedTip } from '../types';
import { generateSkinSvg } from './mockSkinImages';

export const INITIAL_CHILDREN: ChildProfile[] = [
  {
    id: 'child-mia',
    name: 'Mia',
    age: 3,
    avatarColor: '#6FA79A',
    reminderTime: '19:30', // 7:30 PM (Bath & Bedtime)
    calmPlan: {
      moisturizerRoutine: 'Ceramide ointment applied generously within 3 mins of lukewarm bath (morning & evening)',
      prescribedRoutine: 'Hydrocortisone 1% ointment on active red patches only, twice daily for up to 3 days',
      bathRoutine: '10-minute soak in lukewarm water with colloidal oat wash, pat dry gently (do not rub)',
      knownTriggers: ['Dry cold air (<30% humidity)', 'Wool sweaters', 'Sweaty park days', 'Teething stress'],
      doctorName: 'Dr. Santa Claus (demo)',
    },
  },
  {
    id: 'child-leo',
    name: 'Leo',
    age: 1,
    avatarColor: '#F4A98A',
    reminderTime: '20:00',
    calmPlan: {
      moisturizerRoutine: 'Gentle emollient balm after every diaper change & night bath',
      prescribedRoutine: 'Barrier barrier zinc paste on drool rash cheeks as needed',
      bathRoutine: 'Quick 5-min lukewarm rinse, fragrance-free cleanser only 2x/week',
      knownTriggers: ['Drool rash from teething', 'Synthetic sleep sacks', 'Pet dander'],
      doctorName: 'Dr. Santa Claus (demo)',
    },
  },
];

// Generates 21 days of realistic check-in history ending today
export function generateMockCheckIns(childId: string = 'child-mia'): CheckIn[] {
  const checkIns: CheckIn[] = [];
  const today = new Date();

  // Pattern over 21 days:
  // Days 20 to 14 ago: Mild baseline (scores 75-85)
  // Days 13 to 8 ago: Cold dry spell hits, sudden flare at day 10 (scores dip down to 34, redness/itch spike)
  // Days 7 to 0 ago: Calm plan applied + Ceramide barrier trial -> steady recovery back to 84-88
  for (let i = 20; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const displayDate = `${monthNames[d.getMonth()]} ${d.getDate()}`;

    let itchScore = 2;
    let skinScore = 80;
    let severity: 'clear' | 'mild' | 'moderate' | 'flare' = 'mild';
    let tags: string[] = ['Bath'];
    let bodyArea: CheckIn['bodyArea'] = 'face';
    let productUsed: CheckIn['productUsed'] = {
      name: 'Ceramide Barrier Balm',
      amount: 'medium dab',
    };
    let calmPlanDone = true;
    let description = 'Cheeks smooth with subtle pinkness. Good barrier hydration.';

    if (i >= 16) {
      // Days 20-16: stable
      itchScore = 2;
      skinScore = 82;
      severity = 'clear';
      description = 'Skin calm and supple. No visible scratching or rough patches.';
    } else if (i >= 12) {
      // Days 15-12: cold weather begins, drying out
      itchScore = 3;
      skinScore = 68;
      severity = 'mild';
      tags = ['Sweaty/hot', 'Bath'];
      description = 'Slight flakiness and rose-colored erythema appearing on left cheek.';
    } else if (i === 11 || i === 10 || i === 9) {
      // Peak Flare around day 10
      itchScore = i === 10 ? 5 : 4;
      skinScore = i === 10 ? 34 : 45;
      severity = 'flare';
      tags = ['Bad night', 'Daycare/School', 'Bath'];
      productUsed = {
        name: 'Hydrocortisone 1% (Care Plan)',
        amount: '1 FTU',
      };
      description = 'Prominent redness, warmth, and scratch marks along lower cheek crease. Restless sleep noted.';
    } else if (i >= 6) {
      // Recovery phase
      itchScore = 3;
      skinScore = 60 + (10 - i) * 3;
      severity = 'moderate';
      tags = ['Bath'];
      productUsed = {
        name: 'Ceramide Barrier Balm',
        amount: 'large dab',
      };
      description = 'Redness fading into light pink. Scratch lines healing cleanly.';
    } else {
      // Recent days (9-day streak active, doing great!)
      itchScore = 1;
      skinScore = 82 + (6 - i);
      severity = 'clear';
      tags = ['Bath'];
      productUsed = {
        name: 'Ceramide Barrier Balm',
        amount: 'medium dab',
      };
      description = 'Cheek barrier well-hydrated. Minimal redness, Mia slept through the night peacefully.';
    }

    checkIns.push({
      id: `checkin-${childId}-${dateStr}`,
      childId,
      date: dateStr,
      displayDate,
      timestamp: d.getTime(),
      bodyArea,
      photoUrl: generateSkinSvg({ bodyArea, severity, seed: i * 7 + 3 }),
      itchScore,
      tags,
      productUsed,
      calmPlanDone,
      skinScore,
      aiAnalysis: {
        description,
        rednessScore: severity === 'flare' ? 3 : severity === 'moderate' ? 2 : severity === 'mild' ? 1 : 0,
        swellingScore: severity === 'flare' ? 2 : 0,
        scratchScore: severity === 'flare' ? 2 : severity === 'moderate' ? 1 : 0,
        overallStatus: severity === 'flare' ? 'red' : severity === 'moderate' ? 'yellow' : 'green',
        redFlagsDetected: false,
        redFlagReason: null,
        disclaimer: 'This is not a diagnosis — worth discussing with your doctor.',
      },
      notes: i === 10 ? 'Mia was very restless last night. Cold dry wind at daycare playground.' : undefined,
    });
  }

  return checkIns;
}

export const INITIAL_PRODUCT_TRIALS: ProductTrial[] = [
  {
    id: 'trial-ceramide-balm',
    childId: 'child-mia',
    name: 'Ceramide Barrier Balm (Brand A)',
    type: 'moisturizer',
    startDate: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    durationDays: 14,
    status: 'completed',
    verdict: 'Helped',
    baselineScore: 48,
    endScore: 86,
    bestPhotoUrl: generateSkinSvg({ bodyArea: 'face', severity: 'clear', seed: 42 }),
    worstPhotoUrl: generateSkinSvg({ bodyArea: 'face', severity: 'flare', seed: 19 }),
    daysLogged: 14,
    avgAmount: 'Medium dab (2x/day)',
    notes: 'Significant improvement in cheek dryness and texture. Kept redness down even when weather was windy.',
  },
  {
    id: 'trial-oat-lotion',
    childId: 'child-mia',
    name: 'Oat Soothing Lotion (Brand B)',
    type: 'moisturizer',
    startDate: new Date(Date.now() - 32 * 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 18 * 86400000).toISOString().split('T')[0],
    durationDays: 14,
    status: 'completed',
    verdict: 'No clear change',
    baselineScore: 62,
    endScore: 60,
    bestPhotoUrl: generateSkinSvg({ bodyArea: 'face', severity: 'mild', seed: 88 }),
    worstPhotoUrl: generateSkinSvg({ bodyArea: 'face', severity: 'moderate', seed: 11 }),
    daysLogged: 12,
    avgAmount: '1 FTU (evening)',
    notes: 'Absorbed quickly but did not keep skin hydrated overnight. Cheeks still felt rough by 3 AM.',
  },
  {
    id: 'trial-active-probiotic',
    childId: 'child-mia',
    name: 'Gentle Calming Emollient',
    type: 'moisturizer',
    startDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    durationDays: 14,
    status: 'active',
    baselineScore: 82,
    daysLogged: 4,
    avgAmount: 'Small dab',
    notes: 'Testing for elbow crease and neck folds.',
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: "Time for Mia's evening check-in 📸",
    message: 'Snap a quick photo before pajamas to keep your 9-day streak going.',
    timeAgo: '15m ago',
    read: false,
    type: 'reminder',
  },
  {
    id: 'notif-2',
    title: 'High flare risk tomorrow ⚠️',
    message: 'Dry cold air arriving (humidity dropping to 24%). Keep Ceramide balm close.',
    timeAgo: '2h ago',
    read: false,
    type: 'warning',
  },
  {
    id: 'notif-3',
    title: 'Ceramide Barrier Balm trial complete ✨',
    message: 'Your 14-day trial showed +38 pts skin score improvement! Tap to review.',
    timeAgo: '1d ago',
    read: true,
    type: 'summary',
  },
  {
    id: 'notif-4',
    title: 'Milestone unlocked: Leaf Stage 🌱',
    message: 'Mia reached 9 consistent days! New trigger correlation insight unlocked.',
    timeAgo: '2d ago',
    read: true,
    type: 'milestone',
  },
];

export const TRUSTED_TIPS: TrustedTip[] = [
  {
    id: 'tip-steroid-myth',
    category: 'myth',
    title: 'Steroid Fear vs. Fact',
    content: 'Using doctor-prescribed mild steroids for short bursts (2–3 days) stops inflammation early, preventing deeper skin barrier cracks.',
    sourceHint: 'Pediatric Dermatology Guidelines',
  },
  {
    id: 'tip-bath-soak',
    category: 'routine',
    title: 'The Soak-and-Seal Rule',
    content: 'Always apply moisturizer within 3 minutes of stepping out of lukewarm bath while skin is slightly damp to trap water inside.',
    sourceHint: 'National Eczema Society',
  },
  {
    id: 'tip-dry-air',
    category: 'weather',
    title: 'Indoor Air below 30%',
    content: 'Cold snaps drop indoor heating humidity below 25%, rapidly drawing moisture out of sensitive toddler skin. A cool-mist humidifier helps.',
    sourceHint: 'Environmental Health Alert',
  },
  {
    id: 'tip-photo-angle',
    category: 'photo',
    title: 'Consistent Photo Angles',
    content: 'Use the ghost overlay to align the same distance and natural light every evening. Avoid harsh camera flashes.',
    sourceHint: 'Clinical Tracking Best Practice',
  },
  {
    id: 'tip-food-elimination',
    category: 'food',
    title: 'Do Not Cut Foods Unsupervised',
    content: 'Cutting dairy or eggs without an allergist diagnosis can cause nutritional deficits and rarely cures eczema. Always speak with your doctor first.',
    sourceHint: 'American Academy of Pediatrics',
  },
];
