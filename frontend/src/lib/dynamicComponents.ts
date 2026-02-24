import dynamic from 'next/dynamic';

export const DynamicComponents = {
  ShareModal: dynamic(() => import('@/components/ShareModal'), {
    loading: () => null,
    ssr: false
  }),
  
  DiscoveryModule: dynamic(() => import('@/components/DiscoveryModule'), {
    loading: () => null,
    ssr: false
  }),
  
  SubscriptionModule: dynamic(() => import('@/components/SubscriptionModule'), {
    loading: () => null,
    ssr: false
  }),
  
  PDFViewer: dynamic(() => import('@/components/PDFViewer'), {
    loading: () => null,
    ssr: false
  }),
  
  // VideoPlayer: dynamic(() => import('@/components/VideoPlayer'), {
  //   loading: () => null,
  //   ssr: false
  // }),
  
  RepoCard: dynamic(() => import('@/components/RepoCard'), {
    loading: () => null,
    ssr: false
  }),
  
  // PaperCard: dynamic(() => import('@/components/PaperCard'), {
  //   loading: () => null,
  //   ssr: true
  // }),
  
  // VideoCard: dynamic(() => import('@/components/VideoCard'), {
  //   loading: () => null,
  //   ssr: true
  // }),
};

export default DynamicComponents;
