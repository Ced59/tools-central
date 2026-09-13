import { describe, expect, it } from 'vitest';

import {
  AnalyzeRobotsTxtUseCase,
  DownloadRobotsTxtUseCase,
  GenerateRobotsTxtUseCase,
  type RobotsTxtDownloadPort,
  TestRobotsUrlUseCase,
} from './robots-txt.use-cases';

describe('robots.txt use cases', () => {
  it('keeps generation, parsing and simulation behind application boundaries', () => {
    const generated = new GenerateRobotsTxtUseCase().execute({
      siteUrl: 'https://example.com',
      userAgent: '*',
      allowPaths: ['/private/public/'],
      disallowPaths: ['/private/'],
      includeSitemap: true,
    });
    const document = new AnalyzeRobotsTxtUseCase().execute(generated.content);
    const decision = new TestRobotsUrlUseCase().execute(
      document,
      'https://example.com',
      'Googlebot',
      '/private/public/page',
    );

    expect(generated.siteValid).toBe(true);
    expect(document.issues).toEqual([]);
    expect(decision.allowed).toBe(true);
  });

  it('delegates a non-empty text download through its port', () => {
    const calls: Array<{ content: string; filename: string }> = [];
    const port: RobotsTxtDownloadPort = {
      download: (content, filename) => calls.push({ content, filename }),
    };
    const useCase = new DownloadRobotsTxtUseCase(port);

    useCase.execute('User-agent: *\n');
    useCase.execute('   ');

    expect(calls).toEqual([{ content: 'User-agent: *\n', filename: 'robots.txt' }]);
  });
});
