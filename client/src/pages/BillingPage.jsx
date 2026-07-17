import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { billingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CreditCard, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const BillingPage = () => {
  const { business, fetchProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const isActive = business?.subscriptionStatus === 'active';

  useEffect(() => {
    const handleMockSuccess = async () => {
      const mockSuccess = searchParams.get('mock_success');
      if (mockSuccess) {
        try {
          await billingAPI.mockSuccess();
          await fetchProfile(); // Refresh business state
          toast.success('Subscription activated successfully! (Mock)');
          searchParams.delete('mock_success');
          setSearchParams(searchParams);
        } catch (error) {
          toast.error('Mock activation failed');
        }
      }
    };

    const checkStatus = async () => {
      if (searchParams.get('success')) {
        toast.success('Subscription activated successfully!');
        await fetchProfile();
        searchParams.delete('success');
        setSearchParams(searchParams);
      }
      if (searchParams.get('canceled')) {
        toast.error('Checkout was canceled.');
        searchParams.delete('canceled');
        setSearchParams(searchParams);
      }
    };

    handleMockSuccess();
    checkStatus();
  }, [searchParams, fetchProfile, setSearchParams]);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const { data } = await billingAPI.createCheckoutSession();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start checkout');
      setLoading(false);
    }
  };

  const handleManage = async () => {
    try {
      setLoading(true);
      const { data } = await billingAPI.createPortalSession();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to open portal');
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-400" />
            Billing & Subscription
          </h1>
          <p className="page-subtitle">Manage your SaaS Analytics plan</p>
        </div>
      </div>

      <div className="max-w-3xl mt-6">
        <div className="chart-card">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <span className="status-badge status-active flex items-center gap-1.5 px-3 py-1 text-sm">
                      <CheckCircle className="w-4 h-4" /> Active Subscription
                    </span>
                  ) : (
                    <span className="status-badge status-trial flex items-center gap-1.5 px-3 py-1 text-sm bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <AlertCircle className="w-4 h-4" /> 14-Day Free Trial
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {isActive ? '₹1,999' : '₹0'}
                  <span className="text-sm font-normal text-slate-400">/month</span>
                </p>
              </div>
            </div>

            <div className="border-t border-slate-700/50 pt-8 mb-8">
              <h3 className="font-semibold mb-4 text-slate-200">Plan Includes:</h3>
              <ul className="space-y-3">
                {['Unlimited product inventory management', 'Real-time sales tracking & analytics', 'Automated low stock email alerts', 'Financial PDF report generation', 'Premium email support'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4">
              {!isActive ? (
                <button 
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base flex justify-center"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Upgrade to Premium'}
                </button>
              ) : (
                <button 
                  onClick={handleManage}
                  disabled={loading}
                  className="btn-secondary w-full py-3 text-base flex justify-center"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Manage Subscription'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
