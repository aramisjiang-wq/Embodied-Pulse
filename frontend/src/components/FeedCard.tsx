import { memo } from 'react';
import { Card, Button, Space, Tag } from 'antd';
import { PlayCircleOutlined, GithubOutlined, FileTextOutlined, ShareAltOutlined, StarOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { FeedItem } from '@/lib/api/types';
import { cleanText } from '@/lib/utils/htmlUtils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Image from 'next/image';

dayjs.extend(relativeTime);

const BilibiliLogo = ({ size = 32 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="#00A1D6">
    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" />
  </svg>
);

interface FeedCardProps {
  item: FeedItem;
  isFavorited?: boolean;
  onToggleFavorite?: (item: FeedItem) => void;
  onShare?: (item: FeedItem) => void;
  expandedItems?: Set<string>;
  onToggleExpand?: (itemId: string) => void;
}

function extractKeywords(text: string, maxKeywords: number = 4): string[] {
  if (!text) return [];
  
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'their', 'our', 'we', 'you', 'your', 'i', 'my', 'me', 'he', 'him', 'she', 'her', 'they', 'them', 'his', 'hers', 'ours', 'yours', 'theirs', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then', 'once', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'while', 'any', 'being', 'doing', 'having', 'make', 'made', 'take', 'get', 'got', 'getting', 'go', 'goes', 'went', 'gone', 'going', 'come', 'comes', 'came', 'coming', 'see', 'sees', 'saw', 'seen', 'seeing', 'know', 'knows', 'knew', 'known', 'knowing', 'think', 'thinks', 'thought', 'thinking', 'want', 'wants', 'wanted', 'wanting', 'use', 'uses', 'used', 'using', 'find', 'finds', 'found', 'finding', 'give', 'gives', 'gave', 'given', 'giving', 'tell', 'tells', 'told', 'telling', 'ask', 'asks', 'asked', 'asking', 'work', 'works', 'worked', 'working', 'seem', 'seems', 'seemed', 'seeming', 'feel', 'feels', 'felt', 'feeling', 'try', 'tries', 'tried', 'trying', 'leave', 'leaves', 'left', 'leaving', 'call', 'calls', 'called', 'calling', 'need', 'needs', 'needed', 'needing', 'become', 'becomes', 'became', 'becoming', 'put', 'puts', 'putting', 'mean', 'means', 'meant', 'meaning', 'keep', 'keeps', 'kept', 'keeping', 'let', 'lets', 'letting', 'begin', 'begins', 'began', 'begun', 'beginning', 'show', 'shows', 'showed', 'shown', 'showing', 'hear', 'hears', 'heard', 'hearing', 'play', 'plays', 'played', 'playing', 'run', 'runs', 'ran', 'running', 'move', 'moves', 'moved', 'moving', 'live', 'lives', 'lived', 'living', 'believe', 'believes', 'believed', 'believing', 'bring', 'brings', 'brought', 'bringing', 'happen', 'happens', 'happened', 'happening', 'write', 'writes', 'wrote', 'written', 'writing', 'provide', 'provides', 'provided', 'providing', 'sit', 'sits', 'sat', 'sitting', 'stand', 'stands', 'stood', 'standing', 'lose', 'loses', 'lost', 'losing', 'pay', 'pays', 'paid', 'paying', 'meet', 'meets', 'met', 'meeting', 'include', 'includes', 'included', 'including', 'continue', 'continues', 'continued', 'continuing', 'set', 'sets', 'set', 'setting', 'learn', 'learns', 'learned', 'learning', 'change', 'changes', 'changed', 'changing', 'lead', 'leads', 'led', 'leading', 'understand', 'understands', 'understood', 'understanding', 'watch', 'watches', 'watched', 'watching', 'follow', 'follows', 'followed', 'following', 'stop', 'stops', 'stopped', 'stopping', 'create', 'creates', 'created', 'creating', 'speak', 'speaks', 'spoke', 'spoken', 'speaking', 'read', 'reads', 'read', 'reading', 'allow', 'allows', 'allowed', 'allowing', 'add', 'adds', 'added', 'adding', 'spend', 'spends', 'spent', 'spending', 'grow', 'grows', 'grew', 'grown', 'growing', 'open', 'opens', 'opened', 'opening', 'walk', 'walks', 'walked', 'walking', 'win', 'wins', 'won', 'winning', 'offer', 'offers', 'offered', 'offering', 'remember', 'remembers', 'remembered', 'remembering', 'love', 'loves', 'loved', 'loving', 'consider', 'considers', 'considered', 'considering', 'appear', 'appears', 'appeared', 'appearing', 'buy', 'buys', 'bought', 'buying', 'wait', 'waits', 'waited', 'waiting', 'serve', 'serves', 'served', 'serving', 'die', 'dies', 'died', 'dying', 'send', 'sends', 'sent', 'sending', 'expect', 'expects', 'expected', 'expecting', 'build', 'builds', 'built', 'building', 'stay', 'stays', 'stayed', 'staying', 'fall', 'falls', 'fell', 'fallen', 'falling', 'cut', 'cuts', 'cut', 'cutting', 'reach', 'reaches', 'reached', 'reaching', 'kill', 'kills', 'killed', 'killing', 'remain', 'remains', 'remained', 'remaining', 'suggest', 'suggests', 'suggested', 'suggesting', 'raise', 'raises', 'raised', 'raising', 'pass', 'passes', 'passed', 'passing', 'sell', 'sells', 'sold', 'selling', 'require', 'requires', 'required', 'requiring', 'report', 'reports', 'reported', 'reporting', 'decide', 'decides', 'decided', 'deciding', 'pull', 'pulls', 'pulled', 'pulling'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));
  
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
  
  return sortedWords;
}

const FeedCard = memo(function FeedCard({ 
  item, 
  isFavorited, 
  onToggleFavorite, 
  onShare,
  expandedItems,
  onToggleExpand 
}: FeedCardProps) {
  const itemId = `${item.type}-${item.id}`;
  const isExpanded = expandedItems?.has(itemId) || false;
  
  const getDateString = (date: any): string | null => {
    if (!date) return null;
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'string') return date;
    return null;
  };
  
  const getExternalUrl = (): string => {
    const data = item.data as any;
    if (item.type === 'paper' && data.arxivId) {
      return `https://arxiv.org/abs/${data.arxivId}`;
    }
    if (item.type === 'paper' && data.pdfUrl) {
      return data.pdfUrl;
    }
    if (item.type === 'repo' && data.htmlUrl) {
      return data.htmlUrl;
    }
    if (item.type === 'repo' && data.fullName) {
      return `https://github.com/${data.fullName}`;
    }
    if (item.type === 'video' && data.platform === 'bilibili' && data.videoId) {
      return `https://www.bilibili.com/video/${data.videoId}`;
    }
    if (item.type === 'video' && data.platform === 'youtube' && data.videoId) {
      return `https://www.youtube.com/watch?v=${data.videoId}`;
    }
    if (item.type === 'huggingface' && data.fullName) {
      const contentType = data.contentType || 'model';
      if (contentType === 'dataset') {
        return `https://huggingface.co/datasets/${data.fullName}`;
      } else if (contentType === 'space') {
        return `https://huggingface.co/spaces/${data.fullName}`;
      }
      return `https://huggingface.co/${data.fullName}`;
    }
    if (item.type === 'huggingface' && data.hfId) {
      return `https://huggingface.co/${data.hfId}`;
    }
    if (item.type === 'job' && data.applyUrl) {
      return data.applyUrl;
    }
    return '#';
  };
  
  const data = item.data as any;
  const title = data.title || data.fullName || data.name || '无标题';
  const description = data.description || data.abstract || '';
  const externalUrl = getExternalUrl();
  
  return (
    <Card
      key={itemId}
      hoverable
      style={{
        borderRadius: 12,
        border: '1px solid #f0f0f0',
        transition: 'all 0.3s',
        minHeight: 180,
        contain: 'layout paint',
      }}
      bodyStyle={{ padding: 16 }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ 
          fontSize: 32,
          lineHeight: 1,
          flexShrink: 0,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: item.type === 'paper' ? '#1890ff' : 
               item.type === 'video' ? '#00a1d6' :
               item.type === 'repo' ? '#722ed1' :
               item.type === 'huggingface' ? '#13c2c2' :
               item.type === 'job' ? '#fa8c16' : '#8c8c8c',
        }}>
          {item.type === 'paper' ? '📄' :
           item.type === 'video' ? <BilibiliLogo size={32} /> :
           item.type === 'repo' ? <GithubOutlined style={{ fontSize: 32, color: '#1890ff' }} /> :
           item.type === 'huggingface' ? (
             <Image 
               src="/huggingface-icon.svg" 
               alt="HuggingFace" 
               width={32} 
               height={32}
               unoptimized
             />
           ) :
           item.type === 'job' ? '💼' :
           item.type === 'news' ? '📰' : '📌'}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <a href={externalUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
                color: '#262626',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: item.type === 'paper' ? 3 : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
              }}>
                {cleanText(title)}
              </h3>
              {item.type === 'paper' && onToggleExpand && (
                <Button
                  type="text"
                  size="small"
                  icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleExpand(itemId);
                  }}
                  style={{ padding: 0, height: 'auto', minWidth: 'auto' }}
                />
              )}
            </div>
          </a>
          
          {isExpanded && description && (
            <p style={{
              fontSize: 14,
              color: '#595959',
              margin: '0 0 12px 0',
              lineHeight: 1.6,
            }}>
              {cleanText(description)}
            </p>
          )}
          
          {item.type === 'paper' && (
            <Space size={[4, 4]} wrap style={{ marginBottom: 8 }}>
              {extractKeywords(cleanText(title + ' ' + description), 4).map((keyword, index) => (
                <Tag key={index} color="blue" style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>
                  {keyword}
                </Tag>
              ))}
            </Space>
          )}
          
          <Space size="middle" wrap style={{ fontSize: 13, color: '#8c8c8c' }}>
            {item.type === 'paper' && (
              <>
                {data.citationCount !== undefined && data.citationCount > 0 && (
                  <span>📚 {data.citationCount} 引用</span>
                )}
                {data.publishedDate && <span>📅 {dayjs(data.publishedDate).format('YYYY-MM-DD')}</span>}
              </>
            )}
            {item.type === 'video' && (
              <>
                {data.uploader && <span>👤 {data.uploader}</span>}
                {data.playCount !== undefined && <span>👁️ {data.playCount.toLocaleString()}</span>}
                {data.duration && <span>⏱️ {Math.floor(data.duration / 60)}:{(data.duration % 60).toString().padStart(2, '0')}</span>}
                {data.publishedDate && <span>📅 {dayjs(data.publishedDate).format('YYYY-MM-DD')}</span>}
              </>
            )}
            {item.type === 'repo' && (
              <>
                {data.starsCount !== undefined && <span>⭐ {data.starsCount.toLocaleString()}</span>}
                {data.language && <span>💻 {data.language}</span>}
              </>
            )}
            {item.type === 'huggingface' && (
              <>
                {data.downloads !== undefined && <span>⬇️ {data.downloads.toLocaleString()}</span>}
                {data.task && <Tag color="purple">{data.task}</Tag>}
              </>
            )}
            {item.type === 'job' && (
              <>
                {data.company && <span>🏢 {data.company}</span>}
                {data.location && <span>📍 {data.location}</span>}
                {data.salaryMin && data.salaryMax && (
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                    💰 {data.salaryMin}-{data.salaryMax}K
                  </span>
                )}
              </>
            )}
          </Space>
        </div>
        
        <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>
          <Button
            size="small"
            type="text"
            icon={isFavorited ? <StarOutlined style={{ color: '#fadb14' }} /> : <StarOutlined />}
            onClick={() => onToggleFavorite?.(item)}
          />
          <Button
            size="small"
            type="text"
            icon={<ShareAltOutlined />}
            onClick={() => onShare?.(item)}
          />
        </div>
      </div>
    </Card>
  );
});

export default FeedCard;
