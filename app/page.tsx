'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { JoinModal } from './JoinModal';

export default function HomePage() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#070e1a', 
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Navbar */}
      <header style={{
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(0, 255, 128, 0.2)'
      }}>
        <div style={{ 
          color: '#00FF80', 
          fontWeight: 'bold', 
          fontSize: '24px', 
          fontFamily: "'Orbitron', sans-serif" 
        }}>
          BlockSwarms
        </div>
        <Link 
          href="/login" 
          style={{
            color: '#00FF80',
            border: '1px solid rgba(0, 255, 128, 0.3)',
            padding: '8px 16px',
            borderRadius: '4px',
            textDecoration: 'none',
            fontFamily: "'Orbitron', sans-serif"
          }}
        >
          Login
        </Link>
      </header>

      {/* Hero Section */}
      <section style={{ 
        padding: '100px 20px', 
        textAlign: 'center', 
        maxWidth: '1200px', 
        margin: '0 auto' 
      }}>
        <h1 style={{ 
          color: '#00FF80', 
          fontSize: '48px', 
          marginBottom: '24px',
          fontFamily: "'Orbitron', sans-serif"
        }}>
          AI-Powered <span style={{ color: 'white' }}>Solana</span> Trading
        </h1>
        <p style={{ 
          color: 'rgba(0, 255, 128, 0.8)', 
          fontSize: '18px', 
          maxWidth: '600px', 
          margin: '0 auto 40px' 
        }}>
          Harness the power of advanced AI to analyze Solana tokens, predict market movements,
          and optimize your trading strategies.
        </p>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px', 
          maxWidth: '400px', 
          margin: '0 auto' 
        }}>
          <Link 
            href="/dashboard" 
            style={{
              backgroundColor: '#00FF80',
              color: '#070e1a',
              padding: '16px 32px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 'bold',
              display: 'block',
              textAlign: 'center',
              fontFamily: "'Orbitron', sans-serif"
            }}
          >
            ENTER PLATFORM
          </Link>
          <button
            onClick={() => setIsJoinModalOpen(true)}
            style={{
              backgroundColor: 'transparent',
              border: '2px solid #00FF80',
              color: '#00FF80',
              padding: '16px 32px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: "'Orbitron', sans-serif"
            }}
          >
            JOIN THE SWARM
          </button>
        </div>
      </section>

      {/* Features section */}
      <section style={{ 
        padding: '80px 20px', 
        backgroundColor: 'rgba(14, 23, 41, 0.5)',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h2 style={{ 
          color: '#00FF80', 
          textAlign: 'center', 
          fontSize: '32px', 
          marginBottom: '60px',
          fontFamily: "'Orbitron', sans-serif"
        }}>
          POWERED BY AI, DESIGNED FOR TRADERS
        </h2>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '32px'
        }}>
          {[
            {
              title: 'Token Analysis',
              description: 'Get in-depth analysis on any token with price predictions, technical indicators, and sentiment analysis.',
            },
            {
              title: 'Market Sentiment',
              description: 'Track real-time sentiment across social platforms and news sources to anticipate market movements.',
            },
            {
              title: 'Portfolio Management',
              description: 'Monitor your holdings and get AI-powered suggestions for optimizing your crypto portfolio.',
            },
            {
              title: 'Trading Signals',
              description: 'Receive precise buy, sell, and hold signals with entry and exit points based on multiple time frames.',
            },
            {
              title: 'Customizable AI',
              description: 'Configure which AI models and tools to use based on your preferences and trading style.',
            },
            {
              title: 'AI Chat',
              description: 'Chat directly with specialized AI models for token analysis, market insights, and trading recommendations.',
            },
          ].map((feature, index) => (
            <div 
              key={index} 
              style={{
                backgroundColor: 'rgba(7, 14, 26, 0.7)',
                border: '1px solid rgba(0, 255, 128, 0.2)',
                borderRadius: '8px',
                padding: '24px'
              }}
            >
              <h3 style={{ 
                color: '#00FF80', 
                fontSize: '20px', 
                marginBottom: '16px',
                fontFamily: "'Orbitron', sans-serif"
              }}>
                {feature.title}
              </h3>
              <p style={{ color: 'rgba(0, 255, 128, 0.7)' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        padding: '80px 20px', 
        background: 'linear-gradient(to bottom right, #0e1729, #070e1a)',
        textAlign: 'center'
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          backgroundColor: 'rgba(7, 14, 26, 0.7)',
          border: '1px solid rgba(0, 255, 128, 0.3)',
          borderRadius: '12px',
          padding: '32px'
        }}>
          <h2 style={{ 
            color: '#00FF80', 
            fontSize: '32px', 
            marginBottom: '24px',
            fontFamily: "'Orbitron', sans-serif"
          }}>
            JOIN THE NEXT GENERATION OF SOLANA TRADERS
          </h2>
          <p style={{ 
            color: 'rgba(0, 255, 128, 0.8)', 
            fontSize: '18px', 
            marginBottom: '32px' 
          }}>
            Whether you're a beginner or an experienced trader, BlockSwarms' AI-powered insights
            will elevate your Solana trading strategy.
          </p>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            maxWidth: '400px', 
            margin: '0 auto' 
          }}>
            <Link 
              href="/dashboard" 
              style={{
                backgroundColor: '#00FF80',
                color: '#070e1a',
                padding: '16px 32px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'block',
                textAlign: 'center',
                fontFamily: "'Orbitron', sans-serif"
              }}
            >
              ENTER PLATFORM
            </Link>
            <button
              onClick={() => setIsJoinModalOpen(true)}
              style={{
                backgroundColor: 'transparent',
                border: '2px solid #00FF80',
                color: '#00FF80',
                padding: '16px 32px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: "'Orbitron', sans-serif"
              }}
            >
              JOIN THE SWARM
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: 'rgba(7, 14, 26, 0.9)',
        borderTop: '1px solid rgba(0, 255, 128, 0.2)',
        padding: '48px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '32px',
            marginBottom: '32px'
          }}>
            <div>
              <h3 style={{ 
                color: '#00FF80', 
                marginBottom: '16px',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '18px'
              }}>
                BlockSwarms
              </h3>
              <p style={{ color: 'rgba(0, 255, 128, 0.7)', fontSize: '14px' }}>
                AI-powered Solana trading platform with real-time insights and market analysis.
              </p>
            </div>
            
            <div>
              <h4 style={{ 
                color: '#00FF80', 
                marginBottom: '16px',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '14px'
              }}>
                FEATURES
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <a href="#" style={{ color: 'rgba(0, 255, 128, 0.7)', textDecoration: 'none', fontSize: '14px' }}>
                    Token Analysis
                  </a>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <a href="#" style={{ color: 'rgba(0, 255, 128, 0.7)', textDecoration: 'none', fontSize: '14px' }}>
                    Market Sentiment
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ 
                color: '#00FF80', 
                marginBottom: '16px',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '14px'
              }}>
                RESOURCES
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <a href="#" style={{ color: 'rgba(0, 255, 128, 0.7)', textDecoration: 'none', fontSize: '14px' }}>
                    Documentation
                  </a>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <a href="#" style={{ color: 'rgba(0, 255, 128, 0.7)', textDecoration: 'none', fontSize: '14px' }}>
                    API Reference
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div style={{ 
            borderTop: '1px solid rgba(0, 255, 128, 0.2)', 
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'column'
          }}>
            <p style={{ color: 'rgba(0, 255, 128, 0.5)', fontSize: '14px', marginBottom: '16px' }}>
              © 2025 BlockSwarms. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Join Modal */}
      {isJoinModalOpen && <JoinModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />}
    </div>
  );
}