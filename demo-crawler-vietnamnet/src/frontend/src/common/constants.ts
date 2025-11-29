
import { Article } from './types';

export const NAV_LINKS = ['US', 'World', 'Politics', 'Business', 'Opinion', 'Health', 'Entertainment', 'Travel', 'Sports'];

export const TICKER_NEWS = [
  "Ukrainian troops saw Russian soldiers swept away",
  "Philadelphia under 'code red' alert as millions from US East Coast",
  "Turkish lira crashes as inflation bites",
];

export const HERO_ARTICLE: Article = {
  id: 'hero-1',
  source: 'BBC News',
  sourceLogoUrl: 'https://i.imgur.com/RPw3w0Y.png',
  timestamp: '10 mins ago',
  headline: 'People spend night on roofs and in trees after Ukraine dam breach',
  summary: 'Hundreds of thousands of people have been left without access to normal drinking water since the breach of the Kakhovka dam, Ukraine\'s President Volodymyr Zelensky has said.',
  imageUrl: 'https://picsum.photos/1200/800?random=1',
  category: 'World',
  readTime: '5 min read',
  author: { name: 'John Doe', avatarUrl: 'https://picsum.photos/50/50?random=1', publication: 'BBC' }
};

export const SIDEBAR_ARTICLES: Omit<Article, 'summary' | 'author'>[] = [
  {
    id: 'side-1',
    source: 'CNN News',
    sourceLogoUrl: 'https://i.imgur.com/G49y2aG.png',
    timestamp: '1 hours ago',
    headline: 'CNN Chairman and CEO Chris Licht is out',
    imageUrl: 'https://picsum.photos/200/200?random=2',
    category: 'Business',
    readTime: '2 min read',
  },
  {
    id: 'side-2',
    source: 'BBC News',
    sourceLogoUrl: 'https://i.imgur.com/RPw3w0Y.png',
    timestamp: '1 hours ago',
    headline: 'What Turkey\'s new cabinet says about where country is headed',
    imageUrl: 'https://picsum.photos/200/200?random=3',
    category: 'World',
    readTime: '5 min read',
  },
  {
    id: 'side-3',
    source: 'BBC News',
    sourceLogoUrl: 'https://i.imgur.com/RPw3w0Y.png',
    timestamp: '2 hours ago',
    headline: 'This country has the best wines in the world for 2023',
    imageUrl: 'https://picsum.photos/200/200?random=4',
    category: 'Food & Drink',
    readTime: '3 min read',
  },
  {
    id: 'side-4',
    source: 'CNN News',
    sourceLogoUrl: 'https://i.imgur.com/G49y2aG.png',
    timestamp: '1 hours ago',
    headline: 'The double-decker airplane seat is back. Here\'s what it looks like now',
    imageUrl: 'https://picsum.photos/200/200?random=5',
    category: 'World',
    readTime: '2 min read',
  }
];

export const LATEST_NEWS: Article[] = [
  {
    id: 'latest-1',
    source: 'Formula 1',
    sourceLogoUrl: 'https://i.imgur.com/mEX34Z0.png',
    timestamp: '10 hours ago',
    headline: 'F1 teams had big upgrades planned for Imola – but what happens now?',
    summary: 'One of the many disruptions the Emilia Romagna Grand Prix not going ahead has caused is that of the teams\' development programmes, with several squads having planned to bring big...',
    imageUrl: 'https://picsum.photos/600/400?random=6',
    category: 'Sport',
    readTime: '1 min read'
  },
  {
    id: 'latest-2',
    source: 'BBC News',
    sourceLogoUrl: 'https://i.imgur.com/RPw3w0Y.png',
    timestamp: '10 hours ago',
    headline: 'Ukraine war: Wagner boss rubbishes Russian claims of Ukrainian casualties',
    summary: 'Speaking to state media, Russian Defence Minister Sergei Shoigu insisted that his forces had inflicted over 3,715 casualties on Ukraine during the attack and destroyed dozens...',
    imageUrl: 'https://picsum.photos/600/400?random=7',
    category: 'War',
    readTime: '1 min read'
  },
  {
    id: 'latest-3',
    source: 'CNN News',
    sourceLogoUrl: 'https://i.imgur.com/G49y2aG.png',
    timestamp: '10 hours ago',
    headline: 'Brutal killings of two young girls show one of India\'s biggest problems is getting worse',
    summary: 'An even younger girl suffered a similar fate, allegedly at the hands of her own father because she and her mother wanted to sleep on the patio...',
    imageUrl: 'https://picsum.photos/600/400?random=8',
    category: 'World',
    readTime: '1 min read'
  },
];

