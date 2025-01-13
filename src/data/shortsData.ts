export interface Short {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  views: string;
  likes: string;
  author: string;
}

export const shorts: Short[] = [
  {
    id: 1,
    title: "Transform Your Morning Routine",
    description: "Start your day with these powerful habits",
    videoUrl: 'https://v.ftcdn.net/11/00/82/92/700_F_1100829207_pSQZlNSVJc1dDpagxg5UbabDmffdGhNm_ST.mp4',
    thumbnail: 'https://plus.unsplash.com/premium_photo-1671599016130-7882dbff302f?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    views: "10K",
    likes: "1.2K",
    author: "Mindfulness Coach"
  },
  {
    id: 2,
    title: "5 Minutes of Mindfulness",
    description: "Quick meditation guide",
    videoUrl: 'https://v.ftcdn.net/11/00/82/92/700_F_1100829207_pSQZlNSVJc1dDpagxg5UbabDmffdGhNm_ST.mp4',
    thumbnail: 'https://plus.unsplash.com/premium_photo-1671599016130-7882dbff302f?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    views: "15K",
    likes: "2.3K",
    author: "Meditation Guide"
  }
]; 