'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  ThumbsUp, 
  Reply, 
  Eye, 
  Pin, 
  Lock, 
  TrendingUp,
  Clock,
  Search,
  Filter,
  Plus,
  Star,
  Award,
  Users,
  MessageCircle,
  Calendar,
  Hash,
  Send
} from 'lucide-react';
import { driverSupportService, ForumPost, ForumReply } from '@/services/driverSupportService';
import { useToast } from '@/hooks/use-toast';

interface DriverCommunityForumProps {
  driverId: string;
  driverName: string;
  driverAvatar?: string;
}

export function DriverCommunityForum({ driverId, driverName, driverAvatar }: DriverCommunityForumProps) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // New post form state
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({
    category: 'general',
    title: '',
    content: '',
    tags: ''
  });

  // Reply form state
  const [newReply, setNewReply] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Posts', icon: MessageSquare },
    { id: 'general', name: 'General Discussion', icon: MessageCircle },
    { id: 'tips', name: 'Tips & Tricks', icon: Star },
    { id: 'earnings', name: 'Earnings', icon: TrendingUp },
    { id: 'technical', name: 'Technical Help', icon: Award },
    { id: 'announcements', name: 'Announcements', icon: Pin }
  ];

  useEffect(() => {
    loadPosts();
  }, [activeCategory]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const postsData = await driverSupportService.getForumPosts(
        activeCategory === 'all' ? undefined : activeCategory
      );
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading forum posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load forum posts. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async (postId: string) => {
    try {
      const repliesData = await driverSupportService.getForumReplies(postId);
      setReplies(repliesData);
    } catch (error) {
      console.error('Error loading replies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load replies. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) {
      toast({
        title: 'Error',
        description: 'Please fill in title and content.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await driverSupportService.createForumPost({
        authorId: driverId,
        authorName: driverName,
        authorAvatar: driverAvatar,
        category: newPost.category as any,
        title: newPost.title,
        content: newPost.content,
        tags: newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isPinned: false,
        isLocked: false
      });

      setNewPost({ category: 'general', title: '', content: '', tags: '' });
      setShowNewPostForm(false);
      await loadPosts();
      
      toast({
        title: 'Success',
        description: 'Forum post created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create forum post. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleCreateReply = async () => {
    if (!newReply.trim() || !selectedPost) return;

    try {
      await driverSupportService.createForumReply({
        postId: selectedPost.id,
        authorId: driverId,
        authorName: driverName,
        authorAvatar: driverAvatar,
        content: newReply.trim(),
        parentReplyId: replyingTo
      });

      setNewReply('');
      setReplyingTo(null);
      await loadReplies(selectedPost.id);
      
      toast({
        title: 'Success',
        description: 'Reply posted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post reply. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSelectPost = async (post: ForumPost) => {
    setSelectedPost(post);
    await loadReplies(post.id);
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : MessageSquare;
  };

  const formatTimeAgo = (timestamp: any) => {
    const now = new Date();
    const date = timestamp.toDate();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Community</h1>
          <p className="text-gray-600">Connect, share experiences, and learn from fellow drivers</p>
        </div>
        <Button onClick={() => setShowNewPostForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold">{posts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Members</p>
                <p className="text-2xl font-bold">{new Set(posts.map(p => p.authorId)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Reply className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Replies</p>
                <p className="text-2xl font-bold">{posts.reduce((sum, post) => sum + post.replies, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ThumbsUp className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Total Likes</p>
                <p className="text-2xl font-bold">{posts.reduce((sum, post) => sum + post.likes, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon;
                const count = category.id === 'all' 
                  ? posts.length 
                  : posts.filter(p => p.category === category.id).length;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors ${
                      activeCategory === category.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* New Post Form */}
          {showNewPostForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Post</CardTitle>
                <CardDescription>Share your thoughts with the community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={newPost.category} onValueChange={(value) => setNewPost({...newPost, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Discussion</SelectItem>
                    <SelectItem value="tips">Tips & Tricks</SelectItem>
                    <SelectItem value="earnings">Earnings</SelectItem>
                    <SelectItem value="technical">Technical Help</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Post title"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                />

                <Textarea
                  placeholder="What's on your mind?"
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  rows={4}
                />

                <Input
                  placeholder="Tags (comma separated)"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
                />

                <div className="flex items-center space-x-2">
                  <Button onClick={handleCreatePost}>
                    Create Post
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewPostForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts List or Post Detail */}
          {selectedPost ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => setSelectedPost(null)}>
                    ← Back to Posts
                  </Button>
                  <div className="flex items-center space-x-2">
                    {selectedPost.isPinned && <Pin className="h-4 w-4 text-blue-600" />}
                    {selectedPost.isLocked && <Lock className="h-4 w-4 text-gray-600" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Post Content */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={selectedPost.authorAvatar} />
                      <AvatarFallback>{selectedPost.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">{selectedPost.title}</h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                        <span>by {selectedPost.authorName}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(selectedPost.createdAt)}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{selectedPost.likes}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Reply className="h-4 w-4" />
                            <span>{selectedPost.replies}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{selectedPost.views}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedPost.content}</p>
                  </div>
                  
                  {selectedPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedPost.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Hash className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Replies */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Replies ({replies.length})</h3>
                  
                  {/* Reply Form */}
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Write a reply..."
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleCreateReply} disabled={!newReply.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Post Reply
                    </Button>
                  </div>

                  <Separator />

                  {/* Replies List */}
                  <div className="space-y-4">
                    {replies.map((reply) => (
                      <div key={reply.id} className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reply.authorAvatar} />
                          <AvatarFallback>{reply.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{reply.authorName}</span>
                              <span className="text-xs text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-blue-600">
                              <ThumbsUp className="h-3 w-3" />
                              <span>{reply.likes}</span>
                            </button>
                            <button 
                              className="hover:text-blue-600"
                              onClick={() => setReplyingTo(reply.id)}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Posts List */
            <div className="space-y-4">
              {filteredPosts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No posts found in this category</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPosts.map((post) => {
                  const CategoryIcon = getCategoryIcon(post.category);
                  return (
                    <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelectPost(post)}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarImage src={post.authorAvatar} />
                            <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              {post.isPinned && <Pin className="h-4 w-4 text-blue-600" />}
                              {post.isLocked && <Lock className="h-4 w-4 text-gray-600" />}
                              <CategoryIcon className="h-4 w-4 text-gray-500" />
                              <Badge variant="outline" className="text-xs">
                                {post.category}
                              </Badge>
                            </div>
                            
                            <h3 className="font-semibold text-lg hover:text-blue-600">{post.title}</h3>
                            <p className="text-gray-600 text-sm line-clamp-2">{post.content}</p>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center space-x-4">
                                <span>by {post.authorName}</span>
                                <span>•</span>
                                <span>{formatTimeAgo(post.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center space-x-1">
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>{post.likes}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Reply className="h-4 w-4" />
                                  <span>{post.replies}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{post.views}</span>
                                </span>
                              </div>
                            </div>
                            
                            {post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {post.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {post.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{post.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}