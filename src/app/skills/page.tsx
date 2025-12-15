
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { initiateSplitPayment } from '@/services/payment';

export default function SkillsPage() {
  const [status, setStatus] = useState<string | null>(null);

  const skills = [
    {
      id: 'mpesa-integration',
      title: 'Mastering M-Pesa Integration',
      description: 'Learn how to integrate M-Pesa payments with automatic tax splitting using Flutterwave.',
      price: 5000,
      currency: 'KES',
      category: 'Payment Integration'
    },
    {
      id: 'ai-jules',
      title: 'Building with Jules AI',
      description: 'Learn how to leverage Jules (Genkit) to add AI capabilities to your web applications.',
      price: 3500,
      currency: 'KES',
      category: 'Artificial Intelligence'
    },
    {
      id: 'nextjs-firebase',
      title: 'Fullstack Next.js + Firebase',
      description: 'Zero to Hero: Build scalable apps hosted on Firebase with Next.js.',
      price: 4000,
      currency: 'KES',
      category: 'Web Development'
    }
  ];

  const handleEnroll = async (skill: any) => {
    setStatus(`Processing payment for ${skill.title}...`);
    try {
      // In a real app, this would be triggered by a form submission with user details
      const result = await initiateSplitPayment({
        userEmail: 'student@example.com', // Mock user
        amount: skill.price,
        currency: skill.currency as any,
        paymentOption: 'mpesa',
        phoneNumber: '0712345678' // Mock phone
      });

      if (result.success) {
        setStatus(`Success! Payment initiated. Tax split calculated. (Check console for payload)`);
        console.log("Gateway Response:", result);
      }
    } catch (error) {
      console.error(error);
      setStatus('Payment failed.');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4">Upgrade Your Skills</h1>
        <p className="text-xl text-gray-600">Practical courses to help you build better businesses.</p>
      </header>

      {status && (
        <div className="mb-8 p-4 bg-blue-100 text-blue-800 rounded-md text-center font-semibold">
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <div key={skill.id} className="border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow bg-white flex flex-col">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
              {skill.category}
            </div>
            <h2 className="text-2xl font-bold mb-3">{skill.title}</h2>
            <p className="text-gray-700 mb-4 flex-grow">{skill.description}</p>
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="text-lg font-bold text-green-700">
                {skill.currency} {skill.price.toLocaleString()}
              </span>
              <button
                onClick={() => handleEnroll(skill)}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 active:scale-95 transition-transform"
              >
                Enroll Now
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-gray-100 p-8 rounded-xl text-center">
        <h3 className="text-2xl font-bold mb-4">Not sure where to start?</h3>
        <p className="mb-6">Ask our AI Assistant, Jules, for a personalized learning path.</p>
        <Link href="/ai-tutor" className="text-blue-600 font-semibold hover:underline">
          Chat with Jules &rarr;
        </Link>
      </div>
    </div>
  );
}
