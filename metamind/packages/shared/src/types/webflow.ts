/**
 * Types representing Webflow entities (pages, collections, assets, etc.)
 * as returned by the Webflow Data API v2.
 */

export interface WebflowSite {
  id: string;
  displayName: string;
  shortName: string;
  previewUrl?: string;
  createdOn: string;
  lastPublished?: string;
}

export interface WebflowPage {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  parentId?: string;
  locale?: string;
  createdOn: string;
  lastUpdated: string;
  archived: boolean;
  draft: boolean;
  // SEO fields
  seo?: {
    title?: string;
    description?: string;
  };
  openGraph?: {
    title?: string;
    description?: string;
    imageUrl?: string;
  };
}

export interface WebflowCollection {
  id: string;
  displayName: string;
  singularName: string;
  slug: string;
  fields: WebflowField[];
  itemCount?: number;
}

export interface WebflowField {
  id: string;
  slug: string;
  displayName: string;
  type: WebflowFieldType;
  required: boolean;
  editable: boolean;
}

export type WebflowFieldType =
  | "PlainText"
  | "RichText"
  | "Image"
  | "MultiImage"
  | "Link"
  | "Email"
  | "Phone"
  | "Number"
  | "DateTime"
  | "Switch"
  | "Color"
  | "Option"
  | "File"
  | "Reference"
  | "MultiReference"
  | "User";

export interface WebflowCollectionItem {
  id: string;
  cmsLocaleId?: string;
  lastPublished?: string;
  lastUpdated: string;
  createdOn: string;
  isArchived: boolean;
  isDraft: boolean;
  fieldData: Record<string, any>;
}

export interface WebflowAsset {
  id: string;
  contentType: string;
  size: number;
  siteId: string;
  hostedUrl: string;
  fileName?: string;
  alt?: string;
  createdOn: string;
}

export interface WebflowMultiImageItem {
  fileId: string;
  url: string;
  alt?: string;
}
