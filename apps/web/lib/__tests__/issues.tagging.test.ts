import { deriveAutoTags, getAutoTagConfig, clearAutoTagCache } from '@/lib/issues/tagging';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    setting: {
      findUnique: jest.fn(),
    },
  },
}));

const mockSettingFindUnique = prisma.setting.findUnique as unknown as jest.Mock;

describe('issues/tagging', () => {
  beforeEach(() => {
    clearAutoTagCache();
    mockSettingFindUnique.mockReset();
  });

  it('loads config from settings and applies matching rule', async () => {
    mockSettingFindUnique.mockResolvedValue({
      key: 'issues.rules',
      value: {
        version: 1,
        defaultModule: 'General',
        defaultPriority: 'medium',
        rules: [
          {
            pattern: '^apps/web/app/api/',
            module: 'API',
            labels: ['enhancement'],
            priority: 'high',
          },
        ],
      },
    });

    await getAutoTagConfig(true);
    const result = await deriveAutoTags([
      {
        filePath: 'apps/web/app/api/issues/route.ts',
      },
    ]);

    expect(result).toEqual({
      module: 'API',
      priority: 'high',
      labels: ['enhancement'],
    });
  });

  it('returns defaults when no rules match', async () => {
    mockSettingFindUnique.mockResolvedValue({
      key: 'issues.rules',
      value: {
        version: 1,
        defaultModule: 'General',
        defaultPriority: 'low',
        rules: [],
      },
    });

    const result = await deriveAutoTags([{ filePath: 'src/random/file.ts' }]);
    expect(result.module).toBe('General');
    expect(result.priority).toBe('low');
    expect(result.labels).toHaveLength(0);
  });

  it('handles invalid regex safely', async () => {
    mockSettingFindUnique.mockResolvedValue({
      key: 'issues.rules',
      value: { version: 1, rules: [{ pattern: '[invalid' }] },
    });

    const result = await deriveAutoTags([{ filePath: 'apps/web/app/api/issues/route.ts' }]);
    expect(result.labels).toEqual([]);
  });
});
