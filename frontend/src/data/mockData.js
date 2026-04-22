// ─── Mock Data ────────────────────────────────────────────────────────────────

export const kpiData = {
  totalFeedback: 24_718,
  satisfactionRate: 76.4,
  negativePercent: 18.2,
  aiResponsesToday: 1_247,
  avgBLEU: 0.743,
  avgConfidence: 89.2,
};

export const topicEvolutionData = [
  { month: 'Aug', Delivery: 32, Payment: 18, ProductQuality: 25, CustomerSupport: 14, Returns: 11 },
  { month: 'Sep', Delivery: 35, Payment: 21, ProductQuality: 22, CustomerSupport: 16, Returns: 13 },
  { month: 'Oct', Delivery: 29, Payment: 24, ProductQuality: 28, CustomerSupport: 12, Returns: 14 },
  { month: 'Nov', Delivery: 41, Payment: 20, ProductQuality: 19, CustomerSupport: 18, Returns: 18 },
  { month: 'Dec', Delivery: 52, Payment: 17, ProductQuality: 16, CustomerSupport: 22, Returns: 24 },
  { month: 'Jan', Delivery: 38, Payment: 23, ProductQuality: 21, CustomerSupport: 20, Returns: 16 },
  { month: 'Feb', Delivery: 34, Payment: 28, ProductQuality: 24, CustomerSupport: 17, Returns: 13 },
  { month: 'Mar', Delivery: 30, Payment: 31, ProductQuality: 26, CustomerSupport: 15, Returns: 11 },
];

export const sentimentData = [
  { name: 'Positive', value: 57.4, color: '#34d399' },
  { name: 'Neutral',  value: 24.4, color: '#64748b' },
  { name: 'Negative', value: 18.2, color: '#f87171' },
];

export const topicDistribution = [
  { topic: 'Delivery & Shipping',    count: 6840, pct: 27.7 },
  { topic: 'Product Quality',        count: 5423, pct: 22.0 },
  { topic: 'Payment & Pricing',      count: 4312, pct: 17.5 },
  { topic: 'Customer Support',       count: 3680, pct: 14.9 },
  { topic: 'Returns & Refunds',      count: 2890, pct: 11.7 },
  { topic: 'App / Website UX',       count: 1573, pct: 6.4  },
];

export const weeklyComplaintData = [
  { day: 'Mon', Delivery: 42, Payment: 18, Quality: 24, Support: 15 },
  { day: 'Tue', Delivery: 38, Payment: 22, Quality: 28, Support: 18 },
  { day: 'Wed', Delivery: 55, Payment: 19, Quality: 21, Support: 20 },
  { day: 'Thu', Delivery: 46, Payment: 25, Quality: 31, Support: 22 },
  { day: 'Fri', Delivery: 61, Payment: 21, Quality: 26, Support: 19 },
  { day: 'Sat', Delivery: 73, Payment: 16, Quality: 18, Support: 12 },
  { day: 'Sun', Delivery: 49, Payment: 14, Quality: 15, Support: 10 },
];

export const recentFeedback = [
  {
    id: 1,
    text: 'My order has been stuck in transit for 5 days without any update. Very frustrating experience.',
    sentiment: 'negative',
    topic: 'Delivery & Shipping',
    response: 'We sincerely apologize for the delay. Our logistics team has been alerted and will provide a resolution within 24 hours.',
    confidence: 94.2,
    bleu: 0.78,
    lang: 'EN',
    time: '2 min ago',
  },
  {
    id: 2,
    text: 'Excellent quality product! Arrived earlier than expected and packaging was perfect.',
    sentiment: 'positive',
    topic: 'Product Quality',
    response: 'Thank you for your wonderful feedback! We\'re delighted the product met your expectations.',
    confidence: 97.1,
    bleu: 0.81,
    lang: 'EN',
    time: '8 min ago',
  },
  {
    id: 3,
    text: 'Payment failed three times but money was deducted. Need urgent resolution.',
    sentiment: 'negative',
    topic: 'Payment & Pricing',
    response: 'We apologize for this inconvenience. Our payment team will investigate and initiate a refund within 3-5 business days.',
    confidence: 91.8,
    bleu: 0.74,
    lang: 'EN',
    time: '15 min ago',
  },
  {
    id: 4,
    text: 'Return process was smooth and refund credited promptly. Great customer service.',
    sentiment: 'positive',
    topic: 'Returns & Refunds',
    response: 'Thank you for appreciating our service! We strive to make every experience seamless.',
    confidence: 95.6,
    bleu: 0.82,
    lang: 'EN',
    time: '23 min ago',
  },
  {
    id: 5,
    text: 'App keeps crashing when I try to track my order. Very poor user experience.',
    sentiment: 'negative',
    topic: 'App / Website UX',
    response: 'We apologize for the technical difficulty. Our engineering team has been notified and a fix will be deployed shortly.',
    confidence: 88.4,
    bleu: 0.71,
    lang: 'EN',
    time: '31 min ago',
  },
];