export const SPOTLIGHT_ARTICLES: Omit<Article, 'summary'>[] = [
  {
    id: 'spot-1',
    source: 'BBC News',
    sourceLogoUrl: 'https://i.imgur.com/RPw3w0Y.png',
    timestamp: '10 hours ago',
    headline: 'Have legal immigration might solve two of America\'s toughest problems',
    imageUrl: 'https://picsum.photos/300/200?random=9',
    category: 'Politics',
    readTime: '1 min read'
  },
  {
    id: 'spot-2',
    source: 'BBC News',
    sourceLogoUrl: 'https://i.imgur.com/RPw3w0Y.png',
    timestamp: '10 hours ago',
    headline: 'North Korea hackers suspected in new $35 million crypto heist',
    imageUrl: 'https://picsum.photos/300/200?random=10',
    category: 'Business',
    readTime: '1 min read'
  },
   {
    id: 'spot-3',
    source: 'BBC News',
    sourceLogoUrl: 'https://i.imgur.com/RPw3w0Y.png',
    timestamp: '10 hours ago',
    headline: 'They paid we were getting a recession. Instead, we\'re getting close to a bull market',
    imageUrl: 'https://picsum.photos/300/200?random=11',
    category: 'War',
    readTime: '1 min read'
  },
];


export const TRENDING_ARTICLES: Article[] = [
    {
      id: 'trend-1',
      source: 'BBC News',
      sourceLogoUrl: 'https://i.imgur.com/RPw3w0Y.png',
      timestamp: '5 hours ago',
      headline: 'Stella explains what "instrumental" Rob Marshall will bring to McLaren in 2024',
      imageUrl: 'https://picsum.photos/300/200?random=12',
      category: 'Sport',
      readTime: '5 min read',
      author: { name: 'Oliver Grey', avatarUrl: 'https://picsum.photos/50/50?random=12', publication: 'Sports Illustrated' }
    },
    {
      id: 'trend-2',
      source: 'Reuters',
      sourceLogoUrl: 'https://i.imgur.com/mEX34Z0.png',
      timestamp: '2 hours ago',
      headline: 'Pope Francis undergoes abdominal surgery in latest health concern',
      imageUrl: 'https://picsum.photos/300/200?random=13',
      category: 'World',
      readTime: '3 min read',
      author: { name: 'Rey Creig', avatarUrl: 'https://picsum.photos/50/50?random=13', publication: 'Reuters' }
    },
    {
      id: 'trend-3',
      source: 'AP',
      sourceLogoUrl: 'https://i.imgur.com/mEX34Z0.png',
      timestamp: '5 hours ago',
      headline: 'Fact check: Trump boasts about a massive oil purchase that never happened',
      imageUrl: 'https://picsum.photos/300/200?random=14',
      category: 'Politics',
      readTime: '5 min read',
      author: { name: 'Reine Warner', avatarUrl: 'https://picsum.photos/50/50?random=14', publication: 'Associated Press' }
    },
];

export const BUSINESS_ARTICLES: Article[] = [
  {
    id: 'business-1',
    source: 'Bloomberg',
    sourceLogoUrl: 'https://i.imgur.com/RPw3w0Y.png', // using bbc as placeholder
    timestamp: '2 hours ago',
    headline: 'Global markets react to new inflation data from the US Federal Reserve',
    summary: 'Investors are closely watching the latest Consumer Price Index (CPI) figures, which could signal the Fed\'s next move on interest rates. The tech sector saw a slight dip, while energy stocks rallied.',
    imageUrl: 'https://picsum.photos/800/600?random=15',
    category: 'Markets',
    readTime: '4 min read'
  },
  {
    id: 'business-2',
    source: 'The Wall Street Journal',
    sourceLogoUrl: 'https://i.imgur.com/G49y2aG.png', // using cnn as placeholder
    timestamp: '3 hours ago',
    headline: 'Startup aiming to revolutionize battery tech secures $100M in Series B funding',
    imageUrl: '', // not needed for side article
    category: 'Technology',
    readTime: '2 min read'
  },
  {
    id: 'business-3',
    source: 'Financial Times',
    sourceLogoUrl: 'https://i.imgur.com/mEX34Z0.png', // using f1 as placeholder
    timestamp: '5 hours ago',
    headline: 'The future of remote work: A hybrid model seems inevitable for most corporations',
    imageUrl: '',
    category: 'Work',
    readTime: '6 min read'
  },
  {
    id: 'business-4',
    source: 'Reuters',
    sourceLogoUrl: 'https://i.imgur.com/mEX34Z0.png',
    timestamp: '8 hours ago',
    headline: 'Supply chain disruptions continue to affect the global automotive industry',
    imageUrl: '',
    category: 'Industry',
    readTime: '3 min read'
  },
];

