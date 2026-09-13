import {
  evaluateRobotsAccess,
  generateRobotsTxt,
  parseRobotsTxt,
  type RobotsAccessDecision,
  type RobotsBuilderSettings,
  type RobotsDocument,
  type RobotsGeneration,
} from '../domain/robots-txt';

export type {
  RobotsAccessDecision,
  RobotsBuilderSettings,
  RobotsDecisionReason,
  RobotsDocument,
  RobotsGeneration,
  RobotsIssue,
  RobotsIssueCode,
  RobotsIssueSeverity,
} from '../domain/robots-txt';

export class AnalyzeRobotsTxtUseCase {
  execute(source: string): RobotsDocument {
    return parseRobotsTxt(source);
  }
}

export class GenerateRobotsTxtUseCase {
  execute(settings: RobotsBuilderSettings): RobotsGeneration {
    return generateRobotsTxt(settings);
  }
}

export class TestRobotsUrlUseCase {
  execute(
    document: RobotsDocument,
    siteUrl: string,
    userAgent: string,
    targetUrl: string,
  ): RobotsAccessDecision {
    return evaluateRobotsAccess(document, siteUrl, userAgent, targetUrl);
  }
}

export interface RobotsTxtDownloadPort {
  download(content: string, filename: string): void;
}

export class DownloadRobotsTxtUseCase {
  constructor(private readonly downloadPort: RobotsTxtDownloadPort) {}

  execute(content: string): void {
    if (!content.trim()) return;
    this.downloadPort.download(content, 'robots.txt');
  }
}