// ─── Topic Modeling ────────────────────────────────────────────────────────────
export const topics = [
  {
    id: 1,
    name: 'Delivery & Shipping',
    probability: 0.277,
    trend: 'Rising',
    trendDelta: +4.2,
    color: '#22d3ee',
    keywords: [
      { word: 'delayed', weight: 0.89 },
      { word: 'tracking', weight: 0.84 },
      { word: 'shipping', weight: 0.81 },
      { word: 'courier', weight: 0.76 },
      { word: 'transit', weight: 0.72 },
      { word: 'dispatch', weight: 0.68 },
      { word: 'logistics', weight: 0.65 },
      { word: 'delivery', weight: 0.91 },
    ],
    timeData: [
      { t: 'Aug', prob: 0.28 }, { t: 'Sep', prob: 0.30 }, { t: 'Oct', prob: 0.25 },
      { t: 'Nov', prob: 0.34 }, { t: 'Dec', prob: 0.44 }, { t: 'Jan', prob: 0.32 },
      { t: 'Feb', prob: 0.29 }, { t: 'Mar', prob: 0.27 },
    ],
    count: 6840,
  },
  {
    id: 2,
    name: 'Product Quality',
    probability: 0.220,
    trend: 'Stable',
    trendDelta: -0.8,
    color: '#34d399',
    keywords: [
      { word: 'quality', weight: 0.93 },
      { word: 'defective', weight: 0.85 },
      { word: 'material', weight: 0.79 },
      { word: 'broken', weight: 0.77 },
      { word: 'damaged', weight: 0.74 },
      { word: 'authentic', weight: 0.71 },
      { word: 'genuine', weight: 0.67 },
      { word: 'counterfeit', weight: 0.63 },
    ],
    timeData: [
      { t: 'Aug', prob: 0.24 }, { t: 'Sep', prob: 0.22 }, { t: 'Oct', prob: 0.26 },
      { t: 'Nov', prob: 0.20 }, { t: 'Dec', prob: 0.18 }, { t: 'Jan', prob: 0.21 },
      { t: 'Feb', prob: 0.23 }, { t: 'Mar', prob: 0.22 },
    ],
    count: 5423,
  },
  {
    id: 3,
    name: 'Payment & Pricing',
    probability: 0.175,
    trend: 'Rising',
    trendDelta: +6.1,
    color: '#fbbf24',
    keywords: [
      { word: 'payment', weight: 0.91 },
      { word: 'refund', weight: 0.87 },
      { word: 'charge', weight: 0.82 },
      { word: 'price', weight: 0.80 },
      { word: 'expensive', weight: 0.76 },
      { word: 'billing', weight: 0.71 },
      { word: 'transaction', weight: 0.68 },
      { word: 'discount', weight: 0.64 },
    ],
    timeData: [
      { t: 'Aug', prob: 0.16 }, { t: 'Sep', prob: 0.18 }, { t: 'Oct', prob: 0.21 },
      { t: 'Nov', prob: 0.18 }, { t: 'Dec', prob: 0.15 }, { t: 'Jan', prob: 0.20 },
      { t: 'Feb', prob: 0.24 }, { t: 'Mar', prob: 0.27 },
    ],
    count: 4312,
  },
  {
    id: 4,
    name: 'Customer Support',
    probability: 0.149,
    trend: 'Stable',
    trendDelta: +1.2,
    color: '#a78bfa',
    keywords: [
      { word: 'support', weight: 0.90 },
      { word: 'response', weight: 0.86 },
      { word: 'helpful', weight: 0.81 },
      { word: 'rude', weight: 0.77 },
      { word: 'agent', weight: 0.73 },
      { word: 'resolved', weight: 0.70 },
      { word: 'complaint', weight: 0.67 },
      { word: 'escalate', weight: 0.62 },
    ],
    timeData: [
      { t: 'Aug', prob: 0.14 }, { t: 'Sep', prob: 0.15 }, { t: 'Oct', prob: 0.13 },
      { t: 'Nov', prob: 0.16 }, { t: 'Dec', prob: 0.19 }, { t: 'Jan', prob: 0.17 },
      { t: 'Feb', prob: 0.15 }, { t: 'Mar', prob: 0.15 },
    ],
    count: 3680,
  },
  {
    id: 5,
    name: 'Returns & Refunds',
    probability: 0.117,
    trend: 'Falling',
    trendDelta: -3.1,
    color: '#f87171',
    keywords: [
      { word: 'return', weight: 0.92 },
      { word: 'refund', weight: 0.88 },
      { word: 'exchange', weight: 0.80 },
      { word: 'policy', weight: 0.76 },
      { word: 'window', weight: 0.71 },
      { word: 'pickup', weight: 0.67 },
      { word: 'damaged', weight: 0.65 },
      { word: 'warranty', weight: 0.61 },
    ],
    timeData: [
      { t: 'Aug', prob: 0.11 }, { t: 'Sep', prob: 0.12 }, { t: 'Oct', prob: 0.13 },
      { t: 'Nov', prob: 0.16 }, { t: 'Dec', prob: 0.21 }, { t: 'Jan', prob: 0.14 },
      { t: 'Feb', prob: 0.12 }, { t: 'Mar', prob: 0.12 },
    ],
    count: 2890,
  },
];

