/**
 * Contrato TypeScript fortemente tipado para a configuração centralizada da marca
 * e das verticais de negócio da André Studio.
 */

export interface BrandLinks {
  readonly home: string;
  readonly auditorHome: string;
  readonly auditorPage: string;
  readonly tools: string;
  readonly kits: string;
  readonly services: string;
  readonly web: string;
  readonly automation: string;
  readonly video: string;
  readonly briefing: string;
  readonly privacy: string;
}

export interface PortfolioReference {
  readonly name: string;
  readonly url: string;
  readonly kind: string;
}

export interface BusinessVertical {
  readonly id: 'educacao-ia' | 'engenharia-ia';
  readonly index: string;
  readonly title: string;
  readonly summary: string;
  readonly outcomes: readonly string[];
  readonly ctaLabel: string;
  readonly ctaHref: string;
}

export interface BrandConfig {
  readonly brandName: string;
  readonly siteName: string;
  readonly siteUrl: string;
  readonly founder: string;
  readonly roleLabel: string;
  readonly location: string;
  readonly coverage: string;
  readonly whatsappNumber: string;
  readonly whatsappFormatted: string;
  readonly whatsappUrl: string;
  readonly email: string;
  readonly githubUrl: string;
  readonly linkedinUrl: string;
  readonly links: BrandLinks;
  readonly portfolio: readonly PortfolioReference[];
  readonly verticals: readonly BusinessVertical[];
}

import {
  BRAND_CONFIG as RUNTIME_BRAND_CONFIG,
  extractBrPhoneDigits as runtimeExtractBrPhoneDigits,
  formatPhoneMaskBr as runtimeFormatPhoneMaskBr,
  buildWhatsappLink as runtimeBuildWhatsappLink
} from './brandConfig.mjs';

export const BRAND_CONFIG: BrandConfig = RUNTIME_BRAND_CONFIG as BrandConfig;

export function extractBrPhoneDigits(value: unknown): string {
  return runtimeExtractBrPhoneDigits(value);
}

export function formatPhoneMaskBr(value: unknown): string {
  return runtimeFormatPhoneMaskBr(value);
}

export function buildWhatsappLink(message: string, phone?: string): string {
  return runtimeBuildWhatsappLink(message, phone);
}
