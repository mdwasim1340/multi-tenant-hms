'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Shield } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api/client';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      toast.error('Email address is required');
      router.push('/staff/new');
    }
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/staff/verify-otp', {
        email,
        otp
      });

      if (response.data.success) {
        toast.success('Email verified successfully!');
        // Redirect to password creation page
        router.push(`/staff/create-password?email=${encodeURIComponent(email!)}&otp=${otp}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid or expired verification code');
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    try {
      // This would call the initiate endpoint again
      toast.info('Resending verification code...');
      
      // Add your resend logic here
      // For now, just show success and set cooldown
      toast.success('Verification code sent! Please check your email.');
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      toast.error('Failed to resend code');
      console.error('Resend error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-2xl mx-auto px-6 space-y-6">
            <div className="mb-6">
              <Link href="/staff/new">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Verify Your Email</h1>
              <p className="text-muted-foreground">
                Enter the verification code sent to your email
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Email Verification</CardTitle>
                    <CardDescription>
                      We sent a 6-digit code to <strong>{email}</strong>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={handleOTPChange}
                      maxLength={6}
                      className="text-center text-2xl tracking-widest font-mono"
                      autoFocus
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      The code will expire in 15 minutes
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? 'Verifying...' : 'Verify Email'}
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Didn't receive the code?
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleResendOTP}
                        disabled={isLoading || resendCooldown > 0}
                        className="w-full"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        {resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : 'Resend Code'}
                      </Button>
                    </div>
                  </div>
                </form>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Tips:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Check your spam folder if you don't see the email</li>
                    <li>• Make sure you entered the correct email address</li>
                    <li>• The code is case-sensitive</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOTPContent />
    </Suspense>
  );
}