// ─── Response Generation Queue ─────────────────────────────────────────────────
export const feedbackQueue = [
  {
    id: 'FB-4821',
    text: 'My order has been stuck in transit for 5 days without any tracking update. This is completely unacceptable.',
    sentiment: 'negative',
    sentimentConf: 94.2,
    topic: 'Delivery & Shipping',
    topicProb: 91.7,
    lang: 'EN',
    category: 'Electronics',
    keywords: ['stuck', 'transit', 'tracking', 'update'],
    generatedResponse: 'Dear valued customer, we sincerely apologize for the delay in your order delivery. Our logistics team has been alerted and will personally track your shipment. We will provide you with a detailed update within the next 24 hours and ensure this matter is resolved promptly. As a gesture of our commitment to your satisfaction, a compensation voucher will be applied to your account.',
    approvalStatus: 'needs_review',
    bleu: 0.782,
    rouge: 0.741,
    semantic: 87.4,
    confidence: 94.2,
    time: '2 min ago',
  },
  {
    id: 'FB-4820',
    text: 'Excellent quality product! Arrived earlier than expected and the packaging was absolutely perfect.',
    sentiment: 'positive',
    sentimentConf: 97.1,
    topic: 'Product Quality',
    topicProb: 88.4,
    lang: 'EN',
    category: 'Fashion',
    keywords: ['excellent', 'quality', 'packaging', 'expected'],
    generatedResponse: 'Thank you so much for your wonderful review! We are thrilled to hear that your product arrived ahead of schedule and met your quality expectations. Your satisfaction is our greatest achievement, and feedback like yours motivates our entire team. We look forward to serving you again!',
    approvalStatus: 'auto',
    bleu: 0.814,
    rouge: 0.779,
    semantic: 91.2,
    confidence: 97.1,
    time: '8 min ago',
  },
  {
    id: 'FB-4819',
    text: 'Payment failed three times but the money was deducted from my account each time. Need urgent resolution.',
    sentiment: 'negative',
    sentimentConf: 91.8,
    topic: 'Payment & Pricing',
    topicProb: 94.2,
    lang: 'EN',
    category: 'Home & Kitchen',
    keywords: ['payment', 'failed', 'deducted', 'urgent'],
    generatedResponse: 'We deeply apologize for this distressing payment issue. This should never happen and we take full responsibility. Our payments team has been immediately notified and will investigate each failed transaction. Any duplicate charges will be fully refunded within 3-5 business days. You will receive a confirmation email shortly with a case reference number.',
    approvalStatus: 'needs_review',
    bleu: 0.741,
    rouge: 0.712,
    semantic: 85.9,
    confidence: 91.8,
    time: '15 min ago',
  },
  {
    id: 'FB-4818',
    text: 'The return process was smooth and my refund was credited to my account promptly. Really impressed!',
    sentiment: 'positive',
    sentimentConf: 95.6,
    topic: 'Returns & Refunds',
    topicProb: 87.3,
    lang: 'EN',
    category: 'Books',
    keywords: ['return', 'refund', 'smooth', 'impressed'],
    generatedResponse: 'Thank you for sharing your positive experience with our returns process! We have worked hard to make returns as seamless as possible, and it is wonderful to hear it showed. We hope to continue exceeding your expectations in future purchases.',
    approvalStatus: 'auto',
    bleu: 0.823,
    rouge: 0.801,
    semantic: 92.7,
    confidence: 95.6,
    time: '23 min ago',
  },
  {
    id: 'FB-4817',
    text: 'The mobile app crashes every time I try to view order tracking. Very frustrating!',
    sentiment: 'negative',
    sentimentConf: 88.4,
    topic: 'App / Website UX',
    topicProb: 83.9,
    lang: 'EN',
    category: 'Electronics',
    keywords: ['app', 'crash', 'tracking', 'frustrating'],
    generatedResponse: 'We sincerely apologize for the technical issues you are experiencing with our mobile app. This is not the experience we want for our customers. Our engineering team has been notified and is working on a fix. In the meantime, you can track your order via our website. A fix will be deployed in the next app update.',
    approvalStatus: 'needs_review',
    bleu: 0.712,
    rouge: 0.689,
    semantic: 84.1,
    confidence: 88.4,
    time: '31 min ago',
  },
];

