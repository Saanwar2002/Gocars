
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    MessageCircle,
    HelpCircle,
    Users,
    MessageSquare,
    Award,
    Gift,
    Plus,
    Search,
    Filter,
    Star,
    Clock,
    CheckCircle,
    AlertCircle,
    ThumbsUp,
    Send,
    Pin,
    Lock,
    Eye,
    Reply,
    TrendingUp,
    Calendar,
    Target
} from 'lucide-react';
import { driverSupportService, SupportTicket, ForumPost, DriverFeedback, DriverAchievement, DriverReward } from '@/services/driverSupportService';
import { useToast } from '@/hooks/use-toast';

interface DriverSupportDashboardProps {
    driverId: string;
    driverName: string;
    driverAvatar?: string;
}

export function DriverSupportDashboard({ driverId, driverName, driverAvatar }: DriverSupportDashboardProps) {
    const [activeTab, setActiveTab] = useState('support');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
    const [feedback, setFeedback] = useState<DriverFeedback[]>([]);
    const [achievements, setAchievements] = useState<DriverAchievement[]>([]);
    const [rewards, setRewards] = useState<DriverReward[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Support ticket form state
    const [newTicket, setNewTicket] = useState({
        category: '',
        priority: 'medium',
        subject: '',
        description: ''
    });

    // Forum post form state
    const [newPost, setNewPost] = useState({
        category: 'general',
        title: '',
        content: '',
        tags: ''
    });

    // Feedback form state
    const [newFeedback, setNewFeedback] = useState({
        type: 'suggestion',
        category: 'app',
        title: '',
        description: ''
    });

    useEffect(() => {
        loadData();
    }, [driverId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [ticketsData, forumData, feedbackData, achievementsData, rewardsData] = await Promise.all([
                driverSupportService.getDriverTickets(driverId),
                driverSupportService.getForumPosts(),
                driverSupportService.getDriverFeedback(driverId),
                driverSupportService.getDriverAchievements(driverId),
                driverSupportService.getDriverRewards(driverId)
            ]);

            setTickets(ticketsData);
            setForumPosts(forumData);
            setFeedback(feedbackData);
            setAchievements(achievementsData);
            setRewards(rewardsData);
        } catch (error) {
            console.error('Error loading support data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load support data. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async () => {
        if (!newTicket.category || !newTicket.subject || !newTicket.description) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields.',
                variant: 'destructive'
            });
            return;
        }

        try {
            await driverSupportService.createSupportTicket({
                driverId,
                driverName,
                category: newTicket.category as any,
                priority: newTicket.priority as any,
                status: 'open',
                subject: newTicket.subject,
                description: newTicket.description
            });

            setNewTicket({ category: '', priority: 'medium', subject: '', description: '' });
            await loadData();

            toast({
                title: 'Success',
                description: 'Support ticket created successfully. Our team will respond soon.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create support ticket. Please try again.',
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
            await loadData();

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

    const handleSubmitFeedback = async () => {
        if (!newFeedback.title || !newFeedback.description) {
            toast({
                title: 'Error',
                description: 'Please fill in title and description.',
                variant: 'destructive'
            });
            return;
        }

        try {
            await driverSupportService.submitDriverFeedback({
                driverId,
                driverName,
                type: newFeedback.type as any,
                category: newFeedback.category as any,
                title: newFeedback.title,
                description: newFeedback.description,
                priority: 'medium',
                status: 'submitted'
            });

            setNewFeedback({ type: 'suggestion', category: 'app', title: '', description: '' });
            await loadData();

            toast({
                title: 'Success',
                description: 'Feedback submitted successfully. Thank you for your input!',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to submit feedback. Please try again.',
                variant: 'destructive'
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'urgent': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
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
                    <h1 className="text-3xl font-bold text-gray-900">Driver Support Center</h1>
                    <p className="text-gray-600">Get help, connect with the community, and share feedback</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Avatar>
                        <AvatarImage src={driverAvatar} />
                        <AvatarFallback>{driverName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{driverName}</p>
                        <p className="text-sm text-gray-500">Driver</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <MessageCircle className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-gray-600">Open Tickets</p>
                                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Award className="h-5 w-5 text-yellow-600" />
                            <div>
                                <p className="text-sm text-gray-600">Achievements</p>
                                <p className="text-2xl font-bold">{achievements.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Gift className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-sm text-gray-600">Rewards</p>
                                <p className="text-2xl font-bold">{rewards.filter(r => !r.claimedAt).length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <MessageSquare className="h-5 w-5 text-purple-600" />
                            <div>
                                <p className="text-sm text-gray-600">Forum Posts</p>
                                <p className="text-2xl font-bold">{forumPosts.filter(p => p.authorId === driverId).length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="support">Support</TabsTrigger>
                    <TabsTrigger value="community">Community</TabsTrigger>
                    <TabsTrigger value="feedback">Feedback</TabsTrigger>
                    <TabsTrigger value="achievements">Achievements</TabsTrigger>
                    <TabsTrigger value="rewards">Rewards</TabsTrigger>
                </TabsList>

                {/* Support Tab */}
                <TabsContent value="support" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Create New Ticket */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Plus className="h-5 w-5" />
                                    <span>Create Support Ticket</span>
                                </CardTitle>
                                <CardDescription>
                                    Need help? Create a support ticket and our team will assist you.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="technical">Technical Issue</SelectItem>
                                        <SelectItem value="payment">Payment Issue</SelectItem>
                                        <SelectItem value="vehicle">Vehicle Issue</SelectItem>
                                        <SelectItem value="passenger">Passenger Issue</SelectItem>
                                        <SelectItem value="app">App Issue</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Input
                                    placeholder="Subject"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                />

                                <Textarea
                                    placeholder="Describe your issue in detail..."
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                    rows={4}
                                />

                                <Button onClick={handleCreateTicket} className="w-full">
                                    Create Ticket
                                </Button>
                            </CardContent>
                        </Card>

                        {/* My Tickets */}
                        <Card>
                            <CardHeader>
                                <CardTitle>My Support Tickets</CardTitle>
                                <CardDescription>
                                    Track the status of your support requests
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-96">
                                    <div className="space-y-3">
                                        {tickets.length === 0 ? (
                                            <p className="text-gray-500 text-center py-8">No support tickets yet</p>
                                        ) : (
                                            tickets.map((ticket) => (
                                                <div key={ticket.id} className="border rounded-lg p-3 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium">{ticket.subject}</h4>
                                                        <Badge className={getStatusColor(ticket.status)}>
                                                            {ticket.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                        <span className="flex items-center space-x-1">
                                                            <Clock className="h-4 w-4" />
                                                            <span>{ticket.createdAt.toDate().toLocaleDateString()}</span>
                                                        </span>
                                                        <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                                                            {ticket.priority}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Community Tab */}
                <TabsContent value="community" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Create New Post */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Plus className="h-5 w-5" />
                                    <span>New Post</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Select value={newPost.category} onValueChange={(value) => setNewPost({ ...newPost, category: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General</SelectItem>
                                        <SelectItem value="tips">Tips & Tricks</SelectItem>
                                        <SelectItem value="earnings">Earnings</SelectItem>
                                        <SelectItem value="technical">Technical</SelectItem>
                                        <SelectItem value="announcements">Announcements</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Input
                                    placeholder="Post title"
                                    value={newPost.title}
                                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                />

                                <Textarea
                                    placeholder="What's on your mind?"
                                    value={newPost.content}
                                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                    rows={4}
                                />

                                <Input
                                    placeholder="Tags (comma separated)"
                                    value={newPost.tags}
                                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                                />

                                <Button onClick={handleCreatePost} className="w-full">
                                    Create Post
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Forum Posts */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Community Forum</CardTitle>
                                <CardDescription>
                                    Connect with other drivers and share experiences
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-96">
                                    <div className="space-y-4">
                                        {forumPosts.length === 0 ? (
                                            <p className="text-gray-500 text-center py-8">No forum posts yet</p>
                                        ) : (
                                            forumPosts.map((post) => (
                                                <div key={post.id} className="border rounded-lg p-4 space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={post.authorAvatar} />
                                                                <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <h4 className="font-medium">{post.title}</h4>
                                                                <p className="text-sm text-gray-600">by {post.authorName}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            {post.isPinned && <Pin className="h-4 w-4 text-blue-600" />}
                                                            {post.isLocked && <Lock className="h-4 w-4 text-gray-600" />}
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-gray-700 line-clamp-3">{post.content}</p>

                                                    <div className="flex items-center justify-between text-sm text-gray-500">
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
                                                        <span>{post.createdAt.toDate().toLocaleDateString()}</span>
                                                    </div>

                                                    {post.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {post.tags.map((tag, index) => (
                                                                <Badge key={index} variant="secondary" className="text-xs">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Feedback Tab */}
                <TabsContent value="feedback" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Submit Feedback */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <MessageSquare className="h-5 w-5" />
                                    <span>Submit Feedback</span>
                                </CardTitle>
                                <CardDescription>
                                    Help us improve GoCars with your suggestions and feedback
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Select value={newFeedback.type} onValueChange={(value) => setNewFeedback({ ...newFeedback, type: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Feedback type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="suggestion">Suggestion</SelectItem>
                                        <SelectItem value="complaint">Complaint</SelectItem>
                                        <SelectItem value="compliment">Compliment</SelectItem>
                                        <SelectItem value="feature_request">Feature Request</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={newFeedback.category} onValueChange={(value) => setNewFeedback({ ...newFeedback, category: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="app">App</SelectItem>
                                        <SelectItem value="earnings">Earnings</SelectItem>
                                        <SelectItem value="support">Support</SelectItem>
                                        <SelectItem value="features">Features</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Input
                                    placeholder="Feedback title"
                                    value={newFeedback.title}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
                                />

                                <Textarea
                                    placeholder="Describe your feedback in detail..."
                                    value={newFeedback.description}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
                                    rows={4}
                                />

                                <Button onClick={handleSubmitFeedback} className="w-full">
                                    Submit Feedback
                                </Button>
                            </CardContent>
                        </Card>

                        {/* My Feedback */}
                        <Card>
                            <CardHeader>
                                <CardTitle>My Feedback</CardTitle>
                                <CardDescription>
                                    Track the status of your submitted feedback
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-96">
                                    <div className="space-y-3">
                                        {feedback.length === 0 ? (
                                            <p className="text-gray-500 text-center py-8">No feedback submitted yet</p>
                                        ) : (
                                            feedback.map((item) => (
                                                <div key={item.id} className="border rounded-lg p-3 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium">{item.title}</h4>
                                                        <Badge className={getStatusColor(item.status)}>
                                                            {item.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                        <span>{item.type.replace('_', ' ')}</span>
                                                        <span>•</span>
                                                        <span>{item.category}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center space-x-1">
                                                            <ThumbsUp className="h-4 w-4" />
                                                            <span>{item.votes}</span>
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                                                    {item.adminResponse && (
                                                        <div className="bg-blue-50 p-2 rounded text-sm">
                                                            <p className="font-medium text-blue-800">Admin Response:</p>
                                                            <p className="text-blue-700">{item.adminResponse}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Achievements Tab */}
                <TabsContent value="achievements" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Award className="h-5 w-5" />
                                <span>My Achievements</span>
                            </CardTitle>
                            <CardDescription>
                                Celebrate your accomplishments and milestones
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {achievements.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No achievements yet. Keep driving to unlock rewards!</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {achievements.map((achievement) => (
                                        <div key={achievement.id} className="border rounded-lg p-4 text-center space-y-3">
                                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl ${achievement.badgeColor}`}>
                                                {achievement.badgeIcon}
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{achievement.title}</h4>
                                                <p className="text-sm text-gray-600">{achievement.description}</p>
                                            </div>
                                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                                                <Star className="h-4 w-4 text-yellow-500" />
                                                <span>{achievement.points} points</span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Unlocked {achievement.unlockedAt.toDate().toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Rewards Tab */}
                <TabsContent value="rewards" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Gift className="h-5 w-5" />
                                <span>My Rewards</span>
                            </CardTitle>
                            <CardDescription>
                                Claim your earned rewards and bonuses
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {rewards.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No rewards available. Keep up the great work!</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {rewards.map((reward) => (
                                        <div key={reward.id} className={`border rounded-lg p-4 space-y-3 ${reward.claimedAt ? 'bg-gray-50' : 'bg-green-50 border-green-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium">{reward.title}</h4>
                                                {reward.claimedAt ? (
                                                    <Badge className="bg-gray-100 text-gray-800">Claimed</Badge>
                                                ) : (
                                                    <Badge className="bg-green-100 text-green-800">Available</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">{reward.description}</p>
                                            {reward.value && (
                                                <p className="text-lg font-bold text-green-600">${reward.value}</p>
                                            )}
                                            {reward.code && (
                                                <div className="bg-gray-100 p-2 rounded text-sm font-mono">
                                                    Code: {reward.code}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <span>Created {reward.createdAt.toDate().toLocaleDateString()}</span>
                                                {reward.expiresAt && (
                                                    <span>Expires {reward.expiresAt.toDate().toLocaleDateString()}</span>
                                                )}
                                            </div>
                                            {!reward.claimedAt && (
                                                <Button className="w-full" size="sm">
                                                    Claim Reward
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}