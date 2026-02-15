import { debounce, type DebouncedFunc } from 'lodash';

export interface SearchHistoryItem {
  keyword: string;
  timestamp: number;
}

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_SIZE = 10;

export const searchUtils = {
  debounce: <Args extends unknown[]>(
    fn: (...args: Args) => void,
    delay: number = 300
  ): DebouncedFunc<(...args: Args) => void> => debounce(fn, delay),

  getSearchHistory: (): SearchHistoryItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  },

  addSearchHistory: (keyword: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const history = searchUtils.getSearchHistory();
      const filteredHistory = history.filter(item => item.keyword !== keyword);
      const newHistory = [
        { keyword, timestamp: Date.now() },
        ...filteredHistory
      ].slice(0, MAX_HISTORY_SIZE);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  },

  clearSearchHistory: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  },

  highlightText: (text: string, keyword: string): string => {
    if (!keyword || !text) return text;
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #fffb8f; padding: 0 2px; border-radius: 2px;">$1</mark>');
  },

  generateSuggestions: async (keyword: string, history: SearchHistoryItem[]): Promise<string[]> => {
    if (keyword.length < 2) return [];
    
    const historySuggestions = history
      .filter(item => item.keyword.toLowerCase().includes(keyword.toLowerCase()))
      .map(item => item.keyword)
      .slice(0, 5);
    
    const popularKeywords = [
      'embodied AI',
      'robotics',
      'reinforcement learning',
      'computer vision',
      'SLAM',
      'navigation',
      'manipulation',
      'grasping',
      'motion planning',
      'deep learning'
    ];
    
    const popularSuggestions = popularKeywords
      .filter(kw => kw.toLowerCase().includes(keyword.toLowerCase()))
      .slice(0, 5);
    
    const combined = [...new Set([...historySuggestions, ...popularSuggestions])];
    return combined.slice(0, 8);
  }
};