// ─── Evaluation Metrics ────────────────────────────────────────────────────────
export const modelComparison = {
  baseline: { accuracy: 71.2, precision: 68.4, recall: 70.1, f1: 69.2, bleu: 0.524, rouge: 0.498, semantic: 71.3 },
  proposed: { accuracy: 89.7, precision: 88.1, recall: 87.9, f1: 88.0, bleu: 0.743, rouge: 0.718, semantic: 89.2 },
};

export const confusionMatrix = {
  labels: ['Positive', 'Neutral', 'Negative'],
  data: [
    [521, 23, 14],
    [18, 312, 27],
    [11, 19, 408],
  ],
};

export const trainingCurves = [
  { epoch: 1,  trainLoss: 1.42, valLoss: 1.51 },
  { epoch: 2,  trainLoss: 1.18, valLoss: 1.24 },
  { epoch: 3,  trainLoss: 0.94, valLoss: 1.02 },
  { epoch: 4,  trainLoss: 0.78, valLoss: 0.86 },
  { epoch: 5,  trainLoss: 0.64, valLoss: 0.73 },
  { epoch: 6,  trainLoss: 0.53, valLoss: 0.61 },
  { epoch: 7,  trainLoss: 0.44, valLoss: 0.52 },
  { epoch: 8,  trainLoss: 0.37, valLoss: 0.45 },
  { epoch: 9,  trainLoss: 0.31, valLoss: 0.39 },
  { epoch: 10, trainLoss: 0.27, valLoss: 0.35 },
];

export const bleuProgression = [
  { version: 'v1.0', baseline: 0.524, proposed: 0.612 },
  { version: 'v1.1', baseline: 0.531, proposed: 0.648 },
  { version: 'v1.2', baseline: 0.538, proposed: 0.679 },
  { version: 'v2.0', baseline: 0.541, proposed: 0.702 },
  { version: 'v2.1', baseline: 0.544, proposed: 0.721 },
  { version: 'v2.2', baseline: 0.547, proposed: 0.743 },
];

// ─── Analytics ─────────────────────────────────────────────────────────────────
export const languageData = [
  { lang: 'English (EN)', count: 18240, pct: 73.8, color: '#22d3ee' },
  { lang: 'Sinhala (SI)', count: 4107,  pct: 16.6, color: '#34d399' },
  { lang: 'Tamil (TA)',   count: 2371,  pct: 9.6,  color: '#fbbf24' },
];

export const categoryTrends = [
  { category: 'Electronics',    complaints: 5420, resolved: 4810, pending: 610 },
  { category: 'Fashion',        complaints: 4230, resolved: 3920, pending: 310 },
  { category: 'Home & Kitchen', complaints: 3810, resolved: 3340, pending: 470 },
  { category: 'Books',          complaints: 2140, resolved: 2080, pending: 60  },
  { category: 'Beauty',         complaints: 1890, resolved: 1720, pending: 170 },
  { category: 'Sports',         complaints: 1240, resolved: 1190, pending: 50  },
];

export const responseTimeData = [
  { hour: '00:00', time: 1.2 }, { hour: '04:00', time: 0.9 }, { hour: '08:00', time: 2.8 },
  { hour: '12:00', time: 3.4 }, { hour: '16:00', time: 4.1 }, { hour: '20:00', time: 2.1 },
];
