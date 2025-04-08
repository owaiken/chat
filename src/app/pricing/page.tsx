import React from 'react';
import { auth } from '@clerk/nextjs';
import Link from 'next/link';

export default function PricingPage() {
  const { userId } = auth();

  const plans = [
    {
      name: 'Standard',
      price: '$5',
      period: 'per month',
      features: [
        'Access to basic models',
        '100 messages per day',
        'Basic Python script templates',
        'Community support',
      ],
      priceId: process.env.STANDARD_PLAN_ID,
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$50',
      period: 'per month',
      features: [
        'Access to advanced models',
        '1,000 messages per day',
        'Advanced Python script templates',
        'Priority support',
        'Custom chat history retention',
      ],
      priceId: process.env.PRO_PLAN_ID,
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: '$500',
      period: 'per month',
      features: [
        'Access to all models',
        'Unlimited messages',
        'Custom Python scripts',
        'Dedicated support',
        'Advanced analytics',
        'Custom integrations',
      ],
      priceId: process.env.ENTERPRISE_PLAN_ID,
      highlighted: false,
    },
  ];

  const handleSubscribe = async (priceId: string | undefined) => {
    if (!priceId) return;

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg shadow-lg overflow-hidden ${
                plan.highlighted
                  ? 'ring-2 ring-indigo-600 relative'
                  : 'border border-gray-200'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 inset-x-0 transform translate-y-px">
                  <div className="flex justify-center transform -translate-y-1/2">
                    <span className="inline-flex rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold tracking-wider uppercase text-white">
                      Most Popular
                    </span>
                  </div>
                </div>
              )}
              <div className="bg-white p-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-medium text-gray-900">
                    {plan.name}
                  </h2>
                </div>
                <p className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-5xl font-extrabold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="ml-1 text-xl font-medium">{plan.period}</span>
                </p>
                <p className="mt-6 text-gray-500">
                  Everything you need to get started with {plan.name}.
                </p>

                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex">
                      <svg
                        className="flex-shrink-0 h-6 w-6 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="ml-3 text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-50 px-6 py-8 sm:px-10">
                {userId ? (
                  <button
                    onClick={() => handleSubscribe(plan.priceId)}
                    className={`w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md ${
                      plan.highlighted
                        ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                        : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                    }`}
                  >
                    Subscribe to {plan.name}
                  </button>
                ) : (
                  <Link
                    href="/sign-in"
                    className={`w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md ${
                      plan.highlighted
                        ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                        : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                    }`}
                  >
                    Sign in to subscribe
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
