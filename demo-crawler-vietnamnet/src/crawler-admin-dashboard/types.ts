
export enum CrawlerStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  PAUSED = 'Paused',
}

export interface CrawlerConfig {
  domain: string;
  path: string;
  category: string;
  linkSelector: string;
  titleSelector: string;
  descriptionSelector: string;
  contentSelector: string;
  removalSelector: string;
  status: CrawlerStatus;
}

export interface ArticleSource {
    id: string;
    name: string; // usually the domain or site name
    url: string; // Base URL
    categoryId: string;
    linkSelector: string;
    titleSelector: string;
    descriptionSelector: string;
    contentSelector: string;
    removalSelector: string;
    imageSelector: string;
    enabled: boolean;
}
