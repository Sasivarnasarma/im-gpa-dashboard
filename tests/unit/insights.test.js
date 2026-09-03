import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactGA from 'react-ga4';
import Clarity from '@microsoft/clarity';
import {
  initAnalytics,
  tagPathway,
  trackEvent,
  _resetAnalyticsState,
} from '../../src/lib/insights';

vi.mock('react-ga4', () => ({
  default: {
    initialize: vi.fn(),
    send: vi.fn(),
    event: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@microsoft/clarity', () => ({
  default: {
    init: vi.fn(),
    setTag: vi.fn(),
    event: vi.fn(),
  },
}));

describe('Unified Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetAnalyticsState();
  });

  it('does not initialize providers when IDs are absent', () => {
    const result = initAnalytics({ force: true, gaId: '', clarityId: '' });
    expect(result.ga).toBe(false);
    expect(result.clarity).toBe(false);
    expect(ReactGA.initialize).not.toHaveBeenCalled();
    expect(Clarity.init).not.toHaveBeenCalled();
  });

  it('initializes GA4 and sends pageview when gaId is provided with force: true', () => {
    const result = initAnalytics({ force: true, gaId: 'G-TESTID1234' });
    expect(result.ga).toBe(true);
    expect(ReactGA.initialize).toHaveBeenCalledWith('G-TESTID1234');
    expect(ReactGA.send).toHaveBeenCalledWith(expect.objectContaining({ hitType: 'pageview' }));
  });

  it('initializes Clarity when clarityId is provided with force: true', () => {
    const result = initAnalytics({ force: true, clarityId: 'clarity-test-id' });
    expect(result.clarity).toBe(true);
    expect(Clarity.init).toHaveBeenCalledWith('clarity-test-id');
  });

  it('does not throw when tagging or tracking before initialization', () => {
    expect(() => tagPathway('mit', 'bse')).not.toThrow();
    expect(() => trackEvent('target_gpa_changed')).not.toThrow();
    expect(Clarity.setTag).not.toHaveBeenCalled();
    expect(ReactGA.event).not.toHaveBeenCalled();
  });

  it('safely tags pathway and specialization across providers', () => {
    initAnalytics({ force: true, gaId: 'G-TEST', clarityId: 'clarity-test' });
    tagPathway('mit', 'bse');
    expect(Clarity.setTag).toHaveBeenCalledWith('pathway', 'mit');
    expect(Clarity.setTag).toHaveBeenCalledWith('specialization', 'bse');
    expect(ReactGA.set).toHaveBeenCalledWith({ pathway: 'mit', specialization: 'bse' });
  });

  it('safely dispatches events to both GA4 and Clarity', () => {
    initAnalytics({ force: true, gaId: 'G-TEST', clarityId: 'clarity-test' });
    trackEvent('target_gpa_changed', { goal: '3.80' });
    expect(Clarity.event).toHaveBeenCalledWith('target_gpa_changed');
    expect(ReactGA.event).toHaveBeenCalledWith('target_gpa_changed', { goal: '3.80' });
  });
});
