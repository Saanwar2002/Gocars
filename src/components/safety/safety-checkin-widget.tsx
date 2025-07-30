'use client';

import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    Clock,
    MessageSquare,
    AlertTriangle,
    Shield,
    Phone,
    MapPin,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { rideMonitoringService } from '@/services/rideMonitoringService';

interface SafetyCheckInWidgetProps {
    rideId: string;
    userId: string;
    isVisible: boolean;
    onCheckInComplete?: (isOk: boolean, message?: string) => void;
    onEmergencyTriggered?: () => void;
    onDismiss?: () => void;
}

interface CheckInPrompt {
    id: string;
    type: 'scheduled' | 'triggered' | 'manual';
    message: string;
    urgency: 'low' | 'medium' | 'high';
    timeoutSeconds: number;
    showEmergencyOption: boolean;
}

export function SafetyCheckInWidget({
    rideId,
    userId,
    isVisible,
    onCheckInComplete,
    onEmergencyTriggered,
    onDismiss
}: SafetyCheckInWidgetProps) {
    const [currentPrompt, setCurrentPrompt] = useState<CheckInPrompt | null>(null);
    const [userMessage, setUserMessage] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [showMessageDialog, setShowMessageDialog] = useState(false);
    const [isResponding, setIsResponding] = useState(false);

    useEffect(() => {
        if (isVisible) {
            // Generate appropriate check-in prompt
            const prompt = generateCheckInPrompt();
            setCurrentPrompt(prompt);
            setTimeRemaining(prompt.timeoutSeconds);

            // Start countdown timer
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        // Auto-respond as "not OK" if no response
                        handleCheckInResponse(false, 'No response - automatic alert');
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isVisible]);

    const generateCheckInPrompt = (): CheckInPrompt => {
        // In a real implementation, this would be based on ride context, alerts, etc.
        const prompts = [
            {
                id: 'routine',
                type: 'scheduled' as const,
                message: 'How are you doing? Just checking in to make sure everything is going well with your ride.',
                urgency: 'low' as const,
                timeoutSeconds: 60,
                showEmergencyOption: true
            },
            {
                id: 'route_deviation',
                type: 'triggered' as const,
                message: 'We noticed your ride has taken a different route than planned. Are you okay?',
                urgency: 'medium' as const,
                timeoutSeconds: 45,
                showEmergencyOption: true
            },
            {
                id: 'speed_alert',
                type: 'triggered' as const,
                message: 'We detected some concerning driving behavior. Are you feeling safe in the vehicle?',
                urgency: 'high' as const,
                timeoutSeconds: 30,
                showEmergencyOption: true
            }
        ];

        // For demo, return a random prompt
        return prompts[Math.floor(Math.random() * prompts.length)];
    };

    const handleCheckInResponse = async (isOk: boolean, message?: string) => {
        if (isResponding) return;

        setIsResponding(true);

        try {
            const success = await rideMonitoringService.performManualCheckIn(rideId, isOk, message);

            if (success) {
                onCheckInComplete?.(isOk, message);

                if (!isOk && currentPrompt?.urgency === 'high') {
                    // For high urgency situations with "not OK" response, consider emergency
                    setTimeout(() => {
                        if (confirm('Would you like us to contact emergency services?')) {
                            onEmergencyTriggered?.();
                        }
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Error responding to check-in:', error);
        } finally {
            setIsResponding(false);
        }
    };

    const handleQuickResponse = (isOk: boolean) => {
        if (isOk) {
            handleCheckInResponse(true, 'Everything is fine');
        } else {
            setShowMessageDialog(true);
        }
    };

    const handleMessageSubmit = () => {
        handleCheckInResponse(false, userMessage || 'Need assistance');
        setShowMessageDialog(false);
        setUserMessage('');
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'high': return 'border-red-500 bg-red-50';
            case 'medium': return 'border-orange-500 bg-orange-50';
            default: return 'border-blue-500 bg-blue-50';
        }
    };

    const getUrgencyBadgeColor = (urgency: string) => {
        switch (urgency) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-orange-100 text-orange-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    if (!isVisible || !currentPrompt) {
        return null;
    }

    return (
        <>
            {/* Main Check-in Widget */}
            <Card className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 shadow-2xl border-2 ${getUrgencyColor(currentPrompt.urgency)}`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                            <Shield className="h-5 w-5 mr-2 text-blue-600" />
                            Safety Check-in
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <Badge className={getUrgencyBadgeColor(currentPrompt.urgency)}>
                                {currentPrompt.urgency.toUpperCase()}
                            </Badge>
                            {onDismiss && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onDismiss}
                                    className="h-6 w-6 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm">{currentPrompt.message}</p>
                    </div>

                    {/* Countdown Timer */}
                    <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Responds in {timeRemaining}s</span>
                        </div>
                    </div>

                    {/* Quick Response Buttons */}
                    <div className="flex space-x-2">
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleQuickResponse(true)}
                            disabled={isResponding}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            I'm OK
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleQuickResponse(false)}
                            disabled={isResponding}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Need Help
                        </Button>
                    </div>

                    {/* Additional Actions */}
                    <div className="flex space-x-2 pt-2 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setShowMessageDialog(true)}
                        >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Add Message
                        </Button>

                        {currentPrompt.showEmergencyOption && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-red-600 hover:text-red-700"
                                onClick={onEmergencyTriggered}
                            >
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Emergency
                            </Button>
                        )}
                    </div>

                    {/* Contact Options */}
                    <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground pt-2 border-t">
                        <button className="flex items-center hover:text-primary">
                            <Phone className="h-3 w-3 mr-1" />
                            Call Driver
                        </button>
                        <button className="flex items-center hover:text-primary">
                            <MapPin className="h-3 w-3 mr-1" />
                            Share Location
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Message Dialog */}
            <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-orange-600">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Tell us what's wrong
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Please describe what's happening so we can provide the best assistance.
                        </p>

                        <Textarea
                            placeholder="Describe the situation..."
                            value={userMessage}
                            onChange={(e) => setUserMessage(e.target.value)}
                            rows={4}
                        />

                        {/* Quick Message Options */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Quick options:</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    'Driver behavior concern',
                                    'Vehicle issue',
                                    'Route problem',
                                    'Feel unsafe',
                                    'Medical issue',
                                    'Other emergency'
                                ].map((option) => (
                                    <Button
                                        key={option}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setUserMessage(option)}
                                        className="text-xs"
                                    >
                                        {option}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex space-x-2 pt-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowMessageDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-orange-600 hover:bg-orange-700"
                                onClick={handleMessageSubmit}
                                disabled={isResponding}
                            >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Send Alert
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}