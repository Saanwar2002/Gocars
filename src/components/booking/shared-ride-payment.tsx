'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign, 
  CreditCard, 
  Users, 
  Calculator, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Percent,
  Receipt,
  Wallet,
  ArrowRight,
  Info
} from 'lucide-react'

interface SharedRidePaymentProps {
  rideId: string
  totalFare: number
  passengers: Array<{
    id: string
    name: string
    avatar?: string
    distance: number
    timeInVehicle: number
    pickupOrder: number
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
    paymentMethod?: string
  }>
  onProcessPayment?: (paymentDetails: PaymentDetails) => void
  onSplitMethodChange?: (method: SplitMethod, customSplits?: CustomSplit[]) => void
}

export interface PaymentDetails {
  rideId: string
  passengerId: string
  amount: number
  paymentMethod: string
  splitMethod: SplitMethod
}

export interface CustomSplit {
  passengerId: string
  amount: number
  percentage: number
}

export type SplitMethod = 'equal' | 'distance' | 'time' | 'pickup_order' | 'custom'

export default function SharedRidePayment({
  rideId,
  totalFare,
  passengers,
  onProcessPayment,
  onSplitMethodChange
}: SharedRidePaymentProps) {
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal')
  const [customSplits, setCustomSplits] = useState<CustomSplit[]>([])
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [processing, setProcessing] = useState(false)
  const [splits, setSplits] = useState<Record<string, number>>({})

  // Calculate splits based on method
  useEffect(() => {
    const newSplits = calculateSplits(splitMethod, passengers, totalFare, customSplits)
    setSplits(newSplits)
    onSplitMethodChange?.(splitMethod, customSplits)
  }, [splitMethod, passengers, totalFare, customSplits])

  const calculateSplits = (
    method: SplitMethod,
    passengers: any[],
    total: number,
    custom?: CustomSplit[]
  ): Record<string, number> => {
    const result: Record<string, number> = {}

    switch (method) {
      case 'equal':
        const equalAmount = total / passengers.length
        passengers.forEach(p => {
          result[p.id] = equalAmount
        })
        break

      case 'distance':
        const totalDistance = passengers.reduce((sum, p) => sum + p.distance, 0)
        passengers.forEach(p => {
          result[p.id] = (p.distance / totalDistance) * total
        })
        break

      case 'time':
        const totalTime = passengers.reduce((sum, p) => sum + p.timeInVehicle, 0)
        passengers.forEach(p => {
          result[p.id] = (p.timeInVehicle / totalTime) * total
        })
        break

      case 'pickup_order':
        // Earlier pickups pay slightly more (base fare distribution)
        const baseFare = total * 0.3 // 30% as base fare
        const distanceFare = total * 0.7 // 70% based on distance
        const basePerPassenger = baseFare / passengers.length
        
        const totalDistance = passengers.reduce((sum, p) => sum + p.distance, 0)
        passengers.forEach(p => {
          const distanceShare = (p.distance / totalDistance) * distanceFare
          const pickupMultiplier = 1 + (p.pickupOrder - 1) * 0.1 // 10% increase per pickup order
          result[p.id] = basePerPassenger * pickupMultiplier + distanceShare
        })
        break

      case 'custom':
        if (custom && custom.length > 0) {
          custom.forEach(split => {
            result[split.passengerId] = split.amount
          })
        } else {
          // Fallback to equal split
          const fallbackAmount = total / passengers.length
          passengers.forEach(p => {
            result[p.id] = fallbackAmount
          })
        }
        break

      default:
        passengers.forEach(p => {
          result[p.id] = total / passengers.length
        })
    }

    return result
  }

  const handleCustomSplitChange = (passengerId: string, amount: number) => {
    const newCustomSplits = [...customSplits]
    const existingIndex = newCustomSplits.findIndex(s => s.passengerId === passengerId)
    
    if (existingIndex >= 0) {
      newCustomSplits[existingIndex] = {
        passengerId,
        amount,
        percentage: (amount / totalFare) * 100
      }
    } else {
      newCustomSplits.push({
        passengerId,
        amount,
        percentage: (amount / totalFare) * 100
      })
    }
    
    setCustomSplits(newCustomSplits)
  }

  const handleProcessPayment = async (passengerId: string) => {
    setProcessing(true)
    try {
      const paymentDetails: PaymentDetails = {
        rideId,
        passengerId,
        amount: splits[passengerId],
        paymentMethod,
        splitMethod
      }
      
      await onProcessPayment?.(paymentDetails)
    } catch (error) {
      console.error('Payment processing failed:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'refunded': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'failed': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const totalPaid = passengers
    .filter(p => p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + splits[p.id], 0)

  const paymentProgress = (totalPaid / totalFare) * 100

  const customSplitTotal = customSplits.reduce((sum, split) => sum + split.amount, 0)
  const customSplitValid = Math.abs(customSplitTotal - totalFare) < 0.01

  return (
    <div className="space-y-6">
      {/* Payment Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Summary
            </CardTitle>
            <Badge variant="outline" className="flex items-center gap-1">
              <Receipt className="h-3 w-3" />
              Ride #{rideId.slice(-6)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total Fare</span>
              <span>£{totalFare.toFixed(2)}</span>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Payment Progress</span>
                <span className="text-sm text-gray-600">
                  £{totalPaid.toFixed(2)} / £{totalFare.toFixed(2)}
                </span>
              </div>
              <Progress value={paymentProgress} className="h-2" />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-gray-500" />
              <span>{passengers.length} passengers sharing the cost</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Split Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cost Splitting Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">How should the cost be split?</Label>
            <Select value={splitMethod} onValueChange={(value: SplitMethod) => setSplitMethod(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Equal Split - Everyone pays the same</SelectItem>
                <SelectItem value="distance">By Distance - Pay based on distance traveled</SelectItem>
                <SelectItem value="time">By Time - Pay based on time in vehicle</SelectItem>
                <SelectItem value="pickup_order">By Pickup Order - Earlier pickups pay slightly more</SelectItem>
                <SelectItem value="custom">Custom Split - Set individual amounts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Split Method Info */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                {splitMethod === 'equal' && (
                  <p className="text-blue-700">Each passenger pays exactly £{(totalFare / passengers.length).toFixed(2)}</p>
                )}
                {splitMethod === 'distance' && (
                  <p className="text-blue-700">Cost is split proportionally based on the distance each passenger travels</p>
                )}
                {splitMethod === 'time' && (
                  <p className="text-blue-700">Cost is split based on how long each passenger is in the vehicle</p>
                )}
                {splitMethod === 'pickup_order' && (
                  <p className="text-blue-700">Passengers picked up earlier pay a slightly higher share of the base fare</p>
                )}
                {splitMethod === 'custom' && (
                  <p className="text-blue-700">Set custom amounts for each passenger. Total must equal £{totalFare.toFixed(2)}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passenger Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Passenger Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {passengers.map((passenger) => (
              <div key={passenger.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={passenger.avatar} />
                      <AvatarFallback>
                        {passenger.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{passenger.name}</div>
                      <div className="text-sm text-gray-600">
                        {passenger.distance}km • {passenger.timeInVehicle}min • Pickup #{passenger.pickupOrder}
                      </div>
                    </div>
                  </div>
                  <Badge className={getPaymentStatusColor(passenger.paymentStatus)}>
                    {getPaymentStatusIcon(passenger.paymentStatus)}
                    <span className="ml-1 capitalize">{passenger.paymentStatus}</span>
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {splitMethod === 'custom' ? (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Amount:</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={totalFare}
                          value={splits[passenger.id]?.toFixed(2) || '0.00'}
                          onChange={(e) => handleCustomSplitChange(passenger.id, parseFloat(e.target.value) || 0)}
                          className="w-20 h-8"
                        />
                        <span className="text-sm text-gray-600">
                          ({((splits[passenger.id] / totalFare) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ) : (
                      <div className="text-lg font-semibold">
                        £{splits[passenger.id]?.toFixed(2) || '0.00'}
                      </div>
                    )}
                  </div>

                  {passenger.paymentStatus === 'pending' && (
                    <Button
                      onClick={() => handleProcessPayment(passenger.id)}
                      disabled={processing || (splitMethod === 'custom' && !customSplitValid)}
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Pay Now
                    </Button>
                  )}

                  {passenger.paymentStatus === 'paid' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Paid</span>
                    </div>
                  )}

                  {passenger.paymentStatus === 'failed' && (
                    <Button
                      variant="destructive"
                      onClick={() => handleProcessPayment(passenger.id)}
                      disabled={processing}
                      className="flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Retry Payment
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Split Validation */}
          {splitMethod === 'custom' && (
            <div className="mt-4 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Custom Split:</span>
                <span className={`text-sm font-medium ${customSplitValid ? 'text-green-600' : 'text-red-600'}`}>
                  £{customSplitTotal.toFixed(2)}
                </span>
              </div>
              {!customSplitValid && (
                <p className="text-sm text-red-600 mt-1">
                  Total must equal £{totalFare.toFixed(2)} (difference: £{Math.abs(customSplitTotal - totalFare).toFixed(2)})
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">Credit/Debit Card</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="apple_pay">Apple Pay</SelectItem>
              <SelectItem value="google_pay">Google Pay</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Base fare</span>
              <span>£3.50</span>
            </div>
            <div className="flex justify-between">
              <span>Distance charges</span>
              <span>£{(totalFare - 3.50).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Shared ride discount</span>
              <span>-£{(totalFare * 0.15).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium text-lg">
              <span>Total</span>
              <span>£{totalFare.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-600">
              You saved £{(totalFare * 0.15).toFixed(2)} by sharing this ride!
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Summary */}
      <Card className="border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">
                {passengers.filter(p => p.paymentStatus === 'paid').length} of {passengers.length} payments completed
              </span>
            </div>
            <div className="text-right">
              <div className="font-medium">£{totalPaid.toFixed(2)} collected</div>
              <div className="text-sm text-gray-600">
                £{(totalFare - totalPaid).toFixed(2)} remaining
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}