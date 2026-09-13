import {
  analyzeSerpSnippet,
  type SerpSnippetAnalysis,
  type SerpSnippetInput,
} from '../domain/serp-snippet';

export type {
  SerpDevice,
  SerpLengthStatus,
  SerpRecommendation,
} from '../domain/serp-snippet';

export class AnalyzeSerpSnippetUseCase {
  execute(input: SerpSnippetInput): SerpSnippetAnalysis {
    return analyzeSerpSnippet(input);
  }
}