export const SPORTS_ARTICLES: Article[] = [
  {
    id: 'sports-1',
    source: 'ESPN',
    sourceLogoUrl: 'https://i.imgur.com/RPw3w0Y.png',
    timestamp: '30 mins ago',
    headline: 'Lakers clinch playoff spot in a nail-biting finish against the Warriors',
    summary: '',
    imageUrl: 'https://picsum.photos/600/800?random=16',
    category: 'Basketball',
    readTime: '3 min read'
  },
  {
    id: 'sports-2',
    source: 'Sky Sports',
    sourceLogoUrl: 'https://i.imgur.com/G49y2aG.png',
    timestamp: '1 hour ago',
    headline: 'Manchester United makes a stunning comeback to win the FA Cup final',
    summary: '',
    imageUrl: 'https://picsum.photos/600/800?random=17',
    category: 'Football',
    readTime: '5 min read'
  },
  {
    id: 'sports-3',
    source: 'Formula 1',
    sourceLogoUrl: 'https://i.imgur.com/mEX34Z0.png',
    timestamp: '4 hours ago',
    headline: 'Verstappen dominates at the Monaco Grand Prix, extending his championship lead',
    summary: '',
    imageUrl: 'https://picsum.photos/600/800?random=18',
    category: 'Motorsport',
    readTime: '4 min read'
  },
  {
    id: 'sports-4',
    source: 'The Athletic',
    sourceLogoUrl: 'https://i.imgur.com/RPw3w0Y.png',
    timestamp: '6 hours ago',
    headline: 'Inside the trade that shook up the NFL draft: How the Panthers landed their QB',
    summary: '',
    imageUrl: 'https://picsum.photos/600/800?random=19',
    category: 'NFL',
    readTime: '7 min read'
  },
];

export const ENTERTAINMENT_ARTICLES: Article[] = [
  {
    id: 'ent-1',
    source: 'Variety',
    sourceLogoUrl: 'https://i.imgur.com/G49y2aG.png',
    timestamp: '1 hour ago',
    headline: 'New sci-fi epic "Galaxy\'s Edge" shatters box office records on opening weekend',
    summary: 'The highly anticipated film from director Ava Chen has grossed over $200 million domestically, proving that audiences are eager for original, high-concept blockbusters.',
    imageUrl: 'https://picsum.photos/800/600?random=20',
    category: 'Movies',
    readTime: '3 min read'
  },
  {
    id: 'ent-2',
    source: 'The Hollywood Reporter',
    sourceLogoUrl: 'https://i.imgur.com/RPw3w0Y.png',
    timestamp: '3 hours ago',
    headline: 'Pop superstar Nova announces surprise album drop, coming this Friday',
    summary: '',
    imageUrl: 'https://picsum.photos/600/400?random=21',
    category: 'Music',
    readTime: '2 min read'
  },
  {
    id: 'ent-3',
    source: 'Pitchfork',
    sourceLogoUrl: 'https://i.imgur.com/mEX34Z0.png',
    timestamp: '8 hours ago',
    headline: 'Review: Indie band "The Wandering Echoes" deliver a masterpiece with their new LP',
    summary: '',
    imageUrl: 'https://picsum.photos/600/400?random=22',
    category: 'Music',
    readTime: '5 min read'
  },
];

export const ALL_ARTICLES: Article[] = [
  HERO_ARTICLE,
  ...(SIDEBAR_ARTICLES as unknown as Article[]),
  ...LATEST_NEWS,
  ...(SPOTLIGHT_ARTICLES as unknown as Article[]),
  ...TRENDING_ARTICLES,
  ...BUSINESS_ARTICLES,
  ...SPORTS_ARTICLES,
  ...ENTERTAINMENT_ARTICLES,
];
